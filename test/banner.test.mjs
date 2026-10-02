/**
 * The README banner is a generated artefact, so it is tested as one: it must
 * match its generator, stay safe to serve, and keep telling the truth about the
 * payload it describes.
 */

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { COVERAGE_GATE, payloadRoot, readSkills } from '../src/payload.mjs';
import { cleanup } from './helpers.mjs';
import { describeGeneratedSvg, repoRoot } from './helpers/svg-asset.mjs';

after(cleanup);

const { svg } = describeGeneratedSvg({
  label: 'the banner',
  asset: 'assets/banner.svg',
  generator: 'tools/build-banner.mjs',
  minClasses: 50,
  maxKB: 80,
});

describe('the banner is in the README', () => {
  it('is the first thing in the file', async () => {
    const readme = await fs.readFile(path.join(repoRoot, 'README.md'), 'utf8');
    assert.ok(
      readme.trimStart().startsWith('<p align="center">'),
      'the banner should open the README',
    );
    assert.match(readme.slice(0, 1200), /assets\/banner\.svg/);
  });

  it('carries alt text describing all three acts', async () => {
    const readme = await fs.readFile(path.join(repoRoot, 'README.md'), 'utf8');
    const alt = /alt="([^"]+)"/.exec(readme)?.[1] ?? '';
    assert.ok(alt.length > 200, 'alt text should actually describe the diagram');
    for (const word of ['compaction', 'summary', 'skills', 'Firecrawl']) {
      assert.match(alt, new RegExp(word, 'i'), `alt text should mention ${word}`);
    }
  });
});

describe('the banner tells the truth about the payload', () => {
  it('quotes the real number of skills and rules', async () => {
    const source = await svg();
    const skills = (await readSkills()).length;
    const rules = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
      f.endsWith('.md'),
    ).length;
    assert.match(source, new RegExp(`${skills} skills`), `banner should say ${skills} skills`);
    assert.match(source, new RegExp(`${rules} always-on rules`));
  });

  it('quotes the real coverage gate', async () => {
    assert.match(await svg(), new RegExp(`${COVERAGE_GATE}% coverage gate`));
  });

  it("uses Bob's documented context numbers", async () => {
    const source = await svg();
    assert.match(source, /270k tokens/, 'the cap');
    assert.match(source, />190k</, 'the compaction threshold');
  });
});
