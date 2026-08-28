# Guia de atualização do Atendo One para v1.7.4

## Resposta direta sobre o ZIP

O arquivo `atendo-one-v1.7.4-source.zip` **não está na VPS**. Ele foi gerado e validado no workspace local. O arquivo e seu checksum precisam ser baixados para o computador que possui o Bitvise e depois enviados para a VPS.

O checksum atual do pacote é:

```text
6d1218ffa52e5b37f69f349ecdf1ba32b67ce2ce5c6b93a0cb88a2ac18287aa3  atendo-one-v1.7.4-source.zip
```

Não envie nem substitua o arquivo `.env`, volumes Docker, banco PostgreSQL ou tokens existentes pelo conteúdo do ZIP. O pacote contém a fonte e os arquivos de configuração versionados, mas o `.env` de produção deve permanecer exclusivamente na VPS.

## 1. Baixar os artefatos para o computador com Bitvise

Baixe estes arquivos da conversa para uma pasta local:

```text
atendo-one-v1.7.4-source.zip
atendo-one-v1.7.4-source.zip.sha256
```

Se o Bitvise permitir transferência SFTP, envie os dois arquivos para uma área temporária da VPS, por exemplo:

```text
/root/releases/
```

Não envie o arquivo para dentro de um volume de banco ou para a pasta pública do site.

## 2. Conferir o pacote antes de mexer na aplicação

No terminal SSH da VPS, execute:

```bash
mkdir -p /root/releases
cd /root/releases
ls -lh atendo-one-v1.7.4-source.zip atendo-one-v1.7.4-source.zip.sha256
sha256sum -c atendo-one-v1.7.4-source.zip.sha256
```

O resultado esperado é `OK`. Se houver divergência de checksum, interrompa a atualização e transfira o arquivo novamente.

## 3. Identificar o ambiente real sem alterar nada

Execute os comandos abaixo e guarde a saída em um arquivo de auditoria:

```bash
cd /opt/elolog
STAMP=$(date +%Y%m%d-%H%M%S)
AUDIT="/root/releases/predeploy-${STAMP}"
mkdir -p "$AUDIT"

docker stack ls | tee "$AUDIT/docker-stack-ls.txt"
docker service ls | tee "$AUDIT/docker-service-ls.txt"
docker ps --no-trunc | tee "$AUDIT/docker-ps.txt"
ss -ltnp | tee "$AUDIT/listening-ports.txt"

printf '\n=== compose relevante ===\n' | tee "$AUDIT/compose-review.txt"
grep -nE '^(services:|[[:space:]]+[A-Za-z0-9_-]+:)|update_config:|rollback_config:|order:|healthcheck:|image:|build:|ports:|volumes:' docker-compose.yml docker-compose.portainer.yml 2>/dev/null | tee -a "$AUDIT/compose-review.txt"
```

Anote o nome exato do stack e do serviço da aplicação. Não presuma que o nome seja `elolog_app`; o nome pode ser diferente conforme o ambiente.

## 4. Fazer o backup pré-deploy obrigatório

O backup deve ser feito **antes de extrair ou copiar qualquer arquivo**. Primeiro preserve a fonte atualmente instalada, o `.env` e os arquivos de orquestração:

```bash
cd /opt/elolog
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="/root/elolog-backup-v1.7.4-${STAMP}"
mkdir -p "$BACKUP"

# Fonte e configurações, sem incluir dependências pesadas ou artefatos temporários.
tar --exclude='./node_modules' --exclude='./dist' --exclude='./.git' -czf "$BACKUP/source-before-v1.7.4.tgz" -C /opt elolog

# Copia protegida do ambiente. Não imprimir o conteúdo na tela.
if [ -f /opt/elolog/.env ]; then
  install -m 600 /opt/elolog/.env "$BACKUP/.env.before-v1.7.4"
fi

# Orquestração e estado do Docker.
cp -a /opt/elolog/docker-compose*.yml "$BACKUP/" 2>/dev/null || true
docker stack ls > "$BACKUP/docker-stack-ls.txt"
docker service ls > "$BACKUP/docker-service-ls.txt"
docker ps --no-trunc > "$BACKUP/docker-ps.txt"
```

### 4.1. Backup do PostgreSQL

Localize o contêiner do PostgreSQL sem expor senha ou variáveis:

```bash
docker ps --format '{{.ID}} {{.Names}} {{.Image}}' | grep -Ei 'postgres|postgre' || true
```

Use o nome real encontrado para definir `PG_CONTAINER`. Depois identifique o banco e usuário a partir da configuração já existente, sem publicar os valores:

```bash
PG_CONTAINER='COLOQUE_AQUI_O_NOME_REAL_DO_POSTGRES'
docker inspect "$PG_CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | sed -E 's/((PASSWORD|PASS|TOKEN|SECRET|KEY)=).*/\1[REDACTED]/I' \
  | grep -Ei 'POSTGRES|PG|DATABASE|DB_' > "$BACKUP/postgres-env-redacted.txt"
```

