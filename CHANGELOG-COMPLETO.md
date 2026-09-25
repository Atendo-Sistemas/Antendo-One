# Atendo One — Changelog completo
**Versão consolidada:** v1.8.54  
**Data de referência:** 25 de setembro de 2026  
**Status:** build geral de produção validado

## Release v1.8.54 — Aprovação formal de fretes

Foi implementado um fluxo explícito de aprovação de fretes. Todo frete novo ou gerado por conversão de orçamento inicia em `AGUARDANDO_APROVACAO`. Na tela de detalhes do frete, o Super Admin, o Super Admin da empresa e o Admin podem aprovar, registrando usuário, data e histórico. Depois da aprovação, o administrador pode publicar o frete. Usuários operacionais e motoristas não podem aprovar. A API passou a enviar e validar corretamente o campo `newStatus`, corrigindo a alteração de status.

A atualização mantém o escopo por empresa, os dados históricos e as regras anteriores de orçamento, motoristas, rotas, PWA e formulários.

---

## Release v1.8.53 — Orçamentos por empresa e permissões administrativas

Esta release geral incorpora as correções acumuladas do sistema e corrige o fluxo de seleção e conversão de orçamentos em fretes. O formulário de frete consulta os orçamentos usando a empresa efetivamente selecionada, impedindo mistura de dados entre tenants. Usuários empresariais continuam vendo somente orçamentos aprovados; o Super Admin pode selecionar orçamentos ainda em rascunho ou em análise e convertê-los ou vinculá-los a fretes sem aprovação intermediária. A conversão preserva a geometria da rota e o orçamento é marcado como convertido, com vínculo ao frete criado.

A validação de empresas e usuários permanece por escopo: o Super Admin pode operar empresas globalmente; o Super Admin empresarial e o Admin atuam somente na própria empresa. A exclusão de empresas é uma desativação lógica exclusiva do Super Admin, preservando usuários, documentos, auditoria e histórico. A exclusão de usuários é também um bloqueio lógico, disponível ao Super Admin e aos administradores da mesma empresa, sem permitir autoexclusão e sem apagar a identidade persistida. A rota duplicada de exclusão de usuários foi removida para manter uma única política auditável.

As demais funcionalidades acumuladas — autenticação, CEP/ViaCEP, Mapbox, rotas, motoristas multiempresa, PWA, carroceria personalizada e regras de carga veículo — permanecem incorporadas neste release geral.

---


**Versão consolidada:** v1.8.47  
**Data de referência:** 24 de setembro de 2026  
**Status:** build de produção validado

## 1. Visão geral

O Atendo One é uma plataforma SaaS para gestão de operações de transporte. O sistema reúne cadastro de empresas, usuários, motoristas, veículos e clientes; criação e publicação de fretes; elaboração de orçamentos; cálculo de rotas; rastreamento; formulários operacionais; despesas; notificações; auditoria; conteúdo institucional; configuração de comunicação; e recursos específicos de administração SaaS.

A aplicação utiliza escopo por empresa para separar dados operacionais. O mesmo motorista terceirizado pode possuir vínculos com diversas empresas, enquanto anotações e arquivos internos permanecem privados dentro de cada empresa.

> Este documento consolida o estado atual do código e o histórico de releases disponível no projeto. Integrações externas continuam dependendo de credenciais, limites, domínio seguro e configuração do ambiente em que o sistema for publicado.

## 2. Funcionalidades disponíveis atualmente

### 2.1 Autenticação e identidade

O sistema possui login por credenciais, renovação de sessão, logout, autenticação por código de uso único (OTP) e fluxos de cadastro de empresa e motorista. A sessão utiliza cookies e proteção contra requisições forjadas (CSRF) nas operações de escrita. O contexto de autenticação carrega o usuário, a empresa, o motorista associado, veículos e dados de suporte.

Também existem recursos de troca de ambiente de demonstração, edição do perfil do usuário, alternância de tema e solicitação de permissões do navegador. O sistema identifica sessões de suporte e informa quando o administrador está visualizando outra conta.

