export type Phase = 'ready' | 'running' | 'paused' | 'gameover';
export type StarterId = 'pikachu' | 'bulbasaur' | 'charmander' | 'squirtle';
export type BiomeId = 'route' | 'forest' | 'cave' | 'night';
export type EntityKind = 'diglett' | 'voltorb' | 'zubat' | 'gastly' | 'oran' | 'sitrus';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Rect {
  velocityY: number;
  grounded: boolean;
  ducking: boolean;
  invincibleUntil: number;
}

export interface Entity extends Rect {
  id: number;
  kind: EntityKind;
  collected?: boolean;
}

export type GameEvent =
  | { type: 'jump' }
  | { type: 'berry'; kind: 'oran' | 'sitrus'; combo: number }
  | { type: 'hit'; hearts: number }
  | { type: 'special'; cleared: number }
  | { type: 'biome'; biome: BiomeId }
  | { type: 'gameover'; score: number };

export interface GameState {
  phase: Phase;
  starter: StarterId;
  player: Player;
  entities: Entity[];
  score: number;
  bonusScore: number;
  distance: number;
  speed: number;
  hearts: number;
  berries: number;
  combo: number;
  energy: number;
  elapsedMs: number;
  biome: BiomeId;
  specialUntil: number;
}
