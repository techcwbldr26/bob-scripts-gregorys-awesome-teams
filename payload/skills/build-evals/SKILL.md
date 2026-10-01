---
name: build-evals
description: Design an evaluation set and grader for the AI part of the product, then improve against it one change at a time. Use when the project uses an LLM, RAG, classification or generation, and the team needs to prove it works rather than claim it does.
---

A demo of an AI feature with no eval is a demo of one lucky run. Build the
measurement before you tune the thing.

## Part 1 — A well-designed eval has four properties

Check all four before trusting a number.

1. **The tasks mirror real use.** Sample from the setting the feature will
   actually be used in. The usual failure is picking tasks because they were
   easy to generate or easy to grade, which measures something nobody cares
   about.
2. **Stronger settings score better.** A more capable model, or more thinking,
   should improve the score. If it does not, suspect ambiguous tasks or a
   miscalibrated grader — not a plateau.
3. **There is headroom.** The best configuration should be well below 100%, or
   you cannot see whether a change helped. But headroom must not come from
   impossible tasks: a task that fails every single run, no matter how many
   repeats, is usually broken rather than hard.
4. **Variance is low.** Run the same configuration twice. If the score moves a
   lot, you cannot attribute later changes to your edits. Variance hides in
   ambiguous tasks, in an inconsistent grader, and in leftover state from a
   previous run that hands the answer to the model.

**Task quality standard:** two people who know the domain would reach the same
verdict, and everything the grader checks is stated in the task.

## Part 2 — Sample cases adversarially, not conveniently

Pick hard cases because **a human judged them hard**, and be able to say why
before including one. Sources, in priority order:

1. Real failures — bug reports, things that went wrong in testing, user complaints.
2. Cases the team wrote by hand because they know they are hard. Five to ten is
   a real start.
3. Cases synthesised from the codebase or corpus, anchored on the real ones.

Do **not** build the set out of whatever today's model happens to fail: that
measures one model's failure fingerprint, not what is intrinsically hard. And do
not build it only from observed usage — people try what they expect to work, so
that distribution skews easy.

## Part 3 — Pick the cheapest grader that fits

| Output shape | Grader |
| --- | --- |
| A label from a fixed set, exact match, JSON against a schema, tests that pass | Programmatic check. Always prefer this. |
| Open-ended, many valid answers, clear quality criteria | LLM-as-judge |

Rules for a judge that actually works:

- Write the rubric as **checkable claims**, never a 1-to-5 scale.
- Judge **model must not be the model under test.**
- Comparing two versions: give the judge both outputs in random order and do not
  tell it which is the baseline.
- Before you believe any score, read a sample of graded transcripts yourself.
  Misconfigured grading is the single most common reason an eval lies.

## Part 4 — Baseline, with three checks

Run the baseline and report the score **with a confidence interval**. Then:

- **Grader stability** — grade the same output twice; did the verdict change?
- **Plumbing** — any timeouts, API errors, truncated outputs? Infrastructure
  noise masquerades as model variance.
- **Headroom** — if the baseline is already ~95%, stop. Retarget at cost or
  latency, because there is nothing measurable left to win on quality.

Store one JSON line and one full transcript per case, plus a plain local page
listing each case's score with a link to its transcript.

## Part 5 — Hillclimb, one change per round

Split the cases: a **train** set you may read, and a **test** set you never look
at while iterating.

First, check the noise floor: if the eval can move by more than your smallest
interesting improvement purely by chance, add repeats or cases before spending a
single round.

Each round:

1. Read **train** failures only.
2. Propose **exactly one** change, as a patch.
3. Fix the cause at its root — rewrite the section producing the bad behaviour,
   or add the missing rule. Do not reword a line and hope.
4. Re-run.

| Result | Action |
| --- | --- |
| Train up, test up | Keep |
| Train up, test flat | Overfitting. **Revert.** |
| Any regression | Revert |

**Never paste a failing case's content into the prompt.** That is how the eval
leaks into the thing being evaluated.

**When the score stalls two or three rounds:** make no edit. Read every
remaining train failure and sort them by cause. This is where you find the
ambiguous tasks, the harness bugs and the variance you mistook for difficulty.

## Part 6 — Report

Leave the code at whatever did best **on the test set**. Report the test result
against the baseline with confidence intervals. If the gain sits inside the
noise, **say so and recommend not merging it.** Reporting an improvement that
is noise is worse than reporting no improvement.

Worked numbers and a fuller treatment are in `references/evals-and-hillclimbing.md`.