### 2.2 Empresas e operação multiempresa

Cada empresa possui seus próprios fretes, orçamentos, clientes, motoristas vinculados, veículos, paradas, hospedagens, configurações de comunicação, modelos de relatório e preferências operacionais. O backend aplica o `tenantId` nas consultas e operações que pertencem à empresa.

O Super Admin pode operar o painel global e selecionar a empresa em telas administrativas. Usuários empresariais trabalham dentro do escopo da empresa vinculada à sessão. O modo demonstração possui restrições próprias para impedir alterações em configurações protegidas.

### 2.3 Usuários, papéis e permissões

A navegação e as APIs reconhecem, entre outros, os papéis **Super Admin**, **Empresa Super Admin**, **Admin**, **Supervisor**, **Usuário** e **Motorista**.

Usuários empresariais podem acessar as funções liberadas para sua empresa. A administração de usuários, configurações de cobrança e algumas configurações de comunicação ficam limitadas aos papéis administrativos definidos pelo backend.

A criação e edição de formulários possui controle de autorização. A interface esconde ações administrativas para perfis sem permissão, mas a proteção principal também é aplicada nas rotas do servidor. Operações de exclusão sensíveis, incluindo exclusão de motoristas, ficam reservadas aos papéis administrativos autorizados.

### 2.4 Fretes

O módulo de fretes permite criar, editar, consultar, publicar, acompanhar, aceitar e finalizar operações. O formulário de frete contempla origem, destino, CEP, endereço, número, bairro, cidade, UF, janela de horário, carga, peso, volumes, tipo de veículo, carroceria, marca, valor, forma de pagamento, pedágio incluso, publicação e requisitos operacionais.

Um frete pode ser criado a partir de um orçamento. A conversão preserva origem, destino, distância, informações financeiras, referência do orçamento e dados de rota. A exclusão definitiva remove dependências operacionais relacionadas e mantém o histórico de auditoria; quando o frete veio de um orçamento convertido, a referência é desfeita para evitar registros órfãos.

### 2.5 Aceite interno e vínculo de motorista

Usuários autenticados da empresa podem aceitar um frete e vincular um motorista sem depender da vitrine pública. O fluxo interno registra o aceite, o vínculo e os dados operacionais correspondentes.

O perfil público do frete continua oferecendo o fluxo de interesse e cadastro rápido do motorista. Quando o motorista aceita um frete por esse caminho, o sistema pode criar ou completar o cadastro e registrar o vínculo com a empresa responsável pelo frete.

### 2.6 Motoristas terceirizados e vínculos entre empresas

Um motorista global pode ser vinculado a mais de uma empresa. Para evitar duplicidade, o cadastro empresarial permite consultar um motorista por telefone ou número de CNH antes de criar outro registro.

A consulta pode retornar dados cadastrais globais reutilizáveis, como nome, telefone, e-mail, documentos, endereço, cidade, UF e dados da CNH. Esses dados podem ser usados para criar o vínculo na empresa atual.

Anotações internas, arquivos anexados e observações operacionais são mantidos em um perfil privado por empresa. Esses dados não são compartilhados com outras empresas que possuam vínculo com o mesmo motorista.

O painel do motorista pode apresentar fretes aceitos de empresas diferentes quando houver vínculo operacional autorizado. O filtro é feito pelo backend com base nos vínculos e nas atribuições do motorista.

### 2.7 Veículos

O sistema possui cadastro de veículos próprios da empresa, com dados de identificação, placa, RENAVAM, chassi e informações operacionais. A validação evita duplicidade de placa, RENAVAM ou chassi dentro do escopo empresarial.

O motorista possui uma tela própria de perfil e veículos. A navegação móvel foi alinhada para direcionar a função de veículos do motorista para o perfil correto, evitando uma aba empresarial incompatível.

### 2.8 Orçamentos

O módulo de orçamentos permite criar, editar, consultar, versionar, aprovar, rejeitar, cancelar e converter orçamentos em fretes. O cálculo financeiro considera distância, preço por quilômetro, pedágios, seguro, diárias, auxiliares, despesas, impostos, lucro e valores destinados ao motorista.

