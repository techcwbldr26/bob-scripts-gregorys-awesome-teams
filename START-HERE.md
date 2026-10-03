# Start here

**Never used an AI assistant before? This page is for you.** You do not need to
understand any of it. You need to copy one block of text.

You will end up with a project folder that IBM Bob already knows how to work in,
and it takes about ten minutes, most of which is waiting.

## What you need first

1. **A folder for your project**, with a name you picked. It can be empty.
2. **IBM Bob**, open in that folder. If you do not have Bob yet, install it from
   <https://bob.ibm.com/download>.

That is all. You do not need to download this repository yourself — the prompt
below does that for you.

## What to do

1. Open Bob in your project folder.
2. Copy **everything** in the grey box below. On GitHub there is a copy button in
   its top-right corner.
3. Paste it into Bob and press Enter.
4. Answer Bob's questions as they come. It will stop and wait for you when it
   needs something.

Bob will check your computer, install the kit, and walk you through getting a
free Firecrawl key. The only things you have to do yourself are sign up for that
key and type one command — Bob will tell you exactly when.

## The prompt

```text
You are setting me up to work on a university project using Gregory's Awesome
Teams, a kit for the IBM Bob harness. Set it up in the folder you are open in.

ABOUT ME
I am a university student. I may never have used an AI assistant or a terminal
before. Do not assume I know what anything means. The first time you use a
technical word, explain it in one short sentence.

HOW TO WORK WITH ME
- One step at a time. Say what you are about to do, do it, then tell me whether
  it worked, before moving to the next step.
- Plain language. No jargon without a short explanation.
- If something fails, show me the actual error and say what we will try next.
  Never quietly move on.
- Never print my API key, or any part of it, in any message.
- Keep a checklist in a file called SETUP.md in this folder and tick items off as
  you go, so we can both see where we are.

WHAT "DONE" MEANS
1. Node.js 24 or later is installed, and you have shown me the version number.
2. This folder contains AGENTS.md, SKILLS.md, CHEATSHEET.md, a .bob folder
   holding 10 skills and 4 rules, and examples/ and references/ folders.
3. This folder has a .gitignore containing .env, so my key can never be committed.
4. This folder has a .env file containing my real Firecrawl key.
5. The kit's verify command reports every single line as "ok".
6. You have told me the one command I must type myself to store my key in Bob.

STOP AND ASK ME FIRST IF
- A step would install or change anything outside this folder. Installing Node
  counts. Show me the exact command and wait for me to say yes.
- The same step fails twice.
- Anything is ambiguous. Ask me rather than guess.

THE STEPS

Step 1. What machine am I on.
On macOS or Linux run "uname -s" and "uname -m". On Windows you are in
PowerShell. Tell me in plain words what you found. On a Mac, arm64 means Apple
silicon (M1, M2, M3, M4) and x86_64 means Intel. This matters because there is a
different setup script for each.

Step 2. Is Node.js installed and new enough.
Run "node --version". Node is the program that runs the setup script, and Bob
itself needs version 24 or later. If the command fails, or the version is below
24, stop and show me the single command for my machine, then wait:
  macOS with Homebrew:  brew install node
  macOS without it:     download from https://nodejs.org/en/download
  Windows:              winget install OpenJS.NodeJS.LTS
  Linux:                download from https://nodejs.org/en/download
After I install it I may need to close my terminal and open a new one. Check the
version again before you continue.

Step 3. Is git installed.
Run "git --version". If it is missing, tell me how to install it for my machine
and wait for me.

Step 4. Download the kit, outside my project.
Put it in a cache folder so it never gets mixed up with my own work:
  macOS or Linux:
    git clone --depth 1 https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git "$HOME/.cache/gregorys-awesome-teams"
  Windows PowerShell:
    git clone --depth 1 https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git "$env:LOCALAPPDATA\gregorys-awesome-teams"
If that folder already exists, update it instead with "git -C <that folder> pull
--ff-only" and carry on.

Step 5. Install the kit into my project folder.
Run the one script that matches my machine, with --target set to this folder.
Call the folder from step 4 <kit>:
  Mac, Apple silicon:  <kit>/scripts/install-macos-apple-silicon.sh --target "<this folder>"
  Mac, Intel:          <kit>/scripts/install-macos-intel.sh --target "<this folder>"
  Linux:               <kit>/scripts/install-linux.sh --target "<this folder>"
  Windows PowerShell:  <kit>\scripts\install-windows.ps1 -Target "<this folder>"
Show me the output. It should say "Skills installed (10)" and then list them. If
I picked the wrong Mac script, it will refuse and name the right one, so just run
that instead.
Running it twice is safe: the second run says "already current".

Step 6. Make sure my key can never be committed.
Look for a .gitignore in this folder. If there is not one, create it. Either way,
make sure it contains a line that is exactly:
.env
Tell me in one sentence why that matters.

Step 7. Create the file my key will live in.
If there is no .env in this folder, create one containing exactly this line:
FIRECRAWL_API_KEY=paste-your-key-here

Step 8. Send me to get my free key, then wait for me.
Tell me to do this, then stop and wait until I say I have finished:
  1. Open https://www.firecrawl.dev/signup and sign up. Signing in with GitHub is
     quickest. It is free, 1,000 credits a month, and needs no credit card.
  2. On the dashboard, connect my social accounts for extra free credits.
  3. Go to Dashboard, then API Keys, then Create API Key, then Copy.
  4. Open the .env file in this folder, replace paste-your-key-here with my key so
     the line reads FIRECRAWL_API_KEY=fc-... and save the file.
Tell me the key always starts with fc-.

Step 9. Check my key is there without ever reading it.
Do not open, print or quote .env. Run this instead. It answers yes or no and
shows nothing else:
  macOS or Linux:
    grep -qE '^FIRECRAWL_API_KEY=fc-[A-Za-z0-9_-]{8,}' .env && echo PRESENT || echo MISSING
  Windows PowerShell:
    if (Select-String -Path .env -Pattern '^FIRECRAWL_API_KEY=fc-[A-Za-z0-9_-]{8,}' -Quiet) { 'PRESENT' } else { 'MISSING' }
If it says MISSING, the line is probably still the placeholder. Send me back to
step 8. Do not continue until it says PRESENT. Tell me why you checked it this
way: so that my key never enters your context window.

Step 10. The one thing only I can do.
You cannot store my key in Bob yourself. Bob's secret store is set by a command
the human types, which is deliberate: it keeps my key out of your context. Tell
me to type this, with my real key in place of fc-...:
/manage-secrets set FIRECRAWL_API_KEY fc-...
Then tell me to close Bob, open it again in this same folder, type /mcp and check
that firecrawl is listed and connected. Wait for me to confirm before continuing.

Step 11. Final check.
Run the same script you used in step 5, with the verify option added:
  macOS or Linux:      <the same script> --target "<this folder>" --verify
  Windows PowerShell:  <kit>\scripts\install-windows.ps1 -Target "<this folder>" -Verify
Every line must say ok. If any line says FAIL, tell me which, read what it says,
and fix it. Do not tell me we are finished while anything says FAIL.

Step 12. Tell me what I now have.
In plain language, tell me:
- what is now in this folder, one line for each part, and what it is for
- that I begin work by typing /gregorys-awesome-teams followed by my idea
- that the first thing it will do is research, not design, because building the
  wrong thing correctly is the most expensive mistake available this semester
- that if I am ever unsure how to word a request, I can type /improve-prompt
  followed by my rough wording, and it will rewrite the prompt and show me what
  it changed, without doing the task
- that CHEATSHEET.md is now in this folder: one page with every command and
  skill on it, worth keeping open while I work
Then stop. Do not start building my project yet.

RULES THROUGHOUT
- Never print my API key or any part of it.
- Never say a step worked without running something that shows it worked.
- Show me real errors. Do not summarise them away.
- Do not install or change anything outside this folder without asking me first.
```

