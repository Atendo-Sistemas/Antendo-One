# Relatório de correção integral — Atendo One

## Resumo executivo

O repositório local `/home/ubuntu/Antendo-One` foi revisado e corrigido sem deploy, sem alteração do histórico Git e sem acesso a produção. A versão final remove a credencial fixa da documentação, parametriza a porta, cria CI, retira o ZIP da árvore e do índice atual, adiciona uma migration idempotente de RLS, liga o contexto tenant ao backend por transação, impede fallback silencioso para memória em produção e migra a sessão do navegador para cookies HttpOnly com refresh separado e proteção CSRF.

A raiz não contém uma subpasta duplicada `Antendo-One/`. O arquivo ZIP versionado `Antendo-One-v1.8.31-mapbox-saas.zip` foi removido da árvore de trabalho e `*.zip`/`*.tar.gz` foram adicionados ao `.gitignore`. O histórico Git não foi reescrito.

## Arquivos alterados, criados e removidos

Foram ajustados `.gitignore`, `INSTALLATION.md`, `DEPLOYMENT_DOCKER.md`, `docker-compose.yml`, `docker-compose.portainer.yml`, `docker-compose.staging.yml`, `install.sh`, `server.ts`, `server/api.ts`, `server/db.ts`, `server/db/sqlAdapter.ts`, `src/services/api.ts`, `src/context/AuthContext.tsx`, `src/components/superadmin/SqlAndInstallationConfig.tsx` e os testes existentes de sessão, segurança, navegação, PWA, PDF, registro e notificações.

Foi criado `.github/workflows/ci.yml`, sem etapa de deploy. O workflow fixa Node.js 22.14.0, executa instalação limpa, secret scan, typecheck, testes, build, auditoria e validação do Dockerfile, com PostgreSQL de serviço.

Foi criada `server/db/migrations/010_tenant_rls_policies.sql`. Ela habilita RLS nas tabelas tenant-scoped existentes, cria políticas baseadas em `current_setting('app.tenant_id', true)` e `app.is_super_admin`, e adiciona constraints compostas para impedir associação de motorista de outro tenant a veículos e fretes.

Foram criados `tests/security-boundaries.invariants.cjs`, `tests/auth-cookie.behavior.cjs` e `tests/rls.integration.cjs`, cobrindo cookies, CSRF, logout de conta demo, ausência de persistência de JWT em localStorage e isolamento RLS.

Foi removido o ZIP versionado `Antendo-One-v1.8.31-mapbox-saas.zip`. A remoção é apenas do artefato na árvore atual; nenhum objeto do histórico Git foi apagado.

## Autenticação e sessão

O frontend não grava mais access token ou refresh token em `localStorage`. Os helpers antigos permanecem somente como compatibilidade e não persistem valores. As requisições usam `credentials: 'include'`.

O backend emite `atendo_access` e `atendo_refresh` como cookies HttpOnly, com `SameSite=Lax` e `Secure` em produção/HTTPS. O refresh é lido pelo cookie, rotacionado e revogado por família. O logout revoga a sessão no servidor e limpa os cookies. O teste comportamental executa o servidor, confirma os atributos dos cookies, confirma rejeição sem CSRF e confirma logout válido; também foi corrigido o bloqueio indevido de logout para contas demo somente leitura.

Um cookie CSRF não HttpOnly é criado para que o frontend possa enviar seu valor no cabeçalho `X-CSRF-Token`. Requisições autenticadas mutáveis sem correspondência entre cookie e cabeçalho são rejeitadas. O cabeçalho foi incluído nas origens CORS autorizadas.

## Banco e isolamento

Em produção, `DATABASE_URL` ou `DB_HOST` é obrigatório e a inicialização aguarda a hidratação da persistência antes de abrir a porta. Falhas de hidratação e de persistência deixam de ser engolidas silenciosamente; são propagadas no startup ou registradas como `PERSISTENCE_FAILURE`.

A migration RLS é idempotente e não destrutiva. A ordem é: executar o schema atual, depois `server/db/migrations/010_tenant_rls_policies.sql`. O adaptador agora oferece `runWithTenantDbContext` com `AsyncLocalStorage`; o middleware deriva `tenantId` e acesso global da sessão autenticada e o adaptador usa `set_config(..., true)` dentro de uma transação. O rollback lógico consiste em remover as policies `tenant_isolation` e desabilitar RLS nas tabelas afetadas, sob janela controlada de manutenção.

## Validações executadas

| Comando | Resultado |
|---|---|
| `npm ci --ignore-scripts` | Passou na validação final |
| `npm run lint` | Passou na validação final |
| `npm test` | Passou na validação final, incluindo cookies/CSRF |
| `npm run build` | Passou; o build ainda emite avisos de chunks grandes para Mapbox e documentos |
| `npm audit --omit=dev` | Passou, sem vulnerabilidades reportadas |
| `node tests/secret-scan.cjs` | Passou |
| Verificação de senha fixa | A ocorrência informada foi removida |
| Verificação de tokens em localStorage | Não há persistência de tokens de sessão no código de produção |
| `npm run test:auth-cookie` | Passou contra servidor local |
| `npm run test:rls` | Pulado de forma segura sem `RLS_TEST_DATABASE_URL` |
| PostgreSQL real | Não validado localmente: Docker, Docker Compose e `psql` não estão disponíveis |

