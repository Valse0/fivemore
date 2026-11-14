import { PLAYER_COLLIDER_RADIUS, PLAYER_HURT_DURATION, PLAYER_HURT_RECOIL_DISTANCE } from "./config.js";
import { moveCircle } from "./obstacles.js";
export const player = { x: 0, y: 0, angle: 0, shotAngle: 0, speed: 180, hp: 100, maxHp: 100, invulnerable: 0, hurtTimer: 0, firing: 0, recoil: 0 };

export function damagePlayerFrom(enemy) {
  player.hurtTimer = PLAYER_HURT_DURATION;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy);
  const angle = distance ? Math.atan2(dy, dx) : enemy.angle;
  moveCircle(player, Math.cos(angle) * PLAYER_HURT_RECOIL_DISTANCE, Math.sin(angle) * PLAYER_HURT_RECOIL_DISTANCE, PLAYER_COLLIDER_RADIUS);
}

export function updatePlayer(input, dt) {
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  if (input.x || input.y) {
    moveCircle(player, input.x * player.speed * dt, input.y * player.speed * dt, PLAYER_COLLIDER_RADIUS);
    player.angle = Math.atan2(input.y, input.x);
  }
}
