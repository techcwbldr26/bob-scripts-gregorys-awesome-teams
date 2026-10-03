#!/usr/bin/env node
/**
 * Generates `assets/five-layers.svg`, the diagram in the middle of the wiki's
 * Enterprise Security Safeguards page.
 *
 * Five layers to work through before an agent goes from proof of concept to
 * something people depend on. They build from the bottom up, because each one
 * is answered by the one beneath it — you cannot decide access before you know
 * the workflow, or measure before you know the business case.
 *
 * Then the point of the whole thing: governance and security are drawn again
 * as a spine running through all five, not as the fourth step. The article it
 * comes from puts it plainly — security should not be added after the workflow
 * is designed.
 *
 * Run `npm run build:layers`.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  C,
  CHAR_RATIO,
  CYCLE,
  STROKE,
  assemble,
  hatchPatterns,
  text as t,
  timeline,
} from './lib/svg.mjs';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'five-layers.svg',
);

/* ------------------------------------------------------------------ *
 * Content — bottom layer first, because that is the order they are built
 * ------------------------------------------------------------------ */
const LAYERS = [
  {
    n: 'Business case',
    kind: 'blue',
    ask: 'What problem are we solving?',
    not: 'not “what can this tool do?”',
  },
  {
    n: 'Workflow',
    kind: 'blue',
    ask: 'Where does the agent enter, and where should it stop?',
    not: 'the goal is not to automate everything',
  },
  {
    n: 'Access',
    kind: 'green',
    ask: 'What does it need, and what should it never touch?',
    not: 'the job it does, not the maximum the tool allows',
  },
  {
    n: 'Governance and security',
    kind: 'orange',
    ask: 'What can it do alone, what needs approval, who is accountable?',
    not: 'not added after the workflow is built',
  },
  {
    n: 'Measurement',
    kind: 'green',
    ask: 'How will you know it is creating value?',
    not: 'against the process it changes, not how it looks',
  },
];

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ */
const DESIGN = 35;
const ENDS = 33.4;

const T0 = 1.8;
const STEP = 5.1;
const at = (i) => T0 + i * STEP;
const SPINE_AT = at(LAYERS.length - 1) + 3.4;

const tl = timeline({ design: DESIGN, ends: ENDS });
const { css, still, fade, draw, pulse } = tl;
const body = [];

/* ------------------------------------------------------------------ *
 * Geometry — built bottom-up, so index 0 sits lowest
 * ------------------------------------------------------------------ */
const W = 1000;

const BAND = { x: 196, w: 780, h: 64, gap: 10 };
const BOTTOM = 414;
const bandY = (i) => BOTTOM - i * (BAND.h + BAND.gap);
const TOP_Y = bandY(LAYERS.length - 1);

const SPINE = { x: 72, w: 96 };

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */
const SUBTITLE = 'Five layers between a demo that works and a system people can depend on.';

body.push(
  t(26, 44, 'From proof of concept to production', { size: 24, weight: 700, fill: C.white }),
  t(26, 68, SUBTITLE, { size: 12.5, fill: C.muted }),
  t(974, 44, 'build upward', { size: 12, anchor: 'end', fill: C.muted, ls: 0.6 }),
  t(974, 68, 'each layer answers the one below it', { size: 12, anchor: 'end', fill: C.faint }),
);

