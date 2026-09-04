import { describe, expect, it } from 'vitest';
import { PokeRunEngine, WORLD, biomeForDistance, intersects, speedForDistance } from './engine';

describe('regole del runner', () => {
  it('calcola collisioni AABB con margine', () => {
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 15, y: 0, width: 20, height: 20 })).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 20, height: 20 }, { x: 22, y: 0, width: 20, height: 20 })).toBe(false);
  });

  it('aumenta la velocità senza superare il limite', () => {
    expect(speedForDistance(0)).toBe(WORLD.baseSpeed);
    expect(speedForDistance(10_000)).toBeGreaterThan(WORLD.baseSpeed);
    expect(speedForDistance(100_000)).toBe(WORLD.maxSpeed);
  });

  it('ruota i biomi ogni 6200 unità', () => {
    expect(biomeForDistance(0)).toBe('route');
    expect(biomeForDistance(6200)).toBe('forest');
    expect(biomeForDistance(12_400)).toBe('cave');
    expect(biomeForDistance(24_800)).toBe('route');
  });

  it('salta e torna a terra', () => {
    const engine = new PokeRunEngine('pikachu', () => 0.5);
    engine.start();
    expect(engine.jump()).toBe(true);
    expect(engine.state.player.grounded).toBe(false);
    for (let index = 0; index < 100; index += 1) engine.tick(1 / 60);
    expect(engine.state.player.grounded).toBe(true);
    expect(engine.state.player.y).toBe(WORLD.groundY - engine.state.player.height);
  });

  it('raccoglie bacche e carica la mossa speciale', () => {
    const engine = new PokeRunEngine('bulbasaur', () => 0.5);
    engine.start();
    engine.injectEntity('oran', engine.state.player.x, engine.state.player.y);
    engine.tick(1 / 60);
    expect(engine.state.berries).toBe(1);
    expect(engine.state.energy).toBe(34);
    expect(engine.state.bonusScore).toBe(100);
  });

  it('termina dopo tre collisioni non protette', () => {
    const engine = new PokeRunEngine('charmander', () => 0.5);
    engine.start();
    for (let hit = 0; hit < 3; hit += 1) {
      engine.injectEntity('voltorb', engine.state.player.x, engine.state.player.y);
      engine.tick(1 / 60);
      if (hit < 2) {
        engine.state.player.invincibleUntil = 0;
        engine.state.elapsedMs += 1500;
      }
    }
    expect(engine.state.hearts).toBe(0);
    expect(engine.state.phase).toBe('gameover');
    expect(engine.drainEvents().some((event) => event.type === 'gameover')).toBe(true);
  });
});
