#!/usr/bin/env node
/**
 * Generates `assets/security-safeguards.svg`, the banner for the wiki's
 * Enterprise Security Safeguards page.
 *
 * Six safeguards walk past in turn. Underneath them runs the article's own
 * worked example — an agent that only needs to summarise email, holding six
 * permissions — and the permissions are struck off as the first safeguards
 * land, until one is left. That strip is the point: least privilege is not an
 * abstraction, it is a list you can actually shorten.
 *
 * Run `npm run build:security`.
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
  'security-safeguards.svg',
);

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ *
 * Blue is the structural machinery you set up once; orange is where a human
 * stays in the decision; green is the evidence you keep afterwards. Red is
 * reserved for the thing that is actively hostile — content carrying
 * instructions — which is why only safeguard three wears it.
 */
const SAFEGUARDS = [
  {
    n: 'Limit access',
    kind: 'blue',
    ask: 'What does this agent genuinely need access to?',
    stops: 'a summariser that can also send, delete and search the whole organisation',
    note: 'Give it the minimum access it needs to do its job.',
  },
  {
    n: 'Restrict permissions',
    kind: 'blue',
    ask: 'What is the minimum permission required to accomplish that?',
    stops: 'treating OAuth as a security strategy rather than a login',
    note: 'Authorising something is not the same as deciding what it may do.',
  },
  {
    n: 'Separate trusted from untrusted',
    kind: 'red',
    ask: 'Could this content be carrying instructions?',
    stops: 'a web page, email or document telling your agent what to do',
    note: 'Your instructions and the content you read are not the same channel.',
  },
  {
    n: 'Humans on high-impact actions',
    kind: 'orange',
    ask: 'Which decisions still require human judgement?',
    stops: 'sending, publishing, purchasing, deleting or executing without a person',
    note: 'Not approval for everything — that throws away the benefit.',
  },
  {
    n: 'Control data movement',
    kind: 'orange',
    ask: 'Can one system make the agent send data into another?',
    stops: 'legitimate access to two systems becoming a path between them',
    note: 'Access to both is not permission to bridge them.',
  },
  {
    n: 'Log and monitor',
    kind: 'green',
    ask: 'If this goes wrong, can you reconstruct what happened?',
    stops: 'an incident you cannot explain afterwards',
    note: 'What it accessed, what it tried, which tools, what it sent.',
  },
];

/**
 * The article's own example: the job needs one of these. The other five are
 * what an over-broad grant hands over with it.
 */
const PERMISSIONS = [
  { label: 'Summarise emails', keep: true },
  { label: 'Send emails', keep: false },
  { label: 'Delete emails', keep: false },
  { label: 'Read every folder', keep: false },
  { label: 'Download attachments', keep: false },
  { label: 'Search the whole org', keep: false },
];

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ */
// Authored length in design seconds, independent of the playback CYCLE.
const DESIGN = 35;
const ENDS = 33.4;

const T0 = 2.0;
const STEP = 4.9;
const DWELL = 4.6;
const at = (i) => T0 + i * STEP;
const LAST = at(SAFEGUARDS.length - 1);

const tl = timeline({ design: DESIGN, ends: ENDS });
const { css, still, fade, draw, pulse } = tl;
const body = [];

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
const W = 1000;

const PILL = { w: 150, h: 50, y: 118 };
const X0 = 24;
const STEP_X = (W - X0 * 2 - PILL.w) / (SAFEGUARDS.length - 1);
const px = (i) => X0 + i * STEP_X;
const cx = (i) => px(i) + PILL.w / 2;

const PANEL = { x: 24, y: 212, w: 952, h: 146 };
const STRIP = { y: 424, h: 46, x: 24, w: 952 };

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */
const SUBTITLE =
  'An agent that answers questions is a document. One that can act is a system.';
const SUB_RIGHT = 'safeguards go in before it acts';

// The two header lines share a row from opposite ends, so check they cannot
// meet. Lengthening either one is the obvious future edit, and an overlap is
// invisible in the markup.
{
  const leftEnd = 26 + SUBTITLE.length * 12.5 * CHAR_RATIO.regular;
  const rightStart = 974 - SUB_RIGHT.length * 12 * CHAR_RATIO.regular;
  if (leftEnd > rightStart - 24) {
    throw new Error(
      `security: the header subtitles overlap — left ends ~${leftEnd.toFixed(0)}px, ` +
        `right starts ~${rightStart.toFixed(0)}px`,
    );
  }
}

body.push(
  t(26, 44, 'Six safeguards, before you deploy an agent', {
    size: 24,
    weight: 700,
    fill: C.white,
  }),
  t(26, 68, SUBTITLE, { size: 12.5, fill: C.muted }),
  t(974, 44, `${SAFEGUARDS.length} safeguards`, {
    size: 12,
    anchor: 'end',
    fill: C.muted,
    ls: 0.6,
  }),
  t(974, 68, SUB_RIGHT, { size: 12, anchor: 'end', fill: C.faint }),
);

