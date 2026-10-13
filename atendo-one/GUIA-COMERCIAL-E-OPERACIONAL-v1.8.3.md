# Atendo One — Guia comercial e operacional

## Visão geral

O Atendo One é uma plataforma de gestão de transporte para empresas que precisam publicar fretes, organizar motoristas e veículos, acompanhar entregas, controlar despesas, preencher checklists e administrar clientes em um ambiente separado por empresa.

## Primeiro acesso da empresa

O administrador deve cadastrar a empresa, confirmar os canais de contato e aguardar a aprovação quando esse fluxo estiver habilitado. Depois do acesso, deve revisar usuários, permissões, dados da empresa, configurações de notificações e chave do Mapbox.

## Cadastro de clientes

Acesse **Clientes**, informe o CNPJ e selecione **Consultar CNPJ.ws**. Revise os dados retornados, complete as informações faltantes e salve. Também é possível cadastrar manualmente. Clientes arquivados não aparecem em novos orçamentos. Cada empresa visualiza exclusivamente seus próprios clientes.

## Orçamentos e rotas

Em **Orçamentos**, selecione um cliente cadastrado ou informe um cliente manualmente. Digite os endereços e escolha uma sugestão do Mapbox para garantir coordenadas válidas. Depois selecione **Calcular rota no Mapbox** para preencher distância e duração. Informe valor por quilômetro, pedágios, seguro, diárias, ajudantes, despesas e margem. O servidor recalcula os valores antes de salvar.

## Publicação e rastreamento

Após criar um frete, a empresa pode publicá-lo na vitrine quando o fluxo permitir. O link público de rastreamento pode ser compartilhado sem login. O acesso público mostra somente os campos autorizados pela política da empresa e pode ser revogado.

## Motoristas e checklists

O motorista acessa os fretes autorizados, aceita a operação, consulta a rota, atualiza localização quando permitido e preenche os formulários da empresa. Fotos e evidências devem ser anexadas conforme a política operacional.

## Atualização segura

Sempre faça backup, confira o checksum do pacote, valide a versão instalada, aplique migrations compatíveis e execute o health check. Não remova volumes ou imagens anteriores antes de confirmar o rollback. O deploy em produção deve usar imagem publicada em registry acessível por todos os nós e digest imutável.

## Checklist de comercialização

Antes de liberar uma empresa, confirme: dados e usuários; permissões; Mapbox; notificações; backup; recuperação; PDF; vitrine; rastreamento; cadastro de clientes; orçamento; checklist; suporte; termos e política de privacidade.

## Suporte e diagnóstico

O endpoint autenticado `/api/health/detailed`, acessível ao Super Admin, informa versão, uptime, contagens, integração Mapbox, CNPJ.ws, persistência e PostgreSQL. Nunca compartilhe tokens, chaves ou senhas em chamados.

## Central de preparação

A Central de Operação reúne os primeiros passos, pendências, indicadores, health check e exportação/importação CSV de clientes e orçamentos. Use-a antes de liberar uma nova empresa para confirmar que a operação mínima está configurada.
