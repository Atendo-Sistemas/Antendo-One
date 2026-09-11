#!/usr/bin/env bash
set -Eeuo pipefail
SERVICE=${1:-elolog_app}
IMAGE_DIGEST=${2:?Informe a imagem:tag ou digest aprovado para rollback}
command -v docker >/dev/null || { echo 'Docker não encontrado' >&2; exit 1; }
echo "Rollback preparado para $SERVICE -> $IMAGE_DIGEST"
echo "Execute somente após conferir o manifesto e o digest:"
echo "docker service update --image '$IMAGE_DIGEST' --with-registry-auth '$SERVICE'"
echo "docker service ps '$SERVICE'"
