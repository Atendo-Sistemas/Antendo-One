# Release v1.8.27 — Menu empresarial otimizado e cadastro de veículos

## Alterações

O menu dos perfis empresariais foi reorganizado no mesmo padrão de grupos recolhíveis utilizado pelo Super Admin, separando Operação, Gestão e Configurações. Isso reduz a largura ocupada no desktop e torna todas as opções localizáveis no menu mobile.

A opção **Veículos próprios** foi adicionada ao grupo Operação e ao menu mobile para os perfis `EMPRESA_SUPER_ADMIN` e `ADMIN`, que são os mesmos perfis autorizados pelo backend a criar, editar e desativar veículos empresariais. O isolamento por tenant e as validações de autorização não foram alterados.

As referências visíveis à configuração da API Mapbox permanecem restritas ao painel administrativo do Super Admin. Usuários empresariais e motoristas não recebem item de menu, tela de configuração, token ou link de administração do Mapbox. Os mapas e recursos de endereço continuam funcionando por meio dos serviços controlados da aplicação.

## Validações

Foram executados `npm run lint` e o teste `NAVIGATION_MENU_INVARIANTS_OK`, verificando a presença do cadastro de veículos, a associação correta da tela, a restrição de perfil e a ausência de menções administrativas ao Mapbox no Navbar.
