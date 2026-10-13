import { WebPage } from '../src/types';

const commercialPage = (now: string, page: Omit<WebPage, 'tenantId' | 'isPublished' | 'isIndexable' | 'createdAt' | 'updatedAt' | 'publicPath'>): WebPage => ({
  ...page,
  tenantId: null,
  publicPath: 'elo-log',
  isPublished: true,
  isIndexable: true,
  contentVersion: 'seo-2026-08-27',
  createdAt: now,
  updatedAt: now
});

export const publicCommercialPages = (now: string): WebPage[] => [
  commercialPage(now, {
    id: 'page-commercial-elo-log', slug: 'elo-log',
    title: 'Atendo One para operações logísticas',
    excerpt: 'Uma plataforma para organizar fretes, equipes, motoristas, veículos, checklists e comunicação em um só ambiente.',
    metaTitle: 'Atendo One para Operações Logísticas | Gestão de Fretes',
    metaDescription: 'Conheça o Atendo One para organizar fretes, equipes, motoristas, veículos, checklists e notificações em uma plataforma logística multiempresa.',
    content: '<p>O Atendo One ajuda transportadoras e operações de transporte a reunir informações essenciais em um fluxo único. A empresa pode cadastrar fretes, organizar usuários, administrar motoristas e veículos, acompanhar etapas e preservar o histórico para consulta e auditoria.</p><h2>Uma base para a rotina da transportadora</h2><p>Em vez de distribuir dados entre planilhas e conversas isoladas, a equipe trabalha com permissões por perfil e registros associados à empresa. O objetivo é tornar a operação mais clara sem criar uma etapa difícil de manter.</p><h2>Recursos para começar</h2><ul><li>Publicação e acompanhamento de fretes.</li><li>Cadastro de motoristas, vínculos e veículos.</li><li>Formulários e checklists da operação.</li><li>Despesas, relatórios e trilhas de auditoria.</li><li>Notificações com preferências de e-mail e WhatsApp.</li></ul><h2>Para empresas que querem mais controle</h2><p>Conheça o <a href="/elo-log/sistema-tms">sistema TMS</a>, veja a <a href="/elo-log/publicacao-de-fretes">publicação de fretes</a> e leia sobre <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade operacional</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-sistema-tms', slug: 'sistema-tms',
    title: 'Sistema TMS para transportadoras',
    excerpt: 'Organize o fluxo de transporte com fretes, equipes, motoristas, veículos, checklists, despesas e auditoria.',
    metaTitle: 'Sistema TMS para Transportadoras | Atendo One',
    metaDescription: 'Sistema TMS para transportadoras com organização de fretes, usuários, motoristas, veículos, checklists, despesas e histórico operacional.',
    content: '<p>Um sistema TMS precisa acompanhar o trabalho real da transportadora: desde o cadastro de um frete até a conclusão da viagem. O Atendo One estrutura essas etapas em uma plataforma multiempresa, com permissões e registros que ajudam a equipe a saber o que aconteceu e qual é a próxima ação.</p><h2>O que organizar em um TMS</h2><p>O fluxo pode reunir dados do frete, responsáveis, motoristas, veículos, formulários, checklists, despesas, ocorrências e documentos relacionados. Cada empresa mantém seu espaço operacional e os usuários acessam o que corresponde ao seu perfil.</p><h2>Visibilidade sem perder o histórico</h2><p>Atualizações de status, registros de viagem e trilhas de auditoria apoiam o acompanhamento diário e a análise posterior.</p><h2>Comece pelo processo mais importante</h2><p>Mapeie publicação, aceite, acompanhamento e encerramento. Saiba mais sobre <a href="/elo-log/gestao-de-fretes">gestão de fretes</a>, <a href="/elo-log/gestao-de-viagens">gestão de viagens</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores logísticos</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-sistema-transportadoras', slug: 'sistema-para-transportadoras',
    title: 'Sistema para transportadoras',
    excerpt: 'Uma estrutura digital para controlar fretes, pessoas, veículos e registros da operação de transporte.',
    metaTitle: 'Sistema para Transportadoras | Gestão Logística Atendo One',
    metaDescription: 'Conheça um sistema para transportadoras organizar fretes, motoristas, veículos, usuários, checklists, despesas e notificações.',
    content: '<p>Escolher um sistema para transportadoras envolve verificar se a ferramenta representa o processo da empresa, separa permissões, preserva os dados e permite consultar o histórico da operação.</p><h2>Uma operação organizada por empresa</h2><p>O Atendo One foi estruturado para operações multiempresa. A transportadora cadastra sua equipe, motoristas, veículos e fretes em um ambiente próprio, com vínculos e autorizações controlados.</p><h2>Do cadastro ao acompanhamento</h2><p>A empresa pode criar fretes, informar condições, acompanhar aceites e usar formulários ou checklists para registrar conferências. Veículos e motoristas podem ser associados conforme as regras da operação.</p><h2>Comunicação e controle</h2><p>Notificações por e-mail e WhatsApp seguem preferências de canal e consentimento. Compare <a href="/elo-log/gestao-de-motoristas">gestão de motoristas</a>, <a href="/elo-log/gestao-de-veiculos">gestão de veículos</a> e <a href="/conteudo/gestao-de-fretes-para-transportadoras">gestão de fretes</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-gestao-fretes', slug: 'gestao-de-fretes',
    title: 'Gestão de fretes para transportadoras',
    excerpt: 'Publique oportunidades, organize etapas e acompanhe o aceite e a execução com mais clareza.',
    metaTitle: 'Gestão de Fretes para Transportadoras | Atendo One',
    metaDescription: 'Organize gestão de fretes, publicação, aceite, acompanhamento e histórico operacional em uma plataforma para transportadoras.',
    content: '<p>A gestão de fretes começa com um cadastro completo e termina com um histórico confiável. A empresa informa origem, destino, carga, prazo, veículo necessário e condições que ajudem o motorista a avaliar a oportunidade.</p><h2>Um fluxo de frete mais claro</h2><p>Etapas padronizadas ajudam o time a identificar o que está disponível, reservado, em coleta, em trânsito ou concluído.</p><h2>Visibilidade com controle</h2><p>A publicação pode ser direcionada aos usuários e motoristas autorizados. Quando a empresa opta pela vitrine pública, o sistema exibe somente um resumo e mantém valor, contatos, endereços exatos e dados internos protegidos.</p><h2>Histórico para suporte e melhoria</h2><p>Alterações, ocorrências, formulários e checklists formam um histórico útil para suporte e auditoria. Veja <a href="/elo-log/publicacao-de-fretes">como publicar fretes</a>, <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">rastreamento</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-publicacao-fretes', slug: 'publicacao-de-fretes',
    title: 'Publicação de fretes para conectar empresas e motoristas',
    excerpt: 'Estruture uma oportunidade de transporte antes de disponibilizá-la para motoristas autorizados.',
    metaTitle: 'Publicação de Fretes | Conecte Transportadoras e Motoristas',
    metaDescription: 'Veja como publicar fretes com informações completas, controlar visibilidade, acompanhar o aceite e manter o histórico da operação.',
    content: '<p>Uma boa publicação de frete responde às principais dúvidas antes do primeiro contato. Origem, destino, tipo de carga, período, veículo, observações e condições comerciais devem ser informados conforme o que a empresa realmente conhece.</p><h2>Confira antes de publicar</h2><ol><li>Reúna os dados básicos da viagem.</li><li>Defina a visibilidade para usuários e motoristas.</li><li>Revise campos e observações.</li><li>Publique e acompanhe manifestações de interesse.</li><li>Atualize o status e registre ocorrências.</li></ol><h2>Vitrine pública com proteção</h2><p>A empresa escolhe se o frete será público. A vitrine pode mostrar um resumo, mas valor e dados internos permanecem condicionados ao cadastro, à validação e às permissões.</p><p>Conheça a <a href="/vitrine-fretes">vitrine de fretes</a>, a <a href="/elo-log/gestao-de-fretes">gestão de fretes</a> e o guia de <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">conexão com motoristas</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-fretes-motoristas', slug: 'fretes-para-motoristas',
    title: 'Fretes para motoristas e caminhoneiros',
    excerpt: 'Encontre oportunidades publicadas por empresas e demonstre interesse com cadastro e validação.',
    metaTitle: 'Fretes para Motoristas e Caminhoneiros | Atendo One',
    metaDescription: 'Consulte oportunidades de fretes para motoristas, cadastre-se, demonstre interesse e aguarde a validação da empresa responsável.',
    content: '<p>Motoristas podem consultar oportunidades publicadas voluntariamente por empresas na vitrine do Atendo One. Os dados exibidos são resumidos; valor e manifestação de interesse dependem de cadastro, validação e autorização.</p><h2>Como funciona</h2><ol><li>Pesquise por cidade, estado, carga ou código.</li><li>Confira o tipo de veículo e o resumo.</li><li>Informe nome e telefone no cadastro rápido.</li><li>Complete os dados solicitados.</li><li>Aguarde a análise da empresa.</li></ol><h2>Uma aprovação por empresa</h2><p>O cadastro do motorista pode ser utilizado em mais de uma empresa, mas cada vínculo é independente. Uma aprovação ou recusa não decide automaticamente os demais vínculos.</p><p>Comece pela <a href="/vitrine-fretes">vitrine pública</a>, veja <a href="/elo-log/gestao-de-motoristas">gestão de motoristas</a> e consulte <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklists de viagem</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-gestao-motoristas', slug: 'gestao-de-motoristas',
    title: 'Gestão de motoristas e vínculos por empresa',
    excerpt: 'Organize cadastros, validações e permissões sem transformar o vínculo em uma identidade duplicada.',
    metaTitle: 'Gestão de Motoristas para Transportadoras | Atendo One',
    metaDescription: 'Gerencie motoristas, vínculos por empresa, aprovações e permissões em uma plataforma multiempresa para operações de transporte.',
    content: '<p>A gestão de motoristas precisa equilibrar reaproveitamento de informações e responsabilidade de cada empresa. O Atendo One mantém a identidade do motorista separada dos vínculos empresariais.</p><h2>Vínculos independentes</h2><p>Um motorista pode trabalhar com mais de uma empresa na plataforma. Cada empresa decide se aprova, recusa ou bloqueia o vínculo para sua própria operação.</p><h2>Conferência e divergências</h2><p>Durante o cadastro, o sistema pode identificar coincidências de telefone, CPF, placa ou outros dados. A divergência deve ser analisada pela empresa e registrada com cuidado; a identidade não deve ser apagada automaticamente.</p><h2>Mais controle para o time</h2><p>Permissões, histórico e notificações ajudam a equipe a acompanhar solicitações. Consulte <a href="/elo-log/fretes-para-motoristas">fretes para motoristas</a>, <a href="/elo-log/gestao-de-veiculos">gestão de veículos</a> e <a href="/conteudo/sistema-de-gestao-de-transportes-tms">TMS</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-gestao-veiculos', slug: 'gestao-de-veiculos',
    title: 'Gestão de veículos para transportadoras',
    excerpt: 'Mantenha veículos próprios, dados operacionais e vínculos de uso organizados.',
    metaTitle: 'Gestão de Veículos para Transportadoras | Atendo One',
    metaDescription: 'Cadastre e organize veículos próprios, dados de identificação, capacidade, manutenção e uso em operações de transporte.',
    content: '<p>Veículos próprios são parte importante da operação e podem ser necessários para documentos e registros do transporte. O Atendo One oferece uma área específica para manter dados organizados por empresa.</p><h2>Dados úteis no cadastro</h2><p>Placa, tipo, marca, modelo, ano, capacidade, carroceria e situação ajudam a equipe a selecionar o veículo adequado.</p><h2>Histórico e inativação</h2><p>Um veículo que deixa de operar não precisa desaparecer do histórico. A inativação preserva referências de viagens e documentos anteriores, reduzindo risco de perda.</p><h2>Veículo correto para cada etapa</h2><p>A empresa consulta a frota e relaciona registros a fretes e checklists. Veja <a href="/elo-log/gestao-de-viagens">gestão de viagens</a>, <a href="/elo-log/sistema-para-transportadoras">sistema para transportadoras</a> e <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist digital</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-gestao-viagens', slug: 'gestao-de-viagens',
    title: 'Gestão de viagens e acompanhamento operacional',
    excerpt: 'Acompanhe etapas, responsáveis, despesas, checklists e ocorrências relacionadas a cada operação.',
    metaTitle: 'Gestão de Viagens para Transportadoras | Atendo One',
    metaDescription: 'Organize viagens com status, motoristas, veículos, checklists, despesas, ocorrências e histórico operacional.',
    content: '<p>A gestão de viagens transforma o frete aceito em acompanhamento operacional com etapas e responsabilidades. A equipe precisa saber quais pessoas e veículos estão envolvidos e quais pendências existem.</p><h2>Etapas visíveis</h2><p>Status padronizados ajudam a comunicar coleta, trânsito, ocorrência e conclusão. Cada atualização deve preservar o histórico e indicar a próxima ação.</p><h2>Checklists e ocorrências</h2><p>Formulários e checklists registram conferências antes, durante e depois do transporte. Uma divergência deve indicar contexto, responsável e providência, sem apagar o registro anterior.</p><h2>Decisões baseadas em registros</h2><p>Relatórios de viagem, despesas e indicadores ajudam a identificar atrasos e padrões. Consulte <a href="/elo-log/controle-de-despesas">controle de despesas</a>, <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores</a>.</p>'
  }),
  commercialPage(now, {
    id: 'page-commercial-controle-despesas', slug: 'controle-de-despesas',
    title: 'Controle de despesas no transporte',
    excerpt: 'Registre custos relacionados às viagens e consulte informações que apoiam o acompanhamento da operação.',
    metaTitle: 'Controle de Despesas de Transporte | Atendo One',
    metaDescription: 'Controle despesas de viagens e transporte, organize registros por operação e acompanhe informações para melhorar a gestão logística.',
    content: '<p>O controle de despesas ajuda a transportadora a entender quanto uma operação consome e onde aparecem divergências. O registro deve estar relacionado à viagem ou ao frete, com descrição, valor, data e responsável quando disponíveis.</p><h2>Mais do que uma lista de valores</h2><p>Uma despesa contextualizada facilita a conferência e a comparação posterior. A equipe pode separar custos por etapa e manter comprovantes conforme a política da empresa.</p><h2>Dados para a gestão</h2><p>Quando despesas, status, veículos e motoristas estão associados à operação, os relatórios oferecem uma visão mais útil. O sistema organiza registros, mas não substitui revisão contábil.</p><h2>Integração com o fluxo operacional</h2><p>Combine despesas com <a href="/elo-log/gestao-de-viagens">gestão de viagens</a>, <a href="/elo-log/gestao-de-veiculos">gestão de veículos</a> e <a href="/conteudo/gestao-de-fretes-para-transportadoras">gestão de fretes</a>.</p>'
  })
];
