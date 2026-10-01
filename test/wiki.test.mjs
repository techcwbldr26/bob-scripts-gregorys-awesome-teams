/**
 * The wiki is published by copying `wiki/*.md` into GitHub's separate wiki
 * repository, where nothing validates it. A broken link there is invisible
 * until a student hits it, so the checks happen here instead.
 */

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIKI = path.join(repoRoot, 'wiki');

const pages = async () =>
  (await fs.readdir(WIKI)).filter((f) => f.endsWith('.md'));

const read = (file) => fs.readFile(path.join(WIKI, file), 'utf8');

/** GitHub's heading slug: lowercase, drop punctuation, each space becomes a hyphen. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/ /g, '-');
}

describe('the wiki has the pages it promises', () => {
  it('includes a Home page and the two special pages', async () => {
    const files = await pages();
    for (const required of ['Home.md', '_Sidebar.md', '_Footer.md']) {
      assert.ok(files.includes(required), `missing ${required}`);
    }
  });

  it('is documented in docs/publishing-the-wiki.md, with every page listed', async () => {
    const doc = await fs.readFile(path.join(repoRoot, 'docs', 'publishing-the-wiki.md'), 'utf8');
    for (const file of await pages()) {
      assert.ok(doc.includes(file), `publishing doc does not list ${file}`);
    }
  });
});

describe('every internal link resolves', () => {
  it('points only at pages that exist', async () => {
    const names = new Set((await pages()).map((f) => f.replace(/\.md$/, '')));
    const broken = [];
    for (const file of await pages()) {
      const body = await read(file);
      for (const m of body.matchAll(/\]\((?!https?:|#|\.)([A-Za-z0-9-]+)(?:#[a-z0-9-]*)?\)/g)) {
        if (!names.has(m[1])) broken.push(`${file} -> ${m[1]}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  it('points only at headings that exist', async () => {
    const anchors = new Map();
    for (const file of await pages()) {
      const body = await read(file);
      anchors.set(
        file.replace(/\.md$/, ''),
        new Set([...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1]))),
      );
    }
    const broken = [];
    for (const file of await pages()) {
      const body = await read(file);
      for (const m of body.matchAll(/\]\((?!https?:)([A-Za-z0-9-]*)#([a-z0-9-]+)\)/g)) {
        const page = m[1] || file.replace(/\.md$/, '');
        if (!anchors.get(page)?.has(m[2])) broken.push(`${file} -> ${page}#${m[2]}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  it('is reachable from the sidebar', async () => {
    const sidebar = await read('_Sidebar.md');
    const orphans = (await pages())
      .map((f) => f.replace(/\.md$/, ''))
      .filter((n) => !n.startsWith('_'))
      .filter((n) => !sidebar.includes(`(${n})`));
    assert.deepEqual(orphans, [], 'these pages are in no navigation');
  });
});

describe('the wiki agrees with the kit', () => {
  it('quotes the real number of skills', async () => {
    const { readSkills } = await import('../src/payload.mjs');
    const count = (await readSkills()).length;
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    // Prose reads better spelled out, so accept either form rather than force
    // the page to say "9 skills".
    const pattern = new RegExp(`(${count}|${words[count] ?? count}) skills`, 'i');
    assert.match(await read('Skills-Reference.md'), pattern);
  });

  it('names every skill the payload installs', async () => {
    const { readSkills } = await import('../src/payload.mjs');
    const body = await read('Skills-Reference.md');
    for (const skill of await readSkills()) {
      assert.ok(body.includes(`$${skill.name}`), `Skills Reference omits $${skill.name}`);
    }
  });

  it("uses Bob's documented context numbers", async () => {
    const body = await read('Context-Engineering.md');
    assert.match(body, /270,000 tokens/);
    assert.match(body, /190,000 tokens/);
  });

  it('quotes the real coverage gate', async () => {
    const { COVERAGE_GATE } = await import('../src/payload.mjs');
    assert.match(await read('Testing-and-Evals.md'), new RegExp(`${COVERAGE_GATE}% line coverage`));
  });

  it('points students at the setup prompt that exists', async () => {
    assert.match(await read('Getting-Started.md'), /START-HERE\.md/);
  });
});
