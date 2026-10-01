/** Orchestration: take a plan and put it on disk. */

import path from 'node:path';

import { BOB_PATHS, FIRECRAWL_SERVER_KEY } from './constants.mjs';
import { readIfExists, upsertManagedFile, writeOwnedFile } from './fsx.mjs';
import { mergeFirecrawl } from './mcp.mjs';
import { buildPlan, payloadRoot } from './payload.mjs';

/**
 * Install the kit into a target project directory.
 *
 * @param {object} options
 * @param {string} options.target project root to install into
 * @param {string} [options.root] payload directory
 * @param {'hosted'|'oauth'|'keyless'|'local'} [options.mcpMode]
 * @param {boolean} [options.force] overwrite owned files the student edited
 * @param {boolean} [options.dryRun] report without writing
 */
export async function install({
  target,
  root = payloadRoot(),
  mcpMode = 'hosted',
  force = false,
  dryRun = false,
} = {}) {
  if (!target) throw new TypeError('install() requires a target directory');

  const plan = await buildPlan(root);

  // A payload that fails its own validation is never shipped: a skill with a bad
  // folder name or missing description is silently ignored by Bob, which is far
  // harder to debug than a refused install.
  if (plan.problems.length > 0) {
    return { ok: false, errors: plan.problems, results: [], dryRun };
  }
  if (plan.unknownTokens.length > 0) {
    return {
      ok: false,
      errors: plan.unknownTokens.map((t) => `unknown payload token {{${t}}}`),
      results: [],
      dryRun,
    };
  }

  const results = [];
  const errors = [];

  for (const entry of plan.entries) {
    const dest = path.join(target, entry.to);
    if (dryRun) {
      results.push({ path: entry.to, action: 'planned', kind: entry.kind });
      continue;
    }
    const action =
      entry.kind === 'managed'
        ? await upsertManagedFile(dest, entry.contents)
        : await writeOwnedFile(dest, entry.contents, { force });
    results.push({ path: entry.to, action, kind: entry.kind });
  }

  // MCP config is merged, so a student's other servers survive.
  const mcpPath = path.join(target, BOB_PATHS.mcp);
  const existing = await readIfExists(mcpPath);
  const merged = mergeFirecrawl(existing, { mode: mcpMode, force: true });

  if (!merged.ok) {
    errors.push(`${BOB_PATHS.mcp}: ${merged.error} — left untouched, fix it by hand`);
    results.push({ path: BOB_PATHS.mcp, action: 'failed', kind: 'merged' });
  } else if (dryRun) {
    results.push({ path: BOB_PATHS.mcp, action: 'planned', kind: 'merged' });
  } else {
    const action = await writeOwnedFile(mcpPath, merged.json, { force: true });
    results.push({
      path: BOB_PATHS.mcp,
      action: action === 'unchanged' ? 'unchanged' : merged.action,
      kind: 'merged',
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    results,
    dryRun,
    skills: plan.skills.map((s) => ({ name: s.name, description: s.description })),
    mcpMode,
    firecrawlServerKey: FIRECRAWL_SERVER_KEY,
  };
}

/** Group results by action, for a compact report. */
export function summarize(results) {
  const counts = Object.create(null);
  for (const r of results) counts[r.action] = (counts[r.action] ?? 0) + 1;
  return counts;
}
