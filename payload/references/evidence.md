# Evidence

Verified claims about this project's problem, market, users and dependencies.
`$discover-with-firecrawl` writes here. Nothing goes in the spec without a claim
in this file.

## How to add a claim

```markdown
### Claim N — "<the claim, in the words someone actually said it in>"

**Verdict:** True | False | Partly true | Unverified
**Evidence:** <url> — <the specific sentence that settles it>
**Retrieved:** <date> via <tool>
**What this changes:** <what the team should do differently, or "nothing">
```

Rules that make this file worth having:

- Quote the sentence that settles it, not the page's topic. "The page discusses
  retention" is not evidence.
- Keep the retrieval date. A price verified in September is not verified in
  November.
- Keep dead claims. A claim you disproved is the most valuable row in the file —
  it is the six weeks you did not waste, and it is what you say when someone asks
  "did you consider...".
- `Unverified` is a legitimate verdict. Say where you looked.

## Claims

### Claim 1 — "These public sources exist and can be retrieved as official pages"

**Verdict:** True for the national entry points. State-by-state files are indexes, not a complete download of every state.
**Evidence:** Firecrawl search and scrape on 2026-10-07. Saved pages are in `references/sources/`. The catalog is `references/public-sources.md`.
**Retrieved:** 2026-10-07 via firecrawl_search and firecrawl_scrape
**What this changes:** The evidence platform should link to these official pages. It should not treat a scraped homepage as a substitute for the downloadable tables those pages point to.

### Claim 2 — "USDA still publishes SNAP rules and participation tables on fns.usda.gov"

**Verdict:** The live official host retrieved today is `fna.usda.gov` (Food and Nutrition Administration).
**Evidence:** https://www.fna.usda.gov/pd/supplemental-nutrition-assistance-program-snap — "Latest Available Month - June 2026" for state-level persons, households, and benefits, with PDF and Excel downloads.
**Retrieved:** 2026-10-07 via firecrawl_scrape
**What this changes:** Store the retrieved URL. Older `fns.usda.gov` links may redirect or go stale.

### Claim 3 — "211 aggregate statistics are a public reusable dataset"

**Verdict:** Partly true. A public national summary exists. A reusable open-data file was not found.
**Evidence:** https://www.unitedway.org/the-facts-about-211-2025-impact-snapshot — "In 2025, 211 community resource specialists made 19 million referrals for locally available help, 1 million more than in 2024, based on United Way Worldwide's just-released annual 211 Impact Survey." The page offers a PDF fact sheet, not a licensed open dataset.
**Retrieved:** 2026-10-07 via firecrawl_scrape
**What this changes:** Use the published snapshot and cite it. Do not ingest 211 call-level or aggregate files until a public reuse license is found.

### Claim 4 — "One national page lists every state Medicaid manual, code, IT plan, and auditor report"

**Verdict:** False.
**Evidence:** Medicaid state profiles are a map of state pages (https://www.medicaid.gov/state-overviews/state-profiles). Provider manuals are published by each state; New York's index is https://www.emedny.org/providermanuals/. State codes sit on each legislature's site. NASACT's member directory points at each state auditor (https://www.nasact.org/). NASBO lists proposed and enacted budgets state by state (https://www.nasbo.org/resources/proposed-enacted-budgets).
**Retrieved:** 2026-10-07 via firecrawl_scrape
**What this changes:** Build the platform as a directory of official sources, then fetch a state only when that state is in scope. Do not crawl all 50 states in one pass.
