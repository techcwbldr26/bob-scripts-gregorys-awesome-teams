# Firecrawl playbook

## Why this instead of a built-in search tool

A built-in web search usually returns links plus a short summary. If the agent
needs the actual content it must then fetch each page — so one question becomes
five searches and five fetches, and takes a couple of minutes.

Firecrawl's search results **carry the page content as markdown**, so the same
question typically resolves in fewer calls and less time. Three further things it
does that a plain fetch does not:

- **Runs a real browser**, so JavaScript-heavy and dynamically-rendered pages work
  instead of returning an empty shell.
- **Has purpose-built indexes** — a developer index over GitHub issues, merged
  PRs, READMEs and documentation; a research index over paper abstracts.
- **Reaches structured providers** through Alexandria, returning typed records
  with a contract rather than numbers read off a rendering.

## The tools

| Tool | Use it when | Notes |
| --- | --- | --- |
| `firecrawl_search` | You have a query, not a URL | Content included. `categories: ["developer"]` or `["research"]` to narrow |
| `firecrawl_developer_search` | A programming question | Returns matched passages from issues, PRs, READMEs, docs. `skills: "only"` narrows to agent-skill files |
| `firecrawl_scrape` | You know the URL | `formats`: markdown, html, links, screenshot, summary, branding, json |
| `firecrawl_map` | You need to discover a site's URLs | Do this before crawling — it is how you avoid a blind, expensive crawl |
| `firecrawl_crawl` | You must traverse a section | Credit-heavy. Set limits. `firecrawl_check_crawl_status` resumes |
| `firecrawl_parse` | A PDF, DOCX, XLSX, HTML file | Clean markdown, tables preserved, OCR on images with text |
| `firecrawl_interact` | Clicks, forms, login, multi-page flows | Gives a live browser link so a human signs in; credentials never reach the agent |
| `firecrawl_agent` | Multi-source research, pages unknown | Asynchronous — poll `firecrawl_agent_status` |
| `firecrawl_research_*` | Academic and clinical literature | Search, read passages, follow citations |
| `firecrawl_find_tools` | You need real structured data | Free discovery over the Alexandria catalogue |
| `firecrawl_monitor_*` | Track a page over time | Diffs plus email or webhook |

## Structured extraction without reading prose

When you want fields rather than a page, ask for them:

```json
{
  "url": "https://example.com/pricing",
  "formats": ["json"],
  "jsonOptions": {
    "prompt": "Extract each plan with its monthly price and included credits",
    "schema": {
      "type": "object",
      "properties": {
        "plans": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "monthlyPriceUsd": { "type": "number" },
              "credits": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

Reliable, and it does not depend on the agent reading a table correctly. It costs
more credits per page, so use it when you want data, not when you want to read.

## Alexandria

A catalogue of **providers** (data sources: official APIs, registries, licensed
publishers, Firecrawl's own indexes) each exposing **capabilities** (one callable
operation with defined inputs, outputs and price). Addressed as
`<provider>/<capability>`.

At the time of writing: 93 providers, 640 capabilities, 20 categories, and over
113 million indexed sources. Check the live numbers rather than quoting these.

Three steps:

1. `firecrawl_find_tools` with a description of the data you need. **Free.**
2. Read the contract — required inputs, `requiresOneOf` groups, pagination,
   response shape. **Free.**
3. `firecrawl_scrape` with an `alexandria` body `{provider, capability, options}`
   and **no** `url`. **Billed** at the capability's listed price.

The three mistakes that waste a session:

- **Treating a match as data.** Discovery returns a description of what *could* be
  fetched. Nothing has been fetched yet.
- **Trusting the outer success flag.** Check each entry of `data.alexandria[]` for
  its own error; the call can succeed while one capability failed.
- **A terms error read as a bug.** `THIRD_PARTY_DATA_TERMS_REQUIRED` means an
  organisation admin must accept the provider's terms at the URL given in
  `requiresAction`. Requesting data does not accept terms on anyone's behalf.

Alexandria needs an API key on a team with Alexandria access. The keyless tier
does not include it — which is one of the reasons to mint the free key.

## Credits, and spending them well

The free tier is **1,000 credits a month**, no credit card, refreshed monthly.
Connecting social accounts adds more. Roughly:

| Operation | Cost |
| --- | --- |
| Basic scrape, crawl or map | 1 credit per page |
| Search | 2 credits per 10 results |
| `json`, question or highlight formats | +4 credits per page |
| Interact | 2 credits per browser minute |
| Monitor | 1 credit per page per check |
| Research-index paper lookups | Free |
| Alexandria discovery | Free |

Habits that keep a team inside the free tier for a whole semester:

- `map` before `crawl`, and always set a limit.
- Ask for markdown unless you specifically need structured fields.
- Use the research index freely — it costs nothing.
- Do discovery generously; it is free. Pay only on execution.
- Do not re-scrape a page you already have. Save it to `references/`.

Verified against <https://www.firecrawl.dev/pricing> on 2026-10-01. Prices move —
check the page rather than trusting this table.

## Getting a key

1. <https://www.firecrawl.dev/signup> — GitHub sign-in is quickest.
2. Connect social accounts for the bonus credits.
3. Dashboard → API Keys → Create. Keys start with `fc-`.
4. Store it in Bob's encrypted store, never in a file:
   `/manage-secrets set FIRECRAWL_API_KEY fc-your-key`

## Login-walled pages, safely

For a site that needs an account, `firecrawl_interact` can hand you a link to a
remote browser. **You** sign in there; the session is saved as a named profile and
reused on later scrapes. The agent never sees the password. Use this rather than
pasting credentials into chat — a key pasted while scoping is in the context like
any other text.
