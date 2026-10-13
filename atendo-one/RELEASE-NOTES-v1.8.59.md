# Release v1.8.59 — Motoristas vinculados no direcionamento de fretes

Corrigida a lista **“Direcionar para um motorista específico”** no formulário de frete.

O formulário agora consulta a API usando a empresa efetivamente selecionada. Para o Super Admin, a API filtra os motoristas pelo `tenantId` informado e retorna somente perfis com vínculo empresarial aprovado ou pendente conforme a política existente. Para usuários da empresa, permanece o filtro automático pela empresa da sessão.

A validação server-side do frete direcionado continua exigindo vínculo válido, motorista ativo e, quando informado, veículo pertencente ao motorista selecionado. Nenhuma regra de isolamento entre empresas foi removida.
