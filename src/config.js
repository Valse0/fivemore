const requestedScale = Number(new URLSearchParams(location.search).get("scale"));
export const WORLD_SCALE = Number.isFinite(requestedScale) && requestedScale > 0 && requestedScale <= 2
  ? requestedScale
  : 0.7;
export const AIM_ASSIST_DEG = 6;
export const MAX_PARTICLES = 300;

export function snapWorldPixel(value) {
  return Math.round(value * WORLD_SCALE) / WORLD_SCALE;
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
  return Math.max(1, Math.round(value * WORLD_SCALE)) / WORLD_SCALE;
}

export function quantizeDirection(angle) {
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}
