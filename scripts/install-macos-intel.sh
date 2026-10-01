#!/usr/bin/env bash
#
# Gregory's Awesome Teams — setup for macOS (Intel).
#
# Installs the prompt, context and harness engineering kit into a project so the
# IBM Bob harness loads it automatically: AGENTS.md, SKILLS.md, nine skills, four
# rule files, the /gregorys-awesome-teams slash command, the Firecrawl MCP
# server, and the examples/ and references/ folders.
#
# Usage, from inside your project directory:
#     ./scripts/install-macos-intel.sh
#
# Or from anywhere:
#     ./scripts/install-macos-intel.sh --target /path/to/project
#
# Refuses to run on Apple silicon, including under Rosetta, and tells you which script to use instead.

set -euo pipefail

GAT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAT_EXPECTED_PLATFORM='macos-intel'
GAT_PLATFORM_LABEL='macOS (Intel)'
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
