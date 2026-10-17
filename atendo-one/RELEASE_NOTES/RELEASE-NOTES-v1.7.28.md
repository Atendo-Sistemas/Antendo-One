# Atendo One — v1.7.28

## Entregas

Foi adicionado ao modal de detalhes do frete o controle visual para **revogar ou reativar o link público de rastreamento**, limitado ao administrador. A ação chama o endpoint autenticado existente e atualiza imediatamente o estado visual do frete.

A auditoria também confirmou que a sincronização automática da fila offline de formulários já estava implementada no cliente, com reenvio quando a conexão é restabelecida e retenção dos itens que falham. O SSE público, a revogação backend, o cache Mapbox e o diagnóstico de saúde também permanecem ativos.

## Validação

A release é validada com lint, testes, build, integridade do ZIP e checksum. Nenhuma alteração de produção é executada.
