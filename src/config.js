const requestedScale = Number(new URLSearchParams(location.search).get("scale"));
export const USE_V2_ASSETS = new URLSearchParams(location.search).get("assets") !== "kenney";
export const DRAW_SIZES = { survivor: 76, walker: 64, runner: 49, tank: 72, spitter: 64, boss: 96, bullet: 16, spit: 20, muzzle: 24, spark: 24, gem: 24, tile: 32 };
export const WORLD_SCALE = Number.isFinite(requestedScale) && requestedScale > 0 && requestedScale <= 2
  ? requestedScale
  : 0.7;
export const AIM_ASSIST_DEG = 15;
export const OBSTACLE_RADII = { crate: 18, barrel: 14, rock: 20, tree: 14 };
export const PLAYER_COLLIDER_RADIUS = 14;
export const ARENA_W = 1600;
export const ARENA_H = 2000;
export const ARENA_EDGE_WIDTH = 8;
export const ARENA_EDGE_COLOR = "#302923";
export const ARENA_EDGE_ACCENT = "#d5a653";
export const WEAPON_MUZZLE_OFFSET = 40;
export const PLAYER_HURT_DURATION = 0.15;
export const PLAYER_HURT_TINT_ALPHA = 0.45;
export const PLAYER_HURT_RECOIL_DISTANCE = 6;
export const BOSS_SPAWN_TIME = 300;
// Frame ranges and rates copied from assets/v2/zombies/manifest.json.
export const ENEMY_ATTACK_ANIMATIONS = {
  walker: { sprite: "walkerAttack", firstFrame: 0, lastFrame: 3, fps: 9, frameSize: 64 },
  runner: { sprite: "runnerAttack", firstFrame: 0, lastFrame: 3, fps: 11, frameSize: 64 },
  tank: { sprite: "tankAttack", firstFrame: 0, lastFrame: 3, fps: 7, frameSize: 96 },
  spitter: { sprite: "spitterAttack", firstFrame: 0, lastFrame: 3, fps: 8, frameSize: 64 },
  boss: { sprite: "bossAttack", firstFrame: 0, lastFrame: 3, fps: 6, frameSize: 128 },
};
export const SPITTER_CONFIG = {
  preferredDistance: 220,
  attackRange: 270,
  attackInterval: 1.6,
  spitSpeed: 190,
  spitDamage: 8,
  spitRadius: 8,
  spitPassesObstacles: false,
};
export const ENEMY_CONFIG = {
  walker: { id: 0, hp: 36, speed: 43, damage: 12, radius: 16, xp: 1, spawnWeight: 3, startTime: 0, scale: 1, attackAnimation: "attack" },
  runner: { id: 1, hp: 19, speed: 79, damage: 8, radius: 12, xp: 1, spawnWeight: 1, startTime: 60, scale: 0.76, attackAnimation: "attack" },
  tank: { id: 2, hp: 260, speed: 22, damage: 22, radius: 24, xp: 4, spawnWeight: 1, startTime: 120, scale: 1.15, attackAnimation: "attack" },
  spitter: { id: 3, hp: 30, speed: 34, damage: 8, radius: 16, xp: 2, spawnWeight: 1, startTime: 60, scale: 1, attackAnimation: "attack" },
  boss: { id: 4, hp: 2400, speed: 20, damage: 28, radius: 40, xp: 12, spawnWeight: 0, startTime: BOSS_SPAWN_TIME, scale: 1.5, attackAnimation: "attack" },
};
export const MAX_PARTICLES = 300;

export function clampArenaX(x, radius = 0) {
  return Math.max(-ARENA_W / 2 + radius, Math.min(ARENA_W / 2 - radius, x));
}

export function clampArenaY(y, radius = 0) {
  return Math.max(-ARENA_H / 2 + radius, Math.min(ARENA_H / 2 - radius, y));
}

export function isInsideArena(x, y, radius = 0) {
  return Math.abs(x) + radius <= ARENA_W / 2 && Math.abs(y) + radius <= ARENA_H / 2;
}
let outputPixelRatio = 1;

export function setOutputPixelRatio(value) {
  outputPixelRatio = Math.max(1, Number(value) || 1);
}

export function snapWorldPixel(value) {
  const outputScale = WORLD_SCALE * outputPixelRatio;
  return Math.round(value * outputScale) / outputScale;
}

export function applyWorldTransform(ctx, pixelRatio, width, height, cameraX, cameraY) {
  const snappedCameraX = snapWorldPixel(cameraX);
  const snappedCameraY = snapWorldPixel(cameraY);
  const scaledRatio = pixelRatio * WORLD_SCALE;
  ctx.setTransform(
    scaledRatio, 0, 0, scaledRatio,
    pixelRatio * (width / 2 - snappedCameraX * WORLD_SCALE),
    pixelRatio * (height / 2 - snappedCameraY * WORLD_SCALE),
  );
}

export function snapWorldSize(value) {
  const outputScale = WORLD_SCALE * outputPixelRatio;
  return Math.max(1, Math.round(value * outputScale)) / outputScale;
}

export function quantizeDirection(angle) {
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}
