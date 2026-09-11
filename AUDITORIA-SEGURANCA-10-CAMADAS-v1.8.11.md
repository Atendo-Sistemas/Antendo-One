# Auditoria de segurança — Atendo One v1.8.11

## Escopo e limite

Esta auditoria analisou o código, os scripts operacionais, a configuração Docker disponível e os testes locais do projeto em `/home/ubuntu/atendo-one-v1.8.2`. Ela não acessou a VPS de produção, o firewall real, o Docker Swarm, o PostgreSQL de produção, o proxy reverso, as regras SSH, os volumes ou as credenciais externas.

Portanto, os itens de infraestrutura são classificados como **não comprovados** quando dependem do ambiente real. Uma configuração documentada no projeto não é considerada prova de que está ativa em produção.

## Resultado executivo

| Camada | Situação | Classificação |
|---|---|---|
| 1. Rate limit e bloqueio crescente | Existe rate limit básico por IP, sem bloqueio crescente | Parcial — alta prioridade |
| 2. Turnstile/CAPTCHA | Não encontrado | Ausente — alta prioridade |
| 3. Criptografia em repouso | Segredos específicos são cifrados, mas não há prova de criptografia do banco/volume | Parcial — alta prioridade |
| 4. Hardening do servidor | Não comprovável neste ambiente | Não auditado em produção — crítica |
| 5. HTTPS obrigatório | Headers de segurança existem, mas o redirecionamento obrigatório não está no app | Parcial — crítica |
| 6. 2FA para administradores | Não encontrado | Ausente — crítica |
| 7. Backup e restauração real | Backup local, hashes e status existem; restauração real não comprovada | Parcial — crítica |
| 8. Log de acesso e auditoria | Auditoria por usuário/IP existe; cobertura de login e alterações deve ser validada | Parcial — alta prioridade |
| 9. Multi-tenant | Há filtragem e testes de invariantes; precisa de E2E com dois tenants e produção | Parcial forte — alta prioridade |
| 10. Dependências sem vulnerabilidade | `npm audit --omit=dev` encontrou 4 vulnerabilidades moderadas | Não conforme — alta prioridade |

## 1. Rate limit em login, cadastro e recuperação de senha

### O que já existe

O `server.ts` aplica um rate limit em memória antes do roteador da API. Rotas com prefixo `/api/auth/` recebem um limite de 20 requisições em uma janela de 15 minutos por IP. As demais rotas recebem limites diferentes. A API informa `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` e `Retry-After` quando retorna HTTP 429.

Também existe limitação específica para o envio de OTP por telefone, com controle de último envio e limpeza do mapa em memória. As senhas são armazenadas com bcrypt, e o fluxo de cadastro empresarial usa custo 12.

### O que falta

O bloqueio não é crescente. O limite apenas retorna 429 até a janela expirar. Não há escalonamento por tentativas consecutivas, bloqueio de conta, bloqueio por combinação conta/IP, armazenamento distribuído ou proteção específica contra ataques distribuídos.

O rate limit em memória é perdido quando o processo reinicia e não funciona de forma consistente entre múltiplas réplicas do serviço. O mesmo limite amplo agrupa login, cadastro e demais endpoints de autenticação, em vez de aplicar políticas diferentes para login, registro, OTP e recuperação.

### Por onde começar

Criar um limitador persistente ou distribuído, preferencialmente Redis, com chaves separadas para IP, conta e operação. Implementar backoff progressivo, por exemplo 1 minuto, 5 minutos, 15 minutos e 1 hora. Aplicar limites específicos para login, cadastro, solicitação de OTP, verificação de OTP e recuperação de senha. Não bloquear permanentemente uma conta sem fluxo seguro de desbloqueio.

## 2. Turnstile ou CAPTCHA nos pontos públicos

### O que já existe

Há validações de formato, consentimento legal, senha mínima, CNPJ, telefone e OTP no cadastro e nos fluxos públicos. Há também rate limit geral.

### O que falta

Não foi encontrado Turnstile, reCAPTCHA ou mecanismo equivalente no login, no cadastro público, na recuperação de senha ou em formulários públicos. Validação de formato não substitui um desafio anti-bot.

### Por onde começar

Adicionar Cloudflare Turnstile em modo invisível ou gerenciado no login, cadastro de empresa, recuperação de senha e formulários públicos de maior risco. O token deve ser validado exclusivamente no backend, com domínio, expiração e ação conferidos. O CAPTCHA deve ser ativado condicionalmente após comportamento suspeito para preservar conversão legítima.

