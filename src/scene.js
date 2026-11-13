import { initializeInput, readMovement, showInput } from "./input.js";
import { player, updatePlayer } from "./player.js";
import { drawEnemies, getEnemyCount, getKillCount, forNearby, resetEnemies, updateEnemies, updateCorpses } from "./enemies.js";
import { drawBullets, getBulletCount, resetWeapons, setGemDropCallback, updateWeapons } from "./weapons.js";
import { drawGems, dropGem, progression, resetXP, updateXP } from "./xp.js";
import { resetHUD, showRunEnd, updateHUD } from "./hud.js";
import { applyWorldTransform, quantizeDirection, snapWorldPixel, snapWorldSize, WORLD_SCALE } from "./config.js";
import { drawParticles, updateParticles } from "./particles.js";
import { playerHurt, ambientGroan, gameOver } from "./sfx.js";
import { updateGameplayMusicTime, stopGameplayMusic } from "./audio.js";

const TILE_SIZE = 64;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const movement = { x: 0, y: 0 };
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", { alpha: false });
const playerImage = new Image();
const standImage = new Image();
const runnerImage = new Image();
const groundImages = Array.from({ length: 6 }, (_, index) => {
  const image = new Image();
  image.src = `assets/graphs/kenney/PNG/Tiles/tile_${String(index + 1).padStart(2, "0")}.png`;
  return image;
});
playerImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_gun.png";
standImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_stand.png";
runnerImage.src = "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png";
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
let ambientClock = 0;
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
    player.hp = Math.max(0, player.hp - 12); player.invulnerable = 0.5; playerHurt();
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
  ambientClock = 0;
  runTime = 0; ended = false;
  resetEnemies(); resetWeapons(); resetXP(); resetHUD();
  previousTime = 0; accumulator = 0;
}

function update(dt) {
  runTime += dt;
  updateGameplayMusicTime(runTime);
  ambientClock -= dt;
  if (ambientClock <= 0) { if (getEnemyCount() > 8 && Math.random() < 0.35) ambientGroan(420); ambientClock = 1.6; }
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
    stopGameplayMusic(); gameOver();
  }
}

function render() {
  const cameraX = snapWorldPixel(player.x); const cameraY = snapWorldPixel(player.y);
  applyWorldTransform(context, pixelRatio, width, height, cameraX, cameraY);
  const viewWidth = width / WORLD_SCALE; const viewHeight = height / WORLD_SCALE;
  if (groundImages[0].complete && groundImages[0].naturalWidth) {
    const cameraLeft = cameraX - viewWidth / 2; const cameraTop = cameraY - viewHeight / 2;
    const firstTileX = Math.floor(cameraLeft / TILE_SIZE); const firstTileY = Math.floor(cameraTop / TILE_SIZE);
    const lastTileX = Math.ceil((cameraLeft + viewWidth) / TILE_SIZE);
    const lastTileY = Math.ceil((cameraTop + viewHeight) / TILE_SIZE);
    for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
      for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
        const tileHash = (tileX * 73856093 ^ tileY * 19349663) >>> 0;
        const patchX = Math.floor(tileX / 2); const patchY = Math.floor(tileY / 2);
        const patchHash = (patchX * 83492791 ^ patchY * 2971215073) >>> 0;
        const dirtPatch = patchHash % 10 === 0;
        const variant = dirtPatch ? 4 + tileHash % 2 : tileHash % 4;
        const image = groundImages[variant];
        if (image.complete && image.naturalWidth) context.drawImage(image,
          snapWorldPixel(tileX * TILE_SIZE), snapWorldPixel(tileY * TILE_SIZE), snapWorldSize(TILE_SIZE + 2), snapWorldSize(TILE_SIZE + 2));
      }
    }
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
    context.save(); context.translate(snapWorldPixel(player.x - Math.cos(player.angle) * (player.recoil > 0 ? 2 : 0)), snapWorldPixel(player.y - Math.sin(player.angle) * (player.recoil > 0 ? 2 : 0)));
    context.rotate(quantizeDirection(player.angle));
    const playerSize = snapWorldSize(64);
    context.drawImage(player.firing > 0 ? playerImage : (standImage.complete ? standImage : playerImage), -playerSize / 2, -playerSize / 2, playerSize, playerSize);
    context.restore(); context.globalAlpha = 1;
    if (player.firing > 0) {
      context.save();
      context.translate(snapWorldPixel(player.x + Math.cos(player.shotAngle) * 40), snapWorldPixel(player.y + Math.sin(player.shotAngle) * 40));
      context.rotate(quantizeDirection(player.shotAngle));
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = Math.min(1, player.firing / 0.08);
      context.fillStyle = "#f6ce67";
      context.beginPath(); context.moveTo(0, 0); context.lineTo(14, -4); context.lineTo(10, 0); context.lineTo(14, 4); context.closePath(); context.fill();
      context.fillStyle = "#fff4c7";
      context.beginPath(); context.moveTo(1, 0); context.lineTo(10, -1); context.lineTo(7, 0); context.lineTo(10, 1); context.closePath(); context.fill();
      context.restore(); context.globalAlpha = 1; context.globalCompositeOperation = "source-over";
    }
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
