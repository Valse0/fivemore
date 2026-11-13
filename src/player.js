export const player = { x: 0, y: 0, angle: 0, speed: 180, hp: 100, invulnerable: 0, firing: 0, recoil: 0 };

export function updatePlayer(input, dt) {
  if (input.x || input.y) {
    player.x += input.x * player.speed * dt;
    player.y += input.y * player.speed * dt;
    player.angle = Math.atan2(input.y, input.x);
  }
}
