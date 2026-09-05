import { WORLD } from "./engine";
import { drawRareBitIcon } from "./sprite";
import type { GameState, Obstacle } from "./types";
export class GameRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
  }
  draw(state: GameState): void {
    const c = this.ctx;
    c.clearRect(0, 0, WORLD.width, WORLD.height);
    c.fillStyle = "#0A0A2E";
    c.fillRect(0, 0, WORLD.width, WORLD.height);
    c.fillStyle = "#101044";
    c.fillRect(0, 0, WORLD.width, WORLD.groundY);
    for (
      let x = -40 - (state.distance % 120);
      x < WORLD.width + 100;
      x += 120
    ) {
      c.strokeStyle = "#19195a";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, 50);
      c.lineTo(x + 70, 0);
      c.stroke();
      c.beginPath();
      c.moveTo(x, 250);
      c.lineTo(x + 130, 130);
      c.stroke();
    }
    c.fillStyle = "#C8F04B";
    c.fillRect(0, WORLD.groundY, WORLD.width, 5);
    c.fillStyle = "#222261";
    c.fillRect(0, WORLD.groundY + 5, WORLD.width, WORLD.height - WORLD.groundY);
    state.obstacles.forEach((o) => this.drawObstacle(o));
    c.fillStyle = "#89AC2C";
    for (let i = 1; i <= 4; i += 1) {
      c.globalAlpha = .12 * (5 - i);
      c.fillRect(
        state.player.x - i * 11,
        state.player.y + state.player.height - 7,
        5,
        5,
      );
    }
    c.globalAlpha = 1;
    drawRareBitIcon(
      c,
      state.player.x,
      state.player.y,
      state.player.width,
      state.player.rotation,
    );
    this.drawHud(state);
    if (state.phase === "idle") this.overlay("READY?", "SPACE / TAP TO START");
    if (state.phase === "gameover") {
      this.overlay("CRASHED", "SPACE / TAP TO RETRY");
    }
    if (state.phase === "complete") {
      this.overlay("LEVEL COMPLETE", "SPACE / TAP TO RUN AGAIN");
    }
  }
  private drawObstacle(o: Obstacle): void {
    const c = this.ctx;
    if (o.kind === "spike") {
      c.fillStyle = "#C8F04B";
      c.beginPath();
      c.moveTo(o.x, o.y + o.height);
      c.lineTo(o.x + o.width / 2, o.y);
      c.lineTo(o.x + o.width, o.y + o.height);
      c.closePath();
      c.fill();
    } else if (o.kind === "pad") {
      c.fillStyle = "#EAFCA0";
      c.fillRect(o.x, o.y, o.width, o.height);
      c.fillStyle = "#89AC2C";
      c.fillRect(o.x + 8, o.y + 4, o.width - 16, 3);
    } else {
      c.fillStyle = "#C8F04B";
      c.fillRect(o.x, o.y, o.width, o.height);
      c.fillStyle = "#0A0A2E";
      c.fillRect(o.x + 8, o.y + 8, o.width - 16, 5);
      c.fillRect(o.x + 8, o.y + 8, 5, o.height - 16);
    }
  }
  private drawHud(s: GameState): void {
    const c = this.ctx;
    c.fillStyle = "#EAFCA0";
    c.font = "700 16px system-ui";
    c.textAlign = "left";
    c.fillText(`ATTEMPT ${s.attempt}`, 24, 30);
    c.textAlign = "right";
    c.fillText(`${Math.round(s.progress * 100)}%`, WORLD.width - 24, 30);
    c.fillStyle = "#272765";
    c.fillRect(24, 43, WORLD.width - 48, 7);
    c.fillStyle = "#C8F04B";
    c.fillRect(24, 43, (WORLD.width - 48) * s.progress, 7);
  }
  private overlay(title: string, subtitle: string): void {
    const c = this.ctx;
    c.fillStyle = "rgba(10,10,46,.32)";
    c.fillRect(0, 0, WORLD.width, WORLD.height);
    c.fillStyle = "#0A0A2E";
    c.fillRect(280, 145, 400, 100);
    c.strokeStyle = "#C8F04B";
    c.lineWidth = 2;
    c.strokeRect(280, 145, 400, 100);
    c.fillStyle = "#EAFCA0";
    c.textAlign = "center";
    c.font = "800 34px system-ui";
    c.fillText(title, WORLD.width / 2, 188);
    c.fillStyle = "#C8F04B";
    c.font = "700 14px system-ui";
    c.fillText(subtitle, WORLD.width / 2, 220);
  }
}
