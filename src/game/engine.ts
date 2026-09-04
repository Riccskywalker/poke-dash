import type { GameEvent, GameState, Obstacle, ObstacleKind, Rect } from './types';

export const WORLD = {
  width: 900,
  height: 260,
  groundY: 211,
  gravity: 2200,
  jumpVelocity: -720,
  baseSpeed: 305,
  maxSpeed: 610,
} as const;

const KINDS: readonly ObstacleKind[] = ['rock', 'ball', 'grass'];

export function intersects(a: Rect, b: Rect, padding = 0): boolean {
  return (
    a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding
  );
}

export function speedForScore(score: number): number {
  return Math.min(WORLD.maxSpeed, WORLD.baseSpeed + score * 0.33);
}

function dimensions(kind: ObstacleKind): Pick<Rect, 'width' | 'height' | 'y'> {
  if (kind === 'ball') return { width: 34, height: 34, y: WORLD.groundY - 34 };
  if (kind === 'grass') return { width: 42, height: 38, y: WORLD.groundY - 38 };
  return { width: 34, height: 31, y: WORLD.groundY - 31 };
}

export class PikaRunnerEngine {
  public state: GameState;
  private nextSpawnMs = 1250;
  private nextId = 1;
  private readonly events: GameEvent[] = [];

  constructor(private readonly random: () => number = Math.random) {
    this.state = this.initialState();
  }

  private initialState(): GameState {
    return {
      phase: 'idle',
      player: {
        x: 72,
        y: WORLD.groundY - 48,
        width: 56,
        height: 48,
        velocityY: 0,
        grounded: true,
      },
      obstacles: [],
      score: 0,
      distance: 0,
      speed: WORLD.baseSpeed,
      elapsedMs: 0,
    };
  }

  reset(): void {
    this.state = this.initialState();
    this.nextSpawnMs = 1100;
    this.events.length = 0;
  }

  start(): void {
    if (this.state.phase === 'idle') this.state.phase = 'running';
  }

  jump(): boolean {
    if (this.state.phase === 'idle') this.start();
    if (this.state.phase !== 'running' || !this.state.player.grounded) return false;
    this.state.player.grounded = false;
    this.state.player.velocityY = WORLD.jumpVelocity;
    this.events.push({ type: 'jump' });
    return true;
  }

  tick(deltaSeconds: number): void {
    if (this.state.phase !== 'running') return;
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const state = this.state;
    state.elapsedMs += dt * 1000;
    state.distance += state.speed * dt;
    state.score = Math.floor(state.distance / 12);
    state.speed = speedForScore(state.score);

    this.updatePlayer(dt);
    state.obstacles.forEach((obstacle) => {
      obstacle.x -= state.speed * dt;
    });
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);

    this.nextSpawnMs -= dt * 1000;
    if (this.nextSpawnMs <= 0) this.spawn();

    const hit = state.obstacles.some((obstacle) => intersects(state.player, obstacle, 6));
    if (hit) {
      state.phase = 'gameover';
      this.events.push({ type: 'gameover', score: state.score });
    }
  }

  private updatePlayer(dt: number): void {
    const player = this.state.player;
    if (player.grounded) return;
    player.velocityY += WORLD.gravity * dt;
    player.y += player.velocityY * dt;
    if (player.y + player.height >= WORLD.groundY) {
      player.y = WORLD.groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  private spawn(): void {
    const kind = KINDS[Math.floor(this.random() * KINDS.length)];
    this.injectObstacle(kind, WORLD.width + 20);
    const difficulty = (this.state.speed - WORLD.baseSpeed) / (WORLD.maxSpeed - WORLD.baseSpeed);
    this.nextSpawnMs = 900 + this.random() * 500 - difficulty * 260;
  }

  injectObstacle(kind: ObstacleKind, x: number, y?: number): Obstacle {
    const size = dimensions(kind);
    const obstacle = { id: this.nextId++, kind, x, ...size, ...(y === undefined ? {} : { y }) };
    this.state.obstacles.push(obstacle);
    return obstacle;
  }

  drainEvents(): GameEvent[] {
    return this.events.splice(0);
  }
}