## 3. Criptografia do banco de dados em repouso

### O que já existe

O projeto possui cifragem específica para alguns segredos de configuração, como tokens de WhatsApp, usando uma chave de configuração. O Docker Compose usa secret para a chave de cifragem em runtime. Senhas de usuários são armazenadas como hash bcrypt. Respostas e logs mascaram tokens, senhas, OTPs e códigos.

### O que falta

Não há evidência de criptografia integral do PostgreSQL em repouso, do volume Docker `postgres_data`, dos snapshots JSONB ou dos backups locais. O `DATABASE_URL` usa conexão interna, mas isso não comprova criptografia do disco nem TLS entre aplicação e banco.

A criptografia de alguns segredos não protege automaticamente CPF, telefone, endereço, documentos, dados de clientes, auditoria ou backups.

### Por onde começar

Definir o modelo de ameaça. Para PostgreSQL, ativar criptografia de disco/volume no host ou camada de armazenamento, proteger backups com cifragem independente e restringir permissões. Para dados de alto risco, avaliar cifragem por campo com rotação de chaves. Nunca guardar a chave de cifragem no mesmo backup sem proteção separada. Validar se o tráfego entre aplicação e banco exige TLS no ambiente real.

## 4. Hardening do servidor

### O que já existe

A documentação orienta uso de proxy reverso, certificado SSL, separação de rede Docker, verificação de portas e execução do serviço em contêiner. O Compose padrão publica o banco em `127.0.0.1`, o que reduz exposição direta externa nesse modo.

O container da aplicação usa uma imagem runtime separada e `NODE_ENV=production`. O processo desabilita `x-powered-by`.

### O que falta ou não foi comprovado

Não foi possível verificar firewall ativo, portas realmente abertas, política SSH, login por senha, autenticação de root, fail2ban, atualizações do sistema, exposição do Docker socket, permissões dos arquivos, usuário não-root no container, limites de recursos, AppArmor/SELinux ou regras do provedor.

O Dockerfile não declara usuário não-root no estágio de execução. Isso deve ser avaliado antes de produção. A documentação contém exemplos que ainda dependem de configuração manual do proxy e firewall.

### Por onde começar

Auditar diretamente a VPS com `ss -tulpen`, `ufw status verbose` ou regras equivalentes, `systemctl status ssh`, configuração efetiva do SSH, `docker ps`, `docker info`, redes e regras do provedor. Fechar todas as portas não necessárias. Permitir SSH somente por chave e por rede administrativa quando possível. Executar a aplicação como usuário sem privilégios dentro do container e aplicar limites de CPU, memória e PIDs.

## 5. HTTPS obrigatório em toda rota

### O que já existe

