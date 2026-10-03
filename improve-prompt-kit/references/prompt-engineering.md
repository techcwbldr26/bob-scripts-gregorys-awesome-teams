# Prompt engineering — what the labs actually publish

Everything here is quoted from primary sources, linked and dated. Check them
rather than trusting this file: guidance about models expires faster than
anyone updates their notes, including this one.

Retrieved 2 October 2026.

## The mental model that does the most work

> Think of Claude as a brilliant but new employee who lacks context on your
> norms and workflows.
>
> — Anthropic, [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Run it on every prompt before sending: **could a capable new hire, who has never
seen this codebase, do the right thing with only this message?** Almost every
weak prompt fails the same way — it assumes something the writer knows and never
said.

## Where the labs converge

| The common advice | Anthropic | OpenAI | DeepSeek |
| --- | --- | --- | --- |
| **State the finish line precisely** | define success criteria before prompting | *"give very specific parameters for a successful response"* | — |
| **Use structure to separate the parts** | XML tags around instructions, context, inputs | *"use delimiters like markdown, XML tags, and section titles"* | — |
| **Say what you want, with constraints** | add context and motivation — explain *why* | *"explicitly outline those constraints in the prompt"* | — |
| **Do not over-engineer it** | start minimal, add only to fix observed failures | *"keep prompts simple and direct"* | *"avoid adding a system prompt; all instructions should be contained within the user prompt"* |

DeepSeek publish far less prompting guidance than the other two — their model
card gives four usage recommendations and that is close to all of it. The
dashes are honest gaps, not disagreements.

## Where they contradict each other

Take the most famous prompting phrase there is — *"think step by step"* — and
ask two vendors of **reasoning models** whether to use it:

- **OpenAI:** *"Avoid chain-of-thought prompts. Since these models perform
  reasoning internally, prompting them to 'think step by step' or 'explain your
  reasoning' is unnecessary."*
  ([Reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices))
- **DeepSeek:** *"For mathematical problems, it is advisable to include a
  directive in your prompt such as: 'Please reason step by step, and put your
  final answer within \boxed{}.'"*
  ([DeepSeek-R1 model card](https://huggingface.co/deepseek-ai/DeepSeek-R1))

Same class of model. Opposite official advice from the people who built them.

Examples split the same way. Anthropic: *"Examples are one of the most reliable
ways to steer Claude's output format, tone, and structure."* OpenAI, for
reasoning models: *"Try zero shot first, then few shot if needed."*

**Nobody is lying.** The advice is model-specific, and model-specific advice
goes stale. The durable skill is not knowing which side is right — it is
noticing that you are holding a belief about a model, and testing it on your own
task.

## Before you tune a prompt, know what "better" means

Anthropic's guide opens by assuming you already have a definition of success, a
way to test against it empirically, and a draft to improve. *"If not, spend time
establishing that first."*

DeepSeek make the same point as a measurement instruction: *"When evaluating
model performance, it is recommended to conduct multiple tests and average the
results."*

One good run is not evidence. One bad run is not evidence either — worth
remembering before you throw away a prompt that was fine.
