---
name: discover-with-firecrawl
description: Gather verified real-world evidence about a product or service idea before designing it. Use at the start of a project, when the user supplies links, PDFs or docs, when a market, competitor, pricing, regulation or API claim needs checking, or whenever a factual claim would otherwise come from model memory.
---

Your job is to replace assumption with evidence. You have Firecrawl; use it
before you form an opinion.

## Step 1 — Separate the claims from the idea

Read what the team gave you (their pitch, links, PDFs, docs) and write a short
numbered list of **load-bearing claims** — the statements that, if false, would
change what they should build. Typical ones:

- "Nobody else does X." (competitive)
- "Institutions are required to do Y." (regulatory)
- "This API gives us Z." (technical)
- "Users of this group behave like W." (behavioural)

Show the list before researching. Ask the team which claims matter most if more
than five survive.

## Step 2 — Route each claim to the right tool

Choosing wrong is the common failure. Route deliberately:

| Claim is about | Tool | Why this one |
| --- | --- | --- |
| A library, API, error, framework | `firecrawl_developer_search` | Indexes issues, merged PRs, READMEs and docs — primary sources, not blog chatter |
| The open web: market, competitor, news | `firecrawl_search` | Results carry page content as markdown, so one call usually replaces a search-then-fetch pair |
| A specific URL the team supplied | `firecrawl_scrape` | Runs a real browser, so JavaScript-heavy pages work |
| A PDF / DOCX / XLSX / slide deck | `firecrawl_parse` | Clean markdown with tables and OCR'd images preserved |
| Academic or clinical evidence | `firecrawl_research_search_papers` | Searches paper abstracts across PubMed, bioRxiv, medRxiv, arXiv |
| Numbers that must be real and current | `firecrawl_find_tools`, then `firecrawl_scrape` with an `alexandria` body | Typed records from a named provider, not a model's recollection of a number |

Read `references/firecrawl-playbook.md` for argument-level detail, including
when to use `formats: ["json"]` with a schema instead of reading prose.

## Step 3 — Prefer structured data over scraped prose

When the idea needs real numbers — prices, filings, flights, places, public
spending, package stats — do not scrape a page and read figures out of it.
Call `firecrawl_find_tools` with a description of the data, pick a provider
capability, and execute it. Discovery is free; you only pay on execution.

Two traps the docs call out explicitly:

- A tool match is a **capability description, not data**. You still have to
  execute it.
- Check every entry in `data.alexandria[]` for its own error. The outer call can
  succeed while an individual capability failed.

## Step 4 — Write the evidence file, not a chat summary

Create or update `references/evidence.md`. For each claim:

```markdown
### Claim 3 — "Universities must retain assessment records for 7 years"

**Verdict:** Partly true, jurisdiction-dependent.
**Evidence:** <url> — <the specific sentence that supports or refutes it>
**Retrieved:** 2026-10-01 via firecrawl_search
**What this changes:** retention becomes a first-class requirement, not a
"nice to have" — it needs a schema field and a test.
```

A claim you could not settle gets `**Verdict:** Unverified` and a note on where
you looked. Do not quietly drop it.

## Step 5 — Report the consequences, not the reading

Close with:

1. Claims that survived.
2. Claims that died, and what dies with them.
3. Claims still unverified, and what it would take to settle them.
4. The one thing the team should change about the idea based on this.

## It's working if

- Every number in the plan traces to a URL and a retrieval date.
- At least one original assumption died. If none did, you researched to confirm
  rather than to find out.
- The team's own documents were parsed, not skimmed from their filenames.
- `references/evidence.md` exists and a stranger could audit it.
