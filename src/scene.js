import { initializeInput, readMovement, showInput } from "./input.js";
import { player, updatePlayer } from "./player.js";

const TILE_SIZE = 64;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const movement = { x: 0, y: 0 };
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", { alpha: false });
const playerImage = new Image();
const groundImage = new Image();
playerImage.src = "assets/graphs/kenney/PNG/Survivor%201/survivor1_gun.png";
groundImage.src = "assets/graphs/kenney/PNG/Tiles/tile_05.png";
let width = 0;
let height = 0;
let pixelRatio = 1;
let active = false;
let initialized = false;
let previousTime = 0;
let accumulator = 0;
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;
const debugFps = new URLSearchParams(location.search).get("debug") === "1";
const fpsElement = document.querySelector("#fps-counter");

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.imageSmoothingEnabled = false;
}

function update() {
  readMovement(movement);
  updatePlayer(movement, STEP);
}

function render() {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = "#765b3c";
  context.fillRect(0, 0, width, height);
  if (groundImage.complete && groundImage.naturalWidth) {
    const cameraLeft = player.x - width / 2;
    const cameraTop = player.y - height / 2;
    const firstTileX = Math.floor(cameraLeft / TILE_SIZE);
    const firstTileY = Math.floor(cameraTop / TILE_SIZE);
    const offsetX = -(cameraLeft - firstTileX * TILE_SIZE);
    const offsetY = -(cameraTop - firstTileY * TILE_SIZE);
    for (let y = offsetY - TILE_SIZE; y < height + TILE_SIZE; y += TILE_SIZE) {
      for (let x = offsetX - TILE_SIZE; x < width + TILE_SIZE; x += TILE_SIZE) {
        context.drawImage(groundImage, Math.round(x), Math.round(y), TILE_SIZE, TILE_SIZE);
      }
    }
  }
  if (playerImage.complete && playerImage.naturalWidth) {
    context.save();
    context.translate(Math.round(width / 2), Math.round(height / 2));
    context.rotate(player.angle);
    context.drawImage(playerImage, -32, -32, 64, 64);
    context.restore();
  }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!active) return;
  if (!previousTime) previousTime = timestamp;
  const delta = Math.min(MAX_FRAME, (timestamp - previousTime) / 1000);
  previousTime = timestamp;
  accumulator += delta;
  while (accumulator >= STEP) {
    update();
    accumulator -= STEP;
  }
  render();
  if (debugFps) {
    fpsFrames += 1;
    fpsTime += delta;
    if (fpsTime >= 0.5) {
      fps = Math.round(fpsFrames / fpsTime);
      fpsElement.textContent = `${fps} FPS`;
      fpsFrames = 0;
      fpsTime = 0;
    }
  }
}

export function initializeGame() {
  if (initialized) return;
  initialized = true;
  initializeInput(canvas, document.querySelector("#virtual-stick"));
  window.addEventListener("resize", resize);
  resize();
  fpsElement.hidden = !debugFps;
  requestAnimationFrame(frame);
}

export function setGameActive(value) {
  active = Boolean(value);
  showInput(active);
  if (active) {
    resize();
    previousTime = 0;
  }
}
