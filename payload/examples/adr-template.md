# ADR 0003 — Store uploaded documents outside the database

**Status:** Accepted
**Date:** 2026-10-14
**Deciders:** Priya, Marcus, Jo

## The three gates

An ADR is only written when a decision passes all three. State them, so a reader
can tell why this one earned a file:

- **Hard to reverse?** Yes. Changing it after launch means migrating stored files
  and rewriting every read path.
- **Surprising without context?** Yes. The obvious move is a `BYTEA` column, and
  a newcomer would ask why we did not.
- **A real trade-off?** Yes. We give up transactional consistency between a row
  and its file to gain cheap storage and streaming reads.

## Context

Teams upload PDFs and DOCX files averaging 2.4 MB, with a long tail to 40 MB.
Our free-tier Postgres instance allows 500 MB total. At the demo corpus size
(roughly 800 documents) the files alone would be about 1.9 GB.

Measured on 2026-10-12: parsing a 40 MB PDF through `firecrawl_parse` takes
11 seconds, so uploads are already asynchronous.

## Decision

Uploaded files go to object storage. The database stores a row with the object
key, a content hash, the parsed markdown, and the chunk records.

## Consequences

**Good**

- Database stays inside the free tier.
- Re-parsing does not require re-uploading.
- The content hash gives us deduplication for free.

**Bad**

- A row and its object can diverge. We need a reconciliation job, and a test that
  a failed upload leaves no orphan row.
- Two credentials to configure instead of one, which is one more wizard stage.

**Neutral**

- Signed URLs become the download path, so access control moves into URL
  generation. That needs its own test.

## Alternatives considered

| Option | Why not |
| --- | --- |
| `BYTEA` column | Blows the storage tier at about a third of the demo corpus |
| Local filesystem | Does not survive a redeploy; breaks the clean-checkout demo rehearsal |
| Parse on upload, discard the original | Cannot re-parse when chunking changes, and chunking will change |
