import './style.css';
import { GameAudio } from './game/audio';
import { PokeRunEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import type { GameEvent, StarterId } from './game/types';

const STARTERS: Array<{ id: StarterId; name: string; type: string; sprite: string; color: string }> = [
  { id: 'pikachu', name: 'Pikachu', type: 'Elettro', sprite: '/assets/pokemon/25.gif', color: '#f0c928' },
  { id: 'bulbasaur', name: 'Bulbasaur', type: 'Erba', sprite: '/assets/pokemon/1.gif', color: '#67b99a' },
  { id: 'charmander', name: 'Charmander', type: 'Fuoco', sprite: '/assets/pokemon/4.gif', color: '#ef8354' },
  { id: 'squirtle', name: 'Squirtle', type: 'Acqua', sprite: '/assets/pokemon/7.gif', color: '#69b7d4' },
];

interface ScoreEntry {
  trainer: string;
  pokemon: StarterId;
  score: number;
  date: string;
}

const STORAGE_KEY = 'pokerun-highscores-v1';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#game" aria-label="PokéRun, torna al gioco">
      <span class="brand-ball" aria-hidden="true"><i></i></span>
      <span>POKÉ<span>RUN</span></span>
    </a>
    <nav aria-label="Navigazione principale">
      <a href="#how-to-play">Come si gioca</a>
      <a href="#hall-of-fame">Record</a>
      <button class="icon-button" id="sound-toggle" type="button" aria-label="Disattiva audio" title="Audio">♪</button>
    </nav>
  </header>

  <main>
    <section class="hero" id="game">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> RUNNER ARCADE</p>
        <h1>La tua avventura<br><em>non si ferma.</em></h1>
        <p>Scegli il tuo compagno, schiva i Pokémon selvatici e raccogli bacche per liberare la tua mossa speciale.</p>
      </div>

      <div class="game-frame">
        <div class="frame-topbar">
          <div><span class="live-dot"></span> PERCORSO ATTIVO</div>
          <div class="frame-actions">
            <span id="biome-label">Percorso 01</span>
            <button class="frame-button" id="pause-button" type="button" aria-label="Metti in pausa">Ⅱ</button>
            <button class="frame-button" id="fullscreen-button" type="button" aria-label="Schermo intero">⛶</button>
          </div>
        </div>

        <div class="canvas-wrap" id="canvas-wrap">
          <canvas width="960" height="460" data-testid="game-canvas" data-player-state="grounded" aria-label="Area di gioco PokéRun"></canvas>

          <div class="game-hud" aria-label="Statistiche partita">
            <div class="hud-score"><small>PUNTI</small><strong id="score">00000</strong></div>
            <div class="hud-cluster">
              <div class="hearts" id="hearts" aria-label="3 vite">♥ ♥ ♥</div>
              <div class="berry-count"><img src="/assets/items/oran-berry.png" alt="" /><span id="berries">0</span></div>
              <div class="energy-wrap">
                <small>MOSSA</small>
                <div class="energy"><i id="energy-fill"></i></div>
              </div>
            </div>
          </div>

          <div class="game-overlay" id="start-overlay">
            <div class="overlay-card chooser-card">
              <span class="card-kicker">NUOVA CORSA</span>
              <h2>Scegli il tuo compagno</h2>
              <p>Ogni Pokémon corre allo stesso modo. Scegli il tuo preferito.</p>
              <div class="starter-grid">
                ${STARTERS.map(
                  (starter) => `
                    <button class="starter-card${starter.id === 'pikachu' ? ' selected' : ''}" type="button" data-starter="${starter.id}" aria-pressed="${starter.id === 'pikachu'}" style="--starter-color:${starter.color}">
                      <span class="sprite-disc"><img src="${starter.sprite}" alt="" /></span>
                      <strong>${starter.name}</strong>
                      <small>${starter.type}</small>
                    </button>`,
                ).join('')}
              </div>
              <label class="trainer-field">NOME ALLENATORE
                <input id="trainer-name" maxlength="16" value="Allenatore" autocomplete="nickname" />
              </label>
              <button class="primary-button" id="start-button" type="button">Inizia la corsa <span>→</span></button>
            </div>
          </div>

          <div class="game-overlay compact hidden" id="pause-overlay">
            <div class="overlay-card compact-card">
              <span class="card-kicker">PAUSA</span>
              <h2>Gioco in pausa</h2>
              <p>Premi P o tocca Riprendi quando sei pronto.</p>
              <button class="primary-button" id="resume-button" type="button">Riprendi <span>→</span></button>
            </div>
          </div>

          <div class="game-overlay compact hidden" id="gameover-overlay">
            <div class="overlay-card compact-card">
              <span class="card-kicker">FINE CORSA</span>
              <h2><span id="final-score">0</span> punti</h2>
              <p id="run-verdict">Un buon inizio. Il prossimo record è già vicino.</p>
              <div class="result-stats"><span><small>BACCHE</small><b id="final-berries">0</b></span><span><small>RECORD</small><b id="final-record">0</b></span></div>
              <div class="result-actions">
                <button class="secondary-button" id="change-starter" type="button">Cambia Pokémon</button>
                <button class="primary-button" id="retry-button" type="button">Riprova <span>↻</span></button>
              </div>
            </div>
          </div>

          <div class="combo-pop hidden" id="combo-pop" aria-hidden="true"></div>
        </div>

        <div class="controls-row">
          <div class="keyboard-hints" aria-label="Comandi tastiera">
            <span><kbd>SPACE</kbd> SALTA</span>
            <span><kbd>↓</kbd> ABBASSATI</span>
            <span><kbd>X</kbd> MOSSA</span>
            <span><kbd>P</kbd> PAUSA</span>
          </div>
          <div class="touch-controls">
            <button id="duck-button" type="button" aria-label="Abbassati">↓<small>GIÙ</small></button>
            <button id="jump-button" class="jump-control" type="button" aria-label="Salta">↑<small>SALTA</small></button>
            <button id="special-button" type="button" aria-label="Mossa speciale">✦<small>MOSSA</small></button>
          </div>
        </div>
      </div>
      <p class="status-line" id="game-status" role="status" aria-live="polite">Scegli un Pokémon per iniziare.</p>
    </section>

    <section class="features" id="how-to-play">
      <article><span>01</span><h3>Corri e schiva</h3><p>Salta Diglett e Voltorb. Abbassati quando Zubat e Gastly volano bassi.</p></article>
      <article><span>02</span><h3>Raccogli bacche</h3><p>Le Bacche aumentano il punteggio e caricano la barra della mossa.</p></article>
      <article><span>03</span><h3>Scatena la mossa</h3><p>Quando la barra è piena premi X: per un istante nulla può fermarti.</p></article>
    </section>

    <section class="hall" id="hall-of-fame">
      <div><p class="eyebrow"><span></span> RECORD LOCALI</p><h2>Hall of Fame</h2><p>I migliori risultati restano salvati su questo dispositivo.</p></div>
      <ol id="score-list" class="score-list"></ol>
    </section>
  </main>

  <footer>
    <span>PokéRun — fan game non ufficiale</span>
    <span>Pokémon e i relativi personaggi appartengono ai rispettivi titolari.</span>
    <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">Sprite: PokéAPI</a>
  </footer>
`;

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
const wrapper = document.querySelector<HTMLDivElement>('#canvas-wrap')!;
const engine = new PokeRunEngine();
const renderer = new GameRenderer(canvas);
const audio = new GameAudio();
let selectedStarter: StarterId = 'pikachu';
let trainerName = 'Allenatore';
let lastFrame = performance.now();
let comboTimer = 0;
let gamepadJumpPressed = false;
let gamepadDuckPressed = false;
let gamepadSpecialPressed = false;

const byId = <T extends HTMLElement>(id: string): T => document.querySelector<T>(`#${id}`)!;
const startOverlay = byId<HTMLDivElement>('start-overlay');
const pauseOverlay = byId<HTMLDivElement>('pause-overlay');
const gameoverOverlay = byId<HTMLDivElement>('gameover-overlay');
const status = byId<HTMLParagraphElement>('game-status');
const scoreElement = byId<HTMLElement>('score');
const heartsElement = byId<HTMLElement>('hearts');
const berryElement = byId<HTMLElement>('berries');
const energyFill = byId<HTMLElement>('energy-fill');
const specialButton = byId<HTMLButtonElement>('special-button');
const comboPop = byId<HTMLDivElement>('combo-pop');
const trainerInput = byId<HTMLInputElement>('trainer-name');

function getScores(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ScoreEntry[];
  } catch {
    return [];
  }
}

