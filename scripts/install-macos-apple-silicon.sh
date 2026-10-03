#!/usr/bin/env bash
#
# Gregory's Awesome Teams — setup for macOS (Apple silicon).
#
# Installs the prompt, context and harness engineering kit into a project so the
# IBM Bob harness loads it automatically: AGENTS.md, SKILLS.md, CHEATSHEET.md,
# the skills, the always-on rules, the /gregorys-awesome-teams and
# /improve-prompt slash commands, the Firecrawl MCP server, and the examples/
# and references/ folders.
#
# No counts here on purpose. This comment cannot be generated, so a number in it
# goes stale the next time a skill is added; `--verify` reports what is really
# installed.
#
# Usage, from inside your project directory:
#     ./scripts/install-macos-apple-silicon.sh
#
# Or from anywhere:
#     ./scripts/install-macos-apple-silicon.sh --target /path/to/project
#
# For M-series Macs. Detects a Rosetta shell so an emulated terminal still resolves to this script.

set -euo pipefail

GAT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAT_EXPECTED_PLATFORM='macos-apple-silicon'
GAT_PLATFORM_LABEL='macOS (Apple silicon)'
export GAT_SCRIPT_DIR GAT_EXPECTED_PLATFORM GAT_PLATFORM_LABEL

# shellcheck source=lib/common.sh
if [[ -f "$GAT_SCRIPT_DIR/lib/common.sh" ]]; then
  . "$GAT_SCRIPT_DIR/lib/common.sh"
else
  printf 'Cannot find lib/common.sh next to this script.\n' >&2
  printf 'Clone the repository and run the script from inside it:\n' >&2
  printf '  git clone https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git\n' >&2
  exit 1
fi

gat_main "$@"
