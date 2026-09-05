import type {
  GameEvent,
  GameState,
  Obstacle,
  ObstacleKind,
  Rect,
} from "./types";

export const WORLD = {
  width: 960,
  height: 420,
  groundY: 338,
  playerX: 150,
  playerSize: 42,
  gravity: 1900,
  jumpVelocity: -720,
  padVelocity: -930,
  speed: 330,
  levelLength: 7200,
} as const;
type Blueprint = {
  x: number;
  kind: ObstacleKind;
  width: number;
  height: number;
};
export const LEVEL: readonly Blueprint[] = [
  { x: 650, kind: "spike", width: 34, height: 34 },
  { x: 980, kind: "spike", width: 34, height: 34 },
  { x: 1260, kind: "block", width: 44, height: 44 },
  { x: 1610, kind: "spike", width: 34, height: 34 },
  { x: 1648, kind: "spike", width: 34, height: 34 },
  { x: 2050, kind: "pad", width: 58, height: 12 },
  { x: 2500, kind: "block", width: 44, height: 54 },
  { x: 2850, kind: "spike", width: 34, height: 34 },
  { x: 3200, kind: "spike", width: 34, height: 34 },
  { x: 3238, kind: "spike", width: 34, height: 34 },
  { x: 3600, kind: "block", width: 50, height: 68 },
  { x: 4100, kind: "pad", width: 58, height: 12 },
  { x: 4540, kind: "spike", width: 34, height: 34 },
  { x: 4578, kind: "spike", width: 34, height: 34 },
  { x: 5000, kind: "block", width: 44, height: 44 },
  { x: 5450, kind: "spike", width: 34, height: 34 },
  { x: 5820, kind: "spike", width: 34, height: 34 },
  { x: 6180, kind: "pad", width: 58, height: 12 },
  { x: 6650, kind: "block", width: 48, height: 58 },
];
export function intersects(a: Rect, b: Rect, padding = 0): boolean {
  return a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding;
}
export class RareBitDashEngine {
  public state: GameState;
  private readonly events: GameEvent[] = [];
  private nextId = 1;
  constructor() {
    this.state = this.initialState(1);
  }
  private initialState(attempt: number): GameState {
    return {
      phase: "idle",
      player: {
        x: WORLD.playerX,
        y: WORLD.groundY - WORLD.playerSize,
        width: WORLD.playerSize,
        height: WORLD.playerSize,
        velocityY: 0,
        grounded: true,
        rotation: 0,
      },
      obstacles: [],
      distance: 0,
      speed: WORLD.speed,
      elapsedMs: 0,
      attempt,
      progress: 0,
    };
  }
  reset(): void {
    this.state = this.initialState(this.state.attempt + 1);
    this.events.length = 0;
  }
  start(): void {
    if (this.state.phase === "idle") this.state.phase = "running";
  }
  jump(): boolean {
    if (this.state.phase === "idle") this.start();
    if (this.state.phase !== "running" || !this.state.player.grounded) {
      return false;
    }
    this.state.player.grounded = false;
    this.state.player.velocityY = WORLD.jumpVelocity;
    this.events.push({ type: "jump" });
    return true;
  }
  tick(deltaSeconds: number): void {
    if (this.state.phase !== "running") return;
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const s = this.state;
    s.elapsedMs += dt * 1000;
    s.distance += s.speed * dt;
    s.progress = Math.min(1, s.distance / WORLD.levelLength);
    this.updatePlayer(dt);
    s.obstacles = LEVEL.map((item) => this.toObstacle(item)).filter((o) =>
      o.x > -80 && o.x < WORLD.width + 80
    );
    const hit = s.obstacles.find((o) =>
      o.kind !== "pad" && intersects(s.player, o, 6)
    );
    if (hit) {
      s.phase = "gameover";
      this.events.push({ type: "gameover", attempt: s.attempt });
      return;
    }
    const pad = s.obstacles.find((o) =>
      o.kind === "pad" && intersects(s.player, o, 3)
    );
    if (pad && s.player.velocityY >= 0) {
      s.player.velocityY = WORLD.padVelocity;
      s.player.grounded = false;
    }
    if (s.distance >= WORLD.levelLength) {
      s.phase = "complete";
      s.progress = 1;
      this.events.push({ type: "complete" });
    }
  }
  private toObstacle(item: Blueprint): Obstacle {
    return {
      id: this.nextId++,
      kind: item.kind,
      worldX: item.x,
      x: item.x - this.state.distance + WORLD.playerX,
      y: WORLD.groundY - item.height,
      width: item.width,
      height: item.height,
    };
  }
  private updatePlayer(dt: number): void {
    const p = this.state.player;
    if (p.grounded) return;
    p.velocityY += WORLD.gravity * dt;
    p.y += p.velocityY * dt;
    p.rotation += 270 * dt;
    if (p.y + p.height >= WORLD.groundY) {
      p.y = WORLD.groundY - p.height;
      p.velocityY = 0;
      p.grounded = true;
      p.rotation = Math.round(p.rotation / 90) * 90;
    }
  }
  completeForTest(): void {
    if (this.state.phase === "idle") this.start();
    this.state.distance = WORLD.levelLength;
    this.state.progress = 1;
    this.state.phase = "complete";
    this.events.push({ type: "complete" });
  }
  drainEvents(): GameEvent[] {
    return this.events.splice(0);
  }
}
