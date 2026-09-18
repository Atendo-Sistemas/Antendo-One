# Verificação HTTP/HTTPS em produção — 2026-08-28

## Home pública

- URL verificada: `https://gestor.atendo.log.br/`
- A página respondeu HTTP 200.
- O DOM efetivo não contém formulários (`document.forms` vazio).
- Não foram encontrados links, imagens, scripts, stylesheets ou ações de formulário com URL `http:` no DOM.
- Recursos externos observados foram carregados por HTTPS: widget do gateway, Cloudflare Insights, configuração do widget, trace do Cloudflare e Socket.IO do gateway.

## Cabeçalhos observados

- CSP presente com `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`, `form-action 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, Referrer-Policy restritiva e Permissions-Policy sem câmera/microfone/geolocalização.
- HSTS presente em HTTPS com `max-age=31536000; includeSubDomains`.
- HTTP simples redireciona com 301 para HTTPS.
- CSP ainda não inclui `upgrade-insecure-requests` nem `block-all-mixed-content`; não foi ativado nesta etapa porque o ambiente possui widget/gateway externo e a versão local corrigida ainda não foi publicada.
- O cabeçalho `server` externo é `cloudflare`; a origem não foi alterada nesta verificação.

## Conclusão provisória

Não foi reproduzido mixed content na home pública efetivamente entregue. O alerta do scanner deve ser reavaliado em rotas autenticadas, páginas públicas de conteúdo e recursos gerados pelo proxy/widget. A correção local de CSP e sanitização deverá ser validada depois do deploy da nova release.

## Conteúdo público adicional

A página `https://gestor.atendo.log.br/conteudo/gestao-de-fretes-para-transportadoras` também foi verificada. O canonical observado é HTTPS e o DOM não contém URLs `http:`. Os scripts efetivos foram carregados pela própria origem HTTPS, pelo gateway HTTPS e pelo Cloudflare HTTPS. A página não apresentou formulário público nem recurso misto nesta verificação.

## Login público

Na URL `https://gestor.atendo.log.br/login`, o formulário observado aponta para a própria URL HTTPS e usa método GET; não há ação HTTP. Os campos presentes são e-mail e senha, sem valores preenchidos. A inspeção de URLs HTTP no DOM não encontrou ocorrências, e a página não carregou recursos HTTP.

A versão atualmente entregue em produção ainda mostra o acesso de demonstração como entrada pública geral; o seletor de quatro perfis pertence às alterações locais ainda não publicadas e será validado na etapa de release.

## Configuração SaaS pública

A resposta pública de `https://gestor.atendo.log.br/api/saas/config` expôs somente `systemName`, contatos públicos, regras de cadastro/demo, planos, módulo público de notificações, layout, campos de formulário e SEO. Não apresentou chaves de banco, SMTP, Mapbox, Asaas, WhatsApp, tokens, senhas ou outros nomes de segredo; o teste de texto sensível também não encontrou correspondência.

## Push, CORS e saúde

O endpoint público de VAPID respondeu com uma chave pública presente e comprimento esperado, sem que seu valor fosse exibido. Uma requisição CORS preflight com origem não autorizada recebeu HTTP 403. O endpoint de saúde não retornou conteúdo adicional no teste anônimo além do comportamento esperado, e nenhum segredo foi coletado.
