# Contributing

This repository is also a worked example of the practices it teaches, so the
process is part of the point. Expect review.

## Setup

```bash
git clone https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git
cd bob-scripts-gregorys-awesome-teams
node --version   # 20+ to develop; 24+ is what Bob Shell needs
```

There are no npm dependencies. The test runner and the coverage reporter are
Node's own, so there is nothing to install.

## The loop

```bash
npm test                              # fast feedback
npm run test:coverage                 # the gate: 90% lines, branches, functions
npm run lint:scripts                  # bash -n, shellcheck, exec bits, secret scan
node src/cli.mjs --target /tmp/scratch --dry-run   # see the plan
node src/cli.mjs --target /tmp/scratch             # really install
node src/cli.mjs --target /tmp/scratch --verify    # check it
```

Always install into a scratch directory, never into this repository.

## Branching

Branch from `main`, open a pull request, let CI run. `main` is protected; CI must
be green before a merge.

Commit messages: a short imperative subject, then why rather than what. The diff
already says what.

## Tests

Write the test before the fix, and watch it fail first. A test you never saw fail
has not been shown to test anything.

- Tests live in `test/*.test.mjs` and use `node:test` plus `node:assert/strict`.
- Use the helpers in `test/helpers.mjs`: `tempDir()` for isolation, `captureIo()`
  for CLI output. `cleanup` is registered with `after()`.
- Keep tests hermetic: no network, no writes outside a temp directory, no
  dependence on the developer's machine.
- Spend effort on boundaries, unhappy paths and contracts. Do not spend it
  asserting that Node works.

The gate is a floor, not a target. Reaching 90% by deleting an assertion, adding
a skip, or excluding a file is not acceptable — if a test is genuinely wrong, say
why in the pull request and fix it deliberately.

## Adding a skill

Skills are the cheap place to add depth: Bob keeps only the `description` in
context and loads the body when it decides the skill applies.

1. `mkdir payload/skills/<lowercase-kebab-name>`
2. Write `SKILL.md`:

   ```markdown
   ---
   name: <exactly the folder name>
   description: <what it does AND when it should fire>
   ---

   The instructions.
   ```

3. `npm run test:coverage` — the payload tests validate the new skill
   automatically.

**Bob fails silently here, so these are enforced in CI:**

- Folder name is lowercase kebab-case and under 64 characters. Anything else and
  Bob skips the folder with no error at all.
- `name` matches the folder name.
- `description` is present. A skill without one is ignored.
- The description is at least 60 characters and says *when* to use the skill —
  it is the only part Bob sees when routing, so "Code review skill" is useless.

Add the skill to the chain or the side-list in `payload/SKILLS.block.md` if it
belongs there, and to the table in `README.md`.

## Adding a rule

Rules in `payload/rules/` load on **every turn**, so the bar is higher: a rule
must always apply. If it only sometimes applies, it is a skill.

Files are numbered because Bob loads them alphabetically. Keep the existing
spacing (`00-`, `10-`, `20-`, `30-`) so a new rule can be slotted between two
others without renaming anything.

## Adding an example or reference

- `payload/examples/` — worked artefacts a student copies. Fill them in; a blank
  template teaches nothing. Add a row to `payload/examples/README.md`.
- `payload/references/` — depth a skill cites by name. Add a row to
  `payload/references/README.md`, and cite the file from whichever skill needs it,
  because nothing reads it otherwise.

## Changing the installer

The rule that matters: **never destroy a student's work.**

- A shared file (`AGENTS.md`, `SKILLS.md`) is edited through the managed block in
  `src/fsx.mjs`. Never write one whole.
- `.bob/mcp.json` is merged in `src/mcp.mjs`. Preserve sibling servers and
  unrelated top-level keys. A malformed file is reported, never replaced.
- A file the student has edited is reported `kept` unless `--force`.
- Installing twice must be a no-op. CI checks this on all three platforms.

Any new fact about Bob or Firecrawl goes in `src/constants.mjs` with a `source:`
comment naming the documentation page. Do not scatter paths and limits through
the code — when Bob changes, there must be one place to look.

## Changing the scripts

Changes usually need mirroring across all four. If a change applies to macOS and
Linux, it probably belongs in `scripts/lib/common.sh` rather than in each script.

- `shellcheck` must be clean at `--severity=warning`.
- PowerShell must parse and pass PSScriptAnalyzer at Error and Warning level.
- Nothing destructive runs without a typed confirmation.
- A failure must say what to do next. "Error: failed" helps nobody.

Test by running the script for your own platform against a scratch directory,
and confirm the wrong-platform guard still refuses correctly.

## Secrets

Never commit an API key, and never write one into a payload file. The key is
referenced as `${FIRECRAWL_API_KEY}` and resolved from Bob's encrypted store.
`npm run lint:scripts` scans for anything key-shaped, and CI fails on a hit.

## Reporting a problem

Use the issue templates. For a skill that seems ignored, work through the
checklist in the bug template first — Bob skipping an invalid skill folder
silently accounts for most of these.
