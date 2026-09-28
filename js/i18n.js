// ============================================================
//  i18n.js — UI string translations + locale helpers
//  Load order: 2
// ============================================================

const STRINGS = {
  en: {
    title: 'LoL Ability Guesser',

    // Panel labels
    display: 'Display',
    stats: 'Stats',
    lives: 'Lives',
    timer: 'Timer',
    gamemodes: 'Gamemodes',

    // Display modes
    modeIcon: 'Icon only',
    modeName: 'Name only',
    modeBoth: 'Both',

    // Stats
    score: 'Score',
    personalBest: 'Personal Best',

    // Config rows
    enabled: 'Enabled',
    count: 'Count',
    current: 'Current',
    duration: 'Duration',
    guide: 'Guide',
    progress: 'Progress',
    restartProgress: 'Restart Progress',

    // Roles
    roleTop: 'Top',
    roleJungle: 'Jungle',
    roleMid: 'Mid',
    roleBot: 'Bot',
    roleSupport: 'Support',

    // Game
    loading: 'Loading…',
    loadingChampions: 'Loading champions…',
    guess: 'GUESS',
    next: 'NEXT →',
    placeholderChampion: 'Type champion name…',
    placeholderSearch: 'Search champion…',
    guideCompleted: 'Completed',
    gameOver: 'GAME OVER',

    // Round messages
    hundredComplete: '100% Complete!',
    hundredCompleteMsg: (score) => `🎉 You mastered every ability! Final score: ${score}`,
    noAbilitiesForRole: 'No abilities available for this role.',
    typeChampionFirst: 'Type a champion name first.',
    championNotRecognized: 'Champion not recognized. Pick from the list.',
    pickSlot: 'Pick an ability slot (P / Q / W / E / R).',
    correct: (label) => `Correct. It was ${label}`,
    wrong: (correct, guessed, pill) =>
      `Wrong. It was ${correct}. You picked ${guessed} ${pill}`,
    timesUp: (correct, pill) => `Time's up! It was ${correct} ${pill}`,

    // Errors
    loadChampionsError: 'Failed to load champion list from Data Dragon',
    loadIconMapError: (status) => `Failed to load abilityIcons.json (status ${status})`,
    loadRolesError: (status) => `Failed to load championRoles.json (status ${status})`,
    noAbilitiesMatched:
      'No abilities matched. Check the console for per-champion mismatch logs.',

    // Dev panel
    devTitle: 'Unlock Champion Abilities',
    devPlaceholder: 'Champion name…',
    devUnlock: 'Unlock',
    devEnableHundred: 'Enable 100% mode first.',
    devTypeChampion: 'Type a champion name.',
    devNotFound: 'Champion not found.',
    devNoAbilities: (name) => `${name} has no abilities in the pool.`,
    devUnlocked: (n, name) =>
      `Unlocked ${n} ${n === 1 ? 'ability' : 'abilities'} for ${name}.`,
  },

  es: {
    title: 'Adivina la Habilidad del LoL',

    display: 'Visualización',
    stats: 'Estadísticas',
    lives: 'Vidas',
    timer: 'Temporizador',
    gamemodes: 'Modos de juego',

    modeIcon: 'Solo icono',
    modeName: 'Solo nombre',
    modeBoth: 'Ambos',

    score: 'Puntuación',
    personalBest: 'Mejor puntuación',

    enabled: 'Activado',
    count: 'Cantidad',
    current: 'Actuales',
    duration: 'Duración',
    guide: 'Guía',
    progress: 'Progreso',
    restartProgress: 'Reiniciar progreso',

    roleTop: 'Superior',
    roleJungle: 'Jungla',
    roleMid: 'Central',
    roleBot: 'Inferior',
    roleSupport: 'Soporte',

    loading: 'Cargando…',
    loadingChampions: 'Cargando campeones…',
    guess: 'ADIVINAR',
    next: 'SIGUIENTE →',
    placeholderChampion: 'Escribe el nombre del campeón…',
    placeholderSearch: 'Buscar campeón…',
    guideCompleted: 'Completado',
    gameOver: 'FIN DEL JUEGO',

    hundredComplete: '¡100% completado!',
    hundredCompleteMsg: (score) =>
      `🎉 ¡Dominaste todas las habilidades! Puntuación final: ${score}`,
    noAbilitiesForRole: 'No hay habilidades disponibles para este rol.',
    typeChampionFirst: 'Escribe el nombre de un campeón primero.',
    championNotRecognized: 'Campeón no reconocido. Elige uno de la lista.',
    pickSlot: 'Elige una casilla de habilidad (P / Q / W / E / R).',
    correct: (label) => `¡Correcto! Era ${label}`,
    wrong: (correct, guessed, pill) =>
      `Incorrecto. Era ${correct}. Elegiste ${guessed} ${pill}`,
    timesUp: (correct, pill) => `¡Se acabó el tiempo! Era ${correct} ${pill}`,

    loadChampionsError: 'No se pudo cargar la lista de campeones desde Data Dragon',
    loadIconMapError: (status) => `No se pudo cargar abilityIcons.json (estado ${status})`,
    loadRolesError: (status) => `No se pudo cargar championRoles.json (estado ${status})`,
    noAbilitiesMatched:
      'Ninguna habilidad coincidió. Revisa la consola para ver los nombres que fallaron.',

    devTitle: 'Desbloquear habilidades del campeón',
    devPlaceholder: 'Nombre del campeón…',
    devUnlock: 'Desbloquear',
    devEnableHundred: 'Activa primero el modo 100%.',
    devTypeChampion: 'Escribe el nombre de un campeón.',
    devNotFound: 'Campeón no encontrado.',
    devNoAbilities: (name) => `${name} no tiene habilidades en el grupo.`,
    devUnlocked: (n, name) =>
      `Desbloqueadas ${n} ${n === 1 ? 'habilidad' : 'habilidades'} de ${name}.`,
  },
};

function t(key, ...args) {
  const dict = STRINGS[state.locale] || STRINGS.en;
  const v = dict[key];
  if (v === undefined) {
    console.warn(`[i18n] Missing key: ${key} (${state.locale})`);
    return key;
  }
  return typeof v === 'function' ? v(...args) : v;
}

function loadLocale() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCALE);
    if (raw === 'en' || raw === 'es') return raw;
  } catch {}
  return 'en';
}

function saveLocale(loc) {
  try { localStorage.setItem(STORAGE_KEY_LOCALE, loc); } catch {}
}

/**
 * Repaint every static UI label from the current state.locale.
 * Reads anything with [data-i18n] / [data-i18n-placeholder].
 */
function applyLocaleToStaticUI() {
  document.documentElement.lang = state.locale;
  document.title = t('title');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Guide progress text and hundred progress are re-rendered elsewhere,
  // but ensure any fallback labels are localized too.
  updateScoreUI();
  updateLivesUI();
  updateHundredProgressUI();
}