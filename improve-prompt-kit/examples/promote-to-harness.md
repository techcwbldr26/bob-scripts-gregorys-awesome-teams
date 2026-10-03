# When the fix is not a prompt at all

The most valuable thing this skill does is notice that you are about to pay for
the same instruction forever.

## What was typed

```
Add a rate limiter to the API. Use TypeScript, follow our existing patterns,
write tests first and get coverage above 90%, don't use any new dependencies
without asking, and make sure you run npm test before you tell me it works.
```

Nothing here is *wrong*. Half of it is in the wrong place.

## What came back

### 1. The improved prompt

```
Add a fixed-window rate limiter to the public API routes.

Context: routes are registered in src/api/routes.ts:12-60. There is an existing
middleware pattern in src/api/middleware/auth.ts to follow.

Done means:
- requests beyond 100 per minute per API key return 429 with a Retry-After
  header
- the limit is configurable through the existing config module, not a constant
- [FILL: should the limit be per key, per IP, or both? only you know whether
  unauthenticated traffic matters here]

Out of scope: distributed rate limiting across instances, billing tiers.

Stop and ask me if a fixed window cannot meet the requirement and a sliding
window is needed — that is a design decision, not an implementation detail.
```

### 2. What changed

| What was missing | What was added | Why it matters |
| --- | --- | --- |
| the actual limit | 100/minute, 429, `Retry-After` | "a rate limiter" has a dozen reasonable implementations |
| where it goes | the route file, with a line range, and the pattern to follow | "follow our existing patterns" means nothing without naming one |
| a decision you own | a `[FILL:]` for per-key versus per-IP | this is a product decision; guessing it would have looked right and been wrong |

**You need to answer:** should the limit be per API key, per IP, or both?

### 3. What does not belong in a prompt

Four of your instructions are true on **every** turn, not just this one:

| What you typed | Where it belongs |
| --- | --- |
| "Use TypeScript" | project instructions — it is a fact about the repo |
| "write tests first and get coverage above 90%" | an always-on rule |
| "don't use any new dependencies without asking" | an always-on rule |
| "run npm test before you tell me it works" | project instructions, with the command |

Moved there, the harness carries them on every turn and you never type them
again. Left in your prompts, you retype four lines forever and forget one of
them on the turn it mattered.

Want me to make those changes?

### 4. What this saves in the context window

- **Repetition:** four instructions × every prompt for the rest of the project.
- **Hunting:** a line range and a named pattern file, instead of the agent
  working out your conventions by reading the codebase.
- **Wrong work:** the `[FILL:]` is the big one. A guessed answer to per-key
  versus per-IP produces a working rate limiter that is wrong, and you find out
  in week nine.
