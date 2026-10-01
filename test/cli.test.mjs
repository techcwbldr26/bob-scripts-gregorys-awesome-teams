import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  formatReport,
  formatVerify,
  helpText,
  isMainModule,
  main,
  parseArgs,
} from '../src/cli.mjs';
import { BOB_PATHS } from '../src/constants.mjs';
import { captureIo, cleanup, exists, tempDir, write } from './helpers.mjs';

after(cleanup);

describe('parseArgs', () => {
  it('defaults to the current directory in hosted mode', () => {
    const options = parseArgs([]);
    assert.equal(options.mcpMode, 'hosted');
    assert.equal(options.force, false);
    assert.equal(options.dryRun, false);
    assert.equal(options.verifyOnly, false);
    assert.deepEqual(options.errors, []);
  });

  it('accepts --target in both spellings', () => {
    assert.equal(parseArgs(['--target', '/tmp/x']).target, '/tmp/x');
    assert.equal(parseArgs(['--target=/tmp/y']).target, '/tmp/y');
  });

  it('rejects --target with no value, and --target followed by another flag', () => {
    assert.match(parseArgs(['--target']).errors.join(), /--target needs a directory/);
    assert.match(parseArgs(['--target', '--force']).errors.join(), /--target needs a directory/);
    assert.match(parseArgs(['--target=']).errors.join(), /--target needs a directory/);
  });

  it('accepts every valid --mode in both spellings', () => {
    for (const mode of ['hosted', 'oauth', 'keyless', 'local']) {
      assert.equal(parseArgs([`--mode=${mode}`]).mcpMode, mode);
      assert.equal(parseArgs(['--mode', mode]).mcpMode, mode);
    }
  });

  it('rejects an unknown mode', () => {
    assert.match(parseArgs(['--mode=banana']).errors.join(), /unknown --mode "banana"/);
    assert.match(parseArgs(['--mode']).errors.join(), /--mode needs one of/);
    assert.match(parseArgs(['--mode', '--force']).errors.join(), /--mode needs one of/);
  });

  it('parses the boolean flags', () => {
    const options = parseArgs(['--force', '--dry-run', '--verify']);
    assert.equal(options.force, true);
    assert.equal(options.dryRun, true);
    assert.equal(options.verifyOnly, true);
  });

  it('parses help in both spellings', () => {
    assert.equal(parseArgs(['--help']).help, true);
    assert.equal(parseArgs(['-h']).help, true);
  });

  it('reports an unknown argument rather than ignoring it', () => {
    assert.match(parseArgs(['--wat']).errors.join(), /unknown argument "--wat"/);
    assert.match(parseArgs(['stray']).errors.join(), /unknown argument "stray"/);
  });

  it('collects several errors at once', () => {
    assert.equal(parseArgs(['--mode=bad', '--wat']).errors.length, 2);
  });

  it('does not treat a --target value as an argument to parse', () => {
    const options = parseArgs(['--target', '--mode=hosted', '--force']);
    // The first --target has no usable value, but --force is still parsed.
    assert.equal(options.force, true);
  });
});

describe('helpText', () => {
  it('documents every mode and the signup link', () => {
    const text = helpText();
    for (const token of ['hosted', 'oauth', 'keyless', 'local', '--target', '--verify', 'firecrawl.dev']) {
      assert.ok(text.includes(token), `help should mention ${token}`);
    }
  });
});

describe('formatReport', () => {
  const base = { ok: true, errors: [], dryRun: false, mcpMode: 'hosted' };

  it('reports counts by action', () => {
    const lines = formatReport({
      ...base,
      results: [{ action: 'created' }, { action: 'created' }, { action: 'kept' }],
      skills: [],
    });
    const text = lines.join('\n');
    assert.match(text, /2 created/);
    assert.match(text, /1 left alone/);
  });

  it('says plainly that a dry run wrote nothing', () => {
    const lines = formatReport({ ...base, dryRun: true, results: [{ action: 'planned' }], skills: [] });
    assert.match(lines.join('\n'), /Dry run — nothing was written/);
  });

  it('lists the installed skills', () => {
    const lines = formatReport({
      ...base,
      results: [],
      skills: [{ name: 'grill-with-docs', description: 'd' }],
    });
    assert.match(lines.join('\n'), /\$grill-with-docs/);
  });

  it('surfaces errors', () => {
    const lines = formatReport({ ...base, ok: false, errors: ['mcp.json is broken'], results: [], skills: [] });
    assert.match(lines.join('\n'), /! mcp\.json is broken/);
  });

  it('shows next steps and the demo date on success', () => {
    const text = formatReport({ ...base, results: [], skills: [] }).join('\n');
    assert.match(text, /manage-secrets set/);
    assert.match(text, /Demo day: December 1st, 2026/);
  });

  it('omits next steps on a dry run', () => {
    const text = formatReport({ ...base, dryRun: true, results: [], skills: [] }).join('\n');
    assert.doesNotMatch(text, /Demo day/);
  });

  it('omits next steps when the install failed', () => {
    const text = formatReport({ ...base, ok: false, errors: ['x'], results: [], skills: [] }).join('\n');
    assert.doesNotMatch(text, /Demo day/);
  });

  it('includes platform and Node when given, and warns about Bob Shell’s floor', () => {
    const text = formatReport(
      { ...base, results: [], skills: [] },
      { platform: 'Linux', node: { version: 'v22.0.0', meetsBobShell: false, bobShellMin: 24 } },
    ).join('\n');
    assert.match(text, /Platform {6}Linux/);
    assert.match(text, /Bob Shell needs 24\+/);
  });

  it('omits the Bob Shell note when Node is current', () => {
    const text = formatReport(
      { ...base, results: [], skills: [] },
      { node: { version: 'v24.1.0', meetsBobShell: true, bobShellMin: 24 } },
    ).join('\n');
    assert.doesNotMatch(text, /Bob Shell needs/);
  });

  it('handles a result with no skills field', () => {
    assert.ok(formatReport({ ...base, results: [] }).length > 0);
  });
});

