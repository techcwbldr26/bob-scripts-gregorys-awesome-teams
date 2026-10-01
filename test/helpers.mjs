/** Shared test helpers: isolated temp directories, cleaned up after each test. */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const created = new Set();

/** Make a fresh temp directory. */
export async function tempDir(label = 'gat') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `${label}-`));
  created.add(dir);
  return dir;
}

/** Remove every temp directory this helper made. */
export async function cleanup() {
  for (const dir of created) {
    await fs.rm(dir, { recursive: true, force: true });
    created.delete(dir);
  }
}

/** Read a file inside a directory, or null. */
export async function read(dir, rel) {
  try {
    return await fs.readFile(path.join(dir, rel), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** Write a file inside a directory, creating parents. */
export async function write(dir, rel, contents) {
  const target = path.join(dir, rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, 'utf8');
  return target;
}

/** Does a path exist? */
export async function exists(dir, rel) {
  try {
    await fs.stat(path.join(dir, rel));
    return true;
  } catch {
    return false;
  }
}

/** Collect console output from a function under test. */
export function captureIo() {
  const out = [];
  const err = [];
  return {
    io: {
      log: (...args) => out.push(args.join(' ')),
      error: (...args) => err.push(args.join(' ')),
    },
    out,
    err,
    stdout: () => out.join('\n'),
    stderr: () => err.join('\n'),
  };
}
