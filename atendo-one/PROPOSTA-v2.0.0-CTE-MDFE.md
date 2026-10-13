# Atendo One v2.0.0 — Proposta de módulo fiscal

## Conclusão executiva

A v2.0.0 pode incluir emissão de Conhecimento de Transporte Eletrônico (CT-e) e integração com Manifesto Eletrônico de Documentos Fiscais (MDF-e). A emissão fiscal não deve ser tratada como uma simples geração de PDF. O sistema deverá gerar XML conforme o leiaute oficial, assinar digitalmente, transmitir ao ambiente autorizador da Secretaria da Fazenda, tratar rejeições, armazenar os retornos e gerar os documentos auxiliares correspondentes.

O CT-e é o documento fiscal eletrônico de transporte, modelo 57. O MDF-e é o documento eletrônico que vincula os documentos fiscais transportados à unidade de carga, com validade jurídica garantida por assinatura digital e autorização do ambiente autorizador [1] [2].

A recomendação é iniciar pela emissão de **CT-e em homologação**, implementar o ciclo completo de autorização e somente depois liberar o **MDF-e**, que depende de credenciamento, certificado digital, regras por estabelecimento e documentos fiscais previamente conhecidos [2].

## Escopo recomendado

| Bloco | Entrega da v2.0.0 | Prioridade |
|---|---|---:|
| Cadastro fiscal | CNPJ, inscrição estadual, regime tributário, estabelecimento, série e ambiente | Alta |
| Certificado | Certificado A1 por empresa/estabelecimento, armazenamento cifrado e rotação | Alta |
| CT-e | Geração de XML, assinatura, transmissão, consulta, autorização e rejeição | Alta |
| DACTE | Geração do documento auxiliar após autorização | Alta |
| Eventos | Cancelamento, carta de correção e inutilização, conforme aplicabilidade | Alta |
| Armazenamento | XML enviado, XML autorizado, protocolo, recibo e rejeição | Alta |
| Integração com frete | Vincular CT-e ao frete, orçamento, cliente, tomador, motorista e veículo | Alta |
| MDF-e | Geração, assinatura, autorização, encerramento e DAMDFE | Média, segunda etapa |
| NFS-e | Avaliação separada por município e provedor | Média, não misturar com CT-e |
| Relatórios | Status fiscal, exportação XML, DANFE/DACTE/DAMDFE e histórico | Alta |

## Distinção importante sobre “nota fiscal de transporte”

Para transporte de cargas, o documento normalmente esperado é o **CT-e**, e não uma “nota fiscal de transporte” genérica. A NFS-e é um documento municipal de serviço e varia de acordo com o município e o padrão do provedor. Por isso, a v2.0.0 deve usar a nomenclatura correta no produto: **CT-e — Conhecimento de Transporte Eletrônico**.

A NFS-e pode ser estudada como módulo posterior, com uma matriz de municípios e provedores. Não é recomendável prometer emissão nacional de NFS-e em uma primeira versão fiscal.

## Fluxo do CT-e

1. A empresa configura o estabelecimento emissor.
2. O administrador informa os dados fiscais e a série.
3. O sistema valida os campos obrigatórios antes de gerar XML.
4. O usuário escolhe um frete ou cria uma emissão a partir dos dados da operação.
5. O sistema monta o CT-e com remetente, destinatário, tomador, carga, origem, destino, valores, impostos e modalidade.
6. O XML é assinado com o certificado digital do estabelecimento.
7. O XML é transmitido ao ambiente da SEFAZ correspondente.
8. O sistema registra protocolo, chave, número, série, status e retorno.
9. Após autorização, o sistema gera o DACTE e permite download e envio controlado.
10. Em caso de rejeição, o sistema mostra código, mensagem, campo afetado e ação recomendada.

O portal oficial do CT-e mantém o Manual de Orientação do Contribuinte, os leiautes, as regras de validação e as especificações do DACTE. A implementação deve seguir a versão vigente do manual no momento do desenvolvimento [3].

## Fluxo do MDF-e

O MDF-e deverá ser implementado depois do CT-e porque ele consolida documentos fiscais de uma viagem. O usuário selecionará o estabelecimento, veículo, condutor, UF de carregamento, UF de descarregamento e os CT-es ou NF-es vinculados.

O módulo deverá contemplar autorização, encerramento, cancelamento quando permitido, inclusão de condutor quando aplicável, geração do DAMDFE, consulta da situação e registro do encerramento da viagem.

O portal oficial informa que a empresa interessada precisa estar credenciada, possuir certificado digital ICP-Brasil com o CNPJ do estabelecimento, adaptar o sistema e testar em homologação [2]. A numeração do MDF-e é própria, por estabelecimento e série, e não deve ser compartilhada com a numeração de CT-e [2].

## Arquitetura técnica

A emissão fiscal deve ficar isolada em um serviço ou módulo de domínio próprio. O frontend não deve montar XML nem acessar certificado digital. O backend deverá controlar a fila, o certificado, a assinatura, a transmissão e o armazenamento dos eventos.

