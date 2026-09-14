# Atendo One — Resumo consolidado das versões v1.6.0 a v1.8.11

## 1. Visão geral

Entre a v1.6.0 e a v1.8.11, o Atendo One evoluiu de uma aplicação operacional de gestão de fretes para uma plataforma SaaS multiempresa com clientes, orçamentos, publicação de cargas, rastreamento público, integrações de comunicação, Mapbox, CRM, PWA, auditoria, configurações comerciais e preparação para módulos fiscais adicionais.

A documentação detalhada da v1.6.0 não está presente no conjunto de arquivos disponível nesta sessão. Por isso, a v1.6.0 é tratada neste relatório como a linha de base funcional anterior à sequência de releases v1.7.x. Os itens posteriores são consolidados a partir das release notes e das alterações acumuladas no código da v1.8.11.

## 2. Evolução por período

| Período | Evolução principal |
|---|---|
| v1.6.0 | Linha de base operacional anterior ao ciclo de expansão SaaS documentado. |
| v1.7.11–v1.7.13 | Estabilização do pacote, provisionamento CRM Atendo e ativação manual de planos. |
| v1.7.14–v1.7.18 | Checklists por empresa, vitrine pública, Mapbox, paradas, hospedagens, formulários e rotas de motorista. |
| v1.7.19–v1.7.24 | Segurança de navegador, histórico GPS, persistência, notificações, concorrência e auditoria operacional. |
| v1.7.27–v1.7.30 | PDF de orçamento, correções de release, persistência de chaves e endurecimento de integrações. |
| v1.8.0–v1.8.1 | Rastreamento público em tempo real, SSE, tokens seguros, PWA e lazy loading do Mapbox. |
| v1.8.2–v1.8.8 | Clientes por CNPJ, orçamentos vinculados, Mapbox Directions, conteúdo legal, analytics de origem e preparação comercial. |
| v1.8.9–v1.8.11 | Branding por imagens, menu SaaS, pop-ups de salvamento e restrição de APIs ao painel SaaS. |

## 3. Versões v1.6.0 e início do ciclo v1.7.x

A v1.6.0 representa a base anterior à expansão documentada. A partir da v1.7.11, o foco passou a ser a estabilização do pacote, a organização das entregas e a preparação para uso em ambiente SaaS.

Na v1.7.11 foi consolidado o processo de release e validação local. A v1.7.12 continuou a estabilização. A v1.7.13 adicionou o provisionamento da empresa no CRM Atendo durante a aprovação e permitiu ativação manual de planos pelo painel SaaS.

## 4. Empresas, CRM e planos

O cadastro e a aprovação de empresas passaram a considerar a criação correspondente no CRM Atendo. O fluxo foi ampliado para exibir falhas de provisionamento no cartão da empresa, permitindo identificar quando a criação no CRM não foi concluída.

O painel SaaS ganhou pesquisa de empresas, aprovação de módulos de notificação e ativação manual de planos. A configuração passou a preservar credenciais sensíveis durante atualizações, sem sobrescrever chaves de API existentes com valores vazios ou mascarados.

## 5. Formulários e checklists

A partir da v1.7.14, o modelo de Checklist/Vistoria de Entrega e Retirada passou a poder ser copiado e editado por empresa. As versões seguintes padronizaram o preenchimento dos formulários para permanecer consistente com o modelo SaaS.

Foram mantidos recursos de preenchimento, assinatura, fotos, geração de PDF, envio de comprovantes e uso operacional em dispositivos móveis. O fluxo de checklist também passou a respeitar as permissões e a configuração de comunicação da empresa.

## 6. Vitrine, fretes e operação do motorista

As versões v1.7.15 a v1.7.18 corrigiram a publicação de fretes por empresas na vitrine pública, reforçaram a persistência dos fretes publicados e reorganizaram menus para melhorar o acesso às funções prioritárias.

O motorista passou a receber informações de paradas disponibilizadas pela empresa conforme a rota publicada. As paradas e hospedagens parceiras ficaram isoladas por empresa. Uma parada cadastrada por uma empresa não é automaticamente compartilhada com outra.

Também foram adicionados fluxos de rota para o motorista após aceitar um frete, incluindo orientação para o endereço de coleta e para o destino de entrega.

## 7. Mapbox e localização

O Mapbox passou a receber os endereços de origem e destino, realizar geocodificação e retornar coordenadas para a aplicação. A integração com Directions API passou a substituir linhas aproximadas por rotas viárias reais quando existe token válido.

