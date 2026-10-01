#!/usr/bin/env node
/**
 * CLI entry point. The four platform scripts all end up here, so the behaviour
 * students get is identical on every operating system.
 */

import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  COMMAND_NAME,
  DEMO_DATE,
  FIRECRAWL_KEYS_URL,
  FIRECRAWL_SIGNUP_URL,
} from './constants.mjs';
import { install, summarize } from './install.mjs';
import { checkNode, detectPlatform, platformLabel } from './platform.mjs';
import { manualFollowUps, verify } from './verify.mjs';

const MCP_MODES = new Set(['hosted', 'oauth', 'keyless', 'local']);

/**
 * Parse argv into options. Pure, so it is cheap to test exhaustively.
 * @param {string[]} argv arguments after `node cli.mjs`
 */
export function parseArgs(argv) {
  const options = {
    target: process.cwd(),
    mcpMode: 'hosted',
    force: false,
    dryRun: false,
    verifyOnly: false,
    help: false,
    errors: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--verify') options.verifyOnly = true;
    else if (arg === '--target') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) options.errors.push('--target needs a directory');
      else {
        options.target = next;
        i += 1;
      }
    } else if (arg.startsWith('--target=')) {
      const value = arg.slice('--target='.length);
      if (value === '') options.errors.push('--target needs a directory');
      else options.target = value;
    } else if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length);
      if (MCP_MODES.has(value)) options.mcpMode = value;
      else options.errors.push(`unknown --mode "${value}" (expected: ${[...MCP_MODES].join(', ')})`);
    } else if (arg === '--mode') {
      const next = argv[i + 1];
      if (next !== undefined && MCP_MODES.has(next)) {
        options.mcpMode = next;
        i += 1;
      } else options.errors.push(`--mode needs one of: ${[...MCP_MODES].join(', ')}`);
    } else options.errors.push(`unknown argument "${arg}"`);
  }

  return options;
}

export const helpText = () => `Gregory's Awesome Teams — setup for the IBM Bob harness

Usage: node src/cli.mjs [options]

Options:
  --target <dir>   Project to install into (default: current directory)
  --mode <mode>    Firecrawl connection: hosted (default), oauth, keyless, local
  --force          Overwrite kit files a student has edited
  --dry-run        Report what would be written, write nothing
  --verify         Check an existing installation and exit
  -h, --help       Show this

Firecrawl modes:
  hosted   Hosted MCP with your free API key, read from Bob's encrypted store.
  oauth    Hosted MCP with browser sign-in; no key stored anywhere.
  keyless  No key. Search, scrape and parse only, rate limited. No Alexandria.
  local    Run the open-source server locally over stdio via npx.

Free Firecrawl key: ${FIRECRAWL_SIGNUP_URL}
Existing keys:      ${FIRECRAWL_KEYS_URL}`;

/** Render a report. Returns lines so tests can assert on them. */
export function formatReport(result, { platform, node } = {}) {
  const lines = [];
  const counts = summarize(result.results);

  lines.push('');
  lines.push("Gregory's Awesome Teams");
  if (platform) lines.push(`  Platform      ${platform}`);
  if (node) lines.push(`  Node          ${node.version}${node.meetsBobShell ? '' : ` (Bob Shell needs ${node.bobShellMin}+)`}`);
  lines.push(`  Firecrawl     ${result.mcpMode}`);
  lines.push('');

  if (result.dryRun) lines.push('Dry run — nothing was written.');

  const order = ['created', 'updated', 'added', 'unchanged', 'kept', 'planned', 'failed'];
  const described = {
    created: 'created',
    updated: 'updated',
    added: 'added to .bob/mcp.json',
    unchanged: 'already current',
    kept: 'left alone (you have edited these; --force to overwrite)',
    planned: 'would be written',
    failed: 'FAILED',
  };
  for (const key of order) {
    if (counts[key]) lines.push(`  ${String(counts[key]).padStart(3)} ${described[key]}`);
  }

  if (result.skills?.length) {
    lines.push('');
    lines.push(`Skills installed (${result.skills.length}):`);
    for (const s of result.skills) lines.push(`  $${s.name}`);
  }

  if (result.errors.length) {
    lines.push('');
    lines.push('Problems:');
    for (const e of result.errors) lines.push(`  ! ${e}`);
  }

  if (!result.dryRun && result.ok) {
    lines.push('');
    lines.push('Next:');
    for (const step of manualFollowUps({ mcpMode: result.mcpMode })) lines.push(`  ${step}`);
    lines.push('');
    lines.push(`Then type /${COMMAND_NAME} in Bob and describe your idea.`);
    lines.push(`Demo day: ${DEMO_DATE}.`);
  }

  lines.push('');
  return lines;
}

/** Render a verification report. */
export function formatVerify({ ok, checks }) {
  const lines = ['', 'Checking the installation', ''];
  for (const c of checks) {
    lines.push(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(28)} ${c.detail}`);
  }
  lines.push('');
  lines.push(ok ? 'Everything checks out.' : 'Some checks failed. Re-run the installer, then check again.');
  lines.push('');
  return lines;
}

/**
 * Main. Returns an exit code rather than calling process.exit, so it is testable.
 * @param {string[]} argv
 * @param {{log: Function, error: Function}} io
 * @param {{nodeVersion?: string}} [env] injectable, so the version guard is testable
 */
export async function main(argv = [], io = console, env = {}) {
  const options = parseArgs(argv);

  if (options.help) {
    io.log(helpText());
    return 0;
  }
  if (options.errors.length > 0) {
    for (const e of options.errors) io.error(`error: ${e}`);
    io.error('');
    io.error(helpText());
    return 2;
  }

  const node = checkNode(env.nodeVersion ?? process.version);
  if (!node.canRunInstaller) {
    io.error(`error: Node ${node.installerMin}+ is required to run this installer; found ${node.version}.`);
    return 2;
  }

  if (options.verifyOnly) {
    const result = await verify(options.target);
    for (const line of formatVerify(result)) io.log(line);
    return result.ok ? 0 : 1;
  }

  const platformId = detectPlatform(process.platform, process.arch);
  const result = await install({
    target: options.target,
    mcpMode: options.mcpMode,
    force: options.force,
    dryRun: options.dryRun,
  });

  for (const line of formatReport(result, { platform: platformLabel(platformId), node })) {
    io.log(line);
  }

  if (!node.meetsBobShell) {
    io.error(`warning: Bob Shell needs Node ${node.bobShellMin} or later; you have ${node.version}.`);
  }

  return result.ok ? 0 : 1;
}

/**
 * Was this module run directly, rather than imported?
 *
 * The obvious form, `import.meta.url === \`file://${process.argv[1]}\``, is
 * broken on Windows and silently so: `process.argv[1]` is `D:\\a\\src\\cli.mjs`,
 * which concatenates to `file://D:\\a\\src\\cli.mjs`, while `import.meta.url` is
 * `file:///D:/a/src/cli.mjs`. They never match, so the CLI did nothing at all
 * on Windows and exited 0 -- an installer that silently installed nothing.
 * `pathToFileURL` handles the drive letter and separators properly.
 *
 * @param {string} metaUrl `import.meta.url` of the module
 * @param {string|undefined} argv1 `process.argv[1]`
 */
export function isMainModule(metaUrl, argv1) {
  if (typeof argv1 !== 'string' || argv1 === '') return false;
  try {
    return metaUrl === pathToFileURL(argv1).href;
  } catch {
    return false;
  }
}

// Only run when invoked directly, never when imported by a test.
if (isMainModule(import.meta.url, process.argv[1])) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`error: ${error.message}`);
      process.exit(1);
    });
}
