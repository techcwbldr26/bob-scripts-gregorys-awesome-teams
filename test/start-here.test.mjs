/**
 * START-HERE.md carries the one thing a non-technical student actually uses: a
 * prompt they paste into Bob. If it drifts from the real script names, paths or
 * commands, they are stuck with no way to tell what went wrong — so the parts
 * that must match reality are checked here.
 */

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = () => fs.readFile(path.join(repoRoot, 'START-HERE.md'), 'utf8');

/** The prompt itself: the single fenced block students copy. */
async function prompt() {
  const blocks = [...(await page()).matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]);
  assert.equal(blocks.length, 1, 'there must be exactly one prompt block to copy');
  return blocks[0];
}

describe('START-HERE.md is reachable', () => {
  it('exists', async () => {
    assert.ok((await fs.stat(path.join(repoRoot, 'START-HERE.md'))).isFile());
  });

  it('is linked from the top of the README', async () => {
    const readme = await fs.readFile(path.join(repoRoot, 'README.md'), 'utf8');
    assert.match(readme.slice(0, 2500), /START-HERE\.md/);
  });
});

describe('the prompt names things that actually exist', () => {
  it('references every platform script by its real filename', async () => {
    const text = await prompt();
    const scripts = (await fs.readdir(path.join(repoRoot, 'scripts'), { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name);
    for (const name of scripts) {
      assert.ok(text.includes(name), `the prompt should mention ${name}`);
    }
  });

  it('names no script that does not exist', async () => {
    const text = await prompt();
    for (const named of text.match(/install-[a-z0-9-]+\.(?:sh|ps1)/g) ?? []) {
      await fs.stat(path.join(repoRoot, 'scripts', named));
    }
  });

  it('uses the flags the scripts actually accept', async () => {
    const text = await prompt();
    for (const flag of ['--target', '--verify', '-Target', '-Verify']) {
      assert.ok(text.includes(flag), `the prompt should use ${flag}`);
    }
  });

  it('clones the repository this file lives in', async () => {
    assert.match(
      await prompt(),
      /github\.com\/techcwbldr26\/bob-scripts-gregorys-awesome-teams\.git/,
    );
  });

  it('quotes the slash command exactly as the payload installs it', async () => {
    const text = await prompt();
    const commands = await fs.readdir(path.join(repoRoot, 'payload', 'commands'));
    for (const file of commands) {
      assert.ok(text.includes(`/${file.replace(/\.md$/, '')}`));
    }
  });
});

describe('the prompt protects the student’s API key', () => {
  it('checks the key without reading the file', async () => {
    const text = await prompt();
    assert.match(text, /Do not open, print or quote \.env/);
    assert.match(text, /grep -qE/);
    assert.match(text, /Select-String/);
  });

  it('uses an unanchored pattern, so a CRLF .env still matches', async () => {
    // An anchored `$` fails on a .env saved by a Windows editor, and the student
    // is then told their key is missing when it is sitting right there.
    const text = await prompt();
    const patterns = text.match(/\^FIRECRAWL_API_KEY=fc-\[A-Za-z0-9_-\]\{8,\}\$?/g) ?? [];
    assert.ok(patterns.length >= 2, 'both platforms need the check');
    for (const p of patterns) {
      assert.ok(!p.endsWith('$'), `pattern ${p} is anchored and breaks on CRLF`);
    }
  });

  it('rejects the placeholder it tells the student to replace', async () => {
    const text = await prompt();
    assert.match(text, /FIRECRAWL_API_KEY=paste-your-key-here/);
    const re = /^FIRECRAWL_API_KEY=fc-[A-Za-z0-9_-]{8,}/;
    assert.equal(re.test('FIRECRAWL_API_KEY=paste-your-key-here'), false);
    assert.equal(re.test('FIRECRAWL_API_KEY=fc-0123456789abcdef'), true);
  });

  it('puts .env out of git before asking for the key', async () => {
    const text = await prompt();
    const gitignoreStep = text.indexOf('.gitignore');
    const keyStep = text.indexOf('firecrawl.dev/signup');
    assert.ok(gitignoreStep > 0 && keyStep > gitignoreStep, '.gitignore must come first');
  });

  it('forbids printing the key, more than once', async () => {
    const text = await prompt();
    const mentions = (text.match(/[Nn]ever print my API key/g) ?? []).length;
    assert.ok(mentions >= 2, 'say it at the top and again in the closing rules');
  });
});

describe('the prompt is written for someone who has never done this', () => {
  it('states what done means, and when to stop and ask', async () => {
    const text = await prompt();
    assert.match(text, /WHAT "DONE" MEANS/);
    assert.match(text, /STOP AND ASK ME FIRST IF/);
  });

  it('refuses to claim success without evidence', async () => {
    assert.match(await prompt(), /Never say a step worked without running something/);
  });

  it('asks before touching anything outside the project folder', async () => {
    assert.match(await prompt(), /without asking me first/);
  });

  it('covers all four platforms', async () => {
    const text = await prompt();
    for (const platform of ['Apple silicon', 'Intel', 'Linux', 'Windows']) {
      assert.ok(text.includes(platform), `missing ${platform}`);
    }
  });

  it('tells the student Node 24 is the floor', async () => {
    assert.match(await prompt(), /24 or later/);
  });
});
