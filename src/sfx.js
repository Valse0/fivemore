const MAX_VOICES = 12;
let context = null;
let output = null;
let noiseBuffer = null;
let voices = 0;
let lastAmbient = -10;
let lastPickup = -1;
let pickupChain = 0;

export function configureSFX(audioContext, effectsOutput) {
  context = audioContext; output = effectsOutput;
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.3), context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
}

function voice(builder) {
  if (!context || !output || context.state !== "running" || voices >= MAX_VOICES) return;
  voices += 1;
  let remaining = 0;
  const finishOne = () => { remaining -= 1; if (remaining <= 0) voices = Math.max(0, voices - 1); };
  builder(finishOne, (count) => { remaining = count; });
}

function oscillator(freq, type, duration, peak, bend = 1) {
  voice((done, setCount) => {
    setCount(1); const now = context.currentTime; const osc = context.createOscillator(); const gain = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(Math.max(24, freq * bend), now + duration);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(peak, now + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain); gain.connect(output); osc.onended = done; osc.start(now); osc.stop(now + duration + 0.01);
  });
}

function noise(duration, peak, filterType = "bandpass", frequency = 900) {
  voice((done, setCount) => {
    setCount(1); const now = context.currentTime; const source = context.createBufferSource(); const filter = context.createBiquadFilter(); const gain = context.createGain();
    source.buffer = noiseBuffer; filter.type = filterType; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(peak, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter); filter.connect(gain); gain.connect(output); source.onended = done; source.start(now); source.stop(now + duration);
  });
}

export function pistolShot() { oscillator(210 + Math.random() * 55, "sine", 0.12, 0.19, 0.38); noise(0.045, 0.11, "highpass", 1800); }
export function bulletHit() { oscillator(92, "sine", 0.075, 0.12, 0.62); }
export function zombieDeath(type = 0) { oscillator(58 + type * 9, "sawtooth", 0.28, 0.075, 0.58); noise(0.22, 0.035, "lowpass", 520); }
export function ambientGroan(distance = 0) {
  const now = context?.currentTime ?? 0; if (now - lastAmbient < 1.5) return; lastAmbient = now;
  const gainDistance = Math.max(0.12, 1 - distance / 800); oscillator(72 + Math.random() * 18, "sawtooth", 0.55, 0.035 * gainDistance, 0.72);
}
export function playerHurt() { noise(0.12, 0.12, "lowpass", 620); oscillator(110, "sine", 0.16, 0.1, 0.66); }
export function xpPickup() {
  const now = context?.currentTime ?? 0; pickupChain = now - lastPickup < 0.5 ? pickupChain + 1 : 0; lastPickup = now;
  oscillator(520 + Math.min(8, pickupChain) * 48, "sine", 0.12, 0.055, 1.24);
}
export function levelUp() { oscillator(523, "sine", 0.18, 0.08, 1.12); window.setTimeout(() => oscillator(659, "sine", 0.18, 0.08, 1.1), 100); window.setTimeout(() => oscillator(784, "sine", 0.28, 0.09, 1.02), 200); }
export function gameOver() { oscillator(320, "sine", 0.65, 0.12, 0.34); }