O aplicativo define CSP, HSTS condicional, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Resource-Policy` e `Cross-Origin-Opener-Policy`. O CORS usa uma lista explícita de origens permitidas. O aplicativo reconhece `X-Forwarded-Proto` quando está atrás de proxy confiável.

### O que falta

O `server.ts` não realiza redirecionamento HTTP para HTTPS. O HSTS só é enviado quando a requisição já chega como HTTPS. Assim, a obrigatoriedade depende do proxy reverso ou do balanceador de produção.

O `trust proxy` está configurado como `1`, o que exige que a topologia real tenha exatamente um proxy confiável ou uma configuração equivalente. Se houver cadeia diferente, o IP e o protocolo encaminhados podem ser interpretados incorretamente.

### Por onde começar

Configurar redirecionamento 301 no proxy para todo o domínio, manter a porta de origem inacessível externamente e testar HTTP, HTTPS, subdomínios, WebSocket/SSE e callbacks. Depois de confirmar que todos os subdomínios são HTTPS, usar HSTS com `includeSubDomains`; `preload` só deve ser usado após confirmar que nenhum subdomínio precisa de HTTP.

## 6. 2FA para administradores

### O que já existe

O sistema possui senha com bcrypt e fluxo de OTP por WhatsApp para determinados acessos e cadastros. O JWT possui expiração e identifica uma sessão. Há testes locais do ciclo de sessão.

### O que falta

Não foi encontrado segundo fator obrigatório para usuários `SUPER_ADMIN`, `EMPRESA_SUPER_ADMIN` ou `ADMIN`. OTP usado em cadastro ou login alternativo não equivale necessariamente a uma política de 2FA obrigatória, com fator habilitado por usuário, códigos de recuperação, revogação e auditoria.

Também não foi identificado WebAuthn, TOTP, políticas de recuperação de 2FA ou exigência de reautenticação para ações administrativas críticas.

### Por onde começar

Implementar TOTP com aplicativo autenticador para todos os administradores. Exigir segundo fator no login e reautenticação para troca de credenciais, gestão de usuários, integrações, certificados, planos e dados fiscais. Guardar o segredo TOTP cifrado, mostrar QR apenas no provisionamento, fornecer códigos de recuperação de uso único e registrar habilitação, falha, recuperação e desabilitação.

## 7. Backup automático e teste de restauração

### O que já existe

Existe script de backup local com:

- Lock contra execuções simultâneas.
- Retenção configurável.
- Dump do PostgreSQL.
- Arquivo do código sem `.env`, Git, dependências e build.
- Manifesto e `SHA256SUMS`.
- Status operacional.
- Evento assinado por HMAC para o painel.
- Verificação dos hashes.
- Diretórios com permissões restritas.

Os testes de invariantes de backup passam localmente.

### O que falta

O próprio script informa que a cópia externa ainda não está configurada. A existência e a integridade do backup não comprovam restauração. Não foi executado teste real de restauração em banco separado, nem foi medida a idade máxima aceitável do backup, RPO, RTO ou o tempo de recuperação.

A retenção local de três cópias pode ser insuficiente para ransomware ou falha do host. Não há evidência de cópia imutável/off-site no ambiente auditado.

### Por onde começar

Definir RPO e RTO. Enviar backups cifrados para armazenamento externo com retenção e imutabilidade. Em uma máquina ou volume isolado, restaurar PostgreSQL, aplicar o snapshot, iniciar a aplicação em staging e executar smoke tests. Registrar data, duração, tamanho, quantidade de registros e resultado. Repetir o teste periodicamente e alertar quando o backup estiver atrasado ou a restauração falhar.

## 8. Log de acesso e auditoria por usuário

### O que já existe

Existe `auditLogs` com usuário, empresa, entidade, ação, detalhes, data e IP. Há sanitização de mensagens para remover tokens, senhas, autorização, OTPs e códigos. As versões recentes registram IP na auditoria e há testes de invariantes para segurança e fluxos.

Há trilhas para diversas ações administrativas, alterações de configuração, clientes, fretes, usuários, formulários e integrações. O projeto também possui analytics de visitas públicas com origem, mídia, campanha, referenciador, dispositivo e país aproximado.

### O que falta

A cobertura precisa ser validada endpoint por endpoint. O armazenamento em memória mantém no máximo 500 logs locais antes de descartar entradas antigas, portanto não é um trilho de auditoria imutável por si só. Não foi comprovada retenção, exportação, imutabilidade, alerta de alteração suspeita ou envio para armazenamento externo.

O login, logout, falhas de autenticação, 2FA, recuperação de senha e acesso a dados sensíveis devem ter eventos padronizados e pesquisáveis.

### Por onde começar

Definir um catálogo obrigatório de eventos de segurança. Persistir auditoria em tabela dedicada com retenção, índices e proteção contra alteração. Registrar sucesso e falha de login, encerramento de sessão, mudança de senha, recuperação, 2FA, exportação, visualização sensível, alteração de permissões e operações SaaS. Criar alertas para muitas falhas, login impossível e mudanças de administrador.

## 9. Isolamento de dados por cliente

### O que já existe

A aplicação usa `tenantId` em entidades e filtra várias consultas pelo tenant do usuário. Existem verificações explícitas para fretes, motoristas, veículos, usuários, formulários, relatórios, notificações, configurações e clientes. Usuários de empresa não podem escolher livremente outro tenant. Há testes de invariantes de clientes, relatórios, rastreamento público, CRM e sessões.

O rastreamento público usa tokens, whitelist e política por tenant. A configuração da API WhatsApp foi restringida ao Super Admin, reduzindo exposição de segredos.

### O que falta

A implementação ainda depende de disciplina de filtragem no código. O projeto mantém um modelo híbrido com memória e snapshot JSONB, sem prova de Row-Level Security do PostgreSQL. O teste local de invariantes não equivale a um teste E2E completo com dois tenants reais, dois usuários, dois tokens e todas as rotas.

Também é necessário revisar rotas novas e rotas legadas para garantir que cada leitura, escrita, exportação, download e consulta pública aplique a regra correta. Super Admin deve ser uma exceção explícita e auditada, não um bypass acidental.

### Por onde começar

Criar testes E2E automatizados com tenant A e tenant B. Semear dados exclusivos de cada um e testar cada endpoint com os dois tokens. Adicionar uma camada de acesso por tenant para reduzir filtros manuais. Quando o uso do PostgreSQL for definitivo, avaliar Row-Level Security para entidades críticas e consultas parametrizadas com tenant obrigatório.

## 10. Dependências atualizadas e sem vulnerabilidades conhecidas

### O que já existe

O projeto usa `package-lock.json`, `npm ci`, overrides do npm e possui script de testes e build. A imagem Docker instala dependências de produção separadamente no estágio final.

### Resultado da auditoria

`npm audit --omit=dev` retornou código 1 com quatro vulnerabilidades moderadas em dependências de produção:

| Dependência | Problema | Correção |
|---|---|---|
| `qs` | Dois avisos de possível negação de serviço por parsing controlado | Atualizar para versão corrigida via cadeia Express/body-parser |
| `body-parser` | Vulnerabilidade transitiva relacionada a `qs` | Atualizar cadeia |
| `express` | Vulnerabilidade transitiva relacionada a `qs` | Atualizar para versão corrigida compatível |
| `sanitize-html` | Dois avisos de XSS/mutation-XSS em versões até 2.17.6 | Atualizar para `2.17.7` ou posterior compatível |

Não foram encontrados avisos críticos ou altos no resultado executado, mas a condição “sem vulnerabilidade conhecida” não está atendida.

### Por onde começar

Atualizar primeiro `sanitize-html` e a cadeia `express`/`body-parser`/`qs`, revisar o lockfile e executar novamente `npm audit --omit=dev`. Depois executar lint, testes, build e smoke tests. Avaliar também `npm audit` incluindo dependências de desenvolvimento, porque a imagem de build instala o conjunto completo durante a compilação.

## Ordem priorizada de correção

### P0 — antes de homologação externa ou produção

1. **Corrigir dependências vulneráveis.** Atualizar `sanitize-html` e a cadeia `qs`/`body-parser`/`express`; repetir auditoria e regressão.
2. **Confirmar HTTPS obrigatório.** Fazer a validação no proxy real, redirecionar HTTP, fechar a porta direta da aplicação e testar HSTS, SSE e WebSocket.
3. **Implementar 2FA obrigatório para Super Admin e administradores de empresa.** Proteger especialmente integrações, usuários, certificados, planos e dados fiscais.
4. **Auditar o host de produção.** Confirmar firewall, portas, SSH somente por chave, ausência de Docker socket exposto, atualizações e execução não-root.
5. **Executar restauração real de backup.** Criar ambiente isolado, restaurar PostgreSQL e executar smoke tests; configurar cópia externa cifrada e, idealmente, imutável.

### P1 — imediatamente depois

6. **Adicionar Turnstile/CAPTCHA adaptativo** no login, cadastro, recuperação de senha e formulários públicos.
7. **Substituir rate limit em memória por armazenamento distribuído** e implementar bloqueio crescente por tentativa.
8. **Completar auditoria de autenticação e eventos sensíveis**, com persistência, retenção, alertas e proteção contra alteração.
9. **Executar suíte E2E de isolamento entre dois tenants** e revisar todas as rotas de leitura, escrita, exportação e download.
10. **Confirmar criptografia em repouso** para volumes, PostgreSQL, backups e dados sensíveis, com gestão separada das chaves.

### P2 — endurecimento contínuo

11. Aplicar usuário não-root, limites de recursos, filesystem somente leitura quando possível e capabilities mínimas no container.
12. Adicionar monitoramento de expiração de JWT, sessões, certificados, backups e chaves.
13. Integrar análise contínua de dependências no CI/CD e bloquear releases com vulnerabilidades acima do nível definido.
14. Criar revisão periódica de permissões, logs e acessos privilegiados.

## Conclusão

A base atual possui controles relevantes: bcrypt, JWT com sessão, rate limit básico, headers de segurança, CORS restrito, cifragem de alguns segredos, auditoria com IP, backups com hash, testes de invariantes e filtragem multi-tenant.

Entretanto, **o sistema ainda não atende integralmente às 10 camadas solicitadas**. Os pontos mais urgentes são 2FA, HTTPS comprovado no proxy, hardening real da VPS, restauração de backup, correção das quatro vulnerabilidades do `npm audit`, CAPTCHA e rate limit progressivo.

A auditoria deve ser repetida no ambiente de produção antes da comercialização. Nenhuma conclusão sobre firewall, SSH, portas, criptografia do disco, backup externo ou proxy pode ser considerada definitiva apenas com os arquivos do projeto.
