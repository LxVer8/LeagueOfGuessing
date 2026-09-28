// ============================================================
//  config.js — Constants, global state, DOM references
//  Load order: 1
// ============================================================

const DDRAGON_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';
const ICON_MAP_URL = 'abilityIcons.json';
const ROLES_MAP_URL = 'championRoles.json';
const STORAGE_KEY_PB = 'lolGuesser.personalBest';
const STORAGE_KEY_HUNDRED = 'lolGuesser.hundredMode';
const STORAGE_KEY_LINE = 'lolGuesser.lineMode';

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

const timerState = {
  enabled: false,
  duration: 15,
  remaining: 15,
  intervalId: null,
  startedAt: 0,
};

const guideSlotMap = new Map(); // abilityKey -> { primary, secondary }

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
  devPanel: $('devPanel'),
  devToggle: $('devToggle'),
  devBody: $('devBody'),
  devChampionInput: $('devChampionInput'),
  devUnlockBtn: $('devUnlockBtn'),
  devStatus: $('devStatus'),
};