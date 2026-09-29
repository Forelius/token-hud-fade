import { KNOWN_ACTOR_TYPES } from './constants.js'
import { Utils } from './utils.js'

export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Handles HUD action clicks for Fantastic Depths
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * @override
     * @param {Event} event
     */
    async handleActionClick (event) {
      const system = this.action?.system
      if (!system) return

      if (this.actor) {
        await this.#handleAction(event, this.actor, this.token, system)
        return
      }

      const tokens = canvas.tokens.controlled.filter(
        (token) => KNOWN_ACTOR_TYPES.includes(token.actor?.type)
      )
      for (const token of tokens) {
        await this.#handleAction(event, token.actor, token, system)
      }
    }

    /**
     * @private
     * @param {Event} event
     * @param {object} actor
     * @param {object} token
     * @param {object} system
     */
    async #handleAction (event, actor, token, system) {
      const { actionType, actionId } = system

      const renderable = ['weapon', 'spell', 'skill', 'item', 'light', 'explore', 'classAbility', 'specialAbility', 'save']
      if (renderable.includes(actionType) && this.isRenderItem()) {
        return this.doRenderItem(actor, actionId)
      }

      switch (actionType) {
        case 'weapon':
          await this.#handleWeapon(event, actor, actionId)
          break
        case 'spell':
          await this.#handleSpell(actor, actionId)
          break
        case 'skill':
        case 'explore':
        case 'classAbility':
        case 'specialAbility':
          await this.#handleItemRoll(event, actor, actionId)
          break
        case 'save':
          await this.#handleSave(event, actor, system)
          break
        case 'abilityCheck':
          await this.#handleAbilityCheck(event, actor, actionId)
          break
        case 'morale':
          await this.#handleMorale(event, actor)
          break
        case 'light':
          await this.#handleLight(actor, token, actionId)
          break
        case 'item':
          await this.#handleItemRoll(event, actor, actionId)
          break
        case 'utility':
          await this.#handleUtility(token, actionId)
          break
        default:
          break
      }
    }

    /**
     * @private
     */
    async #handleWeapon (event, actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item?.rollAttack) return
      // Attack dialog selects melee vs missile; ctrl-click skips mods where FADE supports it
      const dataset = Utils.createSyntheticEvent(event, { dialog: 'attack' }).target.dataset
      await item.rollAttack(dataset)
    }

    /**
     * @private
     */
    async #handleSpell (actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item) return
      if (typeof item.doSpellcast === 'function') {
        await item.doSpellcast()
      } else if (typeof item.roll === 'function') {
        await item.roll({})
      }
    }

    /**
     * @private
     */
    async #handleItemRoll (event, actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item?.roll) return
      const synthetic = Utils.createSyntheticEvent(event, {})
      await item.roll({}, null, synthetic)
    }

    /**
     * @private
     */
    async #handleSave (event, actor, system) {
      const item = actor.items.get(system.actionId)
      const saveCode = system.saveCode ?? item?.system?.customSaveCode
      if (!saveCode) return
      const savingThrowSys = game.fade?.registry?.getSystem('savingThrowSystem')
      if (!savingThrowSys) return
      const synthetic = Utils.createSyntheticEvent(event, {
        test: 'save',
        type: saveCode
      })
      await savingThrowSys.execute({ actor, type: saveCode, event: synthetic })
    }

    /**
     * @private
     */
    async #handleAbilityCheck (event, actor, abilityId) {
      const abilityCheck = game.fade?.registry?.getSystem('abilityCheck')
      if (!abilityCheck) return
      const synthetic = Utils.createSyntheticEvent(event, {
        ability: abilityId,
        test: 'ability',
        pass: 'lte',
        autosuccess: '1',
        autofail: '20'
      })
      await abilityCheck.execute({ actor, event: synthetic })
    }

    /**
     * @private
     */
    async #handleMorale (event, actor) {
      const moraleCheck = game.fade?.registry?.getSystem('moraleCheck')
      if (!moraleCheck) return
      const synthetic = Utils.createSyntheticEvent(event, {
        test: 'morale',
        label: game.i18n.localize('FADE.Actor.morale')
      })
      await moraleCheck.execute({ actor, event: synthetic })
    }

    /**
     * @private
     */
    async #handleLight (actor, token, actionId) {
      const item = actor.items.get(actionId)
      if (!item?.toggleLight) return
      const ownerUuid = token?.document?.uuid ?? token?.uuid ?? actor.uuid
      await item.toggleLight({
        owneruuid: ownerUuid,
        itemuuid: item.uuid,
        actionuuid: item.uuid
      })
      Hooks.callAll('forceUpdateTokenActionHud')
    }

    /**
     * @private
     */
    async #handleUtility (token, actionId) {
      switch (actionId) {
        case 'endTurn':
          if (!token) break
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn()
          }
          break
        default:
          break
      }
      Hooks.callAll('forceUpdateTokenActionHud')
    }
  }
})
