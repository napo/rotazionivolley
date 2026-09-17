// Generates the site favicon FROM the app's own rendering (not a hand-drawn
// icon): loads the running dev server, captures the live court canvas via
// canvas.toDataURL(), crops it to the player cluster, and writes the
// favicon/apple-touch-icon PNGs into public/. Re-run this after changing
// court colours or the default formation so the favicon stays in sync.
//
// Usage: from web/, with the dev server running on :5173
//   node scripts/generate-favicon.mjs

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const DEV_URL = process.env.FAVICON_SOURCE_URL ?? 'http://localhost:5173';

// Square crop in the app's own court coordinate space (see COURT_VIEWBOX in
// src/court/courtGeometry.ts), chosen to frame the default 6-player base
// formation tightly.
const CROP = { x0: 60, y0: 10, x1: 390, y1: 340 };
const VIEWBOX = { minX: -40, minY: -20, width: 640, height: 560 };
const SIZES = { 'favicon-32.png': 32, 'favicon-512.png': 512, 'apple-touch-icon.png': 180 };

mkdirSync(PUBLIC_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(DEV_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('.court-stage canvas');
await page.waitForTimeout(150);

const dataUrl = await page.evaluate(() => document.querySelector('.court-stage canvas').toDataURL('image/png'));
await browser.close();

const fullPng = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
const meta = await sharp(fullPng).metadata();
const scale = meta.width / VIEWBOX.width;
const toPx = (x, y) => [(x - VIEWBOX.minX) * scale, (y - VIEWBOX.minY) * scale];
const [left, top] = toPx(CROP.x0, CROP.y0);
const [right, bottom] = toPx(CROP.x1, CROP.y1);

const cropped = sharp(fullPng).extract({
  left: Math.round(left),
  top: Math.round(top),
  width: Math.round(right - left),
  height: Math.round(bottom - top),
});

for (const [filename, size] of Object.entries(SIZES)) {
  await cropped.clone().resize(size, size, { kernel: 'lanczos3' }).toFile(join(PUBLIC_DIR, filename));
  console.log(`wrote ${filename} (${size}x${size})`);
}
