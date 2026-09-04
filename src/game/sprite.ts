export type PixelColor = 'ink' | 'yellow' | 'light' | 'red' | 'brown';
export type PixelBlock = readonly [x: number, y: number, width: number, height: number, color: PixelColor];

const BODY: readonly PixelBlock[] = [
  // Coda a saetta, disegnata dietro al corpo.
  [1, 12, 6, 3, 'ink'], [5, 9, 4, 5, 'ink'], [3, 6, 5, 4, 'ink'], [6, 3, 4, 5, 'ink'],
  [2, 12, 4, 1, 'yellow'], [6, 10, 2, 3, 'yellow'], [4, 7, 3, 2, 'yellow'], [7, 4, 2, 3, 'yellow'],
  // Corpo e testa laterale.
  [8, 11, 14, 11, 'ink'], [9, 10, 10, 2, 'ink'], [9, 12, 12, 9, 'yellow'],
  [15, 6, 11, 11, 'ink'], [17, 5, 7, 2, 'ink'], [16, 7, 9, 9, 'yellow'],
  [24, 10, 4, 5, 'ink'], [24, 11, 3, 3, 'yellow'],
  // Orecchie lunghe con punte scure.
  [16, 1, 4, 7, 'ink'], [17, 3, 2, 5, 'yellow'], [22, 0, 4, 8, 'ink'], [23, 3, 2, 5, 'yellow'],
  // Viso e pancia.
  [22, 8, 2, 2, 'ink'], [26, 12, 2, 1, 'ink'], [21, 12, 3, 3, 'red'],
  [16, 15, 4, 5, 'light'], [10, 17, 3, 3, 'brown'],
] as const;

const LEGS: readonly [readonly PixelBlock[], readonly PixelBlock[]] = [
  [[9, 20, 6, 3, 'ink'], [10, 20, 4, 2, 'yellow'], [18, 20, 7, 3, 'ink'], [19, 20, 5, 2, 'yellow']],
  [[7, 19, 7, 3, 'ink'], [8, 19, 5, 2, 'yellow'], [19, 21, 7, 2, 'ink'], [20, 20, 4, 2, 'yellow']],
] as const;

const COLORS: Record<PixelColor, string> = {
  ink: '#535353',
  yellow: '#d9ad35',
  light: '#f7df8b',
  red: '#b85d50',
  brown: '#8a6841',
};

/** Sprite originale costruito a mano come blocchi su una griglia 28×23. */
export function drawPixelPikachu(
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
