# Release v1.8.28 — Correções de menu, fretes, rotas e endereços

Esta versão corrige a guarda de navegação que redirecionava usuários empresariais ao tentar abrir as telas legítimas de mensagens e relatórios. O menu empresarial continua restrito por perfil, mas as opções autorizadas deixam de voltar para a tela de fretes.

A exclusão de fretes agora é definitiva quando acionada pelo botão de exclusão. O frontend chama o endpoint de exclusão, e o backend remove o frete, posições GPS, respostas de formulários, despesas, notificações, interesses e vínculos operacionais relacionados. O histórico de auditoria é mantido. Quando o frete veio de um orçamento convertido, o orçamento é desvinculado e retorna ao estado aprovado para evitar referência órfã.

O cálculo de rota em orçamento e frete agora tenta geocodificar automaticamente os endereços preenchidos quando o usuário não selecionou uma sugestão. A busca contextual inclui cidade, estado e Brasil, melhorando as sugestões para endereços ambíguos.

As mensagens visíveis aos usuários empresariais não exibem mais o nome técnico do provedor de mapas ou referência à API. A configuração técnica permanece restrita ao painel administrativo do SaaS.

Validações: TypeScript sem erros, build de produção concluído e invariantes de menu, exclusão, autocomplete, rotas, integração orçamento/frete, persistência de chaves e cópia de integração aprovados.
