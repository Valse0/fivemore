const requestedScale = Number(new URLSearchParams(location.search).get("scale"));
export const WORLD_SCALE = Number.isFinite(requestedScale) && requestedScale > 0 && requestedScale <= 2
  ? requestedScale
  : 0.7;
export const AIM_ASSIST_DEG = 6;
export const MAX_PARTICLES = 300;

export function snapWorldPixel(value) {
  return Math.round(value * WORLD_SCALE) / WORLD_SCALE;
}

export function snapWorldSize(value) {
  return Math.max(1, Math.round(value * WORLD_SCALE)) / WORLD_SCALE;
}

export function quantizeDirection(angle) {
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}
