import "./style.css";
import { RareBitDashEngine, WORLD } from "./game/engine";
import { GameRenderer } from "./game/renderer";
import { GameAudio } from "./game/audio";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="game-shell">
    <canvas id="game-canvas" data-testid="game-canvas" data-phase="idle" data-player-state="grounded" data-jumps="0" aria-label="RareBit Dash game"></canvas>
    <button id="jump-button" type="button" aria-label="Jump"></button>
    <button id="mute-button" type="button" aria-label="Toggle sound" aria-pressed="false">◖</button>
    <p id="game-status" class="visually-hidden" role="status" aria-live="polite"></p>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const engine = new RareBitDashEngine();
const renderer = new GameRenderer(canvas);
const audio = new GameAudio();
const status = document.querySelector<HTMLParagraphElement>("#game-status")!;
const jumpButton = document.querySelector<HTMLButtonElement>("#jump-button")!;
const muteButton = document.querySelector<HTMLButtonElement>("#mute-button")!;
const logicalWidth = () => innerWidth < innerHeight ? 480 : 960;
let last = performance.now(); let accumulator = 0; let paused = false; let lastSteps = 0; let loopErrorLogged = false;
let pressed = false; let startedIdle = false; let holdTimer = 0;

function resize(): void {
  const width = logicalWidth(); const height = Math.max(320, Math.round(width * innerHeight / innerWidth));
  canvas.width = Math.round(innerWidth * Math.min(devicePixelRatio, 2)); canvas.height = Math.round(innerHeight * Math.min(devicePixelRatio, 2));
  canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; renderer.resize(width, height); canvas.dataset.playerCssSize = String(renderer.camera.playerCssSize); canvas.dataset.cameraHeight = String(height); canvas.dataset.dpr = String(renderer.camera.dpr);
}
function action(): void {
  audio.gesture();
  if (engine.state.phase === "paused") engine.resume();
  paused = false;
  if (engine.state.phase === "gameover" || engine.state.phase === "complete") {
    engine.reset();
    renderer.setReverseHolo(false);
    clearTimeout(holdTimer);
    pressed = false;
    startedIdle = false;
  }
  if (engine.requestJump()) canvas.dataset.jumps = String(Number(canvas.dataset.jumps ?? 0) + 1);
  last = performance.now();
}

function beginPress(): void {
  if (pressed) return;
  pressed = true;
  startedIdle = engine.state.phase === "idle";
  action();
  clearTimeout(holdTimer);
  holdTimer = window.setTimeout(() => {
    if (pressed && startedIdle && engine.state.phase === "running") {
      renderer.setReverseHolo(true);
    }
  }, 1500);
}

function endPress(): void {
  pressed = false;
  clearTimeout(holdTimer);
}
function frame(now: number): void {
  try { const gap = now - last; last = now; if (gap > 250) { engine.pause(); accumulator = 0; paused = true; } if (!paused) { accumulator += Math.min(gap, 80) / 1000; let steps = 0; while (accumulator >= 1 / 120 && steps < 8) { engine.tick(1 / 120); accumulator -= 1 / 120; steps += 1; } lastSteps = steps; }
  for (const event of engine.drainEvents()) { renderer.handleEvent(event, now); if (event.type === "jump") audio.jump(); if (event.type === "pad") audio.pad(); if (event.type === "gameover") { audio.crash(); navigator.vibrate?.(40); status.textContent = "Crashed"; } if (event.type === "complete") { audio.complete(); navigator.vibrate?.([20, 40, 20]); status.textContent = "Complete"; } }
  renderer.draw(engine.state, now); canvas.dataset.phase = engine.state.phase; canvas.dataset.playerState = engine.state.player.grounded ? "grounded" : "jumping"; requestAnimationFrame(frame);
  } catch (error) { if (!loopErrorLogged) { console.error(error); loopErrorLogged = true; } engine.pause(); paused = true; accumulator = 0; requestAnimationFrame(frame); }
}
const jumpKeys = new Set(["Space", "ArrowUp", "KeyW", "Enter"]);
window.addEventListener("keydown", (event) => {
  if (jumpKeys.has(event.code) && !event.repeat) {
    event.preventDefault();
    beginPress();
  }
});
window.addEventListener("keyup", (event) => {
  if (jumpKeys.has(event.code)) endPress();
});
jumpButton.addEventListener("pointerdown", (event) => {
  const primaryMouse = event.pointerType === "mouse" && event.button === 0;
  const touchOrPen = event.pointerType === "touch" || event.pointerType === "pen";
  if (!event.isPrimary || (!primaryMouse && !touchOrPen)) return;
  event.preventDefault();
  beginPress();
});
jumpButton.addEventListener("pointerup", endPress);
jumpButton.addEventListener("pointercancel", endPress);
window.addEventListener("blur", () => { paused = true; accumulator = 0; engine.pause(); }); document.addEventListener("visibilitychange", () => { paused = document.hidden; accumulator = 0; if (document.hidden) engine.pause(); });
window.addEventListener("resize", resize); window.visualViewport?.addEventListener("resize", resize); window.addEventListener("orientationchange", resize); new ResizeObserver(resize).observe(document.documentElement);
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
renderer.setReducedMotion(motionQuery.matches);
motionQuery.addEventListener("change", (event) => renderer.setReducedMotion(event.matches));
muteButton.setAttribute("aria-pressed", String(audio.isMuted)); muteButton.classList.toggle("muted", audio.isMuted); muteButton.textContent = "";
muteButton.addEventListener("click", () => { audio.gesture(); audio.setMuted(!audio.isMuted); muteButton.setAttribute("aria-pressed", String(audio.isMuted)); muteButton.classList.toggle("muted", audio.isMuted); });
if (import.meta.env.DEV || import.meta.env.VITE_E2E === "true") (window as Window & { __RAREBIT_TEST__?: unknown }).__RAREBIT_TEST__ = {
  snapshot: () => ({
    phase: engine.state.phase,
    player: engine.state.player,
    camera: renderer.camera,
    world: { groundY: WORLD.groundY, speed: WORLD.speed },
    reducedMotion: renderer.reducedMotion,
    reverseHolo: renderer.reverseHolo,
    renderRotation: renderer.reducedMotion ? 0 : engine.state.player.rotation,
    trailEnabled: !renderer.reducedMotion,
    parallaxEnabled: !renderer.reducedMotion,
    animationState: { nowMs: performance.now(), crashAt: engine.state.phase === "gameover" },
    muted: audio.isMuted,
    audioInitialized: audio.initialized,
    lastSteps,
  }),
  setDistance: (distance: number) => engine.setDistanceForTest(distance),
  press: beginPress,
  release: endPress,
};
resize(); renderer.draw(engine.state); requestAnimationFrame(frame);
