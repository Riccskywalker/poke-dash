type AudioStorage = Pick<Storage, "getItem" | "setItem">;

export class GameAudio {
  private readonly storage: AudioStorage | null;
  constructor(
    private readonly factory: () => AudioContext | null = () => {
      const Factory = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return Factory ? new Factory() : null;
    },
    storage: AudioStorage | null = typeof localStorage === "undefined" ? null : localStorage,
  ) {
    this.storage = storage;
    this.muted = this.storage?.getItem("rarebit-dash-muted") === "true";
  }
  private context: AudioContext | null = null;
  private muted = false;
  get initialized(): boolean { return this.context !== null; }
  get isMuted(): boolean { return this.muted; }
  setMuted(muted: boolean): void { this.muted = muted; this.storage?.setItem("rarebit-dash-muted", String(muted)); }
  gesture(): void {
    if (!this.context) {
      try { this.context = this.factory(); } catch { this.context = null; }
    }
    if (this.context?.state === "suspended") void this.context.resume();
  }
  tone(frequency: number, duration: number): void { if (this.muted || !this.context) return; const oscillator = this.context.createOscillator(); const gain = this.context.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.04, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration); oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + duration); }
  jump(): void { this.tone(520, 0.055); }
  pad(): void { this.tone(760, 0.12); }
  crash(): void { this.tone(120, 0.22); }
  complete(): void { [440, 554, 659, 880].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.18), index * 90)); }
}
