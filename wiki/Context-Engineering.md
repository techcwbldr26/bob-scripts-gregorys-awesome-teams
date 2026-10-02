# Context Engineering

> Context engineering is **the set of strategies for curating and maintaining
> the optimal set of tokens (information) during LLM inference**, including all
> the other information that may land there outside of the prompts.
>
> — Anthropic, [Effective context engineering for AI
> agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
> 29 September 2025 (updated 6 January 2026)

Prompt engineering is how you write one instruction. Context engineering is
managing **everything in the window** — system prompt, rules, skills, tool
definitions, files you read, tool results, and the whole message history —
across a session that may run for hours.

It is also the one that gets blamed on the model. "Bob forgot what we agreed"
and "Bob got worse after lunch" are almost never model problems. They are
context problems, and they are yours to fix.

---

## The part nobody expects: accuracy falls *before* you run out of room

Students assume the context window is a bucket. Fill it and you get an error;
stay under the line and you are fine.

That is not how it behaves. Anthropic calls the real effect **context rot**: as
the number of tokens grows, the model's ability to accurately recall information
from that context *decreases*. Not at the limit — gradually, all the way up.

The reason is architectural, and worth knowing because it tells you the problem
will not be fixed by a bigger window:

> Every token attends to every other token across the entire context, resulting
> in n² pairwise relationships for n tokens. As context length increases, the
> model's ability to capture these pairwise relationships gets stretched thin.

Models are also trained on far more short sequences than long ones, so they have
less practice at long-range dependencies. The practical consequence:

**Treat context as a finite resource with diminishing returns.** Every token you
add is spent from an attention budget, and the tokens you add late compete with
the ones that mattered at the start — including the instruction you gave in
turn one.

This is why a session that is "only" at 120k can already be worse than it was at
30k, and why the fix is never "say it again, louder".

---

## The one principle

> Find the smallest possible set of high-signal tokens that maximize the
> likelihood of some desired outcome.
>
> — Anthropic, *Effective context engineering for AI agents*

Memorise that sentence. It is the entire discipline, and it settles almost every
argument you will have about what to put in `AGENTS.md`, how many MCP servers to
install, and whether to paste the whole file or a line range.

Note what it does **not** say. Not "the fewest tokens" — an under-specified
agent fails too. **Smallest set of *high-signal* tokens.** You are maximising
signal per token, not minimising tokens.

---

## The four techniques

Anthropic name four. Every one already has a concrete form in your project —
none of them needs a library, and all of them are things you do by hand:

| Technique | What it means | What you actually do |
| --- | --- | --- |
| **Just-in-time retrieval** | keep lightweight identifiers — paths, URLs, IDs — and load the content at the moment you need it, rather than pre-loading everything up front | read a line range, not a whole file; `$discover-with-firecrawl` stores URLs and dates, not pasted pages |
| **Structured note-taking** | the agent writes notes to a file outside the window and pulls them back in later | `TASKS.md`, `GLOSSARY.md`, `references/evidence.md`, ADRs |
| **Compaction** | summarise a conversation near the limit and restart from the summary | Bob does this at ~190k whether you planned it or not — better to do it deliberately, earlier, on your terms |
| **Sub-agents** | a specialist works in a clean window and hands back a condensed summary | a subagent for a wide search, so the exploration never enters your main context |

Of the four, **structured note-taking is the cheapest and the one students
skip.** A decision written to a file survives compaction. The same decision
sitting in your scrollback does not.

**The goal is not to survive compaction. It is to never need it.**

---

## Where the model's own instructions sit

Two details from the same Anthropic piece that change how you write
`AGENTS.md` and your rules:

- **Altitude.** A system prompt should sit in the "Goldilocks zone" between
  brittle hardcoded if-else logic and vague high-level guidance — *specific
  enough to guide behaviour, flexible enough to leave the model strong
  heuristics*. Rules that enumerate every edge case age badly; rules that say
  "be good" do nothing.
- **Tools are context too.** Every tool definition is paid for on every turn,
  and overlapping tools make the agent worse, not more capable. Anthropic's
  test: *"If a human engineer can't definitively say which tool should be used
  in a given situation, an AI agent can't be expected to do better."* Install
  the MCP servers you use. Uninstall the rest.

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
