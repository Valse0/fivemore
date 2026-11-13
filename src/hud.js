import { progression } from "./xp.js";

const timerLabel = document.querySelector("#run-timer");
const hpFill = document.querySelector("#hp-fill");
const hpLabel = document.querySelector("#hp-label");
const xpFill = document.querySelector("#xp-fill");
const levelLabel = document.querySelector("#level-label");
const toast = document.querySelector("#level-toast");
const endScreen = document.querySelector("#run-end");
const endHeading = document.querySelector("#run-end-heading");
const endStats = document.querySelector("#run-end-stats");
let lastToast = 0;

export function resetHUD() {
  endScreen.hidden = true;
  lastToast = 0;
  toast.hidden = true;
}

export function updateHUD(time, hp) {
  const seconds = Math.min(300, Math.floor(time));
  timerLabel.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  hpFill.style.width = `${Math.max(0, hp)}%`;
  hpLabel.textContent = `${Math.ceil(Math.max(0, hp))} HP`;
  xpFill.style.width = `${progression.xp / progression.needed * 100}%`;
  xpFill.style.transform = progression.pulse > 0 ? "scaleY(1.8)" : "scaleY(1)";
  levelLabel.textContent = `LV ${progression.level}`;
  if (progression.toast > 0) { toast.hidden = false; lastToast = progression.toast; }
  else if (lastToast > 0) { toast.hidden = true; lastToast = 0; }
}

export function showRunEnd(won, time, kills) {
  endHeading.textContent = won ? "You survived" : "Run over";
  endStats.textContent = `Time survived ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}  ·  ${kills} kills`;
  endScreen.hidden = false;
}
