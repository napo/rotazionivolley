// Generates the app's court-based visual assets — favicon, social preview
// image, and native Android/iOS app icons — FROM the app's own rendering
// rather than hand-drawn art: loads the running dev server, captures the
// live court canvas via canvas.toDataURL() and a DOM screenshot of the
// header, and derives every output size from those captures with sharp.
// Re-run after changing court colours, the default formation, or the header
// copy so these assets stay in sync.
//
// Usage: from web/, with the dev server running on :5173
//   node scripts/generate-assets.mjs

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import defaultConfigRaw from '../src/configs/ricezione-a-3.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const WEB_PUBLIC_DIR = join(__dirname, '..', 'public');
const ANDROID_RES_DIR = join(REPO_ROOT, 'android', 'app', 'src', 'main', 'res');
const IOS_ICON_DIR = join(REPO_ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const DEV_URL = process.env.FAVICON_SOURCE_URL ?? 'http://localhost:5173';

// Keep these in sync with src/court/courtGeometry.ts.
const VIEWBOX = { minX: -40, minY: -85, width: 640, height: 670 };
const BACKGROUND_COLOUR = '#85d6ff';
const PLAYER_RADIUS = 27;
// Liberos not swapped onto the court still render benched at this x (see
// LIBERO_BENCH_X) — the icon crop must stay clear of them so an off-court
// libero doesn't peek in at the edge of a tightly-zoomed icon.
const LIBERO_BENCH_X = 20;

// The app's default view on load: ricezione-a-3, "base" phase, setter in
// zone 2 (see src/state/AppStateContext.tsx initialStateFor) — the same
// formation a first-time visitor sees.
const basePositions = Object.values(defaultConfigRaw.positions.base['2']);
const xs = basePositions.map((p) => p.x);
const ys = basePositions.map((p) => p.y);

// Icons get masked to a circle/rounded-square by the OS, so keep the player
// cluster within a safe zone well inside the crop rather than filling it.
// The desired zoom is clamped to whatever the rendered canvas actually
// covers around the content's centre, so the crop never reaches outside it.
const ICON_SAFE_FRACTION = 0.62;
const contentWidth = Math.max(...xs) - Math.min(...xs) + 2 * PLAYER_RADIUS;
const contentHeight = Math.max(...ys) - Math.min(...ys) + 2 * PLAYER_RADIUS;
const centreX = (Math.max(...xs) + Math.min(...xs)) / 2;
const centreY = (Math.max(...ys) + Math.min(...ys)) / 2;
const desiredHalfSide = Math.max(contentWidth, contentHeight) / ICON_SAFE_FRACTION / 2;
const benchExclusionX = LIBERO_BENCH_X + PLAYER_RADIUS + 8;
const maxHalfSide = Math.min(
  centreY - VIEWBOX.minY,
  VIEWBOX.minY + VIEWBOX.height - centreY,
  centreX - benchExclusionX,
  VIEWBOX.minX + VIEWBOX.width - centreX,
);
const iconHalfSide = Math.min(desiredHalfSide, maxHalfSide);
const ICON_CROP = {
  x0: centreX - iconHalfSide,
  y0: centreY - iconHalfSide,
  x1: centreX + iconHalfSide,
  y1: centreY + iconHalfSide,
};

const FAVICON_SIZES = { 'favicon-32.png': 32, 'favicon-512.png': 512, 'apple-touch-icon.png': 180, 'pwa-192.png': 192 };
// PWA "maskable" icon: the OS may crop it to its inner 80% circle, so the
// court sits inside that safe zone on the court-background colour.
const MASKABLE_SIZE = 512;
const MASKABLE_CONTENT = Math.round(MASKABLE_SIZE * 0.78);
const ANDROID_LEGACY_SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// Adaptive-icon foreground canvas is 108dp vs. the legacy 72dp icon (1.5x).
const ANDROID_FOREGROUND_SIZES = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

mkdirSync(WEB_PUBLIC_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(DEV_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('.court-stage canvas');
await page.waitForTimeout(150);

const dataUrl = await page.evaluate(() => document.querySelector('.court-stage canvas').toDataURL('image/png'));
const fullPng = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
const meta = await sharp(fullPng).metadata();
const scale = meta.width / VIEWBOX.width;
const toPx = (x, y) => [(x - VIEWBOX.minX) * scale, (y - VIEWBOX.minY) * scale];

function cropSquare(crop) {
  const [left, top] = toPx(crop.x0, crop.y0);
  const [right, bottom] = toPx(crop.x1, crop.y1);
  return sharp(fullPng).extract({
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(right - left),
    height: Math.round(bottom - top),
  });
}

const iconMaster = cropSquare(ICON_CROP);

// --- Favicon / apple-touch-icon (web/public) -------------------------------
for (const [filename, size] of Object.entries(FAVICON_SIZES)) {
  await iconMaster.clone().resize(size, size, { kernel: 'lanczos3' }).toFile(join(WEB_PUBLIC_DIR, filename));
  console.log(`wrote public/${filename} (${size}x${size})`);
}
{
  const content = await iconMaster.clone().resize(MASKABLE_CONTENT, MASKABLE_CONTENT, { kernel: 'lanczos3' }).toBuffer();
  const offset = Math.round((MASKABLE_SIZE - MASKABLE_CONTENT) / 2);
  await sharp({ create: { width: MASKABLE_SIZE, height: MASKABLE_SIZE, channels: 4, background: BACKGROUND_COLOUR } })
    .composite([{ input: content, left: offset, top: offset }])
    .png()
    .toFile(join(WEB_PUBLIC_DIR, 'pwa-maskable-512.png'));
  console.log(`wrote public/pwa-maskable-512.png (${MASKABLE_SIZE}x${MASKABLE_SIZE})`);
}

// --- Social preview / OG image (web/public) --------------------------------
// Hidden scrollbars only for this capture — any scrollable panel would
// otherwise show its scrollbar track in the still image.
await page.addStyleTag({ content: '* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }' });
const titleBox = await page.locator('.app__header-titles').boundingBox();
const courtBox = await page.locator('.court-stage').boundingBox();
// Generous padding above/left of the title (breathing room around the
// card), but none on the right/bottom — those edges already sit right up
// against the rotation panel and comment box, so any extra pad there
// clips in a sliver of the neighbouring UI instead of empty space.
const PAD = 24;
const clipLeft = Math.min(titleBox.x, courtBox.x) - PAD;
const clipTop = titleBox.y - PAD;
const clipRight = Math.max(titleBox.x + titleBox.width, courtBox.x + courtBox.width);
const clipBottom = courtBox.y + courtBox.height;
const baseShot = await page.screenshot({
  clip: { x: clipLeft, y: clipTop, width: clipRight - clipLeft, height: clipBottom - clipTop },
});
// Second capture: the setter's positional faults in P5 reception — the
// overlay's arrows to the players P must stay ahead of / beside — laid over
// the first one in the card.
await page
  .locator('[data-tutorial="rotation"] [data-tutorial="rotation-receive"]')
  .getByRole('button', { name: 'P5' })
  .click();
await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
const faultsTab = page.getByRole('tab', { name: /Falli di posizione/ });
if ((await faultsTab.getAttribute('aria-selected')) !== 'true') await faultsTab.click();
await page.getByRole('tabpanel').getByRole('button', { name: 'P', exact: true }).click();
await page.waitForTimeout(800);
const faultsShot = await page.locator('.court-stage').screenshot();

// The card itself is plain HTML rendered by the same browser, laid out like
// the other volleyserve.it previews: brand column on the left, app captures
// tilted on the right.
const toDataUrl = (buf) => `data:image/png;base64,${buf.toString('base64')}`;
const iconDataUrl = toDataUrl(await iconMaster.clone().resize(256, 256, { kernel: 'lanczos3' }).png().toBuffer());
const SOCIAL_HTML = `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #f3f4f6;
    font-family: Inter, 'Open Sans', 'Noto Sans', sans-serif; color: #10233a; }
  .bar { position: absolute; left: 0; top: 0; width: 14px; height: 100%; background: linear-gradient(#10233a 0 66%, #e8590c 66%); }
  .left { position: absolute; left: 64px; top: 62px; width: 520px; z-index: 2; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand img { width: 84px; height: 84px; border-radius: 22px; box-shadow: 0 2px 8px rgba(16,35,58,.25); }
  .brand h1 { font-size: 56px; font-weight: 800; letter-spacing: -1px; white-space: nowrap; }
  h2 { margin-top: 56px; font-size: 44px; line-height: 1.2; font-weight: 800; color: #374151; }
  h2 em { font-style: normal; color: #e8590c; }
  p { margin-top: 24px; font-size: 21px; line-height: 1.5; color: #4b5563; width: 470px; }
  .pills { display: flex; gap: 12px; margin-top: 30px; }
  .pills span { background: #10233a; color: #fff; font-size: 19px; font-weight: 600; padding: 10px 18px; border-radius: 999px; white-space: nowrap; }
  .url { position: absolute; left: 64px; bottom: 34px; font-size: 32px; font-weight: 800; color: #1f6f8b; }
  .shot { position: absolute; background: #fff; box-shadow: 0 18px 40px rgba(16,35,58,.28); border: 1px solid #d1d5db; }
  .shot img { display: block; width: 100%; }
  .back { left: 640px; top: 40px; width: 470px; transform: rotate(-4deg); }
  .front { left: 840px; top: 230px; width: 350px; transform: rotate(3deg); border: 6px solid #fff; }
</style></head><body>
  <div class="bar"></div>
  <div class="shot back"><img src="${toDataUrl(baseShot)}"></div>
  <div class="shot front"><img src="${toDataUrl(faultsShot)}"></div>
  <div class="left">
    <div class="brand"><img src="${iconDataUrl}"><h1>Rotazioni Volley</h1></div>
    <h2>Sei rotazioni,<br><em>un campo animato</em></h2>
    <p>Scegli lo schema di ricezione: l'app muove i giocatori in ogni rotazione e fase e ti mostra i possibili falli di posizione.</p>
    <div class="pills"><span>Rotazioni P1–P6</span><span>Falli di posizione</span><span>Open source</span></div>
  </div>
  <div class="url">rotazioni.volleyserve.it</div>
</body></html>`;
const socialPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await socialPage.setContent(SOCIAL_HTML, { waitUntil: 'load' });
await socialPage.screenshot({ path: join(WEB_PUBLIC_DIR, 'social-preview.png') });
await socialPage.close();
console.log('wrote public/social-preview.png (1200x630)');

// --- Android launcher icons --------------------------------------------
for (const [density, size] of Object.entries(ANDROID_LEGACY_SIZES)) {
  const dir = join(ANDROID_RES_DIR, `mipmap-${density}`);
  const squarePng = await iconMaster.clone().resize(size, size, { kernel: 'lanczos3' }).toBuffer();
  await sharp(squarePng).toFile(join(dir, 'ic_launcher.png'));

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  await sharp(squarePng)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .toFile(join(dir, 'ic_launcher_round.png'));

  console.log(`wrote android mipmap-${density}/ic_launcher{,_round}.png (${size}x${size})`);
}

for (const [density, size] of Object.entries(ANDROID_FOREGROUND_SIZES)) {
  const dir = join(ANDROID_RES_DIR, `mipmap-${density}`);
  await iconMaster.clone().resize(size, size, { kernel: 'lanczos3' }).toFile(join(dir, 'ic_launcher_foreground.png'));
  console.log(`wrote android mipmap-${density}/ic_launcher_foreground.png (${size}x${size})`);
}

writeFileSync(
  join(ANDROID_RES_DIR, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BACKGROUND_COLOUR}</color>\n</resources>\n`,
);
console.log('wrote android values/ic_launcher_background.xml');

// --- iOS app icon --------------------------------------------------------
mkdirSync(IOS_ICON_DIR, { recursive: true });
await iconMaster
  .clone()
  .resize(1024, 1024, { kernel: 'lanczos3' })
  .flatten({ background: BACKGROUND_COLOUR })
  .toFile(join(IOS_ICON_DIR, 'AppIcon-512@2x.png'));
console.log('wrote ios AppIcon-512@2x.png (1024x1024)');

await browser.close();
