#!/usr/bin/env bash
# Shared library for the macOS and Linux setup scripts.
#
# Sourced, never executed. Each platform script sets GAT_EXPECTED_PLATFORM and
# GAT_PLATFORM_LABEL, then calls gat_main "$@".

GAT_REPO_URL="${GAT_REPO_URL:-https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git}"
GAT_INSTALLER_MIN_NODE=20
GAT_BOB_SHELL_MIN_NODE=24

if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
  GAT_BOLD=$'\033[1m'; GAT_DIM=$'\033[2m'; GAT_RED=$'\033[31m'
  GAT_GREEN=$'\033[32m'; GAT_YELLOW=$'\033[33m'; GAT_RESET=$'\033[0m'
else
  GAT_BOLD=''; GAT_DIM=''; GAT_RED=''; GAT_GREEN=''; GAT_YELLOW=''; GAT_RESET=''
fi

gat_say()  { printf '%s\n' "$*"; }
gat_ok()   { printf '%s\n' "${GAT_GREEN}✓${GAT_RESET} $*"; }
gat_warn() { printf '%s\n' "${GAT_YELLOW}!${GAT_RESET} $*" >&2; }
gat_die()  { printf '%s\n' "${GAT_RED}✗${GAT_RESET} $*" >&2; exit 1; }

gat_header() {
  gat_say ""
  gat_say "${GAT_BOLD}Gregory's Awesome Teams${GAT_RESET}"
  gat_say "${GAT_DIM}Prompt, context and harness engineering for the IBM Bob harness${GAT_RESET}"
  gat_say "${GAT_DIM}Target platform: ${GAT_PLATFORM_LABEL}${GAT_RESET}"
  gat_say ""
}

# Major version of the installed Node, or 0 when absent/unparseable.
gat_node_major() {
  command -v node >/dev/null 2>&1 || { printf '0'; return; }
  local version
  version="$(node --version 2>/dev/null || printf '')"
  version="${version#v}"
  version="${version%%.*}"
  case "$version" in
    ''|*[!0-9]*) printf '0' ;;
    *)           printf '%s' "$version" ;;
  esac
}

# Confirm we are on the platform this script is for. Running the Intel script on
# Apple silicon (or vice versa) is a real mistake students make, and a clear
# refusal is kinder than a confusing failure later.
gat_assert_platform() {
  local os arch detected
  os="$(uname -s 2>/dev/null || printf 'unknown')"
  arch="$(uname -m 2>/dev/null || printf 'unknown')"

  case "$os" in
    Darwin)
      case "$arch" in
        arm64)         detected='macos-apple-silicon' ;;
        x86_64|i386)   detected='macos-intel' ;;
        *)             detected='unsupported' ;;
      esac
      ;;
    Linux)  detected='linux' ;;
    *)      detected='unsupported' ;;
  esac

  # On Apple silicon, an Intel-emulated shell reports x86_64. Ask the kernel
  # directly so we recommend the right script rather than trusting uname.
  if [[ "$os" == 'Darwin' && "$detected" == 'macos-intel' ]]; then
    if [[ "$(sysctl -n sysctl.proc_translated 2>/dev/null || printf '0')" == '1' ]]; then
      detected='macos-apple-silicon'
      gat_warn "This shell is running under Rosetta on Apple silicon."
    fi
  fi

  if [[ "$detected" == 'unsupported' ]]; then
    gat_die "Unsupported system: ${os} ${arch}. Supported: macOS (Intel and Apple silicon), Linux, Windows 11."
  fi

  if [[ "$detected" != "$GAT_EXPECTED_PLATFORM" ]]; then
    gat_say "${GAT_RED}Wrong script for this machine.${GAT_RESET}"
    gat_say "  Detected: ${detected} (${os} ${arch})"
    gat_say "  This script is for: ${GAT_EXPECTED_PLATFORM}"
    gat_say ""
    case "$detected" in
      macos-intel)          gat_say "  Run instead: ./scripts/install-macos-intel.sh" ;;
      macos-apple-silicon)  gat_say "  Run instead: ./scripts/install-macos-apple-silicon.sh" ;;
      linux)                gat_say "  Run instead: ./scripts/install-linux.sh" ;;
    esac
    exit 1
  fi

  gat_ok "Platform: ${GAT_PLATFORM_LABEL} (${os} ${arch})"
}

