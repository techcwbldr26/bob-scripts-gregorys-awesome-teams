# Glossary

Every term you will meet, in plain English. If you have never used an AI
assistant, read this page first and come back to it whenever a word stops you.

---

## The basics

**LLM (Large Language Model)**
The thing that writes the answers. It predicts text. It has no memory between
conversations and no live connection to the internet unless you give it one.

**Agent**
An LLM that can *do* things, not just talk: read your files, write files, run
commands, search the web. Bob is an agent.

**Harness**
The program around the model that gives it those abilities and decides what it
can see. Bob is a harness. Claude Code and Cursor are other harnesses. Changing
the harness changes your results more than changing the model does.

**Prompt**
What you type. Also, confusingly, the hidden instructions the harness sends
along with it.

**Token**
A chunk of text, roughly ¾ of a word. Everything is measured in these because
that is what you pay for and what the limits are counted in.

---

## Context

**Context window**
Everything the model can see on this turn: the system prompt, your project's
rules, the tool descriptions, and the whole conversation so far. Bob's is
**270,000 tokens**.

**The thing nobody tells you:** every single turn re-sends all of it. Turn 50
pays for turns 1 to 49 again. That is why a long conversation gets expensive
*and* worse at the same time.

**Compaction**
What happens when the conversation gets too big. Around **190,000 tokens** Bob
summarises the older turns to make room. It keeps the system prompt, your rules
and your skills, and squeezes everything else into one summary.

**It is lossy.** A decision you made at turn 3 can quietly stop existing, and
nothing tells you. This is the single most important thing on this page.

**Context engineering**
Managing what is in that window on purpose. See [Context Engineering](Context-Engineering).

---

## The files in your project

**`AGENTS.md`**
Instructions Bob loads on **every single turn**. Kept deliberately short,
because every line in it is paid for repeatedly.

**Rules** (`.bob/rules/`)
Also loaded every turn. Things that must *always* apply.

**Skill** (`.bob/skills/<name>/SKILL.md`)
A set of instructions for one kind of task. The clever part: only the skill's
one-line *description* sits in context. The body loads when Bob decides it
applies. That is why you can have nine of them for almost no cost.

**Slash command** (`.bob/commands/<name>.md`)
Something you type starting with `/`. Yours is `/gregorys-awesome-teams`.

**`TASKS.md`**
Your checklist, in a file. Files survive compaction. Your scrollback does not.

---

## Tools and connections

**MCP (Model Context Protocol)**
A standard way to plug extra tools into an agent. Think of it as a USB port.

**MCP server**
Something plugged into that port. You have one: Firecrawl.

**Firecrawl**
Gives Bob real web access — search, reading pages, parsing PDFs, and real data
from real providers. See [Firecrawl](Firecrawl).

**API key**
A password for a service, used by programs rather than people. Yours starts with
`fc-`. Never paste it into a chat message, never commit it.

**`.env`**
A file holding keys and settings. Must be listed in `.gitignore` so it is never
committed.

**Secret store**
Where Bob keeps your key encrypted. You put it there by typing
`/manage-secrets set FIRECRAWL_API_KEY fc-...`. Bob cannot do this for you, on
purpose — it keeps your key out of the model's context.

---

## Working practice

**Subagent**
A separate agent Bob spawns for one job. It reads thirty files and returns one
paragraph, so your context window pays for the paragraph instead of the files.

**Hallucination**
When a model states something false, fluently. The cure is not a better model,
it is making it cite a source — which is what Firecrawl is for.

**Evidence**
A claim plus the URL it came from plus the date you checked. Anything less is
an opinion.

**Eval (evaluation)**
A set of test cases and a way of scoring them, so you can say "it works 87% of
the time" instead of "it seems good". See [Testing and Evals](Testing-and-Evals).

**Grader**
The thing that decides whether one eval answer was right. Either code, or
another LLM given a checklist.

**Test coverage**
The share of your code that your tests actually run. Your gate is **90%**. It is
a floor, not a goal — it is easy to hit 90% while testing nothing that matters.

**Regression test**
A test written for a bug you just fixed, so it cannot come back quietly.

---

## Git and GitHub

**Git**
Tracks every version of your files. Lets you undo anything.

**Repository (repo)**
A project folder that git is tracking.

**Commit**
A saved snapshot with a message explaining why.

**Branch**
A parallel line of work, so you can experiment without breaking what works.

**Pull request (PR)**
A proposal to merge a branch, where people review it first.

**CI (Continuous Integration)**
A robot that runs your tests on every push and tells you if you broke something.

---

## The design-thinking words

**Discovery**
Finding out what is true before deciding what to build. Stage one, and the stage
teams most want to skip.

**Assumption**
Something you believe but have not checked. Each one is a place your project can
fail silently.

**Acceptance criterion**
A statement specific enough that a test could check it. "Search is fast" is not
one; "p95 under 800 ms over the 5,000-document corpus" is.

**ADR (Architecture Decision Record)**
A short note recording a decision that was hard to reverse, surprising without
context, *and* a genuine trade-off. All three, or it is not an ADR.

**RAG (Retrieval-Augmented Generation)**
Looking things up in your own documents and giving them to the model, so answers
come from your data rather than its memory. See the `$rag-architecture` skill.

**Chunk**
One piece of a document, sized so it can be retrieved on its own.

**Citation**
Showing which chunk an answer came from. Without it, nobody has reason to
believe the answer, including you.
