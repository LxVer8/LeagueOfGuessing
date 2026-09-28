// ============================================================
//  LoL Ability Guesser
//  Data: Data Dragon (champions) + abilityIcons.json (HD icons)
//        + championRoles.json (lane assignments for Line% mode)
// ============================================================

// ---------- Config ----------
const DDRAGON_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';
const ICON_MAP_URL = 'abilityIcons.json';
const ROLES_MAP_URL = 'championRoles.json';
const STORAGE_KEY_PB = 'lolGuesser.personalBest';
const STORAGE_KEY_HUNDRED = 'lolGuesser.hundredMode';
const STORAGE_KEY_LINE = 'lolGuesser.lineMode';

// ---------- State ----------
const state = {
  version: '',
  allChampions: [],
  abilityPool: [],
  currentAbility: null,
  selectedChampionKey: null,
  selectedSlot: null,
  isAnswered: false,
  mode: 'both',
  score: 0,
  personalBest: 0,
  livesEnabled: false,
  livesStarting: 3,
  lives: 3,
  runStarted: false,
  hundredPercentEnabled: false,
  guideEnabled: false,
  completedAbilities: new Set(),
  lineEnabled: false,
  lineRole: 'top',
  championRoles: {},
  roleChampionMap: { top: new Set(), jungle: new Set(), mid: new Set(), bot: new Set(), support: new Set() },
};

// ---------- Timer State ----------
const timerState = {
  enabled: false,
  duration: 15,
  remaining: 15,
  intervalId: null,
  startedAt: 0,
};

// ---------- Guide DOM map ----------
const guideSlotMap = new Map();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const bodyEl = document.body;
const els = {
  abilityDisplay: $('abilityDisplay'),
  abilityIconWrap: $('abilityIconWrap'),
  abilityIcon: $('abilityIcon'),
  abilityName: $('abilityName'),
  championInput: $('championInput'),
  autocomplete: $('autocomplete'),
  slotRow: $('slotRow'),
  guessBtn: $('guessBtn'),
  nextBtn: $('nextBtn'),
  feedback: $('feedback'),
  scoreValue: $('scoreValue'),
  personalBestValue: $('personalBestValue'),
  modeButtons: document.querySelectorAll('.mode-btn'),
  timerWrap: $('timerWrap'),
  timerBar: $('timerBar'),
  timerFill: $('timerFill'),
  timerText: $('timerText'),
  timerEnabled: $('timerEnabled'),
  timerSeconds: $('timerSeconds'),
  livesEnabled: $('livesEnabled'),
  livesCount: $('livesCount'),
  livesRow: $('livesRow'),
  livesDisplay: $('livesDisplay'),
  hundredEnabled: $('hundredEnabled'),
  hundredProgressRow: $('hundredProgressRow'),
  hundredProgress: $('hundredProgress'),
  guideRow: $('guideRow'),
  guideEnabled: $('guideEnabled'),
  guidePanel: $('guidePanel'),
  guideChampions: $('guideChampions'),
  guideProgress: $('guideProgress'),
  guideSearch: $('guideSearch'),
  restartProgressBtn: $('restartProgressBtn'),
  gameoverOverlay: $('gameoverOverlay'),
  lineEnabled: $('lineEnabled'),
  roleSelector: $('roleSelector'),
  roleButtons: document.querySelectorAll('.role-btn'),
  // Dev panel
  devPanel: $('devPanel'),
  devToggle: $('devToggle'),
  devBody: $('devBody'),
  devChampionInput: $('devChampionInput'),
  devUnlockBtn: $('devUnlockBtn'),
  devStatus: $('devStatus'),
};

// ============================================================
//  UTILITIES
// ============================================================

