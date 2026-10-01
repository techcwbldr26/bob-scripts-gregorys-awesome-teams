# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-01

First release: the full kit, installable on all four target platforms.

### Added

- **Four setup scripts** — `install-macos-intel.sh`,
  `install-macos-apple-silicon.sh`, `install-linux.sh` and
  `install-windows.ps1`. Each asserts its own platform and names the right
  script when run on the wrong machine, including detecting a Rosetta shell on
  Apple silicon. All four delegate to one Node installer, so behaviour is
  identical everywhere.
- **`/gregorys-awesome-teams` slash command** that orients itself against the
  project's current state and routes the team to the right stage.
- **`AGENTS.md`** and **`SKILLS.md`**, written through a managed block so a
  student's own content survives every re-run.
- **Nine skills** in `.bob/skills/`: `discover-with-firecrawl`,
  `grill-with-docs`, `to-spec`, `implement-with-tests`, `build-evals`,
  `demo-rehearsal`, `wizard`, `rag-architecture`, `harness-tuning`.
- **Four always-on rules** in `.bob/rules/`: evidence over memory, context
  discipline, finish the work, tests and coverage.
- **Firecrawl MCP configuration** merged into `.bob/mcp.json` in four modes —
  `hosted`, `oauth`, `keyless` and `local`. Read-only tools are auto-approved;
  credit-heavy and state-changing tools stay behind a prompt.
- **`examples/`** — a prompt comparison, a filled-in ADR, a spec with assertable
  acceptance criteria, an eval case with its grader and a real result, a
  Firecrawl tool-routing table, and a working `wizard-template.sh`.
- **`references/`** — the flow's rationale, prompt engineering, context
  engineering, harness engineering, the Firecrawl playbook, evals and
  hillclimbing, and an `evidence.md` for the team to fill in.
- **`--verify` doctor** that checks each of Bob's documented silent-failure
  modes: an invalid skill folder name, missing front matter, a name that does not
  match its folder, and an MCP server Bob cannot start.
- **238 tests** with the coverage gate set at 90% lines, branches and functions,
  using Node's own test runner and no npm dependencies.
- **CI** across Ubuntu, macOS and Windows on Node 20 and 24: the suite with the
  coverage gate, shellcheck, PowerShell parsing and PSScriptAnalyzer, payload
  validation, a CRLF guard on the shell scripts, and a real run of each
  platform's script twice to prove idempotence.
- **`.gitattributes`** pinning shell scripts to LF. A CRLF checkout breaks them
  at the shebang, which is exactly what a Windows student running them under
  WSL or Git Bash would hit.

### Notes

- The installer needs Node 20 or later; **Bob Shell itself needs Node 24 or
  later**, and the scripts warn separately about each.
- `.bob/mcp.json` carries `type`, `url` *and* `httpURL` for the remote server,
  because Bob's IDE and Shell documentation disagree on the spelling. Writing all
  three satisfies either reader.
- API keys are referenced as `${FIRECRAWL_API_KEY}` and resolved from Bob's
  encrypted store, so the config file is safe to commit.
- `grill-with-docs` and `wizard` are adaptations of Matt Pocock's skills of the
  same names (MIT). See `NOTICE.md`.

[Unreleased]: https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/releases/tag/v1.0.0
