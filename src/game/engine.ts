import type {
  GameEvent,
  GameState,
  Obstacle,
  ObstacleKind,
  Rect,
} from "./types";

export const PHYSICS_STEP = 1 / 120;
export const WORLD = {
  width: 960,
  height: 420,
  groundY: 338,
  playerX: 80,
  playerSize: 52,
  gravity: 1900,
  jumpVelocity: -720,
  padVelocity: -930,
  speed: 330,
  levelLength: 9900,
} as const;
type Blueprint = {
  x: number;
  kind: ObstacleKind;
  width: number;
  height: number;
};
export const LEVEL: readonly Blueprint[] = [
  { x: 1040, kind: "spike", width: 34, height: 24 },
  { x: 1510, kind: "spike", width: 34, height: 24 },
  { x: 1990, kind: "block", width: 70, height: 42 },
  { x: 2500, kind: "spike", width: 34, height: 24 },
  { x: 3020, kind: "pad", width: 58, height: 12 },
  { x: 3500, kind: "block", width: 70, height: 50 },
  { x: 4050, kind: "spike", width: 34, height: 24 },
  { x: 4650, kind: "pad", width: 58, height: 12 },
  { x: 5200, kind: "block", width: 70, height: 56 },
  { x: 6500, kind: "pad", width: 58, height: 12 },
  { x: 7400, kind: "spike", width: 34, height: 24 },
  { x: 7440, kind: "spike", width: 34, height: 24 },
  { x: 7900, kind: "spike", width: 34, height: 24 },
  { x: 8200, kind: "pad", width: 58, height: 12 },
  { x: 8500, kind: "block", width: 70, height: 42 },
  { x: 8750, kind: "block", width: 70, height: 58 },
  { x: 9300, kind: "spike", width: 34, height: 24 },
];

export function playerHitbox(player: Rect): Rect {
  const inset = Math.max(0, (player.width - 40) / 2);
  return { x: player.x + inset, y: player.y + inset, width: 40, height: 40 };
}
export function intersects(a: Rect, b: Rect, padding = 0): boolean {
  return a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding;
}
export function triangleIntersectsRect(
  triangle: readonly [number, number][],
  rect: Rect,
): boolean {
  const polygons = [triangle.map(([x, y]) => ({ x, y })), [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ]];
  const axes = polygons.flatMap((polygon) =>
    polygon.map((a, i) => {
      const b = polygon[(i + 1) % polygon.length];
      return { x: -(b.y - a.y), y: b.x - a.x };
    })
  );
  return axes.every((axis) => {
    const project = (polygon: { x: number; y: number }[]) =>
      polygon.map((p) => p.x * axis.x + p.y * axis.y);
    const a = project(polygons[0]), b = project(polygons[1]);
    return Math.max(...a) >= Math.min(...b) && Math.max(...b) >= Math.min(...a);
  });
}

