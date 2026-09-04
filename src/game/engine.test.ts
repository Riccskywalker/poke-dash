import { describe, expect, it } from 'vitest';
import { MewRunnerEngine, WORLD, intersects, speedForScore } from './engine';

describe('Mew Runner', () => {
  it('detects a padded collision', () => {
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 15, y: 0, width: 20, height: 20 }, 2)).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 21, y: 0, width: 20, height: 20 })).toBe(false);
  });

  it('increases speed up to the limit', () => {
    expect(speedForScore(0)).toBe(WORLD.baseSpeed);
    expect(speedForScore(500)).toBeGreaterThan(WORLD.baseSpeed);
    expect(speedForScore(10_000)).toBe(WORLD.maxSpeed);
  });

  it('starts with the first jump', () => {
    const engine = new MewRunnerEngine(() => 0.5);
    expect(engine.state.phase).toBe('idle');
    expect(engine.jump()).toBe(true);
    expect(engine.state.phase).toBe('running');
    expect(engine.state.player.grounded).toBe(false);
  });

  it('lands after a jump', () => {
    const engine = new MewRunnerEngine(() => 0.5);
    engine.jump();
    for (let index = 0; index < 100; index += 1) engine.tick(1 / 60);
    expect(engine.state.player.grounded).toBe(true);
    expect(engine.state.player.y).toBe(WORLD.groundY - engine.state.player.height);
  });

  it('ends the run on the first collision', () => {
    const engine = new MewRunnerEngine(() => 0.5);
    engine.start();
    engine.injectObstacle('rock', engine.state.player.x, engine.state.player.y);
    engine.tick(1 / 60);
    expect(engine.state.phase).toBe('gameover');
    expect(engine.drainEvents()).toContainEqual({ type: 'gameover', score: engine.state.score });
  });

  it('fully resets the game', () => {
    const engine = new MewRunnerEngine(() => 0.5);
    engine.jump();
    engine.tick(0.05);
    engine.reset();
    expect(engine.state.phase).toBe('idle');
    expect(engine.state.score).toBe(0);
    expect(engine.state.obstacles).toHaveLength(0);
  });
});
