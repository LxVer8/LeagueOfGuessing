// ============================================================
//  dev.js — Developer tools panel
//  Load order: 7
// ============================================================

function setDevStatus(msg, kind = '') {
  els.devStatus.textContent = msg;
  els.devStatus.className = 'dev-status' + (kind ? ' ' + kind : '');
}

function toggleDevPanel(force) {
  const open = typeof force === 'boolean' ? force : !els.devPanel.classList.contains('open');
  els.devPanel.classList.toggle('open', open);
  els.devBody.classList.toggle('hidden', !open);
  if (open) {
    els.devChampionInput.focus();
  } else {
    els.devChampionInput.value = '';
    setDevStatus('');
  }
}

function devFindChampion(query) {
  const norm = normalizeName(query);
  if (!norm) return null;

  let match = state.allChampions.find(
    (c) => normalizeName(c.name) === norm || normalizeName(c.key) === norm
  );
  if (match) return match;

  match = state.allChampions.find((c) => normalizeName(c.name).startsWith(norm));
  if (match) return match;

  match = state.allChampions.find((c) => normalizeName(c.name).includes(norm));
  return match || null;
}

function devUnlockChampionAbilities() {
  if (!state.hundredPercentEnabled) {
    setDevStatus('Enable 100% mode first.', 'error');
    return;
  }

  const query = els.devChampionInput.value.trim();
  if (!query) {
    setDevStatus('Type a champion name.', 'error');
    return;
  }

  const champ = devFindChampion(query);
  if (!champ) {
    setDevStatus('Champion not found.', 'error');
    return;
  }

  const abilities = state.abilityPool.filter((a) => a.championKey === champ.key);
  if (abilities.length === 0) {
    setDevStatus(`${champ.name} has no abilities in the pool.`, 'error');
    return;
  }

  let unlocked = 0;
  for (const a of abilities) {
    const k = abilityKey(a);
    if (!state.completedAbilities.has(k)) {
      state.completedAbilities.add(k);
      unlocked++;
    }
    if (state.guideEnabled) updateGuideForAbility(a);
  }

  updateHundredProgressUI();
  saveHundredState();

  els.devChampionInput.value = '';
  setDevStatus(`Unlocked ${unlocked} ${unlocked === 1 ? 'ability' : 'abilities'} for ${champ.name}.`, 'ok');

  clearTimeout(devUnlockChampionAbilities._t);
  devUnlockChampionAbilities._t = setTimeout(() => {
    if (els.devStatus.classList.contains('ok')) setDevStatus('');
  }, 2500);
}