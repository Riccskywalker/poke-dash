import "./style.css";
import { RareBitDashEngine } from "./game/engine";
import { GameRenderer } from "./game/renderer";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="page">
    <header class="intro"><img src="/rarebit-icon.svg" alt="RareBit" class="brand-icon"><div><p class="eyebrow">RAREBIT ARCADE</p><h1>RareBit Dash</h1><p>One level. One button. Guide the RareBit gem across a geometric world inspired by precision platformers.</p></div></header>
    <section class="game-section" aria-labelledby="game-title"><h2 id="game-title" class="visually-hidden">RareBit Dash</h2><div class="canvas-wrap"><canvas id="game-canvas" data-testid="game-canvas" data-phase="idle" data-player-state="grounded" data-jumps="0" width="960" height="420" aria-label="RareBit Dash: press space, arrow up, or tap to jump"></canvas></div><button id="jump-button" type="button" aria-label="Jump">↑ JUMP</button><p id="game-status" class="status" role="status" aria-live="polite">Press space or tap to start.</p></section>
    <section class="how-to"><h2>How to play</h2><p>Auto-scroll through the level. Jump over lime spikes and blocks. Land on pale jump pads for extra height.</p></section>
    <footer><p>Built for RareBit. Original project assets only.</p><a href="https://github.com/Riccskywalker/poke-dash">Source code</a></footer>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const engine = new RareBitDashEngine();
const renderer = new GameRenderer(canvas);
const status = document.querySelector<HTMLParagraphElement>("#game-status")!;
const button = document.querySelector<HTMLButtonElement>("#jump-button")!;
let last = performance.now();

function action(): void {
  if (engine.state.phase === "gameover" || engine.state.phase === "complete") {
    engine.reset();
    status.textContent = "New attempt.";
  }
  if (engine.jump()) {
    canvas.dataset.jumps = String(Number(canvas.dataset.jumps || 0) + 1);
    status.textContent = "Keep moving.";
  }
  last = performance.now();
}
function frame(now: number): void {
  engine.tick((now - last) / 1000);
  last = now;
  for (const event of engine.drainEvents()) {
    if (event.type === "gameover") {
      status.textContent = "Crashed. Try the level again.";
    }
    if (event.type === "complete") {
      status.textContent = "Level complete. Excellent run.";
    }
  }
  renderer.draw(engine.state);
  canvas.dataset.phase = engine.state.phase;
  canvas.dataset.playerState = engine.state.player.grounded
    ? "grounded"
    : "jumping";
  button.textContent =
    engine.state.phase === "gameover" || engine.state.phase === "complete"
      ? "↻ RETRY"
      : "↑ JUMP";
  requestAnimationFrame(frame);
}
window.addEventListener("keydown", (event) => {
  if ((event.code === "Space" || event.code === "ArrowUp") && !event.repeat) {
    event.preventDefault();
    action();
  }
});
canvas.addEventListener("pointerdown", action);
button.addEventListener("pointerdown", action);
if (import.meta.env.DEV) {
  (window as Window & { __RAREBIT_TEST_COMPLETE__?: () => void })
    .__RAREBIT_TEST_COMPLETE__ = () => engine.completeForTest();
}
renderer.draw(engine.state);
requestAnimationFrame(frame);
