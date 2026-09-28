// ============================================================
//  gamemodes.js — Lives, 100% mode, Line% mode, Game Over
//  Load order: 6
// ============================================================

function updateLivesUI() {
  els.livesRow.classList.toggle('hidden', !state.livesEnabled);
  let html = '';
  for (let i = 0; i < state.livesStarting; i++) {
    if (i < state.lives) html += '♥';
    else html += '<span class="empty">♥</span>';
  }
  els.livesDisplay.innerHTML = html;
}

function setLivesEnabled(enabled) {
  state.livesEnabled = enabled;
  state.lives = state.livesStarting;
  state.runStarted = false;
  unlockLivesConfig();
  els.livesRow.classList.toggle('hidden', !enabled);
  updateLivesUI();
}

function lockLivesConfig() {
  els.livesCount.disabled = true;
  els.livesEnabled.disabled = true;
}

function unlockLivesConfig() {
  els.livesCount.disabled = false;
  els.livesEnabled.disabled = false;
}

function updateHundredProgressUI() {
  els.hundredProgressRow.classList.toggle('hidden', !state.hundredPercentEnabled);
  if (!state.hundredPercentEnabled) return;
  els.hundredProgress.textContent =
    `${state.completedAbilities.size} / ${state.abilityPool.length}`;
  updateGuideProgress();
}

function setHundredPercentEnabled(enabled) {
  if (enabled && state.lineEnabled) {
    state.lineEnabled = false;
    els.lineEnabled.checked = false;
    els.roleSelector.classList.add('hidden');
    saveLineState();
  }

  state.hundredPercentEnabled = enabled;
  state.completedAbilities.clear();
  updateHundredProgressUI();

  els.guideRow.classList.toggle('hidden', !enabled);
  els.restartProgressBtn.classList.toggle('hidden', !enabled);

  if (!enabled) {
    if (state.guideEnabled) {
      state.guideEnabled = false;
      els.guideEnabled.checked = false;
      els.guidePanel.classList.add('hidden');
    }
  } else if (state.guideEnabled) {
    els.guidePanel.classList.remove('hidden');
    buildGuide();
  }

  saveHundredState();
  startNewRound();
}

function setLineEnabled(enabled) {
  if (enabled && state.hundredPercentEnabled) {
    state.hundredPercentEnabled = false;
    els.hundredEnabled.checked = false;
    els.guideRow.classList.add('hidden');
    els.hundredProgressRow.classList.add('hidden');
    els.restartProgressBtn.classList.add('hidden');
    if (state.guideEnabled) {
      state.guideEnabled = false;
      els.guideEnabled.checked = false;
      els.guidePanel.classList.add('hidden');
    }
    state.completedAbilities.clear();
    updateHundredProgressUI();
    saveHundredState();
  }

  state.lineEnabled = enabled;
  els.roleSelector.classList.toggle('hidden', !enabled);
  saveLineState();
  startNewRound();
}

function setLineRole(role) {
  const validRoles = ['top', 'jungle', 'mid', 'bot', 'support'];
  if (!validRoles.includes(role)) return;
  state.lineRole = role;
  els.roleButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });
  saveLineState();
  startNewRound();
}

function showGameOverOverlay() {
  els.gameoverOverlay.classList.remove('hidden');
  els.gameoverOverlay.setAttribute('aria-hidden', 'false');
}

function hideGameOverOverlay() {
  els.gameoverOverlay.classList.add('hidden');
  els.gameoverOverlay.setAttribute('aria-hidden', 'true');
}