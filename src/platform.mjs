/** Platform and prerequisite detection shared by all four setup scripts. */

import { INSTALLER_MIN_NODE, BOB_SHELL_MIN_NODE } from './constants.mjs';

/**
 * Canonical platform id for a Node `process.platform` / `process.arch` pair.
 * The four setup scripts each assert they are running on the right one.
 *
 * @param {string} platform `process.platform`
 * @param {string} arch `process.arch`
 * @returns {'macos-intel'|'macos-apple-silicon'|'linux'|'windows'|'unsupported'}
 */
export function detectPlatform(platform, arch) {
  if (platform === 'darwin') {
    if (arch === 'arm64') return 'macos-apple-silicon';
    if (arch === 'x64') return 'macos-intel';
    return 'unsupported';
  }
  if (platform === 'linux') {
    return arch === 'x64' || arch === 'arm64' || arch === 's390x' ? 'linux' : 'unsupported';
  }
  if (platform === 'win32') {
    return arch === 'x64' || arch === 'arm64' ? 'windows' : 'unsupported';
  }
  return 'unsupported';
}

/** Human label for a platform id. */
export function platformLabel(id) {
  return {
    'macos-intel': 'macOS (Intel)',
    'macos-apple-silicon': 'macOS (Apple silicon)',
    linux: 'Linux',
    windows: 'Windows',
    unsupported: 'Unsupported platform',
  }[id] ?? 'Unsupported platform';
}

/**
 * Parse the major version out of a Node version string.
 * @param {string} version e.g. `v24.3.0` or `24.3.0`
 * @returns {number} major version, or NaN when unparseable
 */
export function nodeMajor(version) {
  const match = /^v?(\d+)\./.exec(String(version ?? '').trim());
  return match ? Number(match[1]) : Number.NaN;
}

/**
 * Check Node against both thresholds: what the installer needs, and what Bob
 * Shell needs. A student can legitimately be below the Bob threshold while
 * still being able to run this installer, so the two are reported separately.
 *
 * @param {string} version
 */
export function checkNode(version) {
  const major = nodeMajor(version);
  const known = Number.isInteger(major);
  return {
    version,
    major,
    canRunInstaller: known && major >= INSTALLER_MIN_NODE,
    meetsBobShell: known && major >= BOB_SHELL_MIN_NODE,
    installerMin: INSTALLER_MIN_NODE,
    bobShellMin: BOB_SHELL_MIN_NODE,
  };
}

/**
 * Validate a Firecrawl API key's shape without contacting the network.
 * Firecrawl keys are `fc-` prefixed. We only reject obviously-wrong input so a
 * typo is caught at install time rather than on the first tool call.
 *
 * @param {unknown} key
 */
export function validateApiKeyShape(key) {
  if (typeof key !== 'string') return { ok: false, reason: 'not-a-string' };
  const trimmed = key.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  if (/\s/.test(trimmed)) return { ok: false, reason: 'contains-whitespace' };
  if (!trimmed.startsWith('fc-')) return { ok: false, reason: 'missing-fc-prefix' };
  if (trimmed.length < 12) return { ok: false, reason: 'too-short' };
  return { ok: true, key: trimmed };
}
