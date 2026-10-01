/**
 * Post-install verification — the "doctor" a student runs when Bob is not
 * behaving. Every check maps to a documented silent-failure mode.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { BOB_PATHS, FIRECRAWL_SERVER_KEY, MANAGED_BEGIN } from './constants.mjs';
import { readIfExists } from './fsx.mjs';
import { isValidSkillFolder, parseFrontMatter } from './payload.mjs';

/** One check result. */
const check = (name, ok, detail) => ({ name, ok, detail });

/**
 * Verify an installed project.
 * @param {string} target project root
 */
export async function verify(target) {
  const checks = [];

  // AGENTS.md with our managed block present.
  const agents = await readIfExists(path.join(target, BOB_PATHS.agents));
  checks.push(
    agents === null
      ? check('AGENTS.md', false, 'missing — Bob has no project instructions to load')
      : check(
          'AGENTS.md',
          agents.includes(MANAGED_BEGIN),
          agents.includes(MANAGED_BEGIN)
            ? 'present, managed block found'
            : 'present but the managed block is missing — re-run the installer',
        ),
  );

  // SKILLS.md index.
  const skillsIndex = await readIfExists(path.join(target, BOB_PATHS.skillsIndex));
  checks.push(
    check('SKILLS.md', skillsIndex !== null, skillsIndex === null ? 'missing' : 'present'),
  );

  // Slash command.
  const commandFile = path.join(target, BOB_PATHS.commands, 'gregorys-awesome-teams.md');
  const command = await readIfExists(commandFile);
  checks.push(
    check(
      '/gregorys-awesome-teams command',
      command !== null,
      command === null
        ? `missing ${path.relative(target, commandFile)}`
        : 'installed',
    ),
  );

  // Skills: validate each the way Bob does, since Bob fails silently.
  const skillsDir = path.join(target, BOB_PATHS.skills);
  let folders = [];
  try {
    folders = (await fs.readdir(skillsDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    folders = [];
  }

  if (folders.length === 0) {
    checks.push(check('skills', false, `no skills found in ${BOB_PATHS.skills}`));
  } else {
    const broken = [];
    for (const folder of folders) {
      if (!isValidSkillFolder(folder)) {
        broken.push(`${folder}: folder name would be silently skipped by Bob`);
        continue;
      }
      const source = await readIfExists(path.join(skillsDir, folder, 'SKILL.md'));
      if (source === null) {
        broken.push(`${folder}: no SKILL.md`);
        continue;
      }
      const parsed = parseFrontMatter(source);
      if (!parsed.ok) broken.push(`${folder}: ${parsed.error}`);
      else if (parsed.fields.name !== folder) {
        broken.push(`${folder}: name "${parsed.fields.name}" does not match the folder`);
      }
    }
    checks.push(
      check(
        'skills',
        broken.length === 0,
        broken.length === 0
          ? `${folders.length} skills valid`
          : broken.join('; '),
      ),
    );
  }

  // Rules.
  let ruleCount = 0;
  try {
    ruleCount = (await fs.readdir(path.join(target, BOB_PATHS.rules))).filter((f) =>
      f.endsWith('.md'),
    ).length;
  } catch {
    ruleCount = 0;
  }
  checks.push(check('rules', ruleCount > 0, `${ruleCount} rule files in ${BOB_PATHS.rules}`));

  // MCP config with the Firecrawl server registered and reachable-looking.
  const rawMcp = await readIfExists(path.join(target, BOB_PATHS.mcp));
  if (rawMcp === null) {
    checks.push(check('Firecrawl MCP', false, `${BOB_PATHS.mcp} is missing`));
  } else {
    let parsedMcp = null;
    try {
      parsedMcp = JSON.parse(rawMcp);
    } catch (error) {
      checks.push(check('Firecrawl MCP', false, `${BOB_PATHS.mcp} is not valid JSON: ${error.message}`));
    }
    if (parsedMcp) {
      const server = parsedMcp?.mcpServers?.[FIRECRAWL_SERVER_KEY];
      if (!server) {
        checks.push(check('Firecrawl MCP', false, `no "${FIRECRAWL_SERVER_KEY}" server in ${BOB_PATHS.mcp}`));
      } else {
        const transport = server.command ? 'stdio' : server.url || server.httpURL ? 'streamable-http' : null;
        checks.push(
          check(
            'Firecrawl MCP',
            transport !== null,
            transport
              ? `registered over ${transport}`
              : 'registered but has neither `command` nor a URL — Bob cannot start it',
          ),
        );
      }
    }
  }

  // Docs folders.
  for (const [label, rel] of [
    ['examples/', BOB_PATHS.examples],
    ['references/', BOB_PATHS.references],
  ]) {
    let count = 0;
    try {
      count = (await fs.readdir(path.join(target, rel))).length;
    } catch {
      count = 0;
    }
    checks.push(check(label, count > 0, `${count} files`));
  }

  return { ok: checks.every((c) => c.ok), checks };
}

/** Does any check require the student to do something outside this installer? */
export function manualFollowUps({ mcpMode = 'hosted' } = {}) {
  if (mcpMode === 'keyless') {
    return [
      'Keyless Firecrawl exposes only search, scrape and parse, and is rate limited. Alexandria needs a key.',
      'Get a free key at https://www.firecrawl.dev/signup, then re-run with --mode=hosted.',
    ];
  }
  if (mcpMode === 'oauth') {
    return ['Run /mcp in Bob and complete the Firecrawl browser sign-in.'];
  }
  return [
    'Store your Firecrawl key in Bob so it never reaches the repo:',
    '    /manage-secrets set FIRECRAWL_API_KEY fc-your-key-here',
    'Then restart Bob and run /mcp to confirm firecrawl is connected.',
  ];
}
