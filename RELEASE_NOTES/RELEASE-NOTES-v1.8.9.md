# Atendo One v1.8.9

## Imagens e identidade visual

O Super Admin agora pode configurar URLs HTTPS para logo em imagem, favicon, ícone do aplicativo/PWA e imagem principal da home, na seção **Configurações SaaS → Layout → Imagens do site e do aplicativo**. Os valores são persistidos junto à configuração global, filtrados no backend por URL pública segura e aplicados ao Navbar, favicon e ícone do aplicativo.

A configuração continua aceitando o nome textual da marca como fallback, preservando acessibilidade quando não houver imagem configurada.

## Documentos legais e origem de visitantes

Mantidas as correções legais e o analytics agregado de origem da v1.8.8. A produção atual ainda precisa receber esta versão para que as rotas legais e a remoção das referências legadas fiquem disponíveis publicamente.

## Validação

Invariantes legais e de imagens, lint, suíte completa e build aprovados. Deploy de produção não executado.
