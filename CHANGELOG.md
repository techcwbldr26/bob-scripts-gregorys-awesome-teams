# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **An Enterprise Security Safeguards page** in the wiki's Craft section,
  adapted from an article Gregory supplied. Six safeguards to settle before an
  agent is allowed to act, the five layers between a proof of concept and
  production, who owns what, and the question worth asking before any
  deployment. Each safeguard carries a note on what it means in a student's own
  project — the one most likely to bite them is that everything Firecrawl
  returns is untrusted content, and a scraped page can contain instructions.
- **Two animated diagrams for it.** `assets/security-safeguards.svg` walks the
  six safeguards while, underneath, the article's own worked example runs: an
  agent that only needs to summarise email is granted six permissions and the
  five it never needed are struck off until one is left.
  `assets/five-layers.svg` builds the five layers bottom-up and then draws
  governance and security as a band through all of them, because the point of
  the framework is that security is not the fourth step.

### Changed

- **Demo day is now "December 2026"**, not December 1st — the date is not set
  yet. `DEMO_DATE` is the single source, and the build-flow diagram now reads
  from it rather than carrying the date twice as a literal.
- **The Demo Day page opens with Gregory's wording**: teams demo their
  projects, read it as soon as possible, and the goal is enterprise-class,
  production-ready work.

### Added

- **`CHEATSHEET.md` is now installed into the student's own project folder**, not
  only published to the wiki and the repo root. A page a student has to go and
  find is a page they do not read; this one is in the folder they are already
  working in. The installer owns it outright — it is generated from the payload,
  so overwriting it on reinstall is correct — and `verify` reports it like
  everything else the kit installs.

### Added

- **`improve-prompt-kit/` — `improve-prompt` as a complete, portable skill.**
  Students asked whether it was a whole skills kit with its own `AGENTS.md`,
  `SKILL.md`, examples and references, so that it works in any harness or IDE.
  It is now. The kit is markdown and nothing else — no code, no dependencies,
  no network calls — with install notes for Bob, Claude Code, Cursor-style rule
  editors, and a `PROMPT.md` to paste into a chat window with no file support
  at all. A test fails if anything in the skill body ties it to one harness.
- **`$improve-prompt` is now the tenth skill**, not only a slash command. The
  method lives in the skill; the Bob command is a thin entry point that adds the
  project-specific part a portable skill cannot assume. `tools/build-improve-prompt-kit.mjs`
  keeps the three copies in step and a test fails if they drift.
- **`CHEATSHEET.md`** — the commands, the ten skills, the four rules and the
  numbers on one page, generated from `payload/` so it cannot go stale.
  Published to the wiki as `Cheat-Sheet.md` from the same source.
- **`assets/chain.svg`** — an animated strip of the six stages, under the Build
  Flow banner where a plain code fence used to be. The whole chain stays
  visible while a highlight walks it, with one line per stage saying what it is
  for and which skill runs it.

### Fixed

- **`references/evidence.md` hung outside its card** on the published Build Flow
  diagram. Two causes, both fixed: `wrap` treated a path as one unbreakable word,
  and the characters-per-pixel ratio used to size text was a guess. The ratio is
  now measured with `getComputedTextLength` (0.62 for semibold, not the assumed
  0.52 — which is why a string predicted at 110px rendered at 130px in a 109px
  box), `wrap` breaks a long path at `/`, and both diagram generators refuse to
  emit a card whose text does not fit.
- **Card and section heights are now derived from their content** in both the
  Build Flow and skills diagrams, so fixing a horizontal overflow cannot create
  a vertical one, and adding a skill moves the layout instead of being drawn
  over it.

### Changed

- **The skills diagram lays the chain and the situational skills out
  separately** — three wide columns for the six-stage chain, one row of four for
  the rest — so a tenth skill does not leave a ragged hole in a 3-wide grid.
  Every count on it, and in the banner's description, is read from the payload.

### Added

