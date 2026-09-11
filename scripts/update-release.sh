#!/usr/bin/env bash
set -Eeuo pipefail
RELEASE_DIR=${1:?Informe o diretório do release}
BACKUP_DIR=${2:-/var/backups/atendo-one/$(date -u +%Y%m%dT%H%M%SZ)}
mkdir -p "$BACKUP_DIR"
if [[ -n "${DATABASE_URL:-}" ]]; then pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"; fi
if [[ -d /var/lib/atendo-one ]]; then tar -czf "$BACKUP_DIR/app-state.tgz" -C /var/lib atendo-one; fi
"$RELEASE_DIR/scripts/verify-release.sh" "$RELEASE_DIR"
printf 'BACKUP_DIR=%s\nRELEASE_VALIDATED=PASS\nNEXT_STEP=review-and-deploy-with-approved-digest\n' "$BACKUP_DIR"
