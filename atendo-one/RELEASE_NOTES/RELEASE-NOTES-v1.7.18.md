# Atendo One — Release v1.7.18

## Formulários padronizados pelo modelo SaaS

O preenchimento utiliza a definição efetiva do formulário, incluindo título, descrição, ordem dos campos, tipos, opções e obrigatoriedade. O modelo SaaS continua acessível para edição e os formulários copiados por empresa são carregados pela mesma estrutura dinâmica; assim, a tela de preenchimento permanece idêntica à definição que foi publicada para aquela empresa. O checklist operacional oficial mantém seu fluxo especializado quando selecionado.

## Vitrine pública e persistência

A vitrine consulta `db.freights` por meio de `/public/freights` e filtra somente fretes publicados. Os fretes e as flags `publicListingEnabled`/`publicPublishedAt` fazem parte do estado persistido e são restaurados junto com os demais registros. O filtro não restringe a empresa de origem, portanto fretes publicados por qualquer tenant aparecem na vitrine conforme a regra pública.

## Menu

A área SaaS permanece separada das operações da empresa, com Empresas SaaS, Conteúdos e Configurações concentrados no bloco administrativo. As operações de frete, motoristas, contas, formulários e auditoria continuam no bloco operacional, evitando misturar ações globais com ações de uma empresa.

## Mapbox

O mapa já usa as coordenadas geocodificadas dos endereços de origem e destino quando disponíveis. A linha estimada foi complementada pela Directions API do Mapbox: com token válido, o componente solicita a rota viária real e substitui a geometria aproximada pela geometria retornada pelo serviço. Sem token válido, o sistema exibe aviso explícito em vez de afirmar que o mapa real está disponível.

## Motorista e rotas

Após aceitar o frete, o motorista recebe os botões para buscar rota até o endereço de coleta e até o endereço de entrega. As paradas da rota publicada também possuem acesso rápido à rota por cidade/UF. O motorista só recebe os fretes e paradas aos quais a regra de acesso da empresa permite acesso.

## Parceiros

O painel privado de paradas e hospedagens continua isolado por empresa. Hospedagens parceiras não são inseridas na vitrine nem em endpoints públicos. A disponibilização de pontos para uma rota deve ser feita pela empresa, preservando que uma empresa tenha parceiros diferentes de outra.

## Observação

A validação técnica confirma persistência, contratos de API, compilação e integração dos componentes. A exibição efetiva de uma rota viária depende de token Mapbox válido e conectividade com a Directions API.
