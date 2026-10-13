# Atendo One — v1.7.30

## Persistência de chaves de API

A atualização global de configurações já preservava chaves mascaradas de Mapbox, Asaas, SMTP e banco de dados; a configuração WhatsApp já preservava o token atual quando recebia `********` ou campo vazio. A correção desta release garante que `/saas/config` aguarde `persistNow()` antes de retornar sucesso, evitando que uma atualização recente seja considerada concluída antes da gravação do snapshot persistente.

O comportamento de preservação impede que uma atualização parcial apague credenciais existentes. As credenciais continuam sendo armazenadas por meio dos mecanismos seguros já existentes, e os endpoints não devolvem os valores secretos em respostas normais.

## Validação

Foi incluído teste estrutural para preservação de segredos e persistência aguardada. A release é validada com lint, testes, build, integridade do ZIP e SHA-256.
