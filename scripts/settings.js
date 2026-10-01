import { MODULE } from './constants.js';

/**
 * Register module settings
 * @param {Function} coreUpdate Token Action HUD Core update function
 */
export function register(coreUpdate) {
   game.settings.register(MODULE.ID, 'showUnequippedWeapons', {
      name: game.i18n.localize('tokenActionHud.fade.setting.showUnequippedWeapons.name'),
      hint: game.i18n.localize('tokenActionHud.fade.setting.showUnequippedWeapons.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: (value) => {
         coreUpdate(value);
      }
   });

   game.settings.register(MODULE.ID, 'showUnmemorizedSpells', {
      name: game.i18n.localize('tokenActionHud.fade.setting.showUnmemorizedSpells.name'),
      hint: game.i18n.localize('tokenActionHud.fade.setting.showUnmemorizedSpells.hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: (value) => {
         coreUpdate(value);
      }
   });
}
