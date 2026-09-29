import { KNOWN_ACTOR_TYPES } from './constants.js'
import { Utils } from './utils.js'

export let RollHandler = null

const RENDERABLE_TYPES = [
  'weapon', 'spell', 'skill', 'item', 'light',
  'explore', 'classAbility', 'specialAbility', 'save'
]

const ITEM_ROLL_TYPES = new Set([
  'skill', 'explore', 'classAbility', 'specialAbility', 'item'
])

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /** @override */
    async handleActionClick (event) {
      const system = this.action?.system
      if (!system) return

      if (this.actor) {
        await this.#handleAction(event, this.actor, this.token, system)
        return
      }

      for (const token of canvas.tokens.controlled) {
        if (!KNOWN_ACTOR_TYPES.includes(token.actor?.type)) continue
        await this.#handleAction(event, token.actor, token, system)
      }
    }

    async #handleAction (event, actor, token, system) {
      const { actionType, actionId } = system

      if (RENDERABLE_TYPES.includes(actionType) && this.isRenderItem()) {
        return this.doRenderItem(actor, actionId)
      }

      if (ITEM_ROLL_TYPES.has(actionType)) {
        return this.#handleItemRoll(event, actor, actionId)
      }

      switch (actionType) {
        case 'weapon':
          return this.#handleWeapon(event, actor, actionId)
        case 'spell':
          return this.#handleSpell(actor, actionId)
        case 'save':
          return this.#handleSave(event, actor, system)
        case 'abilityCheck':
          return this.#handleAbilityCheck(event, actor, actionId)
        case 'morale':
          return this.#handleMorale(event, actor)
        case 'light':
          return this.#handleLight(actor, token, actionId)
        case 'utility':
          return this.#handleUtility(token, actionId)
        default:
          break
      }
    }

    async #handleWeapon (event, actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item?.rollAttack) return
      const dataset = Utils.createSyntheticEvent(event, { dialog: 'attack' }).target.dataset
      await item.rollAttack(dataset)
    }

    async #handleSpell (actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item) return
      if (typeof item.doSpellcast === 'function') await item.doSpellcast()
      else if (typeof item.roll === 'function') await item.roll({})
    }

    async #handleItemRoll (event, actor, actionId) {
      const item = actor.items.get(actionId)
      if (!item?.roll) return
      await item.roll({}, null, Utils.createSyntheticEvent(event, {}))
    }

    async #handleSave (event, actor, system) {
      const item = actor.items.get(system.actionId)
      const saveCode = system.saveCode ?? item?.system?.customSaveCode
      if (!saveCode) return
      const savingThrowSys = game.fade?.registry?.getSystem('savingThrowSystem')
      if (!savingThrowSys) return
      await savingThrowSys.execute({
        actor,
        type: saveCode,
        event: Utils.createSyntheticEvent(event, { test: 'save', type: saveCode })
      })
    }

    async #handleAbilityCheck (event, actor, abilityId) {
      const abilityCheck = game.fade?.registry?.getSystem('abilityCheck')
      if (!abilityCheck) return
      await abilityCheck.execute({
        actor,
        event: Utils.createSyntheticEvent(event, {
          ability: abilityId,
          test: 'ability',
          pass: 'lte',
          autosuccess: '1',
          autofail: '20'
        })
      })
    }

    async #handleMorale (event, actor) {
      const moraleCheck = game.fade?.registry?.getSystem('moraleCheck')
      if (!moraleCheck) return
      await moraleCheck.execute({
        actor,
        event: Utils.createSyntheticEvent(event, {
          test: 'morale',
          label: game.i18n.localize('FADE.Actor.morale')
        })
      })
    }

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

    async #handleUtility (token, actionId) {
      if (actionId === 'endTurn' && token && game.combat?.current?.tokenId === token.id) {
        await game.combat?.nextTurn()
      }
      Hooks.callAll('forceUpdateTokenActionHud')
    }
  }
})
