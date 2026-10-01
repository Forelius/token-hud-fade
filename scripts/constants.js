/**
 * Module-based constants
 */
export const MODULE = {
   ID: 'token-hud-fade'
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2';

/**
 * Actor types that receive HUD actions
 */
export const KNOWN_ACTOR_TYPES = ['character', 'monster', 'vehicle'];

/**
 * Ability score keys (Fantastic Depths)
 */
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Action type labels (i18n keys)
 */
export const ACTION_TYPE = {
   weapon: 'TYPES.Item.weapon',
   spell: 'TYPES.Item.spell',
   skill: 'TYPES.Item.skill',
   item: 'TYPES.Item.item',
   light: 'TYPES.Item.light',
   abilityCheck: 'FADE.Actor.Abilities.long',
   save: 'FADE.Actor.Saves.singular',
   explore: 'FADE.SpecialAbility.categories.explore',
   classAbility: 'FADE.SpecialAbility.categories.class',
   specialAbility: 'FADE.SpecialAbility.long',
   morale: 'FADE.Actor.morale',
   utility: 'tokenActionHud.fade.utility'
};

/**
 * Default groups (localized in defaults.js)
 */
export const GROUP = {
   attacks: { id: 'attacks', name: 'tokenActionHud.fade.attacks', type: 'system' },
   spells: { id: 'spells', name: 'FADE.tabs.spells', type: 'system' },
   abilities: { id: 'abilities', name: 'FADE.Actor.Abilities.plural', type: 'system' },
   saves: { id: 'saves', name: 'FADE.Actor.Saves.long', type: 'system' },
   skills: { id: 'skills', name: 'FADE.tabs.skills', type: 'system' },
   exploration: { id: 'exploration', name: 'FADE.SpecialAbility.categories.explore', type: 'system' },
   classAbilities: { id: 'classAbilities', name: 'FADE.SpecialAbility.categories.class', type: 'system' },
   specialAbilities: { id: 'specialAbilities', name: 'tokenActionHud.fade.specialAbilities', type: 'system' },
   gear: { id: 'gear', name: 'tokenActionHud.fade.gear', type: 'system' },
   lights: { id: 'lights', name: 'tokenActionHud.fade.lights', type: 'system' },
   morale: { id: 'morale', name: 'FADE.Actor.morale', type: 'system' },
   combat: { id: 'combat', name: 'tokenActionHud.fade.combat', type: 'system' }
};
