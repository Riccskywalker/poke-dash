import { describe, expect, it } from "vitest";
import {
  intersects,
  LEVEL,
  playerHitbox,
  RareBitDashEngine,
  triangleIntersectsRect,
  WORLD,
} from "./engine";

describe("RareBit Dash engine", () => {
  it("detects padded collision", () => {
    expect(
      intersects({ x: 0, y: 0, width: 20, height: 20 }, {
        x: 15,
        y: 0,
        width: 20,
        height: 20,
      }, 2),
    ).toBe(true);
    expect(
      intersects({ x: 0, y: 0, width: 20, height: 20 }, {
        x: 21,
        y: 0,
        width: 20,
        height: 20,
      }),
    ).toBe(false);
  });
  it("rotates continuously in air and snaps to a quarter turn on landing", () => {
    const engine = new RareBitDashEngine();
    engine.jump();
    engine.tick(0.1);
    expect(engine.state.player.rotation).toBeGreaterThan(0);
    for (let i = 0; i < 100; i += 1) engine.tick(1 / 60);
    expect(engine.state.player.grounded).toBe(true);
    expect(engine.state.player.rotation % 90).toBe(0);
  });
  it("uses a 40px internal hitbox inside the 52px visual player", () => {
    expect(playerHitbox({ x: 0, y: 0, width: WORLD.playerSize, height: WORLD.playerSize })).toEqual({
      x: 6,
      y: 6,
      width: 40,
      height: 40,
    });
  });
  it("detects the center of a spike but not its empty shoulders", () => {
    const triangle: [number, number][] = [[100, 100], [117, 60], [134, 100]];
    expect(
      triangleIntersectsRect(triangle, {
        x: 108,
        y: 70,
        width: 18,
        height: 20,
      }),
    ).toBe(true);
    expect(
      triangleIntersectsRect(triangle, { x: 82, y: 80, width: 12, height: 12 }),
    ).toBe(false);
  });
  it("can complete the authored level with scheduled jumps", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    for (
      let frame = 0;
      frame < 1800 && engine.state.phase === "running";
      frame += 1
    ) {
      const next = LEVEL.find((item) =>
        item.kind !== "pad" && item.x > engine.state.distance
      );
      // Later double-shards are approached at 180px; the onboarding jump uses 220px.
      const trigger = next && next.x >= 3000 ? 180 : 220;
      if (next && next.x - engine.state.distance <= trigger) {
        engine.requestJump();
      }
      engine.tick(1 / 60);
    }
    expect(engine.state.phase, `stopped at ${engine.state.distance}`).toBe(
      "complete",
    );
  });
  it("collides with a deterministic obstacle", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(LEVEL[0].x);
    engine.tick(1 / 60);
    expect(engine.state.phase).toBe("gameover");
  });
  it("finishes through the development test hook", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(WORLD.levelLength);
    engine.tick(0);
    expect(engine.state.progress).toBe(1);
  });
  it("increments attempts on reset", () => {
    const engine = new RareBitDashEngine();
    engine.reset();
    expect(engine.state.attempt).toBe(2);
  });
  it("accepts a 90ms landing buffer and rejects a 130ms one", () => {
    const accepted = new RareBitDashEngine();
    accepted.start();
    accepted.state.player.grounded = false;
    const gap90 = 300 * 0.09 + 0.5 * WORLD.gravity * 0.09 * 0.09;
    accepted.state.player.y = WORLD.groundY - WORLD.playerSize - gap90;
    accepted.state.player.velocityY = 300;
    accepted.requestJump();
    for (let i = 0; i < 11; i++) accepted.tick(1 / 120);
    expect(accepted.state.player.velocityY).toBeLessThan(0);
    expect(accepted.state.player.grounded).toBe(false);
    const rejected = new RareBitDashEngine();
    rejected.start();
    rejected.state.player.grounded = false;
    const gap130 = 300 * 0.13 + 0.5 * WORLD.gravity * 0.13 * 0.13;
    rejected.state.player.y = WORLD.groundY - WORLD.playerSize - gap130;
    rejected.state.player.velocityY = 300;
    rejected.requestJump();
    for (let i = 0; i < 17; i++) rejected.tick(1 / 120);
    expect(rejected.state.player.grounded).toBe(true);
    expect(rejected.state.player.velocityY).toBe(0);
  });
  it("pauses without advancing physics and resumes explicitly", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.tick(0.2);
    const distance = engine.state.distance;
    engine.pause();
    engine.tick(1);
    expect(engine.state.distance).toBe(distance);
    expect(engine.state.phase).toBe("paused");
    engine.resume();
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("running");
    expect(engine.state.distance).toBeGreaterThan(distance);
  });
  it("keeps stable obstacle IDs and authored timing", () => {
    const engine = new RareBitDashEngine();
    const ids = engine.state.obstacles.map((o) => o.id);
    engine.tick(0);
    engine.tick(0.1);
    expect(engine.state.obstacles.map((o) => o.id)).toEqual(
      ids.slice(0, engine.state.obstacles.length),
    );
    expect(LEVEL[0].x / 330).toBeGreaterThanOrEqual(3);
    expect(9900 / 330).toBeGreaterThanOrEqual(25);
    expect(9900 / 330).toBeLessThanOrEqual(35);
  });
  it("lands on a slab from above", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1990);
    const slab = engine.state.obstacles.find((o) => o.kind === "block")!;
    engine.state.player.y = slab.y - engine.state.player.height;
    engine.state.player.velocityY = 100;
    engine.state.player.grounded = false;
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("running");
    expect(engine.state.player.grounded).toBe(true);
    expect(engine.state.player.supportingSlabId).toBe(slab.id);
    expect(engine.state.player.y).toBe(slab.y - engine.state.player.height);
  });
  it("keeps slab support for multiple physics ticks", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1990);
    const slab = engine.state.obstacles.find((o) => o.kind === "block")!;
    engine.state.player.y = slab.y - engine.state.player.height;
    engine.state.player.velocityY = 100;
    engine.state.player.grounded = false;
    engine.tick(1 / 120);
    const y = engine.state.player.y;
    for (let i = 0; i < 10; i++) {
      engine.tick(1 / 120);
      expect(engine.state.phase).toBe("running");
      expect(engine.state.player.supportingSlabId).toBe(slab.id);
      expect(engine.state.player.y).toBe(y);
    }
  });
  it("falls after moving beyond a slab edge", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1990);
    const slab = engine.state.obstacles.find((o) => o.kind === "block")!;
    engine.state.player.y = slab.y - engine.state.player.height;
    engine.state.player.velocityY = 100;
    engine.state.player.grounded = false;
    engine.tick(1 / 120);
    engine.state.player.x = slab.x + slab.width + 20;
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("running");
    expect(engine.state.player.grounded).toBe(false);
    expect(engine.state.player.supportingSlabId).toBeUndefined();
  });
  it("treats a slab side impact as lethal", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1990);
    const slab = engine.state.obstacles.find((o) => o.kind === "block")!;
    engine.state.player.grounded = false;
    engine.state.player.x = slab.x - engine.state.player.width + 4;
    engine.state.player.y = slab.y + 5;
    expect(engine.state.player.y + engine.state.player.height).toBeGreaterThan(slab.y);
    expect(engine.state.player.y).toBeLessThan(slab.y + slab.height);
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("gameover");
  });
  it("treats an underside slab impact as lethal", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1990);
    const slab = engine.state.obstacles.find((o) => o.kind === "block")!;
    engine.state.player.grounded = false;
    engine.state.player.y = slab.y + slab.height + 1;
    engine.state.player.velocityY = -6000;
    expect(engine.state.player.y).toBeGreaterThanOrEqual(slab.y + slab.height);
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("gameover");
  });
  it("activates a pad only while descending and once per crossing", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(3020);
    engine.state.player.y = 260;
    engine.state.player.grounded = false;
    engine.state.player.velocityY = -10;
    engine.tick(1 / 120);
    const rising = engine.state.player.velocityY;
    engine.state.player.velocityY = 100;
    engine.state.player.y = 280;
    engine.tick(1 / 120);
    const bounced = engine.state.player.velocityY;
    engine.tick(1 / 120);
    expect(rising).not.toBe(WORLD.padVelocity);
    expect(bounced).toBe(WORLD.padVelocity);
    expect(engine.state.player.velocityY).toBeGreaterThan(WORLD.padVelocity);
  });
  it("produces equivalent fixed physics from 30, 60 and 144Hz callbacks", () => {
    const runs = [30, 60, 144].map((rate) => {
      const engine = new RareBitDashEngine();
      engine.start();
      let accumulator = 0;
      for (let i = 0; i < rate; i++) {
        accumulator += 1 / rate;
        while (accumulator >= 1 / 120) {
          engine.tick(1 / 120);
          accumulator -= 1 / 120;
        }
      }
      return engine.state.distance;
    });
    expect(Math.max(...runs) - Math.min(...runs)).toBeLessThanOrEqual(
      330 / 120,
    );
  });
  it("preserves exact identity of an obstacle across ticks", () => {
    const engine = new RareBitDashEngine();
    engine.setDistanceForTest(1990);
    const original = engine.state.obstacles.find((o) => o.worldX === 1990)!;
    engine.start();
    engine.tick(0.1);
    expect(engine.state.obstacles.find((o) => o.worldX === 1990)).toBe(
      original,
    );
  });
  it("pauses with an imminent hazard without advancing or dying", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    engine.setDistanceForTest(1030);
    engine.state.player.y = 314;
    engine.state.player.grounded = false;
    engine.pause();
    const before = engine.state.distance;
    for (let i = 0; i < 60; i++) engine.tick(1 / 120);
    expect(engine.state.distance).toBe(before);
    expect(engine.state.phase).toBe("paused");
    engine.resume();
    engine.tick(1 / 120);
    expect(engine.state.phase).toBe("gameover");
  });
});
