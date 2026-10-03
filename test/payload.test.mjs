import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { BOB_PATHS, COMMAND_NAME } from '../src/constants.mjs';
import {
  buildPlan,
  COVERAGE_GATE,
  isValidSkillFolder,
  listFiles,
  parseFrontMatter,
  payloadRoot,
  readSkills,
  render,
  skillTable,
  tokens,
} from '../src/payload.mjs';
import { cleanup, tempDir, write } from './helpers.mjs';

after(cleanup);

describe('render', () => {
  it('substitutes known tokens', () => {
    const { text, unknown } = render('cap is {{CONTEXT_CAP}}');
    assert.match(text, /cap is \d/);
    assert.deepEqual(unknown, []);
  });

  it('reports unknown tokens and leaves them in place', () => {
    const { text, unknown } = render('{{NOT_A_TOKEN}}');
    assert.equal(text, '{{NOT_A_TOKEN}}');
    assert.deepEqual(unknown, ['NOT_A_TOKEN']);
  });

  it('replaces every occurrence of a repeated token', () => {
    const { text } = render('{{COMMAND_NAME}} and {{COMMAND_NAME}}', { COMMAND_NAME: 'x' });
    assert.equal(text, 'x and x');
  });

  it('leaves text with no tokens untouched', () => {
    assert.equal(render('plain').text, 'plain');
  });

  it('coerces non-string input rather than throwing', () => {
    assert.equal(render(42).text, '42');
  });

  it('accepts a caller-supplied token table', () => {
    assert.equal(render('{{A}}', { A: 'B' }).text, 'B');
  });
});

describe('tokens', () => {
  it('formats the large numbers with thousands separators for readability', () => {
    const table = tokens();
    assert.equal(table.CONTEXT_CAP, '270,000');
    assert.equal(table.COMPACTION_START, '190,000');
    assert.equal(table.RESERVED_REPLY, '20,000');
  });

  it('carries the coverage gate as a string', () => {
    assert.equal(tokens().COVERAGE_GATE, String(COVERAGE_GATE));
  });

  it('holds the gate at 90, the project’s stated floor', () => {
    assert.equal(COVERAGE_GATE, 90);
  });
});

describe('parseFrontMatter', () => {
  it('reads name and description', () => {
    const result = parseFrontMatter('---\nname: a-skill\ndescription: Does a thing\n---\n\nBody');
    assert.equal(result.ok, true);
    assert.equal(result.fields.name, 'a-skill');
    assert.equal(result.fields.description, 'Does a thing');
  });

  it('handles CRLF line endings, which Windows checkouts produce', () => {
    const result = parseFrontMatter('---\r\nname: a\r\ndescription: b\r\n---\r\nBody');
    assert.equal(result.ok, true);
    assert.equal(result.fields.name, 'a');
  });

  it('rejects a file with no front matter', () => {
    assert.equal(parseFrontMatter('# Just markdown').error, 'missing front matter');
  });

  it('rejects front matter missing name or description', () => {
    assert.match(parseFrontMatter('---\ndescription: d\n---\n').error, /missing `name`/);
    assert.match(parseFrontMatter('---\nname: n\n---\n').error, /missing `description`/);
  });

  it('ignores lines that are not key-value pairs', () => {
    const result = parseFrontMatter('---\nname: n\n# a comment\n\ndescription: d\n---\n');
    assert.equal(result.ok, true);
  });
});

describe('isValidSkillFolder', () => {
  it('accepts lowercase kebab-case', () => {
    for (const name of ['a', 'skill', 'my-skill', 'a1-b2-c3']) {
      assert.ok(isValidSkillFolder(name), name);
    }
  });

  it('rejects the forms Bob silently skips', () => {
    for (const name of ['My-Skill', 'my_skill', 'my skill', '-leading', 'trailing-', 'double--hyphen', '', 'a'.repeat(65)]) {
      assert.ok(!isValidSkillFolder(name), JSON.stringify(name));
    }
  });

  it('accepts exactly 64 characters and rejects 65', () => {
    assert.ok(isValidSkillFolder('a'.repeat(64)));
    assert.ok(!isValidSkillFolder('a'.repeat(65)));
  });

  it('rejects non-strings', () => {
    assert.ok(!isValidSkillFolder(null));
    assert.ok(!isValidSkillFolder(7));
  });
});

describe('listFiles', () => {
  it('lists nested files as relative paths, sorted', async () => {
    const dir = await tempDir();
    await write(dir, 'b.md', 'b');
    await write(dir, 'a.md', 'a');
    await write(dir, 'sub/c.md', 'c');
    assert.deepEqual(await listFiles(dir), ['a.md', 'b.md', 'sub/c.md']);
  });

  it('returns an empty list for a missing directory', async () => {
    const dir = await tempDir();
    assert.deepEqual(await listFiles(path.join(dir, 'nope')), []);
  });

  it('rethrows an error that is not ENOENT', async () => {
    const dir = await tempDir();
    await write(dir, 'file.md', 'x');
    await assert.rejects(() => listFiles(path.join(dir, 'file.md')));
  });
});

describe('skillTable', () => {
  it('renders a markdown table with one row per skill', () => {
    const table = skillTable([
      { name: 'one', description: 'First' },
      { name: 'two', description: 'Second' },
    ]);
    assert.match(table, /^\| Skill \|/);
    assert.match(table, /\| `\$one` \| First \|/);
    assert.equal(table.split('\n').length, 4);
  });

  it('renders a header-only table for no skills', () => {
    assert.equal(skillTable([]).split('\n').length, 2);
  });
});

