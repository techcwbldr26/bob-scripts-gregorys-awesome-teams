# Prompt engineering for Bob

## The shape of a task an agent can finish

Four parts. Missing any one of them is what produces a half-done run.

1. **The whole task, in one message.** Not a conversation that assembles the task
   over six turns — the agent cannot plan around requirements it has not heard.
2. **The finish line, in checkable terms.** "The tests pass." "Every endpoint uses
   the new client." "Coverage is at or above 90%."
3. **What is out of scope.** The list that prevents a helpful detour into work
   nobody asked for.
4. **When to stop and ask.** Name the condition. Without it, the agent either
   stops too often or barrels through a decision that was yours.

## Stop writing "think carefully"

Current models decide their own thinking before replying. "Think carefully",
"think step by step", "take your time" now cost tokens, delay the first useful
output, and change nothing. Delete them from prompts *and* from `AGENTS.md`.

Want a quick answer? Say "Answer directly." Want more depth on a hard problem?
Raise the effort setting — that is the real control.

## Add to a running task; do not restart it

Runs are long. If you realise mid-run that you also want aliases kept, type that
and press Enter. Restarting throws away the work and the context that produced it.

## Tell it what you do not want

For anything with taste in it — UI, copy, naming, structure — a negative list
beats a positive instruction. "Don't look generic" swaps one default for another.
A list of specific patterns to avoid actually constrains the space:

> No cream or off-white backgrounds, no italic accent words in headings, no
> "01 / 02 / 03" section numbering, no monospace labels, no pill-shaped buttons.

Then look at what it chose instead and add that to the list. Two rounds of this
gets further than any amount of describing what you do want.

## Make it mark its uncertainty

Add to any research or analysis request:

> Mark anything you couldn't confirm, and say where you looked.

This converts a confident wrong answer — the most expensive kind — into a flagged
gap you can go and close.

## Have it review its own diff first

A review pass before a human reads the code catches the mechanical problems and
leaves the human's attention for the design:

> Review the diff on this branch against main. List only problems you'd block the
> merge for. For each one: the file and line, why it's wrong, and how to show it
> fails.

"Only problems you'd block the merge for" is the load-bearing phrase. Without it
you get forty style notes and miss the race condition.

## Split wide work, and check the evidence

For audits, migrations and sweeps across many files:

> Give each service to its own subagent. When a subagent reports back, check its
> evidence before you accept it. Finish with one table: service, affected yes or
> no, and the evidence.

Fan out, verify, converge. The verification step is not optional — a subagent's
confident summary is still a summary, and it can be wrong about the file it read.

## Attach the artefact; don't retype it

Give it the chart, the screenshot, the slide, the diagram. Retyping numbers out
of an image introduces transcription errors and throws away the positional
information — which arrow connects which boxes, what changed between two versions
— that the image carries and your retyping does not.

## Checklist

- [ ] Whole task in one message
- [ ] "Done" stated checkably
- [ ] Out of scope named
- [ ] Stopping condition explicit
- [ ] No "think carefully" anywhere
- [ ] Facts routed to Firecrawl, not memory
- [ ] Uncertainty flagged on request
- [ ] Wide work split, evidence verified
- [ ] Artefacts attached rather than described
