/**
 * Filesystem helpers with one guiding rule: never destroy a student's work.
 *
 * Shared files (AGENTS.md, SKILLS.md) are edited through a managed block, so
 * re-running the installer refreshes our content and leaves theirs untouched.
 * Files we own outright are written whole.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { MANAGED_BEGIN, MANAGED_END } from './constants.mjs';

/** Read a file, returning null when it does not exist. */
export async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** Create a directory and any missing parents. */
export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/** Write a file, creating parent directories as needed. */
export async function writeFile(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents, 'utf8');
  return filePath;
}

/**
 * Splice `body` into `existing` between the managed markers.
 *
 * - No existing content: returns the block on its own.
 * - Markers present: replaces only what is between them.
 * - Content but no markers: keeps the student's content and appends the block.
 *
 * @param {string|null} existing
 * @param {string} body content to place inside the managed block
 * @returns {string}
 */
export function applyManagedBlock(existing, body) {
  const block = `${MANAGED_BEGIN}\n${body.trim()}\n${MANAGED_END}\n`;

  if (existing === null || existing.trim() === '') return block;

  const start = existing.indexOf(MANAGED_BEGIN);
  const end = existing.indexOf(MANAGED_END);

  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start);
    const after = existing.slice(end + MANAGED_END.length).replace(/^\n/, '');
    return `${before}${block}${after}`;
  }

  // Unmanaged file, or markers damaged beyond recognition: preserve and append.
  return `${existing.replace(/\s+$/, '')}\n\n${block}`;
}

/** Extract the managed block body, or null when there is not a well-formed one. */
export function readManagedBlock(existing) {
  if (typeof existing !== 'string') return null;
  const start = existing.indexOf(MANAGED_BEGIN);
  const end = existing.indexOf(MANAGED_END);
  if (start === -1 || end === -1 || end <= start) return null;
  return existing.slice(start + MANAGED_BEGIN.length, end).trim();
}

/**
 * Update a shared markdown file's managed block in place.
 * @returns {Promise<'created'|'updated'|'unchanged'>}
 */
export async function upsertManagedFile(filePath, body) {
  const existing = await readIfExists(filePath);
  const next = applyManagedBlock(existing, body);
  if (existing === next) return 'unchanged';
  await writeFile(filePath, next);
  return existing === null ? 'created' : 'updated';
}

/**
 * Write a file this kit owns.
 * @param {object} options
 * @param {boolean} [options.force] overwrite a file modified by the student
 * @returns {Promise<'created'|'updated'|'unchanged'|'kept'>}
 */
export async function writeOwnedFile(filePath, contents, { force = false } = {}) {
  const existing = await readIfExists(filePath);
  if (existing === contents) return 'unchanged';
  if (existing !== null && !force) return 'kept';
  await writeFile(filePath, contents);
  return existing === null ? 'created' : 'updated';
}
