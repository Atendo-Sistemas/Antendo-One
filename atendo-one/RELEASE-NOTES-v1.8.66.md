# Atendo One v1.8.66

## Correção de motoristas no cadastro de fretes

Foi corrigida a lista do campo **“Direcionar para um motorista específico”**. O backend agora considera duas formas válidas de associação da empresa:

1. vínculo formal em `driver_company_links`, incluindo vínculos aprovados e pendentes quando apropriado;
2. cadastro legado com `driver.tenantId` igual à empresa atual.

Essa compatibilidade foi aplicada à listagem de motoristas, à criação e edição de fretes e ao vínculo manual de um motorista a um frete. O sistema continua ocultando motoristas inativos e rejeitando qualquer motorista que não pertença à empresa do frete.

## Validação

- Invariante específica: `V1865_DRIVER_SELECTION_INVARIANTS_OK`.
- TypeScript: aprovado.
- Build Vite: aprovado.
- O build mantém somente o aviso não bloqueante sobre chunks acima de 500 kB.
- Nenhuma alteração foi feita na VPS, banco de produção, volumes, secrets ou Docker Swarm.
