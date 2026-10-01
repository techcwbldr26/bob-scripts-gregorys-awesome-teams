# Document question-answering for study groups

## Problem

Second-year students revising from lecture PDFs cannot find which document
answers a given question. They currently open files one at a time and use
Ctrl-F, which fails whenever the slides use different wording from the question.
Interviews with six students (see `references/evidence.md`, claims 1–4) put the
average search at just over four minutes, and three of the six said they had
given up and guessed in an exam.

## In scope for {{DEMO_DATE}}

1. Upload up to 50 PDF or DOCX files to a study group.
2. Ask a natural-language question and get an answer with citations.
3. Every citation names the document and page, and opens it at that page.
4. "I could not find this in your documents" when retrieval finds nothing relevant.
5. One group per account; members join by link.

## Explicitly out of scope

Handwriting and scanned-image OCR; video or audio; multiple groups per account;
mobile app; answer editing; sharing outside the group; anything in a language
other than English.

## Vocabulary

**Study group**, **Document**, **Chunk**, **Citation**, **Retrieval miss** — all
defined in `GLOSSARY.md`. Do not redefine them here.

## Acceptance criteria

1. A 40 MB PDF uploads and reaches `parsed` state within 60 seconds, or returns a
   specific error.
2. A DOCX whose text is inside tables is parsed with table structure preserved.
3. A question whose answer is in exactly one document cites that document and no
   other, on the 30-case eval set, at least 27 times out of 30.
4. A question with no answer in the corpus returns the retrieval-miss message and
   zero citations, on all 10 adversarial cases.
5. Every citation's page number opens the source at the page containing the
   quoted text, verified by hand across 20 citations.
6. p95 answer latency is under 6 seconds over the 5,000-chunk demo corpus.
7. A user who is not a member of a group receives 404 — not 403 — for that
   group's documents and answers.
8. An upload that fails mid-stream leaves no document row and no stored object.
9. The suite passes with line coverage at or above {{COVERAGE_GATE}}%.

## Evidence this is the right thing

Claims 1–4 in `references/evidence.md` (student interviews, 2026-10-03).
Claim 7 (no existing tool does per-page citation on a free tier) — verified
2026-10-05 via `firecrawl_search`, four competitors checked.

## Open questions

- Retention after a group goes inactive. Needs a decision from the team by
  2026-10-20; blocks criterion 8's cleanup job.
- Whether a retrieval miss should offer the closest non-matching chunk. Jo
  thinks yes; unresolved.

## Risks

| Risk | Mitigation |
| --- | --- |
| Parsing quality on slide-heavy PDFs is the whole product; if it is bad, nothing else matters | Measure parse quality on 20 real lecture decks in week one, before building retrieval |
| Live upload during the demo could be slow or fail | Pre-seed the corpus; the demo upload is one small file, with a recorded fallback |
| Free-tier rate limits during a live demo | Cache the demo questions' retrieval results; rehearse offline |
