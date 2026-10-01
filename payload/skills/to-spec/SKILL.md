---
name: to-spec
description: Turn a settled design conversation into a written specification with acceptance criteria, without re-interviewing the team. Use after a grilling session, or when a plan exists in chat but nothing is written down that someone could build or test from.
---

The conversation above is the source material. Synthesise it; do not re-ask what
has already been settled.

## Where the spec goes

`docs/spec/<short-slug>.md`. One spec per coherent chunk of work.

## Structure

```markdown
# <Name>

## Problem
Who has it, what they do today, why today is bad. Two paragraphs maximum.

## In scope for {{DEMO_DATE}}
A numbered list. Each item is demonstrable in front of an audience.

## Explicitly out of scope
The list that stops scope creep. Name the things someone will ask for.

## Vocabulary
Terms used below, each linked to its GLOSSARY.md definition. Do not redefine.

## Acceptance criteria
Numbered, each independently checkable, each phrased so a test can assert it.

## Evidence this is the right thing
Links into references/evidence.md. No claim here without one.

## Open questions
What is still unresolved, and who decides.

## Risks
What could sink the demo, and the mitigation for each.
```

## Acceptance criteria are the whole point

This is where specs usually fail. A criterion must be checkable by a machine or
by an unambiguous human observation.

| Bad | Good |
| --- | --- |
| "Search is fast" | "A search over the 5,000-document corpus returns in under 800 ms at p95" |
| "Summaries are accurate" | "On the 30-case eval set, the grader scores at least 0.85 mean correctness" |
| "The UI is intuitive" | "A first-time user completes the upload-then-query flow with no verbal guidance in under 2 minutes" |
| "Handles errors" | "A malformed upload returns a 422 with a field-level message, and the file is not stored" |

**Preserve precision.** If the team settled on an exact number, an ordering
guarantee, or a negative requirement ("must never write to the source bucket"),
carry it through verbatim. Softening a precise answer into vague prose is the
most common way a spec looks complete while missing the thing that was decided.

## Before you finish

Re-read the spec against the actual conversation and confirm every decision that
was made appears in it. Report anything you could not place. Then say which
acceptance criteria will be hard to test, so `$implement-with-tests` starts with
its eyes open.
