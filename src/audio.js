import { startMenuMusic } from "./music.js";

const STORAGE_KEY = "fivemore-audio-settings";

const defaults = { music: 70, effects: 80, muted: false };
let settings = readSettings();
let context = null;
let musicBus = null;
let effectsBus = null;
let silentAudio = null;

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

function getContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!context) {
    context = new AudioContextClass();
    musicBus = context.createGain();
    effectsBus = context.createGain();
    musicBus.connect(context.destination);
    effectsBus.connect(context.destination);
    applyGains();
  }

  return context;
}

function enableIOSPlayback() {
  if (silentAudio) return;
  // A one-frame silent WAV switches iOS Safari's audio session to playback.
  silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
  silentAudio.loop = true;
  silentAudio.playsInline = true;
  silentAudio.volume = 0.001;
  const playback = silentAudio.play();
  if (playback?.catch) playback.catch(() => { silentAudio = null; });
}

export async function startAudioFromGesture() {
  const audioContext = getContext();
  if (!audioContext) return;
  enableIOSPlayback();

  if (audioContext.state !== "running") {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }
  if (audioContext.state === "running") startMenuMusic(audioContext, musicBus);
}

export async function playTestSound() {
  const audioContext = getContext();
  if (!audioContext) return;
  enableIOSPlayback();
  if (audioContext.state !== "running") {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }
  if (audioContext.state !== "running") return;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.value = 660;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  oscillator.connect(envelope);
  envelope.connect(effectsBus);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

export function getAudioDebugStatus() {
  return `${context?.state ?? "not created"} · gain ${musicBus ? musicBus.gain.value.toFixed(2) : "0.00"}`;
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
