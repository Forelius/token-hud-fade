import { ABILITIES, ACTION_TYPE, GROUP, KNOWN_ACTOR_TYPES } from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
   ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
      /** Sorted actor items (avoid Core's `items` Map). */
      actorItems = [];

      /** @override */
      async buildSystemActions(groupIds) {
         this.actors = (!this.actor) ? this.#getActors() : [this.actor];
         this.actorType = this.actor?.type;

         if (this.actorType && !KNOWN_ACTOR_TYPES.includes(this.actorType)) return;

         this.showUnequippedWeapons = Utils.getSetting('showUnequippedWeapons');
         this.showUnmemorizedSpells = Utils.getSetting('showUnmemorizedSpells');
         this.groupIds = groupIds;

         if (this.actor) {
            const sorted = coreModule.api.Utils.sortItemsByName(this.actor.items);
            this.actorItems = sorted instanceof Map
               ? Array.from(sorted.values())
               : Array.from(sorted ?? []);
            await this.#buildActorActions();
         } else if (this.actors?.length) {
            this.#buildUtility();
         }
      }

      async #buildActorActions() {
         await this.#buildWeapons();
         await this.#buildSpells();
         this.#buildAbilityChecks();
         this.#buildSaves();
         this.#buildSkills();
         this.#buildSpecialAbilities();
         this.#buildInventory();
         this.#buildUtility();
      }

      #getActors() {
         const actors = canvas.tokens.controlled
            .filter((token) => token.actor)
            .map((token) => token.actor);
         if (actors.every((actor) => KNOWN_ACTOR_TYPES.includes(actor?.type))) {
            return actors;
         }
         return [];
      }

      #makeItemAction(item, actionType, options = {}) {
         const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionType] ?? '');
         const name = options.name ?? item.knownNameGM ?? item.name;
         const action = {
            id: options.id ?? `${actionType}-${item.id}`,
            name,
            img: coreModule.api.Utils.getImage(item),
            listName: actionTypeName ? `${actionTypeName}: ${name}` : name,
            system: {
               actionType,
               actionId: item.id,
               ...options.system
            }
         };
         if (options.info1) action.info1 = options.info1;
         if (options.cssClass) action.cssClass = options.cssClass;
         return action;
      }

      async #buildWeapons() {
         const weapons = this.actorItems.filter((item) => {
            if (item.type !== 'weapon') return false;
            if (!this.showUnequippedWeapons && item.system.equipped !== true) return false;
            return true;
         });
         if (!weapons.length) return;

         const weaponActions = [];

         for (const weapon of weapons) {
            weaponActions.push(this.#makeItemAction(weapon, 'weapon'));
         }

         if (weaponActions.length) this.addActions(weaponActions, GROUP.attacks);
      }

      async #buildSpells() {
         let spells = this.actorItems.filter((item) => item.type === 'spell');
         if (!this.showUnmemorizedSpells) {
            spells = spells.filter((spell) =>
               spell.system.cast === undefined || spell.hasCast === true
            );
         }
         if (!spells.length) return;

         const byLevel = new Map();
         for (const spell of spells) {
            const level = Number(spell.system.spellLevel ?? 1);
            const list = byLevel.get(level) ?? [];
            list.push(spell);
            byLevel.set(level, list);
         }

         for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
            const groupData = {
               id: `spell-level-${level}`,
               name: game.i18n.format('tokenActionHud.fade.spellLevel', { level }),
               type: 'system-derived'
            };
            this.addGroup(groupData, GROUP.spells);

            const actions = byLevel.get(level).map((spell) => {
               const { memorized, cast } = spell.system;
               const info1 = (memorized !== null && memorized !== undefined)
                  ? { text: `${cast ?? 0}/${memorized}` }
                  : undefined;
               return this.#makeItemAction(spell, 'spell', { info1 });
            });
            this.addActions(actions, groupData);
         }
      }

      #buildAbilityChecks() {
         if (!this.actor?.system?.abilities) return;

         const actionType = 'abilityCheck';
         const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE.abilityCheck);
         const actions = ABILITIES.map((abilityId) => {
            const ability = this.actor.system.abilities[abilityId];
            if (!ability) return null;
            const name = coreModule.api.Utils.i18n(`FADE.Actor.Abilities.${abilityId}.long`);
            return {
               id: `${actionType}-${abilityId}`,
               name,
               listName: `${actionTypeName}: ${name}`,
               info1: { text: String(ability.total ?? ability.value ?? '') },
               system: { actionType, actionId: abilityId }
            };
         }).filter(Boolean);

         if (actions.length) this.addActions(actions, GROUP.abilities);
      }

      #buildSaves() {
         const saves = this.actorItems.filter(
            (item) => item.type === 'specialAbility' && item.system.category === 'save'
         );
         if (!saves.length) return;

         this.addActions(
            saves.map((save) => this.#makeItemAction(save, 'save', {
               info1: { text: String(save.system.target ?? '') },
               system: { saveCode: save.system.customSaveCode }
            })),
            GROUP.saves
         );
      }

      #buildSkills() {
         const skills = this.actorItems.filter((item) => item.type === 'skill');
         if (!skills.length) return;

         this.addActions(
            skills.map((skill) => this.#makeItemAction(skill, 'skill', {
               info1: skill.system.ability
                  ? { text: String(skill.system.ability).toUpperCase() }
                  : undefined
            })),
            GROUP.skills
         );
      }

      #buildSpecialAbilities() {
         const specials = this.actorItems.filter((item) => item.type === 'specialAbility');
         if (!specials.length) return;

         const exploration = [];
         const classAbilities = [];
         const other = [];

         for (const item of specials) {
            const category = item.system.category;
            if (category === 'save') continue;
            if (category === 'explore') exploration.push(item);
            else if (category === 'class' || category === 'spellcasting') classAbilities.push(item);
            else other.push(item);
         }

         if (exploration.length) {
            this.addActions(
               exploration.map((item) => this.#makeItemAction(item, 'explore')),
               GROUP.exploration
            );
         }
         if (classAbilities.length) {
            this.addActions(
               classAbilities.map((item) => this.#makeItemAction(item, 'classAbility')),
               GROUP.classAbilities
            );
         }
         if (other.length) {
            this.addActions(
               other.map((item) => this.#makeItemAction(item, 'specialAbility')),
               GROUP.specialAbilities
            );
         }
      }

      #buildInventory() {
         const notContained = (item) => !(item.system.containerId?.length > 0);
         const gear = this.actorItems.filter(
            (item) => ['item', 'treasure'].includes(item.type) && notContained(item)
         );
         const lights = this.actorItems.filter(
            (item) => item.type === 'light' && notContained(item)
         );

         if (gear.length) {
            this.addActions(
               gear.map((item) => this.#makeItemAction(item, 'item')),
               GROUP.gear
            );
         }
         if (lights.length) {
            this.addActions(
               lights.map((item) => {
                  const enabled = item.system.light?.enabled === true;
                  return this.#makeItemAction(item, 'light', {
                     cssClass: enabled ? 'active' : '',
                     info1: enabled
                        ? { text: coreModule.api.Utils.i18n('tokenActionHud.fade.lightOn') }
                        : undefined
                  });
               }),
               GROUP.lights
            );
         }
      }

      #buildUtility() {
         if (this.actor) {
            const morale = this.actor.system?.details?.morale ?? this.actor.system?.retainer?.morale;
            if (morale !== undefined && morale !== null) {
               const name = coreModule.api.Utils.i18n('FADE.Actor.morale');
               this.addActions([{
                  id: 'morale',
                  name,
                  listName: name,
                  info1: { text: String(morale) },
                  system: { actionType: 'morale', actionId: 'morale' }
               }], GROUP.morale);
            }
         }

         const endTurnName = coreModule.api.Utils.i18n('tokenActionHud.fade.endTurn');
         this.addActions([{
            id: 'endTurn',
            name: endTurnName,
            listName: endTurnName,
            system: { actionType: 'utility', actionId: 'endTurn' }
         }], GROUP.combat);
      }
   };
});
