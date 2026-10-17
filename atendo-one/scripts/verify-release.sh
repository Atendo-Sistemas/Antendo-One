#!/usr/bin/env bash
set -Eeuo pipefail
RELEASE_DIR=${1:-$(cd "$(dirname "$0")/.." && pwd)}
ZIP=${2:-}
if [[ -n "$ZIP" ]]; then sha256sum -c "${ZIP}.sha256"; fi
[[ -f "$RELEASE_DIR/src/version.ts" ]] || { echo 'Versão inválida: src/version.ts ausente' >&2; exit 1; }
grep -q "APP_VERSION" "$RELEASE_DIR/src/version.ts"
cd "$RELEASE_DIR"
npm run lint
npm run build
npm test
echo 'RELEASE_VERIFICATION=PASS'
