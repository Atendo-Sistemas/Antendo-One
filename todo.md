# Atendo One — Release v1.8.76

## Auditoria de perfis e permissões
- [x] Consolidar matriz oficial: SUPER_ADMIN, EMPRESA_SUPER_ADMIN, ADMIN, SUPERVISOR, USUARIO e MOTORISTA.
- [x] Bloquear gravações diretas por contas TEST/demo e preservar visualização/simulação.
- [x] Restringir criação, edição, atribuição, cancelamento e transição de fretes ao perfil correto.
- [x] Restringir cadastros locais, veículos próprios, usuários, motoristas e formulários por empresa e papel.
- [x] Impedir acesso direto a telas administrativas ocultadas do menu.
- [x] Alinhar menus desktop/mobile à matriz de autorização.
- [x] Cobrir regressões com invariantes estruturais.

## Módulo de banners do Super Admin
- [x] Criar contrato persistido de banner com imagem, link seguro, formato e prioridade.
- [x] Permitir segmentação por perfil, empresa e usuário.
- [x] Permitir escolha de locais de exibição e abertura do link na mesma aba ou nova janela.
- [x] Criar CRUD protegido no painel Super Admin e preview.
- [x] Criar consulta autenticada de banners visíveis, filtrada por tenant e usuário.
- [x] Exibir banners nos painéis de início, fretes, operação e motorista.
- [x] Normalizar validações e mensagens amigáveis.

## Validação e entrega
- [x] Atualizar versão e notas da release.
- [x] Passar typecheck e invariantes específicas.
- [x] Rodar build frontend/backend e suíte oficial completa.
- [x] Verificar ausência de segredos e gerar ZIP + SHA-256 sem node_modules/dist.
- [x] Não acessar nem alterar produção nesta etapa.