- **`/improve-prompt`** — a second slash command, asked for by a student. Type
  it in front of a rough request and you get back a structured prompt, a table
  of what changed and why, the parts that should move out of the prompt and into
  the harness, and what the result saves in the context window.

  It **rewrites rather than executes**: `/improve-prompt build me a login
  system` returns a better prompt for building a login system, not a login
  system. That distinction is the feature, and a test asserts it.

  It **never invents a requirement**. A prompt with no finish line comes back
  with a visible `[FILL: …]` placeholder rather than a plausible acceptance
  criterion the student would not notice was wrong.

  The section students will not find elsewhere is the third one: if an
  instruction belongs on every turn, it is not a prompt problem. The command
  routes it to `.bob/rules/`, `AGENTS.md`, a skill or `GLOSSARY.md` — paid once
  instead of retyped forever.

  The fourth section is **context engineering, not word count**. A prompt
  carrying the right task and the right file references finishes the work inside
  one tight window; a vague one sends the agent hunting through whole files,
  buys clarification turns that each re-send the conversation, and leaves wrong
  work in the window to be undone. The command names which of those it removed
  and ties the result to the 270,000-token window and the compaction
  threshold.

  Documented on the wiki's Prompt Engineering page, in the README, in
  `docs/student-quickstart.md`, and in `START-HERE.md`.

### Changed

- **`verify` now checks every installed command**, driven by a new `COMMANDS`
  list in `src/constants.mjs` rather than naming one command inline, so adding a
  command cannot leave a check behind. The sample verify output on the wiki's
  Getting Started page was updated to match.
- **`AGENTS.md` gains one line** for the new command. One line is the budget: it
  is paid on every turn, and a test fails if the mention grows beyond that.

### Changed

- **`wiki/Home.md` now matches the live wiki.** The landing page was edited in
  the GitHub wiki UI on 1 October — the December 1st deadline came out of the
  opening sentence and the "The deadline" section was deleted — and that edit
  existed only in the wiki repository. It is now the version in this repo, so
  the two no longer diverge and a publish cannot silently revert it. The
  deadline is still stated on [Demo Day](../wiki/Demo-Day.md), which is where
  the landing page points for it.

### Changed

- **Rewrote the opening of the three engineering pages in the wiki.** Each one
  previously opened with two lines of assertion and went straight into
  mechanics, which told a student what to type but never why any of it works.

  - **Harness Engineering** now opens on Böckeler's framing — *Agent = Model +
    Harness* — and on BCG's five-part operating system (specs, constitution,
    control panel, context hub, quality gates), mapped item by item onto the
    files this kit installs, so the concept and the repository are the same
    table. Adds the guides-versus-sensors diagnostic, BCG's four kinds of
    quality gate, and the maturity ladder from "check everything" to "spot
    check now and then".
  - **Context Engineering** now explains *context rot* and the n² attention
    argument, so students understand that accuracy degrades well before the
    window fills — the single most load-bearing fact on the page and previously
    absent. Adds Anthropic's "smallest possible set of high-signal tokens"
    principle and their four techniques — just-in-time retrieval, structured
    note-taking, compaction and sub-agents — each mapped to something that
    already exists in the project.
  - **Prompt Engineering** now opens on Anthropic's "brilliant but new
    employee" test, then sets the three labs' published guidance side by side —
    both where it converges and where it flatly contradicts itself. OpenAI tell
    you to drop "think step by step" for reasoning models; DeepSeek's R1 model
    card recommends it for maths. The lesson drawn is the kit's own first rule:
    measure it on your task, because advice about a model expires.

  Every quotation is from a primary source, linked inline with its date.

- **`docs/publishing-the-wiki.md` no longer tells you to run `cp wiki/*.md`.**
  That blanket copy silently reverts any page edited in the GitHub wiki UI,
  with no conflict and no warning, because a wiki repository has no pull
  requests and no CI. The procedure now diffs first and copies named pages.

### Changed

