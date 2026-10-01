# Firecrawl

How your agent sees the real world instead of guessing from memory.

---

## Why this instead of the built-in search

A built-in web search returns links and a summary. If the agent needs the actual
content, it then has to fetch each page — so one question becomes ten tool calls
and takes a couple of minutes.

Firecrawl's **search results carry the page content as markdown**, so the same
question usually resolves in fewer calls. Three more things it does that a plain
fetch cannot:

- **Runs a real browser**, so JavaScript-heavy pages return content instead of an
  empty shell.
- **Purpose-built indexes** over GitHub issues, merged PRs, READMEs and docs, and
  over research paper abstracts.
- **Alexandria** — a catalogue of real data providers returning typed records
  against a published contract, so a number in your demo is real rather than
  plausible.

---

## Getting your key

1. <https://www.firecrawl.dev/signup> — GitHub sign-in is quickest
2. **Connect your social accounts** on the dashboard for bonus credits
3. **Dashboard → API Keys → Create API Key → Copy**

Keys start with `fc-`. Free tier: **1,000 credits a month**, refreshed monthly,
no credit card.

### Keeping your key safe

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
```

Bob stores it encrypted. `.bob/mcp.json` only ever contains
`${FIRECRAWL_API_KEY}`, which is what makes that file safe to commit.

**Never paste your key into a chat message**, including to Bob. The setup prompt
checks that your key is in `.env` using a command that answers yes or no and
prints nothing else — so the key never enters the model's context. Copy that
habit for every credential you handle this semester.

---

## Which tool for which job

| You have | Use | Why |
| --- | --- | --- |
| A programming question | `firecrawl_developer_search` | Searches issues, merged PRs, READMEs, docs — primary sources |
| A question about the open web | `firecrawl_search` | Results carry page content, so no second fetch |
| A URL someone gave you | `firecrawl_scrape` | Real browser, so dynamic pages work |
| A PDF, Word file or spreadsheet | `firecrawl_parse` | Clean markdown, tables intact, OCR on images |
| An academic question | `firecrawl_research_search_papers` | PubMed, bioRxiv, medRxiv, arXiv abstracts |
| A need for real, current numbers | `firecrawl_find_tools`, then `firecrawl_scrape` with an `alexandria` body | Typed records from a named provider |
| To discover a site's pages | `firecrawl_map` | Do this **before** crawling |
| A login-walled page | `firecrawl_interact` | Gives you a browser link; you sign in, the agent never sees the password |

---

## Alexandria in three steps

1. `firecrawl_find_tools` with a description of the data you need. **Free.**
2. Read the capability's contract — inputs, response shape. **Free.**
3. `firecrawl_scrape` with an `alexandria` body `{provider, capability, options}`
   and **no** `url`. **Billed** at the listed price.

### Three mistakes that waste a session

- **Treating a match as data.** Discovery returns a *description* of what could be
  fetched. Nothing has been fetched yet.
- **Trusting the outer success flag.** Check each entry of `data.alexandria[]` for
  its own error — the call can succeed while one capability failed.
- **Reading a terms error as a bug.** `THIRD_PARTY_DATA_TERMS_REQUIRED` means an
  admin must accept that provider's terms. Requesting data does not accept terms.

Alexandria needs an API key. The keyless tier does not include it — one of the
main reasons to mint the free key.

---

## Making 1,000 credits last a semester

| Operation | Cost |
| --- | --- |
| Basic scrape, crawl or map | 1 credit per page |
| Search | 2 credits per 10 results |
| `json` / question / highlight formats | +4 credits per page |
| Interact | 2 credits per browser minute |
| Research-index paper lookups | **Free** |
| Alexandria discovery | **Free** |

Habits that keep a team inside the free tier:

- **`map` before `crawl`**, always with a limit. An unbounded crawl of a docs site
  is how a team burns a month of credits in an afternoon.
- **Ask for markdown** unless you specifically need structured fields.
- **Use the research index freely** — it costs nothing.
- **Discover generously.** Alexandria discovery is free; you pay on execution.
- **Do not re-scrape** a page you already have. Save it under `references/`.

Prices change — check <https://www.firecrawl.dev/pricing> rather than trusting
this table.

---

## The two mistakes that cost the most

**Scraping a page for a number a provider publishes.** A scraped price is a
snapshot of a rendering. If a number goes in front of an audience, get it from
Alexandria.

**Not checking the date.** A price verified in September is not verified in
November. Every claim in `references/evidence.md` carries a retrieval date for
exactly this reason.
