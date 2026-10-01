# Architecture

## The shape of it

```
scripts/install-macos-intel.sh          thin: detect, check, delegate
scripts/install-macos-apple-silicon.sh
scripts/install-linux.sh                all three source scripts/lib/common.sh
scripts/install-windows.ps1             the same logic in PowerShell
                 │
                 ▼
         src/cli.mjs                    arguments, reporting, exit codes
                 │
                 ▼
         src/install.mjs                orchestration
           │           │
           ▼           ▼
    src/payload.mjs   src/mcp.mjs       render the payload / merge mcp.json
           │           │
           ▼           ▼
         src/fsx.mjs                    the only module that writes
                 │
                 ▼
            payload/                    real markdown, not strings in JS
```

## Why one installer behind four scripts

Four full implementations would drift. Within a semester the Windows script
would be missing a skill the shell scripts have, and nobody would notice until a
student on Windows got different results from their teammate.

So the platform scripts do only what genuinely differs by platform — detect the
OS and architecture, check Node, explain how to install what is missing, locate
the kit — and then hand off to one Node program. Node is the right host because
Bob Shell already requires Node 24, so it is guaranteed present.

The result: the behaviour a student gets is identical everywhere, and it is
tested once.

## Why the payload is markdown on disk

An earlier version held the payload in JavaScript template literals. It worked
and it was miserable: a 200-line skill inside a template literal cannot be read
in review, backticks and `${` have to be escaped, and a diff shows a wall of
string.

Now `payload/` holds the real files. They are reviewed as the documentation they
are, and values that must track Bob's documented limits are written as
`{{TOKEN}}` and substituted at install time from `src/constants.mjs`.

An unknown token is a **failure**, not a silent pass-through: `buildPlan()`
collects them and `install()` refuses. CI checks it separately. A typo'd token
would otherwise reach a student's `AGENTS.md` as literal `{{CONTEXT_CAP}}`.

## Why `constants.mjs` carries source URLs

Every Bob and Firecrawl fact the installer depends on — file paths, the context
cap, tool groups, the minimum Node version, the MCP endpoint — lives in
`src/constants.mjs` with a `source:` comment naming the page it came from.

Bob is a young product and these will move. When something breaks, there is one
file to read and each line says where to check. Scattering `.bob/skills` through
six modules would make the same change a hunt.

## Never destroy a student's work

This is the constraint that shaped `src/fsx.mjs`. Three categories of file:

### Managed — `AGENTS.md`, `SKILLS.md`

Shared with the student, so written through a block:

```markdown
<!-- BEGIN GREGORYS-AWESOME-TEAMS (managed - edits inside this block are overwritten) -->
...our content...
<!-- END GREGORYS-AWESOME-TEAMS -->
```

`applyManagedBlock()` handles four cases: no file (write the block), markers
present (replace between them), content but no markers (keep it, append the
block), markers damaged or reversed (keep everything, append a clean block).

It is tested for idempotence, because this function runs on every re-install and
a bug here either loses a student's rules or duplicates ours on every run.

### Merged — `.bob/mcp.json`

`mergeFirecrawl()` touches only `mcpServers.firecrawl`. Sibling servers and
unrelated top-level keys survive. Prototype-pollution keys are dropped. A
malformed file is **reported and left alone** — overwriting a student's broken
JSON would destroy the server config they were halfway through writing.

The rest of the install still proceeds, so one bad file does not block everything.

### Owned — skills, rules, commands, examples, references

Written whole, but if the contents differ from ours *and* we did not write them,
the file is reported `kept` rather than overwritten. `--force` overrides. A
student who improves a rule keeps their improvement.

## Validating what Bob fails at silently

This drove a lot of the design. Bob skips an invalid skill folder **with no
error at all** — the skill is simply absent, and a student concludes the agent is
ignoring them.

So the kit validates Bob's rules itself, in three places:

| Where | When |
| --- | --- |
| `buildPlan()` | At install time. An invalid payload refuses to install rather than shipping a skill Bob will ignore. |
| `verify()` | On `--verify`, against what is actually on disk. |
| CI's `payload` job | On every push, before a student ever sees it. |

The checks mirror Bob's documented behaviour: folder name lowercase kebab-case
and under 64 characters, front matter present with `name` and `description`,
`name` matching the folder, and an MCP server that has either a `command` or a
URL.

## The `url` / `httpURL` disagreement

Bob's IDE documentation spells a remote MCP server as `type: "streamable-http"`
plus `url`. Bob Shell's documentation uses `httpURL` and states that `url` is not
recognised. Both are current.

Rather than guess, `buildFirecrawlServer()` emits all three keys. Either reader
finds what it expects, and neither is confused by the extra. This is recorded in
`src/mcp.mjs`, in `references/harness-engineering.md` for students, and in the
`$harness-tuning` skill so an agent debugging a connection knows why the file
looks redundant.

A standalone SSE entry is never written: Bob removed that transport.

## Secrets

`.bob/mcp.json` contains `${FIRECRAWL_API_KEY}`, Bob's secret-reference syntax,
resolved from its encrypted store. No key material passes through the installer
at any point — it never asks for one, so it cannot leak one.

A test asserts no built config contains anything matching `fc-` followed by hex,
and `npm run lint:scripts` scans the whole payload for the same pattern.

`$wizard` extends the same property to setup it generates: the agent writes the
script and the student runs it, so a captured key goes from terminal to `.env` or
`gh secret` without entering the model's context.

## Testing

Node's own runner and coverage reporter; no npm dependencies. A teaching repo
that needs a toolchain installed before its tests run teaches the wrong lesson.

- 238 tests, gate at 90% lines, branches and functions. The gate needs Node 22
  or later, so the Node 20 matrix leg runs the suite without it.
- Every test is hermetic: `tempDir()` per test, no network, no writes outside
  temp, nothing that depends on the developer's machine.
- The setup scripts are tested as artefacts — shape, `bash -n`, shellcheck, and a
  real execution against a temp project on POSIX.
- `main()` returns an exit code instead of calling `process.exit`, and takes an
  injectable `io` and Node version. That is what makes the CLI, including the
  old-Node guard, testable without spawning processes.

The one deliberate gap is the `import.meta.url === process.argv[1]`
direct-invocation block in `cli.mjs`, which by design never executes under the
test runner.

## CI

| Job | What it protects |
| --- | --- |
| `test` | The suite and the coverage gate, on 3 operating systems × Node 20 and 24 |
| `shell` | `bash -n`, shellcheck, executable bits, and a secret scan |
| `powershell` | The Windows script parses, and passes PSScriptAnalyzer |
| `smoke` | Each platform's real script runs from a clean checkout — **twice**, asserting the second run is a no-op |
| `payload` | No invalid skill, no unknown token, no unrendered token |
| `all-green` | One required status check for branch protection |

`smoke` is the one that catches what unit tests cannot: that the thing a student
actually types works on their actual operating system.
