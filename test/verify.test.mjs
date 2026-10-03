import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { BOB_PATHS } from '../src/constants.mjs';
import { install } from '../src/install.mjs';
import { manualFollowUps, verify } from '../src/verify.mjs';
import { cleanup, tempDir, write } from './helpers.mjs';

after(cleanup);

/** Find a named check in a verify() result. */
const find = (result, name) => result.checks.find((c) => c.name === name);

describe('verify', () => {
  it('passes every check on a freshly installed project', async () => {
    const target = await tempDir();
    await install({ target });
    const result = await verify(target);
    assert.equal(result.ok, true, result.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail}`).join('; '));
  });

  it('fails every check on an empty directory', async () => {
    const result = await verify(await tempDir());
    assert.equal(result.ok, false);
    assert.ok(result.checks.length >= 8);
    assert.ok(result.checks.every((c) => !c.ok), 'nothing should pass');
  });

  it('notices an AGENTS.md that lost its managed block', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, BOB_PATHS.agents, '# I replaced the whole file\n');

    const check = find(await verify(target), 'AGENTS.md');
    assert.equal(check.ok, false);
    assert.match(check.detail, /managed block is missing/);
  });

  it('notices a skill folder Bob would silently skip', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, `${BOB_PATHS.skills}/Bad_Name/SKILL.md`, '---\nname: x\ndescription: y\n---\nz');

    const check = find(await verify(target), 'skills');
    assert.equal(check.ok, false);
    assert.match(check.detail, /silently skipped/);
  });

  it('notices a skill folder with no SKILL.md', async () => {
    const target = await tempDir();
    await install({ target });
    await fs.mkdir(path.join(target, BOB_PATHS.skills, 'empty-skill'), { recursive: true });

    const check = find(await verify(target), 'skills');
    assert.equal(check.ok, false);
    assert.match(check.detail, /no SKILL\.md/);
  });

  it('notices a skill with broken front matter', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, `${BOB_PATHS.skills}/no-front-matter/SKILL.md`, 'just text');

    const check = find(await verify(target), 'skills');
    assert.equal(check.ok, false);
    assert.match(check.detail, /front matter/);
  });

  it('notices a skill whose name does not match its folder', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, `${BOB_PATHS.skills}/folder-name/SKILL.md`, '---\nname: different\ndescription: d\n---\nx');

    const check = find(await verify(target), 'skills');
    assert.equal(check.ok, false);
    assert.match(check.detail, /does not match the folder/);
  });

  it('notices mcp.json that is not valid JSON', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, BOB_PATHS.mcp, '{broken');

    const check = find(await verify(target), 'Firecrawl MCP');
    assert.equal(check.ok, false);
    assert.match(check.detail, /not valid JSON/);
  });

  it('notices mcp.json with no firecrawl server', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, BOB_PATHS.mcp, JSON.stringify({ mcpServers: { other: {} } }));

    const check = find(await verify(target), 'Firecrawl MCP');
    assert.equal(check.ok, false);
    assert.match(check.detail, /no "firecrawl" server/);
  });

  it('notices a firecrawl server Bob could not start', async () => {
    const target = await tempDir();
    await install({ target });
    await write(target, BOB_PATHS.mcp, JSON.stringify({ mcpServers: { firecrawl: { timeout: 1 } } }));

    const check = find(await verify(target), 'Firecrawl MCP');
    assert.equal(check.ok, false);
    assert.match(check.detail, /neither `command` nor a URL/);
  });

  it('recognises a stdio firecrawl server as valid', async () => {
    const target = await tempDir();
    await install({ target, mcpMode: 'local' });
    const check = find(await verify(target), 'Firecrawl MCP');
    assert.equal(check.ok, true);
    assert.match(check.detail, /stdio/);
  });

  it('notices a missing mcp.json', async () => {
    const target = await tempDir();
    await install({ target });
    await fs.rm(path.join(target, BOB_PATHS.mcp));

    const check = find(await verify(target), 'Firecrawl MCP');
    assert.equal(check.ok, false);
    assert.match(check.detail, /missing/);
  });

  it('notices a missing slash command', async () => {
    const target = await tempDir();
    await install({ target });
    await fs.rm(path.join(target, BOB_PATHS.commands, 'gregorys-awesome-teams.md'));

    const check = find(await verify(target), '/gregorys-awesome-teams command');
    assert.equal(check.ok, false);
  });

  it('notices a missing cheat sheet', async () => {
    const target = await tempDir();
    await install({ target });
    await fs.rm(path.join(target, BOB_PATHS.cheatsheet));

    const check = find(await verify(target), 'CHEATSHEET.md');
    assert.equal(check.ok, false);
    assert.match(check.detail, /missing/);
  });

  it('notices missing rules and docs folders', async () => {
    const target = await tempDir();
    await install({ target });
    await fs.rm(path.join(target, BOB_PATHS.rules), { recursive: true });
    await fs.rm(path.join(target, BOB_PATHS.examples), { recursive: true });
    await fs.rm(path.join(target, BOB_PATHS.references), { recursive: true });

    const result = await verify(target);
    assert.equal(find(result, 'rules').ok, false);
    assert.equal(find(result, 'examples/').ok, false);
    assert.equal(find(result, 'references/').ok, false);
  });
});

describe('manualFollowUps', () => {
  it('tells a hosted-mode student to store the secret in Bob', () => {
    const steps = manualFollowUps({ mcpMode: 'hosted' }).join('\n');
    assert.match(steps, /manage-secrets set FIRECRAWL_API_KEY/);
  });

  it('defaults to hosted guidance', () => {
    assert.deepEqual(manualFollowUps(), manualFollowUps({ mcpMode: 'hosted' }));
    assert.deepEqual(manualFollowUps({}), manualFollowUps({ mcpMode: 'hosted' }));
  });

  it('warns a keyless student about the reduced tool surface and Alexandria', () => {
    const steps = manualFollowUps({ mcpMode: 'keyless' }).join('\n');
    assert.match(steps, /rate limited/);
    assert.match(steps, /Alexandria needs a key/);
  });

  it('sends an oauth student to the browser sign-in', () => {
    assert.match(manualFollowUps({ mcpMode: 'oauth' }).join('\n'), /sign-in/);
  });

  it('gives local mode the same secret guidance as hosted', () => {
    assert.deepEqual(manualFollowUps({ mcpMode: 'local' }), manualFollowUps({ mcpMode: 'hosted' }));
  });
});
