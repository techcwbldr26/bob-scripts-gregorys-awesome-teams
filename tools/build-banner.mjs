#!/usr/bin/env node
/**
 * Generates `assets/banner.svg`, the animated README banner.
 *
 * The banner animates the context-window diagram the course teaches from, in
 * three acts: a session filling the window, compaction firing and costing you
 * the middle of the conversation, and what this kit does about it.
 *
 * It is generated rather than hand-written because the whole thing is one
 * 24-second CSS timeline: every element needs @keyframes with absolute
 * percentages of that cycle, and the token gauge has to track the running
 * total of the blocks as they appear. Doing that arithmetic by hand would rot
 * the first time anyone changed a duration.
 *
 * Run `npm run build:banner`. A test fails if the committed file drifts.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COVERAGE_GATE, payloadRoot, readSkills } from '../src/payload.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'banner.svg');

// Counts come from the payload itself. Hardcoding "9 skills" here would be a
// number nobody remembers to update the first time someone adds a tenth.
const SKILL_COUNT = (await readSkills()).length;
const RULE_COUNT = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
  f.endsWith('.md'),
).length;

/* ------------------------------------------------------------------ *
 * Palette — sampled directly from the course diagram.
 * ------------------------------------------------------------------ */
const C = {
  bg: '#121212',
  text: '#d3d3d3',
  muted: '#a3a3a3',
  faint: '#6f6f6f',
  frame: '#d3d3d3',
  blue: '#56a2e8',
  blueFill: '#152a3a',
  blueHatch: '#1d3f5c',
  green: '#3a9a4b',
  greenFill: '#152c1a',
  greenHatch: '#1f4a2a',
  orange: '#b86101',
  orangeFill: '#2e1b06',
  orangeHatch: '#4d2f08',
  red: '#ff8383',
  redFill: '#361f1f',
  redHatch: '#5a2c2c',
};

const STROKE = { blue: C.blue, green: C.green, orange: C.orange, red: C.red };

/* ------------------------------------------------------------------ *
 * Timeline. One 24s cycle, looping.
 * ------------------------------------------------------------------ */
const CYCLE = 24;
const pct = (t) => `${((t / CYCLE) * 100).toFixed(3)}%`;

const ACT1 = 0.8;   // the window starts filling
const ACT2 = 9.2;   // compaction fires
const ACT3 = 14.0;  // the kit arrives
const ENDS = 22.6;  // everything fades for the loop

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
const W = 1000;
const H = 780;

const WIN = { y: 126, h: 494, w: 186, pad: 9, gap: 3.2 };
// Shifted right of the canvas edge to leave room for the gauge and its 190k tick.
const LEFT_X = 64;
const RIGHT_X = 350;
const GAUGE_W = 8;
const COL_X = 552;   // callout / features column
const COL_W = 416;

/* ------------------------------------------------------------------ *
 * Content of the two windows.
 * `weight` is visual height, taken from the course diagram's proportions.
 * `tokens` is what that block plausibly costs, so the gauge tells the truth.
 * The first four are the real measured baseline for a bare Bob turn.
 * ------------------------------------------------------------------ */
const LEFT_BLOCKS = [
  ['Bob System Prompt', 'blue', 54, 1500],
  ['Bob Mode Description', 'blue', 44, 1200],
  ['Bob Rules', 'blue', 32, 830],
  ['MCP Tools', 'blue', 40, 5100],
  ['User Message 1', 'green', 26, 600],
  ['Bob Answer 1', 'orange', 26, 1400],
  ['User Message 2', 'green', 26, 700],
  ['File Read', 'red', 56, 28000],
  ['File Write', 'red', 48, 18000],
  ['Bob Answer 3', 'orange', 26, 1600],
  ['User Message 4', 'green', 26, 800],
  ['MCP Tool Results', 'red', 110, 106000],
  ['File Write', 'red', 44, 24000],
  ['Bob Answer 4', 'orange', 26, 2400],
  ['User Message 5', 'green', 26, 900],
];

