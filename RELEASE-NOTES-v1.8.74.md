# Atendo One v1.8.74 — vínculo de motorista com empresa

Corrige o modal de vínculo usado pelo Super Admin. Empresas que já possuem vínculo `PENDENTE` ou `BLOQUEADO` continuam visíveis e identificadas no seletor, permitindo reanálise e reativação. Somente vínculos `APROVADO` deixam de aparecer como opção duplicada.

A correção mantém a autorização server-side: o Super Admin pode atualizar o vínculo global, enquanto usuários empresariais continuam limitados ao próprio tenant. Nenhum dado de produção foi alterado nesta etapa.
