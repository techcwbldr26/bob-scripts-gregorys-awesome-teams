# Troubleshooting

Find your symptom. If it is not here, see [FAQ](FAQ) or
[open an issue](https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/issues/new/choose).

---

## Setup

### "Wrong script for this machine"
You ran the Intel script on Apple silicon, or the reverse. The message names the
right one — run that.

Not sure which Mac you have? `uname -m`: `arm64` is Apple silicon, `x86_64` is
Intel.

### `node: command not found`
Node is not installed, or your terminal is stale. Install it, then **open a new
terminal** — an existing one will not pick it up.

```
macOS:    brew install node
Windows:  winget install OpenJS.NodeJS.LTS
any:      https://nodejs.org/en/download
```

### "Bob Shell needs Node 24 or later"
The installer works on Node 20+, but Bob itself needs 24. Upgrade before running
Bob.

### PowerShell refuses to run the script
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
```

### The script ran but Bob does not see anything
Restart Bob. Then `/permissions` to confirm the folder is trusted.

---

## Firecrawl

### `/mcp` does not list firecrawl
In order:
1. Did you type `/manage-secrets set FIRECRAWL_API_KEY fc-...`? Check with
   `/manage-secrets list`.
2. Did you restart Bob **after** that?
3. Does `.bob/mcp.json` exist in your project?

### Firecrawl returns 401
A credential problem, not a config one. Re-copy the key from the dashboard — it
is easy to miss a character — and set it again.

### Alexandria tools are missing
You are running keyless. Keyless excludes Alexandria. Get the free key.

### "Out of credits"
Free tier is 1,000/month, refreshed monthly. Check the dashboard. See
[making credits last](Firecrawl#making-1000-credits-last-a-semester) — the usual
culprit is an unbounded `crawl`.

### `THIRD_PARTY_DATA_TERMS_REQUIRED`
Not a bug. An admin must accept that provider's terms at the URL in
`requiresAction`.

---

## Bob behaving oddly

### A skill never fires
**Bob skips an invalid skill folder silently** — no error, the skill is simply
absent. In order:

1. **Ask Bob which skills it loaded.** Do this first, before assuming disobedience.
2. Run the kit's verify — it checks every silent failure mode by name.
3. Folder name must be lowercase-kebab-case, under 64 characters.
4. Front matter must have both `name` and `description`.
5. `name` must match the folder name.
6. Restart Bob after adding a skill.

### Bob forgot something we agreed earlier
Compaction. Around 190k tokens it summarises older turns, and it is lossy.

Right now: tell it again, and **write it to a file** this time.
Next time: keep decisions in `TASKS.md`, `GLOSSARY.md` or `docs/adr/`, and start
a new task when the topic changes. See [Context Engineering](Context-Engineering).

### Bob stops and asks instead of continuing
Check `AGENTS.md` still has the keep-going rule. If a run ends with "Want me to
continue?", reply "continue".

### Bob is ignoring a rule
Rules load alphabetically from `.bob/rules/`. Check the file is `.md`, is not
empty (empty files are silently skipped), and that nothing later contradicts it.

### Answers feel generic or wrong
Work cheapest-first: prompt, context, rules, skills, tools, and only then the
model. Run `$harness-tuning`, which does exactly that.

### It is getting slower and more expensive
Every turn re-sends the whole conversation. Start a new task when the topic
changes — that is economy, not tidiness.

---

## Git

### "Your key is in a commit"
Act now:
1. Revoke the key in the Firecrawl dashboard immediately. Assume it is public.
2. Create a new one.
3. Make sure `.gitignore` contains `.env`.
4. Remove it from history before pushing — or if already pushed, revoke is the
   only thing that actually protects you.

Revoking takes ten seconds and costs nothing. Do it first, tidy history after.

### "Updates were rejected"
Someone else pushed. `git pull` first, resolve any conflict, then push.

---

## Still stuck

[Open an issue](https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/issues/new/choose)
with:
- what you ran
- the **whole** output, including the lines before the error
- your platform and `node --version`
- what `--verify` says

"It doesn't work" cannot be helped. The output can.
