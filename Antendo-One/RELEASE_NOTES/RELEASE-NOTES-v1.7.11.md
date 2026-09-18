# Atendo One — Release v1.7.11

## Objetivo

Esta release consolida a correção do carregamento inicial da home, as medidas de segurança já aplicadas na base protegida e as alterações compatíveis encontradas no pacote `atualizacao.zip`.

## Alterações incorporadas

- O SSR da home mantém metadados SEO no `<head>`, mas entrega o `#root` vazio para que o React faça a montagem sem exibir temporariamente o texto SEO no corpo da página.
- O SSR de páginas públicas de conteúdo foi preservado.
- Foi adicionado rastreio público por código, limitado a fretes publicados, disponíveis e não expirados.
- O rastreio público devolve apenas dados operacionais mínimos: código, empresa, cidades, endereços operacionais, datas, carga resumida, status e identificação operacional limitada. Não devolve pagamento, telefone do motorista, documentos, histórico interno, dados bancários, `tenantId` ou respostas de formulários.
- O formulário de novo frete passou a iniciar com a data atual para coleta e o dia seguinte para entrega, em vez de datas fixas antigas.
- O teste do token Mapbox passou a reutilizar a chave já armazenada quando o campo está mascarado e a codificar o token na URL da requisição.
- O override de dependência fixa o Quill em `2.0.2`, eliminando o advisory residual encontrado no `quill@2.0.3`.
- A suíte recebeu uma invariante específica para impedir regressões na exposição do rastreio público.
- Permanecem incluídos o hardening de headers, sanitização server-side/client-side, proteção de OTP, RBAC, isolamento demo, prevenção de mass assignment, proteção de push, SSRF e preservação de dados da base local.

## Alterações rejeitadas do pacote original

O `atualizacao.zip` não foi publicado diretamente porque continha um `server.ts` antigo sem as proteções atuais, um `server/api.ts` que reintroduzia fallback de segredo JWT, chaves VAPID embutidas e aceitação de identificador de usuário como token, além de `Object.assign(freight, req.body)` e um endpoint de rastreio que devolvia o objeto completo do frete. O pacote também não continha `Dockerfile` e apresentava divergência entre `package.json` e `package-lock.json`.

## Validação local

- `npm ci --ignore-scripts`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: aprovado, incluindo as invariantes de segurança, demo, SEO, HTTP, backup, relatórios e rastreio público.
- `npm run build`: aprovado.
- `npm audit --omit=dev --audit-level=moderate`: aprovado sem vulnerabilidades encontradas.
- Dependência efetiva: `react-quill-new@3.7.0` com `quill@2.0.2`.

## Publicação

A publicação em produção deve ocorrer somente após transferência do pacote corrigido para `/root/releases/`, criação de backup PostgreSQL e backup da especificação do serviço. O serviço correto é `elolog_app`, usando atualização Swarm `start-first`; não usar `docker stack deploy`, remoção de volumes, `docker system prune` ou limpeza de outros serviços.
