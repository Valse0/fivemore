const LOOP_SECONDS = 30;
const NOTE_SECONDS = 0.62;
const MELODY = [
  [0.3, 110], [2.4, 165], [5.3, 147], [7.7, 220],
  [10.4, 165], [13.1, 123.47], [15.4, 110], [18.2, 147],
  [20.8, 196], [23.5, 165], [26.1, 123.47], [28.3, 147],
];

let started = false;

export function startMenuMusic(context, destination) {
  if (started) return;
  started = true;

  const drone = context.createOscillator();
  const droneGain = context.createGain();
  drone.type = "sine";
  drone.frequency.value = 55;
  droneGain.gain.value = 0.08;
  drone.connect(droneGain);
  droneGain.connect(destination);
  drone.start();

  function scheduleLoop() {
    const loopStart = context.currentTime + 0.05;
    for (const [offset, frequency] of MELODY) {
      const note = context.createOscillator();
      const envelope = context.createGain();
      const startAt = loopStart + offset;
      const endAt = startAt + NOTE_SECONDS;

      note.type = "triangle";
      note.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(0.3, startAt + 0.035);
      envelope.gain.setValueAtTime(0.3, endAt - 0.12);
      envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
      note.connect(envelope);
      envelope.connect(destination);
      note.start(startAt);
      note.stop(endAt + 0.01);
    }
    window.setTimeout(scheduleLoop, LOOP_SECONDS * 1000);
  }

  scheduleLoop();
}
