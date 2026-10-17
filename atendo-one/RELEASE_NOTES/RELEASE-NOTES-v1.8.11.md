# Atendo One v1.8.11

## Configuração de API restrita ao SaaS

A configuração técnica da API de WhatsApp, incluindo URL e token, agora é acessível somente no painel SaaS pelo Super Admin. Usuários e administradores das empresas não visualizam mais o botão de configuração nos módulos de cobrança e checklist.

As rotas de consulta e alteração da configuração também possuem bloqueio backend explícito para qualquer perfil diferente de Super Admin. O uso operacional do canal continua disponível conforme o módulo contratado, sem exposição das credenciais.

## Validação

Invariante SaaS-only, lint, suíte completa e build executados. Deploy de produção não executado.
