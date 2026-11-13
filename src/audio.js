import { setVolume as setMusicVolume, start as startMenuMusic, stop as stopMenuMusic } from "./music.js";

const STORAGE_KEY = "fivemore-audio-settings";

const defaults = { music: 70, effects: 80, muted: false };
let settings = readSettings();
let context = null;
let musicBus = null;
let effectsBus = null;
let silentAudio = null;
let audioUnlocked = false;
let menuMusicActive = true;

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
  const now = context.currentTime;
  const target = (settings.music / 100) * muteScale;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(musicBus.gain.value, now);
  musicBus.gain.linearRampToValueAtTime(target, now + (settings.muted || settings.music === 0 ? 0.5 : 1.5));
  setMusicVolume(1);
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
  // A short silent WAV switches iOS Safari's audio session to playback.
  const sampleRate = 22050;
  const sampleCount = sampleRate / 10;
  const wav = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(wav.buffer);
  const writeText = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) wav[offset + index] = value.charCodeAt(index);
  };
  writeText(0, "RIFF");
  view.setUint32(4, wav.length - 8, true);
  writeText(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, sampleCount * 2, true);
  let binary = "";
  for (let index = 0; index < wav.length; index += 1) binary += String.fromCharCode(wav[index]);
  silentAudio = new Audio(`data:audio/wav;base64,${btoa(binary)}`);
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
  if (audioContext.state === "running") {
    audioUnlocked = true;
    if (menuMusicActive) startMenuMusic(audioContext, musicBus);
  }
}

export function setMenuMusicActive(active) {
  menuMusicActive = Boolean(active);
  if (!audioUnlocked) return;
  if (menuMusicActive && context?.state === "running") startMenuMusic(context, musicBus);
  else stopMenuMusic();
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
