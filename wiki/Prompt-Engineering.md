# Prompt Engineering

What you say. The cheapest thing to fix, so always check it first.

---

## The shape of a task an agent can finish

Four parts. Missing any one of them is what produces a half-done run.

1. **The whole task, in one message.** Not assembled over six turns — the agent
   cannot plan around requirements it has not heard.
2. **The finish line, in checkable terms.** "The tests pass." "Every endpoint uses
   the new client."
3. **What is out of scope.** The list that prevents a helpful detour.
4. **When to stop and ask.** Name the condition, or it either stops too often or
   barrels through a decision that was yours.

### Weak

> Add authentication to the app.

Nothing says which users, which mechanism, what "added" means, or whether to
touch the existing session code. Bob will make all of those choices silently.

### Strong

> Add email-and-password authentication to the API.
>
> Done means: `POST /auth/register` and `POST /auth/login` exist, passwords are
> hashed with argon2, a successful login returns a 24-hour JWT, every route under
> `/api/private/*` rejects a missing or expired token with 401, and the test suite
> passes with coverage at or above 90%.
>
> Out of scope: password reset, OAuth, email verification.
>
> Stop and ask me only if the existing session code in `src/session.ts` conflicts
> with the token approach.

---

## Stop writing "think carefully"

Current models decide their own thinking before replying. "Think carefully",
"think step by step", "take your time" now cost tokens, delay the first useful
output, and change nothing.

Delete them from your prompts **and from `AGENTS.md`**.

- Want a quick answer? Say "Answer directly."
- Want more depth on a hard problem? Raise the **effort** setting. That is the
  real control.

---

## Add to a running task; do not restart it

Runs are long. If you realise halfway through that you also want aliases kept,
type that and press Enter. Restarting throws away the work *and* the context that
produced it.

---

## Tell it what you do not want

For anything with taste in it — UI, copy, naming — a negative list beats a
positive instruction. "Don't look generic" just swaps one default for another.

> No cream or off-white backgrounds, no italic accent words in headings, no
> "01 / 02 / 03" section numbering, no monospace labels, no pill-shaped buttons.

Then look at what it chose instead and add that to the list. Two rounds of this
gets further than any amount of describing what you do want.

---

## Make it mark its uncertainty

Add to any research or analysis request:

> Mark anything you couldn't confirm, and say where you looked.

This converts a confident wrong answer — the most expensive kind — into a flagged
gap you can go and close.

---

## Have it review its own diff first

> Review the diff on this branch against main. List only problems you'd block the
> merge for. For each one: the file and line, why it's wrong, and how to show it
> fails.

**"Only problems you'd block the merge for"** is the load-bearing phrase. Without
it you get forty style notes and miss the race condition.

---

## Split wide work, and check the evidence

For audits and sweeps across many files:

> Give each service to its own subagent. When a subagent reports back, check its
> evidence before you accept it. Finish with one table: service, affected yes or
> no, and the evidence.

Fan out, **verify**, converge. The verification step is not optional — a
subagent's confident summary is still a summary, and it can be wrong about the
file it read.

---

## Attach the artefact; do not retype it

Give Bob the chart, the screenshot, the slide. Retyping numbers out of an image
introduces transcription errors and throws away the positional information —
which arrow connects which boxes, what changed between two versions.

---

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

More, with full worked examples, in `examples/good-prompt-vs-bad-prompt.md` in
your own project.
