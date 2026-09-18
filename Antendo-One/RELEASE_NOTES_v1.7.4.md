# Atendo One — Release v1.7.4

## Escopo

Esta release conclui a etapa local de prontidão comercial relacionada a **governança jurídica**, **sessão única**, **PWA/Home** e **segurança operacional**, preservando os dados persistidos e mantendo a integração Asaas desabilitada.

## Alterações incluídas

| Área | Resultado |
|---|---|
| Governança jurídica | Termos de Uso e Política de Privacidade editáveis pelo Super Admin, com histórico de versões, publicação controlada e preservação do conteúdo persistido. |
| Sessão única | O backend emite `sid` por login e revoga a sessão anterior do mesmo usuário; o middleware rejeita JWTs cuja sessão não seja a ativa. |
| Persistência | O histórico jurídico e metadados de sessão são persistidos no `app_state`/camada de banco existente, sem `DROP` ou limpeza de dados de produção. |
| PWA | Manifesto local com `start_url: /login` e ícones PNG Atendo One em 192x192 e 512x512. |
| Home | Remoção do texto técnico de carregamento e manutenção da Home institucional/SEO. |
| Release | Versão visível e `package.json` atualizados para `v1.7.4`/`1.7.4`. |
| Asaas | Nenhuma ativação ou envio de credencial foi realizado nesta etapa. |

## Validações executadas

| Verificação | Resultado |
|---|---|
| `npm test` | PASS — todas as invariantes de autenticação, segurança, jurídico, backup, SEO e integrações existentes. |
| `npm run lint` | PASS — TypeScript sem erros. |
| `npm run build` | PASS — frontend e servidor compilados. |
| `node tests/secret-scan.cjs` | PASS — nenhum segredo detectado no código validado. |
| `npm run test:browser` | PASS local — Home, `/elo-log`, página de conteúdo e 404 real sem `ChunkLoadError`, erro de runtime ou padrão de segredo. |

O build ainda emite apenas o aviso conhecido de chunks grandes de Mapbox/documentos; isso não bloqueia a publicação e permanece como otimização posterior.

## Verificação de produção antes do deploy

Na consulta pública realizada em 27/08/2026, a Home de `https://gestor.atendo.log.br/` respondeu e apresentou o conteúdo institucional sem o texto técnico de carregamento. Entretanto, `https://gestor.atendo.log.br/manifest.json` ainda retornou o manifesto anterior, com `start_url: "/"` e apenas `/favicon.svg`. Portanto, a v1.7.4 **ainda não está publicada na produção**; o deploy é necessário para que o PWA passe a abrir em `/login` e use os novos ícones.

## Procedimento de publicação na VPS

Executar no diretório da aplicação, após confirmar que o backup de produção está concluído:

```bash
cd /opt/elolog
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="/root/elolog-backup-v1.7.4-${STAMP}"
mkdir -p "$BACKUP"

docker service ls > "$BACKUP/docker-services.txt"
docker ps --no-trunc > "$BACKUP/docker-ps.txt"
# Ajustar o nome do serviço e do volume conforme o ambiente real:
docker inspect $(docker ps -q --filter name=elo-log | head -1) > "$BACKUP/container-inspect.json" 2>/dev/null || true

# Se o repositório estiver atualizado localmente, preservar o .env e atualizar a fonte.
git status --short
# Copiar/extraír o pacote v1.7.4 para /opt/elolog sem substituir .env.
unzip -q -o /caminho/atendo-one-v1.7.4-source.zip -d /opt/elolog

npm ci
npm test
npm run lint
npm run build

# Em Swarm, usar a estratégia start-first configurada no stack/compose:
docker stack deploy --with-registry-auth -c docker-compose.yml elolog

# Acompanhar a convergência sem remover a versão anterior antes da nova ficar saudável:
docker service ls
docker service ps elolog_app --no-trunc
docker service logs --tail 100 -f elolog_app
```

Antes de executar o comando de deploy, confirmar o **nome real do stack/serviço** com `docker stack ls` e `docker service ls`; não assumir `elolog_app` se o ambiente usar outro nome. Não alterar `.env`, banco, volumes, tokens de WhatsApp ou Asaas durante esta etapa.

## Smoke test pós-deploy

```bash
curl -fsS https://gestor.atendo.log.br/manifest.json
curl -fsS https://gestor.atendo.log.br/icons/atendo-one-192.png -o /tmp/atendo-one-192.png
curl -fsS https://gestor.atendo.log.br/icons/atendo-one-512.png -o /tmp/atendo-one-512.png
file /tmp/atendo-one-192.png /tmp/atendo-one-512.png
curl -fsS https://gestor.atendo.log.br/ | grep -E 'Atendo One|gestão logística'
```

O manifesto esperado deve conter `start_url: "/login"`, os ícones `/icons/atendo-one-192.png` e `/icons/atendo-one-512.png`, e `display: "standalone"`.

## Validação funcional da sessão única

1. Abrir uma janela/dispositivo A, autenticar o mesmo usuário e confirmar acesso ao painel.
2. Abrir uma janela/dispositivo B, autenticar o mesmo usuário novamente.
3. Confirmar que o acesso em B funciona.
4. Fazer uma chamada autenticada ou recarregar o painel em A e confirmar resposta `401`, limpeza do token local e retorno à tela de login.
5. Confirmar que usuários diferentes continuam podendo acessar simultaneamente e que contas `REAL` não são classificadas como teste.

## Rollback

Se o health check ou o smoke test falhar, não apagar o backup. Em Swarm, reverter a atualização do serviço:

```bash
docker service update --rollback elolog_app
# ou, conforme o stack real:
docker stack deploy -c /opt/elolog/docker-compose.yml elolog
```

Depois, consultar os logs e preservar o relatório do incidente. A restauração do banco só deve ser feita se houver evidência de corrupção, pois a aplicação foi preparada para manter os dados existentes.

## Artefatos

- `atendo-one-v1.7.4-source.zip`
- `atendo-one-v1.7.4-source.zip.sha256`
- `public/icons/atendo-one-192.png`
- `public/icons/atendo-one-512.png`

Checksum do pacote-fonte gerado localmente:

```text
ae491b0505e1995cf0061bd7f84bb2327c6a552814b8e5103045e846ba207902  atendo-one-v1.7.4-source.zip
```

## Limite operacional atual

O workspace local não possui a chave privada SSH da VPS; a chave pública temporária não permite autenticação de saída. Por isso, o deploy direto e o backup pré-deploy na VPS não foram executados a partir deste ambiente. O pacote e os comandos acima estão prontos para execução via Bitvise/terminal da VPS, preservando o `.env` e os volumes existentes.