- **All three animated SVGs now loop over 70 seconds instead of 35** — the same
  timelines at half speed. 35s suited a narration script but not a reader: each
  beat was gone before the eye had finished the line underneath it. The loop
  length is `CYCLE` in `tools/lib/svg.mjs` and all three share it; because each
  diagram is authored against its own `DESIGN` seconds, the pacing and the
  proportions are untouched. Frames rendered at equivalent points in the story
  are byte-identical to the 35s versions.
- **The two wiki diagrams now carry colour the way the banner does.** The
  palette was already shared and identical, but the new diagrams leant on grey
  where the banner leans on colour: unreached stations faded towards grey, the
  detail panel and the artefact cards had grey hairline borders, the three
  situational skills were the only colourless cards in any of the three images,
  and structural labels sat at `faint` rather than `muted`. Borders now take
  their element's colour, artefact names are set like the banner's feature
  headings, and the situational skills are blue — the banner's colour for the
  standing machinery that is simply there — distinguished by a dashed border
  rather than by having no colour at all.

### Fixed

- **`DESIGN = CYCLE` in the two wiki generators** tied the authored length of a
  diagram to its playback length, so doubling the cycle left the whole back half
  of the loop as empty canvas. The two are now independent, with a comment
  saying why, and a test rejects any diagram whose last keyframe before 100%
  falls below 90%.

### Added

- **Two animated SVG diagrams for the wiki**, in the style of the README banner
  and generated the same way. `assets/build-flow.svg` walks the six stages and,
  for each, the failure it prevents, the file it leaves behind and the signal
  that it worked, with the artefacts accumulating into an inventory for demo
  day. `assets/skills.svg` shows every skill's one-line description beside what
  its body would cost, then the arithmetic behind "nine skills cost almost
  nothing": the descriptions are a sliver, and loading all nine bodies on every
  turn would cost roughly fourteen times as much. Every number in it is measured
  from `payload/skills/` at build time.
- **`tools/lib/svg.mjs`** — the timeline machinery the three diagrams share, so
  the keyframe arithmetic and the reduced-motion still frames live in one place.
- **`npm run build:flow`, `build:skills` and `build:svg`**, alongside the
  existing `build:banner`.

### Changed

- **The README banner now runs over 35 seconds** rather than 24, which is a
  comfortable length to narrate over in a demo video. The timeline is authored
  against design seconds and played back over the cycle, so the pacing is
  unchanged — every frame is the one that used to appear at the proportionally
  equivalent moment.

### Fixed

- **Drawn paths faded out across the whole animation.** The `draw` helper named
  `opacity` only on its closing keyframe, and CSS interpolates a property from
  the element's base value at 0% rather than holding it, so every drawn arrow
  and connector — including the banner's compaction arrow — arrived at its
  finished moment at a few percent opacity. A test now rejects any keyframe set
  that declares a property it does not also declare on the first stop.

### Added

- **A fifteen-page student handbook** in `wiki/`, published to the repository's
  GitHub wiki. Setup, the six-stage build flow, the three engineering
  disciplines, Firecrawl, testing and evals, demo day, troubleshooting, an FAQ,
  and a glossary that defines every term in plain English for students who have
  never used an LLM.
- **`docs/publishing-the-wiki.md`** — the four commands that copy `wiki/` into
  GitHub's separate wiki repository, and why that step is a human one.
- Tests that validate the handbook against the kit: every internal link and
  heading anchor resolves, every page is reachable from the sidebar, and the
  skill names, context numbers and coverage gate it quotes match the payload.

### Added

- **`START-HERE.md`** — a single prompt a student pastes into Bob to set up their
  whole project. It is written for someone who may never have used an AI
  assistant or a terminal: Bob checks the machine, installs Node if needed
  (asking first), fetches the kit into a cache folder rather than the student's
  project, runs the right platform script, puts `.env` out of git *before*
  asking for the key, and verifies. Linked from the top of the README.
- The prompt validates the Firecrawl key **without reading `.env`**, using a
  `grep -q` that answers present or missing and shows nothing else, so the key
  never enters the model's context. Storing it stays a command the student types.

