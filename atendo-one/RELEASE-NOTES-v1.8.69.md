# Atendo One v1.8.69

## Validação de campos e permissões

- Restringidas as opções de papel exibidas no cadastro/edição de usuários conforme o papel do administrador logado.
- Mantida a regra de que somente o Super Admin pode atribuir `EMPRESA_SUPER_ADMIN` ou `SUPER_ADMIN`.
- Trocas de papel agora exigem uma empresa válida para perfis empresariais e removem o vínculo de empresa ao transformar uma conta em Super Admin.
- Cadastro de motorista passa a exigir telefone, CPF com 11 dígitos, CNH, categoria e validade em formato de data.
- CPF de motorista passa a ser único.
- Removidos defaults fictícios de veículo; dados incompletos ou placa inválida são rejeitados antes da persistência.
- Respostas de formulários dinâmicos passam a validar número, e-mail, data, hora, opções, tipos e limites de texto/arquivo.

## Validação técnica

- TypeScript: aprovado.
- Build Vite: aprovado.
- Suíte oficial de invariantes: aprovada.
- Invariantes específicas v1.8.69: aprovadas.

Esta release foi preparada em cópia isolada. Nenhum banco, volume, secret ou ambiente de produção foi alterado.
