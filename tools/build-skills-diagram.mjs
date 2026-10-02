#!/usr/bin/env node
/**
 * Generates `assets/skills.svg`, the banner for the wiki's Skills Reference.
 *
 * The page's claim is that having nine skills "costs almost nothing", and this
 * is the arithmetic behind it: only each skill's one-line description sits in
 * context, and the body loads when the skill actually runs. The diagram shows
 * the nine descriptions as a sliver, one loaded body beside it, and what the
 * same nine skills would cost if every body were always resident.
 *
 * Every number is measured from `payload/skills/` at build time, so the
 * diagram cannot drift from the skills it describes. Tokens are estimated as
 * characters ÷ 4, which the diagram says on its face.
 *
 * Run `npm run build:skills`.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { payloadRoot, readSkills } from '../src/payload.mjs';
import {
  C,
  CYCLE,
  STROKE,
  assemble,
  hatchPatterns,
  text as t,
  timeline,
  wrap,
} from './lib/svg.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'skills.svg');

/* ------------------------------------------------------------------ *
 * Measurements, taken from the payload
 * ------------------------------------------------------------------ */
/** Characters ÷ 4 — the usual rough estimate, and labelled as one on the diagram. */
const tok = (s) => Math.round(s.length / 4);

const skills = await readSkills();
const byName = new Map(skills.map((s) => [s.name, s]));
const RULE_COUNT = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
  f.endsWith('.md'),
).length;

/** The six stages of the build flow, in order, then the three you reach for. */
const CHAIN = [
  ['discover-with-firecrawl', 'blue'],
  ['grill-with-docs', 'blue'],
  ['to-spec', 'green'],
  ['implement-with-tests', 'green'],
  ['build-evals', 'orange'],
  ['demo-rehearsal', 'orange'],
];
const SITUATIONAL = ['wizard', 'rag-architecture', 'harness-tuning'];

/**
 * The chain warms from blue to orange across the six stages, matching the build
 * flow diagram. The three situational skills are blue: in the banner's palette
 * blue is the standing machinery that is simply there, which is what they are.
 */
const SITUATIONAL_KIND = 'blue';

const order = [...CHAIN.map(([n]) => n), ...SITUATIONAL];
const missing = order.filter((n) => !byName.has(n));
if (missing.length || order.length !== skills.length) {
  // A skill added to the payload but not listed here would silently vanish from
  // a diagram whose whole subject is how many skills there are.
  throw new Error(
    `skills diagram is out of step with the payload: ${
      missing.length ? `unknown ${missing.join(', ')}` : ''
    }${order.length !== skills.length ? ` (${order.length} listed, ${skills.length} in payload)` : ''}`,
  );
}

const CARDS = order.map((name, i) => {
  const s = byName.get(name);
  return {
    name,
    kind: i < CHAIN.length ? CHAIN[i][1] : SITUATIONAL_KIND,
    chain: i < CHAIN.length,
    // The first sentence is the part a human reads; the rest is the "use when"
    // clause that tells Bob when to reach for it.
    summary: `${s.description.split('. ')[0].replace(/\.$/, '')}.`,
    desc: tok(s.description),
    bodyTokens: tok(s.source),
  };
});

const DESC_TOTAL = CARDS.reduce((n, c) => n + c.desc, 0);
const BODY_TOTAL = CARDS.reduce((n, c) => n + c.bodyTokens, 0);
const RATIO = BODY_TOTAL / DESC_TOTAL;

/**
 * Bob's own cost before anything of yours is loaded: system prompt, mode
 * description, AGENTS.md and the always-on rules, and the MCP tool definitions.
 * Measured for a bare turn and used by the README banner too.
 */
const BASELINE = 1500 + 1200 + 830 + 5100 + 600;
const HERO = byName.has('build-evals') ? CARDS.find((c) => c.name === 'build-evals') : CARDS[0];

const PAID = BASELINE + DESC_TOTAL;
const PAID_LOADED = PAID + HERO.bodyTokens;
const EAGER = BASELINE + BODY_TOTAL;

const num = (n) => n.toLocaleString('en-US');

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ *
 * Four acts: the shelf fills, the bill arrives, one body loads, and then the
 * counterfactual. Authored against DESIGN seconds and played back over CYCLE,
 * so the whole thing stretches evenly when the loop length changes.
 */
// Authored length, in design seconds. Deliberately NOT tied to CYCLE: CYCLE is
// how long the loop takes to play, DESIGN is how long the story is. Setting one
// from the other means changing the playback length silently rescales where
// ENDS falls, and the back of the loop plays as empty canvas.
const DESIGN = 35;
const ENDS = 33.4;

