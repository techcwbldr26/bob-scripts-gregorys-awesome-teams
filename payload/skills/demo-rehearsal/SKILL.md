---
name: demo-rehearsal
description: Harden a project for a live demo in front of an audience and rehearse the failure modes. Use in the weeks before the presentation deadline, when preparing a walkthrough, or when the team needs to know what will break on stage.
---

The demo is on {{DEMO_DATE}} and it is live. Assume the network is bad, the
projector is 4:3, and someone asks the one question nobody prepared for.

## Step 1 — Write the script as a file

`docs/demo-script.md`. Minute by minute, with the exact words for the opening
and the closing, and the literal inputs that will be typed. A demo improvised
from a slide deck goes wrong in a way a scripted one does not.

For each beat: what the audience sees, what the presenter says, what has to be
true beforehand for it to work.

## Step 2 — Find what kills it, then fix those things

Walk the script and list every point of failure. Then go in this order:

| Failure | Fix |
| --- | --- |
| A live API call during the demo | Cache the response, or ship a recorded fixture behind a flag. Decide now which. |
| Needs the network | Make the critical path work offline, or have a local fallback you have actually tested offline |
| Cold start / first-run slowness | Warm it before you present; or make the slow step visible with real progress, not a spinner |
| An empty state the team never looked at | Seed realistic demo data, committed and reproducible |
| An error path nobody has seen | Trigger it on purpose. A handled error on stage is fine; a stack trace is not |
| One person's laptop only | Run the setup from a clean checkout on a second machine |

## Step 3 — Rehearse the questions

Write `docs/demo-qa.md` with honest answers to the questions that will actually
come. Prepare at least these:

- "How do you know it works?" → the eval numbers from `$build-evals`, with the
  confidence interval and the sample size. This is why the evals exist.
- "What happens with our data?" → retention, where it is stored, who can see it.
- "What did you build versus what did you use?" → be exact. Claiming a library's
  work is the fastest way to lose an audience's trust.
- "What does it cost to run?" → a real per-user number.
- "What doesn't it do yet?" → the out-of-scope list from the spec, said with
  confidence. Naming your limits reads as command of the problem.
- "Why not just use <obvious alternative>?" → the evidence from
  `references/evidence.md`.

## Step 4 — Do a real dry run

Clean checkout, clean machine, run the published setup script, follow the
script start to finish, timed. Note every place a human had to improvise and fix
those, because under pressure nobody improvises as well.

Then run it once more with something deliberately broken — unplug the network
mid-demo — and practise the recovery sentence.

## Step 5 — Report

- Timed length against the slot.
- Every failure point, and whether it is fixed, mitigated or accepted.
- What needs a human decision before demo day.
- The one thing most likely to go wrong, and the plan for when it does.

## It's working if

- The demo has been run end to end on a machine that is not the author's.
- Every number said aloud traces to an eval run or an evidence file.
- The team can answer "how do you know it works" with a measurement.
- There is a rehearsed recovery for the most likely failure.
