# Skills installed by Gregory's Awesome Teams

Bob keeps only each skill's `description` in context and loads the body when it
decides the skill applies, so this whole set is cheap to have installed.
Invoke one explicitly with `$<skill-name>`, or type `/skills` to pick from a list.

Two slash commands come with them: `/{{COMMAND_NAME}}` routes an idea into the
right stage of the build, and `/{{IMPROVE_COMMAND}}` rewrites a rough prompt and
shows you what changed.

{{SKILL_TABLE}}

## The main chain

```
$discover-with-firecrawl   gather real evidence about the idea
          ↓
$grill-with-docs           get interviewed until the plan is sharp
          ↓
$to-spec                   turn the settled conversation into a spec
          ↓
$implement-with-tests      build it test-first, to the {{COVERAGE_GATE}}% gate
          ↓
$build-evals               measure the AI parts instead of vibing them
          ↓
$demo-rehearsal            make the {{DEMO_DATE}} demo survive contact
```

Off to the side, reach for these whenever they apply:

- `$wizard` — when the next blocker is a human clicking through a dashboard.
- `$rag-architecture` — when the idea needs retrieval over the team's own data.
- `$harness-tuning` — when Bob itself is the thing behaving badly.

## Attribution

`grill-with-docs` and `wizard` are adaptations of Matt Pocock's skills of the
same names (MIT, © Matt Pocock), rewritten for this course and for Bob's
`SKILL.md` format. See `NOTICE.md` and <https://github.com/mattpocock/skills>.
