// ============================================================
//  guide.js - Right-side guide panel
//  Load order: 7
// ============================================================

function setGuideEnabled(enabled) {
  state.guideEnabled = enabled;
  els.guidePanel.classList.toggle('hidden', !enabled);
  if (enabled) {
    els.guideSearch.value = '';
    buildGuide();
  }
  saveHundredState();
}

function restartHundredProgress() {
  if (!state.hundredPercentEnabled) return;
  state.completedAbilities.clear();
  updateHundredProgressUI();
  if (state.guideEnabled) buildGuide();
  saveHundredState();
  startNewRound();
}

function createGuideImage(url, alt, slotEl) {
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.addEventListener('error', () => {
    img.remove();
    slotEl.classList.remove('done');
    slotEl.style.background = '';
    slotEl.style.borderColor = '';
  });
  return img;
}

function buildGuide() {
  if (!state.guideEnabled) return;
  if (state.abilityPool.length === 0) return;

  guideSlotMap.clear();
  els.guideChampions.innerHTML = '';

  // Group abilities by champion.
  const byChampion = new Map();
  for (const ability of state.abilityPool) {
    if (!byChampion.has(ability.championKey)) {
      byChampion.set(ability.championKey, {
        championKey: ability.championKey,
        championName: displayAbilityChampion(ability),
        abilities: {},
      });
    }
    byChampion.get(ability.championKey).abilities[ability.slot] = ability;
  }

  const champions = [...byChampion.values()].sort((a, b) =>
    a.championName.localeCompare(b.championName, state.locale)
  );

  const SLOTS = ['P', 'Q', 'W', 'E', 'R'];
  const fragment = document.createDocumentFragment();

  for (const champ of champions) {
    const row = document.createElement('div');
    row.className = 'guide-champion';
    row.dataset.championName = champ.championName;

    const champIcon = document.createElement('img');
    champIcon.className = 'guide-champ-icon';
    champIcon.src = `${DDRAGON_CDN}/${state.version}/img/champion/${champ.championKey}.png`;
    champIcon.alt = '';
    row.appendChild(champIcon);

    const nameEl = document.createElement('span');
    nameEl.className = 'guide-champ-name';
    nameEl.textContent = champ.championName;
    row.appendChild(nameEl);

    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'guide-slots-wrap';

    let maxRows = 1;
    for (const slot of SLOTS) {
      const a = champ.abilities[slot];
      if (a && a.icons && a.icons.length > maxRows) maxRows = a.icons.length;
    }

    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'guide-slots';

      for (const slot of SLOTS) {
        const ability = champ.abilities[slot];
        const url = ability && ability.icons ? ability.icons[rowIdx] : null;

        if (!url) {
          const ph = document.createElement('div');
          ph.className = 'guide-slot';
          ph.style.visibility = 'hidden';
          rowEl.appendChild(ph);
          continue;
        }

        const slotEl = document.createElement('div');
        slotEl.className = 'guide-slot';

        const displayName =
          ability.iconNames && ability.iconNames[rowIdx]
            ? ability.iconNames[rowIdx]
            : displayAbilityName(ability);
        slotEl.dataset.abilityName = displayName;

        const k = abilityKey(ability);
        if (!guideSlotMap.has(k)) guideSlotMap.set(k, []);
        guideSlotMap.get(k).push({ el: slotEl, url, name: displayName });

        if (state.completedAbilities.has(k)) {
          slotEl.classList.add('done');
          slotEl.appendChild(createGuideImage(url, displayName, slotEl));
        }

        rowEl.appendChild(slotEl);
      }

      slotsWrap.appendChild(rowEl);
    }

    row.appendChild(slotsWrap);
    fragment.appendChild(row);
  }

  els.guideChampions.appendChild(fragment);

  if (els.guideSearch.value.trim()) {
    filterGuide(els.guideSearch.value);
  }

  updateGuideProgress();
}

function updateGuideForAbility(ability) {
  if (!state.guideEnabled) return;
  if (!ability) return;
  const k = abilityKey(ability);
  const entries = guideSlotMap.get(k);
  if (!entries) return;

  for (const entry of entries) {
    if (entry.el.classList.contains('done')) continue;
    entry.el.classList.add('done');
    entry.el.dataset.abilityName = entry.name;
    entry.el.innerHTML = '';
    entry.el.appendChild(createGuideImage(entry.url, entry.name, entry.el));
  }

  updateGuideProgress();
}

function updateGuideProgress() {
  if (!els.guideProgress) return;

  const byChampion = new Map();
  for (const a of state.abilityPool) {
    if (!byChampion.has(a.championKey)) byChampion.set(a.championKey, []);
    byChampion.get(a.championKey).push(a);
  }

  let done = 0;
  for (const [, abilities] of byChampion) {
    if (abilities.every((a) => state.completedAbilities.has(abilityKey(a)))) {
      done++;
    }
  }

  els.guideProgress.textContent = `${done} / ${byChampion.size}`;
}

function filterGuide(query) {
  const q = query.trim().toLowerCase();
  const rows = els.guideChampions.querySelectorAll('.guide-champion');
  rows.forEach((row) => {
    const name = row.dataset.championName || '';
    row.style.display = !q || name.toLowerCase().includes(q) ? '' : 'none';
  });
}