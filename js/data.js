// ============================================================
//  data.js - DDragon loading, role map, ability pool building
//  Load order: 4 (must run after specialAbilities.js)
// ============================================================

async function loadAllData() {
  setFeedback('Loading champions...', 'info');
  els.abilityName.textContent = 'Loading...';

  const versionsRes = await fetch(DDRAGON_VERSIONS);
  const versions = await versionsRes.json();
  state.version = versions[0];
  console.log(`[Guesser] DDragon version: ${state.version}`);

  const [champListRes, iconMapRes, rolesRes] = await Promise.all([
    fetch(`${DDRAGON_CDN}/${state.version}/data/en_US/champion.json`),
    fetch(ICON_MAP_URL),
    fetch(ROLES_MAP_URL),
  ]);

  if (!champListRes.ok) throw new Error('Failed to load champion list from Data Dragon');
  if (!iconMapRes.ok) throw new Error(`Failed to load ${ICON_MAP_URL} (status ${iconMapRes.status})`);
  if (!rolesRes.ok) throw new Error(`Failed to load ${ROLES_MAP_URL} (status ${rolesRes.status})`);

  const champListJson = await champListRes.json();
  const iconMap = await iconMapRes.json();
  state.championRoles = await rolesRes.json();

  console.log(`[Guesser] Summary: ${Object.keys(champListJson.data).length} champions`);
  console.log(`[Guesser] Icon map: ${Object.keys(iconMap).length} champion entries`);
  console.log(`[Guesser] Role map: ${Object.keys(state.championRoles).length} entries`);

  state.allChampions = Object.values(champListJson.data)
    .map((c) => ({ key: c.id, name: c.name, ddragon: c }))
    .sort((a, b) => a.name.localeCompare(b.name));

  buildRoleChampionMap();

  const iconMapByName = new Map();
  for (const name of Object.keys(iconMap)) {
    iconMapByName.set(normalizeName(name), iconMap[name]);
  }

  const wanted = state.allChampions.filter((c) =>
    iconMapByName.has(normalizeName(c.name)) || SPECIAL_ABILITY_SETS[c.name]
  );

  console.log(`[Guesser] Fetching full data for ${wanted.length} champions...`);

  const fullData = await fetchChampionsWithConcurrency(
    wanted.map((c) => c.key),
    12
  );

  buildAbilityPool(fullData, iconMapByName);

  if (state.abilityPool.length === 0) {
    throw new Error(
      `No abilities matched. ${wanted.length} champions had icon entries, but no ability names matched. ` +
      `Check the console for per-champion mismatch logs.`
    );
  }

  console.log(`Ready - ${state.allChampions.length} champions, ${state.abilityPool.length} abilities.`);
}

function buildRoleChampionMap() {
  state.roleChampionMap = {
    top: new Set(), jungle: new Set(), mid: new Set(), bot: new Set(), support: new Set(),
  };

  const keyByNorm = new Map();
  for (const champ of state.allChampions) {
    keyByNorm.set(normalizeName(champ.name), champ.key);
    keyByNorm.set(normalizeName(champ.key), champ.key);
  }

  let resolved = 0;
  const unresolved = [];

  for (const [name, roles] of Object.entries(state.championRoles)) {
    const canonicalKey = keyByNorm.get(normalizeName(name));
    if (!canonicalKey) {
      unresolved.push(name);
      continue;
    }
    resolved++;
    for (const role of roles) {
      const roleKey = String(role).toLowerCase();
      if (state.roleChampionMap[roleKey]) {
        state.roleChampionMap[roleKey].add(canonicalKey);
      }
    }
  }

  const counts = Object.entries(state.roleChampionMap)
    .map(([r, s]) => `${r}:${s.size}`)
    .join(', ');
  console.log(`[Guesser] Roles resolved: ${resolved}/${Object.keys(state.championRoles).length} (${counts})`);
  if (unresolved.length > 0) {
    console.warn(`[Guesser] Unresolved role entries (check spelling):`, unresolved);
  }
}

async function fetchChampionsWithConcurrency(keys, concurrency) {
  const results = new Array(keys.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= keys.length) return;
      const key = keys[i];
      try {
        const res = await fetch(
          `${DDRAGON_CDN}/${state.version}/data/en_US/champion/${key}.json`
        );
        if (!res.ok) {
          console.warn(`[Guesser] Failed to fetch ${key}: HTTP ${res.status}`);
          results[i] = null;
          continue;
        }
        const json = await res.json();
        results[i] = json.data[key] || null;
      } catch (e) {
        console.warn(`[Guesser] Failed to fetch ${key}:`, e);
        results[i] = null;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results.filter(Boolean);
}

function findAbilityIcons(iconEntry, lookupName) {
  const parts = String(lookupName)
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 2) {
    const url1 = findIconUrl(iconEntry, parts[0]);
    const url2 = findIconUrl(iconEntry, parts[1]);
    if (url1 && url2) return { primary: url1, secondary: url2 };
    if (url1) return { primary: url1, secondary: null };
    if (url2) return { primary: url2, secondary: null };
  }

  return { primary: findIconUrl(iconEntry, lookupName), secondary: null };
}

