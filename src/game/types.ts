export type Phase = "idle" | "running" | "paused" | "gameover" | "complete";
export type ObstacleKind = "spike" | "block" | "pad";
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Player extends Rect {
  velocityY: number;
  grounded: boolean;
  rotation: number;
  supportingSlabId?: number;
}
export interface Obstacle extends Rect {
  id: number;
  kind: ObstacleKind;
  worldX: number;
}
export interface GameState {
  phase: Phase;
  player: Player;
  obstacles: Obstacle[];
  distance: number;
  speed: number;
  elapsedMs: number;
  attempt: number;
  progress: number;
}
export type GameEvent =
  | { type: "jump" }
  | { type: "pad" }
  | { type: "gameover"; attempt: number }
  | { type: "complete" };