const CARD_T0 = 1.0;
const CARD_STEP = 1.05;
const cardAt = (i) => CARD_T0 + i * CARD_STEP;
const ACT2 = 12.4; // the bill you actually pay
const ACT3 = 19.9; // one body loads
const ACT4 = 25.9; // what always-loading would have cost
const CLOSE = 31.0;

const tl = timeline({ design: DESIGN, ends: ENDS });
const { css, still, fade, draw, pulse } = tl;
const body = [];

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
const W = 1000;
const H = 856;

const CARD = { w: 300, h: 104, stepX: 320, x0: 32 };
const ROW_Y = [116, 230, 370];
const cardX = (i) => CARD.x0 + (i % 3) * CARD.stepX;
const cardY = (i) => (i < 3 ? ROW_Y[0] : i < 6 ? ROW_Y[1] : ROW_Y[2]);

const BAR = { x: 32, w: 940, h: 52, aY: 590, bY: 714 };
const SCALE = BAR.w / EAGER; // the widest bar fills the canvas

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */
body.push(
  t(36, 46, `${CARDS.length} skills, one line each`, { size: 25, weight: 700, fill: C.white }),
  t(
    36,
    70,
    'Only the description sits in context. The body loads on demand.',
    { size: 12.5, fill: C.muted },
  ),
);

// A readout that counts up as the shelf fills, so the running cost is visible
// the whole time rather than asserted at the end.
CARDS.forEach((_, i) => {
  const n = i + 1;
  const sum = CARDS.slice(0, n).reduce((a, c) => a + c.desc, 0);
  const tOut = i === CARDS.length - 1 ? ENDS : cardAt(i + 1);
  body.push(
    t(964, 46, `${n} skill${n === 1 ? '' : 's'}`, {
      size: 13,
      anchor: 'end',
      fill: C.green,
      weight: 600,
      cls: fade(cardAt(i), tOut, { cut: true }),
    }),
    t(964, 70, `≈ ${num(sum)} tokens of description in context`, {
      size: 11.5,
      anchor: 'end',
      fill: C.muted,
      cls: fade(cardAt(i), tOut, { cut: true }),
    }),
  );
});

/* ------------------------------------------------------------------ *
 * The shelf
 * ------------------------------------------------------------------ */
body.push(
  t(32, 104, 'THE MAIN CHAIN — the six stages, in order', {
    size: 10.5,
    fill: C.muted,
    ls: 1.1,
    cls: fade(0.6, ENDS),
  }),
  t(32, 358, 'WHEN THEY APPLY — and only then', {
    size: 10.5,
    fill: C.muted,
    ls: 1.1,
    cls: fade(cardAt(CHAIN.length) - 0.3, ENDS),
  }),
);

CARDS.forEach((c, i) => {
  const x = cardX(i);
  const y = cardY(i);
  const accent = STROKE[c.kind];
  const lines = wrap(c.summary, 49).slice(0, 4);
  body.push(
    `<g class="${fade(cardAt(i), ENDS, { rise: 10 })}">` +
      `<rect x="${x}" y="${y}" width="${CARD.w}" height="${CARD.h}" rx="9"` +
      ` fill="url(#hatch-${c.kind})" stroke="${accent}"` +
      ` stroke-width="${c.chain ? 1.6 : 1.2}"${c.chain ? '' : ' stroke-dasharray="5 3"'}/>` +
      t(x + 14, y + 24, `$${c.name}`, { size: 12.5, weight: 600, fill: C.white }) +
      lines
        .map((l, n) => t(x + 14, y + 44 + n * 12.5, l, { size: 10, fill: C.text, op: 0.92 }))
        .join('') +
      t(x + CARD.w - 12, y + CARD.h - 11, `description ≈ ${c.desc}  ·  body ≈ ${num(c.bodyTokens)}`, {
        size: 8.8,
        anchor: 'end',
        fill: C.faint,
      }) +
      `</g>`,
  );
});

// The hero card keeps beating while its body is the one being loaded.
{
  const i = CARDS.indexOf(HERO);
  body.push(
    `<rect x="${cardX(i) - 4}" y="${cardY(i) - 4}" width="${CARD.w + 8}" height="${CARD.h + 8}"` +
      ` rx="12" fill="none" stroke="${C.orange}" class="${pulse(ACT3, ACT4 + 1.2)}"/>`,
  );
}

