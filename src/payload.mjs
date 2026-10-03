/**
 * Discovering, rendering and placing the payload.
 *
 * The payload lives as real markdown under `payload/` rather than as strings in
 * JavaScript, so it can be reviewed and diffed like the documentation it is.
 * Values that must stay in step with Bob's documented limits are written as
 * `{{TOKEN}}` and substituted here from `constants.mjs`.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOB_PATHS,
  COMMAND_NAME,
  CONTEXT,
  DEMO_DATE,
  FIRECRAWL_API_KEY_VAR,
  FIRECRAWL_SIGNUP_URL,
  IMPROVE_COMMAND_NAME,
} from './constants.mjs';

/** Line-coverage gate this project holds itself and its students to. */
export const COVERAGE_GATE = 90;

/** Absolute path to the repository's `payload/` directory. */
export function payloadRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'payload');
}

/** Token table used to render payload files. */
export function tokens() {
  const group = (n) => n.toLocaleString('en-US');
  return {
    DEMO_DATE,
    COMMAND_NAME,
    IMPROVE_COMMAND: IMPROVE_COMMAND_NAME,
    COVERAGE_GATE: String(COVERAGE_GATE),
    CONTEXT_CAP: group(CONTEXT.capTokens),
    COMPACTION_START: group(CONTEXT.compactionStartsAroundTokens),
    RESERVED_REPLY: group(CONTEXT.reservedForReplyTokens),
    FIRECRAWL_API_KEY_VAR,
    FIRECRAWL_SIGNUP_URL,
  };
}

/**
 * Replace every `{{TOKEN}}` with its value.
 * An unknown token is left as-is and reported, so a typo in the payload shows up
 * in tests rather than reaching a student's project.
 *
 * @param {string} text
 * @param {Record<string,string>} table
 * @returns {{text: string, unknown: string[]}}
 */
export function render(text, table = tokens()) {
  const unknown = [];
  const out = String(text).replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, name) => {
    if (Object.prototype.hasOwnProperty.call(table, name)) return table[name];
    unknown.push(name);
    return match;
  });
  return { text: out, unknown };
}

/** Pull `name` and `description` out of a SKILL.md front matter block. */
export function parseFrontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(source));
  if (!match) return { ok: false, fields: {}, error: 'missing front matter' };

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  if (!fields.name) return { ok: false, fields, error: 'front matter missing `name`' };
  if (!fields.description) return { ok: false, fields, error: 'front matter missing `description`' };
  return { ok: true, fields, error: null };
}

/**
 * Bob silently skips a skill folder whose name is not lowercase kebab-case or is
 * over 64 characters, so validate rather than discover it later.
 */
export function isValidSkillFolder(name) {
  return typeof name === 'string' && name.length <= 64 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/** Recursively list files under `dir`, as paths relative to it. */
export async function listFiles(dir, prefix = '') {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const out = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listFiles(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

/**
 * Read every skill in the payload and return its metadata, newest validation
 * errors included so the installer can refuse to ship a broken skill.
 */
export async function readSkills(root = payloadRoot()) {
  const skillsDir = path.join(root, 'skills');
  const folders = (await fs.readdir(skillsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const skills = [];
  for (const folder of folders) {
    const file = path.join(skillsDir, folder, 'SKILL.md');
    const source = await fs.readFile(file, 'utf8');
    const parsed = parseFrontMatter(source);
    const problems = [];
    if (!isValidSkillFolder(folder)) problems.push(`folder name "${folder}" is not lowercase kebab-case under 64 chars`);
    if (!parsed.ok) problems.push(parsed.error);
    else if (parsed.fields.name !== folder) problems.push(`front matter name "${parsed.fields.name}" does not match folder "${folder}"`);
    skills.push({
      folder,
      name: parsed.fields.name ?? folder,
      description: parsed.fields.description ?? '',
      source,
      problems,
    });
  }
  return skills;
}

/** Build the markdown table of installed skills for SKILLS.md. */
export function skillTable(skills) {
  const header = '| Skill | What it does and when it fires |\n| --- | --- |';
  const rows = skills.map((s) => `| \`$${s.name}\` | ${s.description} |`);
  return [header, ...rows].join('\n');
}

/**
 * Build the full plan of what will be written where.
 *
 * Returns entries of `{kind, from, to, contents}` where `kind` is `managed`
 * (spliced into a shared file) or `owned` (written whole).
 */
export async function buildPlan(root = payloadRoot()) {
  const skills = await readSkills(root);
  const problems = skills.flatMap((s) => s.problems.map((p) => `${s.folder}: ${p}`));
  const table = { ...tokens(), SKILL_TABLE: skillTable(skills) };
  const entries = [];
  const unknownTokens = new Set();

  const add = (kind, from, to, raw) => {
    const { text, unknown } = render(raw, table);
    unknown.forEach((u) => unknownTokens.add(u));
    entries.push({ kind, from, to, contents: text });
  };

  // Shared files: spliced, never overwritten.
  add(
    'managed',
    'AGENTS.block.md',
    BOB_PATHS.agents,
    await fs.readFile(path.join(root, 'AGENTS.block.md'), 'utf8'),
  );
  add(
    'managed',
    'SKILLS.block.md',
    BOB_PATHS.skillsIndex,
    await fs.readFile(path.join(root, 'SKILLS.block.md'), 'utf8'),
  );

  // Generated reference the kit owns outright. Overwriting it on reinstall is
  // correct: it is derived from the payload, so a student edit would be lost
  // the next time anyone regenerated it anyway.
  add(
    'owned',
    'CHEATSHEET.md',
    BOB_PATHS.cheatsheet,
    await fs.readFile(path.join(root, 'CHEATSHEET.md'), 'utf8'),
  );

  // Directories this kit owns.
  const dirs = [
    ['rules', BOB_PATHS.rules],
    ['commands', BOB_PATHS.commands],
    ['skills', BOB_PATHS.skills],
    ['examples', BOB_PATHS.examples],
    ['references', BOB_PATHS.references],
  ];
  for (const [src, dest] of dirs) {
    for (const rel of await listFiles(path.join(root, src))) {
      add(
        'owned',
        `${src}/${rel}`,
        `${dest}/${rel}`,
        await fs.readFile(path.join(root, src, rel), 'utf8'),
      );
    }
  }

  return { entries, skills, problems, unknownTokens: [...unknownTokens] };
}
