// ============================================================
//  utils.js — Pure helpers, storage, image preloading
//  Load order: 3
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

// ---------- Localized name helpers ----------
function displayChampionName(champ) {
  if (!champ) return '???';
  if (champ.names) return champ.names[state.locale] || champ.names.en || champ.name || '???';
  return champ.name || '???';
}

function displayAbilityName(ability) {
  if (!ability) return '';
  if (ability.abilityNames) {
    return ability.abilityNames[state.locale] || ability.abilityNames.en || ability.abilityName || '';
  }
  return ability.abilityName || '';
}

function displayAbilityChampion(ability) {
  if (!ability) return '???';
  if (ability.championNames) {
    return ability.championNames[state.locale] || ability.championNames.en || ability.championName || '???';
  }
  return ability.championName || '???';
}

function findChampionByKey(key) {
  return state.allChampions.find((c) => c.key === key) || null;
}

// ---------- Ability pill ----------
function buildAbilityPill(ability) {
  if (!ability) return '';
  const iconUrl = ability.iconUrl || (ability.icons && ability.icons[0]) || '';
  const icon = escapeHtml(iconUrl);
  const name = escapeHtml(displayAbilityName(ability));
  return `<span class="ability-pill">` +
    `<img class="ability-pill-icon" src="${icon}" alt="${name}" loading="eager">` +
    `<span class="ability-pill-name">(${name})</span>` +
  `</span>`;
}

function findAbilityByChampionAndSlot(championKey, slot) {
  return state.abilityPool.find(
    (a) => a.championKey === championKey && a.slot === slot
  ) || null;
}

function abilityKey(a) { return `${a.championKey}|${a.slot}`; }

function isAbilityCompleted(a) { return state.completedAbilities.has(abilityKey(a)); }

// ---------- LocalStorage ----------
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

// ---------- Image preloading ----------
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
    const list = a.icons || [a.iconUrl];
    for (const u of list) if (u) urls.push(u);
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