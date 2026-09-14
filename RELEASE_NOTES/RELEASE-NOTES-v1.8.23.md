# Release v1.8.23 — Cadastro empresarial de veículos

Esta versão permite que empresas cadastrem e mantenham sua própria frota diretamente no sistema.

O cadastro inclui placa, RENAVAM, chassi, tipo, carroceria, marca, modelo, ano de fabricação, ano do modelo, cor, combustível, quantidade de eixos, capacidade de carga, proprietário, CPF/CNPJ, UF de registro, CRLV, validade do seguro e observações internas.

A mesma placa, RENAVAM ou chassi pode existir em empresas diferentes. A validação de duplicidade é aplicada somente dentro da mesma empresa, respeitando o isolamento por `tenantId`.

O cadastro, a edição e a desativação são persistidos antes da resposta da API. A desativação preserva o histórico operacional e fiscal do veículo.

Os perfis `SUPER_ADMIN`, `EMPRESA_SUPER_ADMIN` e `ADMIN` podem administrar os veículos da empresa. Usuários de teste continuam limitados ao modo de simulação.
