/**
 * Building and merging Bob's MCP configuration.
 *
 * Bob's own docs disagree about how a Streamable HTTP server is spelled: the
 * IDE pages use `type: "streamable-http"` plus `url`, while the Bob Shell page
 * uses `httpURL` and says `url` is not recognised. We therefore emit all three
 * keys for a remote server, which satisfies either reader, and we never emit a
 * standalone SSE entry because Bob removed that transport.
 *
 * source: https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob
 * source: https://bob.ibm.com/docs/shell/configuration/mcp/mcp-bobshell
 */

import {
  FIRECRAWL_API_KEY_VAR,
  FIRECRAWL_GATED_TOOLS,
  FIRECRAWL_HTTP_URL,
  FIRECRAWL_LOCAL_PACKAGE,
  FIRECRAWL_OAUTH_URL,
  FIRECRAWL_READ_ONLY_TOOLS,
  FIRECRAWL_SERVER_KEY,
} from './constants.mjs';

/** Request timeout in ms. Bob Shell's documented default is 600000. */
const TIMEOUT_MS = 600_000;

/**
 * Build the Firecrawl MCP server entry.
 *
 * @param {object} options
 * @param {'hosted'|'oauth'|'keyless'|'local'} [options.mode]
 * @returns {object}
 */
export function buildFirecrawlServer({ mode = 'hosted' } = {}) {
  const base = {
    alwaysAllow: [...FIRECRAWL_READ_ONLY_TOOLS],
    disabled: false,
    timeout: TIMEOUT_MS,
  };

  if (mode === 'local') {
    return {
      command: 'npx',
      args: ['-y', FIRECRAWL_LOCAL_PACKAGE],
      // `${VAR}` is Bob's secret-reference syntax, resolved from the encrypted
      // store written by `/manage-secrets set`. The key never enters the repo.
      env: { [FIRECRAWL_API_KEY_VAR]: `\${${FIRECRAWL_API_KEY_VAR}}` },
      ...base,
    };
  }

  const url = mode === 'oauth' ? FIRECRAWL_OAUTH_URL : FIRECRAWL_HTTP_URL;
  const server = { type: 'streamable-http', url, httpURL: url, ...base };

  if (mode === 'hosted') {
    server.headers = { Authorization: `Bearer \${${FIRECRAWL_API_KEY_VAR}}` };
  }
  // `keyless` and `oauth` deliberately carry no Authorization header: a static
  // header disables Bob's OAuth flow, and keyless access needs no credential.
  return server;
}

/**
 * Parse an existing mcp.json. A non-object root is an error rather than
 * something to silently overwrite.
 *
 * @param {string|null} raw
 * @returns {{config: object, parsed: boolean, error: string|null}}
 */
export function parseMcpConfig(raw) {
  if (raw === null || raw.trim() === '') return { config: {}, parsed: false, error: null };
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    return { config: {}, parsed: false, error: `invalid JSON: ${error.message}` };
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { config: {}, parsed: false, error: 'root of mcp.json must be a JSON object' };
  }
  return { config: value, parsed: true, error: null };
}

/** Keys that must never be copied into a config we write. */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Shallow-copy an object, dropping prototype-pollution keys. */
export function sanitizeServers(servers) {
  const out = Object.create(null);
  if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) return out;
  for (const [name, value] of Object.entries(servers)) {
    if (UNSAFE_KEYS.has(name)) continue;
    out[name] = value;
  }
  return out;
}

/**
 * Merge the Firecrawl entry into an existing config, preserving every sibling
 * server and every unrelated top-level key.
 *
 * @param {string|null} raw current file contents
 * @param {object} options
 * @param {'hosted'|'oauth'|'keyless'|'local'} [options.mode]
 * @param {boolean} [options.force] replace an existing `firecrawl` entry
 */
export function mergeFirecrawl(raw, { mode = 'hosted', force = true } = {}) {
  const { config, error } = parseMcpConfig(raw);
  if (error) return { ok: false, error, json: null, action: 'failed' };

  const servers = sanitizeServers(config.mcpServers);
  const had = Object.prototype.hasOwnProperty.call(servers, FIRECRAWL_SERVER_KEY);

  if (had && !force) {
    return { ok: true, error: null, json: serialize(config, servers), action: 'kept' };
  }

  servers[FIRECRAWL_SERVER_KEY] = buildFirecrawlServer({ mode });
  return {
    ok: true,
    error: null,
    json: serialize(config, servers),
    action: had ? 'updated' : 'added',
  };
}

/** Serialize a config with `mcpServers` first and a trailing newline. */
function serialize(config, servers) {
  const rest = { ...config };
  delete rest.mcpServers;
  const ordered = { mcpServers: { ...servers }, ...rest };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/** The two Firecrawl tool tiers, for the docs and the verifier. */
export function firecrawlToolTiers() {
  return {
    autoApproved: [...FIRECRAWL_READ_ONLY_TOOLS],
    gated: [...FIRECRAWL_GATED_TOOLS],
  };
}
