---
name: wizard
description: Generate an interactive setup script that walks a human through a manual procedure the agent cannot do itself. Use when the next blocker is a dashboard a person must click through, an API key only they can mint, a one-off migration, or steps that would otherwise be written into a README.
---

Adapted from Matt Pocock's `wizard` (MIT, © Matt Pocock).
See <https://github.com/mattpocock/skills>.

You write the script. **You never run it.** The human runs it on their own
machine, which is why their credentials never enter this conversation.

A wizard is not a list of instructions. It is a program that drives the
procedure and holds the state. The human's job is to click, paste, and press
Enter.

## Step 1 — Scope by reading the repo, not by asking cold

Before writing a line, find every value the wizard must produce. Read:

- `.env`, `.env.example`, and any `.env.*`
- `docker-compose*`, and framework config files
- every `secrets.*` and `vars.*` reference in `.github/workflows/`
- `.bob/mcp.json` for servers that need a key

Each reference is a value the wizard has to produce. A value already present in
`.env` still gets a stage, because the wizard offers it back as the default.

## Step 2 — Show the stage list and wait

A **stage** is one focused task on one screen. Present the ordered list with the
values each stage produces, and **get confirmation before any script exists.**

Then, for each stage, decide where its value lands:

| Destination | When |
| --- | --- |
| `.env` only | Local dev needs it, CI does not |
| GitHub secret | CI reads it, and it is sensitive |
| GitHub variable | CI reads it, and it is public |
| Both `.env` and a secret | Local dev and CI both need it |
| Nowhere | The stage is a pure action — a toggle flipped, a plan upgraded |

## Step 3 — Map each stage to the exact click path

Not "get your API key" but "Dashboard → Developers → API keys → Reveal test key
→ Copy". Where you do not know the current UI, **look it up with
`firecrawl_scrape` on the provider's docs, or ask.** Never invent clicks; a
wrong path is worse than no path because it destroys trust in the rest.

## Step 4 — Write the script against these rules

Author stages in dependency order and set `TOTAL_STAGES` at the top. The script
must:

- Clear the screen between stages, so each stage fits one screen. Anything that
  overflows is lost.
- Show progress: `Stage 3 of 7`.
- **Open the URL before asking for the value from that page.** Never ask a human
  to paste something you have not sent them to fetch. Handle macOS (`open`),
  Linux (`xdg-open`) and WSL (`wslview` or `explorer.exe`).
- Read secrets with hidden entry (`read -rs`). Nothing sensitive in scrollback.
- Upsert into `.env` idempotently — replace the line if the key exists, append if
  not. Never duplicate a key.
- Offer any existing value back as the default, so Ctrl-C and re-run is cheap.
- Gate anything irreversible behind an explicit typed confirmation.
- Degrade, never fail: if `gh` is missing or unauthenticated, that stage becomes
  a warning and the value goes in the closing summary for the human to set by
  hand.
- End with two separate lists: **what it wrote**, and **what it could not do and
  you must finish yourself.**

Start from `examples/wizard-template.sh`, which implements all of the above.
Everything above the `# --- STAGES ---` marker is a fixed library: copy it
unchanged. Your work is scoping and stage authoring. The consistency is the point.

## Step 5 — Verify statically

You cannot run it: it opens browsers and blocks on human input. Instead:

- `bash -n <script>` — syntax.
- `shellcheck <script>` where available.
- Trace every captured value to the destination scoping promised.
- Confirm every secret name the script sets matches a real `secrets.*` reference
  in the workflows.

Tell the human plainly: the first run is theirs, and that run is the test.

## Step 6 — Say where it should live

| Situation | What to do with it |
| --- | --- |
| One-off migration, personal setup, a transition that happens once | Save to `scripts/`, run it, delete it |
| A path the next person on the team will also need | Commit it and link it from the README |

## It's working if

- The human saw the ordered stage list and confirmed it before any script existed.
- Every URL is opened before its value is requested.
- Secrets are typed blind.
- Each stage fits one screen.
- Ctrl-C and re-run resumes, offering saved values as defaults.
- The final screen separates what was written from what is left to do by hand.
