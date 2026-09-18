# Atualização de notificações, WhatsApp e SMTP

## Política implementada

A configuração das APIs WhatsApp permanece exclusiva do Super Admin do Atendo. O Super Admin pode configurar a API SaaS global e, quando necessário, a configuração dedicada de uma empresa durante sua administração no painel. Usuários e administradores de empresa não recebem acesso a URL, token, QR Code, status de conexão ou chaves do WhatsApp.

As empresas podem configurar os próprios modelos de mensagens de notificação, incluindo assunto e corpo de e-mail, texto WhatsApp e variáveis comerciais permitidas. A edição está disponível para `EMPRESA_SUPER_ADMIN` e `ADMIN` da empresa, sempre isolada pelo tenant. A personalização não depende mais da contratação de número WhatsApp próprio.

Foi criado o painel de SMTP da empresa. O administrador pode informar servidor, porta, usuário, senha, remetente, endereço de teste e ativação. As credenciais são persistidas criptografadas em `app_secrets`, usando identificador específico do tenant, e a senha nunca é devolvida ao frontend. Após reinício do serviço, a configuração é hidratada novamente a partir do segredo criptografado.

## Seleção do canal de envio

Para notificações de e-mail, o sistema seleciona primeiro o SMTP próprio da empresa do destinatário. Quando a empresa ainda não possui SMTP próprio, o sistema utiliza o SMTP global do SaaS, se configurado. O WhatsApp continua sendo resolvido pela API global SaaS ou pela API dedicada definida exclusivamente pelo Super Admin.

## Arquivos principais alterados

- `server/api.ts`: endpoints de SMTP empresarial, autorização por tenant, resolução de SMTP e edição de mensagens.
- `server/db.ts`: mapa por tenant, snapshot sem senha, hidratação e persistência criptografada.
- `src/components/company/CompanyEmailConfigPanel.tsx`: painel de configuração SMTP da empresa.
- `src/components/superadmin/NotificationTemplatesPanel.tsx`: edição de mensagens por todas as empresas autorizadas.
- `src/components/layout/Navbar.tsx` e `src/App.tsx`: acesso ao painel SMTP.
- `src/services/api.ts`: chamadas de consulta e atualização do SMTP empresarial.

## Validação

`npm run lint`, `npm test` e `npm run build` foram executados com sucesso.
