import { initializeInput, readMovement, showInput } from "./input.js";
import { player, updatePlayer } from "./player.js";
import { drawEnemies, getEnemyCount, getKillCount, forNearby, resetEnemies, updateEnemies, updateCorpses } from "./enemies.js";
import { drawBullets, getBulletCount, resetWeapons, setGemDropCallback, updateWeapons } from "./weapons.js";
import { drawGems, dropGem, progression, resetXP, updateXP } from "./xp.js";
import { resetHUD, showRunEnd, updateHUD } from "./hud.js";
import { WORLD_SCALE } from "./config.js";
import { drawParticles, updateParticles } from "./particles.js";

const TILE_SIZE = 64;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const movement = { x: 0, y: 0 };
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", { alpha: false });
const playerImage = new Image();
const standImage = new Image();
const runnerImage = new Image();
const groundImage = new Image();
const muzzleFlash = document.createElement("canvas");
muzzleFlash.width = 24; muzzleFlash.height = 24;
const muzzleContext = muzzleFlash.getContext("2d");
muzzleContext.fillStyle = "#fff4c7"; muzzleContext.beginPath(); muzzleContext.arc(12, 12, 5, 0, Math.PI * 2); muzzleContext.fill();
muzzleContext.fillStyle = "#f6ce67"; muzzleContext.fillRect(10, 1, 4, 22); muzzleContext.fillRect(1, 10, 22, 4);
playerImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_gun.png";
standImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_stand.png";
runnerImage.src = "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png";
groundImage.src = "assets/graphs/kenney/PNG/Tiles/tile_05.png";
let tintedRunner = null;
runnerImage.addEventListener("load", () => {
  tintedRunner = document.createElement("canvas");
  tintedRunner.width = runnerImage.naturalWidth; tintedRunner.height = runnerImage.naturalHeight;
  const tintContext = tintedRunner.getContext("2d");
  tintContext.drawImage(runnerImage, 0, 0);
  tintContext.globalCompositeOperation = "source-atop";
  tintContext.fillStyle = "rgba(126, 226, 154, .52)";
  tintContext.fillRect(0, 0, tintedRunner.width, tintedRunner.height);
});
let width = 0; let height = 0; let pixelRatio = 1;
let active = false; let initialized = false; let ended = false;
let levelFlash = 0; let levelWave = 0;
let previousTime = 0; let accumulator = 0; let runTime = 0;
let fpsFrames = 0; let fpsTime = 0; let fps = 0;
const debugFps = new URLSearchParams(location.search).get("debug") === "1";
const fpsElement = document.querySelector("#fps-counter");
let hitEnemy = null;
function takeContactDamage(enemy) {
  if (player.invulnerable > 0 || !enemy.active) return;
  const dx = player.x - enemy.x; const dy = player.y - enemy.y;
  const radius = enemy.radius + 18;
  if (dx * dx + dy * dy <= radius * radius) {
    player.hp = Math.max(0, player.hp - 12); player.invulnerable = 0.5;
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width; height = rect.height;
  pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
  context.imageSmoothingEnabled = false;
}

function resetRun() {
  player.x = 0; player.y = 0; player.angle = -Math.PI / 2; player.hp = 100; player.invulnerable = 0;
  levelFlash = 0; levelWave = 1;
  runTime = 0; ended = false;
  resetEnemies(); resetWeapons(); resetXP(); resetHUD();
  previousTime = 0; accumulator = 0;
}

function update(dt) {
  runTime += dt;
  levelFlash = Math.max(0, levelFlash - dt); levelWave += dt;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  readMovement(movement);
  updatePlayer(movement, dt);
  updateEnemies(player, dt, runTime, width / WORLD_SCALE, height / WORLD_SCALE);
  updateCorpses(dt);
  forNearby(player.x, player.y, takeContactDamage);
  updateWeapons(player, dt);
  updateParticles(dt);
  if (updateXP(player, dt)) { player.hp = Math.min(100, player.hp + 10); levelFlash = 0.16; levelWave = 0; }
  updateHUD(runTime, player.hp);
  if (player.hp <= 0 || runTime >= 300) {
    ended = true;
    showRunEnd(runTime >= 300, runTime, getKillCount());
    active = false; showInput(false);
  }
}

function render() {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = "#765b3c"; context.fillRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.scale(WORLD_SCALE, WORLD_SCALE);
  const viewWidth = width / WORLD_SCALE; const viewHeight = height / WORLD_SCALE;
  if (groundImage.complete && groundImage.naturalWidth) {
    const cameraLeft = player.x - viewWidth / 2; const cameraTop = player.y - viewHeight / 2;
    const firstTileX = Math.floor(cameraLeft / TILE_SIZE); const firstTileY = Math.floor(cameraTop / TILE_SIZE);
    const offsetX = -(cameraLeft - firstTileX * TILE_SIZE); const offsetY = -(cameraTop - firstTileY * TILE_SIZE);
    for (let y = offsetY - TILE_SIZE; y < viewHeight + TILE_SIZE; y += TILE_SIZE)
      for (let x = offsetX - TILE_SIZE; x < viewWidth + TILE_SIZE; x += TILE_SIZE)
        context.drawImage(groundImage, Math.round(x), Math.round(y), TILE_SIZE, TILE_SIZE);
  }
  drawGems(context, player, viewWidth, viewHeight, null);
  drawEnemies(context, runnerImage, player, viewWidth, viewHeight, tintedRunner);
  drawBullets(context, player, viewWidth, viewHeight);
  drawParticles(context, player, viewWidth, viewHeight);
  if (levelWave < 0.65) {
    context.globalAlpha = 1 - levelWave / 0.65; context.strokeStyle = "#fff4c7"; context.lineWidth = 2 / WORLD_SCALE;
    context.beginPath(); context.arc(0, 0, 24 + levelWave * 190, 0, Math.PI * 2); context.stroke(); context.globalAlpha = 1;
  }
  if (playerImage.complete && playerImage.naturalWidth) {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 === 0) context.globalAlpha = 0.38;
    context.save(); context.translate(-Math.cos(player.angle) * (player.recoil > 0 ? 2 : 0), -Math.sin(player.angle) * (player.recoil > 0 ? 2 : 0));
    context.rotate(player.angle + Math.PI / 2);
    context.drawImage(player.firing > 0 ? playerImage : (standImage.complete ? standImage : playerImage), -32, -32, 64, 64);
    if (player.firing > 0) {
      context.globalAlpha = player.firing > 0.04 ? 1 : 0.62;
      context.drawImage(muzzleFlash, 17, -12, 20, 20);
      context.globalAlpha = 1;
    }
    context.restore(); context.globalAlpha = 1;
  }
  if (levelFlash > 0) { context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); context.globalAlpha = levelFlash * 0.35 / 0.16; context.fillStyle = "#fff4c7"; context.fillRect(0, 0, width, height); context.globalAlpha = 1; }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!active) return;
  if (!previousTime) previousTime = timestamp;
  const delta = Math.min(MAX_FRAME, (timestamp - previousTime) / 1000); previousTime = timestamp; accumulator += delta;
  while (accumulator >= STEP && active) { update(STEP); accumulator -= STEP; }
  render();
  if (debugFps) {
    fpsFrames += 1; fpsTime += delta;
    if (fpsTime >= 0.5) {
      fps = Math.round(fpsFrames / fpsTime);
      fpsElement.textContent = `${fps} FPS · ${getEnemyCount()} enemies · ${getBulletCount()} bullets`;
      fpsFrames = 0; fpsTime = 0;
    }
  }
}

export function initializeGame() {
  if (initialized) return;
  initialized = true;
  setGemDropCallback(dropGem);
  initializeInput(canvas, document.querySelector("#virtual-stick"));
  window.addEventListener("resize", resize); resize();
  fpsElement.hidden = !debugFps;
  document.querySelector("#pause-game").addEventListener("click", () => document.querySelector('[data-screen="home"]').click());
  requestAnimationFrame(frame);
}

export function setGameActive(value) {
  const next = Boolean(value);
  if (next && !active) resetRun();
  active = next;
  showInput(active);
  if (active) { resize(); previousTime = 0; }
}
