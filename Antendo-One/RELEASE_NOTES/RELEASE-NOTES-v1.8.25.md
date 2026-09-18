# Release v1.8.25 — Rastreamento GPS em tempo real e autocomplete Mapbox

Esta versão consolida o rastreamento do motorista no PWA durante fretes ativos. O navegador envia latitude, longitude, velocidade, direção, precisão e horário ao backend, que valida a associação do motorista, persiste a posição e publica a atualização pelo canal SSE de rastreamento. O PWA possui fila local para posições sem conexão, sincronização automática ao recuperar a rede, indicador de estado do GPS e Wake Lock opcional enquanto a viagem está ativa.

Os formulários de orçamento e frete mantêm o autocomplete de endereços pelo backend Mapbox. A seleção de uma sugestão preenche endereço, número, bairro, CEP, cidade, estado, latitude, longitude e identificador do local quando disponíveis. Os campos CEP e bairro agora ficam visíveis e editáveis no formulário de frete. As sugestões exibem os principais componentes retornados para facilitar a conferência.

O endpoint público de geocodificação foi alinhado ao endpoint autenticado e passou a retornar os mesmos componentes de endereço. A tela de tracking classifica o sinal como **AO VIVO**, **ATRASADO** ou **SEM SINAL** conforme o horário da última posição recebida.

O rastreamento em segundo plano continua limitado pelas políticas do navegador e do Android. Para operar com o aplicativo totalmente encerrado ou com rastreamento contínuo garantido em segundo plano, será necessária uma aplicação nativa ou um serviço Android foreground.

Validações realizadas: lint TypeScript, build de produção, invariantes de CNPJ/Mapbox/PWA, roteamento Mapbox, performance Mapbox, integração orçamento/Mapbox e tracking público.