function highScore(): number {
  return getScores()[0]?.score ?? 0;
}

function saveScore(score: number): void {
  const entry: ScoreEntry = {
    trainer: trainerName || 'Allenatore',
    pokemon: selectedStarter,
    score,
    date: new Date().toISOString(),
  };
  const scores = [...getScores(), entry].sort((a, b) => b.score - a.score).slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  renderScores();
}

function renderScores(): void {
  const scores = getScores();
  const list = byId<HTMLOListElement>('score-list');
  if (scores.length === 0) {
    list.innerHTML = '<li class="empty-score"><span>—</span><strong>Il primo record può essere tuo</strong><b>00000</b></li>';
    return;
  }
  list.innerHTML = scores
    .map((entry, index) => {
      const starter = STARTERS.find((item) => item.id === entry.pokemon)!;
      return `<li><span>${String(index + 1).padStart(2, '0')}</span><img src="${starter.sprite}" alt="" /><strong>${escapeHtml(entry.trainer)}<small>${starter.name}</small></strong><b>${String(entry.score).padStart(5, '0')}</b></li>`;
    })
    .join('');
}

function escapeHtml(value: string): string {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

function startRun(starter = selectedStarter): void {
  selectedStarter = starter;
  trainerName = trainerInput.value.trim().slice(0, 16) || 'Allenatore';
  engine.reset(starter);
  engine.start();
  startOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  gameoverOverlay.classList.add('hidden');
  status.textContent = `${STARTERS.find((item) => item.id === starter)!.name} è in corsa.`;
  lastFrame = performance.now();
}

function showStarterChoice(): void {
  engine.reset(selectedStarter);
  gameoverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  startOverlay.classList.remove('hidden');
  status.textContent = 'Scegli un Pokémon per iniziare.';
}

function jump(): void {
  if (engine.jump()) audio.jump();
}

function duck(active: boolean): void {
  engine.setDucking(active);
}

function special(): void {
  if (engine.useSpecial()) audio.special();
}

function togglePause(): void {
  if (engine.state.phase !== 'running' && engine.state.phase !== 'paused') return;
  engine.togglePause();
  const paused = engine.state.phase === 'paused';
  pauseOverlay.classList.toggle('hidden', !paused);
  status.textContent = paused ? 'Gioco in pausa.' : 'Corsa ripresa.';
  byId<HTMLButtonElement>('pause-button').textContent = paused ? '▶' : 'Ⅱ';
  lastFrame = performance.now();
}

function handleEvent(event: GameEvent): void {
  if (event.type === 'berry') {
    audio.berry();
    comboPop.textContent = event.combo > 1 ? `COMBO ×${event.combo}` : event.kind === 'sitrus' ? 'BACCA SITRUS!' : '+ BACCA';
    comboPop.classList.remove('hidden');
    window.clearTimeout(comboTimer);
    comboTimer = window.setTimeout(() => comboPop.classList.add('hidden'), 700);
  }
  if (event.type === 'hit') {
    audio.hit();
    wrapper.classList.remove('impact');
    void wrapper.offsetWidth;
    wrapper.classList.add('impact');
    status.textContent = event.hearts > 0 ? `Attenzione: restano ${event.hearts} vite.` : 'La corsa è finita.';
  }
  if (event.type === 'special') status.textContent = `Mossa speciale: ${event.cleared} ostacoli spazzati via.`;
  if (event.type === 'biome') {
    const labels = { route: 'Percorso 01', forest: 'Bosco Smeraldo', cave: 'Monte Luna', night: 'Percorso Notte' };
    byId<HTMLElement>('biome-label').textContent = labels[event.biome];
    status.textContent = `Nuova area: ${labels[event.biome]}.`;
  }
  if (event.type === 'gameover') {
    audio.gameOver();
    saveScore(event.score);
    byId<HTMLElement>('final-score').textContent = String(event.score).padStart(5, '0');
    byId<HTMLElement>('final-berries').textContent = String(engine.state.berries);
    byId<HTMLElement>('final-record').textContent = String(highScore()).padStart(5, '0');
    byId<HTMLElement>('run-verdict').textContent =
      event.score >= highScore() && event.score > 0 ? 'Nuovo record! Questa corsa entra al primo posto.' : 'Il prossimo record è già vicino.';
    gameoverOverlay.classList.remove('hidden');
  }
}

function renderHud(): void {
  const state = engine.state;
  scoreElement.textContent = String(state.score).padStart(5, '0');
  heartsElement.textContent = `${'♥ '.repeat(state.hearts)}${'♡ '.repeat(3 - state.hearts)}`.trim();
  heartsElement.setAttribute('aria-label', `${state.hearts} vite`);
  berryElement.textContent = String(state.berries);
  energyFill.style.width = `${state.energy}%`;
  specialButton.classList.toggle('charged', state.energy >= 100);
  canvas.dataset.playerState = state.player.grounded ? (state.player.ducking ? 'ducking' : 'grounded') : 'jumping';
}

function pollGamepad(): void {
  const pad = navigator.getGamepads?.()[0];
  if (!pad) return;
  const jumpPressed = Boolean(pad.buttons[0]?.pressed || pad.buttons[12]?.pressed);
  const specialPressed = Boolean(pad.buttons[1]?.pressed);
  const duckPressed = Boolean(pad.buttons[13]?.pressed || pad.axes[1] > 0.5);
  if (jumpPressed && !gamepadJumpPressed) jump();
  if (specialPressed && !gamepadSpecialPressed) special();
  if (duckPressed !== gamepadDuckPressed) duck(duckPressed);
  gamepadJumpPressed = jumpPressed;
  gamepadSpecialPressed = specialPressed;
  gamepadDuckPressed = duckPressed;
}

function loop(now: number): void {
  pollGamepad();
  const delta = (now - lastFrame) / 1000;
  lastFrame = now;
  engine.tick(delta);
  engine.drainEvents().forEach(handleEvent);
  renderer.draw(engine.state);
  renderHud();
  requestAnimationFrame(loop);
}

document.querySelectorAll<HTMLButtonElement>('[data-starter]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedStarter = button.dataset.starter as StarterId;
    document.querySelectorAll<HTMLButtonElement>('[data-starter]').forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle('selected', selected);
      candidate.setAttribute('aria-pressed', String(selected));
    });
  });
});

