#!/usr/bin/env node
/**
 * Generates `assets/build-flow.svg`, the banner for the wiki's Build Flow page.
 *
 * It walks the six stages — discover, grill, spec, implement, evals, demo
 * rehearsal — and for each one states the failure it prevents, the artefact it
 * leaves behind on disk, and the signal that it actually worked. The artefacts
 * accumulate along the bottom, so the last frame answers the only question that
 * matters on demo day: what have you actually got?
 *
 * Generated rather than hand-written for the same reason as the banner: it is
 * one looping CSS timeline, and hand-computed keyframe percentages rot the
 * first time anyone changes a duration. Run `npm run build:flow`.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEMO_DATE } from '../src/constants.mjs';
import { COVERAGE_GATE } from '../src/payload.mjs';
import {
  C,
  CHAR_RATIO,
  CYCLE,
  STROKE,
  assemble,
  charBudget,
  fitSize,
  hatchPatterns,
  text as t,
  timeline,
  wrap,
} from './lib/svg.mjs';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'build-flow.svg',
);

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ *
 * The colours warm from blue to orange across the six stages: discovery is
 * cheap and cool, demo day is hot. Red is reserved for what each stage costs
 * you if you skip it, which is why it only ever appears on the "stops" line.
 */
const STAGES = [
  {
    name: 'discover',
    kind: 'blue',
    skill: '$discover-with-firecrawl',
    stops: 'a flawless implementation of a false assumption',
    produces: 'references/evidence.md',
    ledger: 'every load-bearing claim, with a URL and a date',
    right: 'at least one of your assumptions dies',
  },
  {
    name: 'grill',
    kind: 'blue',
    skill: '$grill-with-docs',
    stops: 'you, your team and the agent meaning different things',
    produces: 'GLOSSARY.md  ·  docs/adr/',
    ledger: 'one shared vocabulary, and the hard decisions written down',
    right: 'the glossary changes during the session, term by term',
  },
  {
    name: 'spec',
    kind: 'green',
    skill: '$to-spec',
    stops: 'the plan evaporating at the next /clear or compaction',
    produces: 'docs/spec/*.md',
    ledger: 'acceptance criteria a test could check',
    right: 'every criterion names a number or an observable fact',
  },
  {
    name: 'implement',
    kind: 'green',
    skill: '$implement-with-tests',
    stops: '"it worked when I tried it"',
    produces: `working code  ·  ${COVERAGE_GATE}% coverage gate`,
    ledger: `a suite that still passes in week eleven`,
    right: 'you watched each test fail before you made it pass',
  },
  {
    name: 'evals',
    kind: 'orange',
    skill: '$build-evals',
    stops: 'demoing one lucky run and calling it a success rate',
    produces: 'an eval set, a grader, a number',
    ledger: 'an answer to "how do you know it works?"',
    right: 'you can state a number instead of "it seems good"',
  },
  {
    name: 'demo rehearsal',
    kind: 'orange',
    skill: '$demo-rehearsal',
    stops: 'the failure that only happens in front of the audience',
    produces: 'docs/demo-script.md  ·  docs/demo-qa.md',
    ledger: 'a rehearsed recovery for every failure',
    right: 'it ran from a clean checkout on a different machine',
  },
];

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ *
 * Authored against DESIGN seconds and played back over CYCLE, so the six
 * stages share the loop evenly however long it runs. The last stretch holds the
 * finished picture, which is also the reduced-motion still frame.
 */
// Authored length, in design seconds. Deliberately NOT tied to CYCLE: CYCLE is
// how long the loop takes to play, DESIGN is how long the story is. Setting one
// from the other means changing the playback length silently rescales where
// ENDS falls, and the back of the loop plays as empty canvas.
const DESIGN = 35;
const ENDS = 33.4;

const T0 = 1.8;            // first stage opens
const STEP = 4.9;          // seconds per stage
const DWELL = 4.6;         // how long a stage's panel stays up
const at = (i) => T0 + i * STEP;
const LAST = at(STAGES.length - 1);

const tl = timeline({ design: DESIGN, ends: ENDS });
const { css, still, fade, draw, pulse } = tl;
const body = [];

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
const W = 1000;

const PILL_W = 126;
const PILL_H = 54;
const PILL_Y = 158;
const STEP_X = 162.8;
const X0 = 30;
const px = (i) => X0 + i * STEP_X;
const cx = (i) => px(i) + PILL_W / 2;
const RAIL_Y = PILL_Y + PILL_H / 2;

