#!/usr/bin/env bash
#
# Wizard template — the fixed library half of a $wizard script.
#
# Everything above the "--- STAGES ---" marker is a library. Copy it unchanged
# into every wizard you generate; the consistency is the point. Author only the
# stages below the marker, and set TOTAL_STAGES.
#
# The agent that writes a wizard never runs it: it opens browsers and blocks on
# human input. Verify statically instead — `bash -n`, `shellcheck`, and a trace
# that every captured value lands where scoping said it would.

set -uo pipefail

# ----------------------------------------------------------------------------
# Configuration — set these per wizard
# ----------------------------------------------------------------------------
TOTAL_STAGES=3
WIZARD_TITLE="Project setup"
ENV_FILE="${ENV_FILE:-.env}"
SECONDS_PER_STAGE=90

# ----------------------------------------------------------------------------
# Library — do not hand-edit below this line until the STAGES marker
# ----------------------------------------------------------------------------
CURRENT_STAGE=0
declare -a SKIPPED=()
declare -a WROTE=()

if [[ -t 1 ]] && [[ "${NO_COLOR:-}" == "" ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; BLUE=''; RESET=''
fi

say()   { printf '%s\n' "$*"; }
info()  { printf '%s\n' "${BLUE}·${RESET} $*"; }
ok()    { printf '%s\n' "${GREEN}✓${RESET} $*"; }
warn()  { printf '%s\n' "${YELLOW}!${RESET} $*" >&2; }
fail()  { printf '%s\n' "${RED}✗${RESET} $*" >&2; }

# Record something we could not do, for the closing summary.
note_skipped() { SKIPPED+=("$1"); warn "$1"; }
note_wrote()   { WROTE+=("$1"); }

# stage <title> — clear the screen and print the header.
# Each stage must fit one screen: whatever scrolls away is lost.
stage() {
  CURRENT_STAGE=$((CURRENT_STAGE + 1))
  local remaining=$(((TOTAL_STAGES - CURRENT_STAGE + 1) * SECONDS_PER_STAGE / 60))
  clear 2>/dev/null || true
  printf '%s\n' "${BOLD}${WIZARD_TITLE}${RESET}"
  printf '%s\n' "${DIM}Stage ${CURRENT_STAGE} of ${TOTAL_STAGES} · about ${remaining} min remaining${RESET}"
  printf '%s\n\n' "${BOLD}$1${RESET}"
}

# open_url <url> — cross-platform, including WSL. Always open the page BEFORE
# asking for a value from it: never ask a human to paste something you have not
# sent them to fetch.
open_url() {
  local url="$1"
  info "Opening: ${url}"
  if command -v wslview >/dev/null 2>&1; then wslview "$url" >/dev/null 2>&1 && return 0; fi
  if grep -qi microsoft /proc/version 2>/dev/null && command -v explorer.exe >/dev/null 2>&1; then
    explorer.exe "$url" >/dev/null 2>&1; return 0
  fi
  if command -v open     >/dev/null 2>&1; then open "$url"     >/dev/null 2>&1 && return 0; fi
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 && return 0; fi
  warn "Could not open a browser. Visit this URL yourself:"
  say  "    ${url}"
}

# env_get <KEY> — read a value already saved, so a re-run offers it as a default.
env_get() {
  [[ -f "$ENV_FILE" ]] || return 1
  local line
  line=$(grep -E "^${1}=" "$ENV_FILE" | tail -n 1) || return 1
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}"
}

# env_set <KEY> <VALUE> — idempotent upsert. Replaces the line if the key is
# there, appends if not. Never duplicates a key.
env_set() {
  local key="$1" value="$2" tmp
  touch "$ENV_FILE"
  tmp=$(mktemp)
  if grep -qE "^${key}=" "$ENV_FILE"; then
    grep -vE "^${key}=" "$ENV_FILE" > "$tmp"
  else
    cat "$ENV_FILE" > "$tmp"
  fi
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  note_wrote "${key} → ${ENV_FILE}"
  ok "Saved ${key} to ${ENV_FILE}"
}

# ask <KEY> <prompt> — visible input, offering any saved value as the default.
ask() {
  local key="$1" prompt="$2" existing answer
  existing=$(env_get "$key" || true)
  if [[ -n "${existing:-}" ]]; then
    printf '%s\n' "${prompt}"
    printf '%s' "  [Enter to keep the saved value] > "
  else
    printf '%s\n' "${prompt}"
    printf '%s' "  > "
  fi
  # Backspace works; arrow keys insert escape sequences. Delete back to a
  # mistake rather than moving the cursor into it.
  IFS= read -r answer
  if [[ -z "$answer" && -n "${existing:-}" ]]; then
    ok "Keeping the existing ${key}"
    printf '%s' "$existing"
    return 0
  fi
  while [[ -z "$answer" ]]; do
    fail "That cannot be empty."
    printf '%s' "  > "
    IFS= read -r answer
  done
  printf '%s' "$answer"
}

# ask_secret <KEY> <prompt> — hidden input. Nothing sensitive in the scrollback.
ask_secret() {
  local key="$1" prompt="$2" existing answer
  existing=$(env_get "$key" || true)
  printf '%s\n' "${prompt}"
  if [[ -n "${existing:-}" ]]; then
    printf '%s' "  [hidden; Enter to keep the saved value] > "
  else
    printf '%s' "  [hidden] > "
  fi
  IFS= read -rs answer
  printf '\n'
  if [[ -z "$answer" && -n "${existing:-}" ]]; then
    ok "Keeping the existing ${key}"
    printf '%s' "$existing"
    return 0
  fi
  while [[ -z "$answer" ]]; do
    fail "That cannot be empty."
    printf '%s' "  [hidden] > "
    IFS= read -rs answer
    printf '\n'
  done
  printf '%s' "$answer"
}

# confirm <prompt> — gate for anything irreversible. Requires a typed "yes".
confirm() {
  local answer
  printf '%s\n' "${YELLOW}${1}${RESET}"
  printf '%s' "  Type 'yes' to continue, anything else to skip > "
  IFS= read -r answer
  [[ "$answer" == "yes" ]]
}

# pause — let the human finish on the page before the next screen clears it.
pause() {
  printf '\n%s' "${DIM}Press Enter when you are done on that page...${RESET}"
  IFS= read -r _
}

# gh_ready — is the GitHub CLI usable? A missing `gh` degrades a stage to a
# warning; it never fails the run.
gh_ready() {
  command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1
}

# set_secret <NAME> <VALUE> — a GitHub Actions secret. Every NAME here must
# match a real `secrets.NAME` reference in .github/workflows/.
set_secret() {
  local name="$1" value="$2"
  if ! gh_ready; then
    note_skipped "GitHub secret ${name} — set it by hand (gh unavailable or not logged in)"
    return 0
  fi
  if printf '%s' "$value" | gh secret set "$name" >/dev/null 2>&1; then
    note_wrote "${name} → GitHub secret"
    ok "Set GitHub secret ${name}"
  else
    note_skipped "GitHub secret ${name} — the gh call failed, set it by hand"
  fi
}

# set_variable <NAME> <VALUE> — a non-sensitive GitHub Actions variable.
set_variable() {
  local name="$1" value="$2"
  if ! gh_ready; then
    note_skipped "GitHub variable ${name} — set it by hand (gh unavailable or not logged in)"
    return 0
  fi
  if gh variable set "$name" --body "$value" >/dev/null 2>&1; then
    note_wrote "${name} → GitHub variable"
    ok "Set GitHub variable ${name}"
  else
    note_skipped "GitHub variable ${name} — the gh call failed, set it by hand"
  fi
}

# finish — the closing summary. What was written, and separately, what the human
# still has to do. Always print both lists.
finish() {
  clear 2>/dev/null || true
  printf '%s\n\n' "${BOLD}${WIZARD_TITLE} — done${RESET}"
  if ((${#WROTE[@]})); then
    printf '%s\n' "${GREEN}Written:${RESET}"
    printf '  ✓ %s\n' "${WROTE[@]}"
  else
    printf '%s\n' "${DIM}Nothing was written.${RESET}"
  fi
  printf '\n'
  if ((${#SKIPPED[@]})); then
    printf '%s\n' "${YELLOW}You still need to do these by hand:${RESET}"
    printf '  ! %s\n' "${SKIPPED[@]}"
    printf '\n'
  else
    printf '%s\n\n' "${GREEN}Nothing left to do by hand.${RESET}"
  fi
  say "${DIM}Re-running is safe: saved values are offered back as defaults.${RESET}"
}

trap 'printf "\n%s\n" "Interrupted. Re-run to pick up where you left off."; exit 130' INT

# ----------------------------------------------------------------------------
# --- STAGES ---
# Author below. One stage per screen, in dependency order. Keep TOTAL_STAGES
# above in step with the number of `stage` calls.
# ----------------------------------------------------------------------------

stage "Create a Firecrawl account and API key"
say "Firecrawl gives your agent real web access. The free tier is 1,000 credits"
say "a month, refreshed monthly, and needs no credit card."
say ""
open_url "https://www.firecrawl.dev/signup"
say ""
say "On that page:"
say "  1. Sign up (GitHub sign-in is quickest)."
say "  2. Connect a social account for the bonus free credits."
say "  3. Go to Dashboard → API Keys → Create API Key → Copy."
pause
FIRECRAWL_KEY=$(ask_secret "FIRECRAWL_API_KEY" "Paste your Firecrawl API key (it starts with fc-):")
if [[ "$FIRECRAWL_KEY" != fc-* ]]; then
  warn "That does not start with 'fc-'. Saving it anyway, but check it if calls fail."
fi
env_set "FIRECRAWL_API_KEY" "$FIRECRAWL_KEY"
set_secret "FIRECRAWL_API_KEY" "$FIRECRAWL_KEY"

stage "Name your project"
say "This becomes the display name in the demo UI. It is not sensitive."
say ""
PROJECT_NAME=$(ask "PROJECT_NAME" "What is your project called?")
env_set "PROJECT_NAME" "$PROJECT_NAME"
set_variable "PROJECT_NAME" "$PROJECT_NAME"

stage "Confirm the demo seed data"
say "The demo corpus is reset from a fixture so a rehearsal always starts clean."
say "This deletes anything currently in the local demo database."
say ""
if confirm "Reset the local demo database now?"; then
  ok "Reset the demo database (wire your real reset command in here)."
else
  note_skipped "Demo database reset — run it yourself before rehearsing"
fi

finish