byId<HTMLButtonElement>('start-button').addEventListener('click', () => startRun());
byId<HTMLButtonElement>('retry-button').addEventListener('click', () => startRun());
byId<HTMLButtonElement>('change-starter').addEventListener('click', showStarterChoice);
byId<HTMLButtonElement>('pause-button').addEventListener('click', togglePause);
byId<HTMLButtonElement>('resume-button').addEventListener('click', togglePause);
byId<HTMLButtonElement>('jump-button').addEventListener('pointerdown', jump);
byId<HTMLButtonElement>('special-button').addEventListener('pointerdown', special);

const duckButton = byId<HTMLButtonElement>('duck-button');
duckButton.addEventListener('pointerdown', () => duck(true));
['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => duckButton.addEventListener(name, () => duck(false)));

canvas.addEventListener('pointerdown', jump);

byId<HTMLButtonElement>('sound-toggle').addEventListener('click', (event) => {
  const enabled = audio.toggle();
  const button = event.currentTarget as HTMLButtonElement;
  button.textContent = enabled ? '♪' : '×';
  button.setAttribute('aria-label', enabled ? 'Disattiva audio' : 'Attiva audio');
});

byId<HTMLButtonElement>('fullscreen-button').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await wrapper.requestFullscreen();
});

window.addEventListener('keydown', (event) => {
  if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) {
    event.preventDefault();
    jump();
  }
  if (event.code === 'ArrowDown') {
    event.preventDefault();
    duck(true);
  }
  if (event.code === 'KeyX' && !event.repeat) special();
  if (event.code === 'KeyP' && !event.repeat) togglePause();
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowDown') duck(false);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine.state.phase === 'running') togglePause();
});

renderer.draw(engine.state);
renderHud();
renderScores();
requestAnimationFrame(loop);
