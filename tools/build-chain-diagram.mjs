#!/usr/bin/env node
/**
 * Generates `assets/chain.svg`, the slim strip that sits under the Build Flow
 * banner where a plain code fence used to be.
 *
 * The big diagram answers "what does each stage do?". This one answers the
 * smaller question a student actually asks mid-build — "where am I, and what
 * comes next?" — so it stays one row, shows the chain whole at all times, and
 * walks a highlight along it with a single line of detail underneath.
 *
 * Run `npm run build:chain`.
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
  charBudget,
  hatchPatterns,
  text as t,
  timeline,
  wrap,
} from './lib/svg.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'chain.svg');

/* ------------------------------------------------------------------ *
 * Content — the same six stages, same colours as the Build Flow banner
 * ------------------------------------------------------------------ */
const STAGES = [
  ['discover', 'blue', '$discover-with-firecrawl', 'check the idea against the real world'],
  ['grill', 'blue', '$grill-with-docs', 'get interviewed until the plan is sharp'],
  ['spec', 'green', '$to-spec', 'write down what "done" means'],
  ['implement', 'green', '$implement-with-tests', 'build it test-first, one criterion at a time'],
  ['evals', 'orange', '$build-evals', 'measure the AI part instead of hoping'],
  ['demo rehearsal', 'orange', '$demo-rehearsal', 'break it on purpose before the audience does'],
];

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ */
// Authored length, in design seconds. Deliberately NOT tied to CYCLE: CYCLE is
// how long the loop takes to play, DESIGN is how long the story is.
const DESIGN = 35;
const ENDS = 33.6;

const T0 = 1.2;
const STEP = (ENDS - T0 - 2.0) / STAGES.length;
const at = (i) => T0 + i * STEP;

const tl = timeline({ design: DESIGN, ends: ENDS });
const { css, still, fade, draw, pulse } = tl;
const body = [];

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
const W = 1000;
const H = 188;

const PILL = { w: 134, h: 44, y: 54 };
const X0 = 26;
const STEP_X = (W - X0 * 2 - PILL.w) / (STAGES.length - 1);
const px = (i) => X0 + i * STEP_X;
const cx = (i) => px(i) + PILL.w / 2;
const RAIL_Y = PILL.y + PILL.h / 2;

const CAPTION_Y = 136;
const CAPTION_W = 900;

/* ------------------------------------------------------------------ *
 * Header — unanimated, so a static render still reads
 * ------------------------------------------------------------------ */
body.push(
  t(26, 30, 'The chain, end to end', { size: 14, weight: 700, fill: C.white }),
  t(W - 26, 30, `${STAGES.length} stages  ·  going backwards is fine`, {
    size: 11,
    anchor: 'end',
    fill: C.muted,
  }),
);

/* ------------------------------------------------------------------ *
 * The rail. Each arrow draws as the chain advances, and stays.
 * ------------------------------------------------------------------ */
STAGES.forEach((_, i) => {
  if (i === 0) return;
  const from = px(i - 1) + PILL.w;
  const to = px(i);
  body.push(
    `<g class="${fade(at(i) - 0.5, ENDS)}">` +
      `<line x1="${(from + 3).toFixed(1)}" y1="${RAIL_Y}" x2="${(to - 10).toFixed(1)}" y2="${RAIL_Y}"` +
      ` stroke="${C.muted}" stroke-width="1.6"` +
      ` class="${draw(Math.ceil(to - from), at(i) - 0.5, ENDS, { dur: 0.4 })}"/>` +
      `<polygon points="${(to - 2).toFixed(1)},${RAIL_Y} ${(to - 11).toFixed(1)},${RAIL_Y - 5}` +
      ` ${(to - 11).toFixed(1)},${RAIL_Y + 5}" fill="${C.muted}"/>` +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The six stages. The whole chain is visible from the first frame — a student
 * checking "where am I" should never have to wait for the answer to appear.
 * ------------------------------------------------------------------ */
const pill = (i, cls, dim) => {
  const [name, kind] = STAGES[i];
  const x = px(i);
  return (
    `<g class="${cls}">` +
    `<rect x="${x.toFixed(1)}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h}" rx="8"` +
    ` fill="url(#hatch-${kind})" stroke="${STROKE[kind]}" stroke-width="${dim ? 1.4 : 1.7}"/>` +
    t(cx(i), PILL.y + 28, name, { size: 12.5, anchor: 'middle', fill: C.text, weight: 600 }) +
    `</g>`
  );
};

STAGES.forEach(([, kind], i) => {
  body.push(
    pill(i, fade(0.5, ENDS, { hold: 0.55 }), true),
    pill(i, fade(at(i), ENDS), false),
    `<rect x="${(px(i) - 4).toFixed(1)}" y="${PILL.y - 4}" width="${PILL.w + 8}"` +
      ` height="${PILL.h + 8}" rx="11" fill="none" stroke="${STROKE[kind]}"` +
      ` class="${pulse(at(i), at(i) + STEP)}"/>`,
  );
});

/* ------------------------------------------------------------------ *
 * One caption at a time, in a fixed place so the eye does not chase it.
 * ------------------------------------------------------------------ */
STAGES.forEach(([name, kind, skill, line], i) => {
  const tIn = at(i);
  const tOut = i === STAGES.length - 1 ? ENDS : tIn + STEP;
  // One line, always: the budget is generous and the strings are written to it.
  const [caption] = wrap(line, charBudget(CAPTION_W, 13, CHAR_RATIO.regular));
  body.push(
    `<g class="${fade(tIn, tOut)}">` +
      `<line x1="${cx(i).toFixed(1)}" y1="${PILL.y + PILL.h}" x2="${cx(i).toFixed(1)}" y2="${CAPTION_Y - 22}"` +
      ` stroke="${STROKE[kind]}" stroke-width="1.3" opacity="0.75"` +
      ` class="${draw(Math.ceil(CAPTION_Y - 22 - PILL.y - PILL.h), tIn, tOut, { dur: 0.3 })}"/>` +
      `</g>`,
    `<g class="${fade(tIn, tOut, { rise: 5 })}">` +
      t(W / 2, CAPTION_Y, caption, { size: 13, anchor: 'middle', fill: C.text }) +
      t(W / 2, CAPTION_Y + 19, skill, { size: 11.5, anchor: 'middle', fill: STROKE[kind] }) +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const svg = assemble({
  width: W,
  height: H,
  title: 'discover, grill, spec, implement, evals, demo rehearsal',
  desc:
    'An animated strip of the six build stages in order: discover, grill, spec, implement, ' +
    'evals and demo rehearsal. The whole chain is visible throughout; a highlight walks ' +
    'along it and, for each stage in turn, one line underneath says what that stage is for ' +
    'and which skill runs it — check the idea against the real world, get interviewed until ' +
    'the plan is sharp, write down what done means, build it test-first one criterion at a ' +
    'time, measure the AI part instead of hoping, and break it on purpose before the ' +
    'audience does.',
  defs: hatchPatterns(),
  css,
  still,
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${tl.count} animated elements, ${CYCLE}s loop`);
console.log(`  ${STAGES.length} stages, ${STEP.toFixed(2)}s each in design time of ${DESIGN}`);
