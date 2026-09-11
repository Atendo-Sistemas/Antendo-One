# Auditoria das sugestões — v1.7.24

| Sugestão | Situação | Evidência ou motivo |
|---|---|---|
| Valor por km no orçamento | Implementada | Campo `pricePerKm`, cálculo server-side e teste dedicado |
| Custos, impostos e lucro | Implementada | `calculateBudget` recalcula subtotal, impostos, custo, lucro e total |
| Conversão idempotente | Implementada | Frete já convertido é retornado sem nova criação |
| Versionamento de orçamento | Implementada | `version`, snapshots e `expectedVersion` |
| Autocomplete Mapbox | Implementada | Endpoint protegido, coordenadas reais, debounce e cache local |
| Histórico GPS | Implementada | Persistência de breadcrumbs e endpoint autenticado |
| Rastreamento público seguro | Implementada | Token aleatório, DTO redigido, whitelist e precisão aproximada |
| Rastreamento em tempo real | Implementada | SSE público e publicação após atualização GPS |
| Expiração/revogação de links | Implementada | Campos de expiração/revogação e endpoint autenticado |
| Privacidade de telefone público | Implementada | Telefone removido do modal público e do DTO público |
| Paradas por empresa | Implementada anteriormente | Dados vinculados ao tenant e visibilidade por rota |
| Formulários por empresa/versionados | Implementada anteriormente | API de modelos BUDGET/EXPENSE e preservação de versões |
| Notificações contextuais | Implementada parcialmente | Tipos e navegação por `targetPath`; ainda depende de revisar cada produtor de evento |
| CRM Atendo | Implementada anteriormente | Provisionamento e diagnóstico de falhas já cobertos por testes |
| Asaas/WhatsApp | Implementada anteriormente | Configuração e isolamento já cobertos; teste real depende de credenciais |
| Operação offline | Implementada parcialmente | Fila local de respostas existe; sincronização operacional completa ainda é evolução futura |
| PDFs de despesas/checklists | Implementada anteriormente | Geradores existentes; PDF específico de orçamento ainda é melhoria futura |
| SSE/WebSocket | Implementada | SSE unidirecional foi implementado; WebSocket bidirecional não é necessário para o caso público |
| Painel de saúde | Implementada | `/api/health/detailed`, protegido para Super Admin |
| Testes de isolamento | Implementada anteriormente | Invariantes de tenant/demo existentes; E2E completo depende de ambiente de execução |
| 2FA e gestão avançada de sessões | Não implementada | Requer desenho de UX, recuperação e política de segurança; não foi ocultada como concluída |
| Criptografia de dados em repouso | Não implementada | Depende de estratégia de chaves, migração e operação segura |
| Migração JSONB para relacional | Não implementada | Projeto de migração de dados, não uma alteração segura sem planejamento |
| Pedágios/seguros/diárias | Não implementada | Regras de negócio e fontes de preço não foram especificadas |
| Deploy, Registry, Swarm, backup real | Bloqueada por produção | Exige acesso ao VPS, credenciais e autorização operacional |

## Conclusão

Todas as melhorias de baixo risco e executáveis localmente foram aplicadas nesta linha de release. Os itens marcados como parciais ou não implementados são explicitamente identificados porque exigem produto adicional, regras de negócio, desenho de segurança, migração de dados ou ambiente real. Nenhuma alteração de produção foi executada.
