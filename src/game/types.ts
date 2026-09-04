export type Phase = 'idle' | 'running' | 'gameover';
export type ObstacleKind = 'rock' | 'ball' | 'grass';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Rect {
  velocityY: number;
  grounded: boolean;
}

export interface Obstacle extends Rect {
  id: number;
  kind: ObstacleKind;
}

export interface GameState {
  phase: Phase;
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  speed: number;
  elapsedMs: number;
}

export type GameEvent = { type: 'jump' } | { type: 'gameover'; score: number };
