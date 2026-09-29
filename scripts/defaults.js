import { GROUP } from './constants.js'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  const groups = GROUP

  Object.values(groups).forEach((group) => {
    group.name = coreModule.api.Utils.i18n(group.name)
    group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
  })

  const groupsArray = Object.values(groups)

  DEFAULTS = {
    layout: [
      {
        nestId: 'attacks',
        id: 'attacks',
        name: coreModule.api.Utils.i18n('tokenActionHud.fade.combat'),
        groups: [
          { ...groups.melee, nestId: 'attacks_melee' },
          { ...groups.missile, nestId: 'attacks_missile' }
        ]
      },
      {
        nestId: 'spells',
        id: 'spells',
        name: coreModule.api.Utils.i18n('FADE.tabs.spells'),
        groups: [
          { ...groups.spells, nestId: 'spells_spells' }
        ]
      },
      {
        nestId: 'attributes',
        id: 'attributes',
        name: coreModule.api.Utils.i18n('FADE.Actor.Abilities.plural'),
        groups: [
          { ...groups.abilities, nestId: 'attributes_abilities' }
        ]
      },
      {
        nestId: 'saves',
        id: 'saves',
        name: coreModule.api.Utils.i18n('FADE.Actor.Saves.long'),
        groups: [
          { ...groups.saves, nestId: 'saves_saves' }
        ]
      },
      {
        nestId: 'skills',
        id: 'skills',
        name: coreModule.api.Utils.i18n('FADE.tabs.skills'),
        groups: [
          { ...groups.skills, nestId: 'skills_skills' }
        ]
      },
      {
        nestId: 'exploration',
        id: 'exploration',
        name: coreModule.api.Utils.i18n('FADE.SpecialAbility.categories.explore'),
        groups: [
          { ...groups.exploration, nestId: 'exploration_exploration' }
        ]
      },
      {
        nestId: 'classAbilities',
        id: 'classAbilities',
        name: coreModule.api.Utils.i18n('FADE.SpecialAbility.plural'),
        groups: [
          { ...groups.classAbilities, nestId: 'classAbilities_classAbilities' },
          { ...groups.specialAbilities, nestId: 'classAbilities_specialAbilities' }
        ]
      },
      {
        nestId: 'inventory',
        id: 'inventory',
        name: coreModule.api.Utils.i18n('FADE.tabs.items'),
        groups: [
          { ...groups.gear, nestId: 'inventory_gear' },
          { ...groups.lights, nestId: 'inventory_lights' }
        ]
      },
      {
        nestId: 'utility',
        id: 'utility',
        name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
        groups: [
          { ...groups.morale, nestId: 'utility_morale' },
          { ...groups.combat, nestId: 'utility_combat' }
        ]
      }
    ],
    groups: groupsArray
  }
})
