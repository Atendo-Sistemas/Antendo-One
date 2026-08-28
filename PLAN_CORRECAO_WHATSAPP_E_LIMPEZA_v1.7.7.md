# Plano atualizado: hotfix WhatsApp e publicação v1.7.7

## Objetivo

Concluir a correção do login via WhatsApp quando o domínio estiver em produção, com build Docker reproduzível, preservação integral do PostgreSQL e validação no navegador. Ao final, limpar apenas imagens Docker órfãs, mantendo a imagem ativa e o rollback.

## Estado atual confirmado

A produção permanece na imagem `elolog-app:v175-20260827`; nenhum build com erro alterou o serviço. A correção do label Traefik está aplicada no serviço ativo com `traefik.swarm.network=AtendoNet_v2`. A configuração WhatsApp global está persistida no PostgreSQL com a URL completa do canal, ativa e com último teste manual bem-sucedido.

O usuário `user-admin-atendo`, telefone terminado em 5429, está `SUPER_ADMIN`, `ATIVO`, `REAL` e sem `tenant_id`. A falha do OTP foi isolada ao processamento específico de configuração/roteamento, enquanto o teste manual do painel funcionou. A correção local adiciona fallback para a configuração global quando uma configuração de tenant não possui token e URL válidos.

A v1.7.7 inclui o fallback, o `package-lock.json` e `npm ci` no Dockerfile. O pacote foi transferido e o checksum foi confirmado como `OK`. O primeiro build falhou porque foi executado na pasta v1.7.6; o segundo build correto chegou ao Dockerfile v1.7.7, mas falhou por falta de espaço.

A limpeza feita pelo Portainer removeu 43 imagens não utilizadas. O armazenamento agora está saudável: 86 GB usados de 146 GB, 60 GB livres e 59% de utilização. Nenhuma nova remoção deve ser feita antes da validação.

## Próximas fases de execução

### 1. Revalidar o artefato

Confirmar que `/opt/elolog/releases/v1.7.7` contém o Dockerfile com `npm ci --include=dev`, `npm ci --omit=dev` e o `package-lock.json`. Não usar `--force` nem `--legacy-peer-deps`.

### 2. Reconstruir a imagem

Executar `docker build --tag elolog-app:v177-20260827 /opt/elolog/releases/v1.7.7`. Confirmar conclusão, digest e tamanho. Se houver falha, preservar o erro e manter a v1.7.5 ativa.

### 3. Backup pré-deploy

Antes de alterar o serviço, criar nova pasta com timestamp contendo dump PostgreSQL em formato custom, fonte atual, especificação do serviço Swarm e listas de stacks/serviços. Proteger arquivos de configuração com modo 600 e nunca exibir secrets, tokens ou `.env` no chat.

### 4. Publicar de forma incremental

Atualizar somente a imagem do serviço existente `elolog_app` para `elolog-app:v177-20260827`, usando `start-first`, uma réplica, rollback automático e espera por `Service elolog_app converged`. Preservar secrets, variáveis, volumes, rede e labels do Traefik.

### 5. Validar no navegador

Testar Home, manifesto, ícones e login. Abrir `https://gestor.atendo.log.br/login` com cache-buster, selecionar WhatsApp OTP e preencher o telefone. Antes de solicitar novo código, pedir confirmação explícita, pois isso envia mensagem externa. Aprovação significa chegar à tela de digitação do OTP sem 502. Não solicitar nem registrar o código no chat.

### 6. Persistir configuração e limpar imagens antigas do próprio sistema

Garantir que o arquivo real de implantação do stack contenha `traefik.swarm.network=AtendoNet_v2`. Depois dos testes, manter a imagem ativa e pelo menos uma imagem de rollback. A limpeza deve ser restrita às tags antigas do próprio `elolog`, nunca por prune abrangente.

O comando planejado, a ser executado somente após a validação final, será:

```bash
ACTIVE=$(docker service inspect elolog_app --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}') && ROLLBACK='elolog-app:backup-monitor-v173-20260827' && docker image ls 'elolog-app' --format '{{.Repository}}:{{.Tag}}' | grep -E '^elolog-app:' | grep -v -F -e "$ACTIVE" -e "$ROLLBACK" | xargs -r docker image rm
```

Antes de executá-lo, confirmar que `$ACTIVE` é a imagem v1.7.7, que o serviço está Running e que a imagem de rollback existe. O comando não remove volumes, banco, secrets, backups, a imagem ativa, a imagem de rollback ou imagens de outros sistemas. Se alguma tag antiga estiver referenciada por outro container, o Docker recusará a remoção e ela será mantida.

## Critérios de aprovação

| Área | Critério |
|---|---|
| Armazenamento | Pelo menos 10 GB livres após o build e sem remoção de volumes. |
| Build | `npm ci` conclui e a imagem v1.7.7 é criada sem flags inseguras. |
| Swarm | `elolog_app` converge com uma réplica Running e sem erro. |
| Dados | Backup PostgreSQL e fonte pré-deploy existem e permanecem protegidos. |
| Traefik | O Atendo usa `AtendoNet_v2` sem aviso de rede incorreta. |
| HTTP/PWA | Home responde, manifesto aponta para `/login` e os dois PNGs estão acessíveis. |
| WhatsApp | Teste manual continua bem-sucedido e o login OTP chega à etapa de código sem 502. |
| Limpeza | Apenas imagens órfãs selecionadas são removidas após a validação. |

## Riscos e limites

A imagem é local e o serviço tem uma réplica; escalar para outros nós exige registry ou distribuição da imagem. O Asaas permanece desabilitado. Nenhum token de WhatsApp ou segredo será substituído sem ação direta no painel. Se o OTP continuar falhando após o hotfix, o próximo diagnóstico será no gateway externo e nos logs mascarados, não uma nova troca de credenciais.

## Resultado esperado

V1.7.7 publicada com build determinístico, login WhatsApp funcionando atrás do Cloudflare, Traefik persistente na rede correta, dados preservados, rollback disponível e imagens órfãs limpas de forma controlada.
