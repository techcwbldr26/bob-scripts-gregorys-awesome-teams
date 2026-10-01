import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FIRECRAWL_API_KEY_VAR,
  FIRECRAWL_GATED_TOOLS,
  FIRECRAWL_HTTP_URL,
  FIRECRAWL_LOCAL_PACKAGE,
  FIRECRAWL_OAUTH_URL,
  FIRECRAWL_READ_ONLY_TOOLS,
} from '../src/constants.mjs';
import {
  buildFirecrawlServer,
  firecrawlToolTiers,
  mergeFirecrawl,
  parseMcpConfig,
  sanitizeServers,
} from '../src/mcp.mjs';

describe('buildFirecrawlServer', () => {
  it('writes url, httpURL and type together, because Bob’s docs disagree', () => {
    const server = buildFirecrawlServer({ mode: 'hosted' });
    assert.equal(server.type, 'streamable-http');
    assert.equal(server.url, FIRECRAWL_HTTP_URL);
    assert.equal(server.httpURL, FIRECRAWL_HTTP_URL);
  });

  it('references the key as a Bob secret, never the literal value', () => {
    const server = buildFirecrawlServer({ mode: 'hosted' });
    assert.equal(server.headers.Authorization, `Bearer \${${FIRECRAWL_API_KEY_VAR}}`);
    assert.ok(!JSON.stringify(server).includes('fc-'), 'no literal key material');
  });

  it('defaults to hosted mode', () => {
    assert.deepEqual(buildFirecrawlServer(), buildFirecrawlServer({ mode: 'hosted' }));
    assert.deepEqual(buildFirecrawlServer({}), buildFirecrawlServer({ mode: 'hosted' }));
  });

  it('omits the Authorization header for oauth, which a static header would disable', () => {
    const server = buildFirecrawlServer({ mode: 'oauth' });
    assert.equal(server.url, FIRECRAWL_OAUTH_URL);
    assert.equal(server.headers, undefined);
  });

  it('omits the header for keyless, which needs no credential', () => {
    const server = buildFirecrawlServer({ mode: 'keyless' });
    assert.equal(server.url, FIRECRAWL_HTTP_URL);
    assert.equal(server.headers, undefined);
  });

  it('builds a pinned stdio server for local mode', () => {
    const server = buildFirecrawlServer({ mode: 'local' });
    assert.equal(server.command, 'npx');
    assert.deepEqual(server.args, ['-y', FIRECRAWL_LOCAL_PACKAGE]);
    assert.equal(server.env[FIRECRAWL_API_KEY_VAR], `\${${FIRECRAWL_API_KEY_VAR}}`);
    assert.equal(server.url, undefined, 'a stdio server must not carry a URL');
  });

  it('auto-approves only read-only tools, never the credit-heavy or mutating ones', () => {
    const { alwaysAllow } = buildFirecrawlServer();
    assert.deepEqual(alwaysAllow, FIRECRAWL_READ_ONLY_TOOLS);
    for (const gated of FIRECRAWL_GATED_TOOLS) {
      assert.ok(!alwaysAllow.includes(gated), `${gated} must stay behind a prompt`);
    }
  });

  it('returns a fresh alwaysAllow array each time, so callers cannot corrupt the constant', () => {
    const first = buildFirecrawlServer();
    first.alwaysAllow.push('mutated');
    assert.ok(!buildFirecrawlServer().alwaysAllow.includes('mutated'));
  });

  it('sets an explicit timeout and is not disabled', () => {
    const server = buildFirecrawlServer();
    assert.equal(server.timeout, 600000);
    assert.equal(server.disabled, false);
  });
});

describe('parseMcpConfig', () => {
  it('treats null and empty input as a fresh config', () => {
    for (const input of [null, '', '   \n']) {
      const result = parseMcpConfig(input);
      assert.deepEqual(result.config, {});
      assert.equal(result.error, null);
      assert.equal(result.parsed, false);
    }
  });

  it('parses a valid object', () => {
    const result = parseMcpConfig('{"mcpServers":{}}');
    assert.equal(result.parsed, true);
    assert.equal(result.error, null);
  });

  it('reports invalid JSON instead of discarding the file', () => {
    const result = parseMcpConfig('{not json');
    assert.match(result.error, /invalid JSON/);
  });

  it('refuses a non-object root', () => {
    for (const input of ['[]', 'null', '"text"', '42']) {
      assert.match(parseMcpConfig(input).error, /must be a JSON object/, input);
    }
  });
});

