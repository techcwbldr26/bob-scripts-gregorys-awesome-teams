import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkNode,
  detectPlatform,
  nodeMajor,
  platformLabel,
  validateApiKeyShape,
} from '../src/platform.mjs';

describe('detectPlatform', () => {
  it('distinguishes the two macOS architectures', () => {
    assert.equal(detectPlatform('darwin', 'arm64'), 'macos-apple-silicon');
    assert.equal(detectPlatform('darwin', 'x64'), 'macos-intel');
  });

  it('rejects a macOS architecture it does not know', () => {
    assert.equal(detectPlatform('darwin', 'ppc'), 'unsupported');
  });

  it('accepts Linux on x64, arm64 and s390x, since Bob supports IBM Z', () => {
    for (const arch of ['x64', 'arm64', 's390x']) {
      assert.equal(detectPlatform('linux', arch), 'linux', arch);
    }
    assert.equal(detectPlatform('linux', 'mips'), 'unsupported');
  });

  it('accepts Windows on x64 and arm64', () => {
    assert.equal(detectPlatform('win32', 'x64'), 'windows');
    assert.equal(detectPlatform('win32', 'arm64'), 'windows');
    assert.equal(detectPlatform('win32', 'ia32'), 'unsupported');
  });

  it('rejects anything else', () => {
    assert.equal(detectPlatform('aix', 'x64'), 'unsupported');
    assert.equal(detectPlatform('', ''), 'unsupported');
  });
});

describe('platformLabel', () => {
  it('labels every known platform', () => {
    assert.equal(platformLabel('macos-intel'), 'macOS (Intel)');
    assert.equal(platformLabel('macos-apple-silicon'), 'macOS (Apple silicon)');
    assert.equal(platformLabel('linux'), 'Linux');
    assert.equal(platformLabel('windows'), 'Windows');
    assert.equal(platformLabel('unsupported'), 'Unsupported platform');
  });

  it('falls back rather than returning undefined', () => {
    assert.equal(platformLabel('nonsense'), 'Unsupported platform');
  });
});

describe('nodeMajor', () => {
  it('parses a v-prefixed version', () => {
    assert.equal(nodeMajor('v24.3.0'), 24);
  });

  it('parses a bare version', () => {
    assert.equal(nodeMajor('20.11.1'), 20);
  });

  it('tolerates surrounding whitespace', () => {
    assert.equal(nodeMajor('  v22.1.0\n'), 22);
  });

  it('returns NaN for anything unparseable', () => {
    for (const bad of ['', 'node', 'v', null, undefined, 'v24']) {
      assert.ok(Number.isNaN(nodeMajor(bad)), JSON.stringify(bad));
    }
  });
});

describe('checkNode', () => {
  it('reports the installer and Bob Shell thresholds separately', () => {
    const result = checkNode('v22.0.0');
    assert.equal(result.canRunInstaller, true);
    assert.equal(result.meetsBobShell, false);
    assert.equal(result.major, 22);
  });

  it('passes both thresholds on a current Node', () => {
    const result = checkNode('v24.5.0');
    assert.equal(result.canRunInstaller, true);
    assert.equal(result.meetsBobShell, true);
  });

  it('fails both on an ancient Node', () => {
    const result = checkNode('v16.20.0');
    assert.equal(result.canRunInstaller, false);
    assert.equal(result.meetsBobShell, false);
  });

  it('fails safe on an unparseable version', () => {
    const result = checkNode('banana');
    assert.equal(result.canRunInstaller, false);
    assert.equal(result.meetsBobShell, false);
  });
});

describe('validateApiKeyShape', () => {
  it('accepts a plausible Firecrawl key and trims it', () => {
    const result = validateApiKeyShape('  fc-0123456789abcdef  ');
    assert.equal(result.ok, true);
    assert.equal(result.key, 'fc-0123456789abcdef');
  });

  it('rejects a key without the fc- prefix', () => {
    assert.deepEqual(validateApiKeyShape('sk-0123456789abcdef'), {
      ok: false,
      reason: 'missing-fc-prefix',
    });
  });

  it('rejects empty, short, whitespace-bearing and non-string input', () => {
    assert.equal(validateApiKeyShape('').reason, 'empty');
    assert.equal(validateApiKeyShape('   ').reason, 'empty');
    assert.equal(validateApiKeyShape('fc-short').reason, 'too-short');
    assert.equal(validateApiKeyShape('fc-abc def ghi jkl').reason, 'contains-whitespace');
    assert.equal(validateApiKeyShape(null).reason, 'not-a-string');
    assert.equal(validateApiKeyShape(42).reason, 'not-a-string');
  });
});
