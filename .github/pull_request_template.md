## What this changes

<!-- One or two sentences. What is different after this merges? -->

## Why

<!-- The problem being solved. Link an issue if there is one. -->

## How I verified it

<!-- Paste the real output. "Tests pass" on its own is not evidence. -->

```
npm run test:coverage
```

- [ ] `npm run test:coverage` passes, and coverage is at or above 90%
- [ ] `npm run lint:scripts` passes
- [ ] I ran the setup script for my own platform against a scratch directory
- [ ] Re-running the installer is still a no-op (`already current`)

## If this touches the payload

The payload is what Bob loads, so a mistake here is invisible until a student
hits it.

- [ ] Every skill folder is lowercase kebab-case, under 64 characters
- [ ] Every `SKILL.md` has both `name` and `description` in its front matter
- [ ] Each `name` matches its folder name exactly
- [ ] Each `description` says *when* the skill should fire, not just what it is
- [ ] No `{{TOKEN}}` left unrendered (the payload job in CI checks this)
- [ ] `AGENTS.md` did not get longer without a good reason — it is paid for on
      every turn, so depth belongs in a skill or in `references/`

## If this touches the scripts

- [ ] The change is mirrored across all four scripts, or I explain why not
- [ ] `shellcheck` is clean
- [ ] Nothing destructive runs without a confirmation gate

## Anything a reviewer should know

<!-- Trade-offs you made, things you are unsure about, follow-up work. -->
