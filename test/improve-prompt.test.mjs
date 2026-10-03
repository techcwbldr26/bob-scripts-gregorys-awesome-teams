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
import { repoRoot } from './helpers/svg-asset.mjs';

after(cleanup);

const commandFile = path.join(payloadRoot(), 'commands', `${IMPROVE_COMMAND_NAME}.md`);
const command = () => fs.readFile(commandFile, 'utf8');

// The method now lives in one place and ships three ways: the portable kit, the
// payload skill the Bob installer copies, and a flattened single-file version.
// `source` is the authored one.
const kitRoot = path.join(repoRoot, 'improve-prompt-kit');
const source = () => fs.readFile(path.join(kitRoot, 'SKILL.md'), 'utf8');

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
    const parsed = parseFrontMatter(await command());
    assert.ok(parsed.fields.description, 'a command with no description is invisible in the picker');
    assert.ok(parsed.fields['argument-hint'], 'students need to know what to type after the command');
  });

  it('renders with no unknown tokens', async () => {
    const { unknown } = render(await source());
    assert.deepEqual(unknown, []);
  });

  it('reads the student argument Bob passes in', async () => {
    assert.match(await command(), /\$1/, 'the command never sees the prompt without $1');
  });
});

describe('the command is a thin entry point to the shared skill', () => {
  it('delegates to the skill rather than restating the method', async () => {
    const text = await command();
    assert.match(text, /\$improve-prompt/, 'the command should invoke the skill');
    assert.ok(
      text.length < 2000,
      `the command is ${text.length} chars — the method belongs in the skill, not here`,
    );
  });

  it('still refuses to do the task, where a student will read it', async () => {
    assert.match(await command(), /\*\*Do not do the task\.\*\*/);
  });

  it('adds the project-specific part the portable skill cannot assume', async () => {
    const text = await command();
    for (const here of ['.bob/rules/', 'AGENTS.md', 'references/']) {
      assert.ok(text.includes(here), `the command should point at ${here}`);
    }
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

  it('handles an empty input instead of improving nothing', async () => {
    assert.match(await source(), /If no prompt was supplied/);
    assert.match(await command(), /If `\$1` is empty/);
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
      '### 4. What this saves in the context window',
    ]) {
      assert.ok(text.includes(heading), `missing section: ${heading}`);
    }
  });

  it('frames the saving as context, not as word count', async () => {
    // The saving comes from a well-engineered prompt carrying the right context,
    // so the session stays cheap. It is not about how much the student typed or
    // how much came back, and an edit that drifts back to word count fails here.
    const text = await source();
    assert.match(text, /Not words\. Context\./);
    for (const cause of ['Hunting', 'Clarification turns', 'Wrong work', 'Repetition']) {
      assert.ok(text.includes(`**${cause}.**`), `missing the ${cause} cost`);
    }
    assert.doesNotMatch(
      text,
      /\blonger than the original\b/,
      'the length of the prompt is not the lesson',
    );
  });

  it('names compaction as where the saving lands, without hardcoding a vendor number', async () => {
    // The portable skill runs in harnesses whose window is not Bob's, so it
    // argues from "finite and lossy" rather than from 270,000.
    const text = await source();
    assert.match(text, /compaction is\s+lossy/);
    assert.doesNotMatch(text, /270,000|190,000/, 'a portable skill cannot assume one vendor\u2019s cap');
  });

  it('routes standing instructions into the harness instead of the prompt', async () => {
    const text = await source();
    for (const home of [
      "the harness's always-on rules",
      '`AGENTS.md`',
      'a skill',
      'a glossary file',
    ]) {
      assert.ok(text.includes(home), `the promotion table should mention ${home}`);
    }
  });
});

