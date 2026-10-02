# Student quickstart

Start to finish, from an empty folder to Bob working on your idea.

## 1. Install Bob

Bob Shell needs **Node.js 24 or later**. Check:

```bash
node --version
```

If that is missing or older than v24, install Node first — `brew install node`
on macOS, `winget install OpenJS.NodeJS.LTS` on Windows, or
<https://nodejs.org/en/download>.

Then install Bob Shell:

```bash
# macOS and Linux
curl -fsSL https://bob.ibm.com/download/bobshell.sh | bash
```

```powershell
# Windows
powershell -ep Bypass "iwr https://bob.ibm.com/download/bobshell.ps1 -OutFile $env:TMP\bob.ps1; &$env:TMP\bob.ps1"
```

For the IDE instead, use the installers at <https://bob.ibm.com/download> —
pick **mac-ARM** for an M-series Mac, **mac-Intel** otherwise.

## 2. Get your free Firecrawl key

<https://www.firecrawl.dev/signup> — GitHub sign-in is quickest.

1,000 credits a month, refreshed monthly, no credit card. Connect your social
accounts on the dashboard for extra credits.

Then: **Dashboard → API Keys → Create API Key → Copy.** Keys start with `fc-`.

Details, and how to spend credits well: [firecrawl-setup.md](firecrawl-setup.md).

## 3. Get the kit

```bash
git clone https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git
```

## 4. Run the script for your machine

From inside **your project directory**:

```bash
# macOS, Apple silicon (M1/M2/M3/M4)
/path/to/bob-scripts-gregorys-awesome-teams/scripts/install-macos-apple-silicon.sh

# macOS, Intel
/path/to/bob-scripts-gregorys-awesome-teams/scripts/install-macos-intel.sh

# Linux
/path/to/bob-scripts-gregorys-awesome-teams/scripts/install-linux.sh
```

```powershell
# Windows 11
C:\path\to\bob-scripts-gregorys-awesome-teams\scripts\install-windows.ps1
```

Not sure which Mac you have? Run `uname -m`: `arm64` means Apple silicon,
`x86_64` means Intel. Running the wrong script is harmless — it refuses and tells
you which one to use.

Want to see what it would do first? Add `--dry-run`.

If PowerShell blocks the script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
```

## 5. Store your key in Bob

Start Bob in your project, then:

```
/manage-secrets set FIRECRAWL_API_KEY fc-your-key-here
```

This goes into Bob's encrypted store, **not** into your repository. That is why
`.bob/mcp.json` is safe to commit — it only references `${FIRECRAWL_API_KEY}`.

Restart Bob, then check:

```
/mcp
```

`firecrawl` should be listed and connected.

## 6. Check the installation

```bash
./scripts/install-linux.sh --verify   # or your platform's script
```

Every line should say `ok`. If one does not, the message says what to fix.

## 7. Start working

```
/gregorys-awesome-teams I want to build an app that helps study groups find
answers across their lecture PDFs
```

Bob will work out which stage you are at and route you. On a brand-new idea that
means `$discover-with-firecrawl` — evidence before design, because building the
wrong thing correctly is the most expensive mistake available this semester.

Attach your documents and links in that first message. Bob parses PDFs, DOCX and
slide decks with Firecrawl and reads the pages rather than guessing from the
filenames.

## The six stages

```
discover → grill → spec → implement (TDD) → evals → demo rehearsal
```

| Stage | Command | You get |
| --- | --- | --- |
| Discover | `$discover-with-firecrawl` | `references/evidence.md` — verified claims |
| Grill | `$grill-with-docs` | `GLOSSARY.md`, and ADRs for the hard decisions |
| Spec | `$to-spec` | `docs/spec/*.md` with assertable acceptance criteria |
| Implement | `$implement-with-tests` | Working code, tests first, 90% coverage |
| Evals | `$build-evals` | A real number for how well the AI part works |
| Rehearse | `$demo-rehearsal` | A demo script, and the failures already fixed |

Ask `/gregorys-awesome-teams` at any point and it will tell you where you are.

Stuck on how to word a request? Put `/improve-prompt` in front of your rough
wording. It rewrites the prompt and shows you what it changed, without doing
the task.

## Getting better results

The habits that make the biggest difference, in order:

1. **Say what "done" looks like** in the same message as the task. "Add auth"
   gets you something; "done means these two endpoints exist, passwords are
   hashed, and the suite passes" gets you the thing you wanted.
2. **Never accept a fact without a source.** The kit's rules tell Bob to use
   Firecrawl, but you should notice when a claim arrives without one.
3. **Mention files with line ranges** — `@src/api.ts:40-80`, not `@src`. The
   second one makes Bob pay for your whole repository on every turn after.
4. **Keep the checklist in `TASKS.md`.** Bob's context window compacts and
   compaction is lossy; a file survives it, your scrollback does not.
5. **Delete "think carefully" from your prompts.** It costs tokens and changes
   nothing on current models. Change the effort setting instead.
6. **Start a new task when the topic changes.** Every turn re-sends the whole
   conversation, so a long mixed thread gets expensive and worse at the same time.

## When something is wrong

Run `$harness-tuning`. It diagnoses in cost order: context, then skills, then
MCP tools, then instructions, then the prompt, and only last the model.

The one to know about up front: **Bob skips an invalid skill folder silently** —
no error, the skill is just absent. If a skill seems to be ignored, ask Bob which
skills it loaded before concluding it is disobeying you.

## Common problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Wrong script for this machine" | Intel script on Apple silicon, or similar | Run the one it names |
| `node: command not found` | Node not installed, or a stale terminal | Install Node, open a new terminal |
| Script runs, Bob sees nothing | Bob was not restarted | Restart Bob; `/permissions` to trust the folder |
| `/mcp` shows no firecrawl | Secret not set, or no restart | `/manage-secrets list`, then restart |
| Firecrawl returns 401 | Wrong or expired key | Re-copy from the dashboard, re-set the secret |
| Alexandria tools missing | Running keyless | Keyless excludes Alexandria. Get the free key |
| A skill never fires | Invalid folder name, or missing description | `--verify` names the exact problem |
| PowerShell refuses to run the script | Execution policy | `powershell -ExecutionPolicy Bypass -File ...` |