## What Bob will ask you for

| When | What you do |
| --- | --- |
| Node is missing or too old | Say yes, or run the command Bob shows you |
| Bob asks for your Firecrawl key | Sign up, copy the key, paste it into `.env` |
| Bob gives you the `/manage-secrets` line | Type it, with your key in place of `fc-...` |
| Bob asks you to restart | Close Bob, open it again in the same folder |

Everything else Bob does by itself.

## If something goes wrong

| What you see | What it means |
| --- | --- |
| `Wrong script for this machine` | You ran the Intel script on Apple silicon, or the reverse. Run the one it names. |
| `node: command not found` | Node is not installed, or your terminal is stale. Install it, then open a **new** terminal. |
| Bob says your key is MISSING | The line in `.env` is still `paste-your-key-here`, or the key does not start with `fc-`. |
| `/mcp` does not list firecrawl | You have not typed the `/manage-secrets` line yet, or Bob was not restarted after you did. |
| PowerShell refuses to run the script | Run it as `powershell -ExecutionPolicy Bypass -File <the script>` |

Still stuck? Open an issue with the output Bob gave you, using the bug report
template, and say which of the twelve steps you were on.

## What this actually installed

Once it finishes, see [the README](README.md) for what each piece does, and
[docs/student-quickstart.md](docs/student-quickstart.md) for the longer tour.

The short version: Bob now loads your project's rules on every turn, has ten
skills it can reach for, can search the real web through Firecrawl instead of
guessing from memory, and knows that your demo is in December 2026.

`CHEATSHEET.md` is now in your project folder: one page, every command and
skill. Keep it open while you work. It is also on the
[wiki](https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/wiki/One-Page-Commands-Reference)
if you would rather have it in a browser tab.
