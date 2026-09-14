# Atendo One v1.8.4

## Preparação comercial completa

Esta versão conclui as dez frentes de preparação comercial sem alteração em produção:

1. Migração idempotente de marca legada persistida, alterando somente valores padrão antigos e preservando personalizações.
2. Testes específicos de clientes, vínculo de orçamento e isolamento por empresa.
3. Testes de geocodificação e Directions Mapbox, incluindo configuração ausente e cálculo de rota.
4. Cache temporário, rate limit, timeout e auditoria para consultas CNPJ.ws.
5. Health check detalhado com versão, contagens, integrações e modo de persistência.
6. Guia comercial e operacional consolidado.
7. Auditoria automatizada de cópia pública, marca Atendo One e navegação mobile.
8. Retenção configurável de auditoria, notificações e telemetria GPS.
9. Testes automatizados de limites HTTP, headers, CNPJ e rate limit.
10. Scripts de verificação, backup, atualização e rollback sem deploy automático.

## Validação

Lint, build e suíte completa de testes aprovados. Deploy de produção não executado.

## Correção do teste de e-mail

O teste SMTP agora reutiliza corretamente a senha segura armazenada quando a interface envia o valor mascarado `********`. Foram adicionados TLS obrigatório nas portas 587/2525, timeouts de conexão, saudação e socket, além de mensagens específicas para credenciais recusadas e indisponibilidade do servidor.
