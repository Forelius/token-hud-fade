# Token Action HUD Fantastic Depths

System module for [Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) that exposes Fantastic Depths actions on a repositionable HUD.

## Requirements

- Foundry VTT v13–v14
- [Fantastic Depths](https://github.com/Forelius/fantastic-depths)
- [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core) 2.x (and its dependency **socketlib**)

## Install

### From a GitHub release

1. In Foundry **Configuration and Setup** → **Add-on Modules** → **Install Module**
2. Paste the release manifest URL, e.g.  
   `https://github.com/Forelius/token-hud-fade/releases/latest/download/module.json`  
   (or a specific version under `releases/download/<tag>/module.json`)
3. Enable **Token Action HUD Fantastic Depths** in the world (after Fantastic Depths and Token Action HUD Core)


## Categories

| Category | Actions |
|----------|---------|
| Combat | Melee and missile weapon attacks |
| Spells | Spells grouped by level |
| Attributes | Ability score checks |
| Saves | Saving throws |
| Skills | Skill checks |
| Exploration | Exploration special abilities |
| Class Abilities | Class, spellcasting, and other special abilities |
| Inventory | Gear and light sources |
| Utility | Morale and end turn |

Empty groups are hidden. Unlock the HUD in Core settings to rearrange categories per user.

## Settings

- **Show unequipped weapons** — include weapons that are not equipped
- **Show unmemorized spells** — include spells with no remaining casts / not memorized

Ctrl-click rolls skip modifier dialogs where Fantastic Depths already supports that.
