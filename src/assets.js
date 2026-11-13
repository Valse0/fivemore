import { USE_V2_ASSETS } from "./config.js";

// Frame geometry mirrors assets/v2/ASSETS_INDEX.md; all animation counts are derived from sheet width.
const definitions = {
  survivor: ["characters/survivor_refined_spritesheet.png", 64, "assets/graphs/kenney/PNG/Survivor%201/survivor1_gun.png"],
  walker: ["zombies/walker_refined_spritesheet.png", 64, "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png"],
  runner: ["zombies/runner_spritesheet.png", 64, "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png"],
  tank: ["zombies/tank_spritesheet.png", 64, "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png"],
  spitter: ["zombies/spitter_spritesheet.png", 64, "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png"],
  boss: ["zombies/boss_spritesheet.png", 96, "assets/graphs/kenney/PNG/Zombie%201/zoimbie1_stand.png"],
  walkerAttack: ["zombies/walker_attack_spritesheet.png", 64, null],
  runnerAttack: ["zombies/runner_attack_spritesheet.png", 64, null],
  tankAttack: ["zombies/tank_attack_spritesheet.png", 96, null],
  spitterAttack: ["zombies/spitter_attack_spritesheet.png", 64, null],
  bossAttack: ["zombies/boss_attack_spritesheet.png", 128, null],
  bullet: ["effects/bullet_spritesheet.png", 32, null], spit: ["effects/acid_spit_spritesheet.png", 32, null],
  acidSplat: ["effects/acid_splat_spritesheet.png", 32, null],
  muzzle: ["effects/muzzle_flash_spritesheet.png", 32, null], spark: ["effects/hit_spark_spritesheet.png", 32, null],
  gem: ["effects/xp_gems_spritesheet.png", 24, null], grass: ["world/grass_tiles_spritesheet.png", 32, null],
  crate: ["world/crate_spritesheet.png", 48, null], barrel: ["world/barrel_spritesheet.png", 48, null],
  rock: ["world/rock_spritesheet.png", 48, null], tree: ["world/tree_spritesheet.png", 96, null], flowers: ["world/flowers_spritesheet.png", 24, null],
};
export const sprites = {};
for (const [key, [path, frameSize, fallback]] of Object.entries(definitions)) {
  const image = new Image();
  image.dataset.frameSize = String(frameSize);
  image.dataset.v2Path = `assets/v2/${path}`;
  image.onerror = () => { if (fallback && image.src !== new URL(fallback, location.href).href) image.src = fallback; };
  image.src = USE_V2_ASSETS ? image.dataset.v2Path : (fallback || image.dataset.v2Path);
  sprites[key] = image;
}
export function frameCount(image) {
  const size = Number(image?.dataset.frameSize) || 1;
  return image?.naturalWidth ? Math.max(1, Math.floor(image.naturalWidth / size)) : 1;
}
export function drawFrame(ctx, image, index, x, y, width, height, frameSize = Number(image?.dataset.frameSize) || 1) {
  if (!image?.complete || !image.naturalWidth) return false;
  const count = Math.max(1, Math.floor(image.naturalWidth / frameSize));
  ctx.drawImage(image, (index % count) * frameSize, 0, frameSize, Math.min(frameSize, image.naturalHeight), x, y, width, height);
  return true;
}
