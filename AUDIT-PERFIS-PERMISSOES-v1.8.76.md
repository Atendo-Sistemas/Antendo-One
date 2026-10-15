# Auditoria de perfis e permissões — Atendo One v1.8.76

## Resultado

A matriz abaixo foi comparada entre menus, guards do frontend, rotas do backend e invariantes estruturais. O backend permanece a autoridade final; a ocultação de um menu não é usada como controle de segurança.

| Perfil | Escopo de dados | Pode gravar | Pode administrar | Restrições principais |
|---|---|---|---|---|
| `SUPER_ADMIN` | Global, com seleção explícita de empresa quando necessário | Sim, em controles SaaS e tenants | Empresas, usuários, motoristas, fretes, integrações, auditoria, backups e banners | Não deve receber segmentações de tenant como dados de outro perfil; ações globais exigem conta real |
| `EMPRESA_SUPER_ADMIN` | Própria empresa e vínculos aprovados | Sim, nos recursos da empresa | Usuários, motoristas, veículos próprios, fretes, mensagens, relatórios e configurações autorizadas | Não acessa controles SaaS globais, backups, logs técnicos ou outras empresas |
| `ADMIN` | Própria empresa | Sim, nos recursos administrativos permitidos | Diretório, operação, fretes, veículos próprios, mensagens e relatórios | Sem controles globais; sem acesso entre tenants |
| `SUPERVISOR` | Própria empresa, conforme operação | Operação e prestação autorizadas | Ações operacionais permitidas, sem gestão administrativa completa | Não cria usuários/motoristas, não altera banners e não acessa controles globais |
| `USUARIO` | Própria empresa, somente dados liberados | Somente ações de negócio liberadas pelo fluxo | Nenhuma administração de diretório ou plataforma | Sem cadastro de motorista, vínculos, veículos, banners, auditoria ou configurações globais |
| `MOTORISTA` | Próprios fretes, perfil, localização consentida e prestações próprias | Perfil próprio, localização consentida e etapas do próprio fluxo | Nenhuma administração | Sem métricas administrativas, auditoria, diretório, empresa, banners ou dados de outros motoristas |
| Conta `TEST`/demo | Tenant fictício isolado | Não; somente simulação | Nenhuma função de produção | Sem pagamentos, tokens, SMTP, WhatsApp administrativo, backups, logs técnicos ou banners administrativos |

## Pontos corrigidos

O cadastro global de motorista, a criação de vínculo empresa-motorista e a edição do perfil empresarial agora exigem um administrador real. O `EMPRESA_SUPER_ADMIN` foi incluído na desativação de motoristas da própria empresa. A edição do próprio perfil pelo motorista continua permitida, mas os campos administrativos permanecem protegidos.

Fretes têm guards separados para criação, edição, atribuição, aceite, cancelamento e transição de status. A conta demo não grava. Rotas de métricas e auditoria não entregam dados administrativos a motoristas. Recursos locais, formulários, veículos próprios, usuários, clientes, despesas e templates permanecem tenant-scoped.

O acesso direto por estado interno ou URL passa pela aba sanitizada do `App`. Menus desktop e mobile foram comparados com a mesma matriz. As mensagens visíveis usam o normalizador central e não expõem tokens, nomes internos de APIs ou detalhes da infraestrutura.

## Propagandas segmentadas

O Super Admin real possui o módulo **Propagandas e Banners**. Cada banner pode ter título, imagem por HTTPS ou caminho interno, link opcional, abertura na mesma aba ou nova janela, prioridade, período e status. Os locais são Início, Painel geral, Fretes, Central de operação e Portal do motorista.

A visibilidade é calculada no backend pela combinação de status, período, local, papel, empresa e usuário. Uma lista vazia significa todos dentro daquele critério. O DTO visível não devolve os critérios de segmentação. Contas demo não consultam o CRUD administrativo.

## Validação executada

A versão foi validada com `npx tsc --noEmit`, build frontend/backend, suíte oficial completa e invariantes específicas de configurações, perfis, diretório de motoristas e banners. Nenhuma alteração foi feita na VPS ou no banco de produção.