A execução final apresentou `ci=0`, `lint=0`, `test=0`, `build=0`, `audit=0`, `secret=0` e `rls=0` (o último representa skip seguro sem URL de banco). A verificação de arquivos compactados rastreados não retornou resultados; a senha fixa e o uso de localStorage para tokens também não retornaram resultados.

## Pendências reais

A migration RLS foi integrada ao contexto transacional do backend, mas a aplicação ainda mantém compatibilidade com o snapshot `app_state` monolítico. A normalização completa para tabelas de domínio exige uma etapa posterior de migração de dados, dual-write e rollback, não realizada automaticamente para evitar risco de perda ou divergência de dados.

O teste contra PostgreSQL real está bloqueado somente pela ausência de runtime local de PostgreSQL/Docker. O CI contém PostgreSQL de serviço e executa `npm run test:rls`; a role de teste é criada como `NOSUPERUSER NOBYPASSRLS`, e os valores `ci-only-*` são exclusivos do runner.

O build continua sinalizando chunks grandes de Mapbox e documentos. O fluxo principal já usa lazy loading para painéis e módulos pesados, mas uma redução adicional exigiria revisar dependências de terceiros e medir o impacto visual/funcional.

A execução do workflow GitHub e a validação efetiva do Dockerfile no runner dependem de publicar o arquivo em um repositório remoto; não foi feito push.

## Deploy posterior — não executado

Antes de produção, configure fora do Git: `DATABASE_URL` ou `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CONFIG_ENCRYPTION_KEY`, `APP_URL`, `CORS_ALLOWED_ORIGINS` e `PORT`. Em HTTPS, mantenha `Secure` nos cookies e inclua a origem real em `CORS_ALLOWED_ORIGINS`.

Execute o schema e a migration RLS em uma janela controlada, valide dados incompatíveis antes de tornar constraints compostas válidas e mantenha backup para rollback. O deploy não foi executado nesta tarefa.

## Correção final desta etapa

A exportação e impressão de orçamento foram ajustadas para carregar `jspdf` e `jspdf-autotable` somente no acionamento da ação correspondente. Com isso, o chunk funcional `BudgetManager` ficou pequeno e os módulos documentais permanecem fora do carregamento inicial; o build continua alertando sobre os vendors grandes de documentos e Mapbox, mas eles são carregados sob demanda pelos fluxos que os utilizam.

Foi acrescentado um guard de inicialização: produção não aceita `RLS_DOMAIN_MODE=active` sem `NORMALIZED_DOMAIN_RLS=true`. O healthcheck detalhado passou a declarar explicitamente o estado `snapshot-transition`, o contexto transacional e que `app_state` ainda não está protegido pela RLS normalizada. Isso evita anunciar uma garantia que ainda depende da migração de domínio, sem desativar o isolamento transacional já implementado.

Os defaults de SEO, notificações, mensagens de push, textos de schema/seed e painel de SEO foram padronizados para **Atendo One**. As referências `elo-log` e `form-checklist-elolog` permanecem apenas como aliases de compatibilidade de rotas e modelos legados; não são mais defaults de identidade. O teste `security-boundaries.invariants.cjs` foi incluído na suíte `npm test` e valida cookies, CSRF, contexto de RLS e o guard da migração.

## Estado de validação desta etapa

O build de produção e o lint foram executados com sucesso após a implementação do lazy loading. O teste comportamental de cookies/CSRF passou (`AUTH_COOKIE_BEHAVIOR_PASS`), o teste de limites passou (`SECURITY_BOUNDARIES_INVARIANTS_OK`) e o teste de integração RLS foi encerrado com skip seguro porque `RLS_TEST_DATABASE_URL` não está configurada neste sandbox. A suíte principal foi repetida após corrigir uma expectativa obsoleta do teste que procurava o literal `X-CSRF-Token` no arquivo errado; a validação final subsequente permanece registrada nos comandos executados nesta sessão.

## Plano incremental de normalização do `app_state`

A normalização deve ser executada em etapas reversíveis. Primeiro, inventariar cada coleção do snapshot, identificar chaves naturais e validar órfãos por tenant. Em seguida, criar tabelas relacionais versionadas para tenants, usuários, clientes, veículos, fretes, orçamentos, notificações, auditoria e configurações, mantendo `app_state` como fonte legada durante a transição.

A terceira etapa deve executar backfill idempotente com uma chave de origem (`legacy_id`) e constraints de tenant, registrando contagens e divergências. Depois, habilitar dual-write em uma transação: a escrita relacional torna-se primária e o snapshot é atualizado como compatibilidade. Leituras devem usar shadow reads amostradas, comparando campos normalizados com o snapshot e emitindo métricas de divergência sem alterar respostas dos usuários.

Quando as divergências permanecerem em zero durante a janela definida, migrar leituras por domínio, ativar policies RLS diretamente nas tabelas normalizadas e manter uma janela de rollback baseada no snapshot e backup relacional. Só então definir `NORMALIZED_DOMAIN_RLS=true` e, por último, retirar o dual-write e o fallback de `app_state` após uma nova migração versionada. Nenhuma dessas etapas foi executada automaticamente nesta sessão, pois exigem validação de dados reais e uma janela de manutenção.

## Artefato de entrega

O pacote final foi criado fora da árvore do projeto, sem segredos, dependências instaladas, build gerado, `.git` ou ZIPs anteriores. O conteúdo deve ser instalado no servidor e reconstruído conforme `INSTALLATION.md`; o deploy em produção não foi executado.
