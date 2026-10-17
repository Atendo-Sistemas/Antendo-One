# Atendo One — Release v1.7.15

## Vitrine, Mapbox, paradas e formulários

A vitrine agora considera qualquer frete explicitamente marcado como público, independentemente da empresa de origem ou do tipo de operação, desde que esteja disponível e dentro da validade. O cadastro exibe claramente a opção de publicar na vitrine no momento da criação.

O rastreamento Mapbox geocodifica os endereços completos de coleta e entrega usando a API Mapbox, atualizando os marcadores e a rota com os pontos correspondentes aos endereços informados. Coordenadas já cadastradas continuam sendo utilizadas como fallback.

Os locais de parada cadastrados no frete passam a ser exibidos no cartão operacional do motorista, com cidade, estado e situação da parada.

O motorista passa a receber o formulário completo ativo da empresa quando o identificador padrão não estiver disponível, preservando os campos do modelo copiado pelo SaaS.

A proteção de segurança da tarefa inclui como requisito a opção 3: criptografia de dados sensíveis armazenados e bloqueio/redação de informações nas rotas públicas. A implantação integral da criptografia depende da chave de produção e deve ser feita com migração controlada; nesta release, nenhuma chave ou dado de produção foi alterado.

Tag Docker recomendada: `elolog-app:v1715-20260831`.
