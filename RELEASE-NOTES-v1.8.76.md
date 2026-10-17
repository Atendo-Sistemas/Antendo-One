# Atendo One v1.8.76 — Auditoria de perfis, permissões e propagandas segmentadas

## Escopo

Release consolidada das correções pendentes da auditoria anterior. O trabalho foi realizado em cópia local, sem acesso, alteração ou deploy na VPS de produção.

## Auditoria concluída por perfil

- **Super Admin SaaS:** mantém gestão global de empresas, usuários, motoristas, configurações, auditoria, integrações e agora banners. A administração de banners exige conta real com papel `SUPER_ADMIN`.
- **Super Admin da empresa (`EMPRESA_SUPER_ADMIN`):** permanece limitado à própria empresa para diretório, fretes, veículos próprios, mensagens, relatórios e configurações autorizadas. Não recebe controles globais do SaaS.
- **Administrador (`ADMIN`):** mantém gestão operacional e de diretório dentro da própria empresa, sem acesso a controles globais, backups, logs técnicos ou outras empresas.
- **Supervisor (`SUPERVISOR`):** mantém operação autorizada, leitura e prestação de contas conforme o fluxo, sem criação/edição administrativa de usuários, motoristas, veículos ou banners.
- **Usuário (`USUARIO`):** permanece com acesso operacional e de consulta permitido pelo tenant, sem gravações administrativas.
- **Motorista (`MOTORISTA`):** permanece restrito aos próprios fretes, perfil, localização consentida, notificações e prestações autorizadas; não acessa métricas administrativas, auditoria, diretório ou configurações de empresa.
- **Contas de teste/demonstração:** continuam somente leitura para gravações, com simulação isolada e sem acesso a pagamentos, integrações, banners administrativos, backups ou logs técnicos.

## Correções de autorização

- Cadastro global de motorista, criação de vínculos e edição do perfil empresarial passaram a exigir administradores reais.
- `EMPRESA_SUPER_ADMIN` foi incluído corretamente na desativação de motoristas da própria empresa.
- Escopo por tenant continua sendo validado no backend; ocultar um menu no frontend não é tratado como controle de segurança.
- Acesso direto a telas internas usa a matriz central de abas autorizadas.
- Mensagens de erro visíveis ao cliente permanecem normalizadas, sem nomes de endpoints, tokens ou detalhes de infraestrutura.

## Módulo de propagandas e banners

- CRUD protegido no painel **Super Admin > Propagandas e Banners**.
- Campos: título, imagem por URL HTTPS/caminho interno, link opcional, formato, prioridade, janela de publicação e status.
- Abertura do link na mesma aba ou em nova janela com `noopener noreferrer`.
- Locais: Início, Painel geral, Fretes, Central de operação e Portal do motorista.
- Segmentação independente por papel, empresa e usuário. Listas vazias significam todos os destinatários daquele critério.
- Consulta visível filtra por sessão, tenant, papel, usuário, status e período; o DTO não expõe as regras de segmentação.
- URLs `javascript:`, `data:` e protocolos não permitidos são rejeitados.
- Preview no painel administrativo e exibição nos painéis autorizados.

## Validações

- TypeScript: aprovado.
- Invariantes específicas de configurações: aprovado.
- Invariantes de perfis, diretório de motoristas e banners: aprovado.
- Build frontend/backend e suíte oficial devem ser executados antes de qualquer publicação.

## Limites desta etapa

- Imagens são referenciadas por URL; upload gerenciado de arquivos não foi incluído.
- O módulo não publica nem agenda campanhas externas automaticamente.
- A release não contém credenciais, dumps de produção, `node_modules` ou `dist`.