describe('/improve-prompt only names things that exist', () => {
  it('names no skill that does not exist, in either the skill or the command', async () => {
    const names = new Set((await readSkills()).map((s) => s.name));
    for (const [label, text] of [['skill', await source()], ['command', await command()]]) {
      for (const [, cited] of text.matchAll(/\$([a-z0-9]+(?:-[a-z0-9]+)+)/g)) {
        assert.ok(names.has(cited), `$${cited} is cited in the ${label} but not in payload/skills/`);
      }
    }
  });

  it('is itself one of the payload skills', async () => {
    const names = (await readSkills()).map((s) => s.name);
    assert.ok(names.includes(IMPROVE_COMMAND_NAME), 'improve-prompt should be installable as a skill');
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

describe('the portable kit is complete and self-contained', () => {
  const kit = (rel) => fs.readFile(path.join(kitRoot, rel), 'utf8');

  it('ships the files a harness-agnostic skill needs', async () => {
    for (const rel of [
      'README.md',
      'AGENTS.md',
      'SKILL.md',
      'PROMPT.md',
      'examples/vague-to-specific.md',
      'examples/promote-to-harness.md',
      'references/prompt-engineering.md',
      'references/context-engineering.md',
    ]) {
      await assert.doesNotReject(fs.stat(path.join(kitRoot, rel)), `missing ${rel}`);
    }
  });

  it('carries the front matter a skill loader reads', async () => {
    const parsed = parseFrontMatter(await kit('SKILL.md'));
    assert.equal(parsed.fields.name, IMPROVE_COMMAND_NAME, 'name must match the folder');
    assert.ok(parsed.fields.description.length > 80, 'the description is what triggers the skill');
  });

  it('assumes no particular harness, model or vendor', async () => {
    // The point of the kit is that it drops into any tool. A Bob-only path or a
    // vendor name in the method would quietly break that promise.
    const text = await kit('SKILL.md');
    for (const leak of ['.bob/', 'Bob', 'Firecrawl', 'Bobcoin']) {
      assert.ok(!text.includes(leak), `"${leak}" ties the portable skill to one harness`);
    }
  });

  it('tells you how to install it in more than one tool', async () => {
    const readme = await kit('README.md');
    for (const tool of ['Bob', 'Claude Code', 'Cursor', 'no file support']) {
      assert.ok(readme.includes(tool), `the README should cover ${tool}`);
    }
  });

  it('has no dependency to install and nothing to run', async () => {
    const entries = await fs.readdir(kitRoot, { recursive: true });
    const notMarkdown = entries.filter((e) => e.includes('.') && !e.endsWith('.md'));
    assert.deepEqual(notMarkdown, [], 'the kit should be markdown and nothing else');
  });
});

describe('the three copies of the skill stay in step', () => {
  it('does not drift from tools/build-improve-prompt-kit.mjs', async () => {
    // Compared in-process rather than by re-running the generator: the payload
    // skill it writes is read by several other suites, and `node --test` runs
    // test files in parallel, so regenerating it here is a race.
    const { derive } = await import('../tools/build-improve-prompt-kit.mjs');
    const expected = await derive();
    assert.equal(
      await fs.readFile(path.join(kitRoot, 'PROMPT.md'), 'utf8'),
      expected.prompt,
      'run `npm run build:kit` and commit the result',
    );
    assert.equal(
      await fs.readFile(path.join(payloadRoot(), 'skills', 'improve-prompt', 'SKILL.md'), 'utf8'),
      expected.payload,
      'run `npm run build:kit` and commit the result',
    );
  });

  it('ships the payload skill as a byte-for-byte copy of the kit', async () => {
    const kitSource = await fs.readFile(path.join(kitRoot, 'SKILL.md'), 'utf8');
    const payloadSkill = await fs.readFile(
      path.join(payloadRoot(), 'skills', 'improve-prompt', 'SKILL.md'),
      'utf8',
    );
    assert.equal(payloadSkill, kitSource);
  });

  it('flattens into something pasteable, with the method intact', async () => {
    const flat = await fs.readFile(path.join(kitRoot, 'PROMPT.md'), 'utf8');
    assert.doesNotMatch(flat, /^---\n/, 'front matter is noise in a chat window');
    assert.match(flat, /Three rules that never bend/, 'the standing rules have to come along');
    assert.match(flat, /\*\*Do not do the task\.\*\*/);
    assert.doesNotMatch(flat, /references\/prompt-engineering\.md/, 'no links to files the reader lacks');
    assert.match(flat, /Now improve the prompt that follows/, 'it must end by handing over');
  });
});