function normalizeName(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function setRoundState(s) { bodyEl.dataset.state = s; }

function setFeedback(msg, cls = '') {
  els.feedback.textContent = msg;
  els.feedback.className = 'feedback ' + cls;
}

function setFeedbackHtml(html, cls = '') {
  els.feedback.innerHTML = html;
  els.feedback.className = 'feedback ' + cls;
}

function buildAbilityPill(ability) {
  if (!ability) return '';
  const icon = escapeHtml(ability.iconUrl);
  const name = escapeHtml(ability.abilityName);
  return `<span class="ability-pill">` +
    `<img class="ability-pill-icon" src="${icon}" alt="${name}" loading="eager">` +
    `<span class="ability-pill-name">(${name})</span>` +
  `</span>`;
}

function findChampionNameByKey(key) {
  const c = state.allChampions.find((c) => c.key === key);
  return c ? c.name : '???';
}

function findAbilityByChampionAndSlot(championKey, slot) {
  return state.abilityPool.find(
    (a) => a.championKey === championKey && a.slot === slot
  ) || null;
}

function abilityKey(a) { return `${a.championKey}|${a.slot}`; }

function isAbilityCompleted(a) { return state.completedAbilities.has(abilityKey(a)); }

// ---------- LocalStorage: Personal Best ----------
function loadPersonalBest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PB);
    const v = parseInt(raw, 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch { return 0; }
}

function savePersonalBest(v) {
  try { localStorage.setItem(STORAGE_KEY_PB, String(v)); } catch {}
}

// ---------- LocalStorage: 100% Mode ----------
function loadHundredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HUNDRED);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      guideEnabled: !!parsed.guideEnabled,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch { return null; }
}

function saveHundredState() {
  try {
    localStorage.setItem(STORAGE_KEY_HUNDRED, JSON.stringify({
      enabled: state.hundredPercentEnabled,
      guideEnabled: state.guideEnabled,
      completed: [...state.completedAbilities],
    }));
  } catch {}
}

// ---------- LocalStorage: Line% Mode ----------
function loadLineState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validRoles = ['top', 'jungle', 'mid', 'bot', 'support'];
    return {
      enabled: !!parsed.enabled,
      role: validRoles.includes(parsed.role) ? parsed.role : 'top',
    };
  } catch { return null; }
}

function saveLineState() {
  try {
    localStorage.setItem(STORAGE_KEY_LINE, JSON.stringify({
      enabled: state.lineEnabled,
      role: state.lineRole,
    }));
  } catch {}
}

// ============================================================
//  IMAGE PRELOADING
// ============================================================

const imageCache = new Map();

function preloadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load: ' + url));
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

function backgroundPreloadPool(concurrency = 6) {
  const urls = [];
  for (const a of state.abilityPool) {
    urls.push(a.iconUrl);
    if (a.iconUrl2) urls.push(a.iconUrl2);
  }
  let index = 0;
  async function worker() {
    while (index < urls.length) {
      const url = urls[index++];
      try { await preloadImage(url); } catch {}
    }
  }
  for (let i = 0; i < concurrency; i++) worker();
}

// ============================================================
//  ABILITY PICKING
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

// ============================================================
//  TIMER
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

// ============================================================
//  LIVES / GAMEMODE UI
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

// ============================================================
//  GUIDE PANEL
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

function createGuideSlot(ability, kind, isDone) {
  const slotEl = document.createElement('div');
  slotEl.className = 'guide-slot';

  if (!ability) {
    slotEl.style.visibility = 'hidden';
    return slotEl;
  }

  const url = kind === 'primary' ? ability.iconUrl : ability.iconUrl2;
  if (!url) {
    slotEl.style.visibility = 'hidden';
    return slotEl;
  }

  if (isDone) {
    slotEl.classList.add('done');
    const img = document.createElement('img');
    img.src = url;
    img.alt = ability.abilityName;
    slotEl.appendChild(img);
  }

  return slotEl;
}