const RIGHT_BLOCKS = [
  ['Bob System Prompt', 'blue', 46, 1500],
  ['Bob Mode Description', 'blue', 44, 1200],
  ['Bob Rules', 'blue', 32, 830],
  ['MCP Tools', 'blue', 36, 5100],
  ['Conversation Summary', 'orange', 48, 2800],
  ['User Message 5', 'green', 30, 900],
];

const CAP = 270000;
const THRESHOLD = 190000;

/** Lay blocks out inside a window, scaled to fill it. */
function layout(blocks, { fill }) {
  const inner = WIN.h - WIN.pad * 2;
  const gaps = (blocks.length - 1) * WIN.gap;
  const weight = blocks.reduce((sum, b) => sum + b[2], 0);
  const scale = fill ? (inner - gaps) / weight : (WIN.h - WIN.pad * 2 - gaps) / 610;
  let y = WIN.y + WIN.pad;
  let running = 0;
  return blocks.map(([label, kind, w, tokens]) => {
    const h = w * scale;
    const box = { label, kind, y, h, tokens, before: running, after: running + tokens };
    running += tokens;
    y += h + WIN.gap;
    return box;
  });
}

const left = layout(LEFT_BLOCKS, { fill: true });
const right = layout(RIGHT_BLOCKS, { fill: false });
const leftTotal = left.at(-1).after;
const rightTotal = right.at(-1).after;

/* ------------------------------------------------------------------ *
 * Act 3 content — the features, and the chain.
 * ------------------------------------------------------------------ */
const FEATURES = [
  ['blue', 'AGENTS.md', 'Loaded every single turn, so it is kept short on purpose'],
  ['blue', `${RULE_COUNT} always-on rules`, 'evidence over memory / context / finish the work / tests'],
  ['green', `${SKILL_COUNT} skills`, 'Only the description sits in context; the body loads on demand'],
  ['green', 'references/ + examples/', 'Depth Bob reads when a skill cites it, not every turn'],
  ['red', 'Firecrawl MCP', 'Search returns page content, so ten calls become one'],
  ['orange', '/gregorys-awesome-teams', 'One command routes discovery through to demo day'],
  ['orange', 'TASKS.md', 'State in a file survives compaction; scrollback does not'],
  ['blue', '4 setup scripts', 'macOS Intel, Apple silicon, Linux, Windows 11'],
];

const CHAIN = ['discover', 'grill', 'spec', 'implement', 'evals', 'demo'];

/* ------------------------------------------------------------------ *
 * Emitters
 * ------------------------------------------------------------------ */
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const css = [];
/**
 * Rules for `prefers-reduced-motion`. Turning the animation off is not enough:
 * every act's callout would then render at once, stacked on top of the others.
 * Each animated element also declares the state it should hold in a still
 * frame, which is the end of act three -- the most informative moment.
 */
const still = [];
const body = [];
let uid = 0;

/**
 * Fade an element in at `tIn` and hold it until `tOut`.
 * Returns the class name to put on the element.
 */
function fade(tIn, tOut = ENDS, { rise = 0, hold = 1, cut = false } = {}) {
  const name = `f${uid++}`;
  // `cut` swaps the element instantly instead of crossfading. The running token
  // readout needs it: with a 0.5s fade each number is still on screen while the
  // next one arrives, and the two render on top of each other.
  const inEnd = cut ? tIn + 0.001 : tIn + 0.5;
  const outEnd = Math.min(tOut + (cut ? 0.001 : 0.5), CYCLE);
  const from = rise ? `opacity:0;transform:translateY(${rise}px)` : 'opacity:0';
  const to = rise ? `opacity:${hold};transform:translateY(0)` : `opacity:${hold}`;
  css.push(
    `@keyframes ${name}{0%,${pct(tIn)}{${from}}` +
      `${pct(inEnd)},${pct(tOut)}{${to}}` +
      `${pct(outEnd)},100%{opacity:0}}`,
  );
  css.push(`.${name}{animation:${name} ${CYCLE}s linear infinite both;}`);
  still.push(`.${name}{opacity:${tOut >= ENDS - 0.05 ? hold : 0} !important}`);
  return name;
}

