import './style.css';
import { PikaRunnerEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { drawPixelPikachu } from './game/sprite';

interface RunRecord {
  score: number;
  date: string;
}

const STORAGE_KEY = 'pika-runner-records-v1';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="page">
    <header class="intro">
      <div class="sprite-preview" aria-hidden="true">
        <canvas id="sprite-preview" width="92" height="92"></canvas>
      </div>
      <div>
        <h1>Pika Runner</h1>
        <p>
          Pikachu, una strada infinita. Premi <strong>spazio</strong> o tocca il gioco per saltare.
          Evita rocce, erba alta e Poké Ball. Prova a battere il tuo record.
        </p>
      </div>
    </header>

    <section class="game-section" aria-labelledby="game-title">
      <h2 id="game-title" class="visually-hidden">Gioco Pika Runner</h2>
      <canvas
        id="game-canvas"
        data-testid="game-canvas"
        data-phase="idle"
        data-player-state="grounded"
        width="900"
        height="260"
        aria-label="Pika Runner: premi spazio o tocca per saltare"
      ></canvas>
      <button id="jump-button" class="jump-button" type="button" aria-label="Salta">
        <span>↑</span> SALTA
      </button>
      <p id="game-status" class="status" role="status" aria-live="polite">Premi spazio per iniziare.</p>
    </section>

    <section class="scores" aria-labelledby="scores-title">
      <h2 id="scores-title">Migliori corse</h2>
      <ol id="score-list"></ol>
    </section>

    <footer>
      <p>Fan game non ufficiale. Pokémon appartiene ai rispettivi titolari.</p>
      <a href="https://github.com/Riccskywalker/poke-dash">Codice sorgente</a>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const renderer = new GameRenderer(canvas);
const engine = new PikaRunnerEngine();
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
    list.innerHTML = '<li><span>1</span><strong>Nessun record</strong><b>00000</b></li>';
    return;
  }
  list.innerHTML = entries
    .map((entry, index) => `<li><span>${index + 1}</span><strong>Corsa ${index + 1}</strong><b>${String(entry.score).padStart(5, '0')}</b></li>`)
    .join('');
}

function jump(): void {
  if (engine.state.phase === 'gameover') {
    engine.reset();
    status.textContent = 'Nuova corsa.';
  }
  if (engine.jump()) status.textContent = 'Pikachu è in corsa.';
  lastFrame = performance.now();
}

function loop(now: number): void {
  engine.tick((now - lastFrame) / 1000);
  lastFrame = now;

  for (const event of engine.drainEvents()) {
    if (event.type === 'gameover') {
      saveScore(event.score);
      status.textContent = `Game over. ${event.score} punti.`;
    }
  }

  renderer.draw(engine.state, highScore());
  canvas.dataset.phase = engine.state.phase;
  canvas.dataset.playerState = engine.state.player.grounded ? 'grounded' : 'jumping';
  jumpButton.textContent = engine.state.phase === 'gameover' ? '↻ RIPROVA' : '↑ SALTA';
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
drawPixelPikachu(previewContext, 17, 21, 0, 2);

renderRecords();
renderer.draw(engine.state, highScore());
requestAnimationFrame(loop);
