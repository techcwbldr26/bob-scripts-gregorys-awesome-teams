#!/usr/bin/env node
/**
 * Generates `assets/skills.svg`, the banner for the wiki's Skills Reference.
 *
 * The page's claim is that having this many skills "costs almost nothing", and
 * is the arithmetic behind it: only each skill's one-line description sits in
 * context, and the body loads when the skill actually runs. The diagram shows
 * the nine descriptions as a sliver, one loaded body beside it, and what the
 * the same skills would cost if every body were always resident.
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
const SITUATIONAL = [
  'improve-prompt',
  'wizard',
  'rag-architecture',
  'harness-tuning',
  'read-applicant-sources',
];

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

/**
 * Two grids, not one.
 *
 * The chain keeps three wide columns over two rows, because its six skills are
 * an ordered path and the rows read as halves of it. The situational skills get
 * a row of their own, as many columns as there are of them, so adding one does
 * not leave a ragged hole in a 3-wide grid. Card height is derived from the
 * longest card's text and the generator refuses to emit a card that overflows.
 */
const GRID = { x0: 32, right: 968, gap: 20 };
const CHAIN_COLS = 3;
const SITU_COLS = SITUATIONAL.length;
const span = GRID.right - GRID.x0;
const colW = (cols) => (span - (cols - 1) * GRID.gap) / cols;

const NAME_SIZE = 12.5;
const DESC_SIZE = 10;
const DESC_STEP = 12.5;
const PAD = { left: 14, right: 12 };

const layout = (i) => {
  const chain = i < CHAIN.length;
  const cols = chain ? CHAIN_COLS : SITU_COLS;
  const n = chain ? i : i - CHAIN.length;
  const w = colW(cols);
  return { chain, w, x: GRID.x0 + (n % cols) * (w + GRID.gap), row: chain ? Math.floor(n / cols) : 2 };
};

/** Wrap each card's summary to its own column width, then size to fit. */
const CARD_TEXT = CARDS.map((c, i) => {
  const { w } = layout(i);
  const inner = w - PAD.left - PAD.right;
  const lines = wrap(c.summary, charBudget(inner, DESC_SIZE, CHAR_RATIO.regular));
  return {
    inner,
    lines,
    size: Number(fitSize(lines, inner, DESC_SIZE, { ratio: CHAR_RATIO.regular }).toFixed(2)),
  };
});

// Each group gets its own height. A shared one would size every card to the
// tallest, which leaves the wide chain cards mostly empty.
const groupHeight = (from, to) =>
  Math.ceil(44 + Math.max(...CARD_TEXT.slice(from, to).map((c) => c.lines.length)) * DESC_STEP + 18);

const CARD = {
  chain: groupHeight(0, CHAIN.length),
  situational: groupHeight(CHAIN.length, CARDS.length),
};

const ROW_Y = [116, 116 + CARD.chain + 10, 0];
ROW_Y[2] = ROW_Y[1] + CARD.chain + 44;
const CARDS_BOTTOM = ROW_Y[2] + CARD.situational;

const cardX = (i) => layout(i).x;
const cardY = (i) => ROW_Y[layout(i).row];
const cardW = (i) => layout(i).w;
const cardH = (i) => (layout(i).chain ? CARD.chain : CARD.situational);

for (const [i, c] of CARD_TEXT.entries()) {
  for (const line of c.lines) {
    const width = line.length * c.size * CHAR_RATIO.regular;
    if (width > c.inner + 0.5) {
      throw new Error(
        `skills: "${line}" is ~${width.toFixed(0)}px wide in a ${c.inner.toFixed(0)}px card ` +
          `(${CARDS[i].name})`,
      );
    }
  }
}

// The lower half hangs off the bottom of the card grid, so adding a skill
// moves the bars rather than being drawn underneath them.
const DIVIDER_Y = CARDS_BOTTOM + 28;
const BAR = {
  x: 32,
  w: 940,
  h: 52,
  aY: DIVIDER_Y + 88,
  bY: DIVIDER_Y + 212,
};
const CAPTION_A = BAR.aY - 8;
const CAPTION_B = BAR.bY - 8;
const CLOSING_Y = BAR.bY + BAR.h + 48;
const H = Math.ceil(CLOSING_Y + 44);
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
  t(32, ROW_Y[2] - 12, 'WHEN THEY APPLY — and only then', {
    size: 10.5,
    fill: C.muted,
    ls: 1.1,
    cls: fade(cardAt(CHAIN.length) - 0.3, ENDS),
  }),
);

