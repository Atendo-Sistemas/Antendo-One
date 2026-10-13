# Release v1.8.61

## Prestação de contas sem motorista e persistência PostgreSQL

### Correções e melhorias

- Permite salvar prestação de contas sem motorista vinculado.
- Mantém o frete como vínculo opcional.
- Corrige a validação que retornava “Motorista não autorizado para esta prestação de contas” quando não havia motorista informado.
- Persiste criação, edição e arquivamento diretamente na tabela relacional `trip_expenses`.
- Persiste todos os campos da prestação, incluindo itens, valores, quilometragem, observações, revisão, aprovação e arquivamento.
- Recupera as prestações diretamente do PostgreSQL durante a inicialização da aplicação.
- Retorna erro explícito quando o PostgreSQL não está configurado, evitando informar que um registro foi salvo apenas em memória.
- Super Admin pode editar registros de qualquer empresa e selecionar a empresa da prestação na interface.
- Admin pode editar registros somente da empresa vinculada à sua conta.
- Atualiza o cache do service worker para invalidar versões anteriores.
- Inclui a migração `011_optional_trip_expense_driver.sql` para bancos existentes.

### Validação

- TypeScript aprovado.
- Build frontend/backend aprovado.
- Testes de invariantes de prestação e segurança aprovados.
