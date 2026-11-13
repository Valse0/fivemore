import { PLAYER_COLLIDER_RADIUS } from "./config.js";
import { moveCircle } from "./obstacles.js";
export const player = { x: 0, y: 0, angle: 0, shotAngle: 0, speed: 180, hp: 100, invulnerable: 0, firing: 0, recoil: 0 };

export function updatePlayer(input, dt) {
  if (input.x || input.y) {
    moveCircle(player, input.x * player.speed * dt, input.y * player.speed * dt, PLAYER_COLLIDER_RADIUS);
    player.angle = Math.atan2(input.y, input.x);
  }
}
