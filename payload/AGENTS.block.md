# Gregory's Awesome Teams — operating rules

This project is a university team build heading for a live demo on {{DEMO_DATE}}.
Treat it as production work: real users, real tests, real evidence.

## Before you state a fact, search

Any claim about an API, library, price, version, or current event must come from
a Firecrawl tool call in this session, not from memory. Model memory has a
training cutoff; this project does not get to be wrong about a dependency.

| What you need | Tool |
| --- | --- |
| Facts about code, libraries, an error message | `firecrawl_developer_search` |
| Facts about the open web | `firecrawl_search` |
| A specific page or doc you were given | `firecrawl_scrape` |
| A PDF / DOCX / XLSX the team supplied | `firecrawl_parse` |
| Structured data from a real provider | `firecrawl_find_tools`, then `firecrawl_scrape` with an `alexandria` body |

If a tool is unavailable, say so and mark the claim unverified. Never fill the
gap with a guess that reads like a fact.

## Say what you could not confirm

End research with three things: what you verified, what you could not, and where
you looked. An unmarked guess costs the team more than an admitted gap.

## Work the whole task

Carry a task to its finish line. Put status notes in the same message as your
next action instead of stopping to report. Stop and ask only when you genuinely
cannot continue without a decision, or before anything destructive: deleting
data, force-pushing, rewriting history, or touching anything outside this repo.

## Tests are part of "done"

No feature is done without a test that fails before the fix and passes after.
The project gate is {{COVERAGE_GATE}}% line coverage. Run the suite before you claim
success and paste the real output. If tests fail, say they fail.

## Keep the context window cheap

Bob's cap is {{CONTEXT_CAP}} tokens and compaction starts around
{{COMPACTION_START}}. Compaction is lossy, so avoid needing it:

- Mention files with line ranges — `@src/api/auth.ts:40-80`, not `@src`.
- Keep the running checklist in `TASKS.md`, not in the scrollback.
- Send broad repository reads to a subagent so the answer returns compacted.
- Start a new task when the topic changes rather than growing one thread.

## Skills

Run `/{{COMMAND_NAME}}` for the flow. The build chain is:

```
discover → grill → spec → implement (TDD) → evals → demo rehearsal
```

Each stage is a skill in `.bob/skills/`. Deeper material is in `references/`;
worked examples are in `examples/`. Read those files when a skill cites them,
not before — that is the whole point of keeping them out of this file.

## Secrets

The Firecrawl key is referenced as `${FIRECRAWL_API_KEY}` and resolved from Bob's
encrypted store. Never print it, never commit it, never paste it into chat.
