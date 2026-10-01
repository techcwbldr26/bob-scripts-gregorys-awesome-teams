---
name: rag-architecture
description: Design retrieval-augmented generation over the team's own documents or data, and make it measurable. Use when the product answers questions from a corpus, needs citations, or when "we will use RAG" has not yet been turned into chunking, retrieval and evaluation decisions.
---

"We'll use RAG" is not a design. These are the decisions, in the order they
constrain each other.

## Decision 1 — Is retrieval actually the answer?

Ask first. Retrieval is the right tool when the corpus is large, changes, and
the answer must be attributable to a source. It is the wrong tool when:

- The corpus fits comfortably in the context window — just put it in the prompt.
- The task needs reasoning over the whole corpus at once (counting, aggregating,
  comparing everything) — retrieval returns fragments and will quietly miss.
- The data is structured and queryable — write a query. A SQL `WHERE` beats a
  similarity search on a database every time.

Say which of these applies before building anything. Choosing retrieval when the
corpus is small is the most common wasted fortnight in this kind of project.

## Decision 2 — What is a chunk?

Chunk on the document's own structure — heading, section, clause, slide, turn —
before falling back to fixed sizes. Record for each chunk: source document, a
stable location (page, heading path, line range), and enough neighbouring context
that the chunk is intelligible alone.

Use `firecrawl_parse` to get clean markdown from the team's PDFs, DOCX and
spreadsheets before chunking. Chunking a bad text extraction produces bad
retrieval, and the cause is invisible downstream.

**The test:** read five random chunks cold. If you cannot tell what each one is
about without opening the source, the chunking is wrong.

## Decision 3 — How do you retrieve?

Start with the simplest thing that could work, and only add a stage when a
measured failure demands it:

1. Keyword / BM25. Often enough, and it never hallucinates a match.
2. Embeddings for semantic similarity.
3. Hybrid, with a documented merge rule.
4. A reranker over the top N.

Write down `k`, and why that number. Write down what happens when nothing
relevant is found — **a retrieval miss must produce "I don't know", not a
confident answer from the model's own memory.** That is the single most
important behaviour to get right, and the easiest to miss.

## Decision 4 — Citations

Every claim in an answer carries its source chunk. If the system cannot show
where an answer came from, the demo audience has no reason to believe it and
neither should the team. Make citations a tested acceptance criterion.

## Decision 5 — How will you know it works?

Build the eval alongside, not after. Measure the two halves separately, because
they fail for different reasons and a single end-to-end number hides which:

- **Retrieval:** for a set of questions with known-correct source documents, is
  the right chunk in the top `k`? Report recall@k.
- **Generation:** given correct chunks, is the answer right and properly cited?

Then measure end to end. Hand this to `$build-evals` for the grader design and
the hillclimbing loop.

## The failure modes to test for explicitly

Write a test for each of these. They are what breaks on stage:

- Query with no relevant document → says so, cites nothing, invents nothing.
- Query whose answer spans two documents → retrieves both.
- Two documents contradicting each other → surfaces the conflict rather than
  silently picking one.
- A document updated after indexing → stale answer, or correctly refreshed?
- Query in a form nobody anticipated (one word; a whole paragraph; a typo).
- A document the asking user is not allowed to see → never retrieved.

## Report

The five decisions with the reason for each, the retrieval metric with its
number, and the failure modes with their test status.