/* ------------------------------------------------------------------ *
 * The arithmetic
 * ------------------------------------------------------------------ */
body.push(
  `<g class="${fade(ACT2 - 0.5, ENDS)}">` +
    `<line x1="32" y1="502" x2="972" y2="502" stroke="${C.track}" stroke-width="1.2"/>` +
    t(32, 528, 'What that actually costs, in the context window', {
      size: 16,
      weight: 700,
      fill: C.white,
    }) +
    t(
      32,
      549,
      'Tokens are characters ÷ 4. Both bars are a few percent of Bob’s 270,000-token window — but you pay them on every single turn.',
      { size: 11.5, fill: C.muted },
    ) +
    `</g>`,
);

/**
 * One segment of a stacked bar.
 *
 * The fill is wiped on left to right by a thick stroked line, because a rect
 * cannot be grown without a clip path and GitHub's SVG sanitiser is not worth
 * arguing with. The outline follows a beat later so the segment lands rather
 * than smears.
 */
function segment({ x, y, tokens, kind, tIn, tOut = ENDS, label, sub, inside = true, dur = 1.2 }) {
  const w = tokens * SCALE;
  const cy = y + BAR.h / 2;
  const out = [
    `<line x1="${x.toFixed(1)}" y1="${cy}" x2="${(x + w).toFixed(1)}" y2="${cy}"` +
      ` stroke="url(#hatch-${kind})" stroke-width="${BAR.h}"` +
      ` class="${draw(Math.ceil(w), tIn, tOut, { dur })}"/>`,
    `<g class="${fade(tIn + dur * 0.6, tOut)}">` +
      `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${BAR.h}" rx="5"` +
      ` fill="none" stroke="${STROKE[kind]}" stroke-width="1.6"/>` +
      (inside
        ? t(x + w / 2, cy - 2, label, { size: 11.5, anchor: 'middle', fill: C.text, weight: 600 }) +
          t(x + w / 2, cy + 14, sub, { size: 10, anchor: 'middle', fill: C.muted })
        : '') +
      `</g>`,
  ];
  return { w, svg: out.join('') };
}

/* ---- bar A: what you actually pay ---- */
body.push(
  t(32, 582, 'WHAT YOU PAY', {
    size: 10.5,
    fill: C.green,
    ls: 1.1,
    cls: fade(ACT2, ENDS),
  }),
);

const baseA = segment({
  x: BAR.x,
  y: BAR.aY,
  tokens: BASELINE,
  kind: 'blue',
  tIn: ACT2,
  label: 'Bob’s own baseline',
  sub: `system prompt, modes, AGENTS.md, ${RULE_COUNT} rules, MCP tools  ·  ≈ ${num(BASELINE)}`,
});
body.push(baseA.svg);

const descX = BAR.x + baseA.w;
const descSeg = segment({
  x: descX,
  y: BAR.aY,
  tokens: DESC_TOTAL,
  kind: 'green',
  tIn: ACT2 + 1.3,
  inside: false,
  dur: 0.5,
});
body.push(descSeg.svg);

// The sliver is the whole point, so it gets a leader and a line of its own.
{
  const lx = descX + descSeg.w / 2;
  body.push(
    `<g class="${fade(ACT2 + 2.0, ENDS)}">` +
      `<line x1="${lx.toFixed(1)}" y1="${BAR.aY + BAR.h}" x2="${lx.toFixed(1)}" y2="${BAR.aY + BAR.h + 16}"` +
      ` stroke="${C.green}" stroke-width="1.3"/>` +
      t(lx + 10, BAR.aY + BAR.h + 22, `all ${CARDS.length} descriptions  ·  ≈ ${num(DESC_TOTAL)} tokens`, {
        size: 12,
        fill: C.green,
        weight: 600,
      }) +
      t(
        lx + 10,
        BAR.aY + BAR.h + 38,
        'that sliver is the entire cost of having nine skills available',
        { size: 10.5, fill: C.muted },
      ) +
      `</g>`,
    `<rect x="${(descX - 2).toFixed(1)}" y="${BAR.aY - 2}" width="${(descSeg.w + 4).toFixed(1)}"` +
      ` height="${BAR.h + 4}" rx="6" fill="none" stroke="${C.green}"` +
      ` class="${pulse(ACT2 + 2.0, ACT3)}"/>`,
  );
}