/** Fade in, then dim to `to` opacity at `tDim` and stay. */
function fadeDim(tIn, tDim, to) {
  const name = `d${uid++}`;
  css.push(
    `@keyframes ${name}{0%,${pct(tIn)}{opacity:0}` +
      `${pct(tIn + 0.5)},${pct(tDim)}{opacity:1}` +
      `${pct(tDim + 1.1)},${pct(ENDS)}{opacity:${to}}` +
      `${pct(ENDS + 0.5)},100%{opacity:0}}`,
  );
  css.push(`.${name}{animation:${name} ${CYCLE}s linear infinite both;}`);
  // Deliberately full strength in the still frame rather than the dimmed end
  // state: with no animation to draw the eye, the pre-compaction window is
  // half the comparison and needs to stay readable.
  still.push(`.${name}{opacity:1 !important}`);
  return name;
}

/**
 * A gauge that grows through a list of [time, fraction] stops.
 *
 * The final level is held explicitly until the end of the cycle. Without that
 * hold, CSS interpolates straight from the last stop to the reset keyframe and
 * the bar visibly drains back to empty over the rest of the animation.
 */
function gauge(len, stops, tStart) {
  const name = `g${uid++}`;
  const frames = [`0%,${pct(tStart)}{stroke-dashoffset:${len.toFixed(2)}}`];
  for (const [t, frac] of stops) {
    frames.push(`${pct(t)}{stroke-dashoffset:${(len * (1 - frac)).toFixed(2)}}`);
  }
  const held = len * (1 - stops.at(-1)[1]);
  frames.push(`${pct(ENDS)}{stroke-dashoffset:${held.toFixed(2)}}`);
  frames.push(`${pct(ENDS + 0.5)},100%{stroke-dashoffset:${len.toFixed(2)}}`);
  css.push(`@keyframes ${name}{${frames.join('')}}`);
  css.push(
    `.${name}{stroke-dasharray:${len.toFixed(2)};stroke-dashoffset:${len.toFixed(2)};` +
      `animation:${name} ${CYCLE}s linear infinite both;}`,
  );
  still.push(`.${name}{stroke-dashoffset:${held.toFixed(2)} !important}`);
  return name;
}

/** Draw a path on, by animating its dash offset. */
function draw(len, tIn, tOut = ENDS) {
  const name = `w${uid++}`;
  css.push(
    `@keyframes ${name}{0%,${pct(tIn)}{stroke-dashoffset:${len}}` +
      `${pct(tIn + 1.4)},${pct(tOut)}{stroke-dashoffset:0}` +
      `${pct(tOut + 0.5)},100%{stroke-dashoffset:${len};opacity:0}}`,
  );
  css.push(
    `.${name}{stroke-dasharray:${len};stroke-dashoffset:${len};` +
      `animation:${name} ${CYCLE}s linear infinite both;}`,
  );
  still.push(`.${name}{stroke-dashoffset:0 !important;opacity:${tOut >= ENDS - 0.05 ? 1 : 0} !important}`);
  return name;
}