Cada orçamento guarda versões e snapshots para preservar o histórico das alterações. O orçamento pode consultar clientes por CNPJ, associar um cliente existente ou criar o cadastro empresarial correspondente quando permitido.

### 2.9 Endereços, CEP e autocomplete

Os formulários de frete e orçamento mantêm a sugestão de endereços pelo Mapbox. A seleção de uma sugestão preenche endereço, número, bairro, cidade, UF, CEP e coordenadas quando disponíveis.

Também foi adicionada a consulta por CEP nos campos de origem e destino. A pesquisa usa o endpoint interno de CEP, que valida o formato, aplica timeout e consulta o ViaCEP. O retorno preenche logradouro, bairro, cidade, UF e CEP. O número continua sendo informado separadamente.

Quando um endereço, cidade, UF ou CEP é alterado, coordenadas antigas, geometria de rota, distância e pedágios associados são invalidados para evitar a persistência de uma rota incompatível com o novo endereço.

### 2.10 Rotas e pedágios

O cálculo de rota resolve as coordenadas de origem e destino por seleção do autocomplete, por coordenadas já salvas ou por geocodificação server-side quando o usuário não selecionou uma sugestão. O resultado inclui distância, tempo estimado e geometria GeoJSON da rota.

O endpoint de direções foi ajustado para não bloquear o cálculo por uma sessão expirada, mantendo a chave privada do Mapbox somente no servidor. O orçamento e o frete usam o mesmo serviço de direções.

O Mapbox atualmente utilizado não retorna tarifas de pedágio. Por isso, a distância e o trajeto são automáticos, mas o valor de pedágios permanece editável e deve ser conferido ou informado manualmente. A interface foi ajustada para deixar essa limitação explícita.

### 2.11 Rastreamento e mapas

O sistema possui rastreamento de rota, posição atual, eventos e visualização em mapas. Há componentes para visualização interativa com Leaflet e Mapbox, além de modal de acompanhamento em tempo real.

O rastreamento público utiliza token próprio e política de exposição configurável. A precisão da localização pode ser exata ou aproximada, e os campos públicos podem ser limitados por política da empresa. A chave privada do Mapbox não é exposta ao navegador.

### 2.12 Formulários e checklists

O construtor de formulários permite criar definições, editar modelos, copiar modelos, desativar formulários e configurar campos. O preenchimento de formulários pode ser associado a operações e fretes.

A aplicação inclui o fluxo de preenchimento, o modal de checklist operacional e regras de autorização para impedir que usuários sem permissão executem ações administrativas de definição.

### 2.13 Central de operação

A Central de Operação concentra informações e ações de acompanhamento de fretes, motoristas, disponibilidade, aceite, atribuição, andamento e indicadores operacionais. O módulo usa os mesmos escopos empresariais aplicados nas demais telas.

### 2.14 Despesas e prestação de contas

O sistema permite registrar despesas de viagem e operação, com quantidade, preço unitário, categoria, observações e vínculo ao contexto operacional. Usuários autorizados podem consultar, criar e atualizar despesas conforme o papel e o escopo da empresa.

A prestação de contas está disponível para empresas e motoristas em suas respectivas áreas de navegação, respeitando as regras do backend.

### 2.15 Notificações

Há suporte a notificações internas, contagem de não lidas, marcação individual, marcação em lote e abertura de contexto relacionado ao frete. A aplicação também possui consentimento separado para notificações por e-mail, WhatsApp e push.

O PWA pode solicitar permissão para notificações push, registrar a assinatura do navegador e enviar uma notificação de teste quando a configuração do ambiente estiver disponível.

### 2.16 Comunicação por e-mail e WhatsApp

O sistema possui configuração de e-mail da empresa, modelos de mensagens, preferências de consentimento e módulos de comunicação por WhatsApp. As configurações sensíveis de gateway, tokens, URLs e credenciais ficam protegidas por escopo e papel administrativo.

