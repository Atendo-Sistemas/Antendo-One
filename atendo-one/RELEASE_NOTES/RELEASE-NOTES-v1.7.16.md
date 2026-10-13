# Atendo One — Release v1.7.16

## Paradas e hospedagens por empresa

Cada empresa passa a ter um cadastro próprio de locais de parada e hospedagens parceiras. Os registros incluem endereço, cidade, estado, telefone, tipo do local, desconto e regras da parceria. O cadastro é administrado no painel da empresa e permanece isolado por `tenantId`; um ponto cadastrado por uma empresa não aparece para outra empresa.

Os motoristas visualizam os locais associados às rotas/fretes publicados para os quais possuem acesso. Paradas e hospedagens não são expostas nas rotas públicas de rastreamento ou na vitrine.

## Notificações contextuais

Ao clicar em uma notificação, ela é marcada como lida e abre um modal com o título e a mensagem original. O botão de ação direciona o usuário para a área administrativa correspondente, como SaaS/empresas, usuários ou fretes, onde as alterações necessárias podem ser realizadas.

## Segurança

Não foram criadas rotas públicas para paradas ou hospedagens. As APIs exigem autenticação e administradores para gravação. O requisito de criptografia de dados sensíveis permanece previsto para execução controlada com a chave de produção, sem alteração de banco, volumes ou dados nesta release.
