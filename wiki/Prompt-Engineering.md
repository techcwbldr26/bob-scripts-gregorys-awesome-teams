# Prompt Engineering

What you say, in the message you send. It is the cheapest thing to change, so
always check it first.

Anthropic draws the line this way: prompt engineering is *"methods for writing
and organizing LLM instructions for optimal outcomes"*, while [context
engineering](Context-Engineering) is managing the whole window around them. Get
the prompt right and you will be surprised how many "the model is bad at this"
problems disappear.

---

## The mental model that does the most work

> Think of Claude as a brilliant but new employee who lacks context on your
> norms and workflows.
>
> — Anthropic, [Prompting best
> practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Not "a search engine", not "a magic box". A capable new colleague on day one.

Run the test on every prompt before you send it: **could a smart new hire, who
has never seen this codebase, do the right thing with only this message?** If
the answer is no, the model is not going to do better. Almost every weak prompt
fails this test in the same way — it assumes something you know and never said.

---

## You do not have to do this by hand

Put `/improve-prompt` in front of a rough request and send it:

```
/improve-prompt  make the search better
```

You get back four things:

1. **The improved prompt**, in a block you can copy.
2. **A table of what changed** — what was missing, what it added, and the
   principle behind each change.
3. **What should not be in a prompt at all**, and where it belongs instead — a
   rule, `AGENTS.md`, a skill, the glossary.
4. **What it saves you in the context window**, with real numbers where it has
   them.

It rewrites. It does not run the task. `/improve-prompt build me a login system`
returns a better prompt for building a login system, not a login system.

**Where it will leave a blank.** It never invents your acceptance criteria. If
your prompt has no finish line, you get a visible placeholder:

```
[FILL: what does done mean here? a number or a test, not "it works"]
```

That is the command working, not failing. Nobody but you knows what "done" means
for your project, and a made-up criterion is worse than a missing one because
you will not notice it is wrong.

**Why this saves tokens, which is not what most people assume.** It has nothing
to do with how much you type or how much comes back. A prompt carrying the right
task and the right file references gets the work done inside one tight window. A
vague one sends the agent hunting — opening whole files, filling the window with
results nobody needed — then costs you clarification turns, and every one of
those [re-sends the entire conversation](Context-Engineering). Then the work
built on the misunderstanding has to be read and undone, and that stays in the
window too.

None of that is about word count. It is [context
engineering](Context-Engineering), arriving through the prompt. Keep the window
small and you finish the feature without ever reaching compaction — which is the
whole point, because compaction is lossy and takes the decisions you made early.

Run it on a few of your own prompts in week one. The structure is the thing you
are meant to learn; after a fortnight you will be writing it without the command.

---

## What the labs agree on

Anthropic, OpenAI and DeepSeek publish guidance for different models trained in
different ways. Where they converge is where you should spend your effort.

A caveat you should see rather than have hidden from you: DeepSeek publish far
less prompting guidance than the other two — their model card gives four usage
recommendations and that is close to all of it. The dashes below are honest
gaps, not points of disagreement.

| The common advice | Anthropic | OpenAI | DeepSeek |
| --- | --- | --- | --- |
| **State the finish line precisely** | define success criteria *before* you start prompting | *"give very specific parameters for a successful response"* | — |
| **Use structure to separate the parts** | XML tags around instructions, context and inputs | *"use delimiters like markdown, XML tags, and section titles"* | — |
| **Say what you want, with constraints** | add context and motivation — explain *why* | *"explicitly outline those constraints in the prompt"* | — |
| **Do not over-engineer it** | start minimal, add only to fix observed failures | *"keep prompts simple and direct"* | *"avoid adding a system prompt; all instructions should be contained within the user prompt"* |

Sources: Anthropic, [Prompting best
practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices);
OpenAI, [Reasoning best
practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices);
DeepSeek, [DeepSeek-R1 model
card](https://huggingface.co/deepseek-ai/DeepSeek-R1). Retrieved 2 October 2026.

---

## Where they *disagree* — and why that is the most useful thing here

Take the single most famous prompting phrase in existence — *"think step by
step"* — and ask two vendors of **reasoning models** whether to use it.

- **OpenAI:** *"Avoid chain-of-thought prompts. Since these models perform
  reasoning internally, prompting them to 'think step by step' or 'explain your
  reasoning' is unnecessary."*
- **DeepSeek**, in the R1 model card's own usage recommendations: *"For
  mathematical problems, it is advisable to include a directive in your prompt
  such as: 'Please reason step by step, and put your final answer within
  `\boxed{}`.'"*

Same class of model. Opposite instructions. Both are each vendor's official
guidance for their own model.

Examples split the same way. Anthropic: *"Examples are one of the most reliable
ways to steer Claude's output format, tone, and structure."* OpenAI, for
reasoning models: *"Try zero shot first, then few shot if needed... reasoning
models often don't need few-shot examples."*

Nobody is lying. The advice is **model-specific**, and model-specific advice
goes stale faster than anyone updates their notes — including this page.

**So the only durable skill is measuring.** When someone — a blog post, a
classmate, this page — tells you a prompting trick works, the correct response
is to try it both ways on *your* task and keep what wins. That is
[`$build-evals`](Skills-Reference), and it is why this kit treats evals as a
build stage rather than an optional extra.

It is also the kit's first rule, `00-evidence-over-memory`, applied to your own
habits.

---

## Before you tune a prompt, know what "better" means

Anthropic's prompt engineering guide opens by assuming you already have three
things:

1. a clear definition of the success criteria for your use case
2. some way to **empirically test** against those criteria
3. a first draft prompt to improve

> If not, spend time establishing that first.

This is the step students skip, and skipping it is why prompt tweaking turns
into an afternoon of superstition. Without a criterion you are not improving a
prompt, you are changing it and feeling differently about the result.

DeepSeek make the same point as a measurement instruction rather than a
principle: *"When evaluating model performance, it is recommended to conduct
multiple tests and average the results."* One good run is not evidence. One bad
run is not evidence either — which is worth remembering before you throw away a
prompt that was actually fine.

For a one-off question, "it looks right" is a fine criterion. For anything that
goes in your demo, see [Testing and Evals](Testing-and-Evals).

---

## One more thing that is not obvious

"Think step by step" is a habit from an earlier generation of models, when the
reasoning had to be coaxed out in the visible answer. Modern reasoning models do
it internally, which is why OpenAI now tells you to leave the phrase out — and
why, as above, DeepSeek still wants it for maths on R1.

The resolution is not to pick a side. It is to notice that you are holding a
*belief about a model*, and that beliefs about models expire. Write down which
model you tested it on and when, the same way you would for any other
measurement.

What never expires: be exact about the finish line, and let the model work out
how to get there.

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
