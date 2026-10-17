# Atendo One — Release v1.7.20

## Implementado

Esta release adiciona o domínio inicial de **Orçamentos** em `Fretes → Orçamentos`, com criação, edição, visualização, duplicação, cancelamento, envio para análise, aprovação e conversão idempotente em frete. O orçamento mantém versões/snapshots, despesas calculadas por quantidade × valor unitário, impostos percentuais ou fixos, lucro percentual ou fixo e os valores separados de total do frete, valor passado ao motorista e valor pago ao motorista.

Os cálculos financeiros são refeitos no backend e o frontend exibe apenas uma prévia. A conversão só é permitida para orçamento aprovado e uma segunda conversão reutiliza o frete já criado. A API valida a empresa no servidor e filtra os orçamentos por tenant, com exceção do Super Admin.

Foi adicionada a migration aditiva `009_budgets_and_configurable_forms.sql`, contendo as tabelas de orçamentos, versões, formulários financeiros e histórico de localização. Nenhuma tabela, volume ou dado existente foi removido. O estado compatível em `DatabaseStore` também persiste `budgets` e `tenantBudgetForms` no snapshot atual.

## Validação

`npm run lint`, `npm test`, `node tests/budgets.invariants.cjs`, `npm run build`, `unzip -t` e `sha256sum -c` foram executados com sucesso. O checksum do pacote é `1b9802097fbab22d969092106457d008f63469aea2de6eadd44a8863c2d63a3d`.

## Limitações declaradas

Esta é a primeira implementação aditiva do domínio. A integração Mapbox de autocomplete/geocodificação/Directions no formulário de orçamento, os formulários financeiros configuráveis completos, os DTOs públicos configuráveis, o histórico de localização em runtime e a atualização em tempo real por SSE/WebSocket ainda exigem uma segunda etapa de integração; a migration já reserva estruturas para esses recursos. O fluxo legado de fretes foi preservado e não foi substituído automaticamente.