CARDS.forEach((c, i) => {
  const x = cardX(i);
  const y = cardY(i);
  const w = cardW(i);
  const h = cardH(i);
  const accent = STROKE[c.kind];
  const text = CARD_TEXT[i];
  body.push(
    `<g class="${fade(cardAt(i), ENDS, { rise: 10 })}">` +
      `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="9"` +
      ` fill="url(#hatch-${c.kind})" stroke="${accent}"` +
      ` stroke-width="${c.chain ? 1.6 : 1.2}"${c.chain ? '' : ' stroke-dasharray="5 3"'}/>` +
      t(x + PAD.left, y + 24, `$${c.name}`, { size: NAME_SIZE, weight: 600, fill: C.white }) +
      text.lines
        .map((l, n) =>
          t(x + PAD.left, y + 44 + n * DESC_STEP, l, { size: text.size, fill: C.text, op: 0.92 }),
        )
        .join('') +
      t(
        x + w - PAD.right,
        y + h - 11,
        `description ≈ ${c.desc}  ·  body ≈ ${num(c.bodyTokens)}`,
        { size: 8.8, anchor: 'end', fill: C.faint },
      ) +
      `</g>`,
  );
});

// The hero card keeps beating while its body is the one being loaded.
{
  const i = CARDS.indexOf(HERO);
  body.push(
    `<rect x="${(cardX(i) - 4).toFixed(1)}" y="${cardY(i) - 4}" width="${(cardW(i) + 8).toFixed(1)}"` +
      ` height="${cardH(i) + 8}" rx="12" fill="none" stroke="${C.orange}"` +
      ` class="${pulse(ACT3, ACT4 + 1.2)}"/>`,
  );
}

/* ------------------------------------------------------------------ *
 * The arithmetic
 * ------------------------------------------------------------------ */
body.push(
  `<g class="${fade(ACT2 - 0.5, ENDS)}">` +
    `<line x1="32" y1="${DIVIDER_Y}" x2="972" y2="${DIVIDER_Y}" stroke="${C.track}" stroke-width="1.2"/>` +
    t(32, DIVIDER_Y + 26, 'What that actually costs, in the context window', {
      size: 16,
      weight: 700,
      fill: C.white,
    }) +
    t(
      32,
      DIVIDER_Y + 47,
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
  t(32, CAPTION_A, 'WHAT YOU PAY', {
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
        `that sliver is the entire cost of having ${CARDS.length} skills available`,
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
    t(heroX + 4, CAPTION_A, `↓  $${HERO.name} body  ·  ≈ ${num(HERO.bodyTokens)}, only while it runs`, {
      size: 10.5,
      fill: C.orange,
    }) +
    `</g>`,
);

// The running total swaps rather than crossfades, or both numbers show at once.
body.push(
  t(964, CAPTION_A, `≈ ${num(PAID)} tokens a turn`, {
    size: 11.5,
    anchor: 'end',
    fill: C.text,
    cls: fade(ACT2 + 1.8, ACT3, { cut: true }),
  }),
  t(964, CAPTION_A, `≈ ${num(PAID_LOADED)} tokens a turn`, {
    size: 11.5,
    anchor: 'end',
    fill: C.text,
    cls: fade(ACT3 + 0.6, ENDS, { cut: true }),
  }),
);

/* ---- bar B: the counterfactual ---- */
body.push(
  t(32, CAPTION_B, 'IF EVERY BODY WERE ALWAYS LOADED', {
    size: 10.5,
    fill: C.red,
    ls: 1.1,
    cls: fade(ACT4, ENDS),
  }),
  t(964, CAPTION_B, `≈ ${num(EAGER)} tokens a turn`, {
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
      CLOSING_Y,
      `Same ${CARDS.length} skills. ${RATIO.toFixed(0)}× the context, spent on instructions you are not using — and context you spend is context compaction will take.`,
      { size: 12.5, fill: C.text },
    ) +
    `</g>`,
  t(
    W / 2,
    CLOSING_Y + 32,
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
  title: `${CARDS.length} skills, one line each — why having them all costs almost nothing`,
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
