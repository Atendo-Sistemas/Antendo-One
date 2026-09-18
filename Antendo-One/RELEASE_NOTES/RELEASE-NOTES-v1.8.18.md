# Atendo One v1.8.18

Corrigido o painel **Saúde da instalação**. A versão agora usa a versão compilada da aplicação quando `APP_VERSION` não é fornecida no ambiente Docker, evitando a exibição de `unknown`. O status de persistência agora consulta o adaptador SQL real e identifica corretamente uma conexão PostgreSQL ativa mesmo quando a instalação usa `DB_HOST`, `DB_TYPE` e demais variáveis separadas, em vez de depender apenas de `DATABASE_URL` ou `POSTGRES_URL`.

O indicador Mapbox continua mostrando **pendente** quando nenhuma chave está configurada no painel; esse estado é legítimo e deve ser alterado somente após cadastrar uma chave válida.
