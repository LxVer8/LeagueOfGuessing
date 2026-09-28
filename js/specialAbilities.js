// ============================================================
//  specialAbilities.js - Special champion ability overrides
//  Load order: 3 (must run before data.js)
// ============================================================

/**
 * Special champions whose DDragon spell names don't match the wiki icon
 * map, or whose kit needs custom handling.
 *
 * Each entry can override specific slots (P, Q, W, E, R). Slots not present
 * in the override fall through to the normal matcher. Each slot accepts:
 *   - keys:  [wiki JSON keys] looked up in abilityIcons.json
 *   - urls:  [hardcoded URLs] used directly (for champions missing from the JSON)
 *   - names: [optional per-icon display names; falls back to the ability name]
 */
const SPECIAL_ABILITY_SETS = {
  // Aphelios - not in abilityIcons.json. Q shows the five weapon Q
  // abilities, E shows the five weapon icons themselves.
  'Aphelios': {
    P: { name: 'The Hitman and the Seer',
         urls: ['https://wiki.leagueoflegends.com/en-us/images/Aphelios_The_Hitman_and_the_Seer.png?ff50c'] },
    Q: { name: 'Weapons of the Faithful',
         urls: [
           'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Moonshot_HD.jpg',
           'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Onslaught_HD.jpg',
           'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Binding_Eclipse_HD.jpg',
           'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Duskwave_HD.jpg',
           'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Sentry_HD.jpg',
         ],
         names: ['Moonshot', 'Onslaught', 'Binding Eclipse', 'Duskwave', 'Sentry'] },
    W: { name: 'Phase',
         urls: ['https://wiki.leagueoflegends.com/en-us/images/Aphelios_Phase_HD.png'] },
    E: { name: 'Weapon Queue System',
         urls: [
           'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180314%21Aphelios_Calibrum.png?ad743',
           'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180455%21Aphelios_Severum.png?31fb1',
           'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180408%21Aphelios_Gravitum.png?45061',
           'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180437%21Aphelios_Infernum.png?54c5a',
           'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180332%21Aphelios_Crescendum.png?fc333',
         ],
         names: ['Calibrum', 'Severum', 'Gravitum', 'Infernum', 'Crescendum'] },
    R: { name: 'Moonlight Vigil',
         urls: ['https://wiki.leagueoflegends.com/en-us/images/Aphelios_Moonlight_Vigil_HD.jpg'] },
  },

  'Elise': {
    R: { name: 'Spider Form',
         keys: ['Spider Form', 'Human Form'],
         names: ['Spider Form', 'Human Form'] },
  },

  'Evelynn': {
    E: { name: 'Whiplash',
         keys: ['Whiplash', 'Empowered Whiplash'],
         names: ['Whiplash', 'Empowered Whiplash'] },
  },

  'Gnar': {
    P: { name: 'Rage Gene',
         urls: ['https://wiki.leagueoflegends.com/en-us/images/Gnar_Rage_Gene_HD.png'] },
    Q: { name: 'Boomerang Throw',
         keys: ['Boomerang Throw', 'Boulder Toss'],
         names: ['Boomerang Throw', 'Boulder Toss'] },
    W: { name: 'Hyper',
         keys: ['Hyper', 'Wallop'],
         names: ['Hyper', 'Wallop'] },
    E: { name: 'Hop',
         keys: ['Hop', 'Crunch'],
         names: ['Hop', 'Crunch'] },
  },

  'Heimerdinger': {
    Q: { name: 'H-28G Evolution Turret',
         keys: ['H-28G Evolution Turret', 'H-28Q Apex Turret'],
         names: ['H-28G Evolution Turret', 'H-28Q Apex Turret'] },
    W: { name: 'Hextech Micro-Rockets',
         keys: ['Hextech Micro-Rockets', 'Hextech Rocket Swarm'],
         names: ['Hextech Micro-Rockets', 'Hextech Rocket Swarm'] },
    E: { name: 'CH-2 Electron Storm Grenade',
         keys: ['CH-2 Electron Storm Grenade', 'CH-3X Lightning Grenade'],
         names: ['CH-2 Electron Storm Grenade', 'CH-3X Lightning Grenade'] },
  },

  'Hwei': {
    P: { name: 'Signature of the Visionary', keys: ['Signature of the Visionary'] },
    Q: { name: 'Subject: Disaster',          keys: ['QQ', 'QW', 'QE'],
         names: ['Devastating Fire', 'Severing Bolt', 'Molten Fissure'] },
    W: { name: 'Subject: Serenity',          keys: ['WQ', 'WW', 'WE', 'Wash Brush'],
         names: ['Fleeting Current', 'Pool of Reflection', 'Stirring Lights', 'Wash Brush'] },
    E: { name: 'Subject: Torment',           keys: ['EQ', 'EW', 'EE'],
         names: ['Grim Visage', 'Gaze of the Abyss', 'Crushing Maw'] },
    R: { name: 'Spiraling Despair',          keys: ['Subject: Torment'] },
  },

  'Jayce': {
    P: { name: 'Hextech Capacitor',
         keys: ['Hextech Capacitor', 'Hextech Capacitor 2'],
         names: ['Hextech Capacitor', 'Hextech Capacitor'] },
    R: { name: 'Transform',
         keys: ['Transform Mercury Cannon', 'Transform Mercury Hammer'],
         names: ['Mercury Cannon', 'Mercury Hammer'] },
  },

  'Jhin': {
    P: { name: 'Whisper',
         keys: ['Whisper', 'Basic Attack'],
         names: ['Whisper', 'Basic Attack'] },
  },

  'Karma': {
    P: { name: 'Gathering Fire',    keys: ['Gathering Fire'] },
    Q: { name: 'Inner Flame',       keys: ['Inner Flame', 'Soulflare'],
         names: ['Inner Flame', 'Soulflare'] },
    W: { name: 'Focused Resolve',   keys: ['Focused Resolve', 'Renewal'],
         names: ['Focused Resolve', 'Renewal'] },
    E: { name: 'Inspire',           keys: ['Inspire', 'Defiance'],
         names: ['Inspire', 'Defiance'] },
    R: { name: 'Mantra',            keys: ['Mantra'] },
  },

  'Kayn': {
    P: { name: 'The Darkin Scythe',
         keys: ['The Darkin Scythe', 'The Darkin Scythe A', 'The Darkin Scythe R'],
         names: ['The Darkin Scythe', 'The Darkin Scythe (Shadow Assassin)', 'The Darkin Scythe (Rhaast)'] },
    Q: { name: 'Reaping Slash',
         keys: ['Reaping Slash', 'Reaping Slash A', 'Reaping Slash R'],
         names: ['Reaping Slash', 'Reaping Slash (Shadow Assassin)', 'Reaping Slash (Rhaast)'] },
    W: { name: "Blade's Reach",
         keys: ["Blade's Reach", "Blade's Reach A", "Blade's Reach R"],
         names: ["Blade's Reach", "Blade's Reach (Shadow Assassin)", "Blade's Reach (Rhaast)"] },
    E: { name: 'Shadow Step',
         keys: ['Shadow Step', 'Shadow Step A', 'Shadow Step R'],
         names: ['Shadow Step', 'Shadow Step (Shadow Assassin)', 'Shadow Step (Rhaast)'] },
    R: { name: 'Umbral Trespass',
         keys: ['Umbral Trespass', 'Umbral Trespass 2', 'Umbral Trespass R'],
         names: ['Umbral Trespass', 'Umbral Trespass (Shadow Assassin)', 'Umbral Trespass (Rhaast)'] },
  },

  "Kha'Zix": {
    Q: { name: 'Taste Their Fear',
         keys: ['Taste Their Fear', 'Evolved Reaper Claws'],
         names: ['Taste Their Fear', 'Evolved Reaper Claws'] },
    W: { name: 'Void Spike',
         keys: ['Void Spike', 'Evolved Spike Racks'],
         names: ['Void Spike', 'Evolved Spike Racks'] },
    E: { name: 'Leap',
         keys: ['Leap', 'Evolved Wings'],
         names: ['Leap', 'Evolved Wings'] },
    R: { name: 'Void Assault',
         keys: ['Void Assault', 'Evolved Adaptive Cloaking'],
         names: ['Void Assault', 'Evolved Adaptive Cloaking'] },
  },

  'Kled': {
    P: { name: 'Skaarl the Cowardly Lizard',
         keys: ['Skaarl the Cowardly Lizard', 'Skaarl the Cowardly Lizard 2'],
         names: ['Skaarl the Cowardly Lizard', 'Skaarl the Cowardly Lizard'] },
    Q: { name: 'Bear Trap on a Rope',
         keys: ['Bear Trap on a Rope', 'Pocket Pistol'],
         names: ['Bear Trap on a Rope', 'Pocket Pistol'] },
    E: { name: 'Jousting',
         keys: ['Jousting'],
         names: ['Jousting'] },
    R: { name: 'Chaaaaaaaarge!!!',
         keys: ['Chaaaaaaaarge!!!'],
         names: ['Chaaaaaaaarge!!!'] },
  },

  'Quinn': {
    R: { name: 'Behind Enemy Lines',
         keys: ['Behind Enemy Lines', 'Skystrike'],
         names: ['Behind Enemy Lines', 'Skystrike'] },
  },

  'Rell': {
    W: { name: 'Ferromancy',
         keys: ['Ferromancy- Crash Down', 'Ferromancy- Mount Up'],
         names: ['Ferromancy: Crash Down', 'Ferromancy: Mount Up'] },
  },

  'Riven': {
    R: { name: 'Blade of the Exile',
         keys: ['Blade of the Exile', 'Wind Slash'],
         names: ['Blade of the Exile', 'Wind Slash'] },
  },

  'Samira': {
    P: { name: 'Daredevil Impulse',
         keys: ['Daredevil Impulse', 'Taunt'],
         names: ['Daredevil Impulse', 'Taunt'] },
  },

  'Senna': {
    P: { name: 'Absolution',
         keys: ['Absolution', 'Basic Attack'],
         names: ['Absolution', 'Basic Attack'] },
  },

  'Sion': {
    P: { name: 'Glory in Death',
         keys: ['Glory in Death', 'Death Surge'],
         names: ['Glory in Death', 'Death Surge'] },
  },

  'Swain': {
    R: { name: 'Demonic Ascension',
         keys: ['Demonic Ascension', 'Demonflare'],
         names: ['Demonic Ascension', 'Demonflare'] },
  },

  'Tahm Kench': {
    W: { name: 'Abyssal Dive',
         keys: ['Abyssal Dive'],
         names: ['Abyssal Dive'] },
    R: { name: 'Devour',
         keys: ['Devour', 'Regurgitate'],
         names: ['Devour', 'Regurgitate'] },
  },

  'Yorick': {
    R: { name: 'Eulogy of the Isles',
         keys: ['Eulogy of the Isles', 'Awakening'],
         names: ['Eulogy of the Isles', 'Awakening'] },
  },
};