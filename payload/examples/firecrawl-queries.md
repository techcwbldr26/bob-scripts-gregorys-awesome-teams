# Choosing the right Firecrawl tool

Twelve real questions from past projects, with the tool that answers each and the
reason. Picking the wrong tool is the usual cause of a slow, vague answer.

| # | The question | Tool | Why |
| --- | --- | --- | --- |
| 1 | "Why does our MCP server hang after about 50 tool calls?" | `firecrawl_developer_search` | The answer lives in a GitHub issue or a merged PR. The developer index covers issues, PRs, READMEs and docs, so one call usually returns the fix. |
| 2 | "What is the current free-tier limit for <service>?" | `firecrawl_search` | Prices and limits move. Search returns page content as markdown, so no second fetch is needed. |
| 3 | "Read this pricing page the lecturer sent." | `firecrawl_scrape` | A known URL. Runs a real browser, so a JavaScript-rendered pricing table works. |
| 4 | "Pull the requirements out of this 60-page PDF brief." | `firecrawl_parse` | Clean markdown with tables intact and OCR on images that carry text. |
| 5 | "Is there published evidence that spaced repetition helps retention?" | `firecrawl_research_search_papers` | Searches paper abstracts across PubMed, bioRxiv, medRxiv and arXiv. |
| 6 | "Get the exact fields this API returns, as JSON." | `firecrawl_scrape` with `formats: ["json"]` and a schema | Returns data matching your schema instead of prose you then have to parse. |
| 7 | "What pages does this documentation site have?" | `firecrawl_map` | Discovers URLs first, so you choose what to read rather than crawling blindly. |
| 8 | "Read the whole docs section for this framework." | `firecrawl_crawl` | Traverses a section. Credit-heavy — set a limit, and map first. |
| 9 | "Our competitor's data is behind a login we have an account for." | `firecrawl_interact` | Gives a live browser link so a human signs in; the session is saved as a profile. Credentials never reach the agent. |
| 10 | "Tell us when their pricing page changes." | `firecrawl_monitor_create` | Recurring checks with diffs, plus email or webhook. Set it once. |
| 11 | "Real flight prices London to Cape Town for the itinerary feature." | `firecrawl_find_tools`, then `firecrawl_scrape` with an `alexandria` body | A typed provider capability returns bookable, current data. Scraping a travel site gives numbers that look right and are not. |
| 12 | "Which providers exist for UK company filings?" | `firecrawl_find_tools` | Discovery is free. Browse the catalogue before committing to an approach. |

## The two mistakes that cost the most

**Scraping a page for a number that a provider publishes.** A scraped price is a
snapshot of a rendering; a provider capability returns the value with a contract.
If a number goes in front of an audience, get it from Alexandria.

**Treating a tool match as data.** `firecrawl_find_tools` returns *capabilities* —
descriptions of what could be fetched. You still have to execute one with
`firecrawl_scrape` and an `alexandria` body. And when you do, check each entry in
`data.alexandria[]` for its own error: the outer call can succeed while an
individual capability failed.

## Budget notes

The free tier is 1,000 credits a month, no card required, refreshed monthly.
Roughly: a basic scrape or map is 1 credit per page; search is 2 credits per 10
results; `json` output adds 4 credits per page. Research-index paper lookups are
free. Discovery in Alexandria is free; executing a capability is billed at its
listed price.

So: `map` before `crawl`, set limits, and do not ask for `json` formatting when
markdown would do. Verified against <https://www.firecrawl.dev/pricing> on
2026-10-01 — check it again rather than trusting this paragraph.
