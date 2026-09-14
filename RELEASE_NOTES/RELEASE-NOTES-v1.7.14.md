# Atendo One — Release v1.7.14

## Modelo de Checklist/Vistoria por empresa

As empresas cadastradas agora podem copiar o formulário oficial `Checklist / Vistoria de Entrega e Retirada (Modelo Atendo One)` para o próprio espaço de formulários. A cópia recebe identificador e campos independentes, preservando o modelo original.

Depois da cópia, o administrador da empresa pode editar título, descrição, evento, campos e perguntas pelo botão de edição no FormBuilder. A operação respeita o isolamento por empresa, exige administrador real e registra auditoria para cópia e edição.

Foram adicionados os endpoints `POST /api/forms/:id/copy` e `PUT /api/forms/:id`. A versão da aplicação foi atualizada para `v1.7.14`, com tag Docker recomendada `elolog-app:v1714-20260830`.

Nenhuma migration, tabela, volume ou dado de produção foi alterado nesta atualização.