A entrega de notificações possui registros e telas de acompanhamento no painel administrativo. O envio real depende de gateway, credenciais válidas, consentimento e configuração externa.

### 2.17 Câmera, arquivos e PWA

A captura de câmera possui suporte para câmera frontal e traseira, controle de stream, compressão da imagem e fallback para captura nativa ou seleção de arquivo. O fluxo informa quando o navegador exige HTTPS e mantém alternativa para galeria ou câmera nativa.

O recurso foi verificado para navegador móvel, PWA e desktop. Em ambiente remoto sem HTTPS, a câmera direta do navegador pode ser bloqueada pelo próprio navegador; nesse cenário, o usuário deve utilizar o endereço seguro ou o fallback de arquivo.

O service worker do PWA utiliza nome de cache versionado. A versão atual é v1.8.47.

### 2.18 Clientes e consulta de CNPJ

O cadastro de clientes permite criar, consultar, editar, arquivar e associar clientes a empresas. A consulta por CNPJ normaliza a entrada, busca dados públicos empresariais quando a integração está configurada e pode preencher razão social, nome fantasia, endereço, telefone, e-mail, cidade e UF.

A associação de cliente ao orçamento é validada contra a empresa do orçamento para impedir referência cruzada indevida.

### 2.19 Painel Super Admin e SaaS

O painel Super Admin oferece gestão global de empresas, conteúdos, configurações SaaS, notificações, SEO, analytics, backups, logs de erro, configurações de Mapbox, Asaas, SQL e instalação, modelos de notificação e monitoramento operacional.

As configurações técnicas de integração são mantidas no painel SaaS e não são apresentadas aos usuários empresariais como chaves ou tokens. O Super Admin possui menu próprio com grupos SaaS, Operação, Controle e Configurações.

### 2.20 Cobrança e configuração Asaas

O módulo empresarial possui tela de cobrança e o painel administrativo possui configuração e teste da integração Asaas. A disponibilidade das operações depende de credenciais, ambiente, conta configurada e permissões administrativas.

### 2.21 Conteúdo público, marca e SEO

O sistema possui home institucional, páginas públicas, termos de uso, política de privacidade, páginas de conteúdo, gerenciamento de conteúdo, configurações de SEO, analytics de visitas e personalização de identidade visual.

A empresa pode utilizar logo, nome do sistema, cores e conteúdo configurado. O painel SaaS controla as configurações globais e o conteúdo protegido.

### 2.22 Auditoria, segurança e privacidade

As operações críticas possuem registros de auditoria. O sistema aplica autenticação, escopo por empresa, validações de papel, proteção CSRF, cookies de sessão, controles de exposição pública e sanitização de dados.

A chave privada do Mapbox permanece server-side. Dados financeiros e credenciais não são retornados pelas respostas gerais de motorista. Os dados privados de motoristas são isolados por empresa.

A exclusão de fretes registra histórico mesmo quando remove dependências operacionais. Os testes de segurança e hardening fazem parte da validação recorrente do projeto.

## 3. Histórico consolidado de versões

### v1.6.x e v1.7.x

O ciclo inicial consolidou a plataforma operacional de fretes, o modelo SaaS, o cadastro de empresas, o portal do motorista, a vitrine pública, os primeiros fluxos de formulários e a base de persistência multiempresa. Também foram estruturados recursos de clientes, comunicação, identidade visual, documentos legais e operação comercial.

Durante o ciclo v1.7.x foram ampliados os módulos de navegação, cadastro, comunicação, despesas, operação e experiência móvel. O projeto acumulou scripts de instalação, atualização, rollback, verificação de release e documentação de implantação.

### v1.8.0 a v1.8.11

O ciclo v1.8 consolidou o produto como uma plataforma SaaS com clientes, CNPJ, orçamentos, formulários, rastreamento, Mapbox, PWA, conteúdo público, marca, notificações, auditoria e preparação comercial. Foram adicionados controles de configuração SaaS, validações de segurança, recursos de backup, analytics, SEO e integrações de comunicação.