const PANEL = { x: 30, y: 252, w: 940, h: 152 };
/**
 * Card text, measured before anything is laid out.
 *
 * The budgets come from the card's real inner width and the rendered size is
 * clamped to it, because an artefact name is a single unbreakable word to a
 * wrapper — `references/evidence.md` hung out of its card on the published
 * diagram until this existed. The card's height then follows from the lines,
 * so fixing the horizontal overflow cannot quietly create a vertical one.
 */
const CARD_PAD = { left: 11, right: 6 };
const CARD_TEXT_W = PILL_W - CARD_PAD.left - CARD_PAD.right;
const NAME_SIZE = 9.6;
const SUB_SIZE = 8.8;
const NAME_STEP = 11.5;
const SUB_STEP = 10.5;

const ledger = STAGES.map((s) => {
  const lines = s.produces
    .split('·')
    .flatMap((part) => wrap(part.trim(), charBudget(CARD_TEXT_W, NAME_SIZE)));
  const sub = wrap(s.ledger, charBudget(CARD_TEXT_W, SUB_SIZE, CHAR_RATIO.regular));
  return {
    lines,
    sub,
    nameSize: Number(fitSize(lines, CARD_TEXT_W, NAME_SIZE).toFixed(2)),
    subSize: Number(fitSize(sub, CARD_TEXT_W, SUB_SIZE, { ratio: CHAR_RATIO.regular }).toFixed(2)),
    // Baseline of the last line, plus room for its descender.
    bottom: 20 + lines.length * NAME_STEP + (sub.length - 1) * SUB_STEP + 4,
  };
});

const CARD = { y: 450, h: Math.ceil(Math.max(...ledger.map((c) => c.bottom)) + 6) };

// Everything below the cards hangs off their height, so a longer artefact name
// moves the footer rather than being drawn over it.
const RULE_Y = CARD.y + CARD.h + 18;
const FOOTER_Y = RULE_Y + 52;
const H = FOOTER_Y + 12;

