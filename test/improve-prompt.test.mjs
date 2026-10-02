/**
 * `/improve-prompt` rewrites a student's prompt instead of answering it.
 *
 * That distinction is the whole feature, and it is the one thing a plausible
 * edit could quietly break: a command file that reads like an instruction to
 * help would get a login system built rather than a better prompt written. So
 * the behavioural contract is asserted here, alongside the usual checks that
 * the command installs, renders, and names only things that exist.
 */

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { BOB_PATHS, COMMANDS, IMPROVE_COMMAND_NAME } from '../src/constants.mjs';
import { buildPlan, parseFrontMatter, payloadRoot, readSkills, render } from '../src/payload.mjs';
import { cleanup } from './helpers.mjs';

after(cleanup);

const commandFile = path.join(payloadRoot(), 'commands', `${IMPROVE_COMMAND_NAME}.md`);
const source = () => fs.readFile(commandFile, 'utf8');

describe('/improve-prompt is installed like a command', () => {
  it('is listed in COMMANDS, so verify cannot miss it', () => {
    assert.ok(COMMANDS.includes(IMPROVE_COMMAND_NAME));
  });

  it('lands at the filename Bob derives the command name from', async () => {
    const plan = await buildPlan();
    const paths = plan.entries.map((e) => e.to);
    assert.ok(paths.includes(`${BOB_PATHS.commands}/${IMPROVE_COMMAND_NAME}.md`));
  });

  it('carries a description and an argument hint', async () => {
    const parsed = parseFrontMatter(await source());
    assert.ok(parsed.fields.description, 'a command with no description is invisible in the picker');
    assert.ok(parsed.fields['argument-hint'], 'students need to know what to type after the command');
  });

  it('renders with no unknown tokens', async () => {
    const { unknown } = render(await source());
    assert.deepEqual(unknown, []);
  });

  it('reads the student argument Bob passes in', async () => {
    assert.match(await source(), /\$1/, 'the command never sees the prompt without $1');
  });
});

describe('/improve-prompt rewrites the prompt rather than answering it', () => {
  it('states the do-not-execute rule, and states it early', async () => {
    const text = await source();
    assert.match(text, /\*\*Do not do the task\.\*\*/);
    // Early enough that it survives a skim, and an edit that buries it fails here.
    assert.ok(
      text.indexOf('Do not do the task') < text.length / 3,
      'the do-not-execute rule should be near the top, not a footnote',
    );
  });

  it('works the worked example through, so the rule is not abstract', async () => {
    assert.match(await source(), /login system/i);
  });

  it('handles an empty argument instead of improving nothing', async () => {
    assert.match(await source(), /If `\$1` is empty/);
  });
});

describe('/improve-prompt does not fabricate the parts only a student knows', () => {
  it('forbids inventing a requirement', async () => {
    assert.match(await source(), /\*\*Never invent a requirement\.\*\*/);
  });

  it('gives a visible placeholder to use instead', async () => {
    assert.match(await source(), /\[FILL:/);
  });

  it('refuses to claim a token number it did not estimate', async () => {
    assert.match(await source(), /Do not claim a token number you did not estimate/);
  });
});

describe('/improve-prompt teaches the structure, not just the answer', () => {
  it('produces the four sections the student is meant to learn from', async () => {
    const text = await source();
    for (const heading of [
      '### 1. The improved prompt',
      '### 2. What changed',
      '### 3. What does not belong in a prompt at all',
      '### 4. What it costs',
    ]) {
      assert.ok(text.includes(heading), `missing section: ${heading}`);
    }
  });

  it('is honest that a better prompt is often a longer one', async () => {
    // Students who are told to "save tokens" will otherwise read brevity as the
    // goal and strip out the acceptance criteria that make the prompt work.
    assert.match(await source(), /often \*\*longer\*\*/);
    assert.match(await source(), /Length is not the cost that matters/);
  });

  it('routes standing instructions into the harness instead of the prompt', async () => {
    const text = await source();
    for (const home of ['`.bob/rules/`', '`AGENTS.md`', '`.bob/skills/`', '`GLOSSARY.md`']) {
      assert.ok(text.includes(home), `the promotion table should mention ${home}`);
    }
  });
});

describe('/improve-prompt only names things that exist', () => {
  it('cites skills that are actually in the payload', async () => {
    const text = await source();
    const names = new Set((await readSkills()).map((s) => s.name));
    const cited = [...text.matchAll(/\$([a-z0-9]+(?:-[a-z0-9]+)+)/g)].map((m) => m[1]);
    assert.ok(cited.length > 0, 'the command should point at least one skill');
    for (const name of cited) {
      assert.ok(names.has(name), `$${name} is cited but not in payload/skills/`);
    }
  });

  it('cites rules that are actually in the payload', async () => {
    const text = await source();
    const rules = (await fs.readdir(path.join(payloadRoot(), 'rules')))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    for (const [, cited] of text.matchAll(/`(\d{2}-[a-z-]+)`/g)) {
      assert.ok(rules.includes(cited), `rule ${cited} is cited but not in payload/rules/`);
    }
  });

  it('cites reference and example files that are actually in the payload', async () => {
    const text = await source();
    for (const [, dir, file] of text.matchAll(/`(references|examples)\/([a-z0-9-]+\.md)`/g)) {
      const full = path.join(payloadRoot(), dir, file);
      await assert.doesNotReject(fs.stat(full), `${dir}/${file} is cited but does not exist`);
    }
  });
});

describe('the student can find the command', () => {
  it('is named in AGENTS.md, which loads on every turn', async () => {
    const text = await fs.readFile(path.join(payloadRoot(), 'AGENTS.block.md'), 'utf8');
    assert.match(render(text).text, new RegExp(`/${IMPROVE_COMMAND_NAME}`));
  });

  it('is named in the SKILLS.md index', async () => {
    const text = await fs.readFile(path.join(payloadRoot(), 'SKILLS.block.md'), 'utf8');
    assert.match(render(text).text, new RegExp(`/${IMPROVE_COMMAND_NAME}`));
  });

  it('costs AGENTS.md only a line, since that file is paid for every turn', async () => {
    const text = await fs.readFile(path.join(payloadRoot(), 'AGENTS.block.md'), 'utf8');
    const mention = text.split('\n').filter((l) => l.includes('{{IMPROVE_COMMAND}}'));
    assert.equal(mention.length, 1, 'one line is the budget for this in the always-on file');
  });
});
