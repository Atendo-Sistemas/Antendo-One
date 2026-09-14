# Atendo One v1.8.3

## Auditoria da home e comunicação pública

A comunicação da página inicial foi revisada para eliminar termos técnicos de arquitetura que não fazem sentido para o cliente final. O card “Controle de Tenants” foi substituído por **“Operação segura e organizada”**, com a explicação “Cada empresa visualiza apenas seus próprios dados, usuários e operações”.

As mensagens de cadastro, FAQ, rodapé, vitrine pública, tela de permissões, checklist e configurações comerciais passaram a usar **Atendo One** e linguagem de benefício, sem expor “tenant”, “Multi-Tenant” ou nomes técnicos internos.

## Compatibilidade

Rotas históricas, IDs internos de formulários, chaves de armazenamento e nomes técnicos de banco foram preservados para evitar quebra de dados existentes. A alteração foi limitada à apresentação visível ao usuário.

## Validação

Após o rebranding, executar lint, build e suíte completa de testes antes da publicação.