### Added

- **An animated README banner** (`assets/banner.svg`). It animates the course's
  context-window diagram in three acts: a session filling the window past the
  190k compaction threshold, compaction collapsing the older turns into one
  summary, and what this kit installs to avoid getting there. It uses the
  palette sampled from the original diagram, carries a `prefers-reduced-motion`
  still frame rather than simply freezing, and contains no script, no network
  reference and no external font.
- **`npm run build:banner`**. The banner is generated by `tools/build-banner.mjs`
  because the whole thing is one 24-second CSS timeline and the keyframe
  percentages have to be computed. The skill count, rule count and coverage gate
  are read from the payload, so the banner cannot quote a stale number, and a
  test fails if the committed SVG drifts from its generator.

## [1.0.0] - 2026-10-01

First release: the full kit, installable on all four target platforms.

### Added

- **Four setup scripts** — `install-macos-intel.sh`,
  `install-macos-apple-silicon.sh`, `install-linux.sh` and
  `install-windows.ps1`. Each asserts its own platform and names the right
  script when run on the wrong machine, including detecting a Rosetta shell on
  Apple silicon. All four delegate to one Node installer, so behaviour is
  identical everywhere.
- **`/gregorys-awesome-teams` slash command** that orients itself against the
  project's current state and routes the team to the right stage.
- **`AGENTS.md`** and **`SKILLS.md`**, written through a managed block so a
  student's own content survives every re-run.
- **Nine skills** in `.bob/skills/`: `discover-with-firecrawl`,
  `grill-with-docs`, `to-spec`, `implement-with-tests`, `build-evals`,
  `demo-rehearsal`, `wizard`, `rag-architecture`, `harness-tuning`.
- **Four always-on rules** in `.bob/rules/`: evidence over memory, context
  discipline, finish the work, tests and coverage.
- **Firecrawl MCP configuration** merged into `.bob/mcp.json` in four modes —
  `hosted`, `oauth`, `keyless` and `local`. Read-only tools are auto-approved;
  credit-heavy and state-changing tools stay behind a prompt.
- **`examples/`** — a prompt comparison, a filled-in ADR, a spec with assertable
  acceptance criteria, an eval case with its grader and a real result, a
  Firecrawl tool-routing table, and a working `wizard-template.sh`.
- **`references/`** — the flow's rationale, prompt engineering, context
  engineering, harness engineering, the Firecrawl playbook, evals and
  hillclimbing, and an `evidence.md` for the team to fill in.
- **`--verify` doctor** that checks each of Bob's documented silent-failure
  modes: an invalid skill folder name, missing front matter, a name that does not
  match its folder, and an MCP server Bob cannot start.
- **243 tests** with the coverage gate set at 90% lines, branches and functions,
  using Node's own test runner and no npm dependencies.
- **CI** across Ubuntu, macOS and Windows on Node 20 and 24: the suite with the
  coverage gate, shellcheck, PowerShell parsing and PSScriptAnalyzer, payload
  validation, a CRLF guard on the shell scripts, and a real run of each
  platform's script twice to prove idempotence.
- **`.gitattributes`** pinning shell scripts to LF. A CRLF checkout breaks them
  at the shebang, which is exactly what a Windows student running them under
  WSL or Git Bash would hit.

### Notes

- The installer needs Node 20 or later; **Bob Shell itself needs Node 24 or
  later**, and the scripts warn separately about each.
- `.bob/mcp.json` carries `type`, `url` *and* `httpURL` for the remote server,
  because Bob's IDE and Shell documentation disagree on the spelling. Writing all
  three satisfies either reader.
- API keys are referenced as `${FIRECRAWL_API_KEY}` and resolved from Bob's
  encrypted store, so the config file is safe to commit.
- `grill-with-docs` and `wizard` are adaptations of Matt Pocock's skills of the
  same names (MIT). See `NOTICE.md`.

[Unreleased]: https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/releases/tag/v1.0.0
