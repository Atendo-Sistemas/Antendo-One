# Atendo One — Release v1.7.19

## Correções de segurança

Esta versão corrige a autorização do endpoint de cópia de formulários. Administradores de uma empresa somente podem copiar formulários do próprio tenant ou modelos globais explicitamente marcados como oficiais. A correção impede que o ID de um formulário de outra empresa seja usado para obter sua definição completa.

O rastreamento público passou a utilizar um token aleatório de 128 bits por frete. Fretes existentes recebem tokens durante a hidratação do estado persistido. O endpoint público não aceita mais o código sequencial do frete nem o ID interno. Os links compartilhados pelo modal usam o token seguro.

A política `Permissions-Policy` passou a permitir câmera e geolocalização somente no próprio domínio, mantendo o microfone desabilitado. Essa alteração permite o funcionamento das funções de checklist e localização que dependem do navegador. O health check passou a utilizar `Cache-Control: no-store`.

As respostas de login para usuário inexistente e senha incorreta foram uniformizadas para reduzir enumeração de contas. As mensagens de conta pendente e usuários sem senha continuam diferenciadas por compatibilidade operacional e devem ser uniformizadas em uma etapa posterior caso o produto adote autenticação totalmente indistinguível.

## Observações de implantação

Esta release não foi publicada automaticamente e não altera o ambiente de produção. Os links antigos no formato `?rastreio=FRT-2026-0001` deixarão de funcionar depois da publicação; novos links devem ser gerados pelo botão de compartilhamento da versão v1.7.19. Recomenda-se comunicar a mudança aos usuários que mantêm links antigos.

A limitação de rate limiting distribuído permanece. A aplicação ainda utiliza contadores em memória por processo. Em Docker Swarm com múltiplas réplicas, a proteção definitiva deve ser complementada no Cloudflare/WAF ou com Redis compartilhado.

A auditoria de PostgreSQL, Redis, Docker Swarm, firewall, SSH, volumes, secrets, proxy e testes autenticados entre duas empresas permanece pendente de acesso administrativo autorizado ao ambiente de produção ou de um staging equivalente.

## Validação esperada

A entrega deve ser validada com `npm run lint`, `npm test`, `npm run build` e testes manuais controlados do fluxo de rastreamento. Antes do deploy, deve ser confirmada a presença de `JWT_SECRET`, das chaves de integração e do estado persistido do banco. Nenhuma migration de banco é necessária para o campo opcional do token.
