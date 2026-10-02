<p align="center">
  <img src="assets/banner.svg"
       alt="Animated diagram in three acts. A Bob context window fills with the system prompt, rules, MCP tools, messages, file reads and tool results until it passes the 190k compaction threshold at 193k. Compaction then collapses the older turns into a single conversation summary, leaving 12.3k and losing the middle of the conversation. Finally the kit's features appear: AGENTS.md, four always-on rules, nine skills, references and examples, the Firecrawl MCP server, the slash command, TASKS.md and four setup scripts, with the same session rerun at 38k and the build chain discover, grill, spec, implement, evals, demo."
       width="900">
</p>

# Gregory's Awesome Teams

> ### Never used an AI assistant before?
>
> **[Start here](START-HERE.md).** Copy one block of text, paste it into Bob, and
> it will set your project up for you — checking Node, installing the kit and
> walking you through the free Firecrawl key. About ten minutes, most of it
> waiting.
>
> Then read **[the handbook](https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/wiki)**:
> the six-stage build flow, a plain-English glossary, and what to do about
> December 1st.


Setup scripts that turn a plain project directory into one the **IBM Bob**
harness already knows how to work in — so a university team can point Bob at
their product idea and get useful work instead of confident guesses.

This is a teaching kit for prompt, context and harness engineering. The thing it
installs is the lesson.

## Quick start

Pick the script for your machine, run it from inside your project directory:

```bash
# macOS, Apple silicon (M1/M2/M3/M4)
./scripts/install-macos-apple-silicon.sh

# macOS, Intel
./scripts/install-macos-intel.sh

# Linux (x86_64, arm64, or s390x)
./scripts/install-linux.sh
```

```powershell
# Windows 11
.\scripts\install-windows.ps1
```

Then, in Bob:

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
/gregorys-awesome-teams  I want to build <your idea>
```

Not sure how to word a request? Put `/improve-prompt` in front of it and send
the rough version:

```
/improve-prompt  make the search better
```

You get back a structured prompt, a table of what changed and why, and anything
that should move out of your prompt and into the harness. It rewrites; it does
not run the task.

Get a free Firecrawl key at <https://www.firecrawl.dev/signup> — 1,000 credits a
month, refreshed monthly, no credit card. Connect your social accounts for more.

Full walkthrough: [docs/student-quickstart.md](docs/student-quickstart.md).

## What gets installed

```
your-project/
├── AGENTS.md                   Loaded by Bob every turn — short on purpose
├── SKILLS.md                   Index of the installed skills
├── .bob/
│   ├── mcp.json                Firecrawl MCP server (merged, not overwritten)
│   ├── commands/
│   │   ├── gregorys-awesome-teams.md    Routes an idea into the build flow
│   │   └── improve-prompt.md            Rewrites a rough prompt, and explains it
│   ├── rules/                  Four always-on rules
│   └── skills/                 Nine skills, loaded on demand
├── examples/                   Worked artefacts to copy
└── references/                 Depth Bob reads only when a skill cites it
```

### The nine skills

| Skill | What it does |
| --- | --- |
| `$discover-with-firecrawl` | Replace assumptions with verified evidence before designing |
| `$grill-with-docs` | Interview the team until the plan is sharp; record terms and ADRs |
| `$to-spec` | Turn a settled conversation into acceptance criteria a test can assert |
| `$implement-with-tests` | Build test-first, to the 90% coverage gate |
| `$build-evals` | Measure the AI parts, then hillclimb one change at a time |
| `$demo-rehearsal` | Harden the project for a live audience and rehearse the failures |
| `$wizard` | Generate a setup script for whatever a human must click through |
| `$rag-architecture` | Turn "we'll use RAG" into real chunking and retrieval decisions |
| `$harness-tuning` | Diagnose Bob itself when it is the thing misbehaving |

`$grill-with-docs` and `$wizard` are adaptations of Matt Pocock's skills of the
same names (MIT). See [NOTICE.md](NOTICE.md).

### The build chain

```
discover → grill → spec → implement (TDD) → evals → demo rehearsal
```

Each stage exists to stop one expensive failure, and each makes the next one
cheaper. The reasoning is in `references/the-flow.md` once installed.

## Why Firecrawl rather than a built-in search

A built-in web search returns links and a summary; the agent then has to fetch
each page, so one question becomes ten tool calls. Firecrawl's search results
carry the page content as markdown, and it adds three things a plain fetch does
not have:

- **A real browser**, so JavaScript-heavy pages return content instead of an
  empty shell.
- **Purpose-built indexes** over GitHub issues, merged PRs, READMEs and docs, and
  over research paper abstracts.
- **Alexandria**, a catalogue of data providers returning typed records with a
  contract — so a number in a demo is real rather than plausible.

The installed `references/firecrawl-playbook.md` covers every tool, when to reach
for it, and what it costs.

## Installer options

Every script passes these through to the same Node installer, so behaviour is
identical on all four platforms:

| Option | Effect |
| --- | --- |
| `--target <dir>` | Install into `<dir>` instead of the current directory |
| `--mode hosted` | Hosted Firecrawl MCP with your key (default) |
| `--mode oauth` | Hosted MCP with browser sign-in; no key stored anywhere |
| `--mode keyless` | No key. Search, scrape and parse only, rate limited, no Alexandria |
| `--mode local` | Run the open-source Firecrawl server locally over stdio |
| `--dry-run` | Report what would be written, write nothing |
| `--verify` | Check an existing installation and exit |
| `--force` | Overwrite kit files you have edited |

## It will not overwrite your work

- `AGENTS.md` and `SKILLS.md` are edited through a **managed block**. Anything
  you wrote outside the markers survives every re-run.
- `.bob/mcp.json` is **merged**. Other MCP servers and unrelated keys are kept.
  A malformed file is reported, not replaced.
- A kit file you have edited is **left alone** and reported as `kept`, unless you
  pass `--force`.
- Running the installer twice is a no-op. CI checks that.

## Your API key never enters the repository

`.bob/mcp.json` references the key as `${FIRECRAWL_API_KEY}`, which Bob resolves
from its own encrypted store. That is why the file is safe to commit.

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
/manage-secrets list
```

## Development

```bash
npm test               # the suite
npm run test:coverage  # the suite, with the 90% gate enforced
npm run lint:scripts   # bash -n, shellcheck, exec bits, secret scan
```

Requirements: Node 20+ to run the installer; **Node 24+ for Bob Shell itself**.
No npm dependencies — the test runner and coverage are Node's own.

CI runs the suite on Ubuntu, macOS and Windows against Node 20 and 24, lints the
shell and PowerShell scripts, validates the payload, and runs each platform's
real setup script twice to prove it is idempotent.

Node's coverage-threshold flags arrived in Node 22, so the Node 20 matrix leg
runs the suite without the gate; the gate itself runs on every platform via
Node 24.

See [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/architecture.md](docs/architecture.md).

## Documentation

| Document | For |
| --- | --- |
| [docs/student-quickstart.md](docs/student-quickstart.md) | Students, start to finish |
| [docs/firecrawl-setup.md](docs/firecrawl-setup.md) | Getting and storing the free key |
| [docs/architecture.md](docs/architecture.md) | How the installer works, and why |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Adding a skill, example or reference |

## Licence

MIT — see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
