# Auditoria externa do site

URL consultada: https://gestor.atendo.log.br/

A home pública carregou e mostrou marca Atendo One no cabeçalho, mas ainda exibiu textos legados publicados no ambiente atual: “Elo Log” na modal de permissões e FAQ, “Solução Completa Multi-Tenant de Carga”, “Controle de Tenants” e “Dados individuais e blindados para cada transportadora”. Isso indica que a versão publicada ainda não contém as correções de branding feitas no sandbox.

URL consultada: https://gestor.atendo.log.br/conteudo/termos-de-uso

Resultado atual: “Conteúdo indisponível — Conteúdo público não encontrado”. Os links públicos de Termos de Uso e Política de Privacidade não estão acessíveis por essa rota na versão publicada.

Conclusão: o código local possui endpoint de registro legal `/api/public/registration-content/:slug`, mas o App local não tratava diretamente as rotas públicas legais. Foi adicionada correção local para `/termos-de-uso`, `/politica-de-privacidade` e suas rotas `/conteudo/...`; a versão publicada precisa receber o pacote atualizado.