Com os valores locais do ambiente, execute o dump. Se a imagem não tiver `pg_dump`, execute pelo cliente PostgreSQL disponível na VPS:

```bash
# Substitua somente os três marcadores abaixo no terminal da VPS.
PG_CONTAINER='NOME_REAL_DO_POSTGRES'
PG_USER='USUARIO_REAL_DO_BANCO'
PG_DATABASE='NOME_REAL_DO_BANCO'

docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DATABASE" --format=custom --file=/tmp/atendo-before-v1.7.4.dump

docker cp "$PG_CONTAINER:/tmp/atendo-before-v1.7.4.dump" "$BACKUP/postgres-before-v1.7.4.dump"

docker exec "$PG_CONTAINER" rm -f /tmp/atendo-before-v1.7.4.dump
```

Se o PostgreSQL estiver fora do Docker, utilize `pg_dump` na própria VPS com a mesma política: o arquivo deve ser salvo dentro de `$BACKUP` e não deve ser exibido no terminal.

### 4.2. Conferir se o backup é utilizável

```bash
find "$BACKUP" -maxdepth 1 -type f -printf '%f %s bytes\n' | sort

test -s "$BACKUP/source-before-v1.7.4.tgz" && echo SOURCE_BACKUP_OK
if [ -f "$BACKUP/postgres-before-v1.7.4.dump" ]; then
  test -s "$BACKUP/postgres-before-v1.7.4.dump" && echo POSTGRES_BACKUP_OK
fi

sha256sum "$BACKUP"/* > "$BACKUP/SHA256SUMS"
chmod -R go-rwx "$BACKUP"
echo "BACKUP=$BACKUP"
```

Não prossiga se o arquivo da fonte estiver vazio. Para uma atualização com dados de produção, também não prossiga sem um dump PostgreSQL válido ou sem a confirmação de que o banco é externo e possui backup independente recente.

## 5. Preparar a nova fonte sem substituir o `.env`

Extraia o ZIP em uma pasta de release isolada:

```bash
RELEASE=/opt/elolog/releases/v1.7.4
rm -rf "$RELEASE"
mkdir -p "$RELEASE"
unzip -q /root/releases/atendo-one-v1.7.4-source.zip -d "$RELEASE"
```

Confira arquivos críticos:

```bash
test -f "$RELEASE/Dockerfile" && echo DOCKERFILE_OK
test -f "$RELEASE/package.json" && echo PACKAGE_OK
test -f "$RELEASE/server.ts" && echo SERVER_OK
test -f "$RELEASE/public/manifest.json" && echo MANIFEST_OK
test -f "$RELEASE/public/icons/atendo-one-192.png" && echo ICON_192_OK
test -f "$RELEASE/public/icons/atendo-one-512.png" && echo ICON_512_OK

grep -nE '"start_url"|atendo-one-(192|512)\.png' "$RELEASE/public/manifest.json"
```

O resultado esperado do manifesto é `start_url` igual a `/login`, com os dois ícones PNG do Atendo One.

Antes de atualizar `/opt/elolog`, preserve o `.env` que já está em produção:

```bash
if [ -f /opt/elolog/.env ]; then
  cp -a /opt/elolog/.env "$RELEASE/.env"
  chmod 600 "$RELEASE/.env"
fi
```

Agora, somente depois de confirmar que o backup existe, sincronize a fonte para a pasta usada pelo deploy. Se o stack atual lê os arquivos diretamente de `/opt/elolog`, execute:

```bash
cd /opt/elolog
find "$RELEASE" -mindepth 1 -maxdepth 1 ! -name '.env' -exec cp -a {} /opt/elolog/ \;
```

Esse comando não remove volumes, não remove o banco e não substitui o `.env`. Se o stack atual usa outro diretório de projeto, mantenha o caminho real identificado no passo 3.

## 6. Validar a configuração e o modo start-first

Confirme que a configuração do Swarm possui atualização gradual. O serviço deve usar uma política equivalente a:

```yaml
deploy:
  update_config:
    parallelism: 1
    order: start-first
    failure_action: rollback
  rollback_config:
    parallelism: 1
    order: start-first
```

Se o arquivo usado pelo stack não possuir `order: start-first`, não prossiga silenciosamente: ajuste o arquivo de orquestração em uma mudança separada, valide e faça novo backup do arquivo. A aplicação nova precisa ficar saudável antes de o Swarm retirar a anterior.

Valide a composição sem imprimir segredos:

```bash
cd /opt/elolog
docker compose config >/tmp/atendo-one-v1.7.4-compose-rendered.yml

grep -nE 'update_config:|rollback_config:|order: start-first|healthcheck:' \
  /tmp/atendo-one-v1.7.4-compose-rendered.yml || true
```

Não altere, nesta etapa, URL/token do WhatsApp, credenciais Asaas, chaves JWT, senha do banco ou qualquer valor do `.env`. O Asaas deve permanecer desabilitado conforme o ambiente atual.

## 7. Publicar no Docker Swarm

Use o nome real do stack obtido no passo 3. Exemplo, se o stack for `elolog`:

