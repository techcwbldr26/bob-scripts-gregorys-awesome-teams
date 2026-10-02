/**
 * Shared assertions for the three generated SVG diagrams.
 *
 * Each one is a build artefact that ships to GitHub, so each needs the same
 * guarantees: it matches its generator, it is safe for GitHub's sanitiser to
 * serve, it is well formed, every animated element has a reduced-motion still
 * frame, and it stays inside the course palette. The per-diagram tests then
 * only have to assert what that diagram actually claims.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const run = promisify(execFile);

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/** The course diagram's palette, plus the neutrals the panels are built from. */
export const PALETTE = new Set([
  '#121212', '#d3d3d3', '#a3a3a3', '#6f6f6f', '#ffffff',
  '#56a2e8', '#152a3a', '#1d3f5c',
  '#3a9a4b', '#152c1a', '#1f4a2a',
  '#b86101', '#2e1b06', '#4d2f08',
  '#ff8383', '#361f1f', '#5a2c2c',
  '#242424', '#191919', '#1b1b1b',
]);

const styleOf = (source) =>
  source.slice(source.indexOf('<style>'), source.indexOf('</style>'));

const classesIn = (source) =>
  new Set([...source.matchAll(/class="([a-z]\d+)"/g)].map((m) => m[1]));

/**
 * @param {object} options
 * @param {string} options.label how to describe the file in test names
 * @param {string} options.asset path to the committed SVG, relative to the repo
 * @param {string} options.generator path to the script that writes it
 * @param {number} options.minClasses a floor on how much is actually animated
 * @param {number} options.maxKB a ceiling, because these render inline
 */
