# Atendo One — v1.8.0

## Entregas

A v1.8.0 consolida as melhorias de confiabilidade já existentes na v1.7.30 e adiciona atualização controlada do PWA. O Service Worker agora possui cache versionado, limpeza de versões antigas, ativação imediata e fallback offline para a navegação. Respostas da API são excluídas do cache para evitar dados operacionais obsoletos ou exposição indevida.

A versão também inclui o relatório comparativo completo do escopo proposto para a v1.8.0. O relatório diferencia funcionalidades já existentes, funcionalidades implementadas nesta release e atividades que dependem de produção, credenciais ou autorização operacional.

## Validação

Foram incluídos testes específicos do PWA. A validação final executa lint, suíte completa, build, teste do ZIP e checksum SHA-256.
