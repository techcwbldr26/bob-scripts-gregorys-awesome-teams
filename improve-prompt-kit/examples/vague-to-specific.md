# A rough prompt, rewritten

The point of this example is not the improved prompt. It is the table
underneath it — the part that tells you *why*, so the next one you write needs
less help.

## What was typed

```
make the search better
```

## What came back

### 1. The improved prompt

```
Improve result quality in the document search endpoint.

Context: the search handler is in src/search/handler.ts:40-120. It currently
ranks by BM25 alone over the `documents` table.

Done means:
- a query for a term that appears only in a document's title ranks that
  document in the top 3, for all 12 cases in test/search/ranking.test.ts
- p95 latency over the existing 5,000-document fixture stays under 800 ms
- the existing test suite passes

Out of scope: changing the ingestion pipeline, adding an embedding model,
touching the database schema.

Stop and ask me if title weighting alone cannot reach the top-3 target —
I would rather decide about embeddings than have you adopt them.
```

### 2. What changed

| What was missing | What was added | Why it matters |
| --- | --- | --- |
| which search | the endpoint and the file, with a line range | "better" could have meant the UI, the ranking or the speed; the line range also stops the agent reading the whole directory |
| a finish line | a named test file and a p95 number | "better" is not checkable, so nothing could have told you when to stop |
| scope | three things explicitly excluded | without this, "better search" invites an embedding pipeline you did not ask for |
| a stop condition | the one decision reserved for you | otherwise the agent either asks about everything or silently picks an architecture |

### 3. What does not belong in a prompt

Nothing here. The p95 target is specific to this task, not a standing rule.

If you had written "and remember to write tests first", that *would* have
belonged in the harness — it is true on every turn, so paying for it in every
prompt is the expensive way to hold it.

### 4. What this saves in the context window

- **Hunting:** `src/search/handler.ts:40-120` instead of `src/search` is roughly
  80 lines read instead of a directory. On a repository this size that is the
  difference between a few hundred tokens and several thousand (estimate).
- **Clarification turns:** the original would have cost at least two — "which
  search?" and "what does better mean?" — and each one re-sends the whole
  conversation.
- **Wrong work:** the out-of-scope list is what stops an afternoon of embedding
  work that then has to be read and undone, with all of it still in the window.

## The honest note

The improved prompt is four times longer than what was typed. That is not the
cost that matters, and anyone optimising for short prompts has misunderstood
the problem. The cost is the *session*.
