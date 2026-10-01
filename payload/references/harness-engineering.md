# Harness engineering: Bob's configuration surface

Prompt engineering is what you say. Context engineering is what the model can
see. Harness engineering is the machine around it — and it is the layer students
usually never touch, which is why their results plateau.

Everything here is files in your repository. All of it is version-controlled, all
of it is reviewable, all of it travels to your teammates.

## The map

| Feature | Project scope | Global scope |
| --- | --- | --- |
| Instructions | `AGENTS.md` (repo root) | `~/.bob/AGENTS.md` |
| Rules | `.bob/rules/*.md` | `~/.bob/rules/*.md` |
| Mode-specific rules | `.bob/rules-{mode}/*.md` | `~/.bob/rules-{mode}/*.md` |
| Skills | `.bob/skills/<name>/SKILL.md` | `~/.bob/skills/<name>/SKILL.md` |
| Slash commands | `.bob/commands/<name>.md` | `~/.bob/commands/<name>.md` |
| MCP servers | `.bob/mcp.json` | `~/.bob/settings/mcp.json` |
| Custom modes | `.bob/custom_modes.yaml` | `~/.bob/settings/custom_modes.yaml` |
| Ignored files | `.bobignore` | — |

Project scope beats global scope on a name collision, everywhere.

## AGENTS.md — the expensive file

Loaded automatically on **every turn**, so every line competes for attention and
is paid for repeatedly. Keep it to the rules that must always apply: how to
behave, the commands to run, the project's non-negotiables.

Rules load recursively in alphabetical order, which is why this project's rule
files are numbered. Empty files are silently skipped.

## Skills — the cheap file

The opposite economics, and the reason to prefer them. Only a skill's
`description` sits in context; the body loads when Bob decides it applies. You can
install twenty skills for roughly the cost of twenty sentences.

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

Only `name` and `description` are documented front-matter fields.

**The silent failures.** These produce a skill that is simply absent, with no
error message:

- Folder name not lowercase kebab-case, or over 64 characters → skipped silently.
- `description` missing → the skill is ignored.
- File not named exactly `SKILL.md`.
- Folder not trusted, or Bob not restarted after adding it.

If a skill seems ignored, ask Bob which skills it loaded before assuming it is
disobeying you. Check the Skills tab, or `/skills`.

**Write the description for the router, not the reader.** It is the only part Bob
sees when deciding. "Code review skill" gives it nothing. "Review code for bugs,
security issues and best practices" gives it a decision.

## Slash commands — the front door

One markdown file per command, filename becomes the name:
`.bob/commands/deploy-check.md` → `/deploy-check`.

```markdown
---
description: Shown in the command menu
argument-hint: <endpoint-name> <http-method>
---
Create an endpoint called $1 handling $2 requests.
```

Positional arguments are `$1`, `$2`. Group related commands in subdirectories.

## MCP — tools from outside

Project config is `.bob/mcp.json`. The top-level key is `mcpServers`.

A local (stdio) server:

```json
{
  "mcpServers": {
    "local-server": {
      "command": "npx",
      "args": ["-y", "some-mcp-server"],
      "env": { "API_KEY": "${MY_SECRET}" },
      "alwaysAllow": ["safe_read_tool"],
      "disabled": false
    }
  }
}
```

A remote server. **Bob's own docs disagree here:** the IDE pages use
`type: "streamable-http"` with `url`; the Bob Shell page uses `httpURL` and says
`url` is not recognised. This project writes all three keys so either reader
works:

```json
{
  "mcpServers": {
    "remote-server": {
      "type": "streamable-http",
      "url": "https://example.com/mcp",
      "httpURL": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${MY_TOKEN}" },
      "timeout": 600000
    }
  }
}
```

There is **no standalone SSE transport** any more. Do not write `"type": "sse"`.

**Secrets never go in this file.** `${KEY}` resolves from Bob's encrypted store:

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
/manage-secrets list
/manage-secrets rm FIRECRAWL_API_KEY
```

That is why `.bob/mcp.json` is safe to commit.

**`alwaysAllow` is a design decision, not a convenience.** Auto-approve the
read-only tools so your team is not click-fatigued into approving everything;
leave anything that spends real money, mutates remote state or drives a browser
behind a prompt. This project's config does exactly that — read-only Firecrawl
tools are allowed, crawl, agent, interact and monitor-write are not.

## Tool groups — spending context on tools you use

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

## Custom modes — a named configuration

For a repeated kind of work, define a mode rather than re-explaining it:

```yaml
customModes:
  - slug: demo-prep
    name: 🎤 Demo Prep
    description: Hardens the project for the live demo.
    roleDefinition: You prepare this project to be demonstrated live.
    whenToUse: Use in the final weeks before the presentation.
    groups:
      - read
      - - edit
        - fileRegex: "\\.(md|sh)$"
          description: Docs and scripts only
      - skill
```

The nested `edit` restriction is worth noticing: a mode can be allowed to edit
documentation and nothing else. `slug` takes letters, numbers and hyphens only,
and an invalid `fileRegex` can stop the whole file loading.

## The order to tune in

When results are bad, work cheapest-first:

1. **The prompt** — is the finish line stated? (free)
2. **The context** — is the window hot, or full of things you did not need? (free)
3. **The rules** — does `AGENTS.md` say what you assumed it said? (minutes)
4. **The skills** — did the skill load at all? (minutes)
5. **The tools** — is the MCP server connected and authorised? (minutes)
6. **The model and effort** — only after the five above. (changes everything, measures nothing)

Reaching for 6 first is the most common mistake, and it hides the real cause.
