const BPM = 104;
const BEAT = 60 / BPM;
const STEP = BEAT / 2;
const STEPS_PER_BAR = 8;
const BARS = 28; // 64.62 seconds at 104 BPM
const LOOP_SECONDS = BEAT * 4 * BARS;
const SCHEDULE_AHEAD = 0.14;
const SCHEDULE_EVERY_MS = 25;
const ROOTS = [55, 43.65, 65.41, 49]; // Am, F, C, G
const SCALE = [0, 3, 5, 7, 10];
const MOTIF = [0, 7, 10, 7, 3, 7, 5, 3, 0, 7, 12, 10, 7, 5, 3, 5];

let context = null;
let destination = null;
let master = null;
let compressor = null;
let scheduler = 0;
let loopStart = 0;
let nextStep = 0;
let volume = 0.7;
let playing = false;
let nodes = [];
let teardownTimer = 0;
let noiseBuffer = null;

function track(node) { nodes.push(node); return node; }

function envelope(gain, at, peak, duration, attack = 0.004) {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
}

function tone(frequency, at, duration, peak, type, filterHz = 0, pan = 0) {
  const oscillator = track(context.createOscillator());
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  envelope(gain, at, peak, duration);
  oscillator.connect(gain);
  if (filterHz) {
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterHz, at);
    gain.connect(filter);
    connectOutput(filter, pan);
  } else connectOutput(gain, pan);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.025);
}

function connectOutput(node, pan) {
  if (context.createStereoPanner) {
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    node.connect(panner);
    panner.connect(master);
  } else node.connect(master);
}

function noise(at, duration, peak, highpass) {
  const source = track(context.createBufferSource());
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = noiseBuffer;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(highpass, at);
  envelope(gain, at, peak, duration, 0.002);
  source.connect(filter);
  filter.connect(gain);
  connectOutput(gain, 0);
  source.start(at);
  source.stop(at + duration + 0.01);
}

function kick(at, peak = 0.15) {
  const oscillator = track(context.createOscillator());
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(118, at);
  oscillator.frequency.exponentialRampToValueAtTime(43, at + 0.12);
  envelope(gain, at, peak, 0.19, 0.003);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(at);
  oscillator.stop(at + 0.21);
}

function scheduleStep(stepIndex, at) {
  const stepInLoop = stepIndex % (BARS * STEPS_PER_BAR);
  const bar = Math.floor(stepInLoop / STEPS_PER_BAR);
  const step = stepInLoop % STEPS_PER_BAR;
  const beat = Math.floor(step / 2);
  const root = ROOTS[Math.floor(bar / 4) % ROOTS.length];

  if (step % 2 === 0) {
    const velocity = [0.98, 0.45, 0.82, 0.48][beat];
    if (beat === 0 || beat === 2) kick(at, 0.15 * velocity);
    if (beat === 1 || beat === 3) noise(at, 0.17, 0.055, 1150);
  }
  if (step === 5 && bar % 2 === 1) kick(at, 0.075); // offbeat kick
  noise(at, 0.035, step % 2 ? 0.010 : 0.014 + (stepIndex % 4) * 0.001, 7200);
  if (bar % 4 === 3 && step === 7) noise(at, 0.22, 0.024, 5200);

  // Eight-note sub bass follows Am–F–C–G.
  const bassHz = root / (step % 4 === 2 ? 2 : 1);
  tone(bassHz, at, STEP * 0.82, 0.085, "sine", 260);
  tone(bassHz, at, STEP * 0.68, 0.018, "sawtooth", 125, -0.05);

  if (bar >= 8 && stepInLoop >= 8 * STEPS_PER_BAR && stepInLoop < 10 * STEPS_PER_BAR) {
    const note = MOTIF[(bar - 8) * STEPS_PER_BAR + step];
    if (note !== undefined) {
      const frequency = 220 * Math.pow(2, (note + SCALE[(bar - 8) % SCALE.length]) / 12);
      tone(frequency, at, STEP * 0.74, 0.034, "triangle", 3000, step % 4 === 0 ? -0.18 : 0.18);
      tone(frequency, at + 0.11, STEP * 0.85, 0.012, "sine", 2600, step % 4 === 0 ? 0.18 : -0.18);
    }
  }
}

function schedule() {
  if (!playing || !context) return;
  const horizon = context.currentTime + SCHEDULE_AHEAD;
  while (loopStart + nextStep * STEP < horizon) {
    scheduleStep(nextStep, loopStart + nextStep * STEP);
    nextStep += 1;
    if (nextStep >= BARS * STEPS_PER_BAR) nextStep = 0;
    if (nextStep === 0) loopStart += LOOP_SECONDS;
  }
}

function buildNoise() {
  const length = Math.ceil(context.sampleRate * 0.25);
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
}

function buildPad() {
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 580;
  filter.Q.value = 0.5;
  const gain = context.createGain();
  gain.gain.value = 0.018;
  filter.connect(gain);
  gain.connect(master);
  const startAt = loopStart + 16 * BAR;
  for (const frequency of [110, 164.81, 220]) {
    const oscillator = track(context.createOscillator());
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    oscillator.connect(filter);
    oscillator.start(startAt);
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
  noiseBuffer = null;
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
  compressor.threshold.value = -20;
  compressor.knee.value = 16;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.2;
  compressor.connect(destination);
  master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.connect(compressor);
  buildNoise();
  playing = true;
  loopStart = context.currentTime + 0.05;
  nextStep = 0;
  buildPad();
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
