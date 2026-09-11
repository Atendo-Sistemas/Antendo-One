# Atendo One v1.8.2

## Cadastro de clientes e CNPJ

A versão introduz o módulo dedicado **Cadastro de Clientes**, com isolamento por empresa, pesquisa, edição e arquivamento. A consulta à API pública CNPJ.ws foi implementada no backend com timeout, tratamento de indisponibilidade e preservação do IP original recebido nos cabeçalhos de encaminhamento. Os dados retornados são normalizados e persistidos junto ao cadastro.

## Orçamentos

Orçamentos podem selecionar clientes cadastrados ou cadastrar uma empresa diretamente pela consulta CNPJ. O vínculo `clientId` é persistido e validado no backend contra o tenant do usuário, impedindo referências entre empresas. Os cálculos financeiros permanecem server-side.

## Mapbox

A geocodificação continua retornando endereço, cidade, estado e coordenadas. Foi acrescentado o endpoint de Directions e a ação **Calcular rota no Mapbox**, que preenche distância real em quilômetros e duração estimada somente após a seleção de origem e destino geocodificados.

## Segurança e persistência

Os registros de clientes integram o snapshot persistente da DatabaseStore. As rotas exigem perfil administrativo de empresa/Super Admin e aplicam filtragem por tenant em leitura, criação, atualização e arquivamento.

## Validação

Lint TypeScript aprovado. Build e suíte de testes foram executados no diretório da versão; o resultado final deve ser conferido no manifesto de release.
