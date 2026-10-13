# Atendo One v1.8.71

## Alertas de frete por proximidade

A empresa agora pode configurar uma política geográfica para os alertas de novos fretes. O padrão utiliza um raio de 100 km da origem da coleta, aceita posições GPS com até 15 minutos de idade e precisão de até 5 km e, quando não há GPS atual, usa a mesma UF como fallback. O administrador pode alterar o raio entre 1 e 500 km, escolher fallback por cidade/UF, exigir GPS atual ou desligar o filtro.

O cálculo usa a distância geodésica de Haversine entre a última posição autorizada do motorista e as coordenadas da origem do frete. A tolerância considera a precisão informada pelo aparelho. Se a origem não tiver coordenadas, o sistema usa somente o fallback configurado; não são feitas estimativas falsas a partir de endereço textual.

Fretes direcionados manualmente continuam respeitando vínculo, status, CNH e veículo compatível, mas a intenção explícita do operador não é bloqueada pelo raio. Alertas gerais consideram motoristas do tenant e motoristas globais com vínculo empresarial aprovado.

## Privacidade e PWA

O motorista ativa os alertas por proximidade na tela de Preferências e concede a localização ao navegador. O PWA envia atualizações enquanto o painel do motorista permanece aberto; o rastreamento em segundo plano depende das limitações do navegador e do sistema operacional. Ao desativar a preferência, a posição armazenada é removida.

A rota de atualização só aceita o próprio motorista autenticado, exige consentimento explícito, valida latitude, longitude, precisão e data da posição e não permite contas de teste/demo. Coordenadas precisas não aparecem em listas administrativas de motoristas. O cadastro próprio do motorista pode receber a posição atual para refletir o estado da preferência.

## Unificação assistida de usuários

Administradores reais podem abrir **Usuários → Verificar duplicidades**. A análise ocorre somente dentro da empresa e compara dados normalizados de nome, telefone, e-mail, endereço, CPF e CNH. A aplicação apresenta candidatos fortes e exige que o administrador escolha qual cadastro permanecerá como principal.

A unificação não é automática. O backend bloqueia contas de empresas diferentes, papéis diferentes, Super Admin, contas de teste/demo, conflitos de e-mail/telefone/CPF/CNH e dois perfis de motorista distintos. O cadastro principal permanece ativo; a origem é marcada como bloqueada, somente leitura, com `mergedIntoUserId` e data de consolidação.

Notificações, entregas, assinaturas PWA, respostas de formulários e interesses de frete associados à origem são reassociados ao cadastro principal. Histórico de auditoria e registros operacionais não são apagados. Toda unificação gera registro de auditoria.

## Validações

- TypeScript sem erros.
- Build frontend Vite aprovado.
- Bundle backend esbuild aprovado.
- Invariantes de notificações, isolamento, RBAC, seleção de motoristas, PWA, geolocalização e unificação aprovadas.
- Nenhuma VPS, banco de produção, volume, secret ou serviço foi alterado nesta etapa.
