#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="${1:-}"
if [[ -z "$IMAGE" ]]; then
  echo "USAGE: $0 elolog-app:tag" >&2
  exit 2
fi
cd "$(dirname "$0")/.."

if grep -RInE 'DROP[[:space:]]+(TABLE|SCHEMA|DATABASE)|TRUNCATE|DELETE[[:space:]]+FROM|ALTER[[:space:]]+TABLE.*DROP' server/db/schema.sql server/db/migrations; then
  echo "DESTRUCTIVE_SQL_DETECTED" >&2
  exit 1
fi

PGCID="$(docker ps -q --filter name='elolog_postgres.1' | sed -n '1p')"
if [[ -z "$PGCID" ]]; then
  echo "POSTGRES_CONTAINER_NOT_FOUND" >&2
  exit 1
fi
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/root/elolog-deploy-${STAMP}"
mkdir -p "$BACKUP"
docker exec "$PGCID" sh -lc 'pg_dump -U elolog_user -d elolog --no-owner --no-privileges' > "$BACKUP/postgres-before.sql"
tar --exclude=node_modules --exclude=dist --exclude=.git -czf "$BACKUP/source-before.tgz" .
cat ops/preservation-manifest.sql | docker exec -i "$PGCID" psql -U elolog_user -d elolog > "$BACKUP/before-manifest.txt"
printf 'IMAGE_BEFORE=' > "$BACKUP/deploy-meta.txt"
docker service inspect elolog_app --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' >> "$BACKUP/deploy-meta.txt"
printf 'IMAGE_TARGET=%s\n' "$IMAGE" >> "$BACKUP/deploy-meta.txt"
printf 'VOLUME=' >> "$BACKUP/deploy-meta.txt"
docker volume inspect elo_log_postgres_data --format '{{.Name}}|{{.Mountpoint}}' >> "$BACKUP/deploy-meta.txt"

BEFORE_STATE="$(awk -F'|' '/^APP_STATE\|/ {print $3; exit}' "$BACKUP/before-manifest.txt")"
BEFORE_COUNTS="$(grep '^COUNTS|' "$BACKUP/before-manifest.txt" || true)"
BEFORE_TABLES="$(grep '^TABLE_COUNT|' "$BACKUP/before-manifest.txt" || true)"

docker service update --image "$IMAGE" --force --update-parallelism 1 --update-delay 10s --update-monitor 30s --update-failure-action rollback --update-max-failure-ratio 0 elolog_app
CID="$(docker ps -q --filter name='elolog_app.1' | sed -n '1p')"
if [[ -z "$CID" ]]; then
  echo "APP_CONTAINER_NOT_FOUND" >&2
  exit 1
fi
cat ops/preservation-manifest.sql | docker exec -i "$PGCID" psql -U elolog_user -d elolog > "$BACKUP/after-manifest.txt"
AFTER_STATE="$(awk -F'|' '/^APP_STATE\|/ {print $3; exit}' "$BACKUP/after-manifest.txt")"
AFTER_COUNTS="$(grep '^COUNTS|' "$BACKUP/after-manifest.txt" || true)"
AFTER_TABLES="$(grep '^TABLE_COUNT|' "$BACKUP/after-manifest.txt" || true)"
HTTP="$(curl -fsS -o /dev/null -w '%{http_code}' https://gestor.atendo.log.br/)"
if [[ "$BEFORE_STATE" == "$AFTER_STATE" ]]; then STATE_RESULT=MATCH; else STATE_RESULT=MISMATCH; fi
if [[ "$BEFORE_COUNTS" == "$AFTER_COUNTS" ]]; then COUNTS_RESULT=MATCH; else COUNTS_RESULT=MISMATCH; fi
if [[ "$BEFORE_TABLES" == "$AFTER_TABLES" ]]; then TABLES_RESULT=MATCH; else TABLES_RESULT=MISMATCH; fi
{
  printf 'HTTP=%s\n' "$HTTP"
  printf 'PRESERVATION_STATE_HASH=%s\n' "$STATE_RESULT"
  printf 'PRESERVATION_COUNTS=%s\n' "$COUNTS_RESULT"
  printf 'PRESERVATION_TABLES=%s\n' "$TABLES_RESULT"
  printf 'BACKUP=%s\n' "$BACKUP"
  if [[ "$HTTP" == 200 && "$STATE_RESULT" == MATCH && "$COUNTS_RESULT" == MATCH && "$TABLES_RESULT" == MATCH ]]; then
    echo 'PRESERVATION_RESULT=PASS'
  else
    echo 'PRESERVATION_RESULT=REVIEW_REQUIRED'
    exit 1
  fi
} | tee "$BACKUP/verification.txt"
chmod 600 "$BACKUP"/*
