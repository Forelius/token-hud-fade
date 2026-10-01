import { ActionHandler } from './action-handler.js';
import { RollHandler as Core } from './roll-handler.js';
import { DEFAULTS } from './defaults.js';
import * as systemSettings from './settings.js';

export let SystemManager = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
   SystemManager = class SystemManager extends coreModule.api.SystemManager {
      /** @override */
      getActionHandler() {
         return new ActionHandler();
      }

      /** @override */
      getAvailableRollHandlers() {
         return { core: 'Fantastic Depths' };
      }

      /** @override */
      getRollHandler(rollHandlerId) {
         return new Core();
      }

      /** @override */
      registerSettings(coreUpdate) {
         systemSettings.register(coreUpdate);
      }

      /** @override */
      async registerDefaults() {
         return DEFAULTS;
      }
   };
});
