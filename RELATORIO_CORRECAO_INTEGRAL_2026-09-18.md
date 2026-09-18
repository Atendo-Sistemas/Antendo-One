# Relatório de correção integral — Atendo One

## Resumo executivo

O repositório local `/home/ubuntu/Antendo-One` foi revisado e corrigido sem deploy, sem alteração do histórico Git e sem acesso a produção. A versão final remove a credencial fixa da documentação, parametriza a porta, cria CI, remove o ZIP versionado, adiciona uma migration idempotente de RLS, impede fallback silencioso para memória em produção e migra a sessão do navegador para cookies HttpOnly com refresh separado e proteção CSRF.

A raiz não contém uma subpasta duplicada `Antendo-One/`. O arquivo ZIP versionado `Antendo-One-v1.8.31-mapbox-saas.zip` foi removido da árvore de trabalho e `*.zip`/`*.tar.gz` foram adicionados ao `.gitignore`. O histórico Git não foi reescrito.

## Arquivos alterados, criados e removidos

Foram ajustados `.gitignore`, `INSTALLATION.md`, `docker-compose.yml`, `docker-compose.portainer.yml`, `docker-compose.staging.yml`, `server.ts`, `server/api.ts`, `server/db.ts`, `src/services/api.ts`, `src/context/AuthContext.tsx` e os testes de sessão, segurança, navegação, PWA, PDF, registro e notificações já existentes.

Foi criado `.github/workflows/ci.yml`, sem etapa de deploy. O workflow fixa Node.js 22.14.0, executa instalação limpa, secret scan, typecheck, testes, build, auditoria e validação do Dockerfile, com PostgreSQL de serviço.

Foi criada `server/db/migrations/010_tenant_rls_policies.sql`. Ela habilita RLS nas tabelas tenant-scoped existentes, cria políticas baseadas em `current_setting('app.tenant_id', true)` e `app.is_super_admin`, e adiciona constraints compostas para impedir associação de motorista de outro tenant a veículos e fretes.

Foi criado `tests/security-boundaries.invariants.cjs`, cobrindo cookies, CSRF, ausência de persistência de JWT em localStorage e presença das políticas RLS.

Foi removido o ZIP versionado `Antendo-One-v1.8.31-mapbox-saas.zip`. A remoção é apenas do artefato na árvore atual; nenhum objeto do histórico Git foi apagado.

## Autenticação e sessão

O frontend não grava mais access token ou refresh token em `localStorage`. Os helpers antigos permanecem somente como compatibilidade e não persistem valores. As requisições usam `credentials: 'include'`.

O backend emite `atendo_access` e `atendo_refresh` como cookies HttpOnly, com `SameSite=Lax` e `Secure` em produção/HTTPS. O refresh é lido pelo cookie, rotacionado e revogado por família. O logout revoga a sessão no servidor e limpa os cookies.

Um cookie CSRF não HttpOnly é criado para que o frontend possa enviar seu valor no cabeçalho `X-CSRF-Token`. Requisições autenticadas mutáveis sem correspondência entre cookie e cabeçalho são rejeitadas. O cabeçalho foi incluído nas origens CORS autorizadas.

## Banco e isolamento

Em produção, `DATABASE_URL` ou `DB_HOST` é obrigatório e a inicialização aguarda a hidratação da persistência antes de abrir a porta. Falhas de hidratação e de persistência deixam de ser engolidas silenciosamente; são propagadas no startup ou registradas como `PERSISTENCE_FAILURE`.

A migration RLS é idempotente e não destrutiva. A ordem é: executar o schema atual, depois `server/db/migrations/010_tenant_rls_policies.sql`. O rollback lógico consiste em remover as policies `tenant_isolation` e desabilitar RLS nas tabelas afetadas, sob janela controlada de manutenção. A validação da migration contra um PostgreSQL real ainda depende de executar a stack/CI com credenciais fornecidas pelo ambiente; não foi acessado banco de produção.

## Validações executadas

| Comando | Resultado |
|---|---|
| `npm ci --ignore-scripts` | Passou no baseline |
| `npm run lint` | Passou após as correções |
| `npm test` | Passou após atualizar expectativa obsoleta de sessão |
| `npm run build` | Passou; o build ainda emite avisos de chunks grandes para Mapbox e documentos |
| `npm audit --omit=dev` | Passou, sem vulnerabilidades reportadas |
| `node tests/secret-scan.cjs` | Passou |
| Verificação de senha fixa | A ocorrência informada foi removida |
| Verificação de tokens em localStorage | Não há persistência de tokens de sessão no código de produção |
| Verificação de RLS | Migration e invariantes presentes |

A execução final apresentou `lint=0`, `test=0`, `build=0`, `audit=0` e `secret=0`.

## Pendências reais

A migration RLS foi criada, mas a aplicação ainda mantém compatibilidade com o snapshot `app_state` monolítico. A normalização completa para tabelas de domínio exige uma etapa posterior de migração de dados, dual-write e rollback, não realizada automaticamente para evitar risco de perda ou divergência de dados.

O contexto `app.tenant_id`/`app.is_super_admin` precisa ser definido por transação pelo adaptador PostgreSQL quando as consultas normalizadas passarem a ser usadas pela aplicação. A migration deixa essa exigência explícita; não foi aplicado um bypass inseguro.

O build continua sinalizando chunks grandes de Mapbox e documentos. O fluxo principal já usa lazy loading para painéis e módulos pesados, mas uma redução adicional exigiria revisar dependências de terceiros e medir o impacto visual/funcional.

A execução do workflow GitHub e a validação efetiva do Dockerfile no runner dependem de publicar o arquivo em um repositório remoto; não foi feito push.

## Deploy posterior — não executado

Antes de produção, configure fora do Git: `DATABASE_URL` ou `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CONFIG_ENCRYPTION_KEY`, `APP_URL`, `CORS_ALLOWED_ORIGINS` e `PORT`. Em HTTPS, mantenha `Secure` nos cookies e inclua a origem real em `CORS_ALLOWED_ORIGINS`.

Execute o schema e a migration RLS em uma janela controlada, valide dados incompatíveis antes de tornar constraints compostas válidas e mantenha backup para rollback. O deploy não foi executado nesta tarefa.
