# Context engineering — why a good prompt is cheap

Retrieved 2 October 2026.

## The definition

> Context engineering is **the set of strategies for curating and maintaining
> the optimal set of tokens (information) during LLM inference**, including all
> the other information that may land there outside of the prompts.
>
> — Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Prompt engineering is how you write one instruction. Context engineering is
managing everything in the window across a session that may run for hours.

## The part that surprises people: accuracy falls *before* you run out of room

The context window is not a bucket you either overflow or do not. Anthropic call
the real effect **context rot**: as the token count grows, the model's ability
to accurately recall information from that context *decreases* — gradually, all
the way up.

The reason is architectural, which is why a bigger window does not fix it:

> Every token attends to every other token across the entire context, resulting
> in n² pairwise relationships for n tokens. As context length increases, the
> model's ability to capture these pairwise relationships gets stretched thin.

Models are also trained on far more short sequences than long ones, so they have
less practice at long-range dependencies.

## The one principle

> Find the smallest possible set of high-signal tokens that maximize the
> likelihood of some desired outcome.

Note what it does **not** say. Not "the fewest tokens" — an under-specified
agent fails too. *Smallest set of high-signal tokens.* You are maximising signal
per token, not minimising tokens.

This is why a well-engineered prompt is cheap even when it is long, and why a
vague one-liner is expensive.

## Where a vague prompt actually spends your window

- **Hunting.** With no path and no line range the agent searches, opens whole
  files, and fills the window with tool results nobody needed. Usually the
  largest single line item.
- **Clarification turns.** Every round trip re-sends the entire conversation, so
  one missing sentence costs the whole history again, not one question.
- **Wrong work.** Code built on a misunderstanding has to be read, discussed and
  undone — and all of it stays in the window afterwards.
- **Repetition.** Standing instructions retyped into every prompt instead of
  being carried once by the harness.

None of these is about how many words you typed.

## The four techniques

Anthropic name four. Every one is something you do with files and habits — none
of them needs a library:

| Technique | What it means |
| --- | --- |
| **Just-in-time retrieval** | keep lightweight identifiers — paths, URLs, IDs — and load content at the moment you need it |
| **Structured note-taking** | the agent writes notes to a file outside the window and pulls them back in later |
| **Compaction** | summarise a conversation near the limit and restart from the summary |
| **Sub-agents** | a specialist works in a clean window and hands back a condensed summary |

Structured note-taking is the cheapest and the one most people skip. A decision
written to a file survives compaction. The same decision in your scrollback does
not.

**The goal is not to survive compaction. It is to never need it.**
