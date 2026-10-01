# Firecrawl setup

## Why the kit uses it

Bob's built-in search returns links and a summary, so when it needs the actual
content it has to fetch each page — one question becomes ten tool calls.
Firecrawl's search results carry page content as markdown, and it adds three
things a plain fetch cannot do:

- **A real browser.** JavaScript-heavy and dynamically-rendered pages return
  content instead of an empty shell.
- **Purpose-built indexes.** A developer index over GitHub issues, merged PRs,
  READMEs and docs; a research index over paper abstracts.
- **Alexandria.** A catalogue of data providers returning typed records against a
  published contract — so a number in your demo is real, not plausible.

## Getting a key

1. <https://www.firecrawl.dev/signup> — GitHub sign-in is quickest.
2. Connect your social accounts for the bonus credits.
3. **Dashboard → API Keys → Create API Key → Copy.**

Keys start with `fc-`.

**Free tier:** 1,000 credits a month, refreshed monthly, no credit card.
Current numbers are at <https://www.firecrawl.dev/pricing> — check there rather
than trusting this page.

## Storing it

Store the key in Bob's encrypted store, never in a file:

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
/manage-secrets list
/manage-secrets rm FIRECRAWL_API_KEY
```

`.bob/mcp.json` only ever contains `${FIRECRAWL_API_KEY}`, which Bob expands at
runtime. That is what makes the file safe to commit and safe to share with your
team — each person sets their own key.

**Never** paste the key into a chat message. The installer and the generated
wizard scripts are built so you do not have to.

## Checking the connection

```
/mcp
```

`firecrawl` should be connected. If it is not:

| Problem | Fix |
| --- | --- |
| Not listed at all | Restart Bob; confirm `.bob/mcp.json` exists |
| `401` | Credential, not config. `/manage-secrets list`, re-set the key |
| Some tools missing | You are on keyless, or team policy limits them |
| Listed but failing | Check the URL in `.bob/mcp.json` is `/v2/mcp` |

## The four modes

```bash
./scripts/install-linux.sh --mode hosted    # default
```

| Mode | Key needed | Tools | Use it when |
| --- | --- | --- | --- |
| `hosted` | Yes, in Bob's store | Full surface | The normal choice |
| `oauth` | No — browser sign-in | Full surface | You would rather not handle a key at all |
| `keyless` | No | Search, scrape, parse only. Rate limited. **No Alexandria** | Trying it out in five minutes |
| `local` | Yes | Runs the open-source server via `npx` | You want the server on your own machine |

Start with `hosted`. Keyless is fine for a first look but excludes Alexandria,
which is one of the main reasons the kit uses Firecrawl at all.

## Spending credits well

| Operation | Cost |
| --- | --- |
| Basic scrape, crawl, map | 1 credit per page |
| Search | 2 credits per 10 results |
| `json`, question or highlight formats | +4 credits per page |
| Interact | 2 credits per browser minute |
| Monitor | 1 credit per page per check |
| Research-index paper lookups | **Free** |
| Alexandria discovery | **Free** |

Habits that keep a team inside the free tier for a whole semester:

- **`map` before `crawl`**, and always set a limit. An unbounded crawl of a
  documentation site is how a team burns a month's credits in an afternoon.
- **Ask for markdown** unless you specifically need structured fields.
- **Use the research index freely** — it costs nothing.
- **Discover generously.** Alexandria discovery is free; you pay on execution.
- **Do not re-scrape** a page you already have. Save it under `references/`.

## Alexandria in three steps

1. `firecrawl_find_tools` with a description of the data you need. Free.
2. Read the capability's contract — inputs, required groups, response shape. Free.
3. `firecrawl_scrape` with an `alexandria` body `{provider, capability, options}`
   and **no** `url`. Billed at the listed price.

Three mistakes that waste a session:

- **Treating a match as data.** Discovery returns a description of what *could*
  be fetched. Nothing has been fetched yet.
- **Trusting the outer success flag.** Check each entry of `data.alexandria[]`
  for its own error — the call can succeed while one capability failed.
- **Reading a terms error as a bug.** `THIRD_PARTY_DATA_TERMS_REQUIRED` means an
  organisation admin must accept the provider's terms at the URL in
  `requiresAction`. Requesting data does not accept terms for anyone.

## Pages behind a login

Use `firecrawl_interact`. It gives you a link to a remote browser; **you** sign
in there, and the session is saved as a named profile for later scrapes. Your
password never reaches the agent, and never enters the context window.

## Which tool for which job

Installed at `references/firecrawl-playbook.md`, with a twelve-row routing table
at `examples/firecrawl-queries.md`. The short version:

| You have | Use |
| --- | --- |
| A coding question | `firecrawl_developer_search` |
| A web question | `firecrawl_search` |
| A URL | `firecrawl_scrape` |
| A PDF, DOCX or spreadsheet | `firecrawl_parse` |
| A need for real numbers | `firecrawl_find_tools`, then an `alexandria` execution |