describe('readSkills (the real payload)', () => {
  it('finds every shipped skill with no validation problems', async () => {
    const skills = await readSkills();
    assert.ok(skills.length >= 9, `expected at least 9 skills, found ${skills.length}`);
    for (const skill of skills) {
      assert.deepEqual(skill.problems, [], `${skill.folder} has problems`);
    }
  });

  it('gives every skill a front-matter name matching its folder', async () => {
    for (const skill of await readSkills()) {
      assert.equal(skill.name, skill.folder);
    }
  });

  it('writes descriptions that tell Bob when to fire, not just what the skill is', async () => {
    for (const skill of await readSkills()) {
      assert.ok(
        skill.description.length >= 60,
        `${skill.folder}: description is too short for Bob to route on`,
      );
      assert.match(
        skill.description,
        /\bUse\b|\bwhen\b/i,
        `${skill.folder}: description does not say when to use it`,
      );
    }
  });

  it('ships the two adapted Matt Pocock skills with attribution in the body', async () => {
    const skills = await readSkills();
    for (const name of ['grill-with-docs', 'wizard']) {
      const skill = skills.find((s) => s.folder === name);
      assert.ok(skill, `${name} is missing`);
      assert.match(skill.source, /Matt Pocock/, `${name} must credit the original`);
      assert.match(skill.source, /MIT/, `${name} must name the licence`);
    }
  });
});

describe('buildPlan (the real payload)', () => {
  it('builds a complete, problem-free plan', async () => {
    const plan = await buildPlan();
    assert.deepEqual(plan.problems, []);
    assert.deepEqual(plan.unknownTokens, [], 'every {{TOKEN}} in the payload is known');
    assert.ok(plan.entries.length >= 30);
  });

  it('leaves no unrendered token in any output file', async () => {
    for (const entry of (await buildPlan()).entries) {
      assert.doesNotMatch(entry.contents, /\{\{[A-Z0-9_]+\}\}/, `${entry.to} has an unrendered token`);
    }
  });

  it('routes the two shared files through the managed path and everything else as owned', async () => {
    const plan = await buildPlan();
    const managed = plan.entries.filter((e) => e.kind === 'managed').map((e) => e.to);
    assert.deepEqual(managed.sort(), [BOB_PATHS.agents, BOB_PATHS.skillsIndex].sort());
    assert.ok(plan.entries.filter((e) => e.kind === 'owned').length >= 28);
  });

  it('places the slash command at the filename Bob derives the command name from', async () => {
    const plan = await buildPlan();
    const paths = plan.entries.map((e) => e.to);
    assert.ok(paths.includes(`${BOB_PATHS.commands}/${COMMAND_NAME}.md`));
  });

  it('places every skill at .bob/skills/<name>/SKILL.md', async () => {
    const plan = await buildPlan();
    const skillFiles = plan.entries.filter((e) => e.to.startsWith(`${BOB_PATHS.skills}/`));
    assert.ok(skillFiles.length >= 9);
    for (const entry of skillFiles) {
      assert.match(entry.to, /^\.bob\/skills\/[a-z0-9-]+\/SKILL\.md$/, entry.to);
    }
  });

  it('ships both docs folders', async () => {
    const paths = (await buildPlan()).entries.map((e) => e.to);
    assert.ok(paths.some((p) => p.startsWith(`${BOB_PATHS.examples}/`)));
    assert.ok(paths.some((p) => p.startsWith(`${BOB_PATHS.references}/`)));
  });

  it('never ships a literal API key', async () => {
    for (const entry of (await buildPlan()).entries) {
      assert.doesNotMatch(entry.contents, /fc-[0-9a-f]{16}/, `${entry.to} looks like it contains a real key`);
    }
  });

  it('reports a problem instead of installing a skill Bob would silently skip', async () => {
    const dir = await tempDir();
    await write(dir, 'AGENTS.block.md', 'a');
    await write(dir, 'SKILLS.block.md', '{{SKILL_TABLE}}');
    await write(dir, 'CHEATSHEET.md', 'cheat sheet');
    await write(dir, 'skills/Bad_Name/SKILL.md', '---\nname: Bad_Name\ndescription: d\n---\nb');
    const plan = await buildPlan(dir);
    assert.equal(plan.problems.length >= 1, true);
    assert.match(plan.problems.join(' '), /kebab-case/);
  });

  it('reports a problem when a skill’s front-matter name does not match its folder', async () => {
    const dir = await tempDir();
    await write(dir, 'AGENTS.block.md', 'a');
    await write(dir, 'SKILLS.block.md', 'b');
    await write(dir, 'CHEATSHEET.md', 'cheat sheet');
    await write(dir, 'skills/real-name/SKILL.md', '---\nname: other-name\ndescription: d\n---\nb');
    const plan = await buildPlan(dir);
    assert.match(plan.problems.join(' '), /does not match the folder|does not match/);
  });
});

describe('payloadRoot', () => {
  it('points at a directory containing the shipped payload', async () => {
    const stat = await fs.stat(path.join(payloadRoot(), 'skills'));
    assert.ok(stat.isDirectory());
  });
});