O sistema também passou a exibir aviso explícito quando não consegue obter uma rota real, evitando apresentar uma linha estimada como se fosse resultado confirmado do Mapbox.

Foram adicionados autocomplete com debounce e cache, persistência de coordenadas e validações automatizadas da integração. A versão v1.8.1 introduziu lazy loading do Mapbox para reduzir o carregamento inicial.

## 8. Rastreamento público em tempo real

O rastreamento público foi ampliado para permitir que clientes, embarcadores e terceiros acompanhem uma entrega por link, sem criar conta ou fazer login.

O recurso inclui:

- Token público de 128 bits.
- Endpoint público dedicado.
- Lista de campos permitidos.
- Revogação administrativa.
- Atualização em tempo real por Server-Sent Events (SSE).
- Exibição de rota, posição do caminhão e status da entrega.
- Isolamento entre empresas.
- URL pública com abertura automática do modal de rastreamento.

O código público não expõe dados internos desnecessários nem credenciais de integração.

## 9. Orçamentos e custos operacionais

O módulo de orçamentos passou a centralizar cálculos financeiros no servidor. Foram incluídos ou consolidados:

- Valor por quilômetro rodado.
- Pedágios.
- Seguro.
- Diárias.
- Ajudantes.
- Tabela de preços.
- Cálculo total do orçamento.
- Controle de concorrência por versão.
- Conversão idempotente de orçamento em frete.
- Snapshot dos dados utilizados no orçamento.
- Geração e download de PDF.

A correção do PDF também contemplou o fluxo de salvar, exportar, imprimir e baixar o documento.

## 10. Cadastro de clientes e CNPJ

A v1.8.2 introduziu o módulo **Cadastro de Clientes**. O cadastro possui vínculo com a empresa responsável e suporta busca por CNPJ usando a API pública CNPJ.ws.

O fluxo implementado inclui:

- Proxy backend para a consulta CNPJ.
- Preenchimento de razão social, nome fantasia e endereço.
- Persistência dos dados retornados.
- Busca e seleção de clientes dentro do orçamento.
- Vínculo do orçamento com `clientId`.
- Snapshot das informações utilizadas.
- Isolamento por tenant.
- Rate limit, cache temporário e auditoria das consultas.
- Uso do IP encaminhado pelo usuário para a requisição externa, sem depender exclusivamente do IP da VPS.

## 11. Persistência e isolamento multiempresa

O sistema consolidou o isolamento por tenant em clientes, orçamentos, fretes, paradas, hospedagens, notificações, configurações, histórico GPS e dados de integração.

A persistência híbrida memória/JSONB foi ampliada para novos objetos e passou a incluir hidratação segura de segredos. A retenção de histórico GPS foi limitada por período e quantidade para evitar crescimento ilimitado do snapshot.

Foram adicionados controles de concorrência com `expectedVersion`, operações idempotentes e validações contra referências de outra empresa.

## 12. Segurança, auditoria e privacidade

As melhorias de segurança incluíram:

- Registro de IP nas trilhas de auditoria.
- Correção de datas inválidas nos logs.
- Whitelist de campos no rastreamento público.
- Tokens públicos fortes e revogáveis.
- Restrição de headers e Permissions-Policy para câmera e geolocalização.
- Health check sem cache.
- Limites de payload e headers de segurança.
- Preservação de chaves de API durante atualizações.
- Mascaramento de tokens e senhas.
- Separação de dados entre empresas.
- Testes automatizados de invariantes de segurança.

Também foram revisados os documentos públicos de Termos de Uso e Política de Privacidade, com conteúdo para LGPD, cookies, analytics, incidentes, direitos dos titulares, controlador, operador e contato.

## 13. PWA e experiência móvel

O PWA passou a utilizar cache versionado, fallback offline e comportamento mais seguro em atualizações. A navegação móvel foi revisada para manter o acesso às funções essenciais, incluindo fretes disponíveis.

O carregamento do Mapbox foi adiado para reduzir o tamanho inicial do bundle. O build ainda apresenta um aviso não bloqueante relacionado ao tamanho do chunk do Mapbox.

## 14. Comunicação e integrações

O sistema recebeu melhorias para WhatsApp, e-mail, Asaas e CRM Atendo. O teste de e-mail foi corrigido para usar senha mascarada, controlar timeout e retornar erros compreensíveis.

O fluxo de notificações passou a considerar consentimento, templates, status de entrega e configurações por módulo. O painel SaaS permite aprovar e acompanhar integrações de notificação.

