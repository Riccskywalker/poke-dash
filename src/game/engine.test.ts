import { describe, expect, it } from "vitest";
import { intersects, LEVEL, RareBitDashEngine } from "./engine";

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
  it("can complete the authored level with scheduled jumps", () => {
    const engine = new RareBitDashEngine();
    engine.start();
    for (
      let frame = 0;
      frame < 1800 && engine.state.phase === "running";
      frame += 1
    ) {
      if (engine.state.player.grounded && engine.jump()) {
        engine.state.player.velocityY = -2000;
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
    engine.state.distance = LEVEL[0].x;
    engine.tick(1 / 60);
    expect(engine.state.phase).toBe("gameover");
  });
  it("finishes through the development test hook", () => {
    const engine = new RareBitDashEngine();
    engine.completeForTest();
    expect(engine.state.phase).toBe("complete");
    expect(engine.state.progress).toBe(1);
  });
  it("increments attempts on reset", () => {
    const engine = new RareBitDashEngine();
    engine.reset();
    expect(engine.state.attempt).toBe(2);
  });
});
