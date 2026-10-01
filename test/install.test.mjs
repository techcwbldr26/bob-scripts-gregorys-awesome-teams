import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { BOB_PATHS } from '../src/constants.mjs';
import { install, summarize } from '../src/install.mjs';
import { cleanup, exists, read, tempDir, write } from './helpers.mjs';

after(cleanup);

describe('install', () => {
  it('refuses to run without a target', async () => {
    await assert.rejects(() => install({}), TypeError);
    await assert.rejects(() => install(), TypeError);
  });

  it('installs the whole kit into an empty project', async () => {
    const target = await tempDir();
    const result = await install({ target });

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);

    for (const rel of [
      BOB_PATHS.agents,
      BOB_PATHS.skillsIndex,
      BOB_PATHS.mcp,
      `${BOB_PATHS.commands}/gregorys-awesome-teams.md`,
      `${BOB_PATHS.skills}/grill-with-docs/SKILL.md`,
      `${BOB_PATHS.rules}/00-evidence-over-memory.md`,
      `${BOB_PATHS.examples}/wizard-template.sh`,
      `${BOB_PATHS.references}/firecrawl-playbook.md`,
    ]) {
      assert.ok(await exists(target, rel), `${rel} should exist`);
    }
  });

  it('writes a valid, Bob-shaped mcp.json', async () => {
    const target = await tempDir();
    await install({ target });
    const config = JSON.parse(await read(target, BOB_PATHS.mcp));
    assert.ok(config.mcpServers.firecrawl);
    assert.equal(config.mcpServers.firecrawl.type, 'streamable-http');
  });

  it('is idempotent: a second run changes nothing', async () => {
    const target = await tempDir();
    const first = await install({ target });
    const second = await install({ target });

    assert.equal(second.ok, true);
    const counts = summarize(second.results);
    assert.equal(counts.unchanged, first.results.length, 'every file reported unchanged');
    assert.equal(counts.created, undefined);
    assert.equal(counts.updated, undefined);
  });

  it('writes nothing on a dry run', async () => {
    const target = await tempDir();
    const result = await install({ target, dryRun: true });

    assert.equal(result.ok, true);
    assert.equal(result.dryRun, true);
    assert.ok(result.results.every((r) => r.action === 'planned'));
    assert.equal(await exists(target, BOB_PATHS.agents), false);
    assert.equal(await exists(target, BOB_PATHS.mcp), false);
  });

  it('preserves a student’s existing AGENTS.md content', async () => {
    const target = await tempDir();
    await write(target, 'AGENTS.md', '# Team rules\n\nUse British spelling.\n');
    await install({ target });

    const agents = await read(target, 'AGENTS.md');
    assert.ok(agents.includes('Use British spelling.'));
    assert.ok(agents.includes("Gregory's Awesome Teams"));
  });

  it('preserves other MCP servers already configured', async () => {
    const target = await tempDir();
    await write(
      target,
      BOB_PATHS.mcp,
      JSON.stringify({ mcpServers: { watsonx: { command: 'uvx', args: ['wxo'] } } }, null, 2),
    );
    await install({ target });

    const config = JSON.parse(await read(target, BOB_PATHS.mcp));
    assert.deepEqual(config.mcpServers.watsonx, { command: 'uvx', args: ['wxo'] });
    assert.ok(config.mcpServers.firecrawl);
  });

  it('leaves a kit file the student edited alone, and says so', async () => {
    const target = await tempDir();
    await install({ target });
    const rulePath = `${BOB_PATHS.rules}/00-evidence-over-memory.md`;
    await write(target, rulePath, 'I rewrote this rule myself.\n');

    const result = await install({ target });
    assert.equal(await read(target, rulePath), 'I rewrote this rule myself.\n');
    assert.ok(result.results.some((r) => r.path === rulePath && r.action === 'kept'));
  });

  it('overwrites an edited kit file when forced', async () => {
    const target = await tempDir();
    await install({ target });
    const rulePath = `${BOB_PATHS.rules}/00-evidence-over-memory.md`;
    await write(target, rulePath, 'mine\n');

    await install({ target, force: true });
    assert.notEqual(await read(target, rulePath), 'mine\n');
  });

  it('reports a broken mcp.json without destroying it', async () => {
    const target = await tempDir();
    await write(target, BOB_PATHS.mcp, '{ this is not json');

    const result = await install({ target });
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /invalid JSON/);
    assert.equal(await read(target, BOB_PATHS.mcp), '{ this is not json');
  });

  it('still installs the markdown payload when mcp.json is broken', async () => {
    const target = await tempDir();
    await write(target, BOB_PATHS.mcp, 'broken');
    await install({ target });
    assert.ok(await exists(target, BOB_PATHS.agents), 'the rest of the kit still lands');
  });

  it('honours each Firecrawl mode', async () => {
    for (const [mode, assertion] of [
      ['hosted', (s) => assert.ok(s.headers.Authorization)],
      ['oauth', (s) => assert.equal(s.headers, undefined)],
      ['keyless', (s) => assert.equal(s.headers, undefined)],
      ['local', (s) => assert.equal(s.command, 'npx')],
    ]) {
      const target = await tempDir();
      const result = await install({ target, mcpMode: mode });
      assert.equal(result.mcpMode, mode);
      assertion(JSON.parse(await read(target, BOB_PATHS.mcp)).mcpServers.firecrawl);
    }
  });

  it('reports the installed skills back to the caller', async () => {
    const target = await tempDir();
    const result = await install({ target });
    assert.ok(result.skills.length >= 9);
    for (const skill of result.skills) {
      assert.ok(skill.name && skill.description);
    }
  });

  it('refuses to install a payload that fails its own validation', async () => {
    const target = await tempDir();
    const root = await tempDir();
    await write(root, 'AGENTS.block.md', 'a');
    await write(root, 'SKILLS.block.md', 'b');
    await write(root, 'skills/BAD_NAME/SKILL.md', '---\nname: BAD_NAME\ndescription: d\n---\nx');

    const result = await install({ target, root });
    assert.equal(result.ok, false);
    assert.equal(result.results.length, 0, 'nothing is written when the payload is invalid');
    assert.equal(await exists(target, BOB_PATHS.agents), false);
  });

  it('refuses to install a payload containing an unknown token', async () => {
    const target = await tempDir();
    const root = await tempDir();
    await write(root, 'AGENTS.block.md', 'cap is {{NOT_A_REAL_TOKEN}}');
    await write(root, 'SKILLS.block.md', 'b');
    await write(root, 'skills/good-skill/SKILL.md', '---\nname: good-skill\ndescription: d\n---\nx');

    const result = await install({ target, root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /unknown payload token \{\{NOT_A_REAL_TOKEN\}\}/);
  });
});

describe('summarize', () => {
  it('counts actions', () => {
    // summarize() returns a null-prototype object, so compare entries rather
    // than using deepEqual against a literal.
    assert.deepEqual(
      Object.entries(summarize([{ action: 'created' }, { action: 'created' }, { action: 'kept' }])),
      [['created', 2], ['kept', 1]],
    );
  });

  it('returns an empty tally for no results', () => {
    assert.deepEqual(Object.entries(summarize([])), []);
  });

  it('has a null prototype, so an action named "toString" cannot break the count', () => {
    assert.equal(Object.getPrototypeOf(summarize([])), null);
  });
});
