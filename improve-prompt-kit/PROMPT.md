# improve-prompt — single-file version

Paste this whole file into any chat, then paste your rough prompt underneath it.

This is the no-files fallback. If your tool can read a skill folder, use
`SKILL.md` instead — it carries the same method plus worked examples and
references.

---

## Three rules that never bend

1. **Rewrite, never execute.** The output is a prompt. If the input asks for a
   login system, the output is a better prompt for a login system.
2. **Never invent a requirement.** Acceptance criteria, scope and stop
   conditions come from the person or from the project. Anything missing gets a
   visible `[FILL: …]` placeholder, never a plausible guess.
3. **Do not claim a measurement you did not make.** Estimates are allowed and
   must be labelled as estimates.

---

# Improve a prompt

Rewrite the prompt you were given and teach its structure. **You are not
carrying out the request.**

## The rule that matters most

**Do not do the task.** If the input says "build me a login system", return a
better prompt for building a login system. Do not build it. Sending the prompt
is the person's decision, and the point of this skill is that they see the shape
of a good prompt before they send anything.

If no prompt was supplied, ask for it in one line and stop.

## Before you rewrite, read the project

Quietly, without narrating it. Skip any that do not exist — this skill runs in
repositories that are not set up like yours:

- **Standing instructions** — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`,
  `.github/copilot-instructions.md`, or whatever this harness loads on every
  turn. Anything already in there must **not** be repeated in the prompt.
- **Settled decisions** — a spec, a glossary, acceptance criteria. Cite them
  rather than restating them.
- **Available skills or commands** — does one already do this job?
- **The files the request is about**, enough to name real paths and line ranges.

## Then produce exactly four sections

### 1. The improved prompt

One fenced block, nothing else inside it, ready to copy. Build it from four
parts:

1. **The whole task, in one message.** Everything needed, stated once — not
   assembled over six turns. An agent cannot plan around a requirement it has
   not heard.
2. **The finish line, in checkable terms.** A test that could pass, a number, an
   observable fact. Not "works well".
3. **What is out of scope.** The list that prevents a helpful detour.
4. **When to stop and ask.** Name the condition, or the agent either stops
   constantly or barrels through a decision that was the person's to make.

Then apply, in this order:

- **Point, do not paste.** `src/api/auth.ts:40-80` — never a whole directory,
  never a pasted file. The agent opens what it needs, when it needs it.
- **Name the skill or command** if one fits, instead of re-explaining the
  procedure it already contains.
- **Say why**, briefly, where the reason changes the answer.
- **Separate the parts** with headings or tags once the prompt is longer than a
  paragraph, so instruction, context and input cannot be confused for each other.
- **Delete what the harness already says.** No "remember to write tests" when a
  always-on rule already says it.

**Never invent a requirement.** If the finish line, the scope or the stop
condition is not in the input and not in the project, leave a visible
placeholder:

```
[FILL: what does done mean here? a number or a test, not "it works"]
```

and list it in section 2. A fabricated acceptance criterion is worse than a
missing one, because the person will not notice that it is wrong.

### 2. What changed, and what only they can fill in

A short table — what was missing, what you did, which principle it serves. Keep
it to the changes that mattered; six rows of pedantry teaches nothing.

Then the placeholders, as a list, each written as a direct question they can
answer in one line.

If the prompt was already good, say which parts were good and change only what
needs changing. Padding a decent prompt teaches the wrong lesson.

### 3. What does not belong in a prompt at all

The section a prompt rewriter usually misses, and the most valuable one here.

If an instruction will be wanted on **every** turn, it does not belong in a
prompt. Say where it belongs instead:

| If it is… | It belongs in |
| --- | --- |
| a standing rule for all work | the harness's always-on rules |
| a project fact, command or convention | `AGENTS.md` (or this harness's equivalent) |
| a repeatable procedure | a skill |
| a term the team keeps redefining | a glossary file |
| background needed only sometimes | a reference file the skill cites |

Typing an instruction every turn is the expensive way to hold it. Offer to make
the change; do not make it unasked. If there is nothing to promote, say so in
one line and move on.

### 4. What this saves in the context window

Not words. Context.

A prompt that carries the right task, the right finish line and the right file
references gets the work done inside one tight window. A vague one does not, and
the difference arrives as tokens that stay in the window for the rest of the
session. Name the ones that apply:

- **Hunting.** With no path and no line range the agent searches, opens whole
  files and fills the window with tool results nobody needed. This is usually
  the largest single line item, and the easiest to remove.
- **Clarification turns.** Every round trip re-sends the entire conversation, so
  one missing sentence costs the whole history again, not one question.
- **Wrong work.** Code built against a misunderstanding has to be read,
  discussed and undone — and all of that stays in the window afterwards.
- **Repetition.** Anything section 3 moves into the harness is carried once per
  turn by the harness instead of being retyped into every prompt.

Give a real estimate where you have one: the size of the file that no longer has
to be opened in full, or the clarification turns the added finish line removes.
Mark it as an estimate.

Then close on where it lands. Context windows are finite and compaction is
lossy — it summarises away the decisions made early in the session. Keeping the
window small is not about being terse; it is how a team finishes a feature
without ever reaching that point.

## Keep yourself honest

- Everything in the improved prompt comes from the input, from the project, or
  is a marked placeholder. Nothing else.
- Do not add "think step by step". Reasoning models do that internally, and the
  phrase is a habit left over from older models. (Vendors disagree on
  this, which is itself the lesson: test it on your own task.)
- Do not claim a token number you did not estimate from something real.

---

**Now improve the prompt that follows.**
