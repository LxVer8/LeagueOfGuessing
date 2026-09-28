// ============================================================
//  data.js - DDragon loading (EN + ES), role map, ability pool
//  Load order: 5 (after specialAbilities.js)
// ============================================================

async function loadAllData() {
  setFeedback(t('loadingChampions'), 'info');
  els.abilityName.textContent = t('loading');

  const versionsRes = await fetch(DDRAGON_VERSIONS);
  const versions = await versionsRes.json();
  state.version = versions[0];
  console.log(`[Guesser] DDragon version: ${state.version}`);

  const [champEnRes, champEsRes, iconMapRes, rolesRes] = await Promise.all([
    fetch(`${DDRAGON_CDN}/${state.version}/data/en_US/champion.json`),
    fetch(`${DDRAGON_CDN}/${state.version}/data/es_MX/champion.json`),
    fetch(ICON_MAP_URL),
    fetch(ROLES_MAP_URL),
  ]);

  if (!champEnRes.ok) throw new Error(t('loadChampionsError'));
  if (!champEsRes.ok) throw new Error(t('loadChampionsError'));
  if (!iconMapRes.ok) throw new Error(t('loadIconMapError', iconMapRes.status));
  if (!rolesRes.ok)    throw new Error(t('loadRolesError', rolesRes.status));

  const champEn = (await champEnRes.json()).data;
  const champEs = (await champEsRes.json()).data;
  const iconMap = await iconMapRes.json();
  state.championRoles = await rolesRes.json();

  console.log(`[Guesser] Summary: ${Object.keys(champEn).length} champions`);
  console.log(`[Guesser] Icon map: ${Object.keys(iconMap).length} entries`);
  console.log(`[Guesser] Role map: ${Object.keys(state.championRoles).length} entries`);

  // Champion list — names per locale, key is locale-independent.
  state.allChampions = Object.values(champEn)
    .map((c) => ({
      key: c.id,
      names: {
        en: c.name,
        es: (champEs[c.id] && champEs[c.id].name) || c.name,
      },
      ddragon: c,
    }))
    .sort((a, b) => a.names.en.localeCompare(b.names.en));

  buildRoleChampionMap();

  const iconMapByName = new Map();
  for (const name of Object.keys(iconMap)) {
    iconMapByName.set(normalizeName(name), iconMap[name]);
  }

  const wanted = state.allChampions.filter(
    (c) =>
      iconMapByName.has(normalizeName(c.names.en)) ||
      SPECIAL_ABILITY_SETS[c.names.en]
  );

  console.log(`[Guesser] Fetching full data for ${wanted.length} champions…`);

  const keys = wanted.map((c) => c.key);
  const [fullEn, fullEs] = await Promise.all([
    fetchChampionsWithConcurrency(keys, 12, 'en_US'),
    fetchChampionsWithConcurrency(keys, 12, 'es_MX'),
  ]);

  const esById = new Map(fullEs.map((c) => [c.id, c]));
  const pairs = fullEn
    .map((en) => ({ en, es: esById.get(en.id) }))
    .filter((p) => p.en && p.es);

  buildAbilityPool(pairs, iconMapByName);

  if (state.abilityPool.length === 0) {
    throw new Error(t('noAbilitiesMatched'));
  }

  console.log(`✅ Ready — ${state.allChampions.length} champions, ${state.abilityPool.length} abilities.`);
}

function buildRoleChampionMap() {
  state.roleChampionMap = {
    top: new Set(), jungle: new Set(), mid: new Set(), bot: new Set(), support: new Set(),
  };

  const keyByNorm = new Map();
  for (const champ of state.allChampions) {
    keyByNorm.set(normalizeName(champ.names.en), champ.key);
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
    console.warn(`[Guesser] Unresolved role entries:`, unresolved);
  }
}

async function fetchChampionsWithConcurrency(keys, concurrency, locale) {
  const results = new Array(keys.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= keys.length) return;
      const key = keys[i];
      try {
        const res = await fetch(
          `${DDRAGON_CDN}/${state.version}/data/${locale}/champion/${key}.json`
        );
        if (!res.ok) {
          console.warn(`[Guesser] Failed to fetch ${key} (${locale}): HTTP ${res.status}`);
          results[i] = null;
          continue;
        }
        const json = await res.json();
        results[i] = json.data[key] || null;
      } catch (e) {
        console.warn(`[Guesser] Failed to fetch ${key} (${locale}):`, e);
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

function makeAbilityEntry(en, es, slot, keyName, enName, esName, icons, iconNames) {
  return {
    championKey: en.id,
    slot,
    championNames: { en: en.name, es: es.name },
    abilityNames:  { en: enName, es: esName || enName },
    // Legacy fields — kept so older code paths don't explode.
    championName: en.name,
    abilityName:  enName,
    icons,
    iconNames,
    iconUrl: icons[0],
  };
}

function buildAbilityPool(pairs, iconMapByName) {
  const SLOTS = ['Q', 'W', 'E', 'R'];
  let matchedChamps = 0;
  let multiIconCount = 0;
  const unmatchedDetails = [];

  for (const { en, es } of pairs) {
    const iconEntry = iconMapByName.get(normalizeName(en.name));
    const special   = SPECIAL_ABILITY_SETS[en.name] || {};
    let addedAny = false;

    // ---------- Passive ----------
    if (special.P) {
      const def = special.P;
      const built = buildSpecialAbility(def, iconEntry);
      if (built) {
        state.abilityPool.push(makeAbilityEntry(
          en, es, 'P', def.name,
          en.passive ? en.passive.name : def.name,
          es.passive ? es.passive.name : def.name,
          built.icons, built.iconNames
        ));
        if (built.icons.length > 1) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${en.name} [P] special override produced 0 icons`);
      }
    } else if (en.passive && en.passive.name && iconEntry) {
      const { primary, secondary } = findAbilityIcons(iconEntry, en.passive.name);
      if (primary) {
        const icons = secondary ? [primary, secondary] : [primary];
        state.abilityPool.push(makeAbilityEntry(
          en, es, 'P', en.passive.name,
          en.passive.name,
          es.passive ? es.passive.name : en.passive.name,
          icons, null
        ));
        if (secondary) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${en.name} [P] "${en.passive.name}"`);
      }
    }

    // ---------- Q / W / E / R ----------
    SLOTS.forEach((slot, idx) => {
      const enSpell = (en.spells || [])[idx];
      const esSpell = (es.spells || [])[idx];
      if (!enSpell || !enSpell.name) return;

      if (special[slot]) {
        const def = special[slot];
        const built = buildSpecialAbility(def, iconEntry);
        if (built) {
          state.abilityPool.push(makeAbilityEntry(
            en, es, slot, def.name,
            enSpell.name,
            esSpell ? esSpell.name : enSpell.name,
            built.icons, built.iconNames
          ));
          if (built.icons.length > 1) multiIconCount++;
          addedAny = true;
        } else {
          unmatchedDetails.push(`${en.name} [${slot}] special override produced 0 icons`);
        }
        return;
      }

      if (!iconEntry) return;
      const { primary, secondary } = findAbilityIcons(iconEntry, enSpell.name);
      if (primary) {
        const icons = secondary ? [primary, secondary] : [primary];
        state.abilityPool.push(makeAbilityEntry(
          en, es, slot, enSpell.name,
          enSpell.name,
          esSpell ? esSpell.name : enSpell.name,
          icons, null
        ));
        if (secondary) multiIconCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${en.name} [${slot}] "${enSpell.name}"`);
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