/* ------------------------------------------------------------------ *
 * The six stations
 * ------------------------------------------------------------------ */
const NAME_BUDGET = charBudget(PILL.w - 16, 11.5, CHAR_RATIO.bold);

const station = (i, cls, hold) => {
  const s = SAFEGUARDS[i];
  const lines = wrap(s.n, NAME_BUDGET);
  const size = Number(fitSize(lines, PILL.w - 16, 11.5).toFixed(2));
  const top = PILL.y + (PILL.h - (lines.length - 1) * 13) / 2 + 4;
  return (
    `<g class="${cls}"${hold === 1 ? '' : ` opacity="${hold}"`}>` +
    `<rect x="${px(i).toFixed(1)}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h}" rx="9"` +
    ` fill="url(#hatch-${s.kind})" stroke="${STROKE[s.kind]}" stroke-width="1.7"/>` +
    lines
      .map((l, n) =>
        t(cx(i), top + n * 13, l, { size, anchor: 'middle', fill: C.text, weight: 600 }),
      )
      .join('') +
    `</g>`
  );
};

SAFEGUARDS.forEach((s, i) => {
  body.push(
    t(cx(i), PILL.y - 10, String(i + 1).padStart(2, '0'), {
      size: 9,
      anchor: 'middle',
      fill: C.faint,
      ls: 0.7,
      cls: fade(0.8, ENDS),
    }),
    station(i, fade(1.1, ENDS, { hold: 0.55 }), 1),
    station(i, fade(at(i), ENDS), 1),
    `<rect x="${(px(i) - 4).toFixed(1)}" y="${PILL.y - 4}" width="${PILL.w + 8}"` +
      ` height="${PILL.h + 8}" rx="12" fill="none" stroke="${STROKE[s.kind]}"` +
      ` class="${pulse(at(i), at(i) + DWELL)}"/>`,
  );
});

/* ------------------------------------------------------------------ *
 * One panel at a time
 * ------------------------------------------------------------------ */
