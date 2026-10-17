# Release v1.8.26 — Correção do login por OTP WhatsApp

## Causa raiz

Após a solicitação do código OTP, a confirmação no frontend chamava `POST /api/auth/verify`. O backend da v1.8.25 registra exclusivamente `POST /api/auth/verify-otp`. O middleware de autenticação classificava o caminho como inexistente e respondia HTTP 404 com `Rota não encontrada.`. A captura fornecida reproduz esse comportamento na tela de confirmação do código.

## Correção

O cliente foi ajustado para chamar `/auth/verify-otp`, mantendo o prefixo `/api` aplicado pela função comum de requisição. Foi adicionado um teste de regressão que verifica o contrato entre cliente e servidor e impede o retorno do caminho incorreto.

## Impacto e segurança

A alteração é restrita ao endpoint de confirmação do OTP. Não altera configurações de WhatsApp, tokens, criptografia, `CONFIG_ENCRYPTION_KEY`, autorização, isolamento por tenant, limites de requisição ou persistência de dados.

## Validações

Foram executados com sucesso: `npm run lint`, `npm run build`, invariantes de OTP, WhatsApp por tenant, PWA, segurança HTTP e secret scan, além do teste específico `OTP_ROUTE_REGRESSION_PASS` e `git diff --check`.

O teste legado `tests/auth-session.invariants.cjs` permanece incompatível com o estado original entregue na v1.8.25: ele exige símbolos (`currentToken` e `AUTH_TOKEN_STORAGE_KEY`) que não existem no código baseline atual. Essa falha foi registrada, não mascarada nem corrigida fora do escopo do defeito.

## Limitação

Não foi possível executar uma confirmação OTP contra WhatsApp real sem credenciais, dados de produção ou disparo externo. A reprodução foi feita estaticamente e pelo contrato HTTP local, sem enviar mensagens ou acessar dados produtivos.
