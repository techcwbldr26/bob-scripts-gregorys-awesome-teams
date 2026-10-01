#!/usr/bin/env bash
# Static checks for every shell artefact in the repository.
# Runs in CI and is safe to run locally. shellcheck is used when present.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

targets=(
  scripts/install-macos-intel.sh
  scripts/install-macos-apple-silicon.sh
  scripts/install-linux.sh
  scripts/lib/common.sh
  scripts/lib/selfcheck.sh
  payload/examples/wizard-template.sh
)

status=0

printf 'bash -n\n'
for file in "${targets[@]}"; do
  if bash -n "$file" 2>/dev/null; then
    printf '  ok   %s\n' "$file"
  else
    printf '  FAIL %s\n' "$file"
    bash -n "$file" || true
    status=1
  fi
done

printf '\nshellcheck\n'
if command -v shellcheck >/dev/null 2>&1; then
  for file in "${targets[@]}"; do
    # SC1091: common.sh is sourced at runtime from a path shellcheck cannot follow.
    if shellcheck --severity=warning --exclude=SC1091 "$file"; then
      printf '  ok   %s\n' "$file"
    else
      printf '  FAIL %s\n' "$file"
      status=1
    fi
  done
else
  printf '  skipped (shellcheck is not installed)\n'
fi

printf '\nexecutable bits\n'
for file in scripts/install-*.sh payload/examples/wizard-template.sh; do
  if [[ -x "$file" ]]; then
    printf '  ok   %s\n' "$file"
  else
    printf '  FAIL %s is not executable\n' "$file"
    status=1
  fi
done

printf '\nno hardcoded secrets\n'
if grep -rInE 'fc-[0-9a-f]{8}' scripts payload src 2>/dev/null; then
  printf '  FAIL something looks like a real Firecrawl key\n'
  status=1
else
  printf '  ok   nothing resembling an API key\n'
fi

printf '\n'
if (( status == 0 )); then
  printf 'All shell checks passed.\n'
else
  printf 'Shell checks failed.\n'
fi
exit "$status"
