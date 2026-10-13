# Atendo One v1.8.70

## Escopo

Consolidação das correções de notificações operacionais, isolamento por empresa, Web Push/PWA e comportamento do painel do sino.

## Correções implementadas

### WhatsApp por empresa

- Cada destinatário de empresa é resolvido pelo `tenantId` do próprio usuário.
- Empresas com canal individual ativo usam sua configuração individual.
- Empresas sem canal individual continuam usando o gateway geral do SaaS, quando permitido pelo plano.
- O Super Admin usa exclusivamente o canal global do SaaS.
- Destinatários de outro tenant são removidos antes do dispatch.
- Consentimento de WhatsApp continua obrigatório para notificações operacionais.
- Nenhum token, número ou conteúdo de mensagem é gravado no ledger de entregas.

### Alertas de novos fretes

- Removido o broadcast PWA global, que poderia alcançar usuários de outras empresas.
- Frete direcionado gera uma única entrega para o motorista selecionado.
- Fretes publicados sem direcionamento são enviados somente aos motoristas elegíveis da empresa.
- A elegibilidade exige usuário ativo, motorista disponível, vínculo aprovado ou cadastro direto no tenant, CNH compatível e veículo ativo compatível com tipo, capacidade e carroceria.
- Vínculos bloqueados, veículos inativos e motoristas indisponíveis não recebem alertas.
- WhatsApp, notificação interna e PWA recebem o mesmo conjunto isolado de destinatários.

### Web Push/PWA

- Assinaturas são indexadas por usuário e tenant.
- O servidor remove subscriptions expiradas e atualiza a assinatura quando o usuário troca de chave/dispositivo.
- O teste de Push não é mais broadcast: fica limitado ao próprio Super Admin autenticado.
- A ativação continua bloqueada para contas de teste/demo.

### Painel de notificações

- O sino alterna entre abrir e fechar.
- O painel fecha ao clicar fora, em desktop e mobile.
- Foram adicionados atributos de acessibilidade (`aria-expanded`, `aria-controls` e rótulos dinâmicos).

## Limite geográfico

A versão não inventa um raio ou uma preferência regional que ainda não existe no cadastro do motorista. A elegibilidade atual usa a empresa, vínculo, status, CNH e veículo. Para alertas por cidade/UF ou distância em quilômetros será necessário adicionar preferências explícitas ao perfil do motorista e coordenadas/atualização de localização com consentimento.

## Validações executadas

- `npx tsc --noEmit`: aprovado.
- `npx vite build`: aprovado.
- Bundle backend com esbuild: aprovado.
- `npm test`: aprovado antes da consolidação final e deve ser repetido no empacotamento.
- Invariantes WhatsApp, tenant, notificações, PWA, hardening e `v1870-notification-isolation`: aprovadas.

## Deploy

Esta release foi validada somente na cópia local. Nenhuma VPS, banco, volume, secret ou serviço de produção foi alterado. O deploy deve seguir o procedimento de backup PostgreSQL, conferência da imagem ativa, atualização Swarm `start-first`, validação HTTP e preservação da imagem de rollback.
