# Atendo One — Release v1.7.23

## Entregue

O formulário de Orçamentos agora possui o campo dedicado **Valor por km rodado (R$/km)**. O servidor calcula o custo da rota como `distanceKm × pricePerKm`, soma esse custo ao subtotal, aplica os impostos sobre a base correta, calcula lucro e retorna o valor final. O resumo da interface também mostra separadamente o custo da rota. Orçamentos antigos sem `pricePerKm` continuam compatíveis e usam zero até serem editados.

A release também mantém as melhorias anteriores: autocomplete Mapbox com coordenadas reais, histórico GPS por frete/empresa, política pública por tenant, precisão aproximada, whitelist, formulários financeiros versionados, controle de concorrência com `expectedVersion`, conversão idempotente e navegação contextual de notificações.

Foram acrescentados ainda campos de expiração e revogação de links públicos. Tokens revogados ou vencidos deixam de ser aceitos pela rota pública.

## Validação

A suíte de invariantes, lint e build passaram. O build produz apenas o aviso de tamanho do bundle Mapbox. Nenhum deploy, alteração em PostgreSQL de produção ou mudança em volumes foi executado.

## Próximas implementações recomendadas

### Podem ser feitas no código sem acesso à produção

- Idempotency keys em publicação, aceite e notificações.
- Atualização pública por SSE/WebSocket.
- Interface administrativa para expirar/revogar link.
- Página pública dedicada de rastreamento.
- Debounce e cache no autocomplete Mapbox.
- Aplicar rota real em todos os fluxos legados de frete.
- Pedágios, seguros, diárias, ajudante e tabela de preços.
- Fluxo operacional completo do motorista e modo offline.
- Editor visual completo de formulários financeiros.
- PDF, aceite eletrônico e envio por WhatsApp/e-mail.
- Preenchimento automático de `entity`, `entityId` e `targetPath` em todos os eventos de notificação.
- Painel de saúde, logs com requestId e testes E2E de isolamento.
- Criptografia de dados pessoais em repouso, 2FA e gestão de sessões.
- Migração progressiva do snapshot JSONB para tabelas relacionais.

### Dependem de acesso ou autorização de produção

- Aplicar migration em PostgreSQL de produção.
- Backup e teste de restauração.
- Validar token real e limites do Mapbox.
- Testar GPS real com motorista.
- Auditar imagem/digest em todos os nós do Swarm.
- Publicar a imagem no Registry.
- Fazer deploy, rollback e failover.
- Testar integrações reais CRM, WhatsApp e Asaas.
