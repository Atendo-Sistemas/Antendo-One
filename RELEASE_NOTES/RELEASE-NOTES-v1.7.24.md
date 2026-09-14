# Atendo One — Release v1.7.24

## Entregas desta atualização

O formulário de Orçamentos recebeu o campo dedicado **Valor por km rodado (R$/km)**. O cálculo é feito no servidor usando distância multiplicada pelo valor por quilômetro; o custo da rota entra no subtotal, nos impostos, no lucro e no total do frete. O resumo do formulário exibe o custo da rota separadamente. Registros antigos sem esse campo permanecem compatíveis e assumem zero até serem editados.

O rastreamento público recebeu canal **SSE (Server-Sent Events)**, com atualização inicial e transmissão das novas posições GPS após persistência. O navegador passa a assinar os eventos pelo cliente de API. O modal público não exibe o telefone do motorista. Links públicos continuam protegidos por token aleatório, política por tenant, whitelist e precisão aproximada, e agora também podem ser revogados ou expirados.

Foi adicionado endpoint autenticado para revogar ou reativar o rastreamento público de um frete. Também foi adicionado diagnóstico detalhado protegido para Super Admin, sem expor tokens ou secrets. O autocomplete Mapbox recebeu debounce e cache local para reduzir chamadas repetidas.

A conversão de orçamento continua idempotente quando o orçamento já possui frete convertido e mantém a versão financeira usada na conversão. A suíte recebeu teste específico para o cálculo por quilômetro. Os formulários financeiros e o histórico de versões permanecem isolados por empresa.

## Validação

Passaram `npm run lint`, a suíte completa de invariantes, `npm run build`, `unzip -t` e `sha256sum -c`. O build apresenta somente o aviso não bloqueante de tamanho do bundle Mapbox.

## Limites honestos da execução local

Não foram executadas ações que dependem de acesso ao VPS, Docker Swarm, Registry, PostgreSQL de produção, volumes, backups reais ou credenciais externas. Também não é possível validar aqui a entrega física de GPS, Mapbox, CRM, WhatsApp e Asaas em produção. Essas verificações exigem o ambiente real e devem ser feitas no procedimento de implantação.

A migração integral do snapshot JSONB para tabelas relacionais, a operação offline completa do motorista, 2FA, criptografia de dados em repouso, WebSocket bidirecional e testes E2E com dois tenants continuam sendo projetos maiores que exigem desenho, testes adicionais e, em parte, infraestrutura. Nenhum deles foi falsamente marcado como concluído nesta release.
