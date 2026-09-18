#!/usr/bin/env bash
set -Eeuo pipefail

# Backup local do Atendo One. A cópia externa ainda não está configurada.
umask 077

BACKUP_ROOT="${ELOLOG_BACKUP_ROOT:-/root/elolog-backups}"
SOURCE_DIR="${ELOLOG_SOURCE_DIR:-/opt/elolog}"
SERVICE="${ELOLOG_SERVICE:-elolog_app}"
RETENTION="${ELOLOG_BACKUP_RETENTION:-3}"
CONTROL_DIR="${ELOLOG_BACKUP_CONTROL_DIR:-/var/lib/elolog-backup}"
STATUS_FILE="${ELOLOG_BACKUP_STATUS_FILE:-$CONTROL_DIR/status.json}"
REQUEST_DIR="${ELOLOG_BACKUP_REQUEST_DIR:-$CONTROL_DIR/requests}"
EVENT_URL="${ELOLOG_BACKUP_EVENT_URL:-https://gestor.atendo.log.br/api/internal/backups/event}"
EVENT_SECRET_FILE="${ELOLOG_BACKUP_EVENT_SECRET_FILE:-/etc/elolog/backup-event-secret}"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN_ID="${STAMP}-$$"
RUN_DIR="$BACKUP_ROOT/.inprogress-$STAMP-$$"
FINAL_DIR="$BACKUP_ROOT/elolog-backup-$STAMP"
LOCK_FILE="/run/lock/elolog-local-backup.lock"
STATUS_STATE="UNKNOWN"
STATUS_ERROR=""
BACKUP_NAME=""

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$*"
}

write_status() {
  local state="$1"
  local error_code="${2:-}"
  local backup_name="${3:-}"
  STATUS_STATE="$state"
  STATUS_ERROR="$error_code"
  BACKUP_NAME="$backup_name"
  export BACKUP_ROOT STATUS_FILE REQUEST_DIR RETENTION RUN_ID STATUS_STATE STATUS_ERROR BACKUP_NAME
  python3 - <<'PY'
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone

root = os.environ['BACKUP_ROOT']
status_file = os.environ['STATUS_FILE']
request_dir = os.environ['REQUEST_DIR']
retention = int(os.environ.get('RETENTION', '3'))
state = os.environ.get('STATUS_STATE', 'UNKNOWN')
error_code = os.environ.get('STATUS_ERROR', '') or None
run_id = os.environ.get('RUN_ID', '')
backup_name = os.environ.get('BACKUP_NAME', '') or None
now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

previous = {}
try:
    with open(status_file, 'r', encoding='utf-8') as handle:
        previous = json.load(handle)
except (FileNotFoundError, json.JSONDecodeError, OSError):
    previous = {}

items = []
pattern = re.compile(r'^elolog-backup-\d{8}-\d{6}$')
try:
    names = sorted((name for name in os.listdir(root) if pattern.fullmatch(name)), reverse=True)
except OSError:
    names = []

for name in names[:retention]:
    directory = os.path.join(root, name)
    generated_at = None
    metadata = os.path.join(directory, 'metadata.txt')
    try:
        with open(metadata, 'r', encoding='utf-8', errors='replace') as handle:
            for line in handle:
                if line.startswith('generated_at='):
                    generated_at = line.strip().split('=', 1)[1]
                    break
    except OSError:
        pass
    size_bytes = 0
    try:
        for entry in os.scandir(directory):
            if entry.is_file(follow_symlinks=False):
                size_bytes += entry.stat(follow_symlinks=False).st_size
    except OSError:
        pass
    verified = False
    try:
        result = subprocess.run(
            ['sha256sum', '-c', 'SHA256SUMS'],
            cwd=directory,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            timeout=30,
        )
        verified = result.returncode == 0
    except (OSError, subprocess.SubprocessError):
        verified = False
    items.append({
        'name': name,
        'generatedAt': generated_at,
        'sizeBytes': size_bytes,
        'verified': verified,
        'status': 'SUCCESS' if verified else 'UNKNOWN',
    })

if state == 'SUCCESS':
    last_success = now
    last_error = previous.get('lastErrorAt')
    last_error_message = previous.get('lastErrorMessage')
else:
    last_success = previous.get('lastSuccessAt')
    last_error = now if state == 'ERROR' else previous.get('lastErrorAt')
    last_error_message = error_code if state == 'ERROR' else previous.get('lastErrorMessage')

try:
    pending = any(name.startswith('manual-') and name.endswith('.request') for name in os.listdir(request_dir))
except OSError:
    pending = False

payload = {
    'state': state,
    'lastSuccessAt': last_success,
    'lastErrorAt': last_error,
    'lastErrorMessage': last_error_message,
    'backups': items,
    'manualRequestPending': pending,
    'retention': retention,
    'schedule': 'Diário às 03:00 (America/Sao_Paulo)',
    'runId': run_id,
    'backupName': backup_name,
    'updatedAt': now,
}
os.makedirs(os.path.dirname(status_file), mode=0o700, exist_ok=True)
fd, temp_path = tempfile.mkstemp(prefix='.status-', dir=os.path.dirname(status_file), text=True)
os.chmod(temp_path, 0o600)
try:
    with os.fdopen(fd, 'w', encoding='utf-8') as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(',', ':'))
        handle.write('\n')
    os.replace(temp_path, status_file)
finally:
    try:
        os.unlink(temp_path)
    except FileNotFoundError:
        pass
PY
}

