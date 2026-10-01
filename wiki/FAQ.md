# FAQ

---

## Using it

### Do I need to know how to code?
No, to start. Bob writes the code. But you do need to **read** what it produces
and judge whether it is right — that is the actual skill being assessed, and it
is why the method matters more than the output.

### Is this cheating?
No. Using AI well is the point of the module. What would be a problem is not
understanding what was built, or claiming someone else's work. Your repository
shows your method: the evidence, the glossary, the spec, the tests, the evals.
That is your work.

### How much does it cost?
Firecrawl's free tier is 1,000 credits a month, no credit card. Bob's costs
depend on your institution's plan. The habits in
[Context Engineering](Context-Engineering) cut Bob's cost substantially.

### Can my team share this?
Yes. Commit the whole `.bob/` folder. Each person sets their own Firecrawl key
with `/manage-secrets`, which is why `.bob/mcp.json` is safe to commit — it only
contains `${FIRECRAWL_API_KEY}`, never the key itself.

### Do I have to use all nine skills?
No. Use what the work needs. `$discover-with-firecrawl` and `$build-evals` are
the two most teams wrongly skip.

### Can I change the rules and skills?
Yes, and doing it well is worth marks. They are files in your repository. If you
edit one and re-run the installer, it reports `kept` and leaves your version
alone.

---

## When things go wrong

### Bob did something I did not want
Press Escape to interrupt. Everything is in git, so `git diff` shows exactly what
changed and you can undo it.

### Bob keeps making the same mistake
Stop correcting it per-message and change the harness. If it should *always*
apply, put it in `AGENTS.md` or a rule. If it applies to one kind of task, make
it a skill. See [Harness Engineering](Harness-Engineering).

### Bob said something that turned out to be false
Expected, if it answered from memory. That is what the evidence rule and Firecrawl
exist to prevent. If Bob is still doing it, check `.bob/rules/00-evidence-over-memory.md`
is present and ask Bob to cite a source for the claim.

### I committed my API key
Revoke it in the Firecrawl dashboard **now**, before anything else. Then create a
new one and make sure `.gitignore` contains `.env`. See [Troubleshooting](Troubleshooting#git).

---

## The project

### How do I pick an idea?
One where you can find real users to talk to, and where you can tell whether it
works. Avoid anything needing data you cannot get or permissions you do not have.
`$discover-with-firecrawl` will kill a bad idea in an hour, which is the cheapest
hour you will spend.

### How much should be AI versus normal code?
Whatever the problem needs. An LLM where judgement or language is required; plain
code everywhere else. Using an LLM for something a database query does better is
a mark against you, not for you.

### We realised our idea is wrong. Now what?
Good — that is discovery working, and it is a result worth presenting. Go back to
stage 1 or 2. What does *not* work is building on against a spec you know is
wrong because the spec feels official.

### Do we need the 90% coverage gate?
Yes. It is the floor, and it is in CI. But remember it is a floor: 90% coverage
of trivial tests is worse than 85% of tests that check boundaries and failure
paths.

### We have no AI component. Do we still need evals?
If nothing in your product is non-deterministic, tests are enough. If anything
generates, classifies or summarises, you need an eval or you cannot answer "how
do you know it works?".

---

## Bob and Firecrawl

### Why not just use ChatGPT?
You can ask any model questions. What Bob gives you is a *harness*: it reads and
writes your files, runs your tests, loads your project's rules on every turn, and
reaches for your skills. That gap is the module.

### Why does `.bob/mcp.json` have three keys for the same URL?
Bob's own documentation disagrees with itself — the IDE pages use
`type` + `url`, the Shell page uses `httpURL`. Writing all three satisfies either
reader. It is deliberate, and a decent example of handling an ambiguous spec.

### Why can't Bob store my API key for me?
Bob's secret store is set by a command the human types. That is the point: your
key never enters the model's context. Same reason `$wizard` writes a script for
you to run rather than running it itself.

### Can I use a different MCP server?
Yes. Add it to `.bob/mcp.json`. Keep secrets as `${NAME}` references, and
auto-approve only read-only tools.

---

## Assessment

### What is actually being marked?
Method as much as output. Your repository shows it: did you check your
assumptions, agree your vocabulary, write criteria a test could check, test
properly, measure the AI part, rehearse the demo.

### What if we do not finish?
A smaller thing that works, is tested and is honestly presented beats an
ambitious thing that half-runs. Cut scope early and say what you cut and why —
that is a professional judgement, and it reads as one.

### Can we present a failure?
Yes, if you present it properly: what you expected, what happened, what you
learned, what you would do differently. A well-analysed failure beats an
unexamined success.