Na v1.8.11, a configuração técnica da API WhatsApp foi retirada da interface das empresas. URL e token ficam acessíveis apenas ao Super Admin no painel SaaS. O backend também bloqueia consultas e alterações feitas por outros perfis.

## 15. Branding, home e menu SaaS

A home pública foi revisada para remover termos técnicos inadequados ao cliente, como “tenant” e “controle de tenants”, e para substituir referências públicas legadas a “Elo Log” por Atendo One.

O painel SaaS passou a permitir configurar:

- Logo em imagem.
- Favicon.
- Ícone do aplicativo/PWA.
- Imagem principal da home.
- Nome da marca.
- Título da aba.
- Texto do rodapé.
- Cores e estilo visual.

As imagens são aplicadas no Navbar, na home pública, no favicon e no ícone do aplicativo. As URLs são filtradas no backend.

O menu SaaS foi agrupado por prioridade em aquisição, marca, comercial, operação, integrações, comunicação e manutenção. As mensagens de salvamento foram transformadas em pop-ups com fechamento automático, fechamento manual e suporte a leitores de tela.

## 16. Central de operação e preparação comercial

Foi criada uma Central de Operação com onboarding, pendências, monitoramento, health check, importação e exportação. A importação CSV passou a permitir prévia e validação antes da confirmação para evitar gravação parcial acidental.

Também foram criados scripts de verificação, atualização controlada e rollback documentado, sem executar deploy automaticamente. A documentação comercial e operacional foi consolidada para apoiar implantação e uso do sistema.

## 17. Validação acumulada

As versões recentes foram submetidas a combinações de:

- `npm run lint`.
- `npm test`.
- `npm run build`.
- Testes de invariantes de segurança.
- Testes de clientes e isolamento.
- Testes de Mapbox e roteamento.
- Testes de PDF.
- Testes de PWA.
- Testes de analytics.
- Testes legais.
- Testes de branding.
- Testes de restrição SaaS-only.
- Verificação de integridade do ZIP.
- Verificação do SHA256 do pacote.

A validação local não substitui os testes dependentes de produção, como certificado real, credenciais reais, DNS, SMTP, Mapbox com token de produção, CRM, WhatsApp, Asaas, PostgreSQL de produção e Docker Swarm.

## 18. Situação na v1.8.11

A v1.8.11 é a versão consolidada atual deste ciclo. Ela inclui a restrição da configuração da API ao SaaS e mantém as funcionalidades acumuladas desde o ciclo v1.6.x/v1.7.x.

O pacote da v1.8.11 foi gerado e verificado com o seguinte checksum:

```text
956452dc73be025fa73b508a7905bc09576eb1b21110c378cc3520a39803e06c
```

O deploy de produção não foi executado nesta sessão.

## 19. Pendências externas antes da produção

| Pendência | Motivo |
|---|---|
| Publicar a v1.8.11 | Exige acesso ao ambiente de produção e procedimento de deploy. |
| Validar backup e restauração | Exige acesso ao PostgreSQL e aos volumes reais. |
| Testar integrações reais | Exige credenciais e ambientes externos. |
| Validar Mapbox de produção | Exige token real, limites e domínio configurado. |
| Testar GPS real | Exige motorista, dispositivo e operação real. |
| Validar Docker Swarm | Exige registry acessível e nós de produção. |
| Configurar CT-e/MDF-e | Será tratado como módulo adicional da v2.0.0, com certificado e homologação fiscal. |
| Validar documentos legais no domínio | Depende da publicação da versão corrigida. |

## 20. Próxima evolução: v2.0.0

A evolução planejada é o **Módulo Fiscal Adicional**, começando por CT-e e posteriormente MDF-e. Antes da transmissão fiscal, o sistema poderá receber a base de prontidão fiscal: cadastro de estabelecimento, inscrição estadual, regime tributário, série, numeração, controle de módulos, auditoria fiscal e cofre de certificados.

A emissão real exigirá certificado digital, credenciamento, regras tributárias definidas pela empresa e validação contábil. A proposta detalhada está em [PROPOSTA-v2.0.0-CTE-MDFE.md](PROPOSTA-v2.0.0-CTE-MDFE.md).

## Conclusão

O Atendo One passou por uma evolução ampla: de gestão operacional de fretes para uma plataforma SaaS com isolamento por empresa, clientes, orçamentos financeiros, mapas, rastreamento público, integrações, PWA, auditoria e configuração comercial. A v1.8.11 está tecnicamente preparada para homologação, enquanto as pendências restantes dependem principalmente de ambientes externos, credenciais, produção e validações operacionais.
