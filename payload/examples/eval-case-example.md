# One eval case, end to end

A case is not useful until you can say why it is hard, how it is graded, and what
the grader did on a real run. This is one case from the document-QA eval.

## The case

```json
{
  "id": "qa-017",
  "question": "What's the penalty for a late submission?",
  "corpus": "demo-corpus-v2",
  "expected_source": "module-handbook-2026.pdf",
  "expected_page": 14,
  "expected_claim": "5 percentage points per calendar day, capped at 5 days, after which the mark is zero",
  "tags": ["single-document", "numeric", "hard-wording"],
  "why_hard": "The handbook says 'deduction of five marks per day'; the question says 'penalty'. No lexical overlap on the key term, so keyword retrieval misses it. It also has a second clause (the 5-day cap) that answers often drop."
}
```

`why_hard` is mandatory. A case nobody can justify was chosen for convenience,
and convenience samples measure the wrong thing.

## The grader

Two checks, because they fail independently and a single score would hide which:

**Retrieval (programmatic).** Is a chunk from `expected_source` at
`expected_page` in the top `k`? Returns 1 or 0. No judgement needed, so no judge.

**Answer (LLM judge, rubric as checkable claims).** Never a 1-to-5 scale:

```
Score 1 for each claim the answer satisfies, 0 otherwise. Report each separately.

1. States the deduction is 5 marks or 5 percentage points per day.
2. States the period is per calendar day (not working day).
3. States the 5-day cap.
4. States the mark is zero after the cap.
5. Cites module-handbook-2026.pdf.
6. Makes no claim absent from the cited chunk.

Do not reward style, length or confidence.
```

Claim 6 is the one that catches confident invention, which is the failure mode
that matters most here. The judge is a different model from the one under test.

## A real run

```
qa-017  retrieval: 1   answer: 4/6   notes: missed the 5-day cap (claim 3)
                                            and the zero consequence (claim 4)
```

Transcript: `evals/runs/2026-10-18T09-14/qa-017.json`

## What that result means

Retrieval worked; generation dropped the second clause. That is a generation
problem, and the fix belongs in the answer prompt — not in `k`, not in the
chunker. Without the split metric, the team would likely have spent a day tuning
retrieval that was already correct.

Across all 30 cases, 11 lost a point on a multi-clause answer, which made
"answer every clause of a multi-part rule" the next hillclimb round — one change,
aimed at a cause, large enough to show above the noise.

## Set-level record

```
Baseline, 30 cases × 3 repeats, 2026-10-18
  retrieval recall@5   0.933  (95% CI 0.87–0.97)
  answer mean          0.742  (95% CI 0.70–0.78)
  end-to-end           0.700  (95% CI 0.65–0.75)
  grader stability     30/30 identical on re-grade
  plumbing             0 timeouts, 0 API errors
  headroom             yes — well below ceiling, keep hillclimbing on quality
```

Report confidence intervals from the start. A later round that moves the mean
from 0.742 to 0.761 has not necessarily done anything, and the interval is what
tells you.
