#!/usr/bin/env node
/**
 * Generates `CHEATSHEET.md` — one page a student can keep open or print.
 *
 * Students asked for the commands and the skills on a single page rather than
 * spread through a README and a wiki. It is generated rather than written so
 * that a new skill or command cannot leave a stale card behind: every name,
 * count and one-line summary comes from `payload/` at build time.
 *
 * Run `npm run build:cheatsheet`. A test fails if the committed file drifts.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COMMAND_NAME,
  COMMANDS,
  CONTEXT,
  DEMO_DATE,
  IMPROVE_COMMAND_NAME,
} from '../src/constants.mjs';
import { COVERAGE_GATE, payloadRoot, readSkills } from '../src/payload.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Two homes, one source: the repo root for anyone reading the code, and the
// wiki for the students who never leave it.
const OUT = [path.join(root, 'CHEATSHEET.md'), path.join(root, 'wiki', 'Cheat-Sheet.md')];

const num = (n) => n.toLocaleString('en-US');

/** The first sentence of a skill description: what it does, without the trigger. */
const summarise = (d) => `${d.split('. ')[0].replace(/\.$/, '')}.`;

/**
 * When to reach for it — the trigger clause of the description.
 *
 * Skill descriptions open their second sentence several ways ("Use when…",
 * "Use at the start of…", "Use after…"), because that sentence is written for
 * the model rather than for a table. Normalise it so the column reads as one
 * voice instead of six.
 */
const trigger = (d) => {
  const rest = d.split('. ').slice(1).join('. ').trim();
  const clause = rest.replace(/^Use\s+(when\s+)?/i, '').replace(/\.$/, '');
  return clause ? clause.charAt(0).toLowerCase() + clause.slice(1) : '';
};

const skills = await readSkills();
const rules = (await fs.readdir(path.join(payloadRoot(), 'rules')))
  .filter((f) => f.endsWith('.md'))
  .sort();

/** The six stages of the build chain, in order, then everything else. */
const CHAIN = [
  'discover-with-firecrawl',
  'grill-with-docs',
  'to-spec',
  'implement-with-tests',
  'build-evals',
  'demo-rehearsal',
];
const byName = new Map(skills.map((s) => [s.name, s]));
const missing = CHAIN.filter((n) => !byName.has(n));
if (missing.length) throw new Error(`cheatsheet: unknown chain skill ${missing.join(', ')}`);
const situational = skills.filter((s) => !CHAIN.includes(s.name)).map((s) => s.name);

const commandRows = {
  [COMMAND_NAME]: [
    'Start or continue a build. Routes your idea into the right stage.',
    `\`/${COMMAND_NAME} I want to build <your idea>\``,
  ],
  [IMPROVE_COMMAND_NAME]: [
    'Rewrite a rough prompt and show what changed. Does not run the task.',
    `\`/${IMPROVE_COMMAND_NAME} make the search better\``,
  ],
};

const row = (name) => {
  const s = byName.get(name);
  const when = trigger(s.description);
  return `| \`$${s.name}\` | ${summarise(s.description)} | ${when || '—'} |`;
};

const page = `# Cheat sheet

One page. Everything you type, and everything that can run.
Generated from the kit itself — if it is on this page, it is installed.

**${skills.length} skills · ${COMMANDS.length} commands · ${rules.length} always-on rules · demo day ${DEMO_DATE}**

---

## Commands

Type these in Bob. A command does nothing until you invoke it, so having both
costs you nothing.

| Command | What it does | Example |
| --- | --- | --- |
${COMMANDS.map((c) => `| \`/${c}\` | ${commandRows[c][0]} | ${commandRows[c][1]} |`).join('\n')}

> \`/${IMPROVE_COMMAND_NAME}\` **rewrites, it does not execute.**
> \`/${IMPROVE_COMMAND_NAME} build me a login system\` returns a better prompt for
> building a login system — not a login system. If it leaves a \`[FILL: …]\` blank,
> that is it refusing to invent your acceptance criteria.

---

## The build chain

\`\`\`
discover → grill → spec → implement → evals → demo rehearsal
\`\`\`

Each stage stops one expensive failure and makes the next one cheaper. Going
backwards is the process working.

| Skill | What it does | Reach for it when |
| --- | --- | --- |
${CHAIN.map(row).join('\n')}

---

## The ones you reach for when they apply

Not part of the chain. Use them the moment they are relevant.

| Skill | What it does | Reach for it when |
| --- | --- | --- |
${situational.map(row).join('\n')}

---

## The ${rules.length} always-on rules

These are not skills. They load on **every** turn, which is why they are short.

| Rule | What it enforces |
| --- | --- |
| \`00-evidence-over-memory\` | A factual claim needs a source retrieved this session |
| \`10-context-discipline\` | Line ranges, \`TASKS.md\`, subagents for wide reads |
| \`20-finish-the-work\` | Keep going when no decision is needed; stop before anything destructive |
| \`30-tests-and-coverage\` | Test first, watch it fail, never reach the gate by deleting assertions |

---

## Numbers worth knowing

| | |
| --- | --- |
| Context window | **${num(CONTEXT.capTokens)}** tokens |
| Compaction starts around | **${num(CONTEXT.compactionStartsAroundTokens)}** tokens |
| Reserved for the reply | about ${num(CONTEXT.reservedForReplyTokens)}, not counted in the used total |
| Coverage gate | **${COVERAGE_GATE}%** lines |
| Demo day | **${DEMO_DATE}** |

Compaction is lossy: it summarises away decisions you made early. The goal is
not to survive it — it is to never need it.

---

## If something is wrong

| Symptom | First thing to check |
| --- | --- |
| A skill never fires | Folder name must be lowercase-kebab-case and match \`name:\` in its front matter, or Bob skips it silently |
| Bob forgot what you agreed | Context, not the model. Put decisions in a file, not in the scrollback |
| Bob ignores an instruction you keep repeating | It belongs in \`AGENTS.md\` or a rule, not in every prompt. Ask \`/${IMPROVE_COMMAND_NAME}\` where to put it |
| You do not know how to word a request | \`/${IMPROVE_COMMAND_NAME}\` followed by your rough wording |
| You do not know what to do next | \`/${COMMAND_NAME}\` with no argument tells you where you are |

Run \`npx gat-install --verify\` to check the installation. Every line should say \`ok\`.
`;

for (const out of OUT) {
  await fs.writeFile(out, page, 'utf8');
  console.log(`wrote ${path.relative(process.cwd(), out)}`);
}
console.log(`  ${skills.length} skills, ${COMMANDS.length} commands, ${rules.length} rules`);
