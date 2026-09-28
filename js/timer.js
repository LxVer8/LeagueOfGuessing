// ============================================================
//  timer.js — Round countdown
//  Load order: 4
// ============================================================

function startTimer() {
  stopTimer();
  if (!timerState.enabled) return;
  timerState.remaining = timerState.duration;
  timerState.startedAt = performance.now();
  updateTimerUI();
  timerState.intervalId = setInterval(tickTimer, 50);
}

function stopTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  els.timerBar.classList.remove('low');
}

function tickTimer() {
  const elapsed = (performance.now() - timerState.startedAt) / 1000;
  const remaining = Math.max(0, timerState.duration - elapsed);
  timerState.remaining = remaining;
  updateTimerUI();
  if (remaining <= 0) {
    stopTimer();
    handleTimeout();
  }
}

function updateTimerUI() {
  const pct = timerState.duration > 0 ? timerState.remaining / timerState.duration : 0;
  els.timerFill.style.transform = `scaleX(${pct})`;
  els.timerText.textContent = timerState.remaining.toFixed(1) + 's';
  els.timerBar.classList.toggle('low', pct <= 0.25);
}

function setTimerEnabled(enabled) {
  timerState.enabled = enabled;
  els.timerWrap.classList.toggle('hidden', !enabled);
  if (!enabled) {
    stopTimer();
  } else if (state.currentAbility && !state.isAnswered) {
    startTimer();
  }
}