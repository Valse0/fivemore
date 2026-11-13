import { initializeInput, readMovement, showInput } from "./input.js";
import { player, updatePlayer, damagePlayerFrom } from "./player.js";
import { drawEnemies, drawSpits, getEnemyCount, getKillCount, getEnemies, getEnemyCountsByType, getSpitCount, debugSpawnEnemy, hasBossSpawned, isBossAlive, forNearby, resetEnemies, updateEnemies, updateCorpses } from "./enemies.js";
import { drawBullets, getBulletCount, resetWeapons, setGemDropCallback, updateWeapons } from "./weapons.js";
import { drawGems, dropGem, progression, resetXP, updateXP } from "./xp.js";
import { drawHealthPickups, resetHealthPickups, updateHealthPickups } from "./pickups.js";
import { getWorldObjectAt, resetWorldObjects, updateWorldObjectEffects } from "./obstacles.js";
import { resetHUD, showRunEnd, updateHUD } from "./hud.js";
import { applyWorldTransform, quantizeDirection, setOutputPixelRatio, snapWorldPixel, snapWorldSize, WORLD_SCALE, DRAW_SIZES, USE_V2_ASSETS, PLAYER_HURT_TINT_ALPHA, ARENA_W, ARENA_H, ARENA_EDGE_WIDTH, ARENA_EDGE_COLOR, ARENA_EDGE_ACCENT, WEAPON_MUZZLE_OFFSET, ENEMY_ATTACK_ANIMATIONS, BREAKABLE_CONFIG } from "./config.js";
import { sprites, drawFrame, frameCount } from "./assets.js";
import { drawParticles, updateParticles } from "./particles.js";
import { playerHurt, ambientGroan, gameOver } from "./sfx.js";
import { updateGameplayMusicTime, stopGameplayMusic } from "./audio.js";

const TILE_SIZE = 64;
const V2_TILE_SIZE = 32;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const movement = { x: 0, y: 0 };
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", { alpha: false });
const playerImage = new Image();
let hurtSprite = null;
const standImage = new Image();
const runnerImage = new Image();
const groundImages = Array.from({ length: 6 }, (_, index) => {
  const image = new Image();
  image.src = `assets/graphs/kenney/PNG/Tiles/tile_${String(index + 1).padStart(2, "0")}.png`;
  return image;
});
playerImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_gun.png";
function createHurtSprite() {
  if (hurtSprite || !sprites.survivor.complete || !sprites.survivor.naturalWidth) return;
  hurtSprite = document.createElement("canvas");
  hurtSprite.width = sprites.survivor.naturalWidth;
  hurtSprite.height = sprites.survivor.naturalHeight;
  hurtSprite.dataset.frameSize = sprites.survivor.dataset.frameSize;
  const tintContext = hurtSprite.getContext("2d");
  tintContext.drawImage(sprites.survivor, 0, 0);
  tintContext.globalCompositeOperation = "source-atop";
  tintContext.globalAlpha = PLAYER_HURT_TINT_ALPHA;
  tintContext.fillStyle = "#ff263b";
  tintContext.fillRect(0, 0, hurtSprite.width, hurtSprite.height);
  tintContext.globalAlpha = 1;
}
sprites.survivor.addEventListener("load", createHurtSprite);
createHurtSprite();
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
let deathVisualTime = 0;
let ambientClock = 0;
let previousTime = 0; let accumulator = 0; let runTime = 0;
let fpsFrames = 0; let fpsTime = 0; let fps = 0;
const debugFps = new URLSearchParams(location.search).get("debug") === "1";
const fpsElement = document.querySelector("#fps-counter");
let hitEnemy = null;
let visualTime = 0;
function takePlayerDamage(amount, source) {
  if (player.invulnerable > 0) return false;
  player.hp = Math.max(0, player.hp - amount); player.invulnerable = 0.5; damagePlayerFrom(source); playerHurt();
  return true;
}

