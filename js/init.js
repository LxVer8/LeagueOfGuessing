// ============================================================
//  init.js — Bootstrap
//  Load order: 11 (last)
// ============================================================

async function init() {
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