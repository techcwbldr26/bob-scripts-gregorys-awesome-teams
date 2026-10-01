# The flow, and why it is in this order

```
discover → grill → spec → implement → evals → demo rehearsal
```

Each stage exists to stop a specific, expensive failure. The order is not
arbitrary: each stage is cheap to redo and makes the next one cheaper.

## 1. Discover — stops you building the wrong thing

The most expensive mistake available this semester is a correct implementation of
a false assumption. You will not find out until the demo, when someone in the
audience says "but <competitor> already does that" or "we're not allowed to store
that data."

An hour with Firecrawl at the start is cheaper than six weeks of good work
pointed in the wrong direction. Output: `references/evidence.md`.

## 2. Grill — stops you and the agent meaning different things

Teams agree on a plan in words that each member understands differently. The
agent adds a third interpretation. The symptom appears in week four, when two
people have built incompatible halves of the same feature.

The interview surfaces the disagreement while it is still free. Output:
`GLOSSARY.md`, and ADRs for the few decisions hard enough to earn one.

## 3. Spec — stops the plan evaporating

A plan that lives only in a conversation dies at the next `/clear`, at the next
compaction, or when the person who held it is ill the week before the demo.
Writing it down converts shared understanding into something testable.

The acceptance criteria are the part that matters. "Search is fast" cannot be
built against; "p95 under 800 ms over the 5,000-chunk corpus" can.

## 4. Implement — stops "it worked when I tried it"

Test first, one acceptance criterion at a time. The coverage gate is a floor that
keeps the suite honest as the build accelerates near the deadline, which is
exactly when teams stop writing tests and start breaking things silently.

## 5. Evals — stops you demoing one lucky run

This is the stage teams skip, and it is the one that separates a project that
*looks* finished from one that *is*. An AI feature with no eval has an unknown
success rate. You cannot tune what you cannot measure, and you cannot answer
"how do you know it works?" — the question you will definitely be asked.

Build the measurement before tuning the thing. Then hillclimb: one change per
round, keep what improves the held-out set, revert everything else.

## 6. Demo rehearsal — stops the live failure

Everything works on the author's laptop, on their network, with their cached
state. The demo runs on none of those. Rehearse from a clean checkout on a
different machine, break something on purpose, and practise the recovery.

## You can move backwards

Discovering something in stage 4 that invalidates the spec means going back to
stage 2 or 3. That is the process working. What does not work is carrying on
building against a spec you now know is wrong because the spec feels official.

## The one rule that spans every stage

Verify before you assert, and mark what you could not verify. It applies to the
agent and to the team equally.