describe('sanitizeServers', () => {
  it('drops prototype-pollution keys', () => {
    const parsed = JSON.parse('{"__proto__":{"bad":1},"constructor":{},"prototype":{},"good":{"command":"x"}}');
    const result = sanitizeServers(parsed);
    assert.deepEqual(Object.keys(result), ['good']);
  });

  it('returns an empty object for input that is not a plain object', () => {
    for (const input of [null, undefined, [], 'text', 7]) {
      assert.deepEqual(Object.keys(sanitizeServers(input)), []);
    }
  });

  it('has a null prototype, so a "toString" server cannot shadow anything', () => {
    assert.equal(Object.getPrototypeOf(sanitizeServers({})), null);
  });
});

describe('mergeFirecrawl', () => {
  it('adds the server to an empty config', () => {
    const result = mergeFirecrawl(null);
    assert.equal(result.action, 'added');
    assert.equal(JSON.parse(result.json).mcpServers.firecrawl.type, 'streamable-http');
  });

  it('preserves other servers and unrelated top-level keys', () => {
    const existing = JSON.stringify({
      mcpServers: { other: { command: 'node', args: ['s.js'] } },
      someOtherSetting: { nested: true },
    });
    const parsed = JSON.parse(mergeFirecrawl(existing).json);
    assert.deepEqual(parsed.mcpServers.other, { command: 'node', args: ['s.js'] });
    assert.deepEqual(parsed.someOtherSetting, { nested: true });
    assert.ok(parsed.mcpServers.firecrawl);
  });

  it('updates an existing firecrawl entry by default', () => {
    const existing = JSON.stringify({ mcpServers: { firecrawl: { command: 'old' } } });
    const result = mergeFirecrawl(existing);
    assert.equal(result.action, 'updated');
    assert.equal(JSON.parse(result.json).mcpServers.firecrawl.command, undefined);
  });

  it('keeps an existing entry when force is false', () => {
    const existing = JSON.stringify({ mcpServers: { firecrawl: { command: 'mine' } } });
    const result = mergeFirecrawl(existing, { force: false });
    assert.equal(result.action, 'kept');
    assert.equal(JSON.parse(result.json).mcpServers.firecrawl.command, 'mine');
  });

  it('still adds the server when force is false and none exists', () => {
    const result = mergeFirecrawl('{"mcpServers":{}}', { force: false });
    assert.equal(result.action, 'added');
  });

  it('fails without producing JSON when the existing file is broken', () => {
    const result = mergeFirecrawl('{broken');
    assert.equal(result.ok, false);
    assert.equal(result.json, null);
    assert.equal(result.action, 'failed');
  });

  it('puts mcpServers first and ends with a newline', () => {
    const json = mergeFirecrawl('{"zzz":1}').json;
    assert.ok(json.startsWith('{\n  "mcpServers"'));
    assert.ok(json.endsWith('\n'));
  });

  it('honours the requested mode', () => {
    const local = JSON.parse(mergeFirecrawl(null, { mode: 'local' }).json);
    assert.equal(local.mcpServers.firecrawl.command, 'npx');
  });

  it('is idempotent', () => {
    const once = mergeFirecrawl(null).json;
    assert.equal(mergeFirecrawl(once).json, once);
  });
});

describe('firecrawlToolTiers', () => {
  it('reports both tiers with no overlap', () => {
    const { autoApproved, gated } = firecrawlToolTiers();
    assert.ok(autoApproved.length > 0 && gated.length > 0);
    assert.equal(autoApproved.filter((t) => gated.includes(t)).length, 0);
  });

  it('returns copies, not the constants themselves', () => {
    const tiers = firecrawlToolTiers();
    tiers.autoApproved.push('x');
    assert.ok(!firecrawlToolTiers().autoApproved.includes('x'));
  });
});
