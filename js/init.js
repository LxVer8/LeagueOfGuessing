// ============================================================
//  init.js — Bootstrap + locale switching
//  Load order: 13 (last)
// ============================================================

function setLocale(loc) {
  if (loc !== 'en' && loc !== 'es') return;
  if (loc === state.locale) return;

  state.locale = loc;
  saveLocale(loc);

  els.langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.locale === loc);
  });

  applyLocaleToStaticUI();

  // Refresh dynamic UI that carries localized text.
  if (state.guideEnabled) buildGuide();

  if (state.currentAbility) {
    els.abilityName.textContent = displayAbilityName(state.currentAbility);
    els.abilityIcon.alt = displayAbilityName(state.currentAbility);
  }

  // If the player had a champion picked/typed, refresh its displayed name.
  if (state.selectedChampionKey) {
    const c = findChampionByKey(state.selectedChampionKey);
    if (c) els.championInput.value = displayChampionName(c);
  }

  updateHundredProgressUI();
  updateScoreUI();
  updateLivesUI();
}

async function init() {
  // Locale first so any early t() call resolves correctly.
  state.locale = loadLocale();
  els.langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.locale === state.locale);
  });
  applyLocaleToStaticUI();

  wireEvents();

  state.personalBest = loadPersonalBest();
  updateScoreUI();
  updateLivesUI();

  try {
    await loadAllData();

    const savedHundred = loadHundredState();
    if (savedHundred && savedHundred.enabled) {
      state.hundredPercentEnabled = true;
      els.hundredEnabled.checked = true;
      els.guideRow.classList.remove('hidden');
      els.hundredProgressRow.classList.remove('hidden');
      els.restartProgressBtn.classList.remove('hidden');

      const validKeys = new Set(state.abilityPool.map(abilityKey));
      state.completedAbilities = new Set(
        savedHundred.completed.filter((k) => validKeys.has(k))
      );

      if (savedHundred.guideEnabled) {
        state.guideEnabled = true;
        els.guideEnabled.checked = true;
        els.guidePanel.classList.remove('hidden');
        buildGuide();
      }
    }

    const savedLine = loadLineState();
    if (savedLine && savedLine.enabled && !state.hundredPercentEnabled) {
      state.lineEnabled = true;
      state.lineRole = savedLine.role || 'top';
      els.lineEnabled.checked = true;
      els.roleSelector.classList.remove('hidden');
      els.roleButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.role === state.lineRole);
      });
    }

    updateHundredProgressUI();

    backgroundPreloadPool(6);
    await startNewRound();
  } catch (err) {
    console.error(err);
    setFeedback(`⚠ ${err.message}`, 'wrong');
    els.abilityName.textContent = 'Error';
    els.guessBtn.disabled = true;
  }
}

init();