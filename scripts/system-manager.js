import { ActionHandler } from './action-handler.js'
import { RollHandler as Core } from './roll-handler.js'
import { DEFAULTS } from './defaults.js'
import * as systemSettings from './settings.js'

export let SystemManager = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's SystemManager class
   */
  SystemManager = class SystemManager extends coreModule.api.SystemManager {
    /**
     * @override
     * @returns {ActionHandler}
     */
    getActionHandler () {
      return new ActionHandler()
    }

    /**
     * @override
     * @returns {object}
     */
    getAvailableRollHandlers () {
      return { core: 'Fantastic Depths' }
    }

    /**
     * @override
     * @param {string} rollHandlerId
     * @returns {object}
     */
    getRollHandler (rollHandlerId) {
      switch (rollHandlerId) {
        case 'core':
        default:
          return new Core()
      }
    }

    /**
     * @override
     * @param {Function} coreUpdate
     */
    registerSettings (coreUpdate) {
      systemSettings.register(coreUpdate)
    }

    /**
     * @override
     * @returns {object}
     */
    async registerDefaults () {
      return DEFAULTS
    }
  }
})
