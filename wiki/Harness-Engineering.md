# Harness Engineering

> **Agent = Model + Harness.**
>
> — Birgitta Böckeler, [Harness engineering for coding agent
> users](https://martinfowler.com/articles/harness-engineering.html),
> martinfowler.com, 2 April 2026

The harness is *everything in an agent except the model*: the instructions it
sees on every turn, the rules it is not allowed to break, the files it can
reach, the tools it can call, and the checks its work has to survive before you
believe it.

You cannot change the model. You can change all of the rest. That is why this is
the layer that decides whether two teams with the same Bob licence and the same
idea end up with the same demo.

Everything here is **files in your repository** — version-controlled,
reviewable, and shared with your teammates automatically.

---

## Why the harness, and not the model

BCG built a fully agentic advisory platform for a large Southeast Asian bank and
reported a 30%+ uplift in wealth-adviser revenue productivity, a five-fold gain
in engineering efficiency, and design-to-deployment 50% faster. Their own
account of where that came from is the part worth reading twice:

> These enhancements came less from the selected model and far more from the
> harness around it — the evaluation and approval processes and the behavioral
> guardrails.
>
> — Aparna Kapoor, Vincent Paca and Nerijus Zemgulys, [Harness Engineering: The
> Operating System for Agentic
> AI](https://www.bcg.com/publications/2026/harness-engineering-scale-agentic-ai),
> BCG, 16 September 2026

And the thesis behind it: *"As AI models become increasingly commoditized,
winning with AI won't depend on having the best model. It will depend on
building an effective harness — one that captures a company's specific
processes, ways of working, and requirements."*

Your project is smaller than a bank. The argument is the same size. The model
you are given is the same model everyone else is given.

---

## The five parts of a harness

BCG describes the harness as an **operating system** around the agent, with five
components. Every one already exists in your project — this kit installs them.
Learn the table, because it tells you *where to go when something goes wrong*.

| Part | What it does | In a PC's OS | In your repo |
| --- | --- | --- | --- |
| **Specs** | the scope contract: the purpose, the boundaries, and criteria a machine can test | application manifest | `docs/spec/*.md`, written by `$to-spec` |
| **Constitution** | the non-negotiables: always do this, never do that, escalate here | the kernel | `.bob/rules/*.md` and `AGENTS.md` |
| **Control panel** | what the agent actually did, and the trail that proves it | process manager | `TASKS.md`, plus your git history and PRs |
| **Context hub** | the background the agent needs so that it stops guessing | shared memory | `references/`, `examples/`, `GLOSSARY.md`, the Firecrawl MCP server |
| **Quality gates** | the checks an output has to survive to count as done | system calls and permissions | tests, the 90% coverage gate, `$build-evals`, your own review |

On the context hub, BCG is blunt about what its absence costs:

> Inadequate context is a key reason why agents fail. Without a rich context
> hub, agents often end up (confidently but incorrectly) guessing when faced
> with missing information.

That sentence describes most bad agent sessions you will have this term.

---

## Two mechanisms: guides and sensors

Böckeler splits the harness into **guides**, which act *before* the agent works,
and **sensors**, which act *after*. It is the fastest diagnostic you have:

| What happened | What is missing | Where you fix it |
| --- | --- | --- |
| Bob did the wrong thing | a **guide** — it never knew the constraint | `AGENTS.md`, `.bob/rules/`, a skill, the spec |
| Bob did the wrong thing and **nobody noticed until later** | a **sensor** — nothing was checking | a test, a lint rule, an eval, a CI job |

Teams reach for the first column and forget the second. A missing sensor is the
more expensive bug: it does not cost you one bad run, it costs you every bad run
between now and the day someone happens to look.

A well-built harness, in Böckeler's terms, does two things: it raises the
chance the agent gets it right the first time, and it gives a feedback loop that
*self-corrects as many issues as possible before they even reach human eyes*.

---

## Not all gates are equal

The common mistake, per BCG, is treating every check as the same kind of check.
They distinguish four, and your project has a version of each:

1. **Automated gates** stop programmatic failures — your test suite, the
   coverage gate, `npm run lint:scripts`, CI.
2. **Evaluation gates** are specialist critics judging the worker's output —
   `$build-evals` builds yours, and a graded eval set is exactly this.
3. **Human stage gates** are where a *named person* marks something complete —
   your PR reviews, and the moment someone signs off the spec.
4. **Regulatory gates** check compliance. Yours is lighter: licence terms, your
   university's academic-honesty rules, and not committing anyone's API key.

---

## Humans move up, not out

> A good harness should not necessarily aim to fully eliminate human input, but
> to direct it to where our input is most important.
>
> — Böckeler, *Harness engineering for coding agent users*

BCG describes the same shift: humans act as **system supervisors** who set goals
and boundaries up front, let the agent handle routine work, and intervene at
critical checkpoints. Trust is earned gradually along a *maturity ladder* — a
new or risky area starts at "check everything" and moves to "spot check now and
then" only once the outputs have proved themselves.

This is the right way to think about your eleven weeks. Early on you read
everything Bob writes. By demo rehearsal you should be reading the gates, not
the diffs — **but only because you built gates worth reading.**

---

## How to start

BCG's three rules for organisations are, unchanged, the three rules for your
team:

- **Start small.** A harness is an operating system with interacting parts. Add
  one rule or one skill, see what it changes, then add the next.
- **Build, don't buy.** The kit gives you the shape; the content has to be
  yours. Your glossary, your rules, your evidence, your acceptance criteria —
  that is the part a competing team cannot copy.
- **Be selective.** The best candidates for agentic work are tasks where the
  work is documented, the quality can be checked, and the tools already exist.
  If you cannot describe how you would know it worked, fix that first.

---

## The map

| Feature | Your project | Your machine (global) |
| --- | --- | --- |
| Instructions | `AGENTS.md` (repo root) | `~/.bob/AGENTS.md` |
| Rules | `.bob/rules/*.md` | `~/.bob/rules/*.md` |
| Skills | `.bob/skills/<name>/SKILL.md` | `~/.bob/skills/<name>/SKILL.md` |
| Slash commands | `.bob/commands/<name>.md` | `~/.bob/commands/<name>.md` |
| MCP servers | `.bob/mcp.json` | `~/.bob/settings/mcp.json` |
| Custom modes | `.bob/custom_modes.yaml` | `~/.bob/settings/custom_modes.yaml` |
| Ignored files | `.bobignore` | — |

**Project scope beats global scope** on a name collision, everywhere.

---

## `AGENTS.md` — the expensive file

Loaded automatically on **every turn**. Every line competes for attention and is
paid for repeatedly.

Keep it to rules that must *always* apply: how to behave, the commands to run,
the project's non-negotiables. Rules load alphabetically, which is why yours are
numbered `00-`, `10-`, `20-`, `30-` — leaving gaps so a new rule can slot between
two others without renaming anything.

---

## Skills — the cheap file

The opposite economics, and the reason to prefer them.

**Only a skill's `description` sits in context.** The body loads when Bob decides
it applies. You can install twenty skills for roughly the cost of twenty
sentences.

```
.bob/skills/my-skill/
├── SKILL.md          # required: front matter + instructions
├── checklist.md      # optional supporting files, read on demand
└── scripts/
    └── analyze.sh
```

```markdown
---
name: my-skill
description: What this does and when it should fire
---

The instructions Bob receives when this skill activates.
```

### The silent failures

These produce a skill that is simply **absent, with no error message**:

- Folder name not lowercase-kebab-case, or over 64 characters → **silently skipped**
- `description` missing → the skill is ignored
- File not named exactly `SKILL.md`
- Folder not trusted, or Bob not restarted after adding it

If a skill seems to be ignored, **ask Bob which skills it loaded** before
concluding it is disobeying you. Or run the kit's `--verify`, which checks every
one of these.

### Write the description for the router, not the reader

It is the only part Bob sees when deciding. "Code review skill" gives it nothing.
"Review code for bugs, security issues and best practices" gives it a decision.

---

## MCP — tools from outside

Project config is `.bob/mcp.json`. Top-level key is `mcpServers`.

**Secrets never go in this file.** `${KEY}` resolves from Bob's encrypted store:

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
/manage-secrets list
/manage-secrets rm FIRECRAWL_API_KEY
```

That is why `.bob/mcp.json` is safe to commit and share.

### A quirk worth knowing

Bob's own documentation disagrees with itself about remote MCP servers: the IDE
pages use `type: "streamable-http"` with `url`, while the Bob Shell page uses
`httpURL` and says `url` is not recognised.

Your config writes **all three keys**, so either reader finds what it expects. If
the file looks redundant, that is why.

There is no standalone SSE transport any more. Do not write `"type": "sse"`.

### `alwaysAllow` is a design decision

Auto-approve the read-only tools so your team is not click-fatigued into
approving everything; leave anything that spends real money, changes remote
state, or drives a browser behind a prompt.

Your config does exactly that — read-only Firecrawl tools are allowed; crawl,
agent, interact and monitor-write are not.

---

## Tool groups

| Group | Contains | Agent | Plan | Ask |
| --- | --- | --- | --- | --- |
| `read` | File reading, search, listing | ✓ | ✓ | ✓ |
| `edit` | File write and diff | ✓ | ✓ | ✓ |
| `execute` | Shell commands | ✓ | — | — |
| `mcp` | MCP server tools | ✓ | ✓ | ✓ |
| `skill` | Skill tools | ✓ | ✓ | ✓ |
| `todo` | To-do management | ✓ | ✓ | — |
| `subagent` | Spawning subagents | ✓ | — | — |
| `mode` | Mode switching | ✓ | ✓ | ✓ |

Trim them for a focused run:

```bash
bob run --disable-tool-groups execute,mcp "Review @src/"
bob run --disable-mcp "Explain @app.js"
```

---

## The order to tune in

When results are bad, work **cheapest first**:

1. **The prompt** — is the finish line stated? *(free)*
2. **The context** — is the window hot, or full of things you did not need? *(free)*
3. **The rules** — does `AGENTS.md` say what you assumed it said? *(minutes)*
4. **The skills** — did the skill load at all? *(minutes)*
5. **The tools** — is the MCP server connected and authorised? *(minutes)*
6. **The model and effort** — only after the five above.

**Reaching for 6 first is the most common mistake**, and it hides the real cause.
The `$harness-tuning` skill walks this order for you.
