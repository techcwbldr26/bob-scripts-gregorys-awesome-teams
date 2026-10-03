# Getting Started

Ten minutes, most of it waiting. You do not need to understand any of it yet.

---

## Before you start

You need two things:

1. **A folder for your project**, named whatever you like. It can be empty.
2. **IBM Bob**, installed and open in that folder.
   Get it from <https://bob.ibm.com/download> if you have not already.

You do **not** need to download anything else. You do **not** need to understand
git, the terminal, or Node.js. The prompt handles all of it.

---

## The whole process

### 1. Open Bob in your project folder

Not in your Downloads folder, not in your home folder. The folder you made for
this project. Bob works in whatever folder it is opened in.

### 2. Copy the setup prompt

Open **[START-HERE.md](https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams/blob/main/START-HERE.md)**.

There is one large grey box. Hover over it and click the **copy icon** in its
top-right corner. That copies all of it — do not try to select it by hand.

### 3. Paste it into Bob and press Enter

Bob will start working through it and will tell you what it is doing.

### 4. Answer when Bob asks

Bob stops and waits at four points:

| Bob says | You do |
| --- | --- |
| Node.js is missing or too old | Say yes to the command it shows, or run it yourself |
| Go and get a Firecrawl key | See below — this is the only real task |
| Type this `/manage-secrets` line | Type it, with your key in place of `fc-...` |
| Restart Bob | Close it, open it again in the same folder |

Everything else it does on its own.

---

## The one thing you have to do: the Firecrawl key

This gives Bob real web access. It is free and needs no credit card.

1. Go to <https://www.firecrawl.dev/signup>. Signing in with GitHub is quickest.
2. On the dashboard, **connect your social accounts** — this gives you extra free
   credits, and it takes ten seconds.
3. Go to **Dashboard → API Keys → Create API Key → Copy**.
4. Open the `.env` file in your project folder. Bob will have created it. Replace
   `paste-your-key-here` with your key, so the line reads `FIRECRAWL_API_KEY=fc-...`
5. Save the file and tell Bob you have done it.

Your key always starts with `fc-`.

**The free tier is 1,000 credits a month**, refreshed monthly. That is plenty —
[Firecrawl](Firecrawl) explains how to make it last the semester.

> **Never paste your key into a chat message**, including to Bob. Bob checks that
> your key is in `.env` without reading it, on purpose. [Why that matters](Firecrawl#keeping-your-key-safe).

---

## How you know it worked

Bob finishes by running a check. Every line should say `ok`:

```
  ok   AGENTS.md                    present, managed block found
  ok   SKILLS.md                    present
  ok   /gregorys-awesome-teams command installed
  ok   /improve-prompt command      installed
  ok   skills                       10 skills valid
  ok   rules                        4 rule files in .bob/rules
  ok   Firecrawl MCP                registered over streamable-http
  ok   examples/                    7 files
  ok   references/                  8 files
```

If any line says `FAIL`, go to [Troubleshooting](Troubleshooting). Do not carry
on and hope.

Then type `/mcp` in Bob. `firecrawl` should be listed and connected.

---

## Your first real move

```
/gregorys-awesome-teams I want to build an app that helps study groups find
answers across their lecture PDFs
```

Replace that with your actual idea. Say it however it comes out — Bob will ask
questions.

**Attach your documents and links in that first message.** If you have a brief, a
slide deck, or links to competitors, give them to Bob now. It reads PDFs, Word
files and web pages properly rather than guessing from the filename.

The first thing it will do is **research, not design**. That is deliberate.
Building the wrong thing correctly is the most expensive mistake available to you
this semester, and it is only avoidable at the start.

---

## What is now in your folder

| What | Why it is there |
| --- | --- |
| `AGENTS.md` | Rules Bob reads every single turn. Short on purpose |
| `SKILLS.md` | A list of the ten skills you now have |
| `.bob/` | The machinery: skills, rules, the slash command, the Firecrawl connection |
| `examples/` | Worked examples to copy — a real spec, a real ADR, a real eval case |
| `references/` | The deep material, which Bob reads only when it needs it |
| `.env` | Your key. Never committed |

Curious about why it is split that way? [Harness Engineering](Harness-Engineering)
explains it, and it is the most useful page here once you are up and running.

---

## Next

- [The Build Flow](The-Build-Flow) — what the six stages are and why that order
- [Glossary](Glossary) — any word that stopped you
- [Prompt Engineering](Prompt-Engineering) — getting better answers immediately