SAFEGUARDS.forEach((s, i) => {
  const tIn = at(i);
  const tOut = i === SAFEGUARDS.length - 1 ? ENDS : tIn + DWELL;
  const drop = PANEL.y - (PILL.y + PILL.h);

  body.push(
    `<g class="${fade(tIn, tOut)}">` +
      `<line x1="${cx(i).toFixed(1)}" y1="${PILL.y + PILL.h}" x2="${cx(i).toFixed(1)}" y2="${PANEL.y}"` +
      ` stroke="${STROKE[s.kind]}" stroke-width="1.4" opacity="0.8"` +
      ` class="${draw(Math.ceil(drop), tIn, tOut, { dur: 0.4 })}"/>` +
      `</g>`,
    `<g class="${fade(tIn, tOut, { rise: 7 })}">` +
      `<rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="11"` +
      ` fill="${C.panel}" stroke="${STROKE[s.kind]}" stroke-width="1.3"/>` +
      `<rect x="${PANEL.x + 1}" y="${PANEL.y + 12}" width="4.5" height="${PANEL.h - 24}" rx="2.3"` +
      ` fill="${STROKE[s.kind]}"/>` +
      t(PANEL.x + 24, PANEL.y + 36, s.n, { size: 19, weight: 700, fill: STROKE[s.kind] }) +
      t(PANEL.x + 24, PANEL.y + 62, `“${s.ask}”`, { size: 14, fill: C.white }) +
      t(PANEL.x + 24, PANEL.y + 92, 'stops', { size: 9.5, fill: C.red, ls: 0.7 }) +
      t(PANEL.x + 78, PANEL.y + 92, s.stops, { size: 12.5, fill: C.text }) +
      t(PANEL.x + 24, PANEL.y + 118, s.note, { size: 12, fill: C.muted }) +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The permission strip
 * ------------------------------------------------------------------ *
 * The article's worked example, made literal. All six are granted at the start;
 * the five the job never needed are struck off as safeguards one and two land.
 */
const CHIP_GAP = 10;
const chipW = (STRIP.w - CHIP_GAP * (PERMISSIONS.length - 1)) / PERMISSIONS.length;
const chipX = (i) => STRIP.x + i * (chipW + CHIP_GAP);

// Struck off between the first and second safeguard, one after another.
const cutAt = (i) => at(0) + 1.6 + i * 0.85;

body.push(
  `<g class="${fade(0.8, ENDS)}">` +
    t(24, STRIP.y - 14, 'WHAT THE AGENT IS ALLOWED TO DO', { size: 10.5, fill: C.muted, ls: 1.1 }) +
    `</g>`,
);

PERMISSIONS.forEach((perm, i) => {
  const x = chipX(i);
  const cyText = STRIP.y + 28;
  const lines = wrap(perm.label, charBudget(chipW - 18, 11, CHAR_RATIO.regular));
  const size = Number(fitSize(lines, chipW - 18, 11, { ratio: CHAR_RATIO.regular }).toFixed(2));
  const top = STRIP.y + (STRIP.h - (lines.length - 1) * 12) / 2 + 4;

  // Granted: every one of them, from the start.
  body.push(
    `<g class="${fade(1.0, ENDS)}">` +
      `<rect x="${x.toFixed(1)}" y="${STRIP.y}" width="${chipW.toFixed(1)}" height="${STRIP.h}" rx="8"` +
      ` fill="url(#hatch-${perm.keep ? 'green' : 'red'})"` +
      ` stroke="${perm.keep ? C.green : C.red}" stroke-width="1.5"/>` +
      lines
        .map((l, n) =>
          t(x + chipW / 2, top + n * 12, l, {
            size,
            anchor: 'middle',
            fill: C.text,
            weight: perm.keep ? 600 : 400,
          }),
        )
        .join('') +
      `</g>`,
  );

  if (perm.keep) {
    // The one the job actually needs keeps a quiet pulse at the end.
    body.push(
      `<rect x="${(x - 3).toFixed(1)}" y="${STRIP.y - 3}" width="${(chipW + 6).toFixed(1)}"` +
        ` height="${STRIP.h + 6}" rx="11" fill="none" stroke="${C.green}"` +
        ` class="${pulse(at(1) + 1.0, at(1) + DWELL)}"/>`,
    );
    return;
  }

  // Struck off, then dimmed: the permission is gone, and you can see it go.
  const tCut = cutAt(i - 1);
  body.push(
    `<g class="${fade(tCut, ENDS, { hold: 0.45 })}">` +
      `<rect x="${x.toFixed(1)}" y="${STRIP.y}" width="${chipW.toFixed(1)}" height="${STRIP.h}" rx="8"` +
      ` fill="${C.bg}" opacity="0.62"/>` +
      `</g>`,
    `<line x1="${(x + 8).toFixed(1)}" y1="${cyText}" x2="${(x + chipW - 8).toFixed(1)}" y2="${cyText}"` +
      ` stroke="${C.red}" stroke-width="2"` +
      ` class="${draw(Math.ceil(chipW - 16), tCut, ENDS, { dur: 0.35 })}"/>`,
  );
});

/* ------------------------------------------------------------------ *
 * The closing line
 * ------------------------------------------------------------------ */
{
  const label = 'What is the worst thing this agent could do with the permissions we gave it?';
  const w = 620;
  const x = (W - w) / 2;
  const y = STRIP.y + STRIP.h + 34;
  body.push(
    `<g class="${fade(LAST + 1.6, ENDS, { rise: 6 })}">` +
      `<rect x="${x}" y="${y}" width="${w}" height="32" rx="16" fill="${C.panel}"` +
      ` stroke="${C.blue}" stroke-width="1.2"/>` +
      t(W / 2, y + 21, label, { size: 12.5, anchor: 'middle', fill: C.text }) +
      `</g>`,
  );
  var FOOTER_Y = y + 32 + 28;
}

body.push(
  t(
    W / 2,
    FOOTER_Y,
    'least privilege   ·   trusted instructions are not untrusted content   ·   a human on anything that cannot be undone',
    { size: 10.5, anchor: 'middle', fill: C.faint, ls: 0.4 },
  ),
);

const H = FOOTER_Y + 16;

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
const svg = assemble({
  width: W,
  height: H,
  title: 'Six safeguards to set before deploying an AI agent',
  desc:
    'An animated diagram of six safeguards to put in place before an AI agent is allowed ' +
    'to act: limit what it can access, restrict its permissions, separate trusted ' +
    'instructions from untrusted content, keep a human on high-impact actions, control ' +
    'how data moves between systems, and log and monitor what it does. Each one shows the ' +
    'question to ask and the failure it prevents. Underneath, a worked example: an agent ' +
    'that only needs to summarise email is granted six permissions, and the five it never ' +
    'needed are struck off one by one until only summarising is left. It closes on the ' +
    'question worth asking before any deployment — what is the worst thing this agent ' +
    'could do with the permissions we gave it?',
  defs: hatchPatterns(),
  css,
  still,
  body,
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg, 'utf8');

console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB, ${tl.count} animated elements, ${CYCLE}s loop`);
console.log(`  ${SAFEGUARDS.length} safeguards, ${PERMISSIONS.length} permissions, ${W}x${H}`);
