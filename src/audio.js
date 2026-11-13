import { startMenuMusic } from "./music.js";

const STORAGE_KEY = "fivemore-audio-settings";

const defaults = { music: 70, effects: 80, muted: false };
let settings = readSettings();
let context = null;
let musicBus = null;
let effectsBus = null;

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      music: clampVolume(saved?.music, defaults.music),
      effects: clampVolume(saved?.effects, defaults.effects),
      muted: Boolean(saved?.muted),
    };
  } catch {
    return { ...defaults };
  }
}

function clampVolume(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback;
}

function applyGains() {
  if (!musicBus || !effectsBus) return;
  const muteScale = settings.muted ? 0 : 1;
  musicBus.gain.value = (settings.music / 100) * muteScale;
  effectsBus.gain.value = (settings.effects / 100) * muteScale;
}

export function startAudioFromGesture() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!context) {
    context = new AudioContextClass();
    musicBus = context.createGain();
    effectsBus = context.createGain();
    musicBus.connect(context.destination);
    effectsBus.connect(context.destination);
    applyGains();
  }

  if (context.state === "suspended") context.resume();
  startMenuMusic(context, musicBus);
}

export function getAudioSettings() {
  return { ...settings };
}

export function setAudioSetting(key, value) {
  if (key === "music" || key === "effects") settings[key] = clampVolume(value, defaults[key]);
  if (key === "muted") settings.muted = Boolean(value);
  applyGains();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Audio still works for this session if browser storage is unavailable.
  }
}
