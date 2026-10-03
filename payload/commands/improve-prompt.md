---
description: Rewrite a rough prompt into a well-structured one and show what changed, so the next prompt is better before it is sent
argument-hint: <the prompt you were about to send>
---

The student typed `/{{IMPROVE_COMMAND}}` with: $1

Run the `$improve-prompt` skill against that text, and follow it exactly.

The method lives in the skill rather than here, because it is shared: the same
file ships as a standalone kit that works in any harness or IDE, so there is one
description of how to improve a prompt rather than three that drift apart.

Two things this command adds, which the portable skill cannot assume:

- **Read this project first.** `AGENTS.md`, `.bob/rules/`, `docs/spec/`,
  `GLOSSARY.md` and `.bob/skills/` are the standing instructions and settled
  decisions here. Anything already in them must not be repeated in the prompt,
  and section 3 of the skill's output should name them as the place an
  every-turn instruction belongs.
- **Depth is on disk.** `references/prompt-engineering.md`,
  `references/context-engineering.md` and `examples/` are installed in this
  project. Cite them when the student asks why; do not restate them.

If `$1` is empty, ask for the prompt in one line and stop.

**Do not do the task.** `/{{IMPROVE_COMMAND}} build me a login system` returns a
better prompt for building a login system, not a login system.
