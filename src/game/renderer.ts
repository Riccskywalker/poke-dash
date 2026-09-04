import { WORLD } from './engine';
import type { BiomeId, EntityKind, GameState, StarterId } from './types';

const STARTER_SPRITES: Record<StarterId, string> = {
  bulbasaur: '/assets/pokemon/1.gif',
  charmander: '/assets/pokemon/4.gif',
  squirtle: '/assets/pokemon/7.gif',
  pikachu: '/assets/pokemon/25.gif',
};

const ENTITY_SPRITES: Record<EntityKind, string> = {
  zubat: '/assets/pokemon/41.gif',
  diglett: '/assets/pokemon/50.gif',
  gastly: '/assets/pokemon/92.gif',
  voltorb: '/assets/pokemon/100.gif',
  oran: '/assets/items/oran-berry.png',
  sitrus: '/assets/items/sitrus-berry.png',
};

const BIOME_TINTS: Record<BiomeId, string> = {
  route: 'rgba(255, 238, 144, .04)',
  forest: 'rgba(14, 92, 68, .22)',
  cave: 'rgba(72, 53, 100, .36)',
  night: 'rgba(15, 27, 70, .52)',
};

const BIOME_GROUNDS: Record<BiomeId, [string, string]> = {
  route: ['#67a63a', '#31552f'],
  forest: ['#3f7b43', '#1f4738'],
  cave: ['#665c69', '#343148'],
  night: ['#31506a', '#162a45'],
};

function loadImage(source: string): HTMLImageElement {
  const image = new Image();
  image.src = source;
  return image;
}

export class GameRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly background = loadImage('/assets/generated/route-panorama.png');
  private readonly starters = Object.fromEntries(
    Object.entries(STARTER_SPRITES).map(([key, value]) => [key, loadImage(value)]),
  ) as Record<StarterId, HTMLImageElement>;
  private readonly entities = Object.fromEntries(
    Object.entries(ENTITY_SPRITES).map(([key, value]) => [key, loadImage(value)]),
  ) as Record<EntityKind, HTMLImageElement>;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D non supportato');
    this.context = context;
    context.imageSmoothingEnabled = false;
  }

  draw(state: GameState): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    this.drawBackground(state);
    this.drawWeather(state);
    this.drawGround(state);
    this.drawEntities(state);
    this.drawPlayer(state);
    if (state.phase === 'paused') this.drawPausedShade();
  }

  private drawBackground(state: GameState): void {
    const ctx = this.context;
    ctx.fillStyle = '#75d2e8';
    ctx.fillRect(0, 0, WORLD.width, WORLD.groundY);

    if (this.background.complete) {
      const height = WORLD.groundY;
      const width = height * (this.background.naturalWidth / this.background.naturalHeight);
      const offset = -((state.distance * 0.08) % width);
      for (let x = offset - width; x < WORLD.width + width; x += width) {
        ctx.drawImage(this.background, x, 0, width, height);
      }
    }

    ctx.fillStyle = BIOME_TINTS[state.biome];
    ctx.fillRect(0, 0, WORLD.width, WORLD.groundY);

    const sunX = WORLD.width - 105 - ((state.distance * 0.012) % (WORLD.width + 220));
    ctx.globalAlpha = state.biome === 'night' ? 0.25 : 0.5;
    ctx.fillStyle = state.biome === 'night' ? '#e8f1ff' : '#fff4b0';
    ctx.beginPath();
    ctx.arc(sunX, 74, state.biome === 'night' ? 23 : 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawWeather(state: GameState): void {
    const ctx = this.context;
    if (state.biome === 'forest') {
      ctx.strokeStyle = 'rgba(220, 249, 255, .45)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 28; index += 1) {
        const x = (index * 83 + state.distance * 0.55) % (WORLD.width + 40) - 20;
        const y = (index * 47 + state.elapsedMs * 0.16) % WORLD.groundY;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 13);
        ctx.stroke();
      }
    }
    if (state.biome === 'night') {
      ctx.fillStyle = 'rgba(255,255,205,.75)';
      for (let index = 0; index < 24; index += 1) {
        const x = (index * 137 + 41) % WORLD.width;
        const y = (index * 61 + 20) % 230;
        const pulse = 1.2 + Math.sin(state.elapsedMs / 320 + index) * 0.7;
        ctx.fillRect(x, y, pulse, pulse);
      }
    }
  }

  private drawGround(state: GameState): void {
    const ctx = this.context;
    const [top, bottom] = BIOME_GROUNDS[state.biome];
    ctx.fillStyle = top;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, 18);
    ctx.fillStyle = bottom;
    ctx.fillRect(0, WORLD.groundY + 18, WORLD.width, WORLD.height - WORLD.groundY - 18);

    const offset = -((state.distance * 0.95) % 62);
    for (let x = offset - 62; x < WORLD.width + 62; x += 62) {
      ctx.fillStyle = 'rgba(255,255,255,.13)';
      ctx.fillRect(x + 8, WORLD.groundY + 27, 31, 5);
      ctx.fillStyle = 'rgba(0,0,0,.13)';
      ctx.fillRect(x + 38, WORLD.groundY + 57, 18, 5);
    }
    ctx.fillStyle = 'rgba(15,30,35,.32)';
    ctx.fillRect(0, WORLD.groundY - 3, WORLD.width, 4);
  }

  private drawEntities(state: GameState): void {
    const ctx = this.context;
    for (const entity of state.entities) {
      const image = this.entities[entity.kind];
      const isBerry = entity.kind === 'oran' || entity.kind === 'sitrus';
      if (isBerry) {
        const bob = Math.sin(state.elapsedMs / 180 + entity.id) * 7;
        ctx.save();
        ctx.shadowColor = entity.kind === 'sitrus' ? '#ffd93d' : '#6fc7ff';
        ctx.shadowBlur = 12;
        ctx.drawImage(image, entity.x, entity.y + bob, entity.width, entity.height);
        ctx.restore();
      } else {
        ctx.drawImage(image, entity.x, entity.y, entity.width, entity.height);
      }
    }
  }

  private drawPlayer(state: GameState): void {
    const ctx = this.context;
    const player = state.player;
    const blinking = state.elapsedMs < player.invincibleUntil && Math.floor(state.elapsedMs / 90) % 2 === 0;
    if (blinking) return;

    const bob = player.grounded && !player.ducking && state.phase === 'running' ? Math.sin(state.elapsedMs / 70) * 2 : 0;
    const special = state.elapsedMs < state.specialUntil;
    ctx.save();
    if (special) {
      ctx.shadowColor = '#ffe66d';
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'rgba(255,230,92,.2)';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(this.starters[state.starter], player.x, player.y + bob, player.width, player.height);
    ctx.restore();

    if (state.phase === 'running' && player.grounded) {
      ctx.fillStyle = 'rgba(232,236,190,.4)';
      const dustOffset = (state.elapsedMs / 30) % 24;
      ctx.fillRect(player.x - 12 - dustOffset, WORLD.groundY - 6, 7, 4);
    }
  }

  private drawPausedShade(): void {
    this.context.fillStyle = 'rgba(10, 18, 35, .28)';
    this.context.fillRect(0, 0, WORLD.width, WORLD.height);
  }
}