/** Refuse to emit a diagram whose text does not fit its box. */
for (const [i, card] of ledger.entries()) {
  for (const [line, size, ratio] of [
    ...card.lines.map((l) => [l, card.nameSize, CHAR_RATIO.bold]),
    ...card.sub.map((l) => [l, card.subSize, CHAR_RATIO.regular]),
  ]) {
    const width = line.length * size * ratio;
    if (width > CARD_TEXT_W + 0.5) {
      throw new Error(
        `build-flow: "${line}" is ~${width.toFixed(0)}px wide in a ${CARD_TEXT_W}px card ` +
          `(stage ${i + 1}, ${STAGES[i].name})`,
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * Header — unanimated, so a static render still reads.
 * ------------------------------------------------------------------ */
body.push(
  t(36, 46, 'The Build Flow', { size: 25, weight: 700, fill: C.white }),
  t(
    36,
    70,
    'Six stages. Each one prevents one specific, expensive failure — and makes the next one cheaper.',
    { size: 12.5, fill: C.muted },
  ),
  t(964, 46, `${STAGES.length} stages`, { size: 12, fill: C.muted, anchor: 'end', ls: 0.6 }),
  t(964, 70, `demo day: ${DEMO_DATE}`, { size: 12, fill: C.muted, anchor: 'end' }),
);

/* ------------------------------------------------------------------ *
 * The rail, drawn one segment per stage so the line advances with you.
 * ------------------------------------------------------------------ */
STAGES.forEach((_, i) => {
  if (i === 0) return;
  const from = px(i - 1) + PILL_W;
  const to = px(i);
  const len = Math.ceil(to - from);
  body.push(
    `<g class="${fade(at(i) - 0.6, ENDS)}">` +
      `<line x1="${from + 3}" y1="${RAIL_Y}" x2="${to - 10}" y2="${RAIL_Y}"` +
      ` stroke="${C.muted}" stroke-width="1.6" class="${draw(len, at(i) - 0.6, ENDS, { dur: 0.5 })}"/>` +
      `<polygon points="${to - 2},${RAIL_Y} ${to - 11},${RAIL_Y - 5} ${to - 11},${RAIL_Y + 5}"` +
      ` fill="${C.muted}"/>` +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The six stations. A dim pill is present from the start so the shape of the
 * journey is visible immediately; a bright copy fades in on top when the stage
 * opens and stays lit, so progress reads at a glance.
 * ------------------------------------------------------------------ */
const station = (i, cls, opacity) => {
  const s = STAGES[i];
  const x = px(i);
  return (
    `<g class="${cls}"${opacity === 1 ? '' : ` opacity="${opacity}"`}>` +
    `<rect x="${x}" y="${PILL_Y}" width="${PILL_W}" height="${PILL_H}" rx="9"` +
    ` fill="url(#hatch-${s.kind})" stroke="${STROKE[s.kind]}" stroke-width="1.7"/>` +
    t(cx(i), PILL_Y + 33, s.name, { size: 13, anchor: 'middle', fill: C.text, weight: 600 }) +
    `</g>`
  );
};

STAGES.forEach((s, i) => {
  body.push(
    t(cx(i), PILL_Y - 10, `stage ${String(i + 1).padStart(2, '0')}`, {
      size: 9,
      anchor: 'middle',
      fill: C.muted,
      ls: 0.7,
      cls: fade(0.6, ENDS),
    }),
    station(i, fade(0.9, ENDS, { hold: 0.55 }), 1),
    station(i, fade(at(i), ENDS), 1),
    // A ring that beats only while this stage is the one being talked about.
    `<rect x="${px(i) - 4}" y="${PILL_Y - 4}" width="${PILL_W + 8}" height="${PILL_H + 8}" rx="12"` +
      ` fill="none" stroke="${STROKE[s.kind]}" class="${pulse(at(i), at(i) + DWELL)}"/>`,
  );
});

/* ------------------------------------------------------------------ *
 * "Going backwards is fine" — an arc from implement back to spec, during the
 * stage where that discovery actually happens.
 * ------------------------------------------------------------------ */
{
  // Offset from the pill centres so the arc and its head clear the centred
  // "stage NN" captions sitting directly above each station.
  const a = px(3) + 26;
  const b = px(2) + PILL_W - 26;
  const arc = `M ${a} ${PILL_Y - 2} C ${a} ${PILL_Y - 38}, ${b} ${PILL_Y - 38}, ${b} ${PILL_Y - 2}`;
  const len = Math.ceil(Math.abs(a - b) + 80);
  const tIn = at(3) + 1.6;
  body.push(
    `<g class="${fade(tIn, at(4) + 0.4)}">` +
      `<path d="${arc}" fill="none" stroke="${C.orange}" stroke-width="1.5"` +
      ` class="${draw(len, tIn, at(4) + 0.4, { dur: 0.9 })}"/>` +
      `<polygon points="${b},${PILL_Y + 1} ${b - 4},${PILL_Y - 7} ${b + 4},${PILL_Y - 7}"` +
      ` fill="${C.orange}"/>` +
      t((a + b) / 2, PILL_Y - 46, 'finding this out here sends you back — that is the process working', {
        size: 10.5,
        anchor: 'middle',
        fill: C.orange,
      }) +
      `</g>`,
  );
}

/* ------------------------------------------------------------------ *
 * The detail panel. One fixed region, six overlapping cards, plus a connector
 * down from whichever station is speaking.
 * ------------------------------------------------------------------ */
STAGES.forEach((s, i) => {
  const tIn = at(i);
  const tOut = i === STAGES.length - 1 ? ENDS : tIn + DWELL;
  const drop = PANEL.y - (PILL_Y + PILL_H);

  body.push(
    `<g class="${fade(tIn, tOut)}">` +
      `<line x1="${cx(i)}" y1="${PILL_Y + PILL_H}" x2="${cx(i)}" y2="${PANEL.y}"` +
      ` stroke="${STROKE[s.kind]}" stroke-width="1.4" opacity="0.8"` +
      ` class="${draw(Math.ceil(drop), tIn, tOut, { dur: 0.4 })}"/>` +
      `</g>`,
  );

  const skillW = Math.round(14 + 7.1 * s.skill.length);
  const skillX = PANEL.x + PANEL.w - 24 - skillW;
  const rows = [
    ['stops', s.stops, C.red],
    ['produces', s.produces, C.green],
    ['right when', s.right, C.muted],
  ];

  body.push(
    `<g class="${fade(tIn, tOut, { rise: 7 })}">` +
      `<rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="11"` +
      ` fill="${C.panel}" stroke="${STROKE[s.kind]}" stroke-width="1.3"/>` +
      `<rect x="${PANEL.x + 1}" y="${PANEL.y + 12}" width="4.5" height="${PANEL.h - 24}" rx="2.3"` +
      ` fill="${STROKE[s.kind]}"/>` +
      t(PANEL.x + 24, PANEL.y + 38, s.name, { size: 20, weight: 700, fill: STROKE[s.kind] }) +
      `<rect x="${skillX}" y="${PANEL.y + 18}" width="${skillW}" height="27" rx="7"` +
      ` fill="url(#hatch-${s.kind})" stroke="${STROKE[s.kind]}" stroke-width="1.3"/>` +
      t(skillX + skillW / 2, PANEL.y + 36, s.skill, {
        size: 12.5,
        anchor: 'middle',
        fill: C.text,
      }) +
      rows
        .map(([label, value, fill], r) => {
          const y = PANEL.y + 78 + r * 30;
          return (
            t(PANEL.x + 142, y, label, { size: 9.5, anchor: 'end', fill, ls: 0.7 }) +
            t(PANEL.x + 156, y, value, { size: 13, fill: C.text })
          );
        })
        .join('') +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The ledger. Each stage's artefact lands mid-stage and never leaves, so the
 * closing frame is the inventory you can actually point at on demo day.
 * ------------------------------------------------------------------ */
body.push(
  `<g class="${fade(at(0) + 2.2, ENDS)}">` +
    `<line x1="310" y1="434" x2="970" y2="434" stroke="${C.track}" stroke-width="1.2"/>` +
    t(30, 438, 'WHAT YOU HAVE ON DEMO DAY', { size: 10.5, fill: C.muted, ls: 1.1 }) +
    `</g>`,
);

// Text budgets come from the card's real inner width, and the rendered size is
// then clamped to it. An artefact name is one unbreakable word to a wrapper —
// `references/evidence.md` hung out of its card on the published diagram until
// both of these existed.
STAGES.forEach((s, i) => {
  const x = px(i);
  const card = ledger[i];
  body.push(
    `<g class="${fade(at(i) + 2.2, ENDS, { rise: 9 })}">` +
      `<rect x="${x}" y="${CARD.y}" width="${PILL_W}" height="${CARD.h}" rx="8"` +
      ` fill="${C.panelAlt}" stroke="${STROKE[s.kind]}" stroke-width="1.2"/>` +
      `<rect x="${x + 1}" y="${CARD.y + 8}" width="3.5" height="${CARD.h - 16}" rx="1.8"` +
      ` fill="${STROKE[s.kind]}"/>` +
      card.lines
        .map((l, n) =>
          t(x + CARD_PAD.left, CARD.y + 17 + n * NAME_STEP, l, {
            size: card.nameSize,
            fill: C.white,
            weight: 600,
          }),
        )
        .join('') +
      card.sub
        .map((l, n) =>
          t(x + CARD_PAD.left, CARD.y + 20 + card.lines.length * NAME_STEP + n * SUB_STEP, l, {
            size: card.subSize,
            fill: C.muted,
          }),
        )
        .join('') +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The rule that spans every stage.
 * ------------------------------------------------------------------ */
{
  const label = 'Verify before you assert — and mark what you could not verify.';
  const w = 430;
  const x = (W - w) / 2;
  body.push(
    `<g class="${fade(LAST + 2.0, ENDS, { rise: 6 })}">` +
      `<rect x="${x}" y="${RULE_Y}" width="${w}" height="30" rx="15" fill="${C.panel}"` +
      ` stroke="${C.blue}" stroke-width="1.2"/>` +
      t(W / 2, RULE_Y + 20, label, { size: 12, anchor: 'middle', fill: C.text }) +
      `</g>`,
  );
}

body.push(
  t(
    W / 2,
    FOOTER_Y,
    '/gregorys-awesome-teams works out which stage you are on   ·   going backwards is fine   ·   skipping evals is not',
    { size: 10.5, anchor: 'middle', fill: C.faint, ls: 0.4 },
  ),
);

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const svg = assemble({
  width: W,
  height: H,
  title: 'The build flow — discover, grill, spec, implement, evals, demo rehearsal',
  desc:
    'An animated diagram of the six build stages. Each stage lights up in turn and ' +
    'shows the skill that runs it, the failure it prevents, the file it leaves behind ' +
    'and the signal that it worked: discover produces references/evidence.md, grill ' +
    'produces GLOSSARY.md and ADRs, spec produces acceptance criteria, implement ' +
    `carries them to a ${COVERAGE_GATE} percent coverage gate, evals replaces ` +
    '"it seems good" with a number, and demo rehearsal proves it runs from a clean ' +
    'checkout on another machine. An arc from implement back to spec shows that going ' +
    'backwards is the process working. The artefacts accumulate along the bottom as an ' +
    'inventory for demo day, under the rule that spans every stage: verify before you ' +
    'assert, and mark what you could not verify.',
  defs: hatchPatterns(),
  css,
  still,
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${tl.count} animated elements, ${CYCLE}s loop`);
console.log(
  `  ${STAGES.length} stages, ${STEP}s each in design time` +
    ` (${((STEP * CYCLE) / DESIGN).toFixed(1)}s on screen), last opens at ${LAST}s, ends ${ENDS}s of ${DESIGN}`,
);
