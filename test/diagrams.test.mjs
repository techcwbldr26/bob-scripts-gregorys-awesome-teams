/**
 * The two wiki diagrams, held to the same bar as the README banner.
 *
 * The wiki is a separate git repository with no CI of its own, so these are the
 * only checks that run over the images it embeds. On top of the shared
 * guarantees, each diagram has to keep agreeing with the thing it describes:
 * the build flow with the wiki page's six stages, and the skills diagram with
 * the skills actually in the payload.
 */

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { after, describe, it } from 'node:test';

const runNode = (args) => promisify(execFile)(process.execPath, args, { cwd: repoRoot });

import { COMMANDS } from '../src/constants.mjs';
import { COVERAGE_GATE, payloadRoot, readSkills } from '../src/payload.mjs';
import { cleanup } from './helpers.mjs';
import { describeGeneratedSvg, repoRoot } from './helpers/svg-asset.mjs';

after(cleanup);

const RAW = 'https://raw.githubusercontent.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/main/assets';
const wikiPage = (name) => fs.readFile(path.join(repoRoot, 'wiki', `${name}.md`), 'utf8');

/* ------------------------------------------------------------------ *
 * The build flow
 * ------------------------------------------------------------------ */
const flow = describeGeneratedSvg({
  label: 'the build-flow diagram',
  asset: 'assets/build-flow.svg',
  generator: 'tools/build-flow-diagram.mjs',
  minClasses: 40,
  maxKB: 80,
});

const STAGES = ['discover', 'grill', 'spec', 'implement', 'evals', 'demo rehearsal'];

describe('the build-flow diagram agrees with its wiki page', () => {
  it('names all six stages, in order', async () => {
    const source = await flow.svg();
    let at = -1;
    for (const stage of STAGES) {
      const next = source.indexOf(`>${stage}<`, at + 1);
      assert.notEqual(next, -1, `the diagram should name the "${stage}" stage`);
      assert.ok(next > at, `"${stage}" should come after the stage before it`);
      at = next;
    }
  });

  it('names the skill that runs each stage', async () => {
    const source = await flow.svg();
    const skills = new Set((await readSkills()).map((s) => s.name));
    const named = [...source.matchAll(/>\$([a-z0-9-]+)</g)].map((m) => m[1]);
    assert.equal(named.length, STAGES.length, 'one skill a stage');
    for (const name of named) {
      assert.ok(skills.has(name), `$${name} is on the diagram but not in the payload`);
    }
  });

  it('quotes the real coverage gate', async () => {
    assert.match(await flow.svg(), new RegExp(`${COVERAGE_GATE}% coverage gate`));
  });

  it('is embedded at the top of The Build Flow', async () => {
    const page = await wikiPage('The-Build-Flow');
    assert.ok(
      page.trimStart().split('\n')[0].startsWith('# '),
      'the page should still open with its heading',
    );
    assert.ok(
      page.slice(0, 900).includes(`${RAW}/build-flow.svg`),
      'the diagram should be embedded from main, since the wiki is a separate repository',
    );
    const alt = /!\[([^\]]+)\]/.exec(page)?.[1] ?? '';
    assert.ok(alt.length > 60, 'the embed needs alt text, not a filename');
  });
});

/* ------------------------------------------------------------------ *
 * The chain strip
 * ------------------------------------------------------------------ */
const chain = describeGeneratedSvg({
  label: 'the chain strip',
  asset: 'assets/chain.svg',
  generator: 'tools/build-chain-diagram.mjs',
  minClasses: 30,
  maxKB: 80,
});

describe('the chain strip says the same thing as the Build Flow page', () => {
  it('names all six stages, in order', async () => {
    const source = await chain.svg();
    let at = -1;
    for (const stage of STAGES) {
      const next = source.indexOf(`>${stage}<`, at + 1);
      assert.notEqual(next, -1, `the strip should name the "${stage}" stage`);
      assert.ok(next > at, `"${stage}" should come after the stage before it`);
      at = next;
    }
  });

  it('names one real skill per stage', async () => {
    const source = await chain.svg();
    const skills = new Set((await readSkills()).map((s) => s.name));
    const named = [...source.matchAll(/>\$([a-z0-9-]+)</g)].map((m) => m[1]);
    assert.equal(named.length, STAGES.length, 'one skill a stage');
    for (const name of named) {
      assert.ok(skills.has(name), `$${name} is on the strip but not in the payload`);
    }
  });

  it('sits under the Build Flow banner on the page', async () => {
    const page = await wikiPage('The-Build-Flow');
    const flowAt = page.indexOf(`${RAW}/build-flow.svg`);
    const chainAt = page.indexOf(`${RAW}/chain.svg`);
    assert.notEqual(chainAt, -1, 'the chain strip should be embedded');
    assert.ok(chainAt > flowAt, 'the strip belongs under the banner, not above it');
  });
});

/* ------------------------------------------------------------------ *
 * The skills reference
 * ------------------------------------------------------------------ */
const skillsSvg = describeGeneratedSvg({
  label: 'the skills diagram',
  asset: 'assets/skills.svg',
  generator: 'tools/build-skills-diagram.mjs',
  minClasses: 40,
  maxKB: 80,
});

