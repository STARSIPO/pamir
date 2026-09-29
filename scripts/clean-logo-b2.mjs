// The Block 2 render has the "Botanic Star 2" logo baked into the sky.
// Rebuild that patch of sky by interpolating each column between clean rows
// above and below the logo. The sampled rows are smoothed horizontally so the
// few clouds they cross do not smear into vertical streaks.
import sharp from 'sharp';

const src = 'assets/photos-src/bs2-b2/cover.jpg';
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const { width, channels } = info;
const px = (x, y) => (y * width + x) * channels;
const X1 = 472, TOP = 5, BOT = 172;

const sample = (y0, y1) =>
  Array.from({ length: X1 + 1 }, (_, x) => {
    const c = [0, 0, 0];
    for (let y = y0; y <= y1; y++) for (let k = 0; k < 3; k++) c[k] += data[px(x, y) + k];
    return c.map((v) => v / (y1 - y0 + 1));
  });
const smooth = (row, r) =>
  row.map((_, x) => {
    const c = [0, 0, 0];
    let n = 0;
    for (let i = Math.max(0, x - r); i <= Math.min(row.length - 1, x + r); i++) {
      for (let k = 0; k < 3; k++) c[k] += row[i][k];
      n++;
    }
    return c.map((v) => v / n);
  });

// Below the logo, take the darker (bluer) of two candidate rows per column:
// clouds are brighter than sky, so min() rejects them.
const b1 = sample(BOT, BOT + 4);
const b2 = sample(BOT - 8, BOT - 5);
const bottom = smooth(b1.map((c, x) => (c[0] + c[1] + c[2] < b2[x][0] + b2[x][1] + b2[x][2] ? c : b2[x])), 60);
const top = smooth(sample(1, 5), 60);

for (let x = 0; x <= X1; x++) {
  for (let y = TOP; y < BOT + 6; y++) {
    const t = Math.min(1, (y - TOP) / (BOT - TOP));
    const edgeX = Math.min(1, (X1 - x) / 8);
    const edgeY = y >= BOT ? 1 - (y - BOT) / 6 : 1;
    const w = edgeX * edgeY;
    const n = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * 1.2;
    for (let k = 0; k < 3; k++) {
      const fill = top[x][k] * (1 - t) + bottom[x][k] * t + n;
      const i = px(x, y) + k;
      data[i] = Math.round(fill * w + data[i] * (1 - w));
    }
  }
}
await sharp(data, { raw: info }).jpeg({ quality: 95 }).toFile('assets/photos-src/bs2-b2/cover-clean.jpg');
console.log('ok');
