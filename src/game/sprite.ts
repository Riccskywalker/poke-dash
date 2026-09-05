const COLORS = {
  navy: "#0A0A2E",
  lime: "#C8F04B",
  light: "#D9F571",
  dark: "#89AC2C",
  pale: "#EAFCA0",
};
export function drawRareBitIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation = 0,
): void {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-size / 2, -size / 2);
  ctx.fillStyle = COLORS.navy;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * .2);
  ctx.fill();
  const scale = size * .006;
  ctx.translate(size * .2, size * .2);
  ctx.scale(scale, scale);
  const facet = (color: string, points: number[]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      ctx.lineTo(points[i], points[i + 1]);
    }
    ctx.closePath();
    ctx.fill();
  };
  facet(COLORS.light, [3, 50, 50, 3, 50, 28, 28, 50]);
  facet(COLORS.lime, [50, 3, 97, 50, 72, 50, 50, 28]);
  facet("#A9CC3C", [50, 97, 3, 50, 28, 50, 50, 72]);
  facet(COLORS.dark, [97, 50, 50, 97, 50, 72, 72, 50]);
  facet(COLORS.pale, [50, 28, 72, 50, 50, 72, 28, 50]);
  ctx.strokeStyle = "rgba(10,10,46,.13)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(50, 28);
  ctx.lineTo(72, 50);
  ctx.lineTo(50, 72);
  ctx.lineTo(28, 50);
  ctx.closePath();
  ctx.moveTo(50, 3);
  ctx.lineTo(50, 28);
  ctx.moveTo(97, 50);
  ctx.lineTo(72, 50);
  ctx.moveTo(50, 97);
  ctx.lineTo(50, 72);
  ctx.moveTo(3, 50);
  ctx.lineTo(28, 50);
  ctx.stroke();
  ctx.restore();
}
