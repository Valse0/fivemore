const requestedScale = Number(new URLSearchParams(location.search).get("scale"));
export const WORLD_SCALE = Number.isFinite(requestedScale) && requestedScale > 0 && requestedScale <= 2
  ? requestedScale
  : 0.7;
export const AIM_ASSIST_DEG = 6;
export const MAX_PARTICLES = 300;