function takeContactDamage(enemy) {
  if (!enemy.active) return;
  const dx = player.x - enemy.x; const dy = player.y - enemy.y;
  const radius = enemy.radius + 18;
  if (dx * dx + dy * dy <= radius * radius && takePlayerDamage(enemy.damage, enemy)) {
    const attack = ENEMY_ATTACK_ANIMATIONS[enemy.type === 0 ? "walker" : enemy.type === 1 ? "runner" : enemy.type === 2 ? "tank" : enemy.type === 3 ? "spitter" : "boss"];
    if (attack) enemy.attackTimer = (attack.lastFrame - attack.firstFrame + 1) / attack.fps;
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width; height = rect.height;
  pixelRatio = Math.max(1, window.devicePixelRatio || 1);
  setOutputPixelRatio(pixelRatio);
  canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
  context.imageSmoothingEnabled = false;
}

function resetRun() {
  player.x = 0; player.y = 0; player.angle = -Math.PI / 2; player.hp = 100; player.invulnerable = 0; player.hurtTimer = 0;
  levelFlash = 0; levelWave = 1;
  deathVisualTime = 0;
  ambientClock = 0;
  runTime = 0; ended = false;
  resetEnemies(); resetWeapons(); resetXP(); resetHealthPickups(); resetWorldObjects(); resetHUD();
  previousTime = 0; accumulator = 0;
}

function update(dt) {
  visualTime += dt;
  runTime += dt;
  updateGameplayMusicTime(runTime);
  ambientClock -= dt;
  if (ambientClock <= 0) { if (getEnemyCount() > 8 && Math.random() < 0.35) ambientGroan(420); ambientClock = 1.6; }
  levelFlash = Math.max(0, levelFlash - dt); levelWave += dt;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  readMovement(movement);
  updatePlayer(movement, dt);
  updateEnemies(player, dt, runTime, width / WORLD_SCALE, height / WORLD_SCALE, takePlayerDamage);
  updateWorldObjectEffects(dt);
  updateCorpses(dt);
  forNearby(player.x, player.y, takeContactDamage);
  updateWeapons(player, dt, width / WORLD_SCALE, height / WORLD_SCALE, takePlayerDamage);
  updateParticles(dt);
  if (updateXP(player, dt)) { player.hp = Math.min(100, player.hp + 10); levelFlash = 0.16; levelWave = 0; }
  updateHealthPickups(player, dt);
  updateHUD(runTime, player.hp);
  if (player.hp <= 0 || (runTime >= 300 && hasBossSpawned() && !isBossAlive())) {
    ended = true;
    showRunEnd(runTime >= 300 && player.hp > 0, runTime, getKillCount());
    active = false; showInput(false);
    stopGameplayMusic(); gameOver();
  }
}

function render() {
  const cameraX = snapWorldPixel(player.x); const cameraY = snapWorldPixel(player.y);
  applyWorldTransform(context, pixelRatio, width, height, cameraX, cameraY);
  const viewWidth = width / WORLD_SCALE; const viewHeight = height / WORLD_SCALE;
  if (USE_V2_ASSETS && sprites.grass.complete && sprites.grass.naturalWidth) {
    const cameraLeft = cameraX - viewWidth / 2; const cameraTop = cameraY - viewHeight / 2;
    const firstTileX = Math.floor(cameraLeft / V2_TILE_SIZE); const firstTileY = Math.floor(cameraTop / V2_TILE_SIZE);
    const lastTileX = Math.ceil((cameraLeft + viewWidth) / V2_TILE_SIZE); const lastTileY = Math.ceil((cameraTop + viewHeight) / V2_TILE_SIZE);
    for (let ty = firstTileY; ty <= lastTileY; ty += 1) for (let tx = firstTileX; tx <= lastTileX; tx += 1) {
      const variant = ((tx * 73856093 ^ ty * 19349663) >>> 0) % frameCount(sprites.grass); const sz = snapWorldSize(DRAW_SIZES.tile);
      drawFrame(context, sprites.grass, variant, snapWorldPixel(tx*V2_TILE_SIZE), snapWorldPixel(ty*V2_TILE_SIZE), sz, sz);
    }
  } else if (groundImages[0].complete && groundImages[0].naturalWidth) {
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
  if (USE_V2_ASSETS) {
    const left = Math.floor((cameraX-viewWidth/2)/192); const right = Math.ceil((cameraX+viewWidth/2)/192);
    const top = Math.floor((cameraY-viewHeight/2)/192); const bottom = Math.ceil((cameraY+viewHeight/2)/192);
    for (let gy=top; gy<=bottom; gy+=1) for (let gx=left; gx<=right; gx+=1) {
      const object = getWorldObjectAt(gx, gy); if (!object) continue;
      const x = snapWorldPixel(object.x); const y = snapWorldPixel(object.y);
      if (object.type === "barrel" && object.burnmark) {
        const burnSize = snapWorldSize(BREAKABLE_CONFIG.barrel.burnmarkDrawSize);
        drawFrame(context, sprites.barrelBurnmark, 0, snapWorldPixel(x - burnSize/2), snapWorldPixel(y - burnSize/2), burnSize, burnSize, 96);
      }
      if (object.destroyed && object.effectTimer > 0) {
        const isBarrel = object.type === "barrel";
        const effect = isBarrel ? BREAKABLE_CONFIG.barrel : BREAKABLE_CONFIG.crate;
        const sprite = isBarrel ? sprites.barrelExplosion : sprites.crateBreak;
        const duration = isBarrel ? effect.explosionDuration : effect.breakDuration;
        const first = isBarrel ? effect.explodeFirstFrame : effect.breakFirstFrame;
        const last = isBarrel ? effect.explodeLastFrame : effect.breakLastFrame;
        const fps = isBarrel ? effect.explodeFps : effect.breakFps;
        const frameSize = effect.frameSize; const drawSize = isBarrel ? effect.explosionDrawSize : effect.drawSize;
        const elapsed = duration - object.effectTimer;
        const frame = first + Math.min(last - first, Math.floor(elapsed * fps));
        const size = snapWorldSize(drawSize);
        drawFrame(context, sprite, frame, snapWorldPixel(x - size/2), snapWorldPixel(y - size/2), size, size, frameSize);
      } else if (object.active) {
        const sprite = sprites[object.type]; const base = Number(sprite.dataset.frameSize); const size = snapWorldSize(base);
        const hash = (gx * 73856093 ^ gy * 19349663) >>> 0;
        const frame = hash >>> 8;
        drawFrame(context, sprite, frame % frameCount(sprite), snapWorldPixel(x - size/2), snapWorldPixel(y - size/2), size, size, base);
      }
    }
  }
  context.save();
  context.lineWidth = ARENA_EDGE_WIDTH / WORLD_SCALE;
  context.strokeStyle = ARENA_EDGE_COLOR;
  context.strokeRect(-ARENA_W / 2, -ARENA_H / 2, ARENA_W, ARENA_H);
  context.lineWidth = 2 / WORLD_SCALE;
  context.strokeStyle = ARENA_EDGE_ACCENT;
  context.strokeRect(-ARENA_W / 2, -ARENA_H / 2, ARENA_W, ARENA_H);
  context.restore();
  drawGems(context, player, viewWidth, viewHeight, null);
  drawHealthPickups(context, player, viewWidth, viewHeight);
  drawEnemies(context, runnerImage, player, viewWidth, viewHeight, tintedRunner);
  drawSpits(context, player, viewWidth, viewHeight);
  drawBullets(context, player, viewWidth, viewHeight);
  drawParticles(context, player, viewWidth, viewHeight);
  if (levelWave < 0.65) {
    context.globalAlpha = 1 - levelWave / 0.65; context.strokeStyle = "#fff4c7"; context.lineWidth = 2 / WORLD_SCALE;
    context.beginPath(); context.arc(0, 0, 24 + levelWave * 190, 0, Math.PI * 2); context.stroke(); context.globalAlpha = 1;
  }
  if (USE_V2_ASSETS) {
    const sprite = sprites.survivor; const size = snapWorldSize(DRAW_SIZES.survivor); const count = frameCount(sprite);
    const walkFrames = Math.max(1, count - 2);
    if (player.hp > 0 || deathVisualTime < 0.4) {
      const frame = player.hp <= 0 ? count - 1 : (movement.x || movement.y ? Math.floor(visualTime * 9) % walkFrames : 0);
      context.save(); context.translate(snapWorldPixel(player.x - Math.cos(player.angle) * (player.recoil > 0 ? 2 : 0)), snapWorldPixel(player.y));
      if (Math.cos(player.angle) < 0) context.scale(-1, 1);
      if (player.hurtTimer > 0 && hurtSprite) context.drawImage(hurtSprite, frame * 64, 0, 64, 64, -size / 2, -size / 2, size, size);
      else drawFrame(context, sprite, frame, -size / 2, -size / 2, size, size);
      context.restore(); context.globalAlpha = 1;
    }
  } else if (playerImage.complete && playerImage.naturalWidth) {
    context.save(); context.translate(snapWorldPixel(player.x - Math.cos(player.angle) * (player.recoil > 0 ? 2 : 0)), snapWorldPixel(player.y - Math.sin(player.angle) * (player.recoil > 0 ? 2 : 0)));
    context.rotate(quantizeDirection(player.angle));
    const playerSize = snapWorldSize(64);
    context.drawImage(player.firing > 0 ? playerImage : (standImage.complete ? standImage : playerImage), -playerSize / 2, -playerSize / 2, playerSize, playerSize);
    context.restore(); context.globalAlpha = 1;
    if (player.firing > 0) {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = Math.min(1, player.firing / 0.08);
      if (USE_V2_ASSETS && sprites.muzzle.complete && sprites.muzzle.naturalWidth) {
        const size = snapWorldSize(DRAW_SIZES.muzzle); context.translate(snapWorldPixel(player.x + Math.cos(player.shotAngle) * WEAPON_MUZZLE_OFFSET), snapWorldPixel(player.y + Math.sin(player.shotAngle) * WEAPON_MUZZLE_OFFSET));
        context.rotate(quantizeDirection(player.shotAngle));
        drawFrame(context, sprites.muzzle, Math.floor(visualTime * 30) % frameCount(sprites.muzzle), -size/2, -size/2, size, size); context.restore();
      } else {
      context.translate(snapWorldPixel(player.x + Math.cos(player.shotAngle) * WEAPON_MUZZLE_OFFSET), snapWorldPixel(player.y + Math.sin(player.shotAngle) * WEAPON_MUZZLE_OFFSET));
      context.rotate(quantizeDirection(player.shotAngle));
      context.fillStyle = "#f6ce67";
      context.beginPath(); context.moveTo(0, 0); context.lineTo(14, -4); context.lineTo(10, 0); context.lineTo(14, 4); context.closePath(); context.fill();
      }
      context.restore(); context.globalAlpha = 1; context.globalCompositeOperation = "source-over";
    }
  }
  if (levelFlash > 0) { context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); context.globalAlpha = levelFlash * 0.35 / 0.16; context.fillStyle = "#fff4c7"; context.fillRect(0, 0, width, height); context.globalAlpha = 1; }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!active) {
    if (ended && player.hp <= 0) { deathVisualTime = Math.min(0.4, deathVisualTime + 1/60); render(); }
    return;
  }
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
  if (debugFps) window.__gameDebug = {
    spawnEnemy: (type, x, y) => debugSpawnEnemy(type, player, x, y),
    setRunTime: (value) => { runTime = Math.max(0, Number(value) || 0); },
    getRunTime: () => runTime,
    reset: () => { resetRun(); },
    getEnemyCounts: getEnemyCountsByType,
    getSpitCount,
    getEnemies,
    isBossAlive,
  };
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
