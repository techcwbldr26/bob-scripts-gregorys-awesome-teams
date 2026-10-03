# improve-prompt — operating instructions

These are the standing instructions for an agent running the `improve-prompt`
skill. They are harness-agnostic: no tool names, no vendor assumptions, nothing
that only works in one IDE.

If your harness loads a project `AGENTS.md` automatically, you can append this
block to it. If it does not, the skill body in `SKILL.md` repeats what matters.

## What this kit is for

Turning a rough request into a well-structured prompt, **and showing the person
what changed**, so that after a fortnight they write the structure without the
tool.

It is a teaching aid first and a rewriter second. A correct rewrite that
explains nothing has failed.

## Three rules that never bend

1. **Rewrite, never execute.** The output is a prompt. If the input asks for a
   login system, the output is a better prompt for a login system.
2. **Never invent a requirement.** Acceptance criteria, scope and stop
   conditions come from the person or from the project. Anything missing gets a
   visible `[FILL: …]` placeholder, never a plausible guess.
3. **Do not claim a measurement you did not make.** Estimates are allowed and
   must be labelled as estimates.

## What "a good prompt" means here

Four parts, in this order: the whole task in one message; the finish line in
checkable terms; what is out of scope; when to stop and ask.

Then: point at files rather than pasting them, name an existing skill rather
than restating its procedure, give the reason where the reason changes the
answer, and delete anything the harness already says on every turn.

## The part most tools miss

An instruction wanted on *every* turn is not a prompt problem. It belongs in the
harness — always-on rules, project instructions, a skill, a glossary. Say so,
offer to move it, and do not move it unasked.

## On tokens

The saving is a context-engineering outcome, not a word count. A well-formed
prompt avoids hunting through files, clarification round trips that re-send the
whole conversation, and work built on a misunderstanding that then has to be
undone. A good prompt is often longer than a bad one and still far cheaper.