gat_check_node() {
  local major
  major="$(gat_node_major)"

  if [[ "$major" == '0' ]]; then
    gat_say ""
    gat_say "${GAT_RED}Node.js is required and was not found.${GAT_RESET}"
    gat_say ""
    gat_say "Bob Shell needs Node ${GAT_BOB_SHELL_MIN_NODE} or later, so install that version:"
    case "$GAT_EXPECTED_PLATFORM" in
      macos-*)
        gat_say "  Homebrew:  brew install node"
        gat_say "  Installer: https://nodejs.org/en/download"
        ;;
      linux)
        gat_say "  nvm:       curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
        gat_say "             then: nvm install ${GAT_BOB_SHELL_MIN_NODE}"
        gat_say "  Installer: https://nodejs.org/en/download"
        ;;
    esac
    gat_say ""
    gat_die "Install Node, open a new terminal, and run this script again."
  fi

  if (( major < GAT_INSTALLER_MIN_NODE )); then
    gat_die "Node ${GAT_INSTALLER_MIN_NODE}+ is required to run this installer; found $(node --version)."
  fi

  if (( major < GAT_BOB_SHELL_MIN_NODE )); then
    gat_ok "Node $(node --version) — enough for this installer"
    gat_warn "Bob Shell itself needs Node ${GAT_BOB_SHELL_MIN_NODE} or later. Upgrade before running Bob."
  else
    gat_ok "Node $(node --version)"
  fi
}

# Find the kit. Either we are inside a checkout, or we fetch one into a cache
# directory so the script also works when piped straight from curl.
gat_resolve_kit() {
  local script_dir="$1" candidate
  candidate="$(cd "$script_dir/.." 2>/dev/null && pwd || printf '')"

  if [[ -n "$candidate" && -f "$candidate/src/cli.mjs" && -d "$candidate/payload" ]]; then
    GAT_KIT_DIR="$candidate"
    gat_ok "Using the kit in $(basename "$candidate")"
    return 0
  fi

  local cache="${XDG_CACHE_HOME:-$HOME/.cache}/gregorys-awesome-teams"
  command -v git >/dev/null 2>&1 || gat_die "git is required to fetch the kit. Install git, or clone the repository and run the script from inside it."

  if [[ -d "$cache/.git" ]]; then
    gat_say "Updating the cached kit..."
    if git -C "$cache" pull --ff-only --quiet 2>/dev/null; then
      gat_ok "Kit updated"
    else
      gat_warn "Could not update the cached kit; using the copy already on disk."
    fi
  else
    gat_say "Fetching the kit..."
    mkdir -p "$(dirname "$cache")"
    git clone --depth 1 --quiet "$GAT_REPO_URL" "$cache" \
      || gat_die "Could not clone ${GAT_REPO_URL}. Check your network, or clone it by hand and run the script from inside it."
    gat_ok "Kit fetched"
  fi

  [[ -f "$cache/src/cli.mjs" ]] || gat_die "The fetched kit looks incomplete: $cache/src/cli.mjs is missing."
  GAT_KIT_DIR="$cache"
}

gat_main() {
  local target="$PWD"
  local -a passthrough=()

  while (( $# )); do
    case "$1" in
      --target)
        [[ -n "${2:-}" ]] || gat_die "--target needs a directory"
        target="$2"; shift 2 ;;
      --target=*)
        target="${1#--target=}"; shift ;;
      -h|--help)
        gat_say "Usage: $(basename "${BASH_SOURCE[1]:-$0}") [--target <dir>] [--mode hosted|oauth|keyless|local] [--force] [--dry-run] [--verify]"
        gat_say ""
        gat_say "Installs the Bob harness kit into <dir> (default: the current directory)."
        return 0 ;;
      *)
        passthrough+=("$1"); shift ;;
    esac
  done

  gat_header
  gat_assert_platform
  gat_check_node

  [[ -d "$target" ]] || gat_die "Target directory does not exist: ${target}"
  target="$(cd "$target" && pwd)"
  gat_ok "Installing into ${target}"

  gat_resolve_kit "$GAT_SCRIPT_DIR"

  if ! command -v git >/dev/null 2>&1; then
    gat_warn "git was not found. The kit will install, but you will not be able to commit it."
  fi

  node "$GAT_KIT_DIR/src/cli.mjs" --target "$target" ${passthrough[@]+"${passthrough[@]}"}
}
