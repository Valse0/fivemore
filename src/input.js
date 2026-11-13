const keys = { up: false, down: false, left: false, right: false };
const state = { pointerId: -1, originX: 0, originY: 0, x: 0, y: 0, radius: 48 };
let canvas = null;
let stick = null;
let knob = null;

function setKey(event, pressed) {
  switch (event.key.toLowerCase()) {
    case "w": case "arrowup": keys.up = pressed; break;
    case "s": case "arrowdown": keys.down = pressed; break;
    case "a": case "arrowleft": keys.left = pressed; break;
    case "d": case "arrowright": keys.right = pressed; break;
    default: return;
  }
  event.preventDefault();
}

function pointerDown(event) {
  if (state.pointerId !== -1 || event.clientY < window.innerHeight * 0.5) return;
  state.pointerId = event.pointerId;
  state.originX = event.clientX;
  state.originY = event.clientY;
  state.x = 0;
  state.y = 0;
  stick.style.left = `${event.clientX}px`;
  stick.style.top = `${event.clientY}px`;
  stick.classList.add("visible");
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function pointerMove(event) {
  if (event.pointerId !== state.pointerId) return;
  const dx = event.clientX - state.originX;
  const dy = event.clientY - state.originY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > state.radius ? state.radius / distance : 1;
  state.x = dx * scale / state.radius;
  state.y = dy * scale / state.radius;
  knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
}

function pointerUp(event) {
  if (event.pointerId !== state.pointerId) return;
  state.pointerId = -1;
  state.x = 0;
  state.y = 0;
  knob.style.transform = "translate(0, 0)";
  stick.classList.remove("visible");
}

export function initializeInput(targetCanvas, stickElement) {
  canvas = targetCanvas;
  stick = stickElement;
  knob = stick.querySelector(".virtual-stick-knob");
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  window.addEventListener("keydown", (event) => setKey(event, true));
  window.addEventListener("keyup", (event) => setKey(event, false));
}

export function readMovement(out) {
  let x = state.x + (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let y = state.y + (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  out.x = x;
  out.y = y;
}

export function showInput(active) {
  if (!active && state.pointerId !== -1) {
    state.pointerId = -1;
    state.x = 0;
    state.y = 0;
    stick.classList.remove("visible");
  }
}
