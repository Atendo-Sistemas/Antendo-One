# Atendo One v1.8.8

## Documentos legais e origem de visitantes

As rotas públicas `/termos-de-uso`, `/politica-de-privacidade`, `/conteudo/termos-de-uso` e `/conteudo/politica-de-privacidade` passaram a abrir os documentos legais diretamente, usando o endpoint público protegido contra indexação. Os documentos receberam seções de controlador, operador, encarregado, cookies, incidentes, reclamações, crianças e adolescentes, suspensão, encerramento e portabilidade.

A plataforma passou a registrar analytics agregado de origem de visitas: Google, Bing, redes sociais, outros domínios de referência ou acesso direto. Também registra campanha UTM, canal, página e tipo de dispositivo. O referenciador é reduzido ao domínio; IP completo, credenciais, formulários e fingerprint não são registrados por esse mecanismo.

A auditoria externa identificou que o ambiente atualmente publicado ainda exibe textos legados de Elo Log/Multi-Tenant e que as rotas legais retornam conteúdo indisponível. A correção está neste pacote e requer atualização do ambiente publicado.

## Validação

Invariantes legais, lint, suíte completa e build aprovados. Deploy de produção não executado.