send_event() {
  local state="$1"
  local backup_name="${2:-}"
  local error_code="${3:-}"
  [[ -n "$EVENT_URL" && -r "$EVENT_SECRET_FILE" ]] || return 0
  command -v curl >/dev/null 2>&1 || return 0
  command -v openssl >/dev/null 2>&1 || return 0
  local timestamp
  timestamp="$(date +%s)"
  local signing_input="${timestamp}.${state}.${RUN_ID}"
  local secret
  secret="$(cat "$EVENT_SECRET_FILE")"
  [[ -n "$secret" ]] || return 0
  local signature
  signature="$(printf '%s' "$signing_input" | openssl dgst -sha256 -hmac "$secret" -hex | awk '{print $2}')"
  [[ "$signature" =~ ^[0-9a-f]{64}$ ]] || return 0
  local body
  body="$(printf '{"state":"%s","timestamp":%s,"runId":"%s","backupName":"%s","errorCode":"%s"}' \
    "$state" "$timestamp" "$RUN_ID" "$backup_name" "$error_code")"
  if ! curl -fsS --max-time 15 -X POST "$EVENT_URL" \
    -H 'Content-Type: application/json' \
    -H "X-Backup-Signature: sha256=$signature" \
    --data "$body" >/dev/null 2>&1; then
    log "AVISO: não foi possível enviar o evento de backup ao painel"
  fi
}

cleanup() {
  if [[ -d "$RUN_DIR" ]]; then
    rm -rf -- "$RUN_DIR"
  fi
}

on_exit() {
  local rc=$?
  trap - EXIT
  set +e
  if (( rc != 0 && rc != 75 )); then
    write_status 'ERROR' 'BACKUP_FAILED' ''
    cleanup
    send_event 'ERROR' '' 'BACKUP_FAILED'
  else
    cleanup
  fi
  exit "$rc"
}
trap on_exit EXIT

if ! [[ "$RETENTION" =~ ^[1-9][0-9]*$ ]]; then
  log 'ERRO: ELOLOG_BACKUP_RETENTION deve ser um inteiro positivo'
  exit 2
fi
if [[ ! -d "$SOURCE_DIR" ]]; then
  log 'ERRO: diretório de fonte não encontrado'
  exit 1
fi
if ! command -v flock >/dev/null 2>&1; then
  log 'ERRO: flock não encontrado'
  exit 1
fi

install -d -m 700 "$BACKUP_ROOT" "$CONTROL_DIR" "$REQUEST_DIR" "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log 'Outro backup já está em execução; esta execução foi adiada'
  exit 75
fi

mkdir -p -m 700 "$RUN_DIR"
write_status 'RUNNING' '' ''
log 'Iniciando backup local'

PG_CONTAINER="$(docker ps -q --filter name='elolog_postgres.1' | head -1)"
if [[ -z "$PG_CONTAINER" ]]; then
  log 'ERRO: container PostgreSQL não encontrado'
  exit 1
fi

# A fonte é armazenada sem Git, dependências, build e arquivos .env.
tar --warning=no-file-changed \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*/.env' \
  --exclude='*/.env.*' \
  -czf "$RUN_DIR/source.tgz" -C "$SOURCE_DIR" .

# O dump contém os dados de produção e fica protegido por permissões 600.
docker exec "$PG_CONTAINER" pg_dump -U elolog_user -d elolog \
  --format=plain --no-owner --no-privileges > "$RUN_DIR/postgres.sql"

if [[ ! -s "$RUN_DIR/source.tgz" || ! -s "$RUN_DIR/postgres.sql" ]]; then
  log 'ERRO: backup vazio ou incompleto'
  exit 1
fi
if ! tail -n 20 "$RUN_DIR/postgres.sql" | grep -Fq -- '-- PostgreSQL database dump complete'; then
  log 'ERRO: dump PostgreSQL não terminou com marcador de conclusão'
  exit 1
fi
if tar -tzf "$RUN_DIR/source.tgz" | grep -E '(^|/)\.env($|\.)' >/dev/null; then
  log 'ERRO: arquivo .env detectado no pacote de fonte'
  exit 1
fi

# Metadados não incluem variáveis de ambiente, valores de secrets ou tokens.
{
  printf 'generated_at=%s\n' "$(date --iso-8601=seconds)"
  printf 'hostname=%s\n' "$(hostname -s)"
  printf 'service=%s\n' "$SERVICE"
  printf 'active_image='
  docker service inspect "$SERVICE" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
  printf 'replicas='
  docker service ls --filter "name=$SERVICE" --format '{{.Replicas}}'
  printf 'postgres_container_present=true\n'
  printf 'docker_secret_count='
  docker secret ls --filter name=elolog --format '{{.Name}}' | wc -l
} > "$RUN_DIR/metadata.txt"
chmod 600 "$RUN_DIR"/*

(
  cd "$RUN_DIR"
  sha256sum source.tgz postgres.sql metadata.txt > SHA256SUMS
  sha256sum -c SHA256SUMS > verify.txt
)
chmod 600 "$RUN_DIR/SHA256SUMS" "$RUN_DIR/verify.txt"
mv -- "$RUN_DIR" "$FINAL_DIR"
BACKUP_NAME="$(basename "$FINAL_DIR")"

# Só depois da criação e verificação, mantém os RETENTION diretórios mais recentes.
mapfile -t backups < <(
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d \
    -name 'elolog-backup-????????-??????' -printf '%f\n' | sort -r
)
for ((index=RETENTION; index<${#backups[@]}; index++)); do
  rm -rf -- "$BACKUP_ROOT/${backups[$index]}"
done

write_status 'SUCCESS' '' "$BACKUP_NAME"
send_event 'SUCCESS' "$BACKUP_NAME" ''
log "Backup concluído: $BACKUP_NAME"
log "Backups locais preservados: $(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name 'elolog-backup-????????-??????' -printf '%f\n' | sort -r | tr '\n' ' ')"
