# Atendo One v1.8.62 — consolidação corrigida

## Escopo

Consolidação local da versão não publicada v1.8.61 com correções de marca, formulários, usuários, permissões, despesas e isolamento por empresa. **Nenhum deploy ou alteração na VPS foi realizado.**

## Correções incluídas

- Marca visível normalizada para **Atendo One** nas mensagens de OTP e cadastro; identificadores técnicos legados foram preservados para compatibilidade.
- Versão atualizada para `v1.8.62`.
- Campos de formulários normalizados no backend: tipos permitidos, tamanho de rótulos, opções limitadas, obrigatoriedade, categorias e eventos válidos.
- Respostas de formulários validadas no servidor e vinculadas ao `tenantId` do formulário.
- Respostas de formulário agora fazem `persistNow()` tanto na criação quanto na atualização; o formulário não depende apenas do estado em memória.
- Assinatura obrigatória passa a ser registrada no campo correspondente no frontend.
- Checkbox, e-mail, data, hora e telefone receberam renderização/validação adequada.
- Upload de imagem limitado a imagens de até 8 MB.
- Usuários: normalização de nome/e-mail/telefone, validação de duplicidade, senha mínima, bloqueio de autoelevação e persistência explícita de criação/edição.
- Edição de motorista associado acompanha os dados normalizados do usuário.
- Despesas podem ser cadastradas **sem frete vinculado**; `freight_id` permanece nulo e a tabela PostgreSQL já suporta esse cenário.
- Usuários de teste/demonstração podem registrar despesas operacionais no tenant de teste; cobranças, tokens e configurações protegidas continuam bloqueados.
- Listagem e consulta de despesas não expõem registros sem empresa para usuários comuns.
- Despesas são persistidas em `trip_expenses` com `tenant_id`; frete e motorista são opcionais quando não houver vínculo.
- Atualização do cadastro global de motorista passou a persistir no banco.
- Um mesmo motorista pode ser vinculado a várias empresas: o motorista global é único e cada aprovação/perfil fica em `driverCompanyLinks` e `driverCompanyProfiles` por par `(driverId, tenantId)`.

## Validação

- `npm ci --ignore-scripts --no-audit --no-fund`: concluído.
- `npx tsc --noEmit`: aprovado.
- Build frontend Vite: aprovado; apenas aviso não bloqueante de chunks grandes.
- Bundle backend com esbuild: aprovado.
- `npm test`: todos os testes existentes e a nova suíte `v1862-hardening.invariants.cjs` aprovados.

## Publicação

O pacote gerado é uma **release candidata para produção**. Antes de publicar, manter o procedimento operacional: backup PostgreSQL, backup da especificação do serviço, build da imagem, atualização Swarm `start-first`, verificação HTTP, preservação da imagem ativa e de rollback, e limpeza somente após a validação.
