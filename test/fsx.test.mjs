import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { MANAGED_BEGIN, MANAGED_END } from '../src/constants.mjs';
import {
  applyManagedBlock,
  ensureDir,
  readIfExists,
  readManagedBlock,
  upsertManagedFile,
  writeFile,
  writeOwnedFile,
} from '../src/fsx.mjs';
import { cleanup, read, tempDir, write } from './helpers.mjs';

after(cleanup);

describe('readIfExists', () => {
  it('returns null for a missing file rather than throwing', async () => {
    const dir = await tempDir();
    assert.equal(await readIfExists(path.join(dir, 'nope.md')), null);
  });

  it('returns the contents of a file that exists', async () => {
    const dir = await tempDir();
    await write(dir, 'a.md', 'hello');
    assert.equal(await readIfExists(path.join(dir, 'a.md')), 'hello');
  });

  it('rethrows errors that are not ENOENT', async () => {
    const dir = await tempDir();
    // Reading a directory as a file fails with EISDIR, not ENOENT.
    await assert.rejects(() => readIfExists(dir), (error) => error.code !== 'ENOENT');
  });
});

describe('ensureDir and writeFile', () => {
  it('creates nested parents', async () => {
    const dir = await tempDir();
    await ensureDir(path.join(dir, 'a/b/c'));
    assert.ok((await fs.stat(path.join(dir, 'a/b/c'))).isDirectory());
  });

  it('is safe to call twice', async () => {
    const dir = await tempDir();
    await ensureDir(path.join(dir, 'x'));
    await ensureDir(path.join(dir, 'x'));
    assert.ok((await fs.stat(path.join(dir, 'x'))).isDirectory());
  });

  it('writes through missing parent directories', async () => {
    const dir = await tempDir();
    await writeFile(path.join(dir, 'deep/nested/file.md'), 'content');
    assert.equal(await read(dir, 'deep/nested/file.md'), 'content');
  });
});

describe('applyManagedBlock', () => {
  it('returns just the block when there is no existing file', () => {
    const result = applyManagedBlock(null, 'BODY');
    assert.ok(result.startsWith(MANAGED_BEGIN));
    assert.ok(result.includes('BODY'));
    assert.ok(result.trimEnd().endsWith(MANAGED_END));
  });

  it('treats a whitespace-only file as empty', () => {
    assert.equal(applyManagedBlock('\n\n   \n', 'BODY'), applyManagedBlock(null, 'BODY'));
  });

  it('replaces only what is between the markers', () => {
    const existing = `TOP\n\n${MANAGED_BEGIN}\nOLD\n${MANAGED_END}\n\nBOTTOM\n`;
    const result = applyManagedBlock(existing, 'NEW');
    assert.ok(result.includes('TOP'), 'content before the block survives');
    assert.ok(result.includes('BOTTOM'), 'content after the block survives');
    assert.ok(result.includes('NEW'));
    assert.ok(!result.includes('OLD'));
  });

  it('appends to an unmanaged file, preserving the student’s content', () => {
    const result = applyManagedBlock('# My notes\n\nSomething I wrote.\n', 'BODY');
    assert.ok(result.startsWith('# My notes'));
    assert.ok(result.includes('Something I wrote.'));
    assert.ok(result.includes('BODY'));
  });

  it('appends rather than corrupting when the markers are out of order', () => {
    const broken = `${MANAGED_END}\nstray\n${MANAGED_BEGIN}\n`;
    const result = applyManagedBlock(broken, 'BODY');
    assert.ok(result.includes('stray'), 'nothing is lost');
    // Exactly one well-formed block is appended at the end.
    assert.equal(result.lastIndexOf(MANAGED_BEGIN) < result.lastIndexOf(MANAGED_END), true);
  });

  it('produces a stable result when applied twice', () => {
    const once = applyManagedBlock('EXISTING\n', 'BODY');
    const twice = applyManagedBlock(once, 'BODY');
    assert.equal(once, twice);
  });

  it('trims the body so repeated runs do not accumulate blank lines', () => {
    const a = applyManagedBlock(null, '\n\nBODY\n\n');
    const b = applyManagedBlock(null, 'BODY');
    assert.equal(a, b);
  });
});

describe('readManagedBlock', () => {
  it('extracts the body', () => {
    const file = applyManagedBlock(null, 'THE BODY');
    assert.equal(readManagedBlock(file), 'THE BODY');
  });

  it('returns null without markers, with reversed markers, or for a non-string', () => {
    assert.equal(readManagedBlock('plain text'), null);
    assert.equal(readManagedBlock(`${MANAGED_END}x${MANAGED_BEGIN}`), null);
    assert.equal(readManagedBlock(null), null);
    assert.equal(readManagedBlock(undefined), null);
  });
});

describe('upsertManagedFile', () => {
  it('reports created, then unchanged, then updated', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'AGENTS.md');

    assert.equal(await upsertManagedFile(file, 'ONE'), 'created');
    assert.equal(await upsertManagedFile(file, 'ONE'), 'unchanged');
    assert.equal(await upsertManagedFile(file, 'TWO'), 'updated');

    const final = await read(dir, 'AGENTS.md');
    assert.ok(final.includes('TWO'));
    assert.ok(!final.includes('ONE'));
  });

  it('never destroys content the student wrote outside the block', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'AGENTS.md');
    await write(dir, 'AGENTS.md', '# Our own rules\n\nAlways use tabs.\n');

    await upsertManagedFile(file, 'KIT CONTENT');
    await upsertManagedFile(file, 'KIT CONTENT v2');

    const final = await read(dir, 'AGENTS.md');
    assert.ok(final.includes('Always use tabs.'), 'student content survived two runs');
    assert.ok(final.includes('KIT CONTENT v2'));
    assert.ok(!final.includes('KIT CONTENT\n'), 'old kit content was replaced');
  });
});

describe('writeOwnedFile', () => {
  it('creates a file that is not there', async () => {
    const dir = await tempDir();
    assert.equal(await writeOwnedFile(path.join(dir, 'a.md'), 'X'), 'created');
  });

  it('reports unchanged when the contents already match', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'a.md');
    await writeOwnedFile(file, 'X');
    assert.equal(await writeOwnedFile(file, 'X'), 'unchanged');
  });

  it('keeps a student’s edit by default', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'a.md');
    await write(dir, 'a.md', 'MY EDIT');
    assert.equal(await writeOwnedFile(file, 'KIT'), 'kept');
    assert.equal(await read(dir, 'a.md'), 'MY EDIT');
  });

  it('overwrites a student’s edit when forced', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'a.md');
    await write(dir, 'a.md', 'MY EDIT');
    assert.equal(await writeOwnedFile(file, 'KIT', { force: true }), 'updated');
    assert.equal(await read(dir, 'a.md'), 'KIT');
  });
});