| Componente | Responsabilidade |
|---|---|
| `FiscalSettings` | Dados fiscais por tenant e estabelecimento |
| `FiscalCertificate` | Metadados do certificado e segredo cifrado |
| `FiscalDocument` | CT-e, MDF-e, status, chave, série, número e ambiente |
| `FiscalEvent` | Cancelamento, carta de correção, inutilização e encerramento |
| `FiscalTransmission` | Tentativas, recibos, protocolos, cStat e mensagens |
| `FiscalJob` | Fila idempotente para autorização e consulta |
| `FiscalXmlStorage` | XML assinado, autorizado, rejeitado e eventos |
| `FiscalDocumentPdf` | DACTE e DAMDFE gerados após autorização |

Cada registro fiscal deverá ter `tenantId` e, quando aplicável, `establishmentId`. O certificado de uma empresa jamais poderá ser utilizado por outra empresa. O sistema deverá impedir emissão cruzada mesmo quando o usuário for Super Admin, exigindo seleção explícita do estabelecimento e registrando auditoria.

## Segurança do certificado digital

O certificado A1 deverá ser enviado somente para o backend por conexão HTTPS. O arquivo e a senha deverão ser cifrados em repouso. A senha nunca poderá aparecer em logs, respostas HTTP, snapshots JSONB, frontend ou mensagens de erro. O certificado deverá ser associado ao CNPJ do estabelecimento e ter sua validade monitorada.

O sistema deverá oferecer alerta de vencimento, revogação administrativa, troca segura e teste de assinatura em ambiente de homologação. Certificado A3 não deve ser prometido na primeira etapa sem uma arquitetura específica de hardware ou agente local.

## Estados do documento

| Estado | Significado |
|---|---|
| RASCUNHO | Documento editável e ainda não transmitido |
| AGUARDANDO_ASSINATURA | Dados validados, aguardando assinatura |
| TRANSMITIDO | Enviado ao autorizador |
| AUTORIZADO | Uso autorizado e protocolo armazenado |
| REJEITADO | Recusado com cStat e mensagem |
| CANCELAMENTO_SOLICITADO | Evento enviado |
| CANCELADO | Cancelamento autorizado |
| ENCERRADO | MDF-e encerrado no destino |
| INUTILIZADO | Faixa numérica inutilizada quando aplicável |

A autorização deverá ser idempotente. Repetir uma requisição por falha de rede não poderá gerar outro documento ou consumir nova numeração indevidamente.

## Dados que precisam ser definidos por empresa

Antes da emissão, o cadastro fiscal deverá solicitar, no mínimo, razão social, CNPJ, inscrição estadual, endereço completo, município, UF, regime tributário, ambiente de emissão, série, numeração inicial, certificado digital, senha, contatos fiscais, CNAE quando necessário, CFOP, natureza da operação, modalidade do frete, tomador do serviço e regras tributárias aplicáveis.

O sistema não deve sugerir automaticamente alíquotas ou CFOP sem validação da contabilidade da empresa. Esses campos devem ser parametrizáveis e acompanhados de aviso de responsabilidade fiscal.

## Fases de implementação

### Fase 1 — Fundação fiscal

Criar entidades, isolamento multi-tenant, cadastro de estabelecimento, cofre de certificados, permissões, auditoria e tela de configuração. Não transmitir documentos nesta fase.

### Fase 2 — CT-e em homologação

Implementar XML, assinatura, transmissão, consulta, retorno, rejeição, numeração e DACTE. Usar exclusivamente ambiente de homologação e dados de teste.

### Fase 3 — Eventos e operação

Adicionar cancelamento, carta de correção, inutilização, reconsulta automática, alertas, exportação de XML e integração com fretes e orçamentos.

### Fase 4 — MDF-e

Implementar vínculo de CT-e/NF-e, veículo, condutor, autorização, encerramento, DAMDFE e regras de viagem.

### Fase 5 — Produção fiscal

Liberar emissão por empresa somente depois de credenciamento, certificado válido, parametrização contábil e aceite formal dos testes de homologação.

## Critérios de aceite

A v2.0.0 somente deverá ser considerada pronta quando cada empresa conseguir emitir um CT-e de homologação, consultar seu retorno, visualizar a rejeição de um documento inválido, gerar o DACTE, cancelar quando permitido, exportar os XMLs e provar que outra empresa não acessa qualquer dado fiscal.

Para MDF-e, o aceite deverá incluir autorização, vínculo correto dos documentos, geração do DAMDFE, encerramento no destino, reconsulta após indisponibilidade e proteção contra duplicidade de numeração.

## Decisão recomendada

A v2.0.0 deve ser planejada como **CT-e + base fiscal + MDF-e em segunda etapa**. O desenvolvimento pode começar sem autorização externa pela modelagem, telas, validações locais, ambiente de testes, cofre e integração desacoplada. A transmissão em produção, o uso de certificado real e a definição de regras tributárias exigirão credenciamento, dados da empresa e validação contábil/fiscal.

> O Atendo One pode fornecer a ferramenta técnica, mas não deve assumir a responsabilidade de determinar CFOP, impostos, tomador, regime tributário ou enquadramento da operação. Esses parâmetros precisam ser aprovados pela empresa e por seu contador.

## Referências

[1]: https://www.cte.fazenda.gov.br/portal/perguntasFrequentes.aspx?tipoConteudo=HC/iuy94/Rk= "Portal oficial do CT-e — Perguntas Frequentes e modelo operacional"

[2]: https://dfe-portal.svrs.rs.gov.br/mdfe/Faq "Portal oficial do MDF-e — Perguntas Frequentes"

[3]: https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=YIi+H8VETH0= "Portal oficial do CT-e — Manuais e leiautes"
