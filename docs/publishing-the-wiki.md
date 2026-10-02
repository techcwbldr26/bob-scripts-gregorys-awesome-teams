# Publishing the wiki

The wiki's pages live in [`wiki/`](../wiki) in this repository, so they are
version-controlled and reviewable like everything else. GitHub wikis are a
*separate* git repository and do not support pull requests, which is why the
source lives here and gets copied across.

## Publish, or re-publish after a change

Run this from anywhere. It takes about ten seconds.

```bash
# 1. Clone the wiki repository (once; skip if you already have it)
git clone https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.wiki.git /tmp/gat-wiki

# 2. Copy the pages across
cp /path/to/bob-scripts-gregorys-awesome-teams/wiki/*.md /tmp/gat-wiki/

# 3. Commit
cd /tmp/gat-wiki && git add -A && git commit -m "Update the student handbook"

# 4. Push
git push
```

On Windows PowerShell, step 2 is:

```powershell
Copy-Item C:\path\to\bob-scripts-gregorys-awesome-teams\wiki\*.md C:\temp\gat-wiki\
```

## Why this is not automated

The agent that wrote these pages can clone the wiki but cannot push to it: this
project's sandbox only injects git credentials for repositories in its authorized
set, and a `.wiki` repository is not addressable through the GitHub API, so it
cannot be added to that set. Publishing is a human step.

## Editing

Edit the files in `wiki/`, open a pull request as normal, then re-run the four
commands above after it merges. Do not edit pages in the GitHub wiki UI — the next
publish would overwrite them.

## The pages

| File | Page |
| --- | --- |
| `Home.md` | Landing page |
| `_Sidebar.md` | Navigation shown on every page |
| `_Footer.md` | Footer shown on every page |
| `Getting-Started.md` | Ten-minute setup |
| `Glossary.md` | Every term in plain English |
| `The-Build-Flow.md` | The six stages |
| `Skills-Reference.md` | All nine skills |
| `Prompt-Engineering.md` | What you say |
| `Context-Engineering.md` | What the model can see |
| `Harness-Engineering.md` | The machinery around it |
| `Firecrawl.md` | Real web access |
| `Testing-and-Evals.md` | Proving it works |
| `Demo-Day.md` | December 1st |
| `Troubleshooting.md` | Symptom to fix |
| `FAQ.md` | Common questions |

Files beginning with `_` are special to GitHub wikis: `_Sidebar.md` and
`_Footer.md` render on every page. Everything else becomes a page whose title is
the filename with hyphens turned into spaces.

## The images

`The-Build-Flow.md` and `Skills-Reference.md` open with an animated SVG. Those
images are **not** copied into the wiki repository: the pages link to them by
absolute `raw.githubusercontent.com` URL on `main`, because a wiki page cannot
reach a file in the code repository by relative path.

Two consequences worth knowing:

- Rebuilding a diagram and merging it to `main` updates the wiki immediately.
  There is nothing to re-publish for an image-only change.
- The URLs pin `main`, not a tag. A page published from a branch still shows
  whatever `main` currently has.
