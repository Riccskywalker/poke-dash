import { describe, expect, it, vi } from "vitest";
import { GameAudio } from "./audio";

describe("GameAudio", () => {
  it("creates no context before a gesture and only one after", () => {
    const context = { state: "running", currentTime: 0, resume: vi.fn() } as unknown as AudioContext;
    const factory = vi.fn(() => context);
    const audio = new GameAudio(factory, null);
    expect(factory).not.toHaveBeenCalled(); audio.gesture(); audio.gesture(); expect(factory).toHaveBeenCalledTimes(1);
  });
  it("persists mute and prevents tones", () => {
    const context = { state: "running", currentTime: 0, createOscillator: vi.fn(), createGain: vi.fn() } as unknown as AudioContext;
    const storage = new Map<string, string>();
    const store = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) };
    const audio = new GameAudio(() => context, store); audio.gesture(); audio.setMuted(true); audio.jump(); expect(audio.isMuted).toBe(true); expect(store.getItem("rarebit-dash-muted")).toBe("true"); expect(context.createOscillator).not.toHaveBeenCalled();
  });
  it("stays a no-op when WebAudio is unavailable", () => {
    const audio = new GameAudio(() => null, null);
    expect(() => audio.gesture()).not.toThrow();
    expect(() => audio.jump()).not.toThrow();
    expect(audio.initialized).toBe(false);
  });
});
