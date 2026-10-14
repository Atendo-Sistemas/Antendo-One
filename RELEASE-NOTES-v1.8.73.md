# Atendo One v1.8.73 — suporte ao beta Android Motorista

## Objetivo

Preparar o Gestor para o aplicativo Android interno exclusivo para motoristas, sem alterar o comportamento do acesso web.

## Alterações

- O cliente identificado por `X-Atendo-Client: atendo-one-motorista-beta` recebe access token e refresh token no login por senha ou OTP.
- O refresh token nativo continua com rotação e expiração do fluxo existente.
- O cliente Android usa Bearer token e não depende de cookies ou CSRF de navegador.
- Foi adicionado o endpoint autenticado `/mobile/push-token` para registrar e remover tokens Expo.
- Os tokens são associados ao usuário e ao tenant da sessão; um token já vinculado a outra conta é rejeitado.
- O dispatcher de notificações pode entregar para Web Push ou Expo Push, mantendo o filtro de usuário e empresa.
- Perfis de teste, demo, usuários que não sejam motoristas e sessões de outra empresa não podem registrar notificações mobile.

## Validação

- Suíte oficial de testes: aprovada.
- TypeScript: aprovado.
- Nenhum segredo, token, senha ou arquivo `.env` foi incluído no pacote.

## Implantação

Esta release ainda não foi publicada na VPS. Antes de subir, executar backup PostgreSQL, validar a imagem, atualizar o serviço com `start-first`, testar login OTP e somente depois remover imagens antigas preservando a imagem ativa e o rollback.