function buildGuide() {
  if (!state.guideEnabled) return;
  if (state.abilityPool.length === 0) return;

  guideSlotMap.clear();
  els.guideChampions.innerHTML = '';

  const byChampion = new Map();
  for (const ability of state.abilityPool) {
    if (!byChampion.has(ability.championKey)) {
      byChampion.set(ability.championKey, {
        championKey: ability.championKey,
        championName: ability.championName,
        abilities: {},
      });
    }
    byChampion.get(ability.championKey).abilities[ability.slot] = ability;
  }

  const champions = [...byChampion.values()].sort((a, b) =>
    a.championName.localeCompare(b.championName)
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

    // Primary row
    const slotsRow1 = document.createElement('div');
    slotsRow1.className = 'guide-slots';

    for (const slot of SLOTS) {
      const ability = champ.abilities[slot];
      const isDone = ability && state.completedAbilities.has(abilityKey(ability));
      const slotEl = createGuideSlot(ability, 'primary', isDone);
      slotsRow1.appendChild(slotEl);

      if (ability) {
        const entry = guideSlotMap.get(abilityKey(ability)) || {};
        entry.primary = slotEl;
        guideSlotMap.set(abilityKey(ability), entry);
      }
    }
    slotsWrap.appendChild(slotsRow1);

    // Secondary row (only if at least one slot has a second icon)
    const hasSecondary = SLOTS.some((slot) => {
      const a = champ.abilities[slot];
      return a && a.iconUrl2;
    });

    if (hasSecondary) {
      const slotsRow2 = document.createElement('div');
      slotsRow2.className = 'guide-slots guide-slots-secondary';

      for (const slot of SLOTS) {
        const ability = champ.abilities[slot];
        const isDone = ability && state.completedAbilities.has(abilityKey(ability));
        const slotEl = createGuideSlot(ability, 'secondary', isDone);
        slotsRow2.appendChild(slotEl);

        if (ability && ability.iconUrl2) {
          const entry = guideSlotMap.get(abilityKey(ability)) || {};
          entry.secondary = slotEl;
          guideSlotMap.set(abilityKey(ability), entry);
        }
      }
      slotsWrap.appendChild(slotsRow2);
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
  const entry = guideSlotMap.get(k);
  if (!entry) return;

  // Reveal primary
  if (entry.primary && !entry.primary.classList.contains('done')) {
    entry.primary.classList.add('done');
    entry.primary.style.visibility = '';
    entry.primary.innerHTML = '';
    const img = document.createElement('img');
    img.src = ability.iconUrl;
    img.alt = ability.abilityName;
    entry.primary.appendChild(img);
  }

  // Reveal secondary
  if (entry.secondary && ability.iconUrl2 && !entry.secondary.classList.contains('done')) {
    entry.secondary.classList.add('done');
    entry.secondary.style.visibility = '';
    entry.secondary.innerHTML = '';
    const img = document.createElement('img');
    img.src = ability.iconUrl2;
    img.alt = ability.abilityName;
    entry.secondary.appendChild(img);
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

// ============================================================
//  DEV PANEL
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

  // Exact name or exact DDragon key
  let match = state.allChampions.find(
    (c) => normalizeName(c.name) === norm || normalizeName(c.key) === norm
  );
  if (match) return match;

  // Prefix match on name
  match = state.allChampions.find((c) => normalizeName(c.name).startsWith(norm));
  if (match) return match;

  // Substring match
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

  // Clear the success message after a moment.
  clearTimeout(devUnlockChampionAbilities._t);
  devUnlockChampionAbilities._t = setTimeout(() => {
    if (els.devStatus.classList.contains('ok')) setDevStatus('');
  }, 2500);
}

// ============================================================
//  DATA LOADING
// ============================================================

async function loadAllData() {
  setFeedback('Loading champions…', 'info');
  els.abilityName.textContent = 'Loading…';

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
    iconMapByName.has(normalizeName(c.name))
  );

  console.log(`[Guesser] Fetching full data for ${wanted.length} champions…`);

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

  console.log(`✅ Ready — ${state.allChampions.length} champions, ${state.abilityPool.length} abilities.`);
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

// ============================================================
//  ABILITY POOL
// ============================================================

function findAbilityIcons(iconEntry, abilityName) {
  const parts = String(abilityName)
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

  return { primary: findIconUrl(iconEntry, abilityName), secondary: null };
}

function buildAbilityPool(championDataList, iconMapByName) {
  const SLOTS = ['Q', 'W', 'E', 'R'];
  let matchedChamps = 0;
  let dualFormCount = 0;
  const unmatchedDetails = [];

  for (const champ of championDataList) {
    if (!champ) continue;
    const iconEntry = iconMapByName.get(normalizeName(champ.name));
    if (!iconEntry) continue;

    let addedAny = false;

    if (champ.passive && champ.passive.name) {
      const { primary, secondary } = findAbilityIcons(iconEntry, champ.passive.name);
      if (primary) {
        state.abilityPool.push({
          championKey: champ.id,
          championName: champ.name,
          abilityName: champ.passive.name,
          slot: 'P',
          iconUrl: primary,
          iconUrl2: secondary || null,
        });
        if (secondary) dualFormCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${champ.name} [P] "${champ.passive.name}"`);
      }
    }

    (champ.spells || []).forEach((spell, idx) => {
      if (!spell || !spell.name) return;
      const { primary, secondary } = findAbilityIcons(iconEntry, spell.name);
      if (primary) {
        state.abilityPool.push({
          championKey: champ.id,
          championName: champ.name,
          abilityName: spell.name,
          slot: SLOTS[idx],
          iconUrl: primary,
          iconUrl2: secondary || null,
        });
        if (secondary) dualFormCount++;
        addedAny = true;
      } else {
        unmatchedDetails.push(`${champ.name} [${SLOTS[idx]}] "${spell.name}"`);
      }
    });

    if (addedAny) matchedChamps++;
  }

  console.log(
    `[Guesser] Ability pool: ${state.abilityPool.length} abilities from ${matchedChamps} champions ` +
    `(${dualFormCount} dual-form abilities).`
  );
  if (unmatchedDetails.length > 0) {
    console.log(
      `[Guesser] ${unmatchedDetails.length} abilities had no icon match:`,
      unmatchedDetails
    );
  }
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

// ============================================================
//  SCORE / PERSONAL BEST
// ============================================================

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

// ============================================================
//  ROUND MANAGEMENT
// ============================================================

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
      els.abilityName.textContent = 'No abilities available for this role.';
      els.guessBtn.disabled = true;
      els.nextBtn.classList.add('hidden');
    }
    return;
  }

  const loadPromise = preloadImage(ability.iconUrl).catch(() => null);

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
  els.abilityIcon.src = ability.iconUrl;
  els.abilityIcon.alt = ability.abilityName;
  els.abilityName.textContent = ability.abilityName;
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
  els.abilityName.textContent = '100% Complete!';
  setRoundState('correct');
  setFeedbackHtml(`🎉 You mastered every ability! Final score: ${state.score}`, 'correct');
}

function applyMode() {
  els.abilityDisplay.classList.remove('mode-icon', 'mode-name');
  if (state.mode === 'icon') els.abilityDisplay.classList.add('mode-icon');
  if (state.mode === 'name') els.abilityDisplay.classList.add('mode-name');
}

function clearSlotSelection() {
  document.querySelectorAll('.slot').forEach((b) => b.classList.remove('selected'));
}

function lockLivesConfig() {
  els.livesCount.disabled = true;
  els.livesEnabled.disabled = true;
}

function unlockLivesConfig() {
  els.livesCount.disabled = false;
  els.livesEnabled.disabled = false;
}

// ============================================================
//  ANSWER HANDLING
// ============================================================

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
      setFeedback('Type a champion name first.', 'wrong');
      return;
    }
    const norm = normalizeName(typed);
    const match = state.allChampions.find((c) => normalizeName(c.name) === norm);
    if (!match) {
      setFeedback('Champion not recognized. Pick from the list.', 'wrong');
      return;
    }
    champKey = match.key;
  }

  if (!state.selectedSlot) {
    setFeedback('Pick an ability slot (P / Q / W / E / R).', 'wrong');
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

  const correctLabel = `${escapeHtml(correct.championName)}'s ${correct.slot}`;
  const guessedChampionName = findChampionNameByKey(champKey);
  const guessedLabel = `${escapeHtml(guessedChampionName)}'s ${state.selectedSlot}`;
  const guessedAbility = findAbilityByChampionAndSlot(champKey, state.selectedSlot);
  const guessedPill = guessedAbility ? buildAbilityPill(guessedAbility) : '';

  if (bothCorrect) {
    registerCorrectAnswer();
    setFeedbackHtml(`Correct. It was ${correctLabel}`, 'correct');
  } else {
    registerWrongAnswer();
    setFeedbackHtml(
      `Wrong. It was ${correctLabel}. You picked ${guessedLabel} ${guessedPill}`,
      'wrong'
    );
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
  const correctLabel = `${escapeHtml(correct.championName)}'s ${correct.slot}`;
  const pill = buildAbilityPill(correct);

  registerWrongAnswer();
  setFeedbackHtml(`Time's up! It was ${correctLabel} ${pill}`, 'wrong');
}

// ============================================================
//  AUTOCOMPLETE
// ============================================================

let autocompleteIndex = -1;

function hideAutocomplete() {
  els.autocomplete.classList.remove('visible');
  els.autocomplete.innerHTML = '';
  autocompleteIndex = -1;
}

function showAutocomplete(query) {
  const q = normalizeName(query);
  if (!q) { hideAutocomplete(); return; }

  const matches = state.allChampions
    .filter((c) => normalizeName(c.name).includes(q))
    .slice(0, 8);

  if (matches.length === 0) { hideAutocomplete(); return; }

  els.autocomplete.innerHTML = matches
    .map((c, i) => {
      const iconUrl = `${DDRAGON_CDN}/${state.version}/img/champion/${c.key}.png`;
      return `<li data-key="${c.key}" data-index="${i}">
        <img src="${iconUrl}" alt="">
        <span>${escapeHtml(c.name)}</span>
      </li>`;
    })
    .join('');

  els.autocomplete.classList.add('visible');
  autocompleteIndex = -1;
}

function commitAutocompleteSelection(li) {
  const key = li.dataset.key;
  const champ = state.allChampions.find((c) => c.key === key);
  if (!champ) return;
  els.championInput.value = champ.name;
  state.selectedChampionKey = champ.key;
  hideAutocomplete();
}

function handleAutocompleteKeydown(e) {
  const items = els.autocomplete.querySelectorAll('li');
  if (!els.autocomplete.classList.contains('visible') || items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    autocompleteIndex = (autocompleteIndex + 1) % items.length;
    updateAutocompleteHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    autocompleteIndex = (autocompleteIndex - 1 + items.length) % items.length;
    updateAutocompleteHighlight(items);
  } else if (e.key === 'Enter') {
    if (autocompleteIndex >= 0) {
      e.preventDefault();
      commitAutocompleteSelection(items[autocompleteIndex]);
    }
  } else if (e.key === 'Escape') {
    hideAutocomplete();
  }
}

function updateAutocompleteHighlight(items) {
  items.forEach((li, i) => li.classList.toggle('active', i === autocompleteIndex));
  if (autocompleteIndex >= 0 && items[autocompleteIndex]) {
    items[autocompleteIndex].scrollIntoView({ block: 'nearest' });
  }
}

// ============================================================
//  EVENT WIRING
// ============================================================

function wireEvents() {
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

  els.slotRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn || state.isAnswered) return;
    clearSlotSelection();
    btn.classList.add('selected');
    state.selectedSlot = btn.dataset.slot;
  });

  els.guessBtn.addEventListener('click', handleGuess);
  els.nextBtn.addEventListener('click', startNewRound);

  els.modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      els.modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      applyMode();
    });
  });

  els.timerEnabled.addEventListener('change', (e) => {
    setTimerEnabled(e.target.checked);
  });

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

  els.livesEnabled.addEventListener('change', (e) => {
    setLivesEnabled(e.target.checked);
  });

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

  els.hundredEnabled.addEventListener('change', (e) => {
    setHundredPercentEnabled(e.target.checked);
  });

  els.guideEnabled.addEventListener('change', (e) => {
    setGuideEnabled(e.target.checked);
  });

  els.guideSearch.addEventListener('input', (e) => {
    filterGuide(e.target.value);
  });

  els.restartProgressBtn.addEventListener('click', restartHundredProgress);

  els.lineEnabled.addEventListener('change', (e) => {
    setLineEnabled(e.target.checked);
  });

  els.roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setLineRole(btn.dataset.role);
    });
  });

  // --- Dev panel ---
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

// ============================================================
//  INIT
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