export class RareBitDashEngine {
  public state: GameState;
  private readonly events: GameEvent[] = [];
  private readonly obstacles: Obstacle[];
  private jumpBuffer = 0;
  private padContact = -1;
  private paused = false;
  constructor() {
    this.obstacles = LEVEL.map((item, id) => ({
      id,
      kind: item.kind,
      worldX: item.x,
      x: item.x + WORLD.playerX,
      y: WORLD.groundY - item.height,
      width: item.width,
      height: item.height,
    }));
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
      obstacles: this.obstacles,
      distance: 0,
      speed: WORLD.speed,
      elapsedMs: 0,
      attempt,
      progress: 0,
    };
  }
  reset(): void {
    this.state = this.initialState(this.state.attempt + 1);
    this.jumpBuffer = 0;
    this.padContact = -1;
    this.paused = false;
    this.events.length = 0;
  }
  start(): void {
    if (this.state.phase === "idle") this.state.phase = "running";
  }
  requestJump(): boolean {
    if (this.state.phase === "idle") this.start();
    if (this.state.phase === "gameover" || this.state.phase === "complete") {
      return false;
    }
    this.jumpBuffer = 0.1;
    if (this.state.player.grounded) return this.performJump();
    return true;
  }
  press(): boolean {
    return this.requestJump();
  }
  jump(): boolean {
    return this.requestJump();
  }
  private performJump(): boolean {
    if (!this.state.player.grounded) return false;
    this.state.player.grounded = false;
    this.state.player.velocityY = WORLD.jumpVelocity;
    this.jumpBuffer = 0;
    this.events.push({ type: "jump" });
    return true;
  }
  pause(): void {
    if (this.state.phase === "running") {
      this.paused = true;
      this.state.phase = "paused";
    }
  }
  resume(): void {
    if (this.state.phase === "paused") {
      this.paused = false;
      this.state.phase = "running";
    }
  }
  tick(deltaSeconds: number): void {
    if (this.paused || this.state.phase !== "running") return;
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const s = this.state;
    s.elapsedMs += dt * 1000;
    s.distance += s.speed * dt;
    s.progress = Math.min(1, s.distance / WORLD.levelLength);
    this.updateObstacles();
    this.updatePlayer(dt);
    if (this.collides()) return;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (s.distance >= WORLD.levelLength) {
      s.phase = "complete";
      s.progress = 1;
      this.events.push({ type: "complete" });
    }
  }
  private updateObstacles(): void {
    for (const obstacle of this.obstacles) {
      obstacle.x = obstacle.worldX - this.state.distance + WORLD.playerX;
    }
    this.state.obstacles = this.obstacles.filter((o) =>
      o.x > -80 && o.x < WORLD.width + 80
    );
  }
  private updatePlayer(dt: number): void {
    const p = this.state.player;
    if (p.grounded && p.supportingSlabId !== undefined) {
      const slab = this.obstacles.find((o) => o.id === p.supportingSlabId);
      const horizontal = slab && p.x + p.width > slab.x &&
        p.x < slab.x + slab.width;
      if (slab && horizontal) {
        p.y = slab.y - p.height;
        if (this.jumpBuffer > 0) this.performJump();
        else return;
      }
      p.grounded = false;
      p.supportingSlabId = undefined;
    } else if (p.grounded) {
      if (this.jumpBuffer > 0) this.performJump();
      else return;
    }
    const previousBottom = p.y + p.height;
    p.velocityY += WORLD.gravity * dt;
    p.y += p.velocityY * dt;
    p.rotation += 270 * dt;
    if (p.y + p.height >= WORLD.groundY) {
      p.y = WORLD.groundY - p.height;
      p.velocityY = 0;
      p.grounded = true;
      p.supportingSlabId = undefined;
      p.rotation = Math.round(p.rotation / 90) * 90;
      if (this.jumpBuffer > 0) this.performJump();
    } else this.landOnSlab(previousBottom);
  }
  private landOnSlab(previousBottom: number): void {
    const p = this.state.player;
    const hit = this.obstacles.find((o) =>
      o.kind === "block" && p.velocityY >= 0 && previousBottom <= o.y &&
      p.y + p.height >= o.y && p.x + p.width > o.x && p.x < o.x + o.width
    );
    if (hit) {
      p.y = hit.y - p.height;
      p.velocityY = 0;
      p.grounded = true;
      p.supportingSlabId = hit.id;
    }
  }
  private collides(): boolean {
    const p = playerHitbox(this.state.player);
    for (const o of this.obstacles) {
      if (o.kind === "pad") {
        const padOverlap = intersects(this.state.player, o);
        if (
          this.state.player.velocityY > 0 && padOverlap &&
          this.padContact !== o.id
        ) {
          this.state.player.velocityY = WORLD.padVelocity;
          this.state.player.grounded = false;
          this.padContact = o.id;
          this.events.push({ type: "pad" });
        } else if (this.padContact === o.id && !padOverlap) {
          this.padContact = -1;
        }
        continue;
      }
      if (o.kind === "spike") {
        const triangle: [number, number][] = [[o.x + 5, o.y + o.height], [
          o.x + o.width / 2,
          o.y,
        ], [o.x + o.width - 5, o.y + o.height]];
        if (triangleIntersectsRect(triangle, p)) return this.die();
      } else if (intersects(p, o) && p.y + p.height > o.y + 8) {
        return this.die();
      }
    }
    return false;
  }
  private die(): boolean {
    this.state.phase = "gameover";
    this.events.push({ type: "gameover", attempt: this.state.attempt });
    return true;
  }
  setDistanceForTest(distance: number): void {
    this.state.distance = Math.max(0, distance);
    this.state.progress = Math.min(1, this.state.distance / WORLD.levelLength);
    this.updateObstacles();
  }
  drainEvents(): GameEvent[] {
    return this.events.splice(0);
  }
}
