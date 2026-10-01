/**
 * The README banner is a generated artefact, so it is tested as one: it must
 * match its generator, stay safe to serve, and keep telling the truth about the
 * payload it describes.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { after, describe, it } from 'node:test';

import { COVERAGE_GATE, payloadRoot, readSkills } from '../src/payload.mjs';
import { cleanup } from './helpers.mjs';

const run = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANNER = path.join(repoRoot, 'assets', 'banner.svg');

const svg = () => fs.readFile(BANNER, 'utf8');

after(cleanup);

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

  it('points at a file that exists', async () => {
    assert.ok((await fs.stat(BANNER)).isFile());
  });
});

describe('the banner matches its generator', () => {
  it('is checked out with LF endings', async () => {
    // The generator writes LF. Without `* text=auto eol=lf` in .gitattributes a
    // Windows checkout rewrites this file to CRLF and the drift check below
    // fails for a reason that has nothing to do with the banner's content.
    const raw = await fs.readFile(BANNER);
    assert.equal(
      raw.includes('\r'.charCodeAt(0)),
      false,
      'assets/banner.svg contains CR — check the .gitattributes rules',
    );
  });

  it('does not drift from tools/build-banner.mjs', async () => {
    const committed = await svg();
    await run(process.execPath, [path.join(repoRoot, 'tools', 'build-banner.mjs')], {
      cwd: repoRoot,
    });
    const regenerated = await svg();

    if (regenerated !== committed) {
      // Report what differs rather than printing 37 KB of SVG at the reader.
      const norm = (s) => s.replace(/\r\n/g, '\n');
      assert.notEqual(
        norm(regenerated),
        norm(committed),
        'only the line endings differ — see the LF check above',
      );
      let at = 0;
      while (at < committed.length && committed[at] === regenerated[at]) at += 1;
      assert.fail(
        'assets/banner.svg is stale — run `npm run build:banner` and commit the result.\n' +
          `First difference at character ${at} of ${committed.length}:\n` +
          `  committed:   ...${committed.slice(Math.max(0, at - 40), at + 60)}\n` +
          `  regenerated: ...${regenerated.slice(Math.max(0, at - 40), at + 60)}`,
      );
    }
  });
});

describe('the banner is safe to serve', () => {
  it('contains no script element', async () => {
    assert.doesNotMatch(await svg(), /<\s*script/i);
  });

  it('contains no inline event handlers', async () => {
    assert.doesNotMatch(await svg(), /\son[a-z]+\s*=/i);
  });

  it('fetches nothing over the network', async () => {
    const source = await svg();
    assert.doesNotMatch(source, /xlink:href/i);
    assert.doesNotMatch(source, /<\s*image/i);
    assert.doesNotMatch(source, /url\(\s*['"]?https?:/i);
    assert.doesNotMatch(source, /@import/i);
    // The only absolute URL may be the SVG namespace, which is an identifier
    // rather than something a renderer goes and fetches.
    const urls = (source.match(/https?:\/\/[^"'\s)]+/g) ?? []).filter(
      (u) => u !== 'http://www.w3.org/2000/svg',
    );
    assert.deepEqual(urls, [], 'the banner should be entirely self-contained');
  });

  it('escapes every ampersand', async () => {
    const source = await svg();
    const bare = source.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g) ?? [];
    assert.deepEqual(bare, [], 'unescaped ampersand would break XML parsing');
  });

  it('stays small enough for a README', async () => {
    const { size } = await fs.stat(BANNER);
    assert.ok(size < 80 * 1024, `banner is ${(size / 1024).toFixed(1)} KB`);
  });
});

describe('the banner is well formed', () => {
  it('is a single svg root with a viewBox', async () => {
    const source = await svg();
    assert.ok(source.startsWith('<svg '));
    assert.ok(source.trimEnd().endsWith('</svg>'));
    assert.match(source, /viewBox="0 0 \d+ \d+"/);
    assert.equal((source.match(/<svg\b/g) ?? []).length, 1);
  });

  it('is announced to screen readers', async () => {
    const source = await svg();
    assert.match(source, /role="img"/);
    assert.match(source, /<title id="title">/);
    assert.match(source, /<desc id="desc">/);
  });

  it('defines every class it uses', async () => {
    const source = await svg();
    const style = source.slice(source.indexOf('<style>'), source.indexOf('</style>'));
    const used = new Set(
      [...source.matchAll(/class="([a-z]\d+)"/g)].map((m) => m[1]),
    );
    assert.ok(used.size > 50, `expected many animated elements, found ${used.size}`);
    for (const name of used) {
      assert.ok(style.includes(`.${name}{`), `class ${name} is used but never defined`);
    }
  });

  it('gives every animated element a still frame for reduced motion', async () => {
    const source = await svg();
    const style = source.slice(source.indexOf('<style>'), source.indexOf('</style>'));
    const media = style.slice(style.indexOf('@media (prefers-reduced-motion:reduce){'));
    assert.match(media, /\*\{animation:none !important\}/);
    const used = new Set([...source.matchAll(/class="([a-z]\d+)"/g)].map((m) => m[1]));
    for (const name of used) {
      assert.ok(
        media.includes(`.${name}{`),
        `class ${name} has no reduced-motion state, so it would stack on the others`,
      );
    }
  });

  it('defines a keyframe set for every animation it names', async () => {
    const source = await svg();
    const style = source.slice(source.indexOf('<style>'), source.indexOf('</style>'));
    const animated = [...style.matchAll(/animation:([a-z]\d+) /g)].map((m) => m[1]);
    assert.ok(animated.length > 50);
    for (const name of new Set(animated)) {
      assert.ok(style.includes(`@keyframes ${name}{`), `no @keyframes for ${name}`);
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

  it('uses only the palette from the course diagram', async () => {
    const source = await svg();
    const allowed = new Set([
      '#121212', '#d3d3d3', '#a3a3a3', '#6f6f6f', '#ffffff',
      '#56a2e8', '#152a3a', '#1d3f5c',
      '#3a9a4b', '#152c1a', '#1f4a2a',
      '#b86101', '#2e1b06', '#4d2f08',
      '#ff8383', '#361f1f', '#5a2c2c',
      '#242424', '#191919', '#1b1b1b',
    ]);
    const used = new Set((source.match(/#[0-9a-f]{6}/g) ?? []));
    const stray = [...used].filter((c) => !allowed.has(c));
    assert.deepEqual(stray, [], `unexpected colours: ${stray.join(', ')}`);
  });
});