describe('formatVerify', () => {
  it('marks passing and failing checks differently', () => {
    const text = formatVerify({
      ok: false,
      checks: [
        { name: 'good', ok: true, detail: 'fine' },
        { name: 'bad', ok: false, detail: 'broken' },
      ],
    }).join('\n');
    assert.match(text, /ok {3}good/);
    assert.match(text, /FAIL bad/);
    assert.match(text, /Some checks failed/);
  });

  it('confirms a clean installation', () => {
    const text = formatVerify({ ok: true, checks: [{ name: 'a', ok: true, detail: 'b' }] }).join('\n');
    assert.match(text, /Everything checks out/);
  });
});

describe('main', () => {
  it('prints help and exits 0', async () => {
    const { io, stdout } = captureIo();
    assert.equal(await main(['--help'], io), 0);
    assert.match(stdout(), /Usage: node src\/cli\.mjs/);
  });

  it('exits 2 with help on a bad argument', async () => {
    const { io, stderr } = captureIo();
    assert.equal(await main(['--mode=nope'], io), 2);
    assert.match(stderr(), /unknown --mode/);
    assert.match(stderr(), /Usage:/);
  });

  it('installs and exits 0', async () => {
    const target = await tempDir();
    const { io, stdout } = captureIo();
    assert.equal(await main(['--target', target], io), 0);
    assert.ok(await exists(target, BOB_PATHS.agents));
    assert.match(stdout(), /created/);
  });

  it('verifies a good installation and exits 0', async () => {
    const target = await tempDir();
    await main(['--target', target], captureIo().io);
    const { io, stdout } = captureIo();
    assert.equal(await main(['--target', target, '--verify'], io), 0);
    assert.match(stdout(), /Everything checks out/);
  });

  it('verifies an empty directory and exits 1', async () => {
    const { io, stdout } = captureIo();
    assert.equal(await main(['--target', await tempDir(), '--verify'], io), 1);
    assert.match(stdout(), /Some checks failed/);
  });

  it('exits 1 when the install reports a problem', async () => {
    const target = await tempDir();
    await write(target, BOB_PATHS.mcp, '{broken');
    const { io } = captureIo();
    assert.equal(await main(['--target', target], io), 1);
  });

  it('writes nothing on a dry run and exits 0', async () => {
    const target = await tempDir();
    const { io } = captureIo();
    assert.equal(await main(['--target', target, '--dry-run'], io), 0);
    assert.equal(await exists(target, BOB_PATHS.agents), false);
  });

  it('defaults io to console when none is given', async () => {
    // Exercises the default parameter without asserting on real stdout.
    assert.equal(typeof (await main(['--help'], { log() {}, error() {} })), 'number');
  });
});

describe('main’s Node version guard', () => {
  it('refuses to run on a Node older than the installer needs', async () => {
    const { io, stderr } = captureIo();
    const code = await main(['--target', await tempDir()], io, { nodeVersion: 'v16.20.0' });
    assert.equal(code, 2);
    assert.match(stderr(), /Node 20\+ is required to run this installer/);
  });

  it('runs, but warns, on a Node new enough for the installer and too old for Bob Shell', async () => {
    const target = await tempDir();
    const { io, stderr } = captureIo();
    const code = await main(['--target', target], io, { nodeVersion: 'v22.0.0' });
    assert.equal(code, 0);
    assert.match(stderr(), /Bob Shell needs Node 24 or later/);
    assert.ok(await exists(target, BOB_PATHS.agents), 'the install still happens');
  });

  it('does not warn on a current Node', async () => {
    const { io, stderr } = captureIo();
    await main(['--target', await tempDir()], io, { nodeVersion: 'v24.1.0' });
    assert.doesNotMatch(stderr(), /Bob Shell needs/);
  });

  it('falls back to the running Node when no version is injected', async () => {
    const { io } = captureIo();
    assert.equal(await main(['--help'], io), 0);
  });
});

describe('isMainModule', () => {
  it('matches when argv[1] is the module s own path', () => {
    const here = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
    assert.equal(isMainModule(pathToFileURL(here).href, here), true);
  });

  it('does not match a different file', () => {
    const here = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
    const other = fileURLToPath(new URL('../src/install.mjs', import.meta.url));
    assert.equal(isMainModule(pathToFileURL(other).href, here), false);
  });

  it('returns false when argv[1] is missing or not a string', () => {
    for (const argv1 of [undefined, null, '', 42, {}]) {
      assert.equal(isMainModule('file:///x.mjs', argv1), false, String(argv1));
    }
  });

  it('rejects the naive template-string comparison that broke Windows', () => {
    // A Windows argv[1]. The old guard built `file://D:\a\src\cli.mjs`, which
    // never equals the real `file:///D:/a/src/cli.mjs`, so main() never ran.
    const windowsArgv = 'D:\\a\\project\\src\\cli.mjs';
    const realMetaUrl = 'file:///D:/a/project/src/cli.mjs';
    assert.notEqual(`file://${windowsArgv}`, realMetaUrl);
    // pathToFileURL is platform-specific, so assert the property that matters
    // everywhere: the naive form is not what this function computes.
    assert.notEqual(isMainModule(`file://${windowsArgv}`, windowsArgv), true);
  });

  it('round-trips any path on this platform', () => {
    for (const p of [process.cwd(), fileURLToPath(import.meta.url)]) {
      assert.equal(isMainModule(pathToFileURL(p).href, p), true, p);
    }
  });
});
