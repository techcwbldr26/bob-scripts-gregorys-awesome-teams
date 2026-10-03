#!/usr/bin/env node
/**
 * Generates `assets/social-card.svg` — the image social platforms show when
 * someone shares the repository.
 *
 * Why this exists, and why it is the only image that can do this job:
 *
 * GitHub serves a repository page with `og:image` pointing at an auto-generated
 * card (repo name, description, language, stars). Uploading a custom image in
 * **Settings → Social preview** replaces it, and that replacement is the one
 * thing on this repository that controls what LinkedIn, Slack, X and the rest
 * actually render. Nothing in a README or a wiki page affects it.
 *
 * It cannot be one of the animated diagrams. A preview crawler fetches the
 * image and rasterises nothing: it needs a raster format at a known size, so
 * an SVG — animated or not — is simply dropped. Hence a static card, authored
 * here as SVG for the same reason as every other diagram (it is text, so it
 * reviews and diffs), and rasterised to PNG by `npm run build:social-png`.
 *
 * Sized 1280x640, which is GitHub's documented social-preview size and the 2:1
 * ratio LinkedIn crops least. Assume it will be read at thumbnail size: the
 * title has to survive being 300px wide, so there is very little text and all
 * of it is large.
 *
 * Run `npm run build:social`.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMMANDS, DEMO_DATE } from '../src/constants.mjs';
import { payloadRoot, readSkills } from '../src/payload.mjs';

import { C, CHAR_RATIO, STROKE, assemble, hatchPatterns, text as t } from './lib/svg.mjs';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'social-card.svg',
);

// Counts come from the payload, like every other generated artefact here. A
// card is the worst place to carry a stale number: it is cached by every
// platform that has ever rendered it.
const SKILL_COUNT = (await readSkills()).length;
const RULE_COUNT = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
  f.endsWith('.md'),
).length;

const W = 1280;
const H = 640;

const MARGIN = 72;
const INNER = W - MARGIN * 2;

const TITLE = "Gregory's Awesome Teams";
const EYEBROW = 'PROMPT · CONTEXT · HARNESS ENGINEERING';
const SUBTITLE = 'A teaching kit for the IBM Bob harness.';
const SUBTITLE2 = 'The thing it installs is the lesson.';
const CREDIT = 'Created by Gregory Kennedy for his awesome University Student Developers';

const CHIPS = [
  { n: String(SKILL_COUNT), label: 'skills', kind: 'blue' },
  { n: String(COMMANDS.length), label: 'commands', kind: 'green' },
  { n: String(RULE_COUNT), label: 'always-on rules', kind: 'orange' },
  { n: DEMO_DATE, label: 'demo day', kind: 'blue' },
];

const CHAIN = ['discover', 'grill', 'spec', 'implement', 'evals', 'demo'];

const body = [];

/* ------------------------------------------------------------------ *
 * Frame
 * ------------------------------------------------------------------ */
// A hairline inset keeps the card from bleeding into a light-themed timeline.
body.push(
  `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="20" fill="none"` +
    ` stroke="${C.track}" stroke-width="2"/>`,
  // A single accent bar, so the card is recognisable at thumbnail size even
  // when the type is too small to read.
  `<rect x="${MARGIN}" y="${MARGIN}" width="96" height="7" rx="3.5" fill="${C.blue}"/>`,
);

/* ------------------------------------------------------------------ *
 * Headline block
 * ------------------------------------------------------------------ */
const EYEBROW_Y = MARGIN + 44;
const TITLE_Y = 232;
const TITLE_SIZE = 72;

body.push(
  t(MARGIN, EYEBROW_Y, EYEBROW, { size: 21, fill: C.muted, weight: 600, ls: 3.4 }),
  t(MARGIN, TITLE_Y, TITLE, { size: TITLE_SIZE, weight: 700, fill: C.white }),
  t(MARGIN, TITLE_Y + 58, SUBTITLE, { size: 29, fill: C.text }),
  t(MARGIN, TITLE_Y + 96, SUBTITLE2, { size: 29, fill: C.muted }),
);

