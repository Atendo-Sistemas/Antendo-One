# Atendo One — v1.7.27

## Correção do PDF de orçamento

O download do PDF de orçamento foi corrigido. O fluxo anterior dependia diretamente de `doc.save()`, que pode falhar silenciosamente ou não iniciar o download em determinados navegadores e contextos de PWA. O novo fluxo gera o documento como `Blob`, cria uma URL temporária, dispara um elemento de download com nome de arquivo e revoga a URL após o uso.

Erros de geração agora são capturados e exibidos na interface em vez de serem ignorados.

## Validação

Foram adicionadas asserções para garantir o uso de `output('blob')`, `URL.createObjectURL` e `anchor.download`. A release passa por lint, testes, build, integridade do ZIP e checksum.