function buildAbilityPool(championDataList, iconMapByName) {
  const SLOTS = ['Q', 'W', 'E', 'R'];
  let matchedChamps = 0;
  let multiIconCount = 0;
  const unmatchedDetails = [];

  for (const champ of championDataList) {
    if (!champ) continue;
    const iconEntry = iconMapByName.get(normalizeName(champ.name));
    const special = SPECIAL_ABILITY_SETS[champ.name] || {};

    let addedAny = false;

    // ---------- Passive ----------
    if (special.P) {
      const def = special.P;
      const built = buildSpecialAbility(def, iconEntry);
      if (built) {
        state.abilityPool.push({
          championKey: champ.id,
          championName: champ.name,
          abilityName: def.name,
          slot: 'P',
          icons: built.icons,
          iconNames: built.iconNames,
          iconUrl: built.icons[0],
        });
        if (built.icons.length > 1) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${champ.name} [P] special override produced 0 icons`);
      }
    } else if (champ.passive && champ.passive.name && iconEntry) {
      const { primary, secondary } = findAbilityIcons(iconEntry, champ.passive.name);
      if (primary) {
        const icons = secondary ? [primary, secondary] : [primary];
        state.abilityPool.push({
          championKey: champ.id,
          championName: champ.name,
          abilityName: champ.passive.name,
          slot: 'P',
          icons,
          iconNames: null,
          iconUrl: primary,
        });
        if (secondary) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${champ.name} [P] "${champ.passive.name}"`);
      }
    } else if (champ.passive && champ.passive.name) {
      unmatchedDetails.push(`${champ.name} [P] "${champ.passive.name}" (no icon entry)`);
    }

    // ---------- Q / W / E / R ----------
    SLOTS.forEach((slot, idx) => {
      const spell = (champ.spells || [])[idx];
      if (!spell || !spell.name) return;

      if (special[slot]) {
        const def = special[slot];
        const built = buildSpecialAbility(def, iconEntry);
        if (built) {
          state.abilityPool.push({
            championKey: champ.id,
            championName: champ.name,
            abilityName: def.name,
            slot,
            icons: built.icons,
            iconNames: built.iconNames,
            iconUrl: built.icons[0],
          });
          if (built.icons.length > 1) multiIconCount++;
          addedAny = true;
        } else {
          unmatchedDetails.push(`${champ.name} [${slot}] special override produced 0 icons`);
        }
        return;
      }

      if (!iconEntry) {
        unmatchedDetails.push(`${champ.name} [${slot}] "${spell.name}" (no icon entry)`);
        return;
      }

      const { primary, secondary } = findAbilityIcons(iconEntry, spell.name);
      if (primary) {
        const icons = secondary ? [primary, secondary] : [primary];
        state.abilityPool.push({
          championKey: champ.id,
          championName: champ.name,
          abilityName: spell.name,
          slot,
          icons,
          iconNames: null,
          iconUrl: primary,
        });
        if (secondary) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${champ.name} [${slot}] "${spell.name}"`);
      }
    });

    if (addedAny) matchedChamps++;
  }

  console.log(
    `[Guesser] Ability pool: ${state.abilityPool.length} abilities from ${matchedChamps} champions ` +
    `(${multiIconCount} multi-icon abilities).`
  );
  if (unmatchedDetails.length > 0) {
    console.log(
      `[Guesser] ${unmatchedDetails.length} abilities had no icon match:`,
      unmatchedDetails
    );
  }
}

function buildSpecialAbility(def, iconEntry) {
  let icons = [];
  if (def.urls) {
    icons = def.urls.slice();
  } else if (def.keys && iconEntry) {
    icons = def.keys
      .map((k) => iconEntry[k] || findIconUrl(iconEntry, k))
      .filter(Boolean);
  }
  if (icons.length === 0) return null;

  const iconNames =
    def.names && def.names.length === icons.length ? def.names.slice() : null;

  return { icons, iconNames };
}

function findIconUrl(iconEntry, abilityName) {
  const target = normalizeName(abilityName);
  if (!target) return null;

  let best = null;
  let bestScore = Infinity;

  for (const [wikiName, url] of Object.entries(iconEntry)) {
    if (!url) continue;
    const wikiNorm = normalizeName(wikiName);
    const hasNumericSuffix = /\s\d+$/.test(wikiName);

    let score;
    if (wikiNorm === target) {
      score = 0;
    } else if (wikiNorm.startsWith(target) || target.startsWith(wikiNorm)) {
      score = 10 + Math.abs(wikiNorm.length - target.length);
    } else if (wikiNorm.includes(target) || target.includes(wikiNorm)) {
      score = 30 + Math.abs(wikiNorm.length - target.length);
    } else {
      continue;
    }

    if (hasNumericSuffix) score += 5;

    if (score < bestScore) {
      bestScore = score;
      best = url;
    }
  }

  return best;
}