import { WORLD } from './engine';
import { drawPixelMew } from './sprite';
import type { GameState, Obstacle } from './types';

const INK = '#535353';
const LIGHT = '#d5d5d5';
const PAPER = '#fafafa';

export class GameRenderer {
  private readonly context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D non supportato');
    context.imageSmoothingEnabled = false;
    this.context = context;
  }

  draw(state: GameState, highScore: number): void {
    const ctx = this.context;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    this.drawClouds(state.distance);
    this.drawGround(state.distance);
    state.obstacles.forEach((obstacle) => this.drawObstacle(obstacle));

    const runFrame = state.player.grounded && state.phase === 'running' ? Math.floor(state.elapsedMs / 115) % 2 : 0;
    const idleBob = state.phase === 'idle' ? Math.sin(state.elapsedMs / 250) * 1 : 0;
    drawPixelMew(ctx, state.player.x, state.player.y + idleBob, runFrame, 2);

    this.drawScore(state.score, highScore);
    if (state.phase === 'idle') this.centerText('PRESS SPACE TO PLAY', 116, 13);
    if (state.phase === 'gameover') {
      this.centerText('GAME OVER', 91, 19);
      this.centerText('SPACE TO RETRY', 119, 12);
      this.drawRestartIcon(WORLD.width / 2 + 71, 81);
    }
  }

  private drawScore(score: number, highScore: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`HI ${String(highScore).padStart(5, '0')}  ${String(score).padStart(5, '0')}`, WORLD.width - 13, 13);
  }

  private centerText(text: string, y: number, size: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, WORLD.width / 2, y);
  }

  private drawClouds(distance: number): void {
    const ctx = this.context;
    const offset = -((distance * 0.12) % 330);
    ctx.fillStyle = LIGHT;
    for (let index = -1; index < 4; index += 1) {
      const x = offset + index * 330 + 180;
      const y = 45 + (index % 2) * 27;
      ctx.fillRect(x, y + 5, 42, 3);
      ctx.fillRect(x + 8, y, 15, 3);
      ctx.fillRect(x + 25, y + 2, 11, 3);
      ctx.fillRect(x + 3, y + 8, 52, 2);
    }
  }

  private drawGround(distance: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, 2);
    const offset = -(distance % 90);
    for (let x = offset - 90; x < WORLD.width + 90; x += 90) {
      ctx.fillRect(x + 14, WORLD.groundY + 10, 20, 2);
      ctx.fillRect(x + 51, WORLD.groundY + 22, 8, 2);
      ctx.fillRect(x + 70, WORLD.groundY + 14, 3, 2);
    }
  }

  private drawObstacle(obstacle: Obstacle): void {
    if (obstacle.kind === 'ball') this.drawBall(obstacle.x, obstacle.y);
    else if (obstacle.kind === 'grass') this.drawGrass(obstacle.x, obstacle.y);
    else this.drawRock(obstacle.x, obstacle.y);
  }

  private drawRock(x: number, y: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.fillRect(x + 6, y, 17, 3);
    ctx.fillRect(x + 2, y + 3, 26, 5);
    ctx.fillRect(x, y + 8, 33, 21);
    ctx.fillRect(x + 4, y + 29, 29, 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 7, y + 8, 4, 4);
    ctx.fillRect(x + 22, y + 15, 6, 3);
  }

  private drawBall(x: number, y: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.fillRect(x + 9, y, 16, 3);
    ctx.fillRect(x + 4, y + 3, 26, 4);
    ctx.fillRect(x + 1, y + 7, 32, 20);
    ctx.fillRect(x + 4, y + 27, 26, 4);
    ctx.fillRect(x + 9, y + 31, 16, 3);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 4, y + 17, 26, 9);
    ctx.fillStyle = INK;
    ctx.fillRect(x + 1, y + 15, 11, 4);
    ctx.fillRect(x + 22, y + 15, 11, 4);
    ctx.fillRect(x + 12, y + 12, 10, 10);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 15, y + 15, 4, 4);
  }

  private drawGrass(x: number, y: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.fillRect(x + 2, y + 31, 40, 7);
    const blades = [[3, 19], [9, 8], [15, 14], [21, 1], [27, 11], [33, 5], [38, 20]];
    blades.forEach(([bladeX, bladeY]) => {
      ctx.fillRect(x + bladeX, y + bladeY, 4, 33 - bladeY);
    });
  }

  private drawRestartIcon(x: number, y: number): void {
    const ctx = this.context;
    ctx.fillStyle = INK;
    ctx.fillRect(x, y + 3, 3, 9);
    ctx.fillRect(x + 3, y, 9, 3);
    ctx.fillRect(x + 11, y + 2, 3, 3);
    ctx.fillRect(x - 3, y + 2, 6, 3);
    ctx.fillRect(x - 3, y, 3, 3);
  }
}
