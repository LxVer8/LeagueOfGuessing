// ============================================================
//  events.js — All DOM event listeners
//  Load order: 11
// ============================================================

function wireEvents() {
  // Champion search
  els.championInput.addEventListener('input', (e) => {
    state.selectedChampionKey = null;
    showAutocomplete(e.target.value);
  });

  els.championInput.addEventListener('keydown', (e) => {
    handleAutocompleteKeydown(e);
    if (e.key === 'Enter' && !els.autocomplete.classList.contains('visible')) {
      e.preventDefault();
      if (!state.isAnswered) handleGuess();
    }
  });

  els.championInput.addEventListener('focus', () => {
    if (els.championInput.value.trim()) {
      showAutocomplete(els.championInput.value);
    }
  });

  els.autocomplete.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li');
    if (li) { e.preventDefault(); commitAutocompleteSelection(li); }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) hideAutocomplete();
  });

  // Slots
  els.slotRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn || state.isAnswered) return;
    clearSlotSelection();
    btn.classList.add('selected');
    state.selectedSlot = btn.dataset.slot;
  });

  // Guess / Next
  els.guessBtn.addEventListener('click', handleGuess);
  els.nextBtn.addEventListener('click', startNewRound);

  // Display mode
  els.modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      els.modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      applyMode();
    });
  });

  // Language toggle
  els.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLocale(btn.dataset.locale));
  });

  // Timer
  els.timerEnabled.addEventListener('change', (e) => setTimerEnabled(e.target.checked));
  els.timerSeconds.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    timerState.duration = Math.max(3, Math.min(300, val));
  });
  els.timerSeconds.addEventListener('blur', (e) => {
    const val = parseInt(e.target.value, 10);
    const clamped = isNaN(val) ? 15 : Math.max(3, Math.min(300, val));
    e.target.value = clamped;
    timerState.duration = clamped;
  });

  // Lives
  els.livesEnabled.addEventListener('change', (e) => setLivesEnabled(e.target.checked));
  els.livesCount.addEventListener('input', (e) => {
    if (state.runStarted) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(10, val));
    state.livesStarting = clamped;
    state.lives = clamped;
    updateLivesUI();
  });
  els.livesCount.addEventListener('blur', (e) => {
    if (state.runStarted) return;
    const val = parseInt(e.target.value, 10);
    const clamped = isNaN(val) ? 3 : Math.max(1, Math.min(10, val));
    e.target.value = clamped;
    state.livesStarting = clamped;
    state.lives = clamped;
    updateLivesUI();
  });

  // 100% mode
  els.hundredEnabled.addEventListener('change', (e) => setHundredPercentEnabled(e.target.checked));
  els.guideEnabled.addEventListener('change', (e) => setGuideEnabled(e.target.checked));
  els.guideSearch.addEventListener('input', (e) => filterGuide(e.target.value));
  els.restartProgressBtn.addEventListener('click', restartHundredProgress);

  // Line% mode
  els.lineEnabled.addEventListener('change', (e) => setLineEnabled(e.target.checked));
  els.roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLineRole(btn.dataset.role));
  });

  // Dev panel
  els.devToggle.addEventListener('click', () => toggleDevPanel());
  els.devUnlockBtn.addEventListener('click', devUnlockChampionAbilities);
  els.devChampionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      devUnlockChampionAbilities();
    } else if (e.key === 'Escape') {
      toggleDevPanel(false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dev-panel') && els.devPanel.classList.contains('open')) {
      toggleDevPanel(false);
    }
  });
}