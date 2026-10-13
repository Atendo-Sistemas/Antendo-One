# Auditoria de mensagens — v1.8.67

## Regra aplicada

O cliente final deve receber mensagens orientadas à ação, sem nomes de rotas, endpoints, servidores, bibliotecas, tokens, chaves ou detalhes de infraestrutura. A marca **Atendo One** e nomes comerciais de produtos podem permanecer visíveis.

## Correções

| Área | Antes | Depois |
|---|---|---|
| Cadastro de clientes | Consultar CNPJ.ws | Preencher dados pelo CNPJ |
| Falha da consulta | Rota não encontrada / resposta técnica | Não foi possível consultar os dados públicos do CNPJ no momento |
| E-mail empresarial | SMTP da empresa | E-mail da empresa |
| WhatsApp empresarial | WhatsApp API | WhatsApp da empresa |
| Erro de rede/infraestrutura | Mensagem original do servidor | Mensagem neutra com orientação ao usuário |

A filtragem é centralizada no cliente HTTP e complementada nos componentes que exibem mensagens diretamente.
