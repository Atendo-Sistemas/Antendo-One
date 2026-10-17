# Atendo One v1.8.65

## Correções incluídas

### Prestação de contas e despesas

- Mensagem de compartilhamento por WhatsApp reorganizada em blocos legíveis, sem caracteres decorativos que apareciam como `�`.
- Prestações avulsas recebem um **código de validação legível** no formato `PAC-AAAA-######`.
- Cada prestação avulsa recebe também um token criptograficamente aleatório, usado somente no endereço público.
- Novo documento web somente para consulta em:
  - `https://gestor.atendo.log.br/prestacao/<token>`
- O documento público exibe empresa, motorista, placa, referência, período, quilometragem, despesas e saldo.
- O DTO público não inclui fotos de comprovantes, telefone, identificadores internos, dados bancários ou credenciais.
- O link público é enviado na mensagem do WhatsApp junto com o código de validação.
- A persistência PostgreSQL foi compatibilizada com `public_code` e `public_token` usando `ADD COLUMN IF NOT EXISTS`, sem comando destrutivo.
- Relatórios arquivados ou tokens inválidos não são disponibilizados publicamente.

### Cadastro global de motoristas

- Ao consultar um motorista pelo usuário **Super Admin**, o sistema não tenta mais criar automaticamente um vínculo sem empresa selecionada.
- O cadastro global é exibido corretamente e o vínculo deve ser feito pela ação explícita **Vincular empresa**.
- Usuários de empresa continuam seguindo o fluxo de vínculo pendente/aprovado da própria empresa.

### Identidade

- Versão atualizada para `v1.8.65`.
- Release name: `Atendo One — Documento público de despesas e cadastros padronizados`.

## Validação local

- `npx tsc --noEmit`: aprovado.
- `npx vite build`: aprovado; permanece apenas o aviso não bloqueante de chunk acima de 500 kB.
- `npm test`: aprovado.
- Invariantes específicas `V1865_HARDENING_INVARIANTS_OK`: aprovadas.
- Nenhuma alteração foi feita na VPS, banco de produção, volumes, secrets ou Docker Swarm nesta etapa.

## Observação de deploy

A imagem deve ser criada e atualizada na VPS somente após validar o ZIP e realizar o backup PostgreSQL/estado do serviço. Preserve a imagem atualmente ativa como rollback e remova imagens antigas somente depois do health check da nova versão.
