export class GameAudio {
  private context?: AudioContext;
  private enabled = true;

  get muted(): boolean {
    return !this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private tone(frequency: number, duration: number, type: OscillatorType = 'square', gain = 0.045): void {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    const start = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(gain, start);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  jump(): void {
    this.tone(330, 0.08);
    window.setTimeout(() => this.tone(490, 0.08), 45);
  }

  berry(): void {
    this.tone(660, 0.08, 'sine');
    window.setTimeout(() => this.tone(880, 0.12, 'sine'), 55);
  }

  hit(): void {
    this.tone(120, 0.22, 'sawtooth', 0.06);
  }

  special(): void {
    [440, 620, 880].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.18, 'square', 0.055), index * 70);
    });
  }

  gameOver(): void {
    [330, 260, 190].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.25, 'triangle'), index * 130);
    });
  }
}
