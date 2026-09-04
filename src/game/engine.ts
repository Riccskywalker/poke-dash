import type { BiomeId, Entity, EntityKind, GameEvent, GameState, Rect, StarterId } from './types';

export const WORLD = {
  width: 960,
  height: 460,
  groundY: 360,
  gravity: 2350,
  jumpVelocity: -840,
  baseSpeed: 350,
  maxSpeed: 720,
} as const;

const BIOMES: BiomeId[] = ['route', 'forest', 'cave', 'night'];
const GROUND_KINDS: EntityKind[] = ['diglett', 'voltorb'];
const AIR_KINDS: EntityKind[] = ['zubat', 'gastly'];

export function intersects(a: Rect, b: Rect, padding = 0): boolean {
  return (
    a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding
  );
}

export function speedForDistance(distance: number): number {
  return Math.min(WORLD.maxSpeed, WORLD.baseSpeed + distance * 0.014);
}

export function biomeForDistance(distance: number): BiomeId {
  return BIOMES[Math.floor(distance / 6200) % BIOMES.length];
}

function entitySize(kind: EntityKind): Pick<Rect, 'width' | 'height' | 'y'> {
  if (kind === 'oran' || kind === 'sitrus') {
    return { width: 34, height: 34, y: WORLD.groundY - 104 };
  }
  if (kind === 'zubat' || kind === 'gastly') {
    return { width: 54, height: 48, y: WORLD.groundY - 105 };
  }
  return { width: 50, height: 48, y: WORLD.groundY - 48 };
}

export class PokeRunEngine {
  public state: GameState;
  private readonly random: () => number;
  private nextSpawnMs = 950;
  private nextEntityId = 1;
  private eventQueue: GameEvent[] = [];

  constructor(starter: StarterId = 'pikachu', random: () => number = Math.random) {
    this.random = random;
    this.state = this.makeInitialState(starter);
  }

  private makeInitialState(starter: StarterId): GameState {
    return {
      phase: 'ready',
      starter,
      player: {
        x: 132,
        y: WORLD.groundY - 64,
        width: 64,
        height: 64,
        velocityY: 0,
        grounded: true,
        ducking: false,
        invincibleUntil: 0,
      },
      entities: [],
      score: 0,
      bonusScore: 0,
      distance: 0,
      speed: WORLD.baseSpeed,
      hearts: 3,
      berries: 0,
      combo: 0,
      energy: 0,
      elapsedMs: 0,
      biome: 'route',
      specialUntil: 0,
    };
  }

  reset(starter: StarterId = this.state.starter): void {
    this.state = this.makeInitialState(starter);
    this.nextSpawnMs = 850;
    this.eventQueue = [];
  }

  start(): void {
    if (this.state.phase === 'ready') this.state.phase = 'running';
  }

  togglePause(): void {
    if (this.state.phase === 'running') this.state.phase = 'paused';
    else if (this.state.phase === 'paused') this.state.phase = 'running';
  }

  jump(): boolean {
    if (this.state.phase === 'ready') this.start();
    if (this.state.phase !== 'running' || !this.state.player.grounded) return false;
    this.setDucking(false);
    this.state.player.grounded = false;
    this.state.player.velocityY = WORLD.jumpVelocity;
    this.eventQueue.push({ type: 'jump' });
    return true;
  }

  setDucking(ducking: boolean): void {
    const player = this.state.player;
    if (!player.grounded && ducking) return;
    const bottom = player.y + player.height;
    player.ducking = ducking;
    player.height = ducking ? 38 : 64;
    player.width = ducking ? 70 : 64;
    player.y = bottom - player.height;
  }

  useSpecial(): boolean {
    const state = this.state;
    if (state.phase !== 'running' || state.energy < 100) return false;
    state.energy = 0;
    state.specialUntil = state.elapsedMs + 900;
    const before = state.entities.length;
    state.entities = state.entities.filter((entity) => entity.kind === 'oran' || entity.kind === 'sitrus' || entity.x > 820);
    const cleared = before - state.entities.length;
    state.bonusScore += cleared * 200;
    this.eventQueue.push({ type: 'special', cleared });
    return true;
  }

  tick(deltaSeconds: number): void {
    const state = this.state;
    if (state.phase !== 'running') return;

    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const deltaMs = dt * 1000;
    state.elapsedMs += deltaMs;
    state.distance += state.speed * dt;
    state.speed = speedForDistance(state.distance);
    state.score = Math.floor(state.distance / 10) + state.bonusScore;

    const biome = biomeForDistance(state.distance);
    if (biome !== state.biome) {
      state.biome = biome;
      this.eventQueue.push({ type: 'biome', biome });
    }

    this.updatePlayer(dt);
    state.entities.forEach((entity) => {
      entity.x -= state.speed * dt;
    });
    state.entities = state.entities.filter((entity) => entity.x + entity.width > -30 && !entity.collected);

    this.nextSpawnMs -= deltaMs;
    if (this.nextSpawnMs <= 0) this.spawnPattern();
    this.resolveCollisions();
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

  private spawnPattern(): void {
    const difficulty = (this.state.speed - WORLD.baseSpeed) / (WORLD.maxSpeed - WORLD.baseSpeed);
    const roll = this.random();

    if (roll < 0.23) {
      this.spawnEntity(this.random() < 0.82 ? 'oran' : 'sitrus');
      if (this.random() < 0.45) this.spawnEntity('oran', 72);
    } else {
      const pool = roll < 0.67 ? GROUND_KINDS : AIR_KINDS;
      this.spawnEntity(pool[Math.floor(this.random() * pool.length)]);
    }

    const jitter = this.random() * 420;
    this.nextSpawnMs = Math.max(570, 1120 - difficulty * 370) + jitter;
  }

  private spawnEntity(kind: EntityKind, xOffset = 0): void {
    const size = entitySize(kind);
    this.state.entities.push({
      id: this.nextEntityId++,
      kind,
      x: WORLD.width + 50 + xOffset,
      ...size,
    });
  }

  private resolveCollisions(): void {
    const state = this.state;
    for (const entity of state.entities) {
      if (entity.collected || !intersects(state.player, entity, 8)) continue;
      if (entity.kind === 'oran' || entity.kind === 'sitrus') {
        entity.collected = true;
        state.berries += 1;
        state.combo += 1;
        const isSitrus = entity.kind === 'sitrus';
        state.energy = Math.min(100, state.energy + (isSitrus ? 50 : 34));
        if (isSitrus && state.hearts < 3) state.hearts += 1;
        state.bonusScore += 100 * state.combo;
        this.eventQueue.push({ type: 'berry', kind: entity.kind, combo: state.combo });
        continue;
      }

      if (state.elapsedMs < state.specialUntil) {
        entity.collected = true;
        state.bonusScore += 200;
        continue;
      }

      if (state.elapsedMs < state.player.invincibleUntil) continue;
      entity.collected = true;
      state.hearts -= 1;
      state.combo = 0;
      state.player.invincibleUntil = state.elapsedMs + 1400;
      this.eventQueue.push({ type: 'hit', hearts: state.hearts });
      if (state.hearts <= 0) {
        state.phase = 'gameover';
        this.eventQueue.push({ type: 'gameover', score: state.score });
        break;
      }
    }
  }

  drainEvents(): GameEvent[] {
    const events = this.eventQueue;
    this.eventQueue = [];
    return events;
  }

  injectEntity(kind: EntityKind, x: number, y?: number): Entity {
    const size = entitySize(kind);
    const entity = { id: this.nextEntityId++, kind, x, ...size, ...(y === undefined ? {} : { y }) };
    this.state.entities.push(entity);
    return entity;
  }
}
