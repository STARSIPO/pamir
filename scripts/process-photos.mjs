// Run after scripts/clean-logo-b2.mjs, which writes bs2-b2/cover-clean.jpg.
// One-off: turn the raw photos pulled from pamirconstruct.md (assets/photos-src)
// into web-ready JPEGs under public/photos/projects. Static export ships images
// as-is (images.unoptimized), so size and crop are decided here, not at build.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'assets/photos-src';
const OUT = 'public/photos/projects';

// crop: [left, top, width, height] in source pixels. width: output width.
// Crops remove the logo overlays and watermarks baked into the renders.
const jobs = [
  { src: 'eco-house/cover.jpg', out: 'eco-house/hero.jpg', width: 2000 },
  { src: 'eco-house/cover.jpg', out: 'eco-house/cover.jpg', crop: [200, 0, 620, 720], width: 1000 },
  { src: 'bs2-34/cover.jpg', out: 'botanic-star-2-blocks-3-4/cover.jpg', crop: [362, 0, 678, 560], width: 1300 },
  { src: 'bs2-b2/cover-clean.jpg', out: 'botanic-star-2-block-2/cover.jpg', crop: [170, 0, 990, 720], width: 1400 },
  { src: 'bs2-b1/cover.jpg', out: 'botanic-star-2-block-1/cover.jpg', width: 2000 },
  { src: 'about/company.jpg', out: 'company/about.jpg', width: 1600 },
  { src: 'botanic-star/g1.jpg', out: 'botanic-star/cover.jpg', width: 1200 },
  { src: 'botanic-star/g2.jpg', out: 'botanic-star/gallery-1.jpg', width: 1600 },
  { src: 'botanic-star/g3.jpg', out: 'botanic-star/gallery-2.jpg', width: 1600 },
  { src: 'botanic-star/g4.jpg', out: 'botanic-star/gallery-3.jpg', width: 1600 },
  { src: 'botanic-star/g5.jpg', out: 'botanic-star/gallery-4.jpg', width: 1600 },
  { src: 'botanic-park/cover.jpg', out: 'botanic-park/cover.jpg', width: 1800 },
  { src: 'botanic-park/g1.jpg', out: 'botanic-park/gallery-1.jpg', width: 1600 },
  { src: 'botanic-park/g2.jpg', out: 'botanic-park/gallery-2.jpg', width: 1600 },
];

for (const j of jobs) {
  const out = `${OUT}/${j.out}`;
  mkdirSync(dirname(out), { recursive: true });
  let img = sharp(`${SRC}/${j.src}`).rotate();
  if (j.crop) {
    const [left, top, width, height] = j.crop;
    img = img.extract({ left, top, width, height });
  }
  const meta = await img.clone().metadata();
  const srcW = j.crop ? j.crop[2] : meta.width;
  // Upscaling a render with lanczos3 + a light unsharp reads cleaner than the
  // browser's bilinear stretch of the same pixels on a full-bleed slot.
  img = img.resize({ width: j.width, kernel: 'lanczos3', withoutEnlargement: false });
  if (j.width > srcW) img = img.sharpen({ sigma: 0.7, m1: 0.4, m2: 1.2 });
  const info = await img.jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(out);
  console.log(`${j.out.padEnd(44)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
