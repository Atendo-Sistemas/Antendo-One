# Atendo One v1.8.72

## Web Push com o PWA fechado

O Service Worker do Atendo One agora trata o ciclo completo de Web Push:

- recebe payload JSON ou texto;
- exibe título, corpo, ícone, badge, vibração e agrupamento da notificação;
- preserva o identificador do frete no payload;
- abre `/freights?frete=<id>` ao tocar em um alerta de novo frete;
- reutiliza uma janela existente ou abre uma nova janela do PWA;
- remove caches antigos ao ativar uma nova versão;
- mantém o funcionamento com o PWA instalado e sem a tela aberta.

O navegador e o sistema operacional precisam permitir notificações para o domínio. A assinatura é registrada por usuário e dispositivo no backend, com VAPID e validação do endpoint, chaves e tenant.

## Teste individual

O botão **Testar** agora funciona para qualquer usuário real autenticado, inclusive motorista, mas envia somente para a própria assinatura Push. Contas de teste e demo continuam bloqueadas. Se o dispositivo não tiver assinatura ativa, o sistema informa que o Push precisa ser ativado primeiro.

## Troca de conta e logout

Ao sair, o cliente solicita a remoção da assinatura Push associada à conta atual e cancela a assinatura local do navegador. Isso evita que o mesmo dispositivo continue vinculado à conta anterior.

## Segurança e isolamento

- Não existe broadcast global pelo endpoint de teste.
- O Push de novos fretes utiliza a lista de motoristas elegíveis da empresa.
- O link do alerta contém apenas o identificador operacional do frete e é validado pela sessão ao abrir.
- As notificações continuam dependendo do vínculo, permissões, consentimento e regras de tenant.
- A implementação não transforma o PWA em rastreador GPS contínuo; localização em segundo plano continua dependendo de aplicativo móvel nativo.

## Validações

- TypeScript aprovado.
- Build frontend e backend aprovados.
- Suíte oficial de testes aprovada.
- Invariantes específicas `v1872-push-closed` aprovadas.
- Nenhuma VPS, banco de produção, volume ou secret foi alterado nesta etapa.
