---
name: harness-tuning
description: Diagnose and fix the Bob harness itself when it behaves badly — ignoring rules, forgetting context, stopping early, burning Bobcoins, or failing to load skills and MCP tools. Use when the problem is the agent's setup rather than the project's code.
---

When output is bad, the cause is usually the harness, not the model. Diagnose
in this order; each step is cheaper than the one after it.

## 1 — Is the context window the problem?

Bob's cap is {{CONTEXT_CAP}} tokens; compaction starts around
{{COMPACTION_START}} and is lossy. Symptoms of running hot: earlier
decisions forgotten, instructions followed at the start and dropped later,
answers that contradict something agreed an hour ago.

Check the token indicator and its breakdown: System prompt, Tool definitions,
MCP Tools, Rules, Skills, Messages.

| Where it went | What to do |
| --- | --- |
| **Messages** is huge | Broad `@` mentions or whole-file reads. Use line ranges. Send repo-wide reads to a subagent so results come back compacted. |
| **MCP Tools** is huge | Too many servers connected. Disable what this task does not need; turn off unused tools per server. |
| **Rules** is huge | `AGENTS.md` has grown. It is paid for on *every* turn — move depth into skills, which load on demand. |
| **Tool definitions** is huge | Narrow the tool groups: `bob run --disable-tool-groups execute,mcp "..."` |

Start a new task when the topic changes. One long thread costs more every turn,
because every turn re-sends the whole conversation.

## 2 — Did the skill actually load?

A skill that did not load looks exactly like a skill that was ignored. Ask Bob
directly which skills it loaded. Then check, in order:

- Folder name is lowercase kebab-case, under 64 characters. **Bob silently skips
  invalid folder names** — no error, the skill is simply absent.
- The file is `SKILL.md`, uppercase, directly inside the skill folder.
- Front matter has both `name` and `description`. **A skill without a
  description is ignored.**
- `name` matches the folder name.
- The folder is trusted (`/permissions`), and Bob was restarted after the skill
  was added.
- Project `.bob/skills/` beats global `~/.bob/skills/` on a name collision.

Verify with the Skills tab in Settings, or `/skills`.

## 3 — Are the MCP tools connected?

Run `/mcp`. If `firecrawl` is missing:

- Project config is `.bob/mcp.json`; global is `~/.bob/settings/mcp.json`.
  Project wins. Prefer project scope so the config travels with the repo.
- Bob's docs disagree about remote-server spelling: the IDE uses
  `type: "streamable-http"` with `url`; Bob Shell uses `httpURL`. This project's
  config writes both, so either reader works.
- A `401` means the credential, not the config. Confirm the secret is set:
  `/manage-secrets list`.
- There is no standalone SSE transport any more; do not add `"type": "sse"`.
- Restart Bob after editing the file.

## 4 — Is it stopping instead of continuing?

If runs end with a summary naming the next step rather than taking it, or with
"Want me to continue?", that is an instruction problem. `AGENTS.md` carries a
keep-going rule. Check it is still there and still the first thing in the file.

Keep permission prompts **on** for destructive commands. A keep-going rule plus
auto-approved destructive actions is how a team loses a branch.

## 5 — Is it the prompt?

- Delete "think carefully" / "think step by step" from prompts and from
  `AGENTS.md`. Current models decide their own thinking; the instruction wastes
  tokens and delays the first useful output. To change thinking, change effort.
- Say what "done" looks like, in the same message as the task.
- Add to a running task instead of restarting it — restarts cost a whole run.
- For design work, list the styles you do *not* want. A general "don't look
  generic" just swaps one default for another.

## 6 — Bobcoins

Consumption scales with work, and conversation cost grows faster than
conversation length because each turn re-sends the whole context. The cheap wins:
shorter `AGENTS.md`, fewer connected MCP servers, `/compact` before a long
stretch, a new task per topic, and subagents for wide reads.

## Report

Name the cause you found, the fix, and how to tell it worked. If you changed
`AGENTS.md`, `.bob/mcp.json` or a skill, say which file and why.
