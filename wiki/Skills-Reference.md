# Skills Reference

![An animated diagram of the nine skills. Each card shows one skill’s one-line description and what its body would cost, and a running readout counts the descriptions up to roughly 600 tokens. A stacked bar then compares what you actually pay in the context window — Bob’s baseline plus that sliver, plus one body while it runs — against what it would cost if all nine bodies were loaded on every turn.](https://raw.githubusercontent.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/main/assets/skills.svg)

Nine skills. Type `$` in Bob to pick from a list, `$skill-name` to invoke one
directly, or just describe what you need and Bob will reach for the right one.

Only each skill's one-line description sits in context. The body loads on demand,
which is why having nine costs almost nothing.

---

## The main chain

### `$discover-with-firecrawl`
> Gather verified real-world evidence about a product or service idea before
> designing it.

**Reach for it:** at the very start, when you are handed links or PDFs, or any
time a factual claim would otherwise come from memory.

**It produces:** `references/evidence.md` — every load-bearing claim with a
verdict, a URL and a date.

**It is working when** at least one of your assumptions dies. If none did, you
researched to confirm rather than to find out.

---

### `$grill-with-docs`
> Interview the team relentlessly about their plan until there is one shared
> understanding, recording settled vocabulary in GLOSSARY.md and genuinely hard
> decisions as ADRs.

**Reach for it:** when the plan is still fuzzy, before writing a spec, or when
you suspect two people mean different things by the same word.

**It produces:** `GLOSSARY.md`, and ADRs in `docs/adr/`.

**It is working when** the glossary changes *during* the session, term by term,
and questions the codebase could answer get answered by reading the codebase
rather than asked of you.

> Adapted from Matt Pocock's skill of the same name (MIT).

---

### `$to-spec`
> Turn a settled design conversation into a written specification with acceptance
> criteria, without re-interviewing the team.

**Reach for it:** straight after a grilling session, in the same conversation.

**It produces:** `docs/spec/<slug>.md`.

**It is working when** every acceptance criterion could be checked by a test or
an unambiguous human observation.

---

### `$implement-with-tests`
> Build a feature test-first and carry it to the project's 90 percent coverage
> gate.

**Reach for it:** for anything you are building from a spec, and for existing
code that has no tests.

**It is working when** you watched each test fail before you made it pass.

---

### `$build-evals`
> Design an evaluation set and grader for the AI part of the product, then
> improve against it one change at a time.

**Reach for it:** as soon as your product uses an LLM, RAG, classification or
generation anywhere.

**It is working when** you can state a number with a confidence interval instead
of saying "it seems good".

See [Testing and Evals](Testing-and-Evals).

---

### `$demo-rehearsal`
> Harden a project for a live demo in front of an audience and rehearse the
> failure modes.

**Reach for it:** in the weeks before December 1st. Read it in week one anyway.

**It produces:** `docs/demo-script.md` and `docs/demo-qa.md`.

See [Demo Day](Demo-Day).

---

## The ones you reach for when they apply

### `$wizard`
> Generate an interactive setup script that walks a human through a manual
> procedure the agent cannot do itself.

**Reach for it:** when the next blocker is a dashboard a person has to click
through, or an API key only they can create.

Bob writes the script; **you** run it. That is why your credentials never enter
the model's context.

> Adapted from Matt Pocock's skill of the same name (MIT).

---

### `$rag-architecture`
> Design retrieval-augmented generation over the team's own documents or data,
> and make it measurable.

**Reach for it:** the moment someone says "chat with our documents" or "we'll use
RAG".

**Its first question is whether you need retrieval at all.** If your corpus fits
in the context window, just put it in the prompt. If the data is structured,
write a query. Choosing retrieval for a small corpus is the most common wasted
fortnight in projects like yours.

---

### `$harness-tuning`
> Diagnose and fix the Bob harness itself when it behaves badly — ignoring rules,
> forgetting context, stopping early, burning Bobcoins, or failing to load skills
> and MCP tools.

**Reach for it:** when the problem is Bob's setup rather than your code.

It diagnoses in cost order: context, then skills, then MCP tools, then
instructions, then the prompt, and only last the model.

---

## Your four always-on rules

These are not skills — they load on every turn, in `.bob/rules/`:

| Rule | What it enforces |
| --- | --- |
| `00-evidence-over-memory` | A factual claim needs a source retrieved this session |
| `10-context-discipline` | Line ranges, `TASKS.md`, subagents for wide reads |
| `20-finish-the-work` | Keep going when no decision is needed; stop before anything destructive |
| `30-tests-and-coverage` | Test first, watch it fail, never reach the gate by deleting assertions |

---

## Writing your own

Perfectly reasonable, and a good way to show harness engineering in your
submission. The format and the silent failure modes are in
[Harness Engineering](Harness-Engineering#skills--the-cheap-file).
