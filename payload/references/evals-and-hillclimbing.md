# Evals and hillclimbing

The stage teams skip, and the one that answers "how do you know it works?"

## Part 1 — Four properties of an eval worth trusting

1. **Tasks mirror production.** Sample from the real setting. The standard failure
   is choosing tasks because they were easy to generate or easy to grade, which
   measures something nobody cares about.
2. **Stronger settings score better.** A better model, or more thinking, should
   improve the score. If it does not, suspect ambiguous tasks or a broken grader —
   not a ceiling.
3. **There is headroom.** The best configuration should be well below 100%. But a
   task that fails *every* run regardless of repeats is usually broken, not hard.
4. **Variance is low.** Run the same configuration twice. Large movement means you
   cannot attribute later changes to your edits. Variance hides in ambiguous
   tasks, in inconsistent grading, in effort applied unevenly, and in leftover
   state — a file or a git history from a previous trial that hands the model the
   answer.

**Task standard:** two people who know the domain reach the same verdict, and
everything the grader checks is stated in the task.

## Part 2 — Sample adversarially

Model capability is jagged. If you pick cases because *today's* model fails them,
you have mapped one model's failure fingerprint, not what is intrinsically hard.
Next month's model has different valleys and your eval is worthless.

Pick hard cases because a **human** judged them hard — and be able to say why
before including one. Draw from real failures: bug reports, tickets, things that
went wrong in testing. But do not build the set only from observed usage, because
people try what they expect to work, so that distribution skews easy.

## Part 3 — The cheapest grader that fits

| Output | Grader |
| --- | --- |
| Label from a fixed set, exact match, JSON against a schema, tests pass | Programmatic. Always prefer this. |
| Open-ended, many valid answers, clear criteria | LLM-as-judge |

Judge rules:

- Rubric as **checkable claims**, never a 1-to-5 scale. "Mentions the 5-day cap"
  is checkable; "is high quality" is not.
- The judge must **not** be the model under test.
- Comparing two versions: both outputs, random order, judge not told which is
  the baseline.
- **Read a sample of graded transcripts yourself** before believing any score.
  Misconfigured grading is the most common way an eval lies to you.

## Part 4 — Baseline, and three checks

Report the baseline **with a confidence interval**. Then:

| Check | How | Why |
| --- | --- | --- |
| Grader stability | Grade the same output twice | A grader that disagrees with itself makes every later number meaningless |
| Plumbing | Count timeouts, API errors, truncated outputs | Infrastructure noise reads exactly like model variance |
| Headroom | Is the baseline already ~95%? | If so, retarget at cost or latency. There is nothing measurable left on quality |

Keep one JSON line and one full transcript per case, plus a plain local page
listing each case's score and linking its transcript.

## Part 5 — Where hillclimbing works

Three conditions. Missing any one and you will spend rounds learning nothing:

- **Cheap to change.** Text — prompts, skills, instruction files — is ideal:
  trivial to edit, trivial to revert. Open-ended harness code is not.
- **Attributable.** The score must move *because of* the surface you edited.
- **Well-scoped objective.** "Improve performance" on a near-saturated eval
  stalls immediately. **Cost is a strong objective even then**: hold quality at
  parity and reduce spend.

## Part 6 — Overfitting, and three defences

Even a good eval does not match production exactly, so improvements can be real
on your set and worthless outside it. Real leak paths: adding a tool that helps
your task mix and nothing else; a rule like "always cd /app, run pytest" because
your tasks live there; a prompt tuned to your cases' distinctive phrasing; one
patch per failure you read.

1. **Split the cases.** A train set the loop may read; a test set it never sees.
   Train improving while test stays flat is the warning sign.
2. **Never paste a failure's content into the prompt.** Read transcripts to
   diagnose; do not transplant them.
3. **Keep answers structurally out of reach.** If the reference solutions are
   fetchable, something will fetch them.

## Part 7 — The loop

Before round 1, check the noise floor: if the score can move by more than the
smallest improvement you would act on, purely by chance, **add repeats or cases
first.** Otherwise every round is unreadable.

Each round:

1. Read **train** failures only.
2. Propose **exactly one** change, as a patch.
3. Aim at something whose effect can clear the noise.
4. **Fix the cause at its root** — rewrite the section producing the behaviour, or
   add the missing rule. Rewording a line and hoping is not a round.
5. Re-run.

| Train | Test | Action |
| --- | --- | --- |
| Up | Up | **Keep** |
| Up | Flat | Overfitting. **Revert.** |
| Any regression | — | **Revert** |

**When the score stalls for two or three rounds: make no edit.** Read every
remaining train failure and sort by cause. This is where you find the ambiguous
tasks, the harness bugs and the variance you had been reading as difficulty. Do
this early rather than burning rounds on unmeasurable changes.

## Part 8 — Finishing

Leave the code at whatever did best **on the test set**. Report the test result
against the baseline with confidence intervals. **If the gain is inside the noise,
say so and recommend not merging.** Reporting noise as an improvement is worse
than reporting nothing, because the team then builds on a result that is not real.

## What this looks like with numbers

A support-triage example, 44 cases, 30 for the search and 14 held out:

| Step | Accuracy | Cost per case |
| --- | --- | --- |
| Baseline, high effort | 74.4% | 4.6¢ |
| After removing mandatory tool rituals, a scratchpad step, and contradictory rules | 87.8% | 1.9¢ |
| Stepping *down* a model tier at low effort | 88.9% | ~1.0¢ |
| Plus routing rules and a cross-reference fix | 98.9% | ~1.0¢ |
| **Held-out set, final vs original** | **90.5% vs 78.6%** | **~1/5 the cost** |

Two things to take from that. First, the largest single win came from *deleting*
instructions, not adding them — contradictory prompt rules were costing accuracy
and money together. Second, the honest number is the held-out one: 98.9% on the
set you tuned against is not what you report.

A second example, improving a documentation skill: 66.1% → 87.9% over 24 rounds.
The interesting part is the two-round stall in the middle. The no-edit reflection
pass found the content was present but the model was writing older API shapes
from its own priors; the fix was a table near the top of the skill mapping
remembered forms to current ones. No amount of adding more documentation would
have found that — only stopping to sort failures by cause did.

Later rounds also showed the other reason to read failures properly: two tasks
that never improved turned out to have broken graders, one contradicting the
documentation it was testing. A task that never moves is a tell.
