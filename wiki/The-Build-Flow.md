# The Build Flow

```
discover → grill → spec → implement → evals → demo rehearsal
```

Six stages. Each one exists to prevent a specific, expensive failure, and each
makes the next one cheaper. Type `/gregorys-awesome-teams` at any point and it
will work out where you are.

---

## 1. Discover — stops you building the wrong thing

**Skill:** `$discover-with-firecrawl` · **Produces:** `references/evidence.md`

The most expensive mistake available to you is a correct implementation of a
false assumption. You will not find out until the demo, when someone in the
audience says "but X already does that" or "you are not allowed to store that".

So: list the claims your idea depends on, then check them against the real world
with Firecrawl. Every claim gets a verdict, a URL and a date.

**You are doing it right when at least one assumption dies.** If nothing died,
you researched to confirm rather than to find out.

---

## 2. Grill — stops you and the agent meaning different things

**Skill:** `$grill-with-docs` · **Produces:** `GLOSSARY.md`, ADRs in `docs/adr/`

Teams agree on a plan using words each member understands differently. The agent
adds a third interpretation. The symptom shows up in week four, when two people
have built incompatible halves of the same feature.

Bob interviews you — one question at a time, each with its recommended answer, so
you are correcting rather than inventing. Terms land in `GLOSSARY.md` the moment
they resolve.

**Most sessions produce zero ADRs.** That is correct: an ADR needs a decision that
is hard to reverse *and* surprising without context *and* a real trade-off.

> **Do not `/clear` after this.** Most of what you agreed lives only in that
> conversation. Hand it straight to the next stage.

---

## 3. Spec — stops the plan evaporating

**Skill:** `$to-spec` · **Produces:** `docs/spec/*.md`

A plan that exists only in a conversation dies at the next `/clear`, at the next
compaction, or when the person holding it is ill the week before the demo.

The acceptance criteria are the part that matters:

| Not a criterion | A criterion |
| --- | --- |
| "Search is fast" | "p95 under 800 ms over the 5,000-document corpus" |
| "Summaries are accurate" | "At least 0.85 mean correctness on the 30-case eval set" |
| "Handles errors" | "A malformed upload returns 422 with a field-level message and stores nothing" |

If your team settled on an exact number or a negative requirement ("must never
write to the source bucket"), carry it through word for word. Softening a precise
answer into vague prose is the most common way a spec looks complete while
missing the thing you actually decided.

---

## 4. Implement — stops "it worked when I tried it"

**Skill:** `$implement-with-tests` · **Gate:** 90% line coverage

One acceptance criterion at a time. Write the test first and **watch it fail**
before you write the code — a test you never saw fail has not been shown to test
anything.

The coverage gate keeps the suite honest near the deadline, which is exactly when
teams stop writing tests and start breaking things silently.

See [Testing and Evals](Testing-and-Evals).

---

## 5. Evals — stops you demoing one lucky run

**Skill:** `$build-evals`

This is the stage teams skip, and the one that separates a project that *looks*
finished from one that is.

If your product uses an LLM anywhere, you have an unknown success rate until you
measure it. You cannot tune what you cannot measure, and you cannot answer **"how
do you know it works?"** — which you will definitely be asked.

Build the measurement before tuning the thing. Then improve one change at a time,
keeping only what helps on cases you did not tune against.

---

## 6. Demo rehearsal — stops the live failure

**Skill:** `$demo-rehearsal`

Everything works on the author's laptop, on their network, with their cached
state. The demo runs on none of those.

Rehearse from a clean checkout on a different machine, break something on
purpose, and practise the recovery sentence. See [Demo Day](Demo-Day).

---

## Going backwards is fine

Discovering something in stage 4 that invalidates the spec means going back to
stage 2 or 3. **That is the process working.**

What does not work is carrying on against a spec you now know is wrong because
the spec feels official.

---

## The rule that spans every stage

**Verify before you assert, and mark what you could not verify.**

It applies to Bob and to you equally. An unmarked guess costs your team more than
an admitted gap, every time.
