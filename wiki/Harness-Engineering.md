# Harness Engineering

The machinery around the model. This is the layer most people never touch, which
is why their results plateau.

Everything here is **files in your repository**. Version-controlled, reviewable,
and shared with your teammates automatically.

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
