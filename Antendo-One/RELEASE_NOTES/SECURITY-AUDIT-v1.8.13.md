# Auditoria de Segurança — Atendo One v1.8.13

**Data:** 08/09/2026  
**Escopo:** autenticação, sessões, banco de dados, isolamento multi-tenant, exposição de dados, headers, erros e segredos.

## Resultado executivo

A plataforma foi validada após a implementação de access tokens JWT de curta duração, rotação de refresh tokens, invalidação server-side de sessões, rate limiting progressivo, proteção contra brute force e correções de integração do cliente de API. A suíte automatizada passou integralmente e o build de produção foi gerado com sucesso.

## Controles verificados

| Camada | Resultado | Evidência |
|---|---|---|
| Access token JWT | Conforme | Expiração configurada em 10 minutos, abaixo do limite de 15 minutos. |
| Refresh token rotation | Conforme | Refresh tokens são persistidos, consumidos uma única vez, rotacionados por família e revogados em reutilização. |
| Logout e invalidação | Conforme | Logout revoga a família de refresh e a sessão ativa; tokens de sessão inválida são rejeitados no servidor. |
| Rate limiting | Conforme | Limites progressivos por IP e identidade, com backoff e bloqueio crescente nos fluxos sensíveis. |
| Brute force | Conforme | Contador de falhas, `blockedUntil`, limpeza após sucesso e bloqueio progressivo. |
| SQL injection | Conforme | Queries de dados usam parâmetros/bindings; identificadores dinâmicos restantes foram validados por allowlist e quotados. |
| TLS do PostgreSQL | Endurecido | `rejectUnauthorized` agora é verdadeiro por padrão quando SSL está habilitado; exceção exige configuração explícita. |
| Multi-tenant | Conforme | Consultas e mutações críticas filtram `tenantId` e aplicam verificação de ownership/role. |
| DTOs e exposição | Conforme na suíte | Rotas sensíveis exigem autenticação; dados públicos têm projeções limitadas e os segredos de integração não são enviados ao frontend. |
| Headers | Conforme | `X-Powered-By` é removido; headers de segurança são aplicados pelo Helmet. |
| Erros de produção | Conforme | Middleware global registra correlação no servidor e retorna mensagem genérica, sem stack trace. |
| Segredos | Conforme na revisão | Configurações sensíveis vêm de variáveis de ambiente ou armazenamento protegido; nenhum segredo privado foi adicionado ao bundle. |

## Alterações desta versão

1. Validação e quoting seguro de identificadores SQL usados em consultas dinâmicas de verificação.
2. Validação de certificado TLS do PostgreSQL habilitada por padrão em todas as conexões, inclusive no teste de conexão.
3. Versão atualizada para **v1.8.13**.

## Validação executada

- `npm run lint`: **PASS**
- `npm test`: **PASS**
- `npm run build`: **PASS**
- Aviso não bloqueante: chunks grandes de Mapbox e documentos; não altera a correção nem a segurança do build.

## Pendências que dependem de ambiente externo ou operação

A auditoria de firewall, portas expostas, política SSH, criptografia em repouso do volume PostgreSQL, execução de backup/restauração real, configuração de registry/Swarm e teste E2E em produção não pode ser declarada concluída a partir deste sandbox. Essas verificações devem ser executadas no servidor de produção sem modificar dados, volumes ou banco.

A implementação de 2FA/TOTP e CAPTCHA/Turnstile permanece como próxima camada funcional de segurança; sua conclusão requer definição de provedor, fluxo de recuperação e operação de entrega dos desafios. Não foi simulada como concluída.

## Recomendação de rollout

Publicar primeiro em homologação, executar login, refresh, logout, bloqueio progressivo, fluxos multi-tenant e rotas públicas de tracking, e só então promover a produção. Não executar `docker system prune` nem remover a imagem anterior durante o rollout.