/** A pulse that runs only between two times. */
function pulse(tIn, tOut, { from = 1, to = 2.6 } = {}) {
  const name = `p${uid++}`;
  const beat = 1.2;
  const frames = [`0%,${pct(tIn)}{stroke-width:${from};opacity:0}`];
  let t = tIn;
  let i = 0;
  // Every stop is clamped to tOut and the loop stops once a beat would overrun
  // it. Without the clamp the last beat emitted a percentage past tOut and the
  // closing frame then went backwards, leaving the keyframes out of order.
  while (t + beat / 2 < tOut) {
    frames.push(`${pct(t + beat / 2)}{stroke-width:${to};opacity:0.95}`);
    frames.push(`${pct(Math.min(t + beat, tOut))}{stroke-width:${from};opacity:0.35}`);
    t += beat;
    if (++i > 12) break;
  }
  frames.push(`${pct(Math.min(tOut + 0.4, CYCLE))},100%{opacity:0;stroke-width:${from}}`);
  css.push(`@keyframes ${name}{${frames.join('')}}`);
  css.push(`.${name}{animation:${name} ${CYCLE}s linear infinite both;}`);
  still.push(`.${name}{opacity:0 !important}`);
  return name;
}

const t = (x, y, s, { size = 12, fill = C.text, anchor = 'start', weight = 400, cls = '', op = 1, ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"` +
  `${weight !== 400 ? ` font-weight="${weight}"` : ''}${op !== 1 ? ` opacity="${op}"` : ''}` +
  `${ls ? ` letter-spacing="${ls}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;

/** A context block, drawn like the diagram: hatched fill, coloured border. */
function block(x, y, w, h, label, kind, cls) {
  const r = Math.min(7, h / 2);
  const fs = h >= 30 ? 11.5 : h >= 22 ? 10.5 : 9.8;
  return (
    `<g class="${cls}">` +
    `<rect x="${x}" y="${y.toFixed(2)}" width="${w}" height="${h.toFixed(2)}" rx="${r.toFixed(1)}"` +
    ` fill="url(#hatch-${kind})" stroke="${STROKE[kind]}" stroke-width="1.6"/>` +
    t(x + w / 2, (y + h / 2 + fs * 0.36).toFixed(2), label, { size: fs, anchor: 'middle' }) +
    `</g>`
  );
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

// ---- defs ----
const patterns = ['blue', 'green', 'orange', 'red']
  .map((k) => {
    const fillKey = `${k}Fill`;
    const hatchKey = `${k}Hatch`;
    return (
      `<pattern id="hatch-${k}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="7" height="7" fill="${C[fillKey]}"/>` +
      `<line x1="0" y1="0" x2="0" y2="7" stroke="${C[hatchKey]}" stroke-width="3.2"/>` +
      `</pattern>`
    );
  })
  .join('');

// ---- header (always visible, so a static render still reads) ----
body.push(
  t(36, 46, "Gregory's Awesome Teams", { size: 25, weight: 700, fill: '#ffffff' }),
  t(36, 70, 'Prompt, context and harness engineering for the IBM Bob harness', {
    size: 12.5,
    fill: C.muted,
  }),
);

const acts = [
  ['01  a session fills the window', ACT1 + 0.4, ACT2 - 0.2],
  ['02  compaction, and what it costs you', ACT2, ACT3 - 0.3],
  ['03  what this kit does about it', ACT3, ENDS],
];
for (const [label, a, b] of acts) {
  const cls = fade(a, b);
  body.push(
    `<g class="${cls}">` +
      `<rect x="${W - 36 - 268}" y="30" width="268" height="26" rx="13" fill="#1b1b1b" stroke="${C.faint}" stroke-width="1"/>` +
      t(W - 36 - 134, 47, label, { size: 11.5, anchor: 'middle', fill: C.text, ls: 0.6 }) +
      `</g>`,
  );
}

// ---- window frames + labels (static) ----
for (const [x, caption] of [
  [LEFT_X, 'context window  ·  270k tokens'],
  [RIGHT_X, 'context window  ·  270k tokens'],
]) {
  body.push(
    t(x + WIN.w / 2, 112, caption, { size: 11, anchor: 'middle', fill: C.muted }),
    `<rect x="${x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" rx="16" fill="none" stroke="${C.frame}" stroke-width="1.8" opacity="0.92"/>`,
  );
}

// ---- left gauge ----
const gTop = WIN.y + 2;
const gLen = WIN.h - 4;
const leftStops = left.map((b, i) => [ACT1 + 0.35 + i * 0.42, b.after / CAP]);
const leftGauge = gauge(gLen, leftStops, ACT1 + 0.2);
body.push(
  `<line x1="${LEFT_X - 14}" y1="${gTop}" x2="${LEFT_X - 14}" y2="${gTop + gLen}" stroke="#242424" stroke-width="${GAUGE_W}" stroke-linecap="butt"/>`,
  `<line x1="${LEFT_X - 14}" y1="${gTop}" x2="${LEFT_X - 14}" y2="${gTop + gLen}" stroke="${C.red}" stroke-width="${GAUGE_W}" stroke-linecap="butt" class="${leftGauge}"/>`,
);

// Threshold tick, on the gauge only. It deliberately does not run across the
// blocks: their heights are the diagram's visual weights, not token counts, so
// a line through them would imply a precision the stack does not have.
const thrY = gTop + gLen * (THRESHOLD / CAP);
body.push(
  `<g class="${fade(ACT1 + 0.2, ENDS)}">` +
    `<line x1="${LEFT_X - 21}" y1="${thrY.toFixed(1)}" x2="${LEFT_X - 7}" y2="${thrY.toFixed(1)}" stroke="${C.red}" stroke-width="1.4"/>` +
    t(LEFT_X - 24, thrY + 3.5, '190k', { size: 9, fill: C.red, anchor: 'end' }) +
    `</g>`,
);

// ---- left blocks ----
left.forEach((b, i) => {
  const tIn = ACT1 + i * 0.42;
  const cls = fadeDim(tIn, ACT2 + 1.6, 0.42);
  body.push(block(LEFT_X + WIN.pad, b.y, WIN.w - WIN.pad * 2, b.h, b.label, b.kind, cls));
});

// highlight the blocks that actually cost the money
for (const idx of [7, 8, 11, 12]) {
  const b = left[idx];
  const cls = pulse(ACT1 + 5.2, ACT2 + 0.6);
  body.push(
    `<rect x="${LEFT_X + WIN.pad - 2}" y="${(b.y - 2).toFixed(2)}" width="${WIN.w - WIN.pad * 2 + 4}" height="${(b.h + 4).toFixed(2)}" rx="9" fill="none" stroke="${C.red}" class="${cls}"/>`,
  );
}

// ---- running token readout under the left window ----
const readStops = left.map((b, i) => [ACT1 + 0.35 + i * 0.42, b.after]);
readStops.forEach(([time, value], i) => {
  const next = readStops[i + 1]?.[0] ?? ACT3 - 0.3;
  const cls = fade(time, next, { cut: true });
  body.push(
    t(LEFT_X + WIN.w / 2, WIN.y + WIN.h + 24, `${Math.round(value / 100) / 10}k used`, {
      size: 11.5,
      anchor: 'middle',
      fill: value >= THRESHOLD ? C.red : C.text,
      weight: 600,
      cls,
    }),
  );
});
const overCls = fade(ACT2 + 0.2, ACT3 - 0.3);
body.push(
  t(LEFT_X + WIN.w / 2, WIN.y + WIN.h + 40, 'over the compaction threshold', {
    size: 10,
    anchor: 'middle',
    fill: C.red,
    cls: overCls,
  }),
);

// ---- compaction arrow ----
const ax1 = LEFT_X + WIN.w + 14;
const ay1 = WIN.y + WIN.h - 44;
const ax2 = RIGHT_X - 22;
const ay2 = WIN.y + 46;
const alen = Math.hypot(ax2 - ax1, ay2 - ay1);
const angle = (Math.atan2(ay2 - ay1, ax2 - ax1) * 180) / Math.PI;
const arrowCls = draw(Math.ceil(alen) + 2, ACT2 + 0.3);
const headCls = fade(ACT2 + 1.6, ENDS);
body.push(
  `<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="${C.frame}" stroke-width="1.8" class="${arrowCls}"/>`,
  `<g class="${headCls}" transform="translate(${ax2},${ay2}) rotate(${angle.toFixed(2)})">` +
    `<polygon points="0,0 -13,-5 -13,5" fill="${C.frame}"/></g>`,
  `<g class="${fade(ACT2 + 0.6, ENDS)}" transform="translate(${((ax1 + ax2) / 2 - 10).toFixed(1)},${((ay1 + ay2) / 2).toFixed(1)}) rotate(${angle.toFixed(1)})">` +
    t(0, -8, 'Compaction', { size: 12, anchor: 'middle', fill: C.text, ls: 1.2 }) +
    `</g>`,
);

// ---- right gauge + blocks ----
const rightGauge = gauge(gLen, [[ACT2 + 2.6, rightTotal / CAP]], ACT2 + 1.8);
body.push(
  `<line x1="${RIGHT_X - 14}" y1="${gTop}" x2="${RIGHT_X - 14}" y2="${gTop + gLen}" stroke="#242424" stroke-width="${GAUGE_W}" stroke-linecap="butt"/>`,
  `<line x1="${RIGHT_X - 14}" y1="${gTop}" x2="${RIGHT_X - 14}" y2="${gTop + gLen}" stroke="${C.green}" stroke-width="${GAUGE_W}" stroke-linecap="butt" class="${rightGauge}"/>`,
);
right.forEach((b, i) => {
  const cls = fade(ACT2 + 1.7 + i * 0.22, ENDS);
  body.push(block(RIGHT_X + WIN.pad, b.y, WIN.w - WIN.pad * 2, b.h, b.label, b.kind, cls));
});
body.push(
  t(RIGHT_X + WIN.w / 2, WIN.y + WIN.h + 24, `${Math.round(rightTotal / 100) / 10}k used`, {
    size: 11.5,
    anchor: 'middle',
    fill: C.green,
    weight: 600,
    cls: fade(ACT2 + 2.7, ENDS),
  }),
  t(RIGHT_X + WIN.w / 2, WIN.y + WIN.h + 40, 'the middle of the conversation is gone', {
    size: 10,
    anchor: 'middle',
    fill: C.muted,
    cls: fade(ACT2 + 3.0, ACT3 - 0.3),
  }),
);
// what survived / what did not
const survived = fade(ACT2 + 3.4, ACT3 - 0.3);
body.push(
  `<g class="${survived}">` +
    `<rect x="${RIGHT_X + WIN.pad - 3}" y="${(right[4].y - 3).toFixed(2)}" width="${WIN.w - WIN.pad * 2 + 6}" height="${(right[4].h + 6).toFixed(2)}" rx="9" fill="none" stroke="${C.orange}" stroke-width="1.4" stroke-dasharray="4 3"/>` +
    `</g>`,
);

/* ---------------- right column: callouts, then features --------------- */
const colTitle = (y, s, cls) => t(COL_X, y, s, { size: 14, weight: 700, fill: '#ffffff', cls });
const bullet = (y, s, cls, color) =>
  `<g class="${cls}">` +
  `<circle cx="${COL_X + 4}" cy="${y - 4}" r="3" fill="${color}"/>` +
  `<text x="${COL_X + 16}" y="${y}" font-size="11.8" fill="${C.text}">${esc(s)}</text>` +
  `</g>`;

// Act 1 callout
{
  const a = ACT1 + 1.6;
  const b = ACT2 - 0.2;
  body.push(colTitle(150, 'What actually fills the window', fade(a, b)));
  const lines = [
    [C.blue, 'Tool definitions and MCP schemas cost about 8.6k'],
    [C.blue, 'before you have typed a single character.'],
    [C.red, 'One wide file read or a raw MCP result'],
    [C.red, 'can cost 30k to 100k on its own.'],
    [C.orange, 'Every turn re-sends all of it, so cost grows'],
    [C.orange, 'faster than the conversation does.'],
  ];
  lines.forEach(([col, s], i) => {
    if (i % 2 === 1) {
      body.push(
        `<text x="${COL_X + 16}" y="${178 + i * 22}" font-size="11.8" fill="${C.muted}" class="${fade(a + i * 0.25, b)}">${esc(s)}</text>`,
      );
    } else {
      body.push(bullet(178 + i * 22, s, fade(a + i * 0.25, b), col));
    }
  });
}

// Act 2 callout
{
  const a = ACT2 + 1.2;
  const b = ACT3 - 0.3;
  body.push(colTitle(150, 'Compaction is lossy', fade(a, b)));
  const lines = [
    [C.blue, 'System prompt, rules and skills survive it.'],
    [C.orange, 'Older turns become one summary.'],
    [C.red, 'The decision you made at turn 3 may simply'],
    [C.red, 'stop existing, and nothing tells you.'],
    [C.green, 'Anything written to a file survives.'],
    [C.green, 'Anything left in the scrollback does not.'],
  ];
  lines.forEach(([col, s], i) => {
    const cls = fade(a + i * 0.3, b);
    if (i === 3 || i === 5) {
      body.push(
        `<text x="${COL_X + 16}" y="${178 + i * 22}" font-size="11.8" fill="${C.muted}" class="${cls}">${esc(s)}</text>`,
      );
    } else {
      body.push(bullet(178 + i * 22, s, cls, col));
    }
  });
}

// Act 3: the features
{
  const a = ACT3 + 0.2;
  body.push(colTitle(150, 'What Gregory’s Awesome Teams installs', fade(a, ENDS)));
  FEATURES.forEach(([kind, name, desc], i) => {
    const y = 176 + i * 44;
    const cls = fade(a + 0.3 + i * 0.32, ENDS, { rise: 8 });
    body.push(
      `<g class="${cls}">` +
        `<rect x="${COL_X}" y="${y - 14}" width="${COL_W}" height="36" rx="8" fill="#191919" stroke="${STROKE[kind]}" stroke-width="1.3" opacity="0.95"/>` +
        `<rect x="${COL_X}" y="${y - 14}" width="3.5" height="36" rx="1.8" fill="${STROKE[kind]}"/>` +
        t(COL_X + 14, y, name, { size: 12, weight: 700, fill: '#ffffff' }) +
        t(COL_X + 14, y + 15, desc, { size: 10.2, fill: C.muted }) +
        `</g>`,
    );
  });
}

// Act 3 payoff: the same session, run with the kit. Lives in the right column
// under the features, so it never competes with the chain strip below.
{
  const a = ACT3 + 3.4;
  const kitTokens = 38000;
  const y = 556;
  const barW = COL_W;
  body.push(
    `<g class="${fade(a, ENDS)}">` +
      t(COL_X, y - 12, 'the same session, run with the kit', { size: 11.5, fill: C.text, weight: 600 }) +
      `<rect x="${COL_X}" y="${y}" width="${barW}" height="10" rx="5" fill="#242424"/>` +
      `</g>`,
  );
  const grow = gauge(barW, [[a + 1.3, kitTokens / CAP]], a + 0.2);
  body.push(
    `<line x1="${COL_X}" y1="${y + 5}" x2="${COL_X + barW}" y2="${y + 5}" stroke="${C.green}" stroke-width="10" stroke-linecap="butt" class="${grow}"/>`,
    `<g class="${fade(a + 0.6, ENDS)}">` +
      `<line x1="${(COL_X + barW * (THRESHOLD / CAP)).toFixed(1)}" y1="${y - 5}" x2="${(COL_X + barW * (THRESHOLD / CAP)).toFixed(1)}" y2="${y + 15}" stroke="${C.red}" stroke-width="1.3" stroke-dasharray="3 3"/>` +
      t(COL_X + barW * (THRESHOLD / CAP) - 4, y + 26, '190k compaction', { size: 9.5, fill: C.red, anchor: 'end' }) +
      `</g>`,
    `<g class="${fade(a + 1.4, ENDS)}">` +
      t(COL_X, y + 26, '38k used', { size: 10.5, fill: C.green, weight: 700 }) +
      `</g>`,
  );
}

/* ---------------- bottom: the build chain ---------------- */
{
  const y = 712;
  const pillW = 118;
  const gap = 26;
  const total = CHAIN.length * pillW + (CHAIN.length - 1) * gap;
  const x0 = (W - total) / 2;
  body.push(
    `<line x1="36" y1="678" x2="${W - 36}" y2="678" stroke="#242424" stroke-width="1"/>`,
    t(36, 700, 'the build chain the kit installs', {
      size: 10.5,
      fill: C.faint,
      ls: 0.8,
      cls: fade(ACT3 + 4.4, ENDS),
    }),
  );
  CHAIN.forEach((name, i) => {
    const x = x0 + i * (pillW + gap);
    const a = ACT3 + 4.6 + i * 0.3;
    body.push(
      `<g class="${fade(a, ENDS)}">` +
        `<rect x="${x.toFixed(1)}" y="${y}" width="${pillW}" height="30" rx="15" fill="#191919" stroke="${C.green}" stroke-width="1.3"/>` +
        t(x + pillW / 2, y + 19.5, name, { size: 11.5, anchor: 'middle', fill: C.text }) +
        `</g>`,
    );
    if (i < CHAIN.length - 1) {
      const ax = x + pillW + 5;
      body.push(
        `<g class="${fade(a + 0.15, ENDS)}">` +
          `<line x1="${ax.toFixed(1)}" y1="${y + 15}" x2="${(ax + gap - 12).toFixed(1)}" y2="${y + 15}" stroke="${C.faint}" stroke-width="1.3"/>` +
          `<polygon points="${(ax + gap - 10).toFixed(1)},${y + 15} ${(ax + gap - 16).toFixed(1)},${y + 12} ${(ax + gap - 16).toFixed(1)},${y + 18}" fill="${C.faint}"/>` +
          `</g>`,
      );
    }
  });
}

/* ---------------- footer ---------------- */
body.push(
  t(
    W / 2,
    764,
    `/gregorys-awesome-teams   ·   ${SKILL_COUNT} skills   ·   ${RULE_COUNT} rules   ·   Firecrawl MCP   ·   a ${COVERAGE_GATE}% coverage gate enforced in CI`,
    { size: 10.5, anchor: 'middle', fill: C.faint, ls: 0.4 },
  ),
);

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const reduced =
  `@media (prefers-reduced-motion:reduce){*{animation:none !important}` +
  still.join('') +
  `}`;

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">` +
  `<title id="title">Gregory's Awesome Teams — context engineering for the IBM Bob harness</title>` +
  `<desc id="desc">An animated diagram in three acts. First a Bob context window fills with the system prompt, rules, MCP tools, messages, file reads and tool results until it passes the 190k compaction threshold. Then compaction fires and the older turns collapse into a single conversation summary, losing the middle of the conversation. Finally the kit's features appear: AGENTS.md, four always-on rules, nine skills, references and examples, the Firecrawl MCP server, the slash command, TASKS.md and four setup scripts, together with the build chain discover, grill, spec, implement, evals, demo.</desc>` +
  `<defs>${patterns}</defs>` +
  `<style>` +
  `text{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif}` +
  css.join('') +
  reduced +
  `</style>` +
  `<rect width="${W}" height="${H}" fill="${C.bg}"/>` +
  body.join('') +
  `</svg>\n`;

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${uid} animated elements`);
console.log(`  ${SKILL_COUNT} skills, ${RULE_COUNT} rules, ${COVERAGE_GATE}% gate (read from the payload)`);
console.log(`  left window total  ${leftTotal.toLocaleString('en-US')} tokens`);
console.log(`  right window total ${rightTotal.toLocaleString('en-US')} tokens`);