A documentação consolidada desse período registra a evolução de empresas e planos, formulários, vitrine, operação do motorista, localização, rastreamento público, custos, clientes, persistência, isolamento multiempresa, segurança, PWA, comunicação e preparação comercial [1].

### v1.8.12 a v1.8.22

Esse período concentrou hardening de segurança, correções de isolamento e proteção de credenciais. O Mapbox passou a ser utilizado com geocodificação server-side e controle de configuração restrito ao SaaS. Também foram corrigidos fluxos de orçamento, cache de endereços, conversão de orçamento em frete, persistência de credenciais, interface simplificada e vulnerabilidades relacionadas à exposição de token [2].

### v1.8.23 a v1.8.27

Foram ampliados o cadastro empresarial de veículos, os fluxos de CNPJ, as rotas Mapbox, o PWA de login, o rastreamento GPS em tempo real e o autocomplete de endereços. Também foram corrigidos problemas de OTP por WhatsApp e reorganizado o menu empresarial. O módulo de veículos passou a possuir validações próprias de escopo e duplicidade.

### v1.8.28

Foram corrigidos o menu empresarial, a exclusão definitiva de fretes, a geocodificação automática de endereços sem seleção de sugestão e as mensagens visíveis relacionadas ao provedor de mapas. A exclusão passou a limpar dependências relacionadas, preservar auditoria e reverter a referência de orçamento convertido quando necessário [3].

### v1.8.29

O menu empresarial passou a apresentar os grupos **Operação**, **Gestão** e **Configurações** no desktop e no celular. No mobile, os grupos passaram a aparecer como subtítulos para melhorar a organização da navegação [4].

### v1.8.31

O menu desktop de usuários empresariais e do modo demonstração foi alinhado ao modelo de grupos suspensos já utilizado no Super Admin. As permissões existentes foram preservadas, e o menu móvel manteve os grupos em formato vertical [5].

### v1.8.43

Foram trabalhadas correções de autenticação no cálculo de rota e pedágios, autorização de criação e edição de formulários, geolocalização no aceite de fretes e preservação da geometria de rota ao converter orçamento em frete.

### v1.8.44

Foram ampliadas as permissões de operação interna. Usuários autenticados da empresa passaram a poder aceitar fretes e vincular motoristas sem depender da tela pública. A inclusão de motoristas foi aberta aos usuários autorizados da empresa, enquanto a exclusão permaneceu restrita a Super Admin e Admin.

Também foi incluído o cadastro de motorista no fluxo público de interesse quando o motorista aceita o frete, com criação ou complementação do cadastro e registro do vínculo empresarial.

### v1.8.45

Foi implementado o modelo de motorista terceirizado multiempresa. A consulta pode ser feita por telefone ou CNH para reaproveitar um cadastro global. Anotações e arquivos passaram a ser mantidos em perfil privado por empresa.

A câmera recebeu correções de ciclo de inicialização, fallback móvel e compatibilidade com PWA e desktop. A versão do aplicativo e o cache do service worker foram atualizados.

### v1.8.46

Foi adicionada pesquisa de endereço por CEP nos formulários de frete e orçamento, sem remover o autocomplete Mapbox. A busca preenche logradouro, bairro, cidade, UF e CEP por meio do endpoint interno de consulta.

O cálculo de rota foi revisado nos dois formulários. O endpoint de direções deixou de bloquear o usuário por sessão expirada. A interface passou a informar que o provedor atual calcula distância e geometria, mas não fornece tarifas de pedágio automaticamente.

### v1.8.47

Foi corrigida a abertura dos submenus para usuários empresariais. O contêiner da navegação deixou de recortar os dropdowns por `overflow-x-auto` e passou a permitir a expansão visual dos submenus.

O menu do motorista também foi revisado. A ação de veículos no menu móvel passou a abrir o perfil correto do motorista, e as preferências de notificações foram adicionadas ao menu móvel. A navegação do Super Admin foi preservada.

## 4. Menus e navegação atuais

