# Context discipline

Every turn re-sends the whole conversation, so cost grows faster than length and
quality falls once compaction starts summarising away earlier decisions.

- Mention files with line ranges: `@src/api/auth.ts:40-80`, never `@src`.
- Put the task list in `TASKS.md`. The scrollback does not survive compaction;
  a file does.
- Send wide repository reads to a subagent so only the conclusion comes back.
- Start a new task when the topic changes.
- Connect only the MCP servers this task needs.

Before a long run, consider `/compact`. After finishing a topic, `/clear`.
