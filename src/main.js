import { getAudioDebugStatus, getAudioSettings, playTestSound, setAudioSetting, setMenuMusicActive, startAudioFromGesture } from "./audio.js";
import { SUPPORT_LINKS } from "./links.js";
import { createHeartButton } from "./support.js";
import { initializeGame, setGameActive } from "./scene.js";

const screens = [...document.querySelectorAll(".screen")];
const navigationButtons = document.querySelectorAll("[data-screen]");
const audioControls = {
  music: document.querySelector("#music-volume"),
  effects: document.querySelector("#sfx-volume"),
  muted: document.querySelector("#mute-audio"),
  test: document.querySelector("#test-sound"),
};

function showScreen(screenId) {
  const nextScreen = document.getElementById(screenId);
  if (!nextScreen) return;

  for (const screen of screens) screen.hidden = screen !== nextScreen;
  setMenuMusicActive(screenId !== "game");
  setGameActive(screenId === "game");
  document.body.classList.toggle("game-active", screenId === "game");
  const heading = nextScreen.querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

initializeGame();

document.querySelector("#support-heart-slot").append(
  createHeartButton({ onClick: () => showScreen("support") }),
);
document.querySelectorAll("[data-support-link]").forEach((link) => {
  link.href = SUPPORT_LINKS[link.dataset.supportLink];
});

for (const eventName of ["click", "touchend", "pointerup"]) {
  document.addEventListener(eventName, startAudioFromGesture, { passive: true });
}

audioControls.test.addEventListener("click", playTestSound);

const audioDebug = document.querySelector("#audio-debug");
if (new URLSearchParams(location.search).has("debug")) {
  audioDebug.hidden = false;
  const updateAudioDebug = () => {
    audioDebug.textContent = `Audio: ${getAudioDebugStatus()}`;
  };
  window.setInterval(updateAudioDebug, 500);
  updateAudioDebug();
}

function updateVolumeControl(key, value) {
  const control = audioControls[key];
  const volume = Math.max(0, Math.min(100, Number(value)));
  control.value = String(volume);
  control.nextElementSibling.value = `${volume}%`;
  control.nextElementSibling.textContent = `${volume}%`;
  setAudioSetting(key, volume);
}

audioControls.music.addEventListener("input", (event) => updateVolumeControl("music", event.currentTarget.value));
audioControls.effects.addEventListener("input", (event) => updateVolumeControl("effects", event.currentTarget.value));
audioControls.muted.addEventListener("change", (event) => setAudioSetting("muted", event.currentTarget.checked));

function loadAudioSettings() {
  const settings = getAudioSettings();
  updateVolumeControl("music", settings.music);
  updateVolumeControl("effects", settings.effects);
  audioControls.muted.checked = settings.muted;
}

loadAudioSettings();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") showScreen("home");
});
