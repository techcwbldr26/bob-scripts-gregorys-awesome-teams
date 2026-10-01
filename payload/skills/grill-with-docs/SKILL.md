---
name: grill-with-docs
description: Interview the team relentlessly about their plan until there is one shared understanding, recording settled vocabulary in GLOSSARY.md and genuinely hard decisions as ADRs. Use when a plan is still fuzzy, before writing a spec, or when the team and the agent are using the same word for different things.
---

Adapted from Matt Pocock's `grill-with-docs` (MIT, © Matt Pocock).
See <https://github.com/mattpocock/skills>.

Interview the team about this plan until you reach a shared understanding.
Walk down each branch of the design tree, resolving dependencies between
decisions one at a time.

## The interview rules

These are not optional; they are the skill.

1. **One question at a time.** Ask, then wait for the answer before the next
   question. Do not dump a numbered list of twelve questions.
2. **Always give your recommended answer.** Every question arrives with the
   answer you would pick and one sentence of why. The team's job is to agree or
   correct, which is far cheaper than inventing an answer from nothing.
3. **If the codebase can answer it, read the codebase.** Never ask the team
   something `read_file` or `search_files` would tell you.
4. **If Firecrawl can answer it, call Firecrawl.** A question about what an API
   supports is research, not an interview question.
5. **Follow dependencies.** Resolve the decision that other decisions hang off
   before the ones that hang off it.

## Order of attack

Work outward from what is most expensive to change:

1. **Who is it for, specifically.** "Students" is not an answer. Which students,
   doing what, currently failing how?
2. **What is the smallest thing that is still worth demoing.** Name what is out
   of scope for {{DEMO_DATE}}.
3. **Where the data comes from, and who owns it.** Privacy, retention, consent.
4. **What the AI part actually is**, and how you would know it worked. If they
   cannot say how they would measure it, that is the next question.
5. **What happens when it fails** in front of an audience.

## Record as you go, not at the end

This is what separates this skill from a conversation.

| What resolved | Where it goes | When |
| --- | --- | --- |
| A term — the project's own word for a thing | `GLOSSARY.md` | The moment it resolves, inline, mid-interview |
| A decision that is hard to reverse **and** surprising without context **and** a real trade-off | An ADR in `docs/adr/` | When it passes all three gates |
| Everything else you agreed | The conversation, and nowhere else | — |

**The ADR gate is all three conditions at once.** Most decisions fail it, and
most sessions produce zero ADRs. That is correct behaviour, not a bug.

`GLOSSARY.md` stays a pure glossary: the project's words with tight definitions.
No implementation detail, no spec prose, no scratch notes. Use the ADR template
in `examples/adr-template.md`.

Create both lazily — nothing exists until the first term or decision
crystallises. There is nothing to scaffold up front.

## Challenge the team's words

If they use a word that `GLOSSARY.md` already defines differently, stop and say
so. Two meanings for one word is the defect this skill exists to catch.

## When the session ends

Most of what you agreed lives only in this conversation. **Do not clear it.**
Hand it straight to `$to-spec` in the same session.

## It's working if

- `GLOSSARY.md` changes during the session, term by term, not in one lump.
- The glossary reads as vocabulary, with no spec-like prose in it.
- Questions the codebase could answer were answered by reading the codebase.
- You produced few or no ADRs, and each one is a decision the team would be
  annoyed to have to re-litigate.
- At least one of the team's words got challenged.
