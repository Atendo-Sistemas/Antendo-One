# Ambiente de homologação

O arquivo `docker-compose.staging.yml` inicia uma aplicação e um PostgreSQL próprios, com volume `elolog_staging_postgres_data` e porta local configurável. O ambiente não deve compartilhar `DB_HOST`, volume, JWT, chave de criptografia ou URL de webhook com produção.

Antes de iniciar, copie `.env.staging.example` para um arquivo local fora do repositório e gere valores exclusivos para `STAGING_DB_PASSWORD`, `STAGING_JWT_SECRET` e `STAGING_CONFIG_ENCRYPTION_KEY`. Nunca grave o arquivo preenchido no GitHub, na imagem Docker ou no ZIP sanitizado.

Para iniciar localmente, execute `docker compose --env-file .env.staging up -d --build`. O health check consulta apenas o endpoint local da aplicação. Para encerrar, use `docker compose --env-file .env.staging down`; para destruir também o banco de homologação, use `docker compose --env-file .env.staging down -v` somente quando a equipe tiver confirmado que o ambiente não contém dados que precisam ser preservados.

A homologação deve usar clientes sintéticos, webhooks de teste e pagamentos somente no Sandbox. Não use cartão real, API key de produção, token real de WhatsApp, dados pessoais desnecessários ou a URL pública de produção. O backup de produção pode ser restaurado apenas em ambiente isolado, com acesso restrito e sem publicar seus dados.
