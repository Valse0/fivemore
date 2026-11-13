const requestedScale = Number(new URLSearchParams(location.search).get("scale"));
export const USE_V2_ASSETS = new URLSearchParams(location.search).get("assets") !== "kenney";
export const DRAW_SIZES = { survivor: 64, walker: 64, runner: 49, tank: 72, spitter: 64, boss: 96, bullet: 16, spit: 20, muzzle: 24, spark: 24, gem: 24, tile: 32 };
export const WORLD_SCALE = Number.isFinite(requestedScale) && requestedScale > 0 && requestedScale <= 2
  ? requestedScale
  : 0.7;
export const AIM_ASSIST_DEG = 6;
export const MAX_PARTICLES = 300;
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