describe('the skills diagram agrees with the payload', () => {
  it('shows a card for every skill, and no others', async () => {
    const source = await skillsSvg.svg();
    const payload = (await readSkills()).map((s) => s.name).sort();
    const shown = [...source.matchAll(/>\$([a-z0-9-]+)</g)].map((m) => m[1]);
    // $build-evals is also named in the "one body loads" callout.
    assert.deepEqual([...new Set(shown)].sort(), payload);
  });

  it('counts the skills it actually shows', async () => {
    const source = await skillsSvg.svg();
    const n = (await readSkills()).length;
    assert.match(source, new RegExp(`>${n} skills<`), `the readout should end at ${n}`);
    assert.match(source, new RegExp(`all ${n} descriptions`));
    assert.match(source, new RegExp(`all ${n} skill bodies`));
  });

  it('quotes description and body sizes measured from the payload', async () => {
    const source = await skillsSvg.svg();
    const skills = await readSkills();
    const tok = (s) => Math.round(s.length / 4);
    const descTotal = skills.reduce((n, s) => n + tok(s.description), 0);
    const bodyTotal = skills.reduce((n, s) => n + tok(s.source), 0);

    assert.match(source, new RegExp(`≈ ${descTotal.toLocaleString('en-US')} tokens`));
    assert.match(source, new RegExp(`≈ ${bodyTotal.toLocaleString('en-US')} tokens`));

    for (const s of skills) {
      assert.ok(
        source.includes(`description ≈ ${tok(s.description)}  ·  body ≈ ${tok(s.source).toLocaleString('en-US')}`),
        `${s.name}'s measured sizes are missing from the diagram`,
      );
    }
  });

  it('says how it estimates a token, rather than implying a count', async () => {
    const source = await skillsSvg.svg();
    assert.match(source, /characters ÷ 4/, 'the estimate has to be on the diagram');
  });

  it('quotes the real number of always-on rules', async () => {
    const rules = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
      f.endsWith('.md'),
    ).length;
    assert.match(await skillsSvg.svg(), new RegExp(`the ${rules} rules in \\.bob/rules/`));
  });

  it('is embedded at the top of Skills Reference', async () => {
    const page = await wikiPage('Skills-Reference');
    assert.ok(page.trimStart().split('\n')[0].startsWith('# '));
    assert.ok(
      page.slice(0, 900).includes(`${RAW}/skills.svg`),
      'the diagram should be embedded from main, since the wiki is a separate repository',
    );
    const alt = /!\[([^\]]+)\]/.exec(page)?.[1] ?? '';
    assert.ok(alt.length > 60, 'the embed needs alt text, not a filename');
  });
});

/* ------------------------------------------------------------------ *
 * Both are buildable the way the README says
 * ------------------------------------------------------------------ */
describe('the diagrams are wired into the build', () => {
  it('has an npm script for each generator', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts['build:banner'], 'node tools/build-banner.mjs');
    assert.equal(pkg.scripts['build:flow'], 'node tools/build-flow-diagram.mjs');
    assert.equal(pkg.scripts['build:skills'], 'node tools/build-skills-diagram.mjs');
    assert.equal(pkg.scripts['build:chain'], 'node tools/build-chain-diagram.mjs');
    assert.equal(pkg.scripts['build:kit'], 'node tools/build-improve-prompt-kit.mjs');
    assert.ok(pkg.scripts['build:svg'], 'one script should rebuild all three');
  });
});

/* ------------------------------------------------------------------ *
 * The one-page cheat sheet
 * ------------------------------------------------------------------ */
describe('the cheat sheet is generated and current', () => {
  const sheet = () => fs.readFile(path.join(repoRoot, 'CHEATSHEET.md'), 'utf8');

  it('does not drift from tools/build-cheatsheet.mjs', async () => {
    const before = await sheet();
    await runNode([path.join(repoRoot, 'tools', 'build-cheatsheet.mjs')]);
    assert.equal(await sheet(), before, 'run `npm run build:cheatsheet` and commit the result');
  });

  it('is the same page in the repo and in the wiki', async () => {
    assert.equal(await fs.readFile(path.join(repoRoot, 'wiki', 'Cheat-Sheet.md'), 'utf8'), await sheet());
  });

  it('lists every command and every skill the kit installs', async () => {
    const text = await sheet();
    for (const name of COMMANDS) {
      assert.ok(text.includes(`\`/${name}\``), `the cheat sheet should list /${name}`);
    }
    for (const skill of await readSkills()) {
      assert.ok(text.includes(`\`$${skill.name}\``), `the cheat sheet should list $${skill.name}`);
    }
  });

  it('counts what it actually lists', async () => {
    const text = await sheet();
    const skills = (await readSkills()).length;
    assert.match(text, new RegExp(`\\\\*\\\\*${skills} skills · ${COMMANDS.length} commands`));
  });

  it('fits on one page, which is the entire point', async () => {
    const lines = (await sheet()).split('\n').length;
    assert.ok(lines < 140, `the cheat sheet is ${lines} lines — it has stopped being one page`);
  });
});
