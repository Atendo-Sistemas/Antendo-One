# Atendo One v1.8.67

## Auditoria de mensagens e identificação de integrações

- Removida a identificação técnica `CNPJ.ws` do botão do cadastro de clientes; o texto agora é **Preencher dados pelo CNPJ**.
- Erros como “Rota não encontrada”, respostas HTML, falhas de rede e detalhes de infraestrutura não são mais apresentados diretamente ao cliente.
- Criado o normalizador `userFacingError` no cliente HTTP para filtrar rotas, endpoints, HTTP, SQL, PostgreSQL, Docker, tokens, secrets e chaves de API.
- Aplicado tratamento ao cadastro de clientes, consulta de CNPJ, CEP, configurações de e-mail, validação de mapas e pagamentos.
- Renomeada a opção empresarial **SMTP da empresa** para **E-mail da empresa**.
- Renomeada a identificação **WhatsApp API** para **WhatsApp da empresa** na área empresarial.
- A marca Atendo One e seus produtos continuam permitidos em textos comerciais e operacionais.

## Validação

- TypeScript sem erros.
- Build Vite concluído; permanece apenas o aviso não bloqueante de chunks grandes.
- Suíte oficial de testes aprovada.
- Nenhum acesso à VPS, banco de dados, volumes ou secrets foi realizado nesta etapa.
