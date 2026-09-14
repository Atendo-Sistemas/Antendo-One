# Atendo One — v1.7.29

## Correções

O AuditLogViewer passou a usar `createdAt`, com fallback seguro e validação de data para impedir `Invalid Date`. O backend registra o IP da requisição em todos os novos registros de auditoria, priorizando `X-Forwarded-For` e usando o endereço do socket como fallback.

O botão de acesso à vitrine **Fretes disponíveis** foi incluído nas ações da navegação mobile, permanecendo visível em PWA e navegadores de telas pequenas.

As rotas públicas de conteúdo foram movidas para antes da decisão de sessão no App. Dessa forma, `/conteudo`, `/conteudo/:slug`, `/elo-log`, `/elo-log/:slug` e `/vitrine-fretes` continuam carregando a página correspondente mesmo quando o navegador possui uma sessão autenticada, sem retornar ao painel.

## Validação

Foi incluído teste estrutural para data/IP, ação mobile e roteamento público. A release deve passar lint, suíte de testes, build, integridade do ZIP e checksum.