/* ---- act 3: one body loads ---- */
const heroX = descX + descSeg.w;
const heroSeg = segment({
  x: heroX,
  y: BAR.aY,
  tokens: HERO.bodyTokens,
  kind: 'orange',
  tIn: ACT3,
  inside: false,
  dur: 0.6,
});
body.push(
  heroSeg.svg,
  `<g class="${fade(ACT3 + 0.4, ENDS)}">` +
    t(heroX + 4, 582, `↓  $${HERO.name} body  ·  ≈ ${num(HERO.bodyTokens)}, only while it runs`, {
      size: 10.5,
      fill: C.orange,
    }) +
    `</g>`,
);

// The running total swaps rather than crossfades, or both numbers show at once.
body.push(
  t(964, 582, `≈ ${num(PAID)} tokens a turn`, {
    size: 11.5,
    anchor: 'end',
    fill: C.text,
    cls: fade(ACT2 + 1.8, ACT3, { cut: true }),
  }),
  t(964, 582, `≈ ${num(PAID_LOADED)} tokens a turn`, {
    size: 11.5,
    anchor: 'end',
    fill: C.text,
    cls: fade(ACT3 + 0.6, ENDS, { cut: true }),
  }),
);

/* ---- bar B: the counterfactual ---- */
body.push(
  t(32, 706, 'IF EVERY BODY WERE ALWAYS LOADED', {
    size: 10.5,
    fill: C.red,
    ls: 1.1,
    cls: fade(ACT4, ENDS),
  }),
  t(964, 706, `≈ ${num(EAGER)} tokens a turn`, {
    size: 11.5,
    anchor: 'end',
    fill: C.red,
    cls: fade(ACT4 + 1.4, ENDS),
  }),
);

const baseB = segment({
  x: BAR.x,
  y: BAR.bY,
  tokens: BASELINE,
  kind: 'blue',
  tIn: ACT4,
  label: 'Bob’s own baseline',
  sub: `unchanged  ·  ≈ ${num(BASELINE)}`,
  dur: 0.7,
});
body.push(baseB.svg);

const eagerSeg = segment({
  x: BAR.x + baseB.w,
  y: BAR.bY,
  tokens: BODY_TOTAL,
  kind: 'red',
  tIn: ACT4 + 0.7,
  label: `all ${CARDS.length} skill bodies, every turn`,
  sub: `≈ ${num(BODY_TOTAL)} tokens  ·  ${RATIO.toFixed(0)}× the descriptions`,
  dur: 1.3,
});
body.push(eagerSeg.svg);

/* ---- the closing line ---- */
body.push(
  `<g class="${fade(CLOSE, ENDS, { rise: 6 })}">` +
    t(
      32,
      802,
      `Same nine skills. ${RATIO.toFixed(0)}× the context, spent on instructions you are not using — and context you spend is context compaction will take.`,
      { size: 12.5, fill: C.text },
    ) +
    `</g>`,
  t(
    W / 2,
    834,
    `type $ in Bob to pick one   ·   the ${RULE_COUNT} rules in .bob/rules/ are the opposite: tiny on purpose, because they do load every turn`,
    { size: 10.5, anchor: 'middle', fill: C.faint, ls: 0.4 },
  ),
);

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const svg = assemble({
  width: W,
  height: H,
  title: `${CARDS.length} skills, one line each — why having nine costs almost nothing`,
  desc:
    `An animated diagram of the kit's ${CARDS.length} Bob skills. The six main-chain skills and the ` +
    'three situational ones appear in turn as cards, each showing its one-line description ' +
    `and what its body would cost. A readout counts up to roughly ${num(DESC_TOTAL)} tokens: ` +
    'that is the entire standing cost of the descriptions. A stacked bar then shows what you ' +
    `actually pay in the context window — Bob's own baseline of about ${num(BASELINE)} tokens plus ` +
    `that sliver — and a second bar shows the counterfactual: if all ${CARDS.length} skill bodies ` +
    `were always loaded it would cost about ${num(BODY_TOTAL)} tokens instead, roughly ` +
    `${RATIO.toFixed(0)} times as much, every single turn, spent on instructions you are not using.`,
  defs: hatchPatterns(),
  css,
  still,
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${tl.count} animated elements, ${CYCLE}s loop`);
console.log(`  ${CARDS.length} skills  ·  descriptions ≈${DESC_TOTAL}  ·  bodies ≈${BODY_TOTAL}  ·  ${RATIO.toFixed(1)}x`);
console.log(`  bars: paid ≈${PAID} (+body ≈${PAID_LOADED})  ·  eager ≈${EAGER}`);
