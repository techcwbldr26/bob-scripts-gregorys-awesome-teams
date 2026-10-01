# Notices and attribution

This project is MIT licensed. It also adapts and builds on work by others.

## Matt Pocock's skills

Two installed skills are adaptations of skills from
<https://github.com/mattpocock/skills> (MIT, © Matt Pocock):

| This kit's skill | Adapted from |
| --- | --- |
| `payload/skills/grill-with-docs/SKILL.md` | `grill-with-docs` |
| `payload/skills/wizard/SKILL.md` | `wizard` |

**What was kept.** The methodology: the one-question-at-a-time interview with a
recommended answer for each question, the rule that a question the codebase can
answer is answered by reading the codebase, the three-gate test for whether a
decision earns an ADR, the discipline of writing terms to a glossary as they
resolve; and for `wizard`, scope-by-reading-the-repo, confirm the stage list
before writing a line, one stage per screen, open the URL before asking for its
value, hidden entry for secrets, idempotent `.env` upserts, degrade rather than
fail when `gh` is missing, and verify statically because the agent must never run
the script it wrote.

**What changed.** Both were rewritten for Bob's `SKILL.md` format and front
matter, retargeted at a university team heading for a fixed demo date, and wired
into this kit's own chain (`$to-spec`, `$implement-with-tests`, the Firecrawl
rules, `examples/wizard-template.sh`). Matt's originals delegate to further
skills — `grilling`, `domain-modeling` — which this kit does not install, so the
relevant discipline is inlined instead. The originals are better if you want the
full set; install them with:

```
npx skills@latest add mattpocock/skills
```

Documentation that informed the adaptations:

- <https://www.aihero.dev/skills-grill-with-docs>
- <https://www.aihero.dev/skills-wizard>

## IBM Bob

Bob is IBM's product. This project is an independent teaching kit and is not
affiliated with or endorsed by IBM. Every path, file format and limit the
installer depends on is cited in `src/constants.mjs` with the documentation page
it came from, so it can be re-checked when Bob changes.

Primary sources used:

- <https://bob.ibm.com/docs/ide/features/skills>
- <https://bob.ibm.com/docs/ide/features/slash-commands>
- <https://bob.ibm.com/docs/ide/configuration/rules>
- <https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob>
- <https://bob.ibm.com/docs/shell/configuration/mcp/mcp-bobshell>
- <https://bob.ibm.com/docs/ide/core-concepts/context-window-management>
- <https://bob.ibm.com/docs/shell/core-concepts/tools>
- <https://bob.ibm.com/docs/shell/getting-started/install-and-setup>

## Firecrawl

Firecrawl is a product of Firecrawl (<https://www.firecrawl.dev>). This project
configures it as an MCP server and does not redistribute any part of it.

- <https://docs.firecrawl.dev/mcp-server>
- <https://docs.firecrawl.dev/mcp-server/tools>
- <https://www.firecrawl.dev/alexandria>
- <https://www.firecrawl.dev/pricing>

## Practices adopted from published guidance

The `$build-evals` skill and `references/evals-and-hillclimbing.md` follow the
eval-design and hillclimbing method described in Anthropic's published guidance
on automating eval design, including the four properties of a good eval,
adversarial case sampling, the train/test split against overfitting, and the
one-change-per-round keep/revert loop. The prompting guidance in
`references/prompt-engineering.md` follows published advice on getting the most
out of current frontier models.

Figures quoted in those files are illustrative of the method and were current
when written. Re-check them rather than citing them as present-day fact.
