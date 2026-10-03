# Cheat sheet

One page. Everything you type, and everything that can run.
Generated from the kit itself — if it is on this page, it is installed.

**10 skills · 2 commands · 4 always-on rules · demo day December 2026**

---

## Commands

Type these in Bob. A command does nothing until you invoke it, so having both
costs you nothing.

| Command | What it does | Example |
| --- | --- | --- |
| `/gregorys-awesome-teams` | Start or continue a build. Routes your idea into the right stage. | `/gregorys-awesome-teams I want to build <your idea>` |
| `/improve-prompt` | Rewrite a rough prompt and show what changed. Does not run the task. | `/improve-prompt make the search better` |

> `/improve-prompt` **rewrites, it does not execute.**
> `/improve-prompt build me a login system` returns a better prompt for
> building a login system — not a login system. If it leaves a `[FILL: …]` blank,
> that is it refusing to invent your acceptance criteria.

---

## The build chain

```
discover → grill → spec → implement → evals → demo rehearsal
```

Each stage stops one expensive failure and makes the next one cheaper. Going
backwards is the process working.

| Skill | What it does | Reach for it when |
| --- | --- | --- |
| `$discover-with-firecrawl` | Gather verified real-world evidence about a product or service idea before designing it. | at the start of a project, when the user supplies links, PDFs or docs, when a market, competitor, pricing, regulation or API claim needs checking, or whenever a factual claim would otherwise come from model memory |
| `$grill-with-docs` | Interview the team relentlessly about their plan until there is one shared understanding, recording settled vocabulary in GLOSSARY.md and genuinely hard decisions as ADRs. | a plan is still fuzzy, before writing a spec, or when the team and the agent are using the same word for different things |
| `$to-spec` | Turn a settled design conversation into a written specification with acceptance criteria, without re-interviewing the team. | after a grilling session, or when a plan exists in chat but nothing is written down that someone could build or test from |
| `$implement-with-tests` | Build a feature test-first and carry it to the project's 90 percent coverage gate. | implementing anything from a spec or ticket, when tests are missing for existing code, or when a change needs to be proven rather than asserted |
| `$build-evals` | Design an evaluation set and grader for the AI part of the product, then improve against it one change at a time. | the project uses an LLM, RAG, classification or generation, and the team needs to prove it works rather than claim it does |
| `$demo-rehearsal` | Harden a project for a live demo in front of an audience and rehearse the failure modes. | in the weeks before the presentation deadline, when preparing a walkthrough, or when the team needs to know what will break on stage |

---

## The ones you reach for when they apply

Not part of the chain. Use them the moment they are relevant.

| Skill | What it does | Reach for it when |
| --- | --- | --- |
| `$harness-tuning` | Diagnose and fix the Bob harness itself when it behaves badly — ignoring rules, forgetting context, stopping early, burning Bobcoins, or failing to load skills and MCP tools. | the problem is the agent's setup rather than the project's code |
| `$improve-prompt` | Rewrite a rough prompt into a well-structured one and show what changed, so the person learns the shape rather than just receiving a better prompt. | someone asks to improve, fix, sharpen or "prompt engineer" a request, or pastes a prompt and asks what is wrong with it |
| `$rag-architecture` | Design retrieval-augmented generation over the team's own documents or data, and make it measurable. | the product answers questions from a corpus, needs citations, or when "we will use RAG" has not yet been turned into chunking, retrieval and evaluation decisions |
| `$wizard` | Generate an interactive setup script that walks a human through a manual procedure the agent cannot do itself. | the next blocker is a dashboard a person must click through, an API key only they can mint, a one-off migration, or steps that would otherwise be written into a README |

---

## The 4 always-on rules

These are not skills. They load on **every** turn, which is why they are short.

| Rule | What it enforces |
| --- | --- |
| `00-evidence-over-memory` | A factual claim needs a source retrieved this session |
| `10-context-discipline` | Line ranges, `TASKS.md`, subagents for wide reads |
| `20-finish-the-work` | Keep going when no decision is needed; stop before anything destructive |
| `30-tests-and-coverage` | Test first, watch it fail, never reach the gate by deleting assertions |

---

## Numbers worth knowing

| | |
| --- | --- |
| Context window | **270,000** tokens |
| Compaction starts around | **190,000** tokens |
| Reserved for the reply | about 20,000, not counted in the used total |
| Coverage gate | **90%** lines |
| Demo day | **December 2026** |

Compaction is lossy: it summarises away decisions you made early. The goal is
not to survive it — it is to never need it.

---

## If something is wrong

| Symptom | First thing to check |
| --- | --- |
| A skill never fires | Folder name must be lowercase-kebab-case and match `name:` in its front matter, or Bob skips it silently |
| Bob forgot what you agreed | Context, not the model. Put decisions in a file, not in the scrollback |
| Bob ignores an instruction you keep repeating | It belongs in `AGENTS.md` or a rule, not in every prompt. Ask `/improve-prompt` where to put it |
| You do not know how to word a request | `/improve-prompt` followed by your rough wording |
| You do not know what to do next | `/gregorys-awesome-teams` with no argument tells you where you are |

To re-check the installation, run the setup script for your machine again with
the verify flag — the same script you installed with, from wherever you cloned
the kit:

```bash
<kit>/scripts/install-linux.sh --target "$(pwd)" --verify     # or -macos-intel / -macos-apple-silicon
```

```powershell
<kit>\scripts\install-windows.ps1 -Target "$PWD" -Verify
```

Every line should say `ok`.
