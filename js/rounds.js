// ============================================================
//  rounds.js — Round flow, guessing, answer handling
//  Load order: 9
// ============================================================

function pickRandomAbility() {
  let pool = state.abilityPool;

  if (state.hundredPercentEnabled) {
    pool = pool.filter((a) => !isAbilityCompleted(a));
  }

  if (state.lineEnabled && state.lineRole) {
    const allowed = state.roleChampionMap[state.lineRole];
    if (allowed && allowed.size > 0) {
      pool = pool.filter((a) => allowed.has(a.championKey));
    } else {
      return null;
    }
  }

  if (pool.length === 0) return null;

  if (pool.length > 1 && state.currentAbility) {
    const prevKey = abilityKey(state.currentAbility);
    const filtered = pool.filter((a) => abilityKey(a) !== prevKey);
    if (filtered.length > 0) pool = filtered;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function updateScoreUI() {
  els.scoreValue.textContent = state.score;
  els.personalBestValue.textContent = state.personalBest;
}

function animateScore() {
  updateScoreUI();
  els.scoreValue.classList.remove('pop');
  void els.scoreValue.offsetWidth;
  els.scoreValue.classList.add('pop');
}

async function startNewRound() {
  stopTimer();
  hideGameOverOverlay();

  if (state.livesEnabled && state.lives === 0) {
    state.lives = state.livesStarting;
    updateLivesUI();
  }

  const ability = pickRandomAbility();

  if (!ability) {
    if (state.hundredPercentEnabled) {
      handleHundredPercentComplete();
    } else if (state.lineEnabled) {
      els.abilityName.textContent = t('noAbilitiesForRole');
      els.guessBtn.disabled = true;
      els.nextBtn.classList.add('hidden');
    }
    return;
  }

  const primaryIcon = ability.iconUrl || (ability.icons && ability.icons[0]) || '';
  const loadPromise = preloadImage(primaryIcon).catch(() => null);

  state.isAnswered = false;
  state.selectedSlot = null;
  state.selectedChampionKey = null;
  els.championInput.value = '';
  els.championInput.disabled = false;
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.nextBtn.classList.add('hidden');
  els.guessBtn.classList.remove('hidden');
  els.guessBtn.disabled = false;
  setRoundState('waiting');
  hideAutocomplete();
  clearSlotSelection();

  els.abilityIcon.classList.add('loading');

  await loadPromise;

  state.currentAbility = ability;
  els.abilityIcon.src = primaryIcon;
  els.abilityIcon.alt = displayAbilityName(ability);
  els.abilityName.textContent = displayAbilityName(ability);
  els.abilityIcon.classList.remove('loading');

  applyMode();

  if (timerState.enabled) startTimer();

  if (window.matchMedia('(pointer: fine)').matches) {
    els.championInput.focus();
  }
}

function handleHundredPercentComplete() {
  state.isAnswered = true;
  state.currentAbility = null;
  els.championInput.disabled = true;
  els.guessBtn.classList.add('hidden');
  els.nextBtn.classList.add('hidden');
  els.abilityIcon.classList.add('loading');
  els.abilityName.textContent = t('hundredComplete');
  setRoundState('correct');
  setFeedbackHtml(t('hundredCompleteMsg', state.score), 'correct');
}

function applyMode() {
  els.abilityDisplay.classList.remove('mode-icon', 'mode-name');
  if (state.mode === 'icon') els.abilityDisplay.classList.add('mode-icon');
  if (state.mode === 'name') els.abilityDisplay.classList.add('mode-name');
}

function clearSlotSelection() {
  document.querySelectorAll('.slot').forEach((b) => b.classList.remove('selected'));
}

function registerCorrectAnswer() {
  state.score += 1;
  if (state.score > state.personalBest) {
    state.personalBest = state.score;
    savePersonalBest(state.personalBest);
  }

  if (state.hundredPercentEnabled && state.currentAbility) {
    state.completedAbilities.add(abilityKey(state.currentAbility));
    updateHundredProgressUI();
    updateGuideForAbility(state.currentAbility);
    saveHundredState();
  }

  setRoundState('correct');
  animateScore();
  lockInputs();
}

function registerWrongAnswer() {
  setRoundState('wrong');

  if (state.livesEnabled) {
    state.lives = Math.max(0, state.lives - 1);
    updateLivesUI();

    if (state.lives === 0) {
      state.score = 0;
      state.runStarted = false;
      unlockLivesConfig();
      updateScoreUI();
      showGameOverOverlay();
    }
  } else {
    state.score -= 1;
  }

  animateScore();
  lockInputs();
}

function lockInputs() {
  els.championInput.disabled = true;
  els.guessBtn.disabled = true;
  els.guessBtn.classList.add('hidden');
  els.nextBtn.classList.remove('hidden');
  els.nextBtn.focus();
}

function handleGuess() {
  if (state.isAnswered) return;

  let champKey = state.selectedChampionKey;
  if (!champKey) {
    const typed = els.championInput.value.trim();
    if (!typed) {
      setFeedback(t('typeChampionFirst'), 'wrong');
      return;
    }
    const norm = normalizeName(typed);
    const match = state.allChampions.find(
      (c) =>
        normalizeName(c.names.en) === norm ||
        normalizeName(c.names.es) === norm ||
        normalizeName(c.key) === norm
    );
    if (!match) {
      setFeedback(t('championNotRecognized'), 'wrong');
      return;
    }
    champKey = match.key;
  }

  if (!state.selectedSlot) {
    setFeedback(t('pickSlot'), 'wrong');
    return;
  }

  if (state.livesEnabled && !state.runStarted) {
    state.runStarted = true;
    lockLivesConfig();
  }

  stopTimer();

  const correct = state.currentAbility;
  const champCorrect = champKey === correct.championKey;
  const slotCorrect = state.selectedSlot === correct.slot;
  const bothCorrect = champCorrect && slotCorrect;

  state.isAnswered = true;

  const correctLabel = `${escapeHtml(displayAbilityChampion(correct))}'s ${correct.slot}`;
  const guessedChampion = findChampionByKey(champKey);
  const guessedLabel = `${escapeHtml(displayChampionName(guessedChampion))}'s ${state.selectedSlot}`;
  const guessedAbility = findAbilityByChampionAndSlot(champKey, state.selectedSlot);
  const guessedPill = guessedAbility ? buildAbilityPill(guessedAbility) : '';

  if (bothCorrect) {
    registerCorrectAnswer();
    setFeedbackHtml(t('correct', correctLabel), 'correct');
  } else {
    registerWrongAnswer();
    setFeedbackHtml(t('wrong', correctLabel, guessedLabel, guessedPill), 'wrong');
  }
}

function handleTimeout() {
  if (state.isAnswered) return;

  if (state.livesEnabled && !state.runStarted) {
    state.runStarted = true;
    lockLivesConfig();
  }

  state.isAnswered = true;

  const correct = state.currentAbility;
  const correctLabel = `${escapeHtml(displayAbilityChampion(correct))}'s ${correct.slot}`;
  const pill = buildAbilityPill(correct);

  registerWrongAnswer();
  setFeedbackHtml(t('timesUp', correctLabel, pill), 'wrong');
}