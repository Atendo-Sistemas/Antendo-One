# Atendo One — Release v1.7.22

## Implementado nesta release

A release mantém a auditoria de produção/Docker Swarm já concluída e concentra as melhorias funcionais restantes. Foram adicionados controle de concorrência otimista no update de orçamento, com `expectedVersion` e resposta `409` em caso de sobrescrita; endpoint autenticado de geocodificação Mapbox, sem exposição do token; salvamento de coordenadas reais nos endereços do orçamento; formulários financeiros por empresa em `/api/budget-forms`, com versionamento e desativação da versão anterior; breadcrumb GPS persistido por frete e empresa; política de rastreamento público por tenant, com whitelist, precisão aproximada por padrão e desligamento; e navegação contextual para notificações que possuam `targetPath`.

Os dados sensíveis continuam fora do DTO público. O histórico GPS possui retenção de 90 dias e limite máximo de 100.000 entradas. A conversão orçamento → frete continua idempotente.

## Validação

A suíte de invariantes passou integralmente, incluindo segurança, isolamento demo, CRM, notificações, rastreamento público, Asaas, HTTP, analytics, documentos legais, backup e SEO. `npm run lint` e `npm run build` também passaram. O único aviso do build é o tamanho elevado do chunk Mapbox após minificação.

## Itens que podem ser implementados em próximas releases

1. Migrar progressivamente o snapshot JSONB para tabelas relacionais transacionais.
2. Aplicar idempotency keys também em publicação de frete, aceite e notificações.
3. Implementar SSE/WebSocket para atualização de rastreamento sem polling.
4. Adicionar expiração e revogação manual de links públicos.
5. Criar página pública dedicada para rastreamento.
6. Completar editor visual de campos financeiros no FormBuilder.
7. Gerar PDF, aceite eletrônico e envio de orçamento por WhatsApp/e-mail.
8. Adicionar tabela de preços por rota, veículo, pedágio, seguro e diária.
9. Completar fluxo operacional do motorista com etapas, modo offline e desvio de rota.
10. Criar painel de saúde com banco, backups, containers, digest e integrações.
11. Adicionar testes E2E de tenant A contra tenant B.
12. Criar pipeline de release com imagem Docker, digest, manifesto e rollback.

Nenhum deploy, migration destrutiva, exclusão de volume ou alteração de PostgreSQL de produção foi executado nesta sessão.
