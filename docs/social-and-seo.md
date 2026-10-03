# Sharing a page, and being found

What happens when someone posts a link to this project on LinkedIn, and what we
can actually control about it.

Everything below was checked against the live HTML GitHub serves, not assumed.

## The short version

Two settings control every link preview this project will ever produce — the
repository page **and all seventeen wiki pages**. Neither of them lives in the
code.

| Setting | Where | Controls |
| --- | --- | --- |
| **About → Description** | Repo home, the ⚙ beside "About" | `og:description` on every page |
| **Settings → Social preview** | Settings, General, scroll to "Social preview" | `og:image` on every page |

Upload [`assets/social-card.png`](../assets/social-card.png) as the social
preview. It is generated, 1280×640, and under GitHub's 1 MB limit.

## What GitHub already does for us

A wiki page carries a full set of Open Graph tags. This is the live response for
the Enterprise Security Safeguards page:

```
og:title        Enterprise Security Safeguards
og:url          https://github.com/.../wiki/Enterprise-Security-Safeguards
og:type         object
og:site_name    GitHub
twitter:card    summary_large_image
og:image        https://opengraph.githubassets.com/<hash>/techcwbldr26/bob-scripts-...
og:image:width  1200
og:image:height 600
og:description  Contribute to techcwbldr26/bob-scripts-... by creating an account on GitHub.
```

Three things to read off that:

- **`og:title` is already right.** It is the page title, per page. This is why
  the renamed pages matter beyond navigation: a card headed *"Every term you
  need to know in plain English"* is a better link than one headed *"Glossary"*.
- **`twitter:card` is `summary_large_image`**, so the preview is the big banner
  layout rather than a thumbnail. We get that for free.
- **`og:description` is the placeholder**, because the repository's About
  description is empty. That one empty field is what makes every share of every
  page say "Contribute to … by creating an account on GitHub."

## Why the preview image cannot be one of our diagrams

The animated SVGs are the best images this project has, and none of them can be
the preview. A link-preview crawler fetches `og:image` and embeds it at a
declared pixel size; it does not run a rendering engine, so SVG is dropped and
animation is meaningless. The preview image has to be a raster file at a fixed
size.

Hence `assets/social-card.png`: a static card, authored as SVG like everything
else here so it reviews and diffs as text, then rasterised.

```bash
npm run build:social       # assets/social-card.svg — no dependencies
npm run build:social-png   # assets/social-card.png — needs Playwright
```

The PNG is committed, so only someone changing the card needs Playwright. The
rasterise step also measures every line's real width in the browser and fails if
one falls outside the frame — the character-ratio estimate the generator guards
with is an approximation, and it has been wrong before.

`assets/social-card.png.sha256` records which SVG the PNG was built from. A test
compares it against the SVG on disk, because `npm run build:svg` regenerates the
SVG and cannot regenerate the PNG — without that record, a count could change in
the card while the image GitHub serves still showed the old number.

## Alt text

Every image in the wiki and the README already carries a real description, not a
filename. The rule, for anything added later:

- Describe **what the diagram shows and what it argues**, not what it is called.
  "An animated diagram of six safeguards to put in place before an AI agent is
  allowed to act: …" — not "security diagram".
- A wiki embed uses markdown: `![description](https://raw.githubusercontent.com/…)`.
- The README uses an `<img>` tag and needs an explicit `alt=`.
- Each generated SVG also carries `<title>` and `<desc>` and
  `role="img" aria-labelledby="title desc"`, which is what a screen reader reads
  when the file is opened directly rather than embedded.

A test asserts the alt text on each embed is longer than 60 characters, which is
a crude way of saying "this is a sentence, not a filename".

## SEO, honestly

This is a GitHub repository, so most of the usual levers do not exist — no
`<head>`, no canonical tags, no sitemap, no structured data. What is left:

- **The About description.** It is the Google snippet, the GitHub search result,
  and `og:description`. It is the single highest-value field on the project.
- **Topics.** They are how GitHub's own search and topic pages find the repo.
- **Page titles.** Wiki page filenames become titles and appear in
  `<title>` and `og:title`. Descriptive beats short.
- **The first paragraph of each page.** It is what a search engine quotes when
  it does not use the meta description. Every wiki page opens with a sentence
  that says what the page is for, and should keep doing so.

If the project ever needs real control — a per-page `og:image`, canonical URLs,
structured data — that means GitHub Pages serving `docs/`, not a wiki. That is a
larger change and nobody needs it yet.

## Checking a change took effect

Platforms cache previews aggressively, so a share can show a stale card for days
after a fix. Force a re-fetch:

- LinkedIn: <https://www.linkedin.com/post-inspector/>
- Facebook: <https://developers.facebook.com/tools/debug/>
- X: paste the link into a draft post

Or read the tags directly:

```bash
curl -sL https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams \
  | grep -oE '<meta property="og:[a-z:]+" content="[^"]*"'
```

After the social preview is uploaded, `og:image` should point at
`repository-images.githubusercontent.com`, not `opengraph.githubassets.com`.
