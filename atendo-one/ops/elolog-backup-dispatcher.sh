#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

CONTROL_DIR="${ELOLOG_BACKUP_CONTROL_DIR:-/var/lib/elolog-backup}"
REQUEST_DIR="${ELOLOG_BACKUP_REQUEST_DIR:-$CONTROL_DIR/requests}"
BACKUP_COMMAND="${ELOLOG_BACKUP_COMMAND:-/usr/local/sbin/elolog-local-backup}"

[[ -d "$REQUEST_DIR" ]] || exit 0
[[ -x "$BACKUP_COMMAND" ]] || exit 1

request="$(find "$REQUEST_DIR" -maxdepth 1 -type f -name 'manual-*.request' -printf '%p\n' | sort | head -1)"
[[ -n "$request" ]] || exit 0

# O conteúdo do arquivo não é interpretado: sua existência é o único gatilho.
if "$BACKUP_COMMAND"; then
  rm -f -- "$request"
  exit 0
fi

# Código 75 indica que o backup diário/manual já está em execução. Mantém o
# pedido para a próxima varredura do cron. Outros erros consomem o pedido;
# o status detalhado fica no status.json e no log protegido.
status=$?
if [[ "$status" == "75" ]]; then
  exit 0
fi
rm -f -- "$request"
exit "$status"
