#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://127.0.0.1:3000}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

request() {
  local name="$1" path="$2" expected="$3"
  local headers="$TMP_DIR/${name}.headers" body="$TMP_DIR/${name}.body" status
  status="$(curl -sS -D "$headers" -o "$body" -w '%{http_code}' "$BASE$path")"
  if [[ "$status" != "$expected" ]]; then
    echo "FAIL $name: status=$status esperado=$expected path=$path"
    sed -n '1,30p' "$body"
    exit 1
  fi
  echo "PASS $name status=$status"
}

has_body() {
  local name="$1" pattern="$2"
  grep -Eq "$pattern" "$TMP_DIR/${name}.body" || { echo "FAIL $name: corpo não contém $pattern"; exit 1; }
}

has_fixed_body() {
  local name="$1" text="$2"
  grep -Fq "$text" "$TMP_DIR/${name}.body" || { echo "FAIL $name: corpo não contém $text"; exit 1; }
}

has_header() {
  local name="$1" pattern="$2"
  grep -Eiq "$pattern" "$TMP_DIR/${name}.headers" || { echo "FAIL $name: cabeçalho não contém $pattern"; cat "$TMP_DIR/${name}.headers"; exit 1; }
}

request home / 200
has_body home 'Atendo One'
has_fixed_body home "rel=\"canonical\" href=\"${BASE}/\""
has_header home 'Content-Security-Policy:.*script-src.*sha256-b7b03057e94fe25acc9a10366b6cc21263896dd2ad2eac92946794b1306f9f6e'
has_header home 'Content-Security-Policy:.*frame-src .self. https://off\.atendo\.log\.br'

request favicon /favicon.svg 200
has_header favicon 'Content-Type: image/svg\+xml'
has_body favicon '<svg'

request robots /robots.txt 200
has_fixed_body robots "Sitemap: ${BASE}/sitemap.xml"

request sitemap /sitemap.xml 200
has_fixed_body sitemap "<loc>${BASE}/elo-log</loc>"
has_fixed_body sitemap "<loc>${BASE}/elo-log/sistema-tms</loc>"
has_body sitemap '<lastmod>[0-9]{4}-[0-9]{2}-[0-9]{2}T'
if grep -Eq 'termos-de-uso|politica-de-privacidade' "$TMP_DIR/sitemap.body"; then echo 'FAIL sitemap: páginas legais não devem entrar'; exit 1; fi

request content_index /conteudo 200
has_body content_index '<title>Conteúdos sobre transporte e gestão de fretes \| Atendo One</title>'
request content_detail /conteudo/sistema-de-gestao-de-transportes-tms 200
has_body content_detail 'BreadcrumbList'
has_fixed_body content_detail "rel=\"canonical\" href=\"${BASE}/conteudo/sistema-de-gestao-de-transportes-tms\""

request solution_index /elo-log 200
has_body solution_index '<title>Soluções para operações logísticas \| Atendo One</title>'
has_fixed_body solution_index 'href="/elo-log/sistema-tms"'
request solution_detail /elo-log/sistema-tms 200
has_body solution_detail 'Sistema TMS'
has_fixed_body solution_detail "rel=\"canonical\" href=\"${BASE}/elo-log/sistema-tms\""

request cross_editorial /conteudo/sistema-tms 404
has_body cross_editorial 'noindex,nofollow'
request cross_solution /elo-log/sistema-de-gestao-de-transportes-tms 404
has_body cross_solution 'noindex,nofollow'
request unknown /nao-existe-seo-audit 404
has_body unknown 'noindex,nofollow'

request api_seo /api/public/seo 200
has_body api_seo '"publicPath":"elo-log"'
request api_detail "/api/public/content/sistema-tms?section=elo-log" 200
has_fixed_body api_detail "\"canonicalUrl\":\"${BASE}/elo-log/sistema-tms\""
request api_cross "/api/public/content/sistema-tms?section=conteudo" 404
has_header api_seo 'Content-Type: application/json'
request api_unknown /api/rota-que-nao-existe 404
has_header api_unknown 'Content-Type: application/json'
has_body api_unknown 'Rota não encontrada'

HASH_ASSET="$(find /home/ubuntu/elolog-v165-workspace/dist/assets -maxdepth 1 -type f -name 'index-*.js' | head -1)"
if [[ -z "$HASH_ASSET" ]]; then echo 'FAIL asset: bundle hash não encontrado'; exit 1; fi
ASSET_PATH="/assets/$(basename "$HASH_ASSET")"
request hashed_asset "$ASSET_PATH" 200
has_header hashed_asset 'Cache-Control: public, max-age=31536000, immutable'

printf 'SEO_SMOKE=PASS\n'