No desktop, o Super Admin possui grupos **SaaS**, **Operação**, **Controle** e **Configurações**. Usuários empresariais possuem **Operação**, **Gestão** e **Configurações**. No mobile, os itens são apresentados em uma gaveta vertical organizada por grupos.

O motorista possui acesso direto a **Fretes Disponíveis & Meus Fretes**, **Meu Perfil & Veículos**, **Prestação de Contas**, **Preferências de notificações** e **Ajuda**. O item de veículos não abre uma tela empresarial incompatível; ele direciona para o perfil do motorista.

Os submenus fecham após a seleção de uma função e mantêm o destaque da aba ativa. O recorte visual que impedia usuários empresariais de enxergar os dropdowns foi corrigido na v1.8.47.

## 5. Integrações externas

| Integração | Finalidade | Dependências externas |
|---|---|---|
| Mapbox | Autocomplete, geocodificação, direções e mapas | Token, domínio e limites de uso |
| ViaCEP | Consulta de endereço por CEP | Disponibilidade do serviço público |
| WhatsApp | OTP e notificações operacionais | Gateway, URL, token e consentimento |
| Asaas | Cobrança e testes de integração | Conta e credenciais Asaas |
| SMTP | Envio de e-mails da empresa | Servidor, porta, usuário, senha e TLS |
| Web Push | Notificações no navegador e PWA | VAPID, permissão do navegador e HTTPS |
| Serviços de CNPJ | Consulta cadastral de clientes | Serviço externo e limites de consulta |

## 6. Validação acumulada

A versão atual foi validada com lint TypeScript e testes de invariantes de navegação, segurança, PWA, rotas Mapbox, integração orçamento/frete, geolocalização, autorização de formulários, aceite de frete, fluxos completos, operações, sessão e multiempresa.

O build de produção da v1.8.47 foi concluído com sucesso. O processo ainda emite aviso de chunks grandes no frontend, especialmente nas dependências de mapas e documentos. Esse aviso não impediu o build, mas pode ser tratado futuramente com divisão adicional de código.

## 7. Limitações e pendências conhecidas

O cálculo automático de tarifas de pedágio ainda não está implementado porque o endpoint atual de direções não fornece preços por praça ou categoria de veículo. O campo de pedágios permanece manual.

A câmera direta do navegador exige contexto seguro. Em produção, o sistema deve ser servido por HTTPS. Em desenvolvimento local, `localhost` é aceito pelos navegadores; em outros endereços HTTP, o usuário deve utilizar o fallback nativo ou anexar uma imagem.

A validação real de Mapbox, WhatsApp, SMTP, Asaas, Web Push, backup, GPS e limites de APIs depende das credenciais e do ambiente de produção. Os testes automatizados validam a implementação e os contratos internos, mas não substituem homologação com dispositivos, contas e serviços reais.

A emissão fiscal de CT-e e MDF-e permanece como evolução planejada, não como módulo de emissão fiscal ativo desta versão [6].

## 8. Artefato da versão atual

O pacote de produção correspondente a este changelog é o arquivo `Antendo-One-v1.8.47-corrigido.zip`. A versão exibida na interface e o cache do PWA estão em **v1.8.47**.

## Referências

[1]: ./RELEASE_NOTES/RESUMO-CONSOLIDADO-v1.6.0-a-v1.8.11.md "Resumo consolidado das versões v1.6.0 a v1.8.11"

[2]: ./RELEASE_NOTES/RELEASE-NOTES-v1.8.22.md "Release v1.8.22 — Segurança e proteção do Mapbox"

[3]: ./RELEASE-NOTES-v1.8.28.md "Release v1.8.28 — Correções de menu, fretes, rotas e endereços"

[4]: ./RELEASE-NOTES-v1.8.29.md "Release v1.8.29 — Subtítulos do menu em desktop e celular"

[5]: ./RELEASE-NOTES-v1.8.31.md "Release v1.8.31 — Menu agrupado para usuários empresariais"

[6]: ./PROPOSTA-v2.0.0-CTE-MDFE.md "Proposta do módulo fiscal adicional CT-e e MDF-e"
