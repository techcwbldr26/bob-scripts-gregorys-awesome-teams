# Context Engineering

What the model can see while you talk to it. The thing that silently decides
whether a long session stays good or quietly falls apart.

---

## The numbers

| Quantity | Value |
| --- | --- |
| Context window, per task | **270,000 tokens** |
| Compaction typically begins | around **190,000 tokens** |
| Reserved for the reply | about **20,000**, not counted in the used total |

Source: [Bob's context window documentation](https://bob.ibm.com/docs/ide/core-concepts/context-window-management).

---

## Why long conversations get expensive *and* worse

**Every turn re-sends the whole conversation.** Turn 50 pays for turns 1 to 49
again. So cost grows much faster than the number of turns.

At the same time, once you pass ~190k, compaction starts summarising away your
earlier turns. It keeps the system prompt, your rules and your skills, and
compresses the rest.

**Compaction is lossy.** A decision you made at turn 3 can stop existing, and
nothing tells you.

So the goal is not to manage compaction well. It is to **not need it**.

---

## What is actually in your window

Bob's token indicator breaks usage into six categories. Learn to read it, because
the fix is different for each.

| Category | What it is | When it is the problem |
| --- | --- | --- |
| System prompt | Bob's own instructions | Never yours to fix |
| Tool definitions | Schemas for built-in tools | Narrow them with `--disable-tool-groups` |
| MCP Tools | Schemas from connected servers | Too many servers connected |
| Rules | `AGENTS.md`, `.bob/rules-*` | `AGENTS.md` has grown — move depth into a skill |
| Skills | Each skill's *description* only | Rarely; descriptions are tiny |
| Messages | Your prompts, replies, tool results, `@` mentions | **Usually this one** |

On a small project, a bare "say hi" turn costs about **8,500 tokens** before you
have said anything useful: tool definitions 5,100, system prompt 1,500, rules 830,
skills 454, messages 590.

That floor is mostly **tool definitions** — which is why disconnecting MCP servers
you are not using is the single biggest structural saving available.

---

## The six habits

**1. Mention files with line ranges.**

```
✓  @src/utils/validation.ts:45-67 Fix the email validation
✗  @/src @/tests @/docs Review everything and suggest improvements
```

The second one is a request to pay for your whole repository.

**2. Keep state in files, not scrollback.**
`TASKS.md` for the checklist, `GLOSSARY.md` for vocabulary, `docs/adr/` for
decisions, `references/evidence.md` for facts.

Files survive compaction, `/clear`, and the person who held the context being
away. Scrollback survives none of those.

**3. Send wide reads to a subagent.**
A subagent reading thirty files returns one compacted answer instead of thirty
file contents. This is the difference between an audit that fits and one that
triggers compaction halfway through.

**4. New task when the topic changes.**
Not when the window is full — when the *topic* changes. The cheap moment is
before you have paid for the mixing.

**5. Connect only what you need.**
An MCP server you are not using this week is a tax on every single turn.

**6. Prefer project-scoped config.**
`.bob/mcp.json` travels with the repo, so your teammates get the same tools and
nothing global leaks into unrelated work.

---

## When to compact, and when to clear

| Situation | Move |
| --- | --- |
| Mid-task, window filling, work must continue | `/compact` — lossy, but keeps going |
| A topic is finished, the next is unrelated | `/clear` — cheapest, loses nothing you wrote to a file |
| **The conversation *is* the artefact** (a grilling session) | **Neither.** Hand it to `$to-spec` while it is intact |

That last row is the one teams get wrong. Clearing a grilling session before
writing the spec throws away most of what was decided, because only terms and
ADRs were written to disk.
