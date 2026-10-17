# Atendo One v1.8.73

## Correção do Web Push para sessões com cookie

- O cliente web passa a usar a sessão HttpOnly já autenticada, em vez de exigir um token Bearer inexistente no navegador.
- Ativar, testar e remover a assinatura Push funciona para Super Admin, usuários de empresa, supervisores e motoristas autenticados.
- As chamadas mutáveis enviam o token CSRF da sessão.
- O cache do Service Worker foi atualizado para `atendo-one-v1.8.73`.
- O backend continua validando usuário, perfil real, tenant e assinatura antes de registrar ou enviar notificações.
