# Atendo One — Release v1.7.12

## Objetivo

Esta versão evita conflito com a release v1.7.11 e consolida a correção do destinatário das notificações de aprovação de empresas.

## Alterações

- A notificação `EMPRESA_APROVADA` prioriza explicitamente o responsável cadastrado (`EMPRESA_SUPER_ADMIN`) cujo e-mail corresponde ao e-mail da empresa.
- O número do responsável é usado como destinatário da mensagem; o número configurado como remetente do gateway não é usado como destinatário.
- Os Super Admins continuam recebendo o alerta operacional.
- A versão da aplicação, `package.json` e `package-lock.json` foram atualizados para `1.7.12` / `v1.7.12`.
- O pacote de imagem Docker recomendado para esta versão deve usar a tag `elolog-app:v1712-20260830`.

## Validação

- `npm run lint`: aprovado.
- Deploy Docker/Swarm: não executado nesta sessão; o ambiente de validação não possui Docker nem acesso ao host de produção.
