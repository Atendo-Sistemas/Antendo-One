# Release v1.8.58 — Rotas Mapbox e despesas avulsas

## Correções

- Corrigido o erro **“Autenticação necessária”** ao calcular rota, consultar endereço e carregar a configuração do Mapbox em formulários autenticados ou com sessão renovada.
- As rotas server-side de geocodificação, direções e configuração pública do Mapbox não exigem mais uma sessão de usuário válida.
- Mantida a proteção do token: somente o token público `pk.*` é enviado ao navegador; o cálculo server-side continua usando o token configurado no servidor.
- Despesas/prestações de contas podem ser cadastradas sem `freightId` ou frete vinculado.
- Motoristas podem registrar despesa avulsa informando uma empresa à qual estejam vinculados; a API valida o vínculo antes de salvar.
- Usuários `SUPER_ADMIN`, `EMPRESA_SUPER_ADMIN`, `ADMIN`, `SUPERVISOR` e `MOTORISTA` podem criar despesas conforme seu escopo de acesso.

## Auditoria

- O relatório continua exigindo empresa válida, motorista autorizado e itens/valores normalizados.
- Quando não há frete, `freightId` e `freightCode` permanecem ausentes e o histórico identifica o relatório pelo próprio ID.
