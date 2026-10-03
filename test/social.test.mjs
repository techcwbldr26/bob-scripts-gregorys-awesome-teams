/**
 * The social preview card.
 *
 * This is the only image on the project that a link preview ever shows, and it
 * is the one artefact nothing else guards: the wiki has no CI, and GitHub emits
 * no Open Graph tags for wiki pages at all, so a mistake here is invisible until
 * someone shares the repository and a stale card comes back from a cache that
 * will hold it for days.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { after, describe, it } from 'node:test';

import { COMMANDS, DEMO_DATE } from '../src/constants.mjs';
import { payloadRoot, readSkills } from '../src/payload.mjs';
import { cleanup } from './helpers.mjs';
import { repoRoot } from './helpers/svg-asset.mjs';

after(cleanup);

const runNode = (args) => promisify(execFile)(process.execPath, args, { cwd: repoRoot });

const SVG = path.join(repoRoot, 'assets', 'social-card.svg');
const PNG = path.join(repoRoot, 'assets', 'social-card.png');
const HASH = `${PNG}.sha256`;

const svg = () => fs.readFile(SVG, 'utf8');

describe('assets/social-card.svg', () => {
  it('does not drift from tools/build-social-card.mjs', async () => {
    const before = await svg();
    await runNode([path.join(repoRoot, 'tools', 'build-social-card.mjs')]);
    assert.equal(await svg(), before, 'run `npm run build:social` and commit the result');
  });

  it('is exactly the size GitHub asks a social preview to be', async () => {
    const source = await svg();
    assert.match(source, /width="1280" height="640"/);
    assert.match(source, /viewBox="0 0 1280 640"/);
  });

  it('carries no animation, because a preview crawler renders a single frame', async () => {
    const source = await svg();
    assert.ok(!source.includes('@keyframes'), 'the card must be static');
    assert.ok(!source.includes('animation:'), 'the card must be static');
  });

  it('states the counts the payload actually has', async () => {
    const source = await svg();
    const skills = (await readSkills()).length;
    const rules = (await fs.readdir(path.join(payloadRoot(), 'rules'))).filter((f) =>
      f.endsWith('.md'),
    ).length;
    for (const [value, label] of [
      [skills, 'skills'],
      [COMMANDS.length, 'commands'],
      [rules, 'always-on rules'],
    ]) {
      assert.match(source, new RegExp(`>${value}</text>`), `the card should show ${value} ${label}`);
    }
    assert.ok(source.includes(DEMO_DATE), `the card should show demo day ${DEMO_DATE}`);
  });

  it('credits Gregory, since that is what the card is for', async () => {
    assert.match(
      await svg(),
      /Created by Gregory Kennedy for his awesome University Student Developers/,
    );
  });

  it('describes itself for a screen reader', async () => {
    const source = await svg();
    assert.match(source, /role="img"/);
    assert.match(source, /aria-labelledby="title desc"/);
    const desc = /<desc id="desc">([^<]*)<\/desc>/.exec(source)?.[1] ?? '';
    assert.ok(desc.length > 160, 'the description should describe the card, not name it');
  });

  it('fetches nothing and runs nothing, because GitHub sanitises what it serves', async () => {
    const source = await svg();
    assert.ok(!source.includes('<script'), 'no script');
    assert.ok(!/href\s*=\s*"https?:/.test(source), 'no external references');
    assert.ok(!source.includes('<image'), 'no linked raster');
  });
});

describe('assets/social-card.png', () => {
  it('exists, since a preview crawler will not render SVG', async () => {
    await fs.access(PNG);
  });

  it('is a real 1280x640 PNG', async () => {
    const buf = await fs.readFile(PNG);
    // PNG signature, then IHDR: width and height are big-endian at 16 and 20.
    assert.deepEqual([...buf.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'not a PNG');
    assert.equal(buf.readUInt32BE(16), 1280);
    assert.equal(buf.readUInt32BE(20), 640);
  });

  it('stays under the 1 MB GitHub accepts for a social preview', async () => {
    const { size } = await fs.stat(PNG);
    assert.ok(size < 1024 * 1024, `social-card.png is ${(size / 1024).toFixed(0)} KB`);
  });

  it('was rasterised from the SVG that is committed beside it', async () => {
    // `npm run build:svg` regenerates the SVG but cannot regenerate the PNG
    // (that needs Playwright, which the kit does not depend on). This is what
    // catches a card whose numbers have moved on without the image.
    const recorded = (await fs.readFile(HASH, 'utf8')).trim();
    const actual = createHash('sha256').update(await svg()).digest('hex');
    assert.equal(
      actual,
      recorded,
      'social-card.png is stale — run `npm run build:social-png` and commit both',
    );
  });
});

describe('the card is wired into the build and the docs', () => {
  it('has npm scripts for both halves', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts['build:social'], 'node tools/build-social-card.mjs');
    assert.equal(pkg.scripts['build:social-png'], 'node tools/build-social-png.mjs');
    assert.match(pkg.scripts['build:svg'], /build:social/);
  });

  it('is explained somewhere a human will find it', async () => {
    const doc = await fs.readFile(path.join(repoRoot, 'docs', 'social-and-seo.md'), 'utf8');
    assert.match(doc, /Social preview/i, 'the doc should name the GitHub setting');
    assert.match(doc, /social-card\.png/);
  });
});
