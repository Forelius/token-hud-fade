import { ABILITIES, ACTION_TYPE, GROUP, KNOWN_ACTOR_TYPES } from './constants.js'
import { Utils } from './utils.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Builds Fantastic Depths actions for Token Action HUD Core
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /** @type {object[]} Sorted actor items (avoid Core's `items` Map) */
    actorItems = []

    /**
     * @override
     * @param {string[]} groupIds
     */
    async buildSystemActions (groupIds) {
      this.actors = (!this.actor) ? this.#getActors() : [this.actor]
      this.actorType = this.actor?.type

      if (this.actorType && !KNOWN_ACTOR_TYPES.includes(this.actorType)) return

      this.showUnequippedWeapons = Utils.getSetting('showUnequippedWeapons')
      this.showUnmemorizedSpells = Utils.getSetting('showUnmemorizedSpells')
      this.groupIds = groupIds

      if (this.actor) {
        // Core's sortItemsByName returns a Map; never assign it to this.items
        this.actorItems = this.#toItemArray(
          coreModule.api.Utils.sortItemsByName(this.actor.items)
        )
        await this.#buildActorActions()
      } else if (this.actors?.length) {
        // Multi-token selection: only shared utility actions
        this.#buildUtility()
      }
    }

    /**
     * Normalize sorted items to a plain array of Item documents
     * @private
     * @param {Map|Collection|object[]|Iterable} sorted
     * @returns {object[]}
     */
    #toItemArray (sorted) {
      if (!sorted) return []
      if (Array.isArray(sorted)) return sorted
      if (sorted instanceof Map) return Array.from(sorted.values())
      if (typeof sorted.values === 'function') {
        try {
          return Array.from(sorted.values())
        } catch {
          // fall through
        }
      }
      return Array.from(sorted)
    }

    /**
     * @private
     */
    async #buildActorActions () {
      await this.#buildWeapons()
      await this.#buildSpells()
      this.#buildAbilityChecks()
      this.#buildSaves()
      this.#buildSkills()
      this.#buildSpecialAbilities()
      this.#buildInventory()
      this.#buildUtility()
    }

    /**
     * @private
     * @returns {object[]}
     */
    #getActors () {
      const actors = canvas.tokens.controlled
        .filter((token) => token.actor)
        .map((token) => token.actor)
      if (actors.every((actor) => KNOWN_ACTOR_TYPES.includes(actor?.type))) {
        return actors
      }
      return []
    }

    /**
     * @private
     * @param {object} item
     * @param {string} actionType
     * @param {object} [options]
     * @returns {object}
     */
    #makeItemAction (item, actionType, options = {}) {
      const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionType] ?? '')
      const name = options.name ?? item.knownNameGM ?? item.name
      const id = options.id ?? `${actionType}-${item.id}`
      const action = {
        id,
        name,
        img: coreModule.api.Utils.getImage(item),
        listName: actionTypeName ? `${actionTypeName}: ${name}` : name,
        system: {
          actionType,
          actionId: item.id,
          ...options.system
        }
      }
      if (options.info1) action.info1 = options.info1
      if (options.cssClass) action.cssClass = options.cssClass
      return action
    }

    /**
     * Combat: melee / missile weapons
     * @private
     */
    async #buildWeapons () {
      const weapons = this.actorItems.filter((item) => {
        if (item.type !== 'weapon') return false
        if (!this.showUnequippedWeapons && item.system.equipped !== true) return false
        return true
      })
      if (!weapons.length) return

      const meleeActions = []
      const missileActions = []

      for (const weapon of weapons) {
        const canMelee = weapon.canMelee === true || weapon.canAttack === true
        const canMissile = weapon.canShoot === true || weapon.canThrow === true ||
          weapon.system?.canRanged === true

        if (canMelee) {
          meleeActions.push(this.#makeItemAction(weapon, 'weapon', {
            id: `weapon-melee-${weapon.id}`,
            system: { attackMode: 'melee' }
          }))
        }
        if (canMissile) {
          missileActions.push(this.#makeItemAction(weapon, 'weapon', {
            id: `weapon-missile-${weapon.id}`,
            system: { attackMode: 'missile' }
          }))
        }
        // Fallback: weapon with neither flag still appears under melee
        if (!canMelee && !canMissile) {
          meleeActions.push(this.#makeItemAction(weapon, 'weapon', {
            id: `weapon-${weapon.id}`,
            system: { attackMode: 'melee' }
          }))
        }
      }

      if (meleeActions.length) this.addActions(meleeActions, GROUP.melee)
      if (missileActions.length) this.addActions(missileActions, GROUP.missile)
    }

    /**
     * Spells grouped dynamically by spell level
     * @private
     */
    async #buildSpells () {
      let spells = this.actorItems.filter((item) => item.type === 'spell')
      if (!this.showUnmemorizedSpells) {
        // Keep spells with casts remaining, infinite memorization, or no cast resource
        spells = spells.filter((spell) => {
          if (spell.system.cast === undefined) return true
          return spell.hasCast === true
        })
      }
      if (!spells.length) return

      const byLevel = new Map()
      for (const spell of spells) {
        const level = Number(spell.system.spellLevel ?? 1)
        const list = byLevel.get(level) ?? []
        list.push(spell)
        byLevel.set(level, list)
      }

      const levels = [...byLevel.keys()].sort((a, b) => a - b)
      for (const level of levels) {
        const levelSpells = byLevel.get(level)
        const groupId = `spell-level-${level}`
        const groupData = {
          id: groupId,
          name: game.i18n.format('tokenActionHud.fade.spellLevel', { level }),
          type: 'system-derived'
        }
        this.addGroup(groupData, GROUP.spells)

        const actions = levelSpells.map((spell) => {
          const memorized = spell.system.memorized
          const cast = spell.system.cast
          const info1 = (memorized !== null && memorized !== undefined)
            ? {
                text: `${cast ?? 0}/${memorized}`,
                title: game.i18n.localize('FADE.tabs.spells')
              }
            : undefined
          return this.#makeItemAction(spell, 'spell', { info1 })
        })
        this.addActions(actions, groupData)
      }
    }

    /**
     * Ability score checks
     * @private
     */
    #buildAbilityChecks () {
      if (!this.actor?.system?.abilities) return

      const actionType = 'abilityCheck'
      const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE.abilityCheck)
      const actions = ABILITIES.map((abilityId) => {
        const ability = this.actor.system.abilities[abilityId]
        if (!ability) return null
        const name = coreModule.api.Utils.i18n(`FADE.Actor.Abilities.${abilityId}.long`)
        return {
          id: `${actionType}-${abilityId}`,
          name,
          listName: `${actionTypeName}: ${name}`,
          info1: { text: String(ability.total ?? ability.value ?? '') },
          system: { actionType, actionId: abilityId }
        }
      }).filter(Boolean)

      if (actions.length) this.addActions(actions, GROUP.abilities)
    }

    /**
     * Saving throws (specialAbility category save)
     * @private
     */
    #buildSaves () {
      const saves = this.actorItems.filter(
        (item) => item.type === 'specialAbility' && item.system.category === 'save'
      )
      if (!saves.length) return

      const actions = saves.map((save) => this.#makeItemAction(save, 'save', {
        info1: { text: String(save.system.target ?? '') },
        system: { saveCode: save.system.customSaveCode }
      }))
      this.addActions(actions, GROUP.saves)
    }

    /**
     * Skills
     * @private
     */
    #buildSkills () {
      const skills = this.actorItems.filter((item) => item.type === 'skill')
      if (!skills.length) return

      const actions = skills.map((skill) => this.#makeItemAction(skill, 'skill', {
        info1: skill.system.ability
          ? { text: String(skill.system.ability).toUpperCase() }
          : undefined
      }))
      this.addActions(actions, GROUP.skills)
    }

    /**
     * Exploration, class, spellcasting, and other special abilities
     * @private
     */
    #buildSpecialAbilities () {
      const specials = this.actorItems.filter((item) => item.type === 'specialAbility')
      if (!specials.length) return

      const exploration = []
      const classAbilities = []
      const other = []

      for (const item of specials) {
        const category = item.system.category
        if (category === 'save') continue
        if (category === 'explore') {
          exploration.push(item)
        } else if (category === 'class' || category === 'spellcasting') {
          classAbilities.push(item)
        } else {
          other.push(item)
        }
      }

      if (exploration.length) {
        this.addActions(
          exploration.map((item) => this.#makeItemAction(item, 'explore')),
          GROUP.exploration
        )
      }
      if (classAbilities.length) {
        this.addActions(
          classAbilities.map((item) => this.#makeItemAction(item, 'classAbility')),
          GROUP.classAbilities
        )
      }
      if (other.length) {
        this.addActions(
          other.map((item) => this.#makeItemAction(item, 'specialAbility')),
          GROUP.specialAbilities
        )
      }
    }

    /**
     * Gear and lights
     * @private
     */
    #buildInventory () {
      const gear = this.actorItems.filter((item) => {
        if (!['item', 'treasure'].includes(item.type)) return false
        if (item.system.containerId?.length > 0) return false
        return true
      })
      const lights = this.actorItems.filter((item) => {
        if (item.type !== 'light') return false
        if (item.system.containerId?.length > 0) return false
        return true
      })

      if (gear.length) {
        this.addActions(
          gear.map((item) => this.#makeItemAction(item, 'item')),
          GROUP.gear
        )
      }
      if (lights.length) {
        this.addActions(
          lights.map((item) => {
            const enabled = item.system.light?.enabled === true
            return this.#makeItemAction(item, 'light', {
              cssClass: enabled ? 'active' : '',
              info1: enabled
                ? { text: coreModule.api.Utils.i18n('tokenActionHud.fade.lightOn') }
                : undefined
            })
          }),
          GROUP.lights
        )
      }
    }

    /**
     * Morale + end turn
     * @private
     */
    #buildUtility () {
      if (this.actor) {
        const morale = this.actor.system?.details?.morale ?? this.actor.system?.retainer?.morale
        if (morale !== undefined && morale !== null) {
          const name = coreModule.api.Utils.i18n('FADE.Actor.morale')
          this.addActions([{
            id: 'morale',
            name,
            listName: name,
            info1: { text: String(morale) },
            system: { actionType: 'morale', actionId: 'morale' }
          }], GROUP.morale)
        }
      }

      const endTurnName = coreModule.api.Utils.i18n('tokenActionHud.fade.endTurn')
      this.addActions([{
        id: 'endTurn',
        name: endTurnName,
        listName: endTurnName,
        system: { actionType: 'utility', actionId: 'endTurn' }
      }], GROUP.combat)
    }
  }
})
