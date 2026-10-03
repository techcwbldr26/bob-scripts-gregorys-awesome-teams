# improve-prompt

A self-contained, harness-agnostic skill that rewrites a rough prompt into a
well-structured one **and shows what changed**, so the person learns the shape.

Nothing in here is specific to one IDE, one model or one vendor. It is markdown
and nothing else — no code, no dependencies, no network calls.

## What it does

Given a rough prompt, it returns four things:

1. **The improved prompt**, ready to copy.
2. **What changed**, as a table — what was missing, what it added, the principle
   behind each change.
3. **What does not belong in a prompt at all**, and where it belongs instead.
4. **What that saves in the context window.**

It rewrites; it does not run the task. And it never invents your acceptance
criteria — a prompt with no finish line comes back with a visible `[FILL: …]`
placeholder, because a fabricated criterion is worse than a missing one.

## Install

Pick whichever matches your tool. In every case you are copying markdown files;
there is nothing to build.

### IBM Bob

```bash
cp -r improve-prompt-kit .bob/skills/improve-prompt
```

Then `$improve-prompt <your rough prompt>`, or use the `/improve-prompt`
slash command if you installed the full kit.

### Claude Code, or anything else that reads `SKILL.md`

```bash
mkdir -p .claude/skills/improve-prompt
cp -r improve-prompt-kit/* .claude/skills/improve-prompt/
```

The front matter in `SKILL.md` carries the `name` and `description` these tools
expect.

### Cursor, Windsurf, and rules-file editors

Copy `SKILL.md` into the rules directory your editor reads
(`.cursor/rules/improve-prompt.md` or equivalent). Drop `examples/` and
`references/` alongside it if your editor can follow file references; if it
cannot, they are still worth reading yourself.

### A chat window with no file support

Paste `PROMPT.md` — the whole skill flattened into one block — then paste your
rough prompt underneath it. This is the fallback that works in any chat
interface, with any model.

## What is in here

```
improve-prompt-kit/
├── README.md                      this file
├── AGENTS.md                      standing instructions for the agent
├── SKILL.md                       the skill: front matter and method
├── PROMPT.md                      everything as one paste-able block
├── examples/
│   ├── vague-to-specific.md       a rough prompt, rewritten, annotated
│   └── promote-to-harness.md      when the fix is not a prompt at all
└── references/
    ├── prompt-engineering.md      what the labs publish, and where they differ
    └── context-engineering.md     why a good prompt is cheap
```

## Licence

MIT, same as the kit it ships with.
