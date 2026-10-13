#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="${1:?Informe o diretório do backup: /caminho/elolog-backup-YYYYMMDD-HHMMSS}"
PG_CONTAINER="${PG_CONTAINER:?Defina PG_CONTAINER apontando para um PostgreSQL de homologação isolado}"
PG_USER="${PG_USER:-elolog_user}"
PG_DB="${PG_DB:-elolog}"
TEMP_DB="${TEMP_DB:-elolog_restore_verify_$(date +%Y%m%d%H%M%S)_$$}"

if [[ ! -d "$BACKUP_DIR" || ! -s "$BACKUP_DIR/postgres.sql" || ! -s "$BACKUP_DIR/source.tgz" ]]; then
  echo 'ERRO: backup incompleto; são necessários postgres.sql e source.tgz.' >&2
  exit 1
fi
if [[ "${ALLOW_RESTORE_VERIFY:-}" != 'YES' ]]; then
  echo 'BLOQUEADO: esta rotina é somente para homologação. Defina ALLOW_RESTORE_VERIFY=YES explicitamente.' >&2
  exit 2
fi
if [[ "$PG_CONTAINER" =~ (prod|production) ]]; then
  echo 'BLOQUEADO: o container parece ser de produção. Use uma base PostgreSQL isolada.' >&2
  exit 3
fi

cd "$BACKUP_DIR"
sha256sum -c SHA256SUMS

docker exec "$PG_CONTAINER" dropdb --if-exists -U "$PG_USER" "$TEMP_DB" >/dev/null 2>&1 || true
docker exec "$PG_CONTAINER" createdb -U "$PG_USER" "$TEMP_DB"
cleanup() {
  docker exec "$PG_CONTAINER" dropdb --if-exists -U "$PG_USER" "$TEMP_DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cat postgres.sql | docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$TEMP_DB" >/dev/null
USERS="$(docker exec "$PG_CONTAINER" psql -At -U "$PG_USER" -d "$TEMP_DB" -c 'SELECT count(*) FROM users;' 2>/dev/null || echo 0)"
TENANTS="$(docker exec "$PG_CONTAINER" psql -At -U "$PG_USER" -d "$TEMP_DB" -c 'SELECT count(*) FROM tenants;' 2>/dev/null || echo 0)"
[[ "$USERS" =~ ^[0-9]+$ && "$TENANTS" =~ ^[0-9]+$ ]]
printf 'RESTORE_VERIFY=PASS\nTEMP_DATABASE=%s\nUSERS=%s\nTENANTS=%s\n' "$TEMP_DB" "$USERS" "$TENANTS"
