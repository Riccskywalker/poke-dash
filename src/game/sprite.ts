export type PixelColor = 'ink' | 'pink' | 'shadow' | 'highlight' | 'blue' | 'shine';
export type PixelBlock = readonly [x: number, y: number, width: number, height: number, color: PixelColor];

// The tail is intentionally drawn first so that it passes behind Mew's body.
// Its oval tip and long, thin curve are the strongest part of the silhouette.
const BODY: readonly PixelBlock[] = [
  // Tail bulb.
  [1, 2, 5, 1, 'ink'], [0, 3, 7, 5, 'ink'], [1, 8, 5, 1, 'ink'],
  [1, 3, 5, 5, 'pink'], [2, 3, 3, 1, 'highlight'],
  // Thin, curling tail joining the lower back.
  [4, 8, 3, 5, 'ink'], [5, 9, 1, 4, 'pink'], [5, 12, 3, 4, 'ink'],
  [6, 13, 1, 2, 'pink'], [7, 14, 6, 3, 'ink'], [8, 15, 5, 1, 'pink'],
  // Small pear-shaped torso.
  [10, 13, 10, 2, 'ink'], [9, 15, 13, 6, 'ink'], [11, 21, 10, 2, 'ink'],
  [11, 14, 8, 1, 'pink'], [10, 15, 11, 5, 'pink'], [12, 20, 8, 2, 'pink'],
  [11, 16, 2, 4, 'highlight'],
  // Pointed feline ears, stepped one pixel at a time.
  [15, 1, 3, 6, 'ink'], [16, 0, 2, 2, 'ink'], [16, 2, 1, 4, 'shadow'],
  [23, 1, 3, 6, 'ink'], [24, 0, 2, 2, 'ink'], [24, 2, 1, 4, 'shadow'],
  // Oversized rounded head and short muzzle, facing right.
  [15, 5, 11, 1, 'ink'], [13, 6, 14, 2, 'ink'], [12, 8, 16, 6, 'ink'],
  [13, 14, 14, 2, 'ink'], [15, 16, 10, 1, 'ink'],
  [14, 7, 12, 1, 'pink'], [13, 8, 14, 6, 'pink'], [14, 14, 12, 1, 'pink'],
  [16, 15, 8, 1, 'pink'], [26, 10, 2, 4, 'ink'], [26, 11, 1, 2, 'pink'],
  // Face: one oversized blue eye, pupil, highlight and tiny nose/mouth pixels.
  [20, 6, 5, 6, 'ink'], [21, 7, 3, 4, 'blue'], [23, 8, 1, 3, 'ink'],
  [21, 7, 1, 1, 'shine'], [27, 11, 1, 2, 'ink'], [25, 14, 2, 1, 'ink'],
  [20, 14, 5, 1, 'shadow'],
  // Tiny forearm held ahead of the torso.
  [18, 15, 3, 3, 'ink'], [20, 16, 5, 3, 'ink'], [19, 16, 2, 1, 'pink'],
  [21, 16, 3, 2, 'pink'], [24, 17, 2, 1, 'ink'],
] as const;

const LEGS: readonly [readonly PixelBlock[], readonly PixelBlock[]] = [
  [
    [10, 20, 5, 3, 'ink'], [9, 22, 6, 2, 'ink'], [11, 20, 3, 2, 'pink'],
    [16, 20, 5, 3, 'ink'], [19, 22, 6, 2, 'ink'], [17, 20, 3, 2, 'pink'],
    [20, 22, 4, 1, 'pink'],
  ],
  [
    [10, 20, 6, 3, 'ink'], [12, 22, 6, 2, 'ink'], [11, 20, 4, 2, 'pink'],
    [17, 20, 5, 3, 'ink'], [16, 22, 5, 2, 'ink'], [18, 20, 3, 2, 'pink'],
    [17, 22, 3, 1, 'pink'],
  ],
] as const;

const COLORS: Record<PixelColor, string> = {
  ink: '#3b3540',
  pink: '#f2bfd1',
  shadow: '#dc91b3',
  highlight: '#fde5ee',
  blue: '#3d7fdc',
  shine: '#ffffff',
};

/** Original hand-built Mew sprite on a 28x24 pixel grid. */
export function drawPixelMew(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame = 0,
  unit = 2,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  for (const [blockX, blockY, width, height, color] of [...BODY, ...LEGS[frame % 2]]) {
    context.fillStyle = COLORS[color];
    context.fillRect(
      Math.round(x + blockX * unit),
      Math.round(y + blockY * unit),
      Math.ceil(width * unit),
      Math.ceil(height * unit),
    );
  }
  context.restore();
}
