import { describe, expect, it } from 'vitest';
import { PikaRunnerEngine, WORLD, intersects, speedForScore } from './engine';

describe('Pika Runner', () => {
  it('rileva una collisione con margine', () => {
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 15, y: 0, width: 20, height: 20 }, 2)).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 21, y: 0, width: 20, height: 20 })).toBe(false);
  });

  it('aumenta gradualmente la velocità fino al limite', () => {
    expect(speedForScore(0)).toBe(WORLD.baseSpeed);
    expect(speedForScore(500)).toBeGreaterThan(WORLD.baseSpeed);
    expect(speedForScore(10_000)).toBe(WORLD.maxSpeed);
  });

  it('parte con il primo salto', () => {
    const engine = new PikaRunnerEngine(() => 0.5);
    expect(engine.state.phase).toBe('idle');
    expect(engine.jump()).toBe(true);
    expect(engine.state.phase).toBe('running');
    expect(engine.state.player.grounded).toBe(false);
  });

  it('torna a terra dopo un salto', () => {
    const engine = new PikaRunnerEngine(() => 0.5);
    engine.jump();
    for (let index = 0; index < 100; index += 1) engine.tick(1 / 60);
    expect(engine.state.player.grounded).toBe(true);
    expect(engine.state.player.y).toBe(WORLD.groundY - engine.state.player.height);
  });

  it('termina la corsa alla prima collisione', () => {
    const engine = new PikaRunnerEngine(() => 0.5);
    engine.start();
    engine.injectObstacle('rock', engine.state.player.x, engine.state.player.y);
    engine.tick(1 / 60);
    expect(engine.state.phase).toBe('gameover');
    expect(engine.drainEvents()).toContainEqual({ type: 'gameover', score: engine.state.score });
  });

  it('ripristina completamente la partita', () => {
    const engine = new PikaRunnerEngine(() => 0.5);
    engine.jump();
    engine.tick(0.05);
    engine.reset();
    expect(engine.state.phase).toBe('idle');
    expect(engine.state.score).toBe(0);
    expect(engine.state.obstacles).toHaveLength(0);
  });
});
