# Atendo One — Release v1.7.13

## Provisionamento do CRM Atendo

Após a validação do código de cadastro da empresa, o sistema chama o endpoint administrativo de criação de tenant do CRM Atendo. O fluxo registra a empresa localmente, executa o provisionamento externo e grava o identificador externo quando ele é retornado.

Nesta versão, a leitura do identificador externo foi ampliada para aceitar respostas aninhadas do CRM, incluindo `tenantId`, `tenant_id`, `externalTenantId` e `id`, sem marcar uma resposta sem identificador como sucesso.

O payload de criação mantém `plano: "18"`, que é o plano definido para o provisionamento automático neste ambiente Atendo One. O valor `"1"` presente no exemplo genérico do arquivo `APIAdmin.json` não deve substituir a configuração operacional do ambiente.

Também foi aprimorado o diagnóstico seguro de falhas. Respostas HTTP rejeitadas agora registram o status e uma mensagem limitada do provedor; erros de comunicação e timeout registram a causa resumida. Tokens, senhas e credenciais não são incluídos nesses registros.

O modelo Postman recebido documenta endpoints de envio de mensagens e não contém o endpoint administrativo `createtenant`; portanto ele não permite validar o contrato de criação de empresa do CRM. A URL e as credenciais administrativas continuam dependendo da configuração segura do Atendo One.

## Validação

A versão foi atualizada para `v1.7.13` e deve utilizar a tag Docker `elolog-app:v1713-20260830`. O Docker Swarm não foi alterado e nenhuma criação real de empresa no CRM foi executada nesta sessão.

## Ativação manual de planos pelo painel SaaS

O Super Admin agora pode ativar manualmente o plano atual de uma empresa diretamente no painel SaaS. A ação define o plano, recalcula os limites, ativa a empresa e seus usuários pendentes, marca o faturamento como `ACTIVE`, registra o ciclo como `MANUAL`, define a data de validade e cria um registro de auditoria. Essa operação não cria nem altera uma assinatura no Asaas.

A validade é informada em dias, com limite entre 1 e 3660 dias. A nova operação está disponível em `POST /api/tenants/:id/activate-plan` e exige a função `SUPER_ADMIN`.
