# Testing and Evals

Two different things, both required.

- **Tests** prove your *code* does what you said. Gate: **90% line coverage**.
- **Evals** prove the *AI part* works. Without one, you have an unknown success
  rate.

---

## Part 1 — Tests

### The loop, per acceptance criterion

1. Pick **one** criterion from the spec.
2. Write the test. **Run it. Watch it fail.** A test you never saw fail has not
   been shown to test anything — it might assert nothing at all.
3. Write the smallest code that makes it pass.
4. Run the **whole** suite, not just the new test.
5. Run coverage. Below the gate? The next thing you write is a test.
6. Tick it off in `TASKS.md`.

### What to test, and what not to

Spend the effort here:

- **Boundaries** — empty, one, many, maximum, one past maximum
- **The unhappy path** — malformed input, missing credential, network failure,
  partial write. This is where demo-day bugs live.
- **Contracts at the seams** — what your API promises callers
- **The bug you just fixed** — every fix gets a regression test named for the bug

Do not spend it asserting that a framework works, or that a getter returns what
was set.

### Coverage is a floor, not a goal

It is easy to hit 90% while testing nothing that matters.

**Never** reach the gate by deleting an assertion, skipping a test, loosening a
threshold, or excluding a file from the report. If a test is genuinely wrong, say
why and fix it deliberately.

---

## Part 2 — Evals

### Four properties of an eval worth trusting

1. **Tasks mirror real use.** The usual failure is picking tasks because they were
   easy to generate or easy to grade.
2. **Stronger settings score better.** A better model should improve the score. If
   it does not, suspect ambiguous tasks or a broken grader, not a ceiling.
3. **There is headroom.** The best configuration should be well below 100%. But a
   task that fails *every* run, no matter how many repeats, is usually broken
   rather than hard.
4. **Variance is low.** Run the same configuration twice. Large movement means you
   cannot attribute later changes to your edits.

**Task quality standard:** two people who know the domain would reach the same
verdict, and everything the grader checks is stated in the task.

### Pick hard cases for a reason

Choose cases because **a human judged them hard**, and be able to say why before
including one.

Do *not* build the set out of whatever today's model happens to fail — that maps
one model's failure fingerprint, not what is intrinsically hard. Next month's
model has different weak spots and your eval is worthless.

### The cheapest grader that fits

| Output | Grader |
| --- | --- |
| A label from a fixed set, exact match, JSON against a schema | **Programmatic.** Always prefer this |
| Open-ended, many valid answers, clear criteria | **LLM-as-judge** |

Judge rules:

- Rubric as **checkable claims**, never a 1-to-5 scale. "Mentions the 5-day cap"
  is checkable; "is high quality" is not.
- The judge must **not** be the model under test.
- **Read a sample of graded transcripts yourself** before believing any score.
  Misconfigured grading is the most common way an eval lies to you.

### Baseline, with three checks

Report the baseline **with a confidence interval**. Then check:

| Check | Why |
| --- | --- |
| Grade the same output twice | A grader that disagrees with itself makes every later number meaningless |
| Count timeouts and API errors | Infrastructure noise reads exactly like model variance |
| Is the baseline already ~95%? | Then retarget at cost or latency — there is nothing measurable left on quality |

### Improving: one change per round

Split your cases: a **train** set you may read, and a **test** set you never look
at while iterating.

Each round: read train failures only, propose **exactly one** change, fix the
cause at its root, re-run.

| Train | Test | Action |
| --- | --- | --- |
| Up | Up | **Keep** |
| Up | Flat | Overfitting. **Revert** |
| Any regression | — | **Revert** |

**When the score stalls for two or three rounds: make no edit.** Read every
remaining failure and sort by cause. That is where you find the ambiguous tasks
and the harness bugs you had been reading as difficulty.

**If a gain sits inside the noise, say so and do not merge it.** Reporting noise
as an improvement is worse than reporting nothing.

---

## What this buys you on demo day

Someone will ask **"how do you know it works?"**

With an eval: *"87.9% on 30 held-out cases, up from 66% — here's the confidence
interval."*

Without one: *"it seems to work pretty well."*

That is the whole reason this stage exists.
