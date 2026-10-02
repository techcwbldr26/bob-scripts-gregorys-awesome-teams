---
description: Rewrite a rough prompt into a well-structured one and show what changed, so the next prompt is better before it is sent
argument-hint: <the prompt you were about to send>
---

The student typed `/{{IMPROVE_COMMAND}}` with: $1

Rewrite that prompt and teach the structure. **You are not carrying out the
request.**

## The rule that matters most

**Do not do the task.** If `$1` says "build me a login system", you return a
better prompt for building a login system. You do not build it. Sending it is
the student's decision, and the point of this command is that they see the shape
of a good prompt before they send anything.

If `$1` is empty, ask for the prompt in one line and stop.

## Before you rewrite, read the project

Quietly, without narrating it:

- `AGENTS.md` and `.bob/rules/` — what is already a standing instruction?
  Anything in there must **not** be repeated in the prompt.
- `docs/spec/` and `GLOSSARY.md` — is there a settled term or an acceptance
  criterion the prompt should cite rather than restate?
- `.bob/skills/` — does a skill already do this job?
- The files the request is about, enough to name real paths and line ranges.

## Then produce exactly four sections

### 1. The improved prompt

One fenced block, nothing else inside it, ready to copy. Build it from four
parts:

1. **The whole task, in one message.** Everything needed, stated once — not
   assembled over six turns. The agent cannot plan around a requirement it has
   not heard.
2. **The finish line, in checkable terms.** A test that could pass, a number, an
   observable fact. Not "works well".
3. **What is out of scope.** The list that prevents a helpful detour.
4. **When to stop and ask.** Name the condition, or the agent either stops
   constantly or barrels through a decision that was the student's.

Then apply, in this order:

- **Point, do not paste.** `@src/api/auth.ts:40-80` — never `@src`, never a
  pasted file. The agent opens what it needs, when it needs it.
- **Name the skill** if one fits. `$implement-with-tests` beats a paragraph
  re-explaining test-first.
- **Say why**, briefly, where the reason changes the answer.
- **Separate the parts** with headings or tags once the prompt is longer than a
  paragraph, so instruction, context and input cannot be confused for each other.
- **Delete what the harness already says.** No "remember to write tests" when
  `30-tests-and-coverage` is loaded on every turn.

**Never invent a requirement.** If the finish line, the scope or the stop
condition is not in `$1` and not in the project, leave a visible placeholder:

```
[FILL: what does done mean here? a number or a test, not "it works"]
```

and list it in section 2. A fabricated acceptance criterion is worse than a
missing one, because the student will not notice that it is wrong.

### 2. What changed, and what only you can fill in

A short table — what was missing, what you did, which principle it serves. Keep
it to the changes that mattered; six rows of pedantry teaches nothing.

Then the placeholders, as a list, each written as a direct question the student
can answer in one line.

If `$1` was already good, say which parts were good and change only what needs
changing. Padding a decent prompt teaches the wrong lesson.

### 3. What does not belong in a prompt at all

The section a prompt rewriter usually misses, and the most valuable one here.

If an instruction in `$1` is something the student will want on **every** turn,
it does not belong in a prompt. Say where it belongs instead:

| If it is… | It belongs in |
| --- | --- |
| a standing rule for all work | `.bob/rules/` |
| a project fact, command or convention | `AGENTS.md` |
| a repeatable procedure | a skill in `.bob/skills/` |
| a term the team keeps redefining | `GLOSSARY.md` |
| background needed only sometimes | `references/` |

Typing an instruction every turn is the expensive way to hold it. Offer to make
the change; do not make it unasked. If there is nothing to promote, say so in
one line and move on.

### 4. What it costs

Give the honest arithmetic, in three lines or so:

- The improved prompt is often **longer** than the original. Say so plainly.
  Length is not the cost that matters.
- What matters is the whole exchange. A vague prompt buys clarification turns,
  wrong work and a rewrite — and every one of those turns re-sends the entire
  conversation. A prompt that lands first time is cheaper than a short one that
  does not.
- Name where this version actually saves: line ranges instead of a pasted file,
  a skill name instead of a restated procedure, and anything section 3 moved
  into the harness, which is now paid once rather than every turn.

Where a file was pasted or a whole directory referenced, estimate the tokens
that change alone saves and mark it as an estimate.

## Keep yourself honest

- Everything in the improved prompt comes from `$1`, from the project, or is a
  marked placeholder. Nothing else.
- Do not add "think step by step". Reasoning models do that internally, and the
  phrase is a habit left over from older models.
- Do not claim a token number you did not estimate from something real.

Deeper material, when the student asks for it: `references/prompt-engineering.md`,
`references/context-engineering.md`, and a worked pair in
`examples/good-prompt-vs-bad-prompt.md`.
