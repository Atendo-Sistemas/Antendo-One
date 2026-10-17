# Atendo One v1.8.19

Esta versão corrige a persistência das integrações WhatsApp e Mapbox. O token WhatsApp continua sendo salvo em `app_secrets` com criptografia e é restaurado na inicialização, sem ser devolvido ao frontend. O fluxo de configuração preserva o segredo existente quando o formulário envia campo vazio ou valor mascarado.

O token Mapbox passou a usar o mesmo armazenamento criptografado, com hidratação na inicialização. Ao salvar a configuração global do SaaS, a chave é persistida separadamente e o snapshot JSONB mantém apenas o campo redigido. A Central e os endpoints de geocodificação usam a chave restaurada no backend; a interface só exibe estado configurado ou pendente, nunca a credencial.

A versão também mantém a correção do painel de saúde e dos submenus do Super Admin.
