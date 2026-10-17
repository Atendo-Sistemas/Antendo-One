# Auditoria de consistência — Antendo-One

## Escopo

Foi realizada uma revisão transversal das rotas HTTP, autenticação e renovação de sessão, autorização por perfil e tenant, formulários e respostas, visualização de perfis, navegação do frontend, contratos de resposta e arquivos de persistência do projeto.

## Correções aplicadas

### Autorização de perfis

A rota `PUT /users/:id` permitia que um usuário, inclusive um Super Admin, enviasse alterações para o próprio `role` ou `status`. Embora o fluxo normal da interface não exigisse isso, a API aceitava a combinação e poderia bloquear ou rebaixar a própria conta. A rota agora rejeita alterações do próprio papel ou status, mantendo a edição de dados cadastrais e senha.

### Despacho de respostas de formulário

A rota `POST /forms/send-dispatch` aceitava um `responseId` arbitrário, usava um tenant padrão quando o usuário não possuía tenant e retornava sucesso sem conferir se a resposta pertencia ao usuário, ao motorista ou à empresa. A rota agora exige uma resposta existente, aplica isolamento por tenant, restringe motoristas às próprias respostas e verifica a coerência do frete associado.

### Visualização por perfil

O menu do motorista apresentava atalhos para Veículos próprios, Central, Clientes e Orçamentos, mas o roteamento do aplicativo redirecionava essas telas para o portal do motorista. Esses atalhos foram removidos. A tela de Ajuda passou a ser uma aba válida para motoristas, e também foi incluída na lista de abas válidas do Super Admin, evitando redirecionamentos inesperados ao clicar no menu.

### Renovação de sessão

A correção anterior de renovação concorrente foi preservada: requisições simultâneas compartilham uma única operação de refresh, evitando a revogação indevida da família de refresh tokens.

## Pontos que permanecem como decisão de produto

A API permite que usuários de empresa com papel `USUARIO` ou `SUPERVISOR` consultem dados operacionais do próprio tenant e, em determinadas rotas, alterem fretes e status. Isso é coerente com o modelo operacional atualmente implementado, mas deve ser confirmado como matriz formal de permissões caso `USUARIO` deva ser somente leitura.

O despacho de checklist gera um link de compartilhamento WhatsApp e uma notificação interna; o código não realiza, nessa rota, envio SMTP direto para o destinatário informado. O contrato atual deve ser apresentado como “link preparado/notificação registrada”, ou a aplicação deve conectar esse fluxo a um provedor real de e-mail antes de declarar “enviado”.

## Persistência e arquivos de banco

Não foi encontrado arquivo local `.db` ou `.sqlite` no repositório. A persistência relacional esperada está representada por:

- `server/db/schema.sql`;
- `server/db/migrations/001_notification_deliveries.sql` até `009_budgets_and_configurable_forms.sql`;
- `ops/preservation-manifest.sql`;
- `ops/elolog-local-backup.sh`;
- `ops/elolog-local-backup.cron`;
- `ops/elolog-backup-dispatcher.sh`;
- `ops/elolog-local-backup.logrotate`.

Esses arquivos devem ser mantidos na entrega. O ZIP não deve excluir `server/db`, `ops`, `package-lock.json` ou os manifestos de migração. Arquivos `.env` e credenciais não devem ser distribuídos.

## Validação

A validação automatizada de lint e testes foi executada após as correções. Lint, suíte completa de testes e build foram concluídos com sucesso nesta rodada.
