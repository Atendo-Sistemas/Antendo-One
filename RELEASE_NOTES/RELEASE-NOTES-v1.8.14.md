# Atendo One v1.8.14

## Correção

O menu desktop do Super Admin foi reorganizado em quatro grupos compactos com submenus: **SaaS**, **Operação**, **Controle** e **Configurações**. A alteração evita a faixa extensa de itens exibida na versão anterior e mantém todas as rotas existentes acessíveis.

## Grupos

- **SaaS:** Empresas e Conteúdos.
- **Operação:** Fretes, Central, Clientes, Orçamentos e Motoristas.
- **Controle:** Contas, Formulários, Usuários e Auditoria.
- **Configurações:** SaaS, Notificações e Ajuda.

O menu mobile existente foi preservado. A release deve ser validada limpando o cache/PWA ou abrindo uma janela anônima após o rollout, pois assets antigos podem permanecer armazenados pelo service worker.

## Validação esperada

- `npm run lint`: PASS
- `npm test`: PASS
- `npm run build`: PASS
- Deploy: não executado automaticamente.
