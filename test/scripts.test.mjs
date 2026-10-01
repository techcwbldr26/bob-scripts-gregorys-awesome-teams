/**
 * The four setup scripts are the student's entry point, so they are tested as
 * artefacts: shape, syntax, and — on POSIX — a real run against a temp project.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { after, describe, it } from 'node:test';

import { BOB_PATHS } from '../src/constants.mjs';
import { cleanup, exists, tempDir } from './helpers.mjs';

const run = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = path.join(repoRoot, 'scripts');

const SHELL_SCRIPTS = [
  ['install-macos-intel.sh', 'macos-intel', 'macOS (Intel)'],
  ['install-macos-apple-silicon.sh', 'macos-apple-silicon', 'macOS (Apple silicon)'],
  ['install-linux.sh', 'linux', 'Linux'],
];

const isWindows = process.platform === 'win32';
const read = (file) => fs.readFile(path.join(scriptsDir, file), 'utf8');

after(cleanup);

describe('the four setup scripts exist', () => {
  it('ships one script per supported platform, and nothing else', async () => {
    const entries = (await fs.readdir(scriptsDir, { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();
    assert.deepEqual(entries, [
      'install-linux.sh',
      'install-macos-apple-silicon.sh',
      'install-macos-intel.sh',
      'install-windows.ps1',
    ]);
  });

  it('makes every shell script executable', async () => {
    if (isWindows) return; // Windows does not carry a POSIX executable bit.
    for (const [file] of SHELL_SCRIPTS) {
      const stat = await fs.stat(path.join(scriptsDir, file));
      assert.ok(stat.mode & 0o111, `${file} is not executable`);
    }
  });
});

describe('shell script shape', () => {
  for (const [file, platform, label] of SHELL_SCRIPTS) {
    describe(file, () => {
      it('starts with a portable shebang', async () => {
        assert.ok((await read(file)).startsWith('#!/usr/bin/env bash\n'));
      });

      it('sets strict mode, so a failure stops the run', async () => {
        assert.match(await read(file), /^set -euo pipefail$/m);
      });

      it('declares the platform it is for', async () => {
        const source = await read(file);
        assert.match(source, new RegExp(`GAT_EXPECTED_PLATFORM='${platform}'`));
        assert.match(source, new RegExp(`GAT_PLATFORM_LABEL='${label.replace(/[()]/g, '\\$&')}'`));
      });

      it('explains what to do when the shared library is missing', async () => {
        const source = await read(file);
        assert.match(source, /common\.sh/);
        assert.match(source, /git clone/);
      });

      it('hands off to gat_main', async () => {
        assert.match(await read(file), /gat_main "\$@"/);
      });

      it('passes `bash -n`', async () => {
        if (isWindows) return;
        await run('bash', ['-n', path.join(scriptsDir, file)]);
      });
    });
  }

  it('gives each script a distinct expected platform', async () => {
    const platforms = await Promise.all(
      SHELL_SCRIPTS.map(async ([file]) => /GAT_EXPECTED_PLATFORM='([^']+)'/.exec(await read(file))[1]),
    );
    assert.equal(new Set(platforms).size, SHELL_SCRIPTS.length);
  });
});

describe('scripts/lib/common.sh', () => {
  const lib = () => fs.readFile(path.join(scriptsDir, 'lib', 'common.sh'), 'utf8');

  it('passes `bash -n`', async () => {
    if (isWindows) return;
    await run('bash', ['-n', path.join(scriptsDir, 'lib', 'common.sh')]);
  });

  it('checks both Node thresholds', async () => {
    const source = await lib();
    assert.match(source, /GAT_INSTALLER_MIN_NODE=20/);
    assert.match(source, /GAT_BOB_SHELL_MIN_NODE=24/);
  });

  it('detects a Rosetta shell, so Apple silicon users are not misrouted', async () => {
    assert.match(await lib(), /sysctl\.proc_translated/);
  });

  it('supports s390x, since Bob runs on Linux on IBM Z', async () => {
    assert.match(await lib(), /Linux\)\s+detected='linux'/);
  });

  it('can fetch the kit when run outside a checkout', async () => {
    const source = await lib();
    assert.match(source, /git clone --depth 1/);
    assert.match(source, /XDG_CACHE_HOME/);
  });

  it('never hardcodes an API key', async () => {
    assert.doesNotMatch(await lib(), /fc-[0-9a-f]{8}/);
  });
});

describe('install-windows.ps1', () => {
  const ps = () => read('install-windows.ps1');

  it('has comment-based help with the sections PowerShell users expect', async () => {
    const source = await ps();
    for (const section of ['.SYNOPSIS', '.DESCRIPTION', '.PARAMETER', '.EXAMPLE', '.NOTES']) {
      assert.ok(source.includes(section), `missing ${section}`);
    }
  });

  it('declares a param block with the same options as the shell scripts', async () => {
    const source = await ps();
    assert.match(source, /\[CmdletBinding\(\)\]/);
    assert.match(source, /param\(/);
    for (const option of ['Target', 'Mode', 'Force', 'DryRun', 'Verify']) {
      assert.ok(source.includes(`$${option}`), `missing -${option}`);
    }
  });

  it('validates the mode against the same four values', async () => {
    assert.match(await ps(), /ValidateSet\('hosted', 'oauth', 'keyless', 'local'\)/);
  });

  it('turns on strict mode and stops on error', async () => {
    const source = await ps();
    assert.match(source, /Set-StrictMode -Version Latest/);
    assert.match(source, /\$ErrorActionPreference = 'Stop'/);
  });

  it('refuses to run on a non-Windows PowerShell and points at the right script', async () => {
    const source = await ps();
    assert.match(source, /Assert-Windows/);
    assert.match(source, /install-linux\.sh/);
  });

  it('checks both Node thresholds and offers a winget command', async () => {
    const source = await ps();
    assert.match(source, /InstallerMinNode = 20/);
    assert.match(source, /BobShellMinNode = 24/);
    assert.match(source, /winget install OpenJS\.NodeJS\.LTS/);
  });

  it('tells the student how to get past the execution policy', async () => {
    assert.match(await ps(), /-ExecutionPolicy Bypass/);
  });

  it('propagates the installer exit code', async () => {
    assert.match(await ps(), /\$installerExitCode = \$LASTEXITCODE/);
    assert.match(await ps(), /exit \$installerExitCode/);
  });

  it('drains node output through the pipeline, so it is not lost before exit', async () => {
    // Calling `exit` straight after a native command discarded the installer's
    // report on Windows. CI reads that output to check idempotence.
    assert.match(await ps(), /& node @arguments 2>&1 \| ForEach-Object/);
  });

  it('uses Write-Output, not Write-Host, so its output can be captured', async () => {
    const source = await ps();
    // The explanatory comment is allowed to name it; no call sites may.
    const callSites = source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .filter((line) => line.includes('Write-Host'));
    assert.deepEqual(callSites, []);
  });

  it('has balanced braces, parentheses and brackets', async () => {
    const source = await ps();
    for (const [open, close] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      const opens = source.split(open).length - 1;
      const closes = source.split(close).length - 1;
      assert.equal(opens, closes, `unbalanced ${open}${close}: ${opens} vs ${closes}`);
    }
  });

  it('never hardcodes an API key', async () => {
    assert.doesNotMatch(await ps(), /fc-[0-9a-f]{8}/);
  });

  it('parses as PowerShell when pwsh is available', async () => {
    let pwsh;
    try {
      await run('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major']);
      pwsh = true;
    } catch {
      pwsh = false; // Checked on the Windows CI runner instead.
    }
    if (!pwsh) return;
    const target = path.join(scriptsDir, 'install-windows.ps1').replace(/'/g, "''");
    await run('pwsh', [
      '-NoProfile',
      '-Command',
      `$e=$null; [System.Management.Automation.Language.Parser]::ParseFile('${target}', [ref]$null, [ref]$e) | Out-Null; if ($e.Count) { $e | ForEach-Object { $_.Message }; exit 1 }`,
    ]);
  });
});

describe('a real run of the shell script for this platform', () => {
  it('installs the kit and reports success', async () => {
    if (isWindows || process.platform === 'darwin') return; // Covered by CI's matrix.
    const target = await tempDir();
    const { stdout } = await run(path.join(scriptsDir, 'install-linux.sh'), ['--target', target]);
    assert.match(stdout, /created/);
    assert.ok(await exists(target, BOB_PATHS.agents));
    assert.ok(await exists(target, `${BOB_PATHS.skills}/wizard/SKILL.md`));
  });

  it('refuses when the platform does not match, naming the right script', async () => {
    if (isWindows || process.platform !== 'linux') return;
    const target = await tempDir();
    await assert.rejects(
      () => run(path.join(scriptsDir, 'install-macos-intel.sh'), ['--target', target]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /Wrong script for this machine/);
        assert.match(error.stdout, /install-linux\.sh/);
        return true;
      },
    );
  });

  it('refuses a target directory that does not exist', async () => {
    if (isWindows || process.platform !== 'linux') return;
    await assert.rejects(
      () => run(path.join(scriptsDir, 'install-linux.sh'), ['--target', '/definitely/not/here']),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Target directory does not exist/);
        return true;
      },
    );
  });

  it('prints usage for --help without installing anything', async () => {
    if (isWindows || process.platform !== 'linux') return;
    const { stdout } = await run(path.join(scriptsDir, 'install-linux.sh'), ['--help']);
    assert.match(stdout, /Usage:/);
    assert.match(stdout, /--mode hosted\|oauth\|keyless\|local/);
  });

  it('passes --verify through to the installer', async () => {
    if (isWindows || process.platform !== 'linux') return;
    const target = await tempDir();
    await run(path.join(scriptsDir, 'install-linux.sh'), ['--target', target]);
    const { stdout } = await run(path.join(scriptsDir, 'install-linux.sh'), ['--target', target, '--verify']);
    assert.match(stdout, /Everything checks out/);
  });
});

describe('the wizard template shipped in examples/', () => {
  const template = () => fs.readFile(path.join(repoRoot, 'payload', 'examples', 'wizard-template.sh'), 'utf8');

  it('passes `bash -n`, since students run it unmodified', async () => {
    if (isWindows) return;
    await run('bash', ['-n', path.join(repoRoot, 'payload', 'examples', 'wizard-template.sh')]);
  });

  it('marks where the fixed library ends and authored stages begin', async () => {
    assert.match(await template(), /# --- STAGES ---/);
  });

  it('reads secrets with hidden input, so nothing lands in the scrollback', async () => {
    assert.match(await template(), /read -rs/);
  });

  it('upserts into .env rather than appending duplicates', async () => {
    const source = await template();
    assert.match(source, /env_set\(\)/);
    assert.match(source, /grep -vE/);
  });

  it('opens URLs on macOS, Linux and WSL', async () => {
    const source = await template();
    for (const opener of ['open', 'xdg-open', 'wslview', 'explorer.exe']) {
      assert.ok(source.includes(opener), `missing ${opener}`);
    }
  });

  it('degrades instead of failing when gh is unavailable', async () => {
    const source = await template();
    assert.match(source, /gh_ready/);
    assert.match(source, /note_skipped "GitHub secret/);
  });

  it('ends with a summary that separates what it wrote from what is left', async () => {
    const source = await template();
    assert.match(source, /You still need to do these by hand/);
    assert.match(source, /Written:/);
  });

  it('traps interrupts and tells the student re-running is safe', async () => {
    const source = await template();
    assert.match(source, /trap .* INT/);
    assert.match(source, /Re-run to pick up where you left off/);
  });
});

describe('.gitattributes', () => {
  const attrs = () => fs.readFile(path.join(repoRoot, '.gitattributes'), 'utf8');

  it('pins shell scripts to LF, because CRLF breaks the shebang', async () => {
    const source = await attrs();
    assert.match(source, /^\*\.sh\s+text eol=lf$/m);
    assert.match(source, /^\*\.bash\s+text eol=lf$/m);
  });

  it('pins PowerShell to CRLF', async () => {
    assert.match(await attrs(), /^\*\.ps1\s+text eol=crlf$/m);
  });

  it('pins the payload to LF, so Bob reads identical bytes everywhere', async () => {
    assert.match(await attrs(), /^\*\.md\s+text eol=lf$/m);
  });
});

describe('no shell script carries CRLF line endings', () => {
  it('checks every .sh file in the repository', async () => {
    const files = [
      'scripts/install-macos-intel.sh',
      'scripts/install-macos-apple-silicon.sh',
      'scripts/install-linux.sh',
      'scripts/lib/common.sh',
      'scripts/lib/selfcheck.sh',
      'payload/examples/wizard-template.sh',
    ];
    for (const rel of files) {
      const source = await fs.readFile(path.join(repoRoot, rel), 'utf8');
      assert.ok(!source.includes('\r'), `${rel} contains a carriage return`);
    }
  });
});
