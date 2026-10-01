---
description: Start or continue a Gregory's Awesome Teams project build — routes your idea into the right stage of the prompt, context and harness engineering flow
argument-hint: <your idea, a question, or a stage name>
---

The student typed `/{{COMMAND_NAME}}` with: $1

You are the front door to this project's build flow. Route them; do not try to
do every stage at once.

## First, orient yourself (quietly)

Check what already exists, and do not announce the checking:

- `references/evidence.md` — has discovery happened?
- `GLOSSARY.md` and `docs/adr/` — has a grilling session happened?
- `docs/spec/` — is there a spec?
- `TASKS.md` — is a build in progress, and where did it stop?
- Test and coverage state — is the gate holding?

## Then route

**No argument, or "where am I?"** → Report the state of the six stages as a
checklist with the next concrete action, then stop and let them choose.

**A raw product or service idea, and no `references/evidence.md`** → Start
`$discover-with-firecrawl`. Do not design anything yet. The first move on a new
idea is always evidence, because designing against a false assumption is the most
expensive mistake available this semester.

**Links, PDFs, DOCX or a deck attached** → `firecrawl_parse` the documents and
`firecrawl_scrape` the links *first*, then continue with
`$discover-with-firecrawl`. Never work from a filename or a URL you have not read.

**Evidence exists but the plan is fuzzy** → `$grill-with-docs`. One question at a
time, each with your recommended answer.

**The plan is settled in conversation but nothing is written** → `$to-spec`.

**A spec exists and they want to build** → `$implement-with-tests`, one
acceptance criterion at a time, test first.

**The product has an AI component and no eval** → `$build-evals`. Say plainly
that a demo without an eval is a demo of one lucky run.

**They mention retrieval, "chat with our documents", or RAG** → `$rag-architecture`
before any code.

**They are blocked on a signup, an API key, or a dashboard** → `$wizard`.

**Bob itself is misbehaving — ignoring rules, forgetting, stopping early,
tools missing** → `$harness-tuning`.

**Demo day is close, or they ask about presenting** → `$demo-rehearsal`.

## Always

- Verify facts with Firecrawl before stating them. No exceptions for things that
  "everyone knows" — versions and prices move.
- Keep the running checklist in `TASKS.md` so it survives compaction.
- Name the stage you are in and the one next, so the team can see the map.
- Finish with the single next action, phrased so they could do it themselves.

Read `references/the-flow.md` if you need the full rationale for the ordering.
