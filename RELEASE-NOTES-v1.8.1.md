# Atendo One — v1.8.1

## Otimização do Mapbox

O componente `InteractiveMapboxView` deixou de ser importado estaticamente pelo modal de rastreamento. O módulo agora é carregado com `React.lazy` somente quando a configuração ativa o Mapbox, com fallback visual durante o carregamento. Isso evita que o renderizador Mapbox seja baixado antes de uma tela de mapa ser realmente aberta.

A configuração Vite já separa dependências pesadas em bundles dedicados, incluindo `vendor-mapbox`, `vendor-leaflet`, `vendor-documents` e `vendor-react`. A release adiciona um teste estrutural que impede o retorno do import estático do Mapbox.

A funcionalidade do mapa, geocodificação, rota viária e fallback Leaflet foram preservados.

## Validação

A release é validada com lint, suíte completa, build, inspeção dos chunks, teste de integridade do ZIP e SHA-256.