export function describeGeneratedSvg({ label, asset, generator, minClasses, maxKB }) {
  const file = path.join(repoRoot, asset);
  const svg = () => fs.readFile(file, 'utf8');

  describe(`${label} matches its generator`, () => {
    it('points at a file that exists', async () => {
      assert.ok((await fs.stat(file)).isFile());
    });

    it('is checked out with LF endings', async () => {
      // The generator writes LF. Without `* text=auto eol=lf` in .gitattributes
      // a Windows checkout rewrites the file to CRLF and the drift check below
      // then fails for a reason that has nothing to do with its content.
      const raw = await fs.readFile(file);
      assert.equal(
        raw.includes('\r'.charCodeAt(0)),
        false,
        `${asset} contains CR — check the .gitattributes rules`,
      );
    });

    it(`does not drift from ${generator}`, async () => {
      const committed = await svg();
      await run(process.execPath, [path.join(repoRoot, generator)], { cwd: repoRoot });
      const regenerated = await svg();

      if (regenerated !== committed) {
        // Report what differs rather than printing tens of KB of SVG.
        const norm = (s) => s.replace(/\r\n/g, '\n');
        assert.notEqual(
          norm(regenerated),
          norm(committed),
          'only the line endings differ — see the LF check above',
        );
        let at = 0;
        while (at < committed.length && committed[at] === regenerated[at]) at += 1;
        assert.fail(
          `${asset} is stale — run \`node ${generator}\` and commit the result.\n` +
            `First difference at character ${at} of ${committed.length}:\n` +
            `  committed:   ...${committed.slice(Math.max(0, at - 40), at + 60)}\n` +
            `  regenerated: ...${regenerated.slice(Math.max(0, at - 40), at + 60)}`,
        );
      }
    });
  });

  describe(`${label} is safe to serve`, () => {
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
      assert.deepEqual(urls, [], `${asset} should be entirely self-contained`);
    });

    it('escapes every ampersand', async () => {
      const source = await svg();
      const bare = source.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g) ?? [];
      assert.deepEqual(bare, [], 'an unescaped ampersand would break XML parsing');
    });

    it('stays small enough to serve inline', async () => {
      const { size } = await fs.stat(file);
      assert.ok(size < maxKB * 1024, `${asset} is ${(size / 1024).toFixed(1)} KB`);
    });
  });

  describe(`${label} is well formed`, () => {
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
      const desc = /<desc id="desc">([^<]+)</.exec(source)?.[1] ?? '';
      assert.ok(desc.length > 200, 'the description should actually describe the diagram');
    });

    it('defines every class it uses', async () => {
      const source = await svg();
      const style = styleOf(source);
      const used = classesIn(source);
      assert.ok(used.size >= minClasses, `expected ≥${minClasses} animated elements, found ${used.size}`);
      for (const name of used) {
        assert.ok(style.includes(`.${name}{`), `class ${name} is used but never defined`);
      }
    });

    it('gives every animated element a still frame for reduced motion', async () => {
      const source = await svg();
      const style = styleOf(source);
      const media = style.slice(style.indexOf('@media (prefers-reduced-motion:reduce){'));
      assert.match(media, /\*\{animation:none !important\}/);
      for (const name of classesIn(source)) {
        assert.ok(
          media.includes(`.${name}{`),
          `class ${name} has no reduced-motion state, so it would stack on the others`,
        );
      }
    });

    it('defines a keyframe set for every animation it names', async () => {
      const style = styleOf(await svg());
      const animated = [...style.matchAll(/animation:([a-z]\d+) /g)].map((m) => m[1]);
      assert.ok(animated.length >= minClasses);
      for (const name of new Set(animated)) {
        assert.ok(style.includes(`@keyframes ${name}{`), `no @keyframes for ${name}`);
      }
    });

    it('runs every animation over the same loop length', async () => {
      const style = styleOf(await svg());
      const durations = new Set(
        [...style.matchAll(/animation:[a-z]\d+ ([\d.]+)s /g)].map((m) => m[1]),
      );
      assert.deepEqual([...durations], ['35'], 'every element should share the 35s cycle');
    });

    it('keeps every keyframe set in ascending order', async () => {
      // An out-of-order stop is silently reordered by the renderer, which makes
      // the animation play something nobody authored.
      const style = styleOf(await svg());
      for (const [, name, frames] of style.matchAll(/@keyframes ([a-z]\d+)\{(.*?)\}(?=(?:@|\.|\s*$))/gs)) {
        const stops = [...frames.matchAll(/([\d.]+)%/g)].map((m) => Number(m[1]));
        for (let i = 1; i < stops.length; i += 1) {
          assert.ok(
            stops[i] >= stops[i - 1],
            `@keyframes ${name} goes backwards: ${stops[i - 1]}% then ${stops[i]}%`,
          );
        }
      }
    });

    it('declares every animated property on the first stop of its keyframes', async () => {
      // Declaring a property only on a later stop does not mean it holds until
      // then: CSS interpolates it from the element's base value at 0%. That is
      // how `draw` once spent a whole cycle fading its paths out, so every
      // keyframe set is checked for it.
      const style = styleOf(await svg());
      for (const [, name, frames] of style.matchAll(/@keyframes ([a-z]\d+)\{(.*?)\}(?=(?:@|\.|\s*$))/gs)) {
        const blocks = [...frames.matchAll(/\{([^}]*)\}/g)].map((m) =>
          new Set(
            m[1]
              .split(';')
              .map((d) => d.split(':')[0].trim())
              .filter(Boolean),
          ),
        );
        const [first, ...rest] = blocks;
        for (const block of rest) {
          for (const prop of block) {
            assert.ok(
              first.has(prop),
              `@keyframes ${name} declares ${prop} only after 0%, so it interpolates from the base value`,
            );
          }
        }
      }
    });
  });

  describe(`${label} stays on palette`, () => {
    it('uses only the colours from the course diagram', async () => {
      const used = new Set((await svg()).match(/#[0-9a-f]{6}/g) ?? []);
      const stray = [...used].filter((c) => !PALETTE.has(c));
      assert.deepEqual(stray, [], `unexpected colours: ${stray.join(', ')}`);
    });
  });

  return { file, svg };
}
