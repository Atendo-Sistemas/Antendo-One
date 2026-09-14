# Atendo One — Release v1.7.17

## Aprovação e provisionamento no CRM Atendo

Ao aprovar uma nova empresa no SaaS, o backend agora aguarda o provisionamento no CRM Atendo antes de responder. O resultado é persistido no cadastro da empresa: `PROVISIONED` com o identificador externo quando criada, ou `ERROR`/`NOT_CONFIGURED` com a mensagem sanitizada quando não foi possível concluir.

O cartão da empresa mostra imediatamente que ela ainda não foi criada no CRM e apresenta o motivo registrado. O botão de reprocessamento continua disponível para nova tentativa.

## Pesquisa de empresas no SaaS

O painel do Super Admin ganhou filtro por nome, razão social, CNPJ, e-mail, telefone, cidade, estado, identificador externo e status do CRM.

## Aprovação do módulo de notificações

O Super Admin pode, no cartão de qualquer empresa:

- ativar o módulo usando o telefone SaaS, sem cobrança (`SAAS_FREE`); ou
- encaminhar a contratação do número próprio com cobrança recorrente pelo Asaas (`OWN_NUMBER`).

Quando o Asaas é utilizado, o sistema cria ou reconcilia a assinatura e mantém o status como pendente até a confirmação de pagamento/webhook. A ativação do módulo segue o status financeiro retornado pelo Asaas.

## Observação de validação

A integração foi verificada no código e nos contratos existentes. A criação efetiva no CRM/Asaas depende das credenciais e serviços externos configurados no ambiente de produção; sem essas credenciais, o cartão exibirá o erro em vez de indicar sucesso falso.
