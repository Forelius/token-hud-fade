import { MODULE } from './constants.js'

export let Utils = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Utility functions
   */
  Utils = class Utils {
    /**
     * Get setting
     * @param {string} key
     * @param {*} [defaultValue=null]
     * @returns {*}
     */
    static getSetting (key, defaultValue = null) {
      let value = defaultValue ?? null
      try {
        value = game.settings.get(MODULE.ID, key)
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`)
      }
      return value
    }

    /**
     * Set setting
     * @param {string} key
     * @param {*} value
     */
    static async setSetting (key, value) {
      try {
        value = await game.settings.set(MODULE.ID, key, value)
        coreModule.api.Logger.debug(`Setting '${key}' set to '${value}'`)
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`)
      }
    }

    /**
     * Build a synthetic event that FADE registry systems can read (dataset + modifier keys).
     * @param {Event} event
     * @param {object} dataset
     * @returns {object}
     */
    static createSyntheticEvent (event, dataset = {}) {
      return {
        ctrlKey: event?.ctrlKey ?? false,
        shiftKey: event?.shiftKey ?? false,
        altKey: event?.altKey ?? false,
        metaKey: event?.metaKey ?? false,
        target: { dataset: foundry.utils.duplicate(dataset) },
        currentTarget: { dataset: foundry.utils.duplicate(dataset) }
      }
    }
  }
})
