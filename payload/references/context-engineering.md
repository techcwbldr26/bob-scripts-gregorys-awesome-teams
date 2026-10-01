# Context engineering in Bob

## The numbers

| Quantity | Value |
| --- | --- |
| Context window cap, per task | {{CONTEXT_CAP}} tokens |
| Compaction typically begins around | {{COMPACTION_START}} tokens |
| Reserved for the model's reply | about {{RESERVED_REPLY}} tokens, not counted in the used total |

Source: <https://bob.ibm.com/docs/ide/core-concepts/context-window-management>

Compaction keeps the system prompt, tool definitions, rules and skills, then
summarises or drops older conversation. **It is lossy.** A decision you made
early can quietly stop being part of the conversation. Everything below is about
not needing it.

## What is actually in your window

Bob's token indicator breaks usage into six categories. Learn to read it, because
the fix is different for each.

| Category | What it is | When it is the problem |
| --- | --- | --- |
| System prompt | Bob's own instructions | Never yours to fix |
| Tool definitions | Schemas for built-in tools | Narrow tool groups with `--disable-tool-groups` |
| MCP Tools | Schemas from connected MCP servers | Too many servers, or unused tools left on |
| Rules | `AGENTS.md` and `.bob/rules-*` | `AGENTS.md` has grown — move depth into skills |
| Skills | Each installed skill's *description* only | Rarely; descriptions are small |
| Messages | The conversation: your prompts, replies, tool results, `@` mentions, command output | Usually this. Broad mentions and whole-file reads. |

On a small sample project, a bare "say hi" turn costs about 8,500 tokens before
you have said anything useful: tool definitions 5,100, system prompt 1,500,
rules 830, skills 454, messages 590. That is your floor, and it is mostly tool
definitions — which is why disconnecting MCP servers you are not using is the
single biggest structural saving available.

## Why long conversations get expensive fast

Every turn re-sends the whole conversation. Turn 50 pays for turns 1 to 49 again.
Cost over a session therefore grows much faster than the number of turns, and the
quality falls at the same time because compaction starts eating earlier context.

The practical consequence: **a new task per topic is not tidiness, it is economy.**

## The six habits

1. **Mention with line ranges.**
   `@src/utils/validation.ts:45-67 Fix the email validation` — not
   `@/src @/tests @/docs Review everything`. The second one is a request to pay
   for your whole repository.

2. **Keep state in files, not in scrollback.** `TASKS.md` for the checklist,
   `GLOSSARY.md` for vocabulary, `docs/adr/` for decisions,
   `references/evidence.md` for facts. Files survive compaction, `/clear`, and
   the person who held the context being away. Scrollback survives none of those.

3. **Send wide reads to a subagent.** A subagent reading thirty files returns one
   compacted answer into your window instead of thirty file contents. This is the
   difference between an audit that fits and one that triggers compaction halfway.

4. **New task when the topic changes.** Not when the window is full — when the
   *topic* changes. The cheap moment is before you have paid for the mixing.

5. **Connect only what you need.** Per-server and per-tool toggles exist. An MCP
   server you are not using this week is a tax on every turn.

6. **Prefer project-scoped MCP config.** `.bob/mcp.json` travels with the repo, so
   teammates get the same tools, and nothing global leaks into unrelated work.

## When to compact, and when to clear

| Situation | Move |
| --- | --- |
| Mid-task, window filling, the work must continue | `/compact` — lossy, but keeps going |
| A topic is finished and the next one is unrelated | `/clear` — cheapest, and loses nothing you have written to a file |
| The conversation *is* the artefact (a grilling session) | Neither. Hand it to `$to-spec` while it is still intact. |

That last row is the one teams get wrong: clearing a grilling session before
writing the spec throws away most of what was decided, because only terms and
ADRs were written to disk.
