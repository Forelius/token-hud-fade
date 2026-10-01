import { MODULE } from './constants.js';

export let Utils = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
   Utils = class Utils {
      static getSetting(key, defaultValue = null) {
         try {
            return game.settings.get(MODULE.ID, key);
         } catch {
            coreModule.api.Logger.debug(`Setting '${key}' not found`);
            return defaultValue ?? null;
         }
      }

      /** Synthetic event FADE registry systems can read (dataset + modifier keys). */
      static createSyntheticEvent(event, dataset = {}) {
         const data = foundry.utils.duplicate(dataset);
         return {
            ctrlKey: event?.ctrlKey ?? false,
            shiftKey: event?.shiftKey ?? false,
            altKey: event?.altKey ?? false,
            metaKey: event?.metaKey ?? false,
            target: { dataset: data },
            currentTarget: { dataset: data }
         };
      }
   };
});
