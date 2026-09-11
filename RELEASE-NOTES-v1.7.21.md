# Atendo One — Release v1.7.21

## Correções entregues

A release conclui a integração de endereços do módulo de Orçamentos com o Mapbox. As sugestões são consultadas pelo backend autenticado, sem expor o token Mapbox ao navegador. Ao selecionar uma sugestão, o orçamento grava endereço, cidade, estado, latitude, longitude e `mapboxPlaceId`, permitindo que a rota posterior utilize coordenadas reais.

O endpoint de atualização GPS agora mantém breadcrumb persistido por frete e empresa em `freightLocations`, com consulta autenticada em `/api/freights/:id/locations`. O histórico é limitado aos últimos 90 dias e a 100.000 entradas para evitar crescimento ilimitado do snapshot JSONB.

O endpoint público de rastreamento passou a aplicar política de campos permitidos e precisão. Por padrão a localização pública é aproximada em duas casas decimais; campos sensíveis como pagamento e dados de contato permanecem fora do payload. A configuração pode desativar o rastreamento público e definir os campos permitidos em `publicTracking`.

O módulo de Orçamentos da v1.7.20 foi preservado, incluindo cálculos server-side, versionamento e conversão idempotente em frete. Os campos de formulário financeiro e os tipos `CURRENCY`, `CALCULATED`, `QUANTITY` e `UNIT_PRICE` permanecem disponíveis para o FormBuilder/configuração por tenant.

## Validação

Foram executados com sucesso:

- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`
- teste de integridade do ZIP
- verificação do SHA-256 do pacote

O build apresentou apenas o aviso já conhecido de chunks Mapbox grandes após minificação; não houve erro de compilação.

## Implantação

Nenhum deploy, alteração de banco de produção, remoção de volume, migration destrutiva ou alteração de PostgreSQL foi executado neste ambiente. A migration `009_budgets_and_configurable_forms.sql` continua aditiva e deve ser aplicada conforme o procedimento de manutenção do ambiente de destino.
