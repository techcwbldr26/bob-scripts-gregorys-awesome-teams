# Tests and coverage

The gate is {{COVERAGE_GATE}}% line coverage. It is a floor, not a target.

- Write the test before the fix, and watch it fail first. A test you never saw
  fail has not been shown to test anything.
- Run the whole suite before claiming success, and paste the real output.
- Every bug fix gets a regression test named for the bug.
- Spend test effort on boundaries, unhappy paths and contracts at the seams, not
  on asserting that a framework works.

Never reach the gate by deleting assertions, skipping tests, loosening a
threshold, or excluding files from the report. If a test is genuinely wrong, say
why and fix it deliberately.
