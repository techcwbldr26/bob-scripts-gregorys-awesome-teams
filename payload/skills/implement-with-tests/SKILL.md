---
name: implement-with-tests
description: Build a feature test-first and carry it to the project's 90 percent coverage gate. Use when implementing anything from a spec or ticket, when tests are missing for existing code, or when a change needs to be proven rather than asserted.
---

Build the work described by the spec. Tests come first, and "done" means the
suite passes and the gate holds.

## The loop, per acceptance criterion

<Steps>
<Step>
Pick one acceptance criterion from the spec. One, not the whole spec.
</Step>

<Step>
Write the test that asserts it. **Run it and watch it fail.** A test you never
saw fail has not been shown to test anything — it may assert nothing, or assert
something already true. Paste the failure.
</Step>

<Step>
Write the smallest implementation that makes it pass. Resist building the
general case before a second caller exists.
</Step>

<Step>
Run the whole suite, not just the new test. Paste the real output.
</Step>

<Step>
Run coverage. If the gate fails, the next step is a test, not a feature.
</Step>

<Step>
Tick the item in `TASKS.md`. Move to the next criterion.
</Step>
</Steps>

## What to test, and what not to

Coverage is a floor, not a goal — it is easy to hit 90% while testing nothing
that matters. Spend the effort here:

- **Boundaries.** Empty, one, many, maximum, one past maximum.
- **The unhappy path.** Malformed input, missing credential, network failure,
  partial write. These are where demo-day bugs live.
- **Contracts at the seams.** What your API promises callers, in both directions.
- **The bug you just fixed.** Every fix gets a regression test, named for the bug.

Do not spend effort asserting that a framework works, that a getter returns
what was set, or on tests that restate the implementation line by line.

## Coverage, honestly

Run coverage every time; report the real number. If it is below {{COVERAGE_GATE}}%, name the
uncovered lines and say whether each one needs a test or needs deleting —
untestable code is often code nobody needs.

Never reach the gate by deleting an assertion, skipping a test, loosening a
threshold, or excluding a file from the report. If a test is genuinely wrong,
say so, explain why, and fix the test deliberately.

## When a test fails

Diagnose before you edit. A failing test is information; the question is whether
the test or the code is wrong, and guessing wastes a cycle. State which one you
think it is and why, then fix that one.

If you cannot make a criterion pass, say so explicitly, leave the failing test
in place, and report what is blocking. A quietly skipped criterion is how a team
discovers on {{DEMO_DATE}} that a feature never worked.

## Before you say it is done

- The full suite passes, and the output is in your message.
- Coverage is at or above {{COVERAGE_GATE}}%, and the number is in your message.
- Every acceptance criterion is either tested or explicitly listed as not done.
- `TASKS.md` reflects reality.
