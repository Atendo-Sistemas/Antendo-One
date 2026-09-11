# Atendo One v1.8.20

## Persistência de credenciais de API

A auditoria confirmou o armazenamento criptografado e a hidratação do WhatsApp, Mapbox, SMTP, Asaas e Atendo CRM. A configuração Mapbox agora possui segredo separado em `app_secrets`, sem depender do snapshot JSONB. O mapa autenticado recebe apenas um token público Mapbox `pk.*` através de endpoint de runtime; chaves que não são públicas não são expostas ao frontend.

## Orçamento e novo frete

O formulário de novo frete agora permite escolher um orçamento ainda não convertido. A seleção preenche origem, destino, carga, peso, volume e valores, e registra o código/status do orçamento no `customData` do frete. O backend valida que o orçamento pertence ao mesmo tenant e não foi convertido.

## Mapbox

O novo frete usa a mesma lógica de pesquisa de endereços do orçamento, com sugestões geocodificadas, coordenadas e `mapboxPlaceId`. A rota pode ser calculada diretamente no formulário; a distância e o tempo retornados pelo Mapbox são exibidos e a distância calculada é enviada ao backend. O orçamento mantém o cálculo de rota existente e o mapa de rastreamento deixa de usar o valor mascarado `********` como token.

## Validação

Foram adicionados invariantes para persistência de tokens, seleção de orçamento, coordenadas Mapbox e configuração de runtime. PostgreSQL, volumes e migrations de produção não são alterados automaticamente por esta release.
