import './style.css';
import { MewRunnerEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { drawPixelMew } from './game/sprite';

interface RunRecord {
  score: number;
  date: string;
}

const STORAGE_KEY = 'mew-runner-records-v1';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="page">
    <header class="intro">
      <div class="sprite-preview" aria-hidden="true">
        <canvas id="sprite-preview" width="92" height="92"></canvas>
      </div>
      <div>
        <h1>Mew Runner</h1>
        <p>
          Mew, one endless road. Press <strong>space</strong> or tap the game to jump.
          Dodge rocks, tall grass and Poké Balls. Beat your high score.
        </p>
      </div>
    </header>

    <section class="game-section" aria-labelledby="game-title">
      <h2 id="game-title" class="visually-hidden">Mew Runner game</h2>
      <canvas
        id="game-canvas"
        data-testid="game-canvas"
        data-phase="idle"
        data-player-state="grounded"
        data-jumps="0"
        width="900"
        height="260"
        aria-label="Mew Runner: press space or tap to jump"
      ></canvas>
      <button id="jump-button" class="jump-button" type="button" aria-label="Jump">
        <span>↑</span> JUMP
      </button>
      <p id="game-status" class="status" role="status" aria-live="polite">Press space to start.</p>
    </section>

    <section class="scores" aria-labelledby="scores-title">
      <h2 id="scores-title">Best runs</h2>
      <ol id="score-list"></ol>
    </section>

    <footer>
      <p>Unofficial fan game. Pokémon belongs to its respective owners.</p>
      <a href="https://github.com/Riccskywalker/poke-dash">Source code</a>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const renderer = new GameRenderer(canvas);
const engine = new MewRunnerEngine();
const status = document.querySelector<HTMLParagraphElement>('#game-status')!;
const jumpButton = document.querySelector<HTMLButtonElement>('#jump-button')!;
let lastFrame = performance.now();

function records(): RunRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RunRecord[];
  } catch {
    return [];
  }
}

function highScore(): number {
  return records()[0]?.score ?? 0;
}

function saveScore(score: number): void {
  const next = [...records(), { score, date: new Date().toISOString() }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  renderRecords();
}

function renderRecords(): void {
  const list = document.querySelector<HTMLOListElement>('#score-list')!;
  const entries = records();
  if (entries.length === 0) {
    list.innerHTML = '<li><span>1</span><strong>No runs yet</strong><b>00000</b></li>';
    return;
  }
  list.innerHTML = entries
    .map((entry, index) => `<li><span>${index + 1}</span><strong>Run ${index + 1}</strong><b>${String(entry.score).padStart(5, '0')}</b></li>`)
    .join('');
}

function jump(): void {
  if (engine.state.phase === 'gameover') {
    engine.reset();
    status.textContent = 'New run.';
  }
  if (engine.jump()) {
    canvas.dataset.jumps = String(Number(canvas.dataset.jumps ?? 0) + 1);
    canvas.dataset.playerState = 'jumping';
    status.textContent = 'Mew is running.';
  }
  lastFrame = performance.now();
}

function loop(now: number): void {
  engine.tick((now - lastFrame) / 1000);
  lastFrame = now;

  for (const event of engine.drainEvents()) {
    if (event.type === 'gameover') {
      saveScore(event.score);
      status.textContent = `Game over. ${event.score} points.`;
    }
  }

  renderer.draw(engine.state, highScore());
  canvas.dataset.phase = engine.state.phase;
  canvas.dataset.playerState = engine.state.player.grounded ? 'grounded' : 'jumping';
  jumpButton.textContent = engine.state.phase === 'gameover' ? '↻ RETRY' : '↑ JUMP';
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) {
    event.preventDefault();
    jump();
  }
});

canvas.addEventListener('pointerdown', jump);
jumpButton.addEventListener('pointerdown', jump);

const preview = document.querySelector<HTMLCanvasElement>('#sprite-preview')!;
const previewContext = preview.getContext('2d')!;
previewContext.fillStyle = '#fafafa';
previewContext.fillRect(0, 0, preview.width, preview.height);
previewContext.fillStyle = '#535353';
previewContext.fillRect(0, 70, preview.width, 2);
drawPixelMew(previewContext, 17, 21, 0, 2);

renderRecords();
renderer.draw(engine.state, highScore());
requestAnimationFrame(loop);
