const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 24;
const LOOP_SECONDS = BAR * BARS;
const SCHEDULE_AHEAD = 0.12;
const SCHEDULE_EVERY_MS = 25;
const D_MINOR = [0, 3, 5, 7, 10];

let context = null;
let destination = null;
let master = null;
let compressor = null;
let scheduler = 0;
let loopStart = 0;
let nextBeat = 0;
let volume = 0.7;
let playing = false;
let windSource = null;
let nodes = [];
let teardownTimer = 0;

function track(node) {
  nodes.push(node);
  return node;
}

function scheduleTone(frequency, at, duration, peak, type = "sine", pan = 0) {
  const oscillator = track(context.createOscillator());
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(peak, at + 0.025);
  envelope.gain.setValueAtTime(peak, at + Math.max(0.03, duration - 0.09));
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(envelope);
  if (context.createStereoPanner) {
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    envelope.connect(panner);
    panner.connect(master);
  } else {
    envelope.connect(master);
  }
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

function scheduleBeat(beatIndex, at) {
  const beatInLoop = beatIndex % (BARS * 4);
  const bar = Math.floor(beatInLoop / 4);
  const beat = beatInLoop % 4;
  if (bar % 2 === 0 && (beat === 0 || beat === 2)) {
    scheduleTone(36.71, at, 0.72, 0.12, "sine");
  }

  if (bar >= 8 && bar < 16 && beat === (bar % 2 === 0 ? 0 : 2)) {
    const step = (bar * 2 + beat) % D_MINOR.length;
    const notes = [146.83, 174.61, 196, 220, 261.63];
    scheduleTone(notes[step], at + 0.02, 0.26, 0.038, "triangle", step % 2 ? 0.18 : -0.18);
  }

  if (bar >= 16) {
    const tensionNotes = [293.66, 349.23, 392, 440, 523.25, 440, 392, 349.23];
    if (beat === 0 || beat === 2) {
      scheduleTone(52, at, 0.2, 0.035, "sine");
      scheduleTone(48, at + 0.16, 0.17, 0.02, "sine");
    }
    if (beat === 1 || (bar % 2 === 0 && beat === 3)) {
      scheduleTone(tensionNotes[(bar + beat) % tensionNotes.length], at + 0.015, 0.22, 0.028, "triangle");
    }
  }
}

function schedule() {
  if (!playing || !context) return;
  const horizon = context.currentTime + SCHEDULE_AHEAD;
  while (loopStart + nextBeat * BEAT < horizon) {
    scheduleBeat(nextBeat, loopStart + nextBeat * BEAT);
    nextBeat += 1;
    if (nextBeat >= BARS * 4) nextBeat = 0;
    if (nextBeat === 0) loopStart += LOOP_SECONDS;
  }
}

function buildWind() {
  const length = context.sampleRate * 3;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.16;
  windSource = track(context.createBufferSource());
  windSource.buffer = buffer;
  windSource.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.3;
  const gain = context.createGain();
  gain.gain.value = 0.012;
  windSource.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  windSource.start();
}

function buildPad() {
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 720;
  filter.Q.value = 0.55;
  const gain = context.createGain();
  gain.gain.value = 0.045;
  filter.connect(gain);
  gain.connect(master);
  for (const detune of [-7, 7]) {
    const oscillator = track(context.createOscillator());
    oscillator.type = "sine";
    oscillator.frequency.value = detune < 0 ? 73.42 : 110;
    oscillator.detune.value = detune;
    oscillator.connect(filter);
    oscillator.start();
  }
}

function clearTrack() {
  window.clearTimeout(teardownTimer);
  teardownTimer = 0;
  window.clearInterval(scheduler);
  scheduler = 0;
  for (const node of nodes) {
    try { node.stop(); } catch { /* already stopped */ }
    try { node.disconnect(); } catch { /* already disconnected */ }
  }
  nodes = [];
  if (master) master.disconnect();
  if (compressor) compressor.disconnect();
  master = null;
  compressor = null;
  windSource = null;
}

export function start(audioContext, output) {
  if (!audioContext || !output) return;
  if (playing && context === audioContext) {
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(volume * 0.34, context.currentTime, 0.32);
    return;
  }
  window.clearTimeout(teardownTimer);
  teardownTimer = 0;
  clearTrack();
  context = audioContext;
  destination = output;
  compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -22;
  compressor.knee.value = 16;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.012;
  compressor.release.value = 0.22;
  compressor.connect(destination);
  master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.connect(compressor);
  buildPad();
  buildWind();
  playing = true;
  loopStart = context.currentTime + 0.05;
  nextBeat = 0;
  schedule();
  scheduler = window.setInterval(schedule, SCHEDULE_EVERY_MS);
  master.gain.setTargetAtTime(volume * 0.34, context.currentTime + 0.02, 0.5);
}

export function stop() {
  if (!playing || !master || !context) return;
  playing = false;
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(0.0001, now, 0.16);
  teardownTimer = window.setTimeout(clearTrack, 560);
}

export function setVolume(value) {
  volume = Math.max(0, Math.min(1, Number(value) || 0));
  if (master && context) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(playing ? Math.max(0.0001, volume * 0.34) : 0.0001, now, volume === 0 ? 0.14 : 0.25);
  }
}
