import { WORLD } from "./engine";
import { drawRareBitIcon } from "./sprite";
import type { GameEvent, GameState, Obstacle } from "./types";

export interface RendererOptions { reverseHolo: boolean; reducedMotion: boolean; nowMs: number; }
export interface Camera { width: number; height: number; scale: number; dpr: number; yOffset: number; playerCssSize: number; }
const GLYPHS = [1120, 2890, 5480, 8460];

export class GameRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private scale = 1;
  private nowMs = 0;
  private crashAt = -1;
  private completeAt = -1;
  private options: RendererOptions = {
    reverseHolo: false,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    nowMs: 0,
  };
  public camera: Camera = { width: 960, height: 420, scale: 1, dpr: 1, yOffset: 0, playerCssSize: 50 };
  public reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor(canvas: HTMLCanvasElement) { const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas 2D unavailable"); this.ctx = ctx; }
  setReducedMotion(value: boolean): void { this.reducedMotion = value; this.options.reducedMotion = value; }
  setReverseHolo(value: boolean): void { this.options.reverseHolo = value; }
  get reverseHolo(): boolean { return this.options.reverseHolo; }
  handleEvent(event: GameEvent, nowMs: number): void { this.nowMs = nowMs; if (event.type === "gameover") this.crashAt = nowMs; if (event.type === "complete") this.completeAt = nowMs; }
  resize(logicalWidth: number, logicalHeight: number): void { this.scale = this.ctx.canvas.clientWidth / logicalWidth; this.camera = { width: logicalWidth, height: logicalHeight, scale: this.scale, dpr: Math.min(devicePixelRatio, 2), yOffset: logicalHeight - WORLD.height, playerCssSize: WORLD.playerSize * this.scale }; }
  draw(state: GameState, nowMs = this.nowMs): void {
    this.nowMs = nowMs; this.options.nowMs = nowMs; const c = this.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.setTransform(this.camera.dpr * this.scale, 0, 0, this.camera.dpr * this.scale, 0, 0);
    this.drawBackground(state);
    c.translate(0, this.camera.yOffset);
    this.drawWorld(state);
    if (state.phase === "idle") this.drawIdlePulse(state);
    if (state.phase === "gameover") this.drawCrashFragments(state);
    if (state.phase === "complete") this.drawSlabReveal(state);
    c.translate(0, -this.camera.yOffset);
    this.drawHud(state);
    if (state.phase === "gameover" && (this.options.reducedMotion || this.nowMs - this.crashAt >= 350)) this.drawRetryIcon();
    c.restore();
  }
  private drawBackground(state: GameState): void { const c = this.ctx; const g = c.createLinearGradient(0, 0, 0, this.camera.height); g.addColorStop(0, "#0A0A2E"); g.addColorStop(1, "#07071F"); c.fillStyle = g; c.fillRect(0, 0, this.camera.width, this.camera.height); c.strokeStyle = "#19195a"; c.lineWidth = 1; const motion = this.options.reducedMotion ? 0 : state.distance * .08; for (let x = -120 - motion % 120; x < this.camera.width + 120; x += 120) { c.beginPath(); c.moveTo(x, 70); c.lineTo(x + 95, 0); c.stroke(); c.beginPath(); c.moveTo(x, 260); c.lineTo(x + 140, 120); c.stroke(); } if (state.progress > .5) this.drawBinderPage(state); }
  private drawBinderPage(state: GameState): void { const c = this.ctx; const offset = this.options.reducedMotion ? 0 : (state.distance * .025) % 44; c.strokeStyle = "#262660"; c.lineWidth = 1; for (let x = -offset; x < this.camera.width; x += 44) for (let y = 90; y < this.camera.height; y += 44) c.strokeRect(x, y, 36, 36); }
  private drawWorld(state: GameState): void {
    const c = this.ctx;
    c.fillStyle = "#C8F04B";
    c.fillRect(0, WORLD.groundY, WORLD.width, 5);
    c.fillStyle = "#222261";
    c.fillRect(0, WORLD.groundY + 5, WORLD.width, WORLD.height - WORLD.groundY);
    state.obstacles.forEach((o) => {
      if (o.kind === "spike") this.drawShard(o);
      else if (o.kind === "block") this.drawCardSlab(o);
      else this.drawScanPad(o);
    });
    this.drawCollectibleGlyphs(state);
    if (!this.options.reducedMotion) this.drawTrail(state);
    const crashedEarly = state.phase === "gameover" && !this.options.reducedMotion && this.nowMs - this.crashAt < 350;
    if (!crashedEarly) {
      const rotation = this.options.reducedMotion ? 0 : state.player.rotation;
      drawRareBitIcon(c, state.player.x, state.player.y, state.player.width, rotation);
    }
    if (!crashedEarly) {
      if (state.attempt % 7 === 0) this.drawHoloSweep(state);
      if (state.attempt >= 10) this.drawPennySleeve(state);
      if (this.options.reverseHolo) this.drawHoloSweep(state, true);
    }
  }
  private drawShard(o: Obstacle): void { const c = this.ctx; c.fillStyle = "#C8F04B"; c.beginPath(); c.moveTo(o.x + 5, o.y + o.height); c.lineTo(o.x + o.width / 2, o.y); c.lineTo(o.x + o.width - 5, o.y + o.height); c.closePath(); c.fill(); c.strokeStyle = "#EAFCA0"; c.stroke(); }
  private drawCardSlab(o: Obstacle): void { const c = this.ctx; c.fillStyle = "#C8F04B"; c.fillRect(o.x, o.y, o.width, o.height); c.strokeStyle = "#EAFCA0"; c.lineWidth = 2; c.strokeRect(o.x + 4, o.y + 4, o.width - 8, o.height - 8); c.strokeStyle = "#0A0A2E"; c.beginPath(); c.moveTo(o.x, o.y + 12); c.lineTo(o.x + 12, o.y); c.moveTo(o.x + o.width - 12, o.y + o.height); c.lineTo(o.x + o.width, o.y + o.height - 12); c.stroke(); }
  private drawScanPad(o: Obstacle): void { const c = this.ctx; c.strokeStyle = "#EAFCA0"; c.lineWidth = 2; for (let x = o.x; x < o.x + o.width; x += 10) { c.beginPath(); c.moveTo(x, o.y + o.height); c.lineTo(x + 8, o.y); c.stroke(); } }
  private drawCollectibleGlyphs(state: GameState): void { const c = this.ctx; GLYPHS.forEach((worldX, i) => { const x = worldX - state.distance + WORLD.playerX; if (x < -30 || x > WORLD.width + 30) return; const y = WORLD.groundY - 70; c.strokeStyle = "#EAFCA0"; c.lineWidth = 2; c.beginPath(); if (i === 0) c.arc(x, y, 4, 0, Math.PI * 2); else if (i === 1) { c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.closePath(); } else if (i === 2) { c.moveTo(x, y - 8); c.lineTo(x, y + 8); c.moveTo(x - 8, y); c.lineTo(x + 8, y); } else { c.moveTo(x - 8, y + 6); c.lineTo(x - 8, y - 4); c.lineTo(x - 3, y); c.lineTo(x, y - 7); c.lineTo(x + 3, y); c.lineTo(x + 8, y - 4); c.lineTo(x + 8, y + 6); } c.stroke(); }); }
  private drawTrail(state: GameState): void { const c = this.ctx; c.fillStyle = "#89AC2C"; for (let i = 1; i <= 4; i++) { c.globalAlpha = .12 * (5 - i); c.fillRect(state.player.x - i * 11, state.player.y + state.player.height - 7, 5, 5); } c.globalAlpha = 1; }
  private drawHoloSweep(state: GameState, reverse = false): void {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(state.player.x, state.player.y, state.player.width, state.player.height);
    c.clip();
    c.globalAlpha = 0.28;
    c.fillStyle = reverse ? "#89AC2C" : "#EAFCA0";
    const x = state.player.x + ((this.nowMs / 5) % state.player.width);
    c.fillRect(x, state.player.y, 4, state.player.height);
    c.restore();
  }
  private drawPennySleeve(state: GameState): void { const c = this.ctx; c.strokeStyle = "#EAFCA0"; c.globalAlpha = .55; c.lineWidth = 2; c.strokeRect(state.player.x - 4, state.player.y - 4, state.player.width + 8, state.player.height + 8); c.globalAlpha = 1; }
  private drawHud(state: GameState): void { const c = this.ctx; c.fillStyle = "#272765"; c.fillRect(24, 43, this.camera.width - 48, 6); c.fillStyle = "#C8F04B"; c.fillRect(24, 43, (this.camera.width - 48) * state.progress, 6); for (let i = 0; i < Math.min(10, state.attempt); i++) this.drawMiniGem(28 + i * 18, 26); }
  private drawMiniGem(x: number, y: number): void { const c = this.ctx; c.fillStyle = "#C8F04B"; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.closePath(); c.fill(); }
  private drawIdlePulse(state: GameState): void { const c = this.ctx; c.strokeStyle = "#EAFCA0"; c.globalAlpha = .35 + .2 * Math.sin(this.nowMs / 250); c.beginPath(); c.arc(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, state.player.width * .7, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
  private drawCrashFragments(state: GameState): void { const c = this.ctx; const elapsed = this.nowMs - this.crashAt; if (this.options.reducedMotion) { c.globalAlpha = .3; c.strokeStyle = "#EAFCA0"; c.strokeRect(state.player.x - 5, state.player.y - 5, 60, 60); c.globalAlpha = 1; return; } if (elapsed < 350) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const r = 18 + elapsed / 12; c.fillStyle = i % 2 ? "#C8F04B" : "#EAFCA0"; c.fillRect(state.player.x + 25 + Math.cos(a) * r, state.player.y + 25 + Math.sin(a) * r, 4, 4); } }
  private drawRetryIcon(): void { const c = this.ctx; c.strokeStyle = "#EAFCA0"; c.lineWidth = 4; c.beginPath(); c.arc(this.camera.width / 2, this.camera.height / 2, 25, .5, 5.5); c.stroke(); c.beginPath(); c.moveTo(this.camera.width / 2 - 25, this.camera.height / 2 - 15); c.lineTo(this.camera.width / 2 - 25, this.camera.height / 2 - 2); c.lineTo(this.camera.width / 2 - 12, this.camera.height / 2 - 8); c.stroke(); }
  private drawSlabReveal(state: GameState): void { const c = this.ctx; c.globalAlpha = Math.min(1, Math.max(.35, (this.nowMs - this.completeAt) / 350)); c.strokeStyle = "#C8F04B"; c.lineWidth = 4; c.strokeRect(state.player.x - 12, state.player.y - 12, state.player.width + 24, state.player.height + 24); this.drawVectorOne(state); c.globalAlpha = 1; }
  private drawVectorOne(state: GameState): void { const c = this.ctx; c.strokeStyle = "#EAFCA0"; c.lineWidth = 3; const x = state.player.x + state.player.width / 2, y = state.player.y + state.player.height / 2; c.beginPath(); c.moveTo(x - 5, y - 14); c.lineTo(x + 4, y - 20); c.lineTo(x + 4, y + 20); c.stroke(); }
}