// The two subtitle lines share a row from opposite ends; make an overlap loud.
{
  const leftEnd = 26 + SUBTITLE.length * 12.5 * CHAR_RATIO.regular;
  const rightStart = 974 - 'each layer answers the one below it'.length * 12 * CHAR_RATIO.regular;
  if (leftEnd > rightStart - 24) {
    throw new Error(
      `layers: the header subtitles overlap — left ends ~${leftEnd.toFixed(0)}px, ` +
        `right starts ~${rightStart.toFixed(0)}px`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * The five layers
 * ------------------------------------------------------------------ */
// Each band carries a question on the left and a counterpoint anchored right.
// Both are prose that will get edited, so prove they cannot meet.
LAYERS.forEach((l, i) => {
  const askEnd = BAND.x + 44 + l.ask.length * 12.5 * CHAR_RATIO.regular;
  const notStart = BAND.x + BAND.w - 20 - l.not.length * 11 * CHAR_RATIO.regular;
  if (askEnd > notStart - 20) {
    throw new Error(
      `layers: row ${i + 1} (${l.n}) overlaps — question ends ~${askEnd.toFixed(0)}px, ` +
        `note starts ~${notStart.toFixed(0)}px`,
    );
  }
});

LAYERS.forEach((l, i) => {
  const y = bandY(i);
  const tIn = at(i);
  body.push(
    `<g class="${fade(tIn, ENDS, { rise: 12 })}">` +
      `<rect x="${BAND.x}" y="${y}" width="${BAND.w}" height="${BAND.h}" rx="9"` +
      ` fill="url(#hatch-${l.kind})" stroke="${STROKE[l.kind]}" stroke-width="1.7"/>` +
      t(BAND.x + 22, y + 27, `${i + 1}`, { size: 13, fill: C.faint, weight: 600 }) +
      t(BAND.x + 44, y + 27, l.n, { size: 15.5, weight: 700, fill: C.white }) +
      t(BAND.x + 44, y + 48, l.ask, { size: 12.5, fill: C.text }) +
      t(BAND.x + BAND.w - 20, y + 48, l.not, { size: 11, anchor: 'end', fill: C.muted }) +
      `</g>`,
    // A beat as each one lands, so the build order reads.
    `<rect x="${BAND.x - 4}" y="${y - 4}" width="${BAND.w + 8}" height="${BAND.h + 8}" rx="12"` +
      ` fill="none" stroke="${STROKE[l.kind]}" class="${pulse(tIn, tIn + STEP - 0.4)}"/>`,
  );
});

/* ------------------------------------------------------------------ *
 * The spine: governance and security, drawn through all five
 * ------------------------------------------------------------------ */
{
  const top = TOP_Y;
  const height = BOTTOM + BAND.h - TOP_Y;
  const midY = top + height / 2;

  body.push(
    // Drawn as a thick stroked line so it wipes upward through the stack.
    `<line x1="${SPINE.x + SPINE.w / 2}" y1="${BOTTOM + BAND.h}" x2="${SPINE.x + SPINE.w / 2}" y2="${top}"` +
      ` stroke="url(#hatch-orange)" stroke-width="${SPINE.w}"` +
      ` class="${draw(Math.ceil(height), SPINE_AT, ENDS, { dur: 1.6 })}"/>`,
    `<g class="${fade(SPINE_AT + 1.0, ENDS)}">` +
      `<rect x="${SPINE.x}" y="${top}" width="${SPINE.w}" height="${height}" rx="10"` +
      ` fill="none" stroke="${C.orange}" stroke-width="1.8"/>` +
      `<g transform="rotate(-90 ${SPINE.x + SPINE.w / 2} ${midY})">` +
      t(SPINE.x + SPINE.w / 2, midY + 5, 'GOVERNANCE AND SECURITY', {
        size: 13,
        anchor: 'middle',
        fill: C.orange,
        weight: 700,
        ls: 1.4,
      }) +
      `</g>` +
      `</g>`,
    // Connectors from the spine into every band, so "through" is literal.
    ...LAYERS.map((_, i) => {
      const y = bandY(i) + BAND.h / 2;
      return (
        `<line x1="${SPINE.x + SPINE.w}" y1="${y}" x2="${BAND.x}" y2="${y}"` +
        ` stroke="${C.orange}" stroke-width="1.3" opacity="0.75"` +
        ` class="${draw(Math.ceil(BAND.x - SPINE.x - SPINE.w), SPINE_AT + 1.2 + i * 0.12, ENDS, { dur: 0.4 })}"/>`
      );
    }),
  );
}

/* ------------------------------------------------------------------ *
 * The closing line
 * ------------------------------------------------------------------ */
const CLOSING_Y = BOTTOM + BAND.h + 44;
{
  const label = 'Security is not the fourth step. It runs through all five, from the beginning.';
  const w = 640;
  const x = (W - w) / 2;
  body.push(
    `<g class="${fade(SPINE_AT + 2.2, ENDS, { rise: 6 })}">` +
      `<rect x="${x}" y="${CLOSING_Y - 22}" width="${w}" height="32" rx="16" fill="${C.panel}"` +
      ` stroke="${C.orange}" stroke-width="1.2"/>` +
      t(W / 2, CLOSING_Y, label, { size: 12.5, anchor: 'middle', fill: C.text }) +
      `</g>`,
  );
}

const FOOTER_Y = CLOSING_Y + 38;
body.push(
  t(
    W / 2,
    FOOTER_Y,
    'a technically impressive agent without a business case is still a poor investment',
    { size: 10.5, anchor: 'middle', fill: C.faint, ls: 0.4 },
  ),
);

const H = FOOTER_Y + 18;

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const svg = assemble({
  width: W,
  height: H,
  title: 'Five layers from proof of concept to production',
  desc:
    'An animated diagram of five layers to work through before an AI agent goes from a ' +
    'proof of concept to something people depend on. They build from the bottom up: the ' +
    'business case, the workflow, access, governance and security, and measurement — each ' +
    'answered by the one beneath it. A band is then drawn up through all five, labelled ' +
    'governance and security, with connectors into every layer, to make the point that ' +
    'security is not the fourth step but runs through all of them from the beginning.',
  defs: hatchPatterns(),
  css,
  still,
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${tl.count} animated elements, ${CYCLE}s loop`);
console.log(`  ${LAYERS.length} layers, spine at ${SPINE_AT.toFixed(1)}s of ${DESIGN}, ${W}x${H}`);