// The title is the whole card at thumbnail size. If an edit ever makes it wider
// than the frame it must fail the build, not ship clipped.
//
// CHAR_RATIO.bold (0.62) is calibrated on the diagrams' body text and is too
// generous for display type: measured in Chromium, this title renders at 0.654
// of its nominal width — capitals and the apostrophe set wider than lowercase
// prose. Guard with a ratio that holds at this size, so someone without
// Playwright still cannot ship a clipped title.
const DISPLAY_RATIO = 0.68;
{
  const width = TITLE.length * TITLE_SIZE * DISPLAY_RATIO;
  if (width > INNER) {
    throw new Error(
      `social-card: the title is ~${width.toFixed(0)}px wide in a ${INNER}px frame — ` +
        `shorten it or drop TITLE_SIZE`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Stat chips
 * ------------------------------------------------------------------ */
// Laid out left to right from measured widths rather than a fixed pitch, so a
// long value (the demo date is the long one) cannot sit on its neighbour.
//
// Both lines are centred in their chip. Left-aligning them put all the slack on
// one side, so an under-estimated width showed up as text running into the
// right edge rather than as a chip that was merely a little tight — which is
// exactly how "December 2026" shipped touching its own corner. Centred, a
// width error is split between two margins and stays legible while the guards
// below catch it.
const CHIP_Y = 420;
const CHIP_H = 74;
const CHIP_PAD = 24;
const CHIP_GAP = 16;
const CHIP_NUMBER_SIZE = 30;
const CHIP_LABEL_SIZE = 17;

{
  let x = MARGIN;
  for (const [i, chip] of CHIPS.entries()) {
    // The number is display type, so it takes DISPLAY_RATIO for the same reason
    // the title does: CHAR_RATIO.bold is calibrated on body text and reads
    // "December 2026" 23px narrower than Chromium actually sets it.
    const numberW = chip.n.length * CHIP_NUMBER_SIZE * DISPLAY_RATIO;
    const labelW = chip.label.length * CHIP_LABEL_SIZE * CHAR_RATIO.regular;
    const w = Math.max(numberW, labelW) + CHIP_PAD * 2;
    const mid = x + w / 2;

    // Grouped and tagged so the rasteriser can check each line against its own
    // chip rather than only against the outer frame. The frame check passed
    // while the date was overrunning its box by a pixel.
    body.push(
      `<g data-chip="${i}">` +
        `<rect x="${x.toFixed(1)}" y="${CHIP_Y}" width="${w.toFixed(1)}" height="${CHIP_H}" rx="12"` +
        ` fill="url(#hatch-${chip.kind})" stroke="${STROKE[chip.kind]}" stroke-width="1.8"/>` +
        t(mid, CHIP_Y + 34, chip.n, {
          size: CHIP_NUMBER_SIZE,
          weight: 700,
          fill: C.white,
          anchor: 'middle',
        }) +
        t(mid, CHIP_Y + 57, chip.label, {
          size: CHIP_LABEL_SIZE,
          fill: C.muted,
          anchor: 'middle',
        }) +
        `</g>`,
    );
    x += w + CHIP_GAP;
  }

  const overrun = x - CHIP_GAP - (W - MARGIN);
  if (overrun > 0) {
    throw new Error(
      `social-card: the stat chips overrun the frame by ~${overrun.toFixed(0)}px — ` +
        `shorten a label or drop one chip`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * The build chain
 * ------------------------------------------------------------------ */
const CHAIN_Y = 524;
const CHAIN_SIZE = 19;

{
  const joined = CHAIN.join('  →  ');
  const width = joined.length * CHAIN_SIZE * CHAR_RATIO.regular;
  if (width > INNER) {
    throw new Error(
      `social-card: the build chain is ~${width.toFixed(0)}px wide in a ${INNER}px frame`,
    );
  }
  body.push(t(MARGIN, CHAIN_Y, joined, { size: CHAIN_SIZE, fill: C.muted, ls: 0.6 }));
}

/* ------------------------------------------------------------------ *
 * Credit
 * ------------------------------------------------------------------ */
const CREDIT_Y = H - MARGIN + 14;
const CREDIT_SIZE = 18;

const RULE_Y = CREDIT_Y - 30;

{
  const width = CREDIT.length * CREDIT_SIZE * CHAR_RATIO.regular;
  if (width > INNER) {
    throw new Error(
      `social-card: the credit line is ~${width.toFixed(0)}px wide in a ${INNER}px frame`,
    );
  }
  // The chain sits directly above the rule. Its descenders ran into it once;
  // keep a real gap rather than a hopeful one.
  const chainBottom = CHAIN_Y + CHAIN_SIZE * 0.24;
  if (chainBottom > RULE_Y - 12) {
    throw new Error(
      `social-card: the build chain bottoms out at ~${chainBottom.toFixed(0)}px and the ` +
        `divider is at ${RULE_Y}px — they need 12px between them`,
    );
  }
  body.push(
    `<line x1="${MARGIN}" y1="${RULE_Y}" x2="${W - MARGIN}" y2="${RULE_Y}"` +
      ` stroke="${C.track}" stroke-width="1.6"/>`,
    t(MARGIN, CREDIT_Y, CREDIT, { size: CREDIT_SIZE, fill: C.muted }),
  );
}

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
// Static: no timeline, so no CSS and no reduced-motion still frame. assemble()
// takes both as arrays, and empty ones produce a card with nothing animated.
const svg = assemble({
  width: W,
  height: H,
  title: "Gregory's Awesome Teams — a teaching kit for the IBM Bob harness",
  desc:
    `A social preview card. It reads "Gregory's Awesome Teams", a teaching kit for ` +
    `the IBM Bob harness, and "the thing it installs is the lesson". Four figures ` +
    `follow: ${SKILL_COUNT} skills, ${COMMANDS.length} commands, ${RULE_COUNT} ` +
    `always-on rules, and demo day ${DEMO_DATE}. Underneath is the six-stage build ` +
    `chain — discover, grill, spec, implement, evals, demo — and the line ` +
    `"${CREDIT}".`,
  defs: hatchPatterns(),
  css: [],
  still: [],
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${W}x${H}, static (no animation)`);
console.log(`  ${SKILL_COUNT} skills, ${COMMANDS.length} commands, ${RULE_COUNT} rules`);
console.log(`  rasterise it with: npm run build:social-png`);
