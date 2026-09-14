# Release v1.8.24 — CNPJ, rotas Mapbox e PWA de login

Esta versão altera a consulta cadastral de CNPJ para consultar primeiro os clientes persistidos no banco. Somente quando não existe registro armazenado é feita a consulta externa, com cache e limitação de frequência preservados. Quando o CNPJ já foi encontrado em outra empresa, seus dados cadastrais podem ser reutilizados no novo cadastro sem repetir a consulta externa.

Os formulários de orçamento e frete continuam permitindo o preenchimento manual, mas as sugestões de endereço do Mapbox agora retornam coordenadas, cidade, UF, CEP, número e bairro quando disponíveis. Ao selecionar uma sugestão, os campos correspondentes são preenchidos automaticamente; as informações que o Mapbox não retornar permanecem editáveis.

As rotas do Mapbox agora solicitam geometria GeoJSON real, além de distância e duração. A geometria é persistida no orçamento e no frete para que o mapa possa representar a rota calculada, enquanto a localização do motorista continua sendo publicada pelo PWA por meio de `watchPosition` durante uma viagem ativa.

O PWA recebeu uma nova versão de cache e mantém `/login` separado da home no fallback de navegação. O manifesto já utiliza `/login` como `start_url`, portanto a instalação abre a tela de login, sem reutilizar indevidamente uma página autenticada armazenada.

O `SUPER_ADMIN` possui escopo global nas operações administrativas previstas, podendo selecionar empresas e cadastrar ou editar dados sem depender da autorização de um administrador empresarial. Permanecem protegidas as ações sensíveis que exigem uma confirmação operacional explícita, como testes reais de e-mail, WhatsApp e broadcast, e as restrições de perfis de teste/demo.