```bash
cd /opt/elolog
STACK_NAME='NOME_REAL_DO_STACK'
docker stack deploy --with-registry-auth -c docker-compose.yml "$STACK_NAME"
```

Acompanhe a atualização:

```bash
docker stack services "$STACK_NAME"
docker service ls
docker service ps --no-trunc NOME_REAL_DO_SERVICO
```

Aguarde o serviço novo atingir o estado `Running`/`1/1` ou a quantidade esperada de réplicas. Não remova manualmente o contêiner anterior durante essa janela.

## 8. Smoke test pós-deploy

Após o serviço estar saudável, execute:

```bash
curl -fsS https://gestor.atendo.log.br/ | grep -E 'Atendo One|gestão logística'
curl -fsS https://gestor.atendo.log.br/manifest.json
curl -fsS https://gestor.atendo.log.br/icons/atendo-one-192.png -o /tmp/atendo-one-192.png
curl -fsS https://gestor.atendo.log.br/icons/atendo-one-512.png -o /tmp/atendo-one-512.png
file /tmp/atendo-one-192.png /tmp/atendo-one-512.png
curl -sS -o /dev/null -w 'HTTP_404=%{http_code}\n' https://gestor.atendo.log.br/nao-existe-deploy-test
```

Critérios esperados:

| Teste | Resultado esperado |
|---|---|
| Home | HTTP 200, título Atendo One e ausência do texto técnico de carregamento. |
| Manifesto | `start_url: "/login"`, display standalone e ícones 192/512 PNG. |
| Ícones | Arquivos reconhecidos como PNG nas dimensões corretas. |
| Rota desconhecida | HTTP 404 real e página compreensível. |
| Banco | Dados de usuários, empresas, fretes e configurações continuam presentes. |

## 9. Validar sessão única

Faça este teste manual em duas máquinas ou em duas janelas com armazenamento separado:

1. Autentique o mesmo usuário na máquina A e confirme que o painel abre.
2. Autentique o mesmo usuário na máquina B e confirme que o segundo acesso abre.
3. Volte à máquina A e recarregue o painel ou execute uma ação autenticada.
4. Confirme que a sessão A recebeu `401`, foi limpa e retornou à tela de login.
5. Confirme que usuários diferentes continuam acessando normalmente.
6. Confirme que o login permanece persistido por até 24 horas quando não houver um novo login do mesmo usuário.

## 10. Validar governança jurídica

No Super Admin:

1. Abra a área de conteúdo/governança jurídica.
2. Consulte os Termos de Uso e a Política de Privacidade atuais.
3. Edite uma cópia de teste e salve uma nova versão.
4. Confirme que a versão anterior aparece no histórico.
5. Confirme que somente a nova versão publicada aparece para novos cadastros.
6. Não sobrescreva nem apague o texto jurídico antigo sem a aprovação jurídica correspondente.

## 11. Validar o monitor de backups

No painel Super Admin:

1. Confirme o último ciclo de backup e o status de sucesso.
2. Confirme que os três ciclos mais recentes estão listados.
3. Confirme que o telefone de alerta aparece mascarado.
4. Se precisar testar o botão manual, faça-o somente após o backup pré-deploy e verifique a criação do novo ciclo.

## 12. Se algo falhar: rollback

Se a nova réplica não ficar saudável, se a Home retornar erro, se o manifesto não mudar ou se os dados não aparecerem:

```bash
STACK_NAME='NOME_REAL_DO_STACK'
SERVICE_NAME='NOME_REAL_DO_SERVICO'
docker service update --rollback "$SERVICE_NAME"
docker service ps --no-trunc "$SERVICE_NAME"
docker service logs --tail 200 "$SERVICE_NAME"
```

Se o stack não tiver rollback no serviço, reimplante a fonte preservada em `/root/elolog-backup-v1.7.4-*/` ou use o backup de fonte identificado no passo 4. Não restaure o banco automaticamente. A restauração do PostgreSQL só deve ocorrer se houver evidência de alteração/corrupção dos dados; primeiro tente voltar a aplicação para a imagem/fonte anterior.

## 13. Conferência final e retenção

Após a validação:

```bash
BACKUP='COLOQUE_AQUI_O_DIRETORIO_DO_BACKUP'
find "$BACKUP" -maxdepth 1 -type f -printf '%f %s bytes\n' | sort
sha256sum -c "$BACKUP/SHA256SUMS"
```

Mantenha o novo backup e os três ciclos automáticos existentes. Não exclua o backup anterior até que o pós-deploy tenha sido validado e o novo backup esteja confirmado como utilizável.

## Resumo de segurança

> A ordem correta é: **transferir e conferir o ZIP → identificar o ambiente → fazer backup da fonte, `.env` e PostgreSQL → extrair em área isolada → preservar `.env` e volumes → validar start-first → publicar → testar → somente então considerar a release concluída**.

O pacote local já passou pelos testes de invariantes, lint, build, scanner de segredos e smoke test de navegador. A publicação na VPS, o backup pré-deploy e a validação funcional em produção ainda dependem da execução dos comandos acima no Bitvise.
