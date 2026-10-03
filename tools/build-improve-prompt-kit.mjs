#!/usr/bin/env node
/**
 * Keeps the three copies of the improve-prompt skill in step.
 *
 * `improve-prompt-kit/SKILL.md` is the one authored file. Two things are
 * derived from it, because a skill that disagrees with itself across harnesses
 * is worse than one that only exists in a single place:
 *
 *   improve-prompt-kit/PROMPT.md          everything flattened into one block,
 *                                         for a chat window with no file support
 *   payload/skills/improve-prompt/SKILL.md the copy the Bob installer ships
 *
 * The relative paths in the skill body (`references/…`, `examples/…`) resolve in
 * both homes: the kit carries its own, and a Bob project gets the payload's.
 *
 * Run `npm run build:kit`. A test fails if a committed copy drifts.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = path.join(root, 'improve-prompt-kit');

export const SOURCE = path.join(KIT, 'SKILL.md');
export const DERIVED = {
  prompt: path.join(KIT, 'PROMPT.md'),
  payload: path.join(root, 'payload', 'skills', 'improve-prompt', 'SKILL.md'),
};

/** Split a markdown file into its YAML front matter and its body. */
export function split(source) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('improve-prompt-kit/SKILL.md has no front matter');
  return { front: match[1], body: match[2].trimStart() };
}

/**
 * The single-block version, for pasting into a chat with no file support.
 *
 * The agent instructions are folded in, since there is no `AGENTS.md` for the
 * harness to load, and the file references are dropped rather than left
 * pointing at files the reader does not have.
 */
export function flatten({ body, agents }) {
  const standing = agents
    .slice(agents.indexOf('## Three rules that never bend'))
    .split('\n## ')
    .slice(0, 1)
    .join('')
    .trim();

  const withoutFileRefs = body
    .replace(
      /\n+Deeper material, when asked:[\s\S]*$/,
      '\n',
    )
    .replace(
      / \(Vendors disagree on this —\n  see `references\/prompt-engineering\.md` — which is itself the lesson: test it\.\)/,
      ' (Vendors disagree on\n  this, which is itself the lesson: test it on your own task.)',
    )
    .trimEnd();

  return `# improve-prompt — single-file version

Paste this whole file into any chat, then paste your rough prompt underneath it.

This is the no-files fallback. If your tool can read a skill folder, use
\`SKILL.md\` instead — it carries the same method plus worked examples and
references.

---

${standing}

---

${withoutFileRefs}

---

**Now improve the prompt that follows.**
`;
}

/**
 * What the two derived files should contain.
 *
 * Exported and side-effect free so the drift test can compare without writing:
 * `payload/skills/improve-prompt/SKILL.md` is read by several suites, and
 * `node --test` runs files in parallel, so a test that regenerates it can be
 * read mid-write by another suite.
 */
export async function derive() {
  const source = await fs.readFile(SOURCE, 'utf8');
  const agents = await fs.readFile(path.join(KIT, 'AGENTS.md'), 'utf8');
  const { body } = split(source);
  return { prompt: flatten({ body, agents }), payload: source };
}

// Only write when run as a script, not when imported by a test.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { prompt, payload } = await derive();
  await fs.writeFile(DERIVED.prompt, prompt, 'utf8');
  await fs.mkdir(path.dirname(DERIVED.payload), { recursive: true });
  await fs.writeFile(DERIVED.payload, payload, 'utf8');
  console.log('wrote improve-prompt-kit/PROMPT.md');
  console.log('wrote payload/skills/improve-prompt/SKILL.md');
  console.log(`  source ${(payload.length / 1024).toFixed(1)} KB`);
}
