#!/usr/bin/env sh
set -eu

usage() {
  echo "Usage: sh scripts/publish-with-env-token.sh --packages <pkg1,pkg2>" >&2
}

PACKAGES=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --packages)
      PACKAGES="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [ -z "$PACKAGES" ]; then
  echo "Missing required --packages argument." >&2
  usage
  exit 1
fi

if ! command -v dotenvx >/dev/null 2>&1; then
  echo "dotenvx is required but not found in PATH." >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  echo ".env not found at repository root." >&2
  exit 1
fi

FIRST_PACKAGE="$(printf '%s' "$PACKAGES" | cut -d',' -f1 | tr -d '[:space:]')"
if [ -z "$FIRST_PACKAGE" ]; then
  echo "Could not parse first package from --packages." >&2
  exit 1
fi

RELEASE_TARGET_PACKAGES="$PACKAGES" \
RELEASE_FIRST_PACKAGE="$FIRST_PACKAGE" \
dotenvx run -- sh -c '
  set -eu
  : "${NPM_TOKEN:?NPM_TOKEN must be present in .env}"
  : "${RELEASE_TARGET_PACKAGES:?Missing RELEASE_TARGET_PACKAGES}"
  : "${RELEASE_FIRST_PACKAGE:?Missing RELEASE_FIRST_PACKAGE}"

  tmp_npmrc="$(mktemp)"
  cleanup() {
    rm -f "$tmp_npmrc"
  }
  trap cleanup EXIT INT TERM

  printf "//registry.npmjs.org/:_authToken=%s\n" "$NPM_TOKEN" > "$tmp_npmrc"
  export NPM_CONFIG_USERCONFIG="$tmp_npmrc"

  npm whoami >/dev/null
  npm view "$RELEASE_FIRST_PACKAGE" versions --json >/dev/null

  bun run release:publish:packages -- --packages "$RELEASE_TARGET_PACKAGES"
'
