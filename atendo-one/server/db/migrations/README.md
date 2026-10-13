# Migrações de banco — Atendo One

## Ordem de execução

Execute primeiro `../schema.sql` e depois todos os arquivos `.sql` desta pasta em ordem lexicográfica. Faça backup antes da migration, valide em ambiente de teste e só então aplique em uma janela controlada. A migration `010_tenant_rls_policies.sql` habilita isolamento nas tabelas tenant-scoped e deve ser executada por uma role administrativa separada da role runtime.

A role runtime não deve ser proprietária das tabelas e não deve possuir `BYPASSRLS`. O teste `tests/rls.integration.cjs` cria uma role temporária `NOSUPERUSER NOBYPASSRLS` para validar leitura, atualização, exclusão e relações cruzadas.

## Transição do `app_state`

O snapshot `app_state` permanece compatibilidade temporária e não deve ser descrito como domínio relacional protegido por RLS. A migração incremental planejada é:

1. **Tenants e usuários:** criar repositories tenant-scoped, fazer dual-write controlado e comparar leituras do snapshot com as tabelas normalizadas.
2. **Motoristas e veículos:** migrar vínculos compostos por `tenant_id`, validar constraints e ativar leituras normalizadas após reconciliação.
3. **Fretes:** migrar criação, atualização de status, localização e interesses com contexto transacional.
4. **Despesas:** migrar lançamentos e aprovações com políticas `USING` e `WITH CHECK`.
5. **Notificações:** migrar templates, entregas e consentimentos, preservando auditoria.

Cada etapa deve ter flag de leitura, dual-write observável, reconciliação por contagem/hash e rollback para o snapshot anterior. Nenhuma etapa deve apagar o snapshot ou executar backfill destrutivo automaticamente.

## Rollback lógico da RLS

Em caso de incompatibilidade, interrompa novas escritas, faça backup e reverta a aplicação para o modo de snapshot. Para rollback da camada RLS, remova as policies `tenant_isolation`, remova as constraints `vehicles_driver_same_tenant` e `freights_driver_same_tenant`, remova o índice `drivers_tenant_id_id_key` se não houver dependência posterior e desabilite RLS somente em janela de manutenção. A reversão não remove linhas de dados.
