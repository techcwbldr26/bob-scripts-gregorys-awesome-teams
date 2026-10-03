#!/usr/bin/env node
/**
 * Rasterises `assets/social-card.svg` to `assets/social-card.png`.
 *
 * The PNG is the artefact that actually gets used: GitHub's **Settings → Social
 * preview** upload, and therefore the image LinkedIn, Slack and X render when
 * the repository is shared. A preview crawler will not render SVG, so the
 * committed PNG is not a convenience — it is the only usable form.
 *
 * This is the one tool here that needs something the repository does not ship.
 * The kit has no npm dependencies on purpose, so Playwright is not a dependency
 * of it; this script uses whatever Playwright the machine already has and says
 * so plainly when there is none. Contributors do not need it — `social-card.png`
 * is committed, and only someone changing the card has to re-run this.
 *
 * It also reports each line's **real** rendered width from the browser rather
 * than the character-ratio estimate the generator guards with, because the
 * estimate is what let `references/evidence.md` overflow its box once already.
 *
 * Run `npm run build:social-png`.
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const SVG = path.join(assets, 'social-card.svg');
const PNG = path.join(assets, 'social-card.png');

const WIDTH = 1280;
const HEIGHT = 640;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('This script needs Playwright, which the kit does not depend on.');
  console.error('');
  console.error('  npm i -g playwright && npx playwright install chromium');
  console.error('');
  console.error('assets/social-card.png is committed, so you only need this if you');
  console.error('changed the card. Everything else in the repository builds without it.');
  process.exit(1);
}

const svg = await fs.readFile(SVG, 'utf8');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  // Inlined rather than loaded from file:// so the SVG renders in the page's own
  // document and its <text> can be measured. An <img src="...svg"> cannot be.
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8">` +
      `<style>html,body{margin:0;padding:0;background:#121212;overflow:hidden}` +
      `svg{display:block}</style></head><body>${svg}</body></html>`,
    { waitUntil: 'load' },
  );

  // Measure what the browser actually laid out. The generator's guards use an
  // estimated character ratio; this is the ground truth that estimate stands in
  // for, so a line close to the edge shows up here before it ships.
  const measured = await page.evaluate(() => {
    const frameWidth = 1280 - 72 * 2;
    return [...document.querySelectorAll('text')].map((el) => {
      const x = parseFloat(el.getAttribute('x'));
      const anchor = el.getAttribute('text-anchor') || 'start';
      const w = el.getComputedTextLength();
      const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
      return {
        text: el.textContent.slice(0, 44),
        width: Math.round(w),
        right: Math.round(left + w),
        overflows: left < 72 - 1 || left + w > 72 + frameWidth + 1,
      };
    });
  });

  const overflowing = measured.filter((m) => m.overflows);
  for (const m of measured) {
    console.log(`  ${String(m.width).padStart(5)}px  right@${String(m.right).padStart(4)}  ${m.text}`);
  }
  if (overflowing.length) {
    throw new Error(
      `social-card: ${overflowing.length} line(s) fall outside the frame once rendered:\n` +
        overflowing.map((m) => `  "${m.text}" ends at ${m.right}px`).join('\n'),
    );
  }

  await page.screenshot({ path: PNG, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
} finally {
  await browser.close();
}

// Record which SVG this PNG was made from.
//
// `npm run build:svg` regenerates the card's SVG but cannot regenerate the PNG,
// because rasterising needs Playwright and the kit has no dependencies. Without
// a record, a count could change in the SVG while the committed PNG — the one
// GitHub actually serves — still showed the old number, and nothing would say
// so. A test compares this hash against the SVG on disk.
await fs.writeFile(`${PNG}.sha256`, `${createHash('sha256').update(svg).digest('hex')}\n`, 'utf8');

const { size } = await fs.stat(PNG);
console.log('');
console.log(`wrote ${path.relative(process.cwd(), PNG)}`);
console.log(`wrote ${path.relative(process.cwd(), `${PNG}.sha256`)}`);
console.log(`  ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(0)} KB`);
// GitHub rejects a social preview over 1 MB, and a crawler may skip a slow one.
if (size > 1024 * 1024) {
  throw new Error(`social-card.png is ${(size / 1024 / 1024).toFixed(2)} MB; GitHub's limit is 1 MB`);
}
