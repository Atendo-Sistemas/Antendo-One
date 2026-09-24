var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_node_crypto2 = require("node:crypto");
var import_path3 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs3 = __toESM(require("fs"), 1);

// server/api.ts
var import_express = require("express");

// server/db.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");

// server/notificationDefaults.ts
var defaultNotificationTemplates = [
  {
    id: "empresa-cadastrada",
    eventKey: "EMPRESA_CADASTRADA",
    label: "Nova empresa cadastrada",
    description: "Enviada ao Super Admin e ao respons\xE1vel quando uma empresa conclui o cadastro.",
    category: "EMPRESA",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Novo cadastro de empresa \u2014 {empresa}",
    emailBody: "Ol\xE1, {nome}. O cadastro da empresa {empresa} foi recebido e est\xE1 aguardando an\xE1lise.",
    whatsappBody: "ELO LOG: o cadastro da empresa {empresa} foi recebido e est\xE1 aguardando an\xE1lise.",
    variables: ["nome", "empresa", "email", "telefone"]
  },
  {
    id: "empresa-aprovada",
    eventKey: "EMPRESA_APROVADA",
    label: "Empresa aprovada",
    description: "Enviada ao administrador da empresa quando o cadastro \xE9 liberado.",
    category: "EMPRESA",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Cadastro aprovado \u2014 {empresa}",
    emailBody: "Ol\xE1, {nome}. O cadastro da empresa {empresa} foi aprovado. Acesse a plataforma para come\xE7ar.",
    whatsappBody: "ELO LOG: o cadastro da empresa {empresa} foi aprovado. Voc\xEA j\xE1 pode acessar a plataforma.",
    variables: ["nome", "empresa", "link"]
  },
  {
    id: "usuario-cadastrado",
    eventKey: "USUARIO_CADASTRADO",
    label: "Usu\xE1rio cadastrado",
    description: "Enviada ao novo usu\xE1rio e aos administradores respons\xE1veis pelo tenant.",
    category: "USUARIO",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Seu acesso ao Elo Log foi criado",
    emailBody: "Ol\xE1, {nome}. Seu acesso \xE0 empresa {empresa} foi criado. Use o e-mail cadastrado para entrar.",
    whatsappBody: "ELO LOG: seu acesso \xE0 empresa {empresa} foi criado. Use o e-mail cadastrado para entrar.",
    variables: ["nome", "empresa", "email", "telefone", "link"]
  },
  {
    id: "motorista-cadastrado",
    eventKey: "MOTORISTA_CADASTRADO",
    label: "Motorista cadastrado",
    description: "Enviada ao motorista e aos administradores da empresa relacionada.",
    category: "USUARIO",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Cadastro de motorista realizado",
    emailBody: "Ol\xE1, {nome}. Seu cadastro como motorista na empresa {empresa} foi realizado.",
    whatsappBody: "ELO LOG: seu cadastro como motorista na empresa {empresa} foi realizado.",
    variables: ["nome", "empresa", "email", "telefone"]
  },
  {
    id: "frete-publicado",
    eventKey: "FRETE_PUBLICADO",
    label: "Frete publicado",
    description: "Enviada aos motoristas eleg\xEDveis quando um novo frete fica dispon\xEDvel.",
    category: "FRETE",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Novo frete dispon\xEDvel \u2014 {codigoFrete}",
    emailBody: "Um novo frete ({codigoFrete}) foi publicado de {origem} para {destino}, no valor de {valor}.",
    whatsappBody: "ELO LOG: novo frete {codigoFrete} dispon\xEDvel de {origem} para {destino}. Valor: {valor}.",
    variables: ["codigoFrete", "origem", "destino", "valor", "empresa", "link"]
  },
  {
    id: "frete-aceito",
    eventKey: "FRETE_ACEITO",
    label: "Frete aceito",
    description: "Enviada aos administradores da empresa e ao motorista respons\xE1vel.",
    category: "FRETE",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Frete {codigoFrete} aceito",
    emailBody: "O frete {codigoFrete} foi aceito pelo motorista {nomeMotorista}.",
    whatsappBody: "ELO LOG: o frete {codigoFrete} foi aceito pelo motorista {nomeMotorista}.",
    variables: ["codigoFrete", "nomeMotorista", "empresa", "status"]
  },
  {
    id: "status-atualizado",
    eventKey: "STATUS_ATUALIZADO",
    label: "Status de frete atualizado",
    description: "Enviada \xE0s pessoas envolvidas no frete quando o status muda.",
    category: "FRETE",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Frete {codigoFrete}: status {status}",
    emailBody: "O status do frete {codigoFrete} foi atualizado para {status}.",
    whatsappBody: "ELO LOG: o frete {codigoFrete} foi atualizado para {status}.",
    variables: ["codigoFrete", "status", "empresa", "nomeMotorista"]
  },
  {
    id: "frete-cancelado",
    eventKey: "FRETE_CANCELADO",
    label: "Frete cancelado",
    description: "Enviada \xE0s pessoas envolvidas quando um frete \xE9 cancelado.",
    category: "FRETE",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Frete {codigoFrete} cancelado",
    emailBody: "O frete {codigoFrete} da empresa {empresa} foi cancelado. Motivo: {motivo}.",
    whatsappBody: "ELO LOG: o frete {codigoFrete} foi cancelado. Motivo: {motivo}.",
    variables: ["codigoFrete", "empresa", "motivo", "status", "link"]
  },
  {
    id: "pagamento-criado",
    eventKey: "PAGAMENTO_CRIADO",
    label: "Cobran\xE7a de plano criada",
    description: "Enviada ao administrador da empresa quando uma cobran\xE7a Asaas \xE9 criada.",
    category: "PAGAMENTO",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Cobran\xE7a do plano criada \u2014 {empresa}",
    emailBody: "A cobran\xE7a do plano {plano} para {empresa} foi criada no valor de {valor}.",
    whatsappBody: "ELO LOG: a cobran\xE7a do plano {plano} para {empresa} foi criada no valor de {valor}.",
    variables: ["empresa", "plano", "valor", "link"]
  },
  {
    id: "usuario-status-atualizado",
    eventKey: "USUARIO_STATUS_ATUALIZADO",
    label: "Status de usu\xE1rio atualizado",
    description: "Enviada ao usu\xE1rio e aos administradores quando o status da conta muda.",
    category: "USUARIO",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Atualiza\xE7\xE3o do seu acesso ao Elo Log",
    emailBody: "Ol\xE1, {nome}. O status do seu acesso \xE0 empresa {empresa} foi atualizado para {status}.",
    whatsappBody: "ELO LOG: o status do seu acesso \xE0 empresa {empresa} foi atualizado para {status}.",
    variables: ["nome", "empresa", "status", "email", "telefone", "link"]
  },
  {
    id: "interesse-frete",
    eventKey: "INTERESSE_FRETE",
    label: "Interesse em frete e an\xE1lise de v\xEDnculo",
    description: "Enviada ao motorista quando a empresa atualiza a an\xE1lise da solicita\xE7\xE3o de interesse ou v\xEDnculo.",
    category: "FRETE",
    enabled: true,
    editable: true,
    channels: { email: true, whatsapp: true, inApp: true },
    emailSubject: "Atualiza\xE7\xE3o da sua solicita\xE7\xE3o de frete",
    emailBody: "Ol\xE1, {nome}. A empresa {empresa} atualizou sua solicita\xE7\xE3o para o frete {codigoFrete}: {status}.",
    whatsappBody: "ELO LOG: sua solicita\xE7\xE3o no frete {codigoFrete} foi atualizada para {status} pela empresa {empresa}.",
    variables: ["nome", "empresa", "status", "codigoFrete", "link"]
  },
  {
    id: "login-otp",
    eventKey: "LOGIN_OTP",
    label: "C\xF3digo de acesso por WhatsApp",
    description: "Mensagem de autentica\xE7\xE3o enviada ao telefone informado no login. O c\xF3digo e a validade s\xE3o obrigat\xF3rios.",
    category: "SISTEMA",
    enabled: true,
    editable: true,
    channels: { email: false, whatsapp: true, inApp: false },
    emailSubject: "C\xF3digo de acesso",
    emailBody: "Seu c\xF3digo de acesso \xE9 {codigo}. V\xE1lido por {validadeMinutos} minutos.",
    whatsappBody: "{nomePlataforma}: seu c\xF3digo de acesso \xE9 {codigo}. V\xE1lido por {validadeMinutos} minutos. N\xE3o compartilhe este c\xF3digo.",
    variables: ["nomePlataforma", "codigo", "validadeMinutos"]
  },
  {
    id: "erro-sistema",
    eventKey: "ERRO_SISTEMA",
    label: "Erro cr\xEDtico do sistema",
    description: "Mensagem t\xE9cnica protegida; n\xE3o pode ser editada nem usada para disparos comerciais.",
    category: "SISTEMA",
    enabled: true,
    editable: false,
    systemLocked: true,
    channels: { email: false, whatsapp: false, inApp: true },
    emailSubject: "Erro do sistema",
    emailBody: "Ocorreu um erro interno. Consulte o log t\xE9cnico com acesso autorizado.",
    whatsappBody: "Ocorreu um erro interno no sistema.",
    variables: ["correlationId", "timestamp"]
  }
];

// server/publicContentDefaults.ts
var publicSeoPages = (now) => [
  {
    id: "page-seo-gestao-de-fretes",
    tenantId: null,
    slug: "gestao-de-fretes-para-transportadoras",
    title: "Gest\xE3o de fretes para transportadoras: guia pr\xE1tico",
    excerpt: "Entenda como organizar a publica\xE7\xE3o, a negocia\xE7\xE3o e o acompanhamento de fretes em uma opera\xE7\xE3o de transporte.",
    metaTitle: "Gest\xE3o de Fretes para Transportadoras | Atendo One",
    metaDescription: "Veja como uma gest\xE3o de fretes organizada ajuda transportadoras a centralizar oportunidades, motoristas, documentos e acompanhamento operacional.",
    content: '<p>A gest\xE3o de fretes re\xFAne as etapas que come\xE7am na identifica\xE7\xE3o de uma demanda de transporte e terminam no acompanhamento da entrega. Para uma transportadora, organizar esse fluxo significa registrar informa\xE7\xF5es, distribuir oportunidades com clareza e manter a opera\xE7\xE3o vis\xEDvel para as pessoas certas.</p><h2>O que uma gest\xE3o de fretes precisa organizar</h2><p>Uma rotina bem estruturada normalmente concentra dados de origem e destino, tipo de carga, ve\xEDculo necess\xE1rio, prazo, condi\xE7\xF5es comerciais, respons\xE1vel pelo acompanhamento e status da viagem. O objetivo n\xE3o \xE9 apenas armazenar dados, mas reduzir retrabalho e facilitar decis\xF5es durante a opera\xE7\xE3o.</p><h2>Como digitalizar o fluxo de publica\xE7\xE3o</h2><p>O primeiro passo \xE9 padronizar o cadastro do frete. Em seguida, a empresa pode publicar a oportunidade para os motoristas habilitados, registrar o aceite e acompanhar as mudan\xE7as de status em um \xFAnico ambiente. Esse processo cria um hist\xF3rico \xFAtil para suporte, auditoria e melhoria cont\xEDnua.</p><h2>Benef\xEDcios para transportadoras</h2><ul><li>Mais clareza sobre fretes dispon\xEDveis, reservados e em andamento.</li><li>Menos depend\xEAncia de mensagens dispersas e planilhas paralelas.</li><li>Hist\xF3rico operacional para identificar pend\xEAncias e ocorr\xEAncias.</li><li>Comunica\xE7\xE3o mais organizada entre empresa, usu\xE1rio e motorista.</li></ul><h2>Por onde come\xE7ar</h2><p>Comece mapeando as etapas que j\xE1 existem na sua opera\xE7\xE3o e defina quais informa\xE7\xF5es precisam ser obrigat\xF3rias em cada etapa. Depois, escolha uma plataforma que permita controlar permiss\xF5es, registrar altera\xE7\xF5es e manter os dados separados por empresa.</p><p>Conhe\xE7a tamb\xE9m o <a href="/conteudo/sistema-de-gestao-de-transportes-tms">sistema de gest\xE3o de transportes (TMS)</a> e veja <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">como publicar fretes e conectar transportadoras a motoristas</a>.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "page-seo-tms",
    tenantId: null,
    slug: "sistema-de-gestao-de-transportes-tms",
    title: "Sistema de gest\xE3o de transportes (TMS): recursos essenciais",
    excerpt: "Saiba quais recursos avaliar ao escolher um sistema para organizar fretes, frotas, usu\xE1rios e acompanhamento de viagens.",
    metaTitle: "Sistema de Gest\xE3o de Transportes TMS | Atendo One",
    metaDescription: "Conhe\xE7a os recursos essenciais de um TMS para transportadoras: fretes, usu\xE1rios, motoristas, checklists, rastreamento e auditoria.",
    content: '<p>Um sistema de gest\xE3o de transportes, conhecido como TMS, ajuda a estruturar informa\xE7\xF5es e rotinas de uma opera\xE7\xE3o log\xEDstica. A ferramenta ideal deve acompanhar o processo real da empresa e oferecer visibilidade sem criar etapas desnecess\xE1rias.</p><h2>Recursos essenciais de um TMS</h2><h3>Cadastro e publica\xE7\xE3o de fretes</h3><p>O sistema deve permitir registrar os detalhes do frete, controlar o ciclo de vida e disponibilizar a oportunidade aos usu\xE1rios autorizados. A publica\xE7\xE3o precisa ser clara para reduzir d\xFAvidas e acelerar a tomada de decis\xE3o.</p><h3>Gest\xE3o de empresas, usu\xE1rios e motoristas</h3><p>Em opera\xE7\xF5es com diferentes equipes, \xE9 importante separar os dados por empresa e definir permiss\xF5es por fun\xE7\xE3o. Assim, cada pessoa visualiza e executa somente as tarefas que correspondem ao seu papel.</p><h3>Checklists e registros da viagem</h3><p>Checklists digitais ajudam a documentar confer\xEAncias antes, durante e depois do transporte. Quando os registros ficam associados \xE0 viagem, a empresa consegue consultar o hist\xF3rico com mais facilidade.</p><h3>Rastreamento e comunica\xE7\xE3o</h3><p>Recursos de localiza\xE7\xE3o, atualiza\xE7\xE3o de status e notifica\xE7\xF5es ajudam a manter os envolvidos informados. A plataforma deve permitir configurar os canais dispon\xEDveis e preservar um hist\xF3rico das comunica\xE7\xF5es relevantes.</p><h3>Auditoria e relat\xF3rios</h3><p>Relat\xF3rios e trilhas de auditoria apoiam o acompanhamento da opera\xE7\xE3o e a investiga\xE7\xE3o de diverg\xEAncias. \xC9 recomend\xE1vel verificar se os documentos gerados exibem os dados corretos da empresa e do frete.</p><h2>Como avaliar uma plataforma</h2><p>Antes de escolher um TMS, avalie a facilidade de cadastro, a seguran\xE7a das permiss\xF5es, a capacidade de integra\xE7\xE3o, a qualidade do suporte e a forma como os dados s\xE3o preservados durante atualiza\xE7\xF5es.</p><p>Veja tamb\xE9m o guia de <a href="/conteudo/gestao-de-fretes-para-transportadoras">gest\xE3o de fretes para transportadoras</a> e as pr\xE1ticas para um <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist de viagem digital</a>.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "page-seo-publicacao-fretes",
    tenantId: null,
    slug: "publicacao-de-fretes-e-conexao-com-motoristas",
    title: "Como publicar fretes e conectar transportadoras a motoristas",
    excerpt: "Um passo a passo para estruturar a publica\xE7\xE3o de oportunidades de transporte e facilitar o aceite pelo motorista.",
    metaTitle: "Como Publicar Fretes e Encontrar Motoristas | Atendo One",
    metaDescription: "Aprenda a organizar a publica\xE7\xE3o de fretes, informar as condi\xE7\xF5es da viagem e acompanhar o aceite de motoristas em uma plataforma log\xEDstica.",
    content: '<p>Publicar um frete com informa\xE7\xF5es completas facilita a an\xE1lise do motorista e diminui a necessidade de mensagens complementares. A qualidade do cadastro \xE9 uma parte importante da efici\xEAncia de uma opera\xE7\xE3o de transporte.</p><h2>1. Re\xFAna as informa\xE7\xF5es do frete</h2><p>Registre origem, destino, datas, tipo de carga, ve\xEDculo necess\xE1rio, observa\xE7\xF5es e condi\xE7\xF5es comerciais. Quando uma informa\xE7\xE3o ainda n\xE3o estiver definida, sinalize a pend\xEAncia em vez de preencher o campo com uma suposi\xE7\xE3o.</p><h2>2. Defina quem pode visualizar</h2><p>Em uma opera\xE7\xE3o multiempresa, a visibilidade deve respeitar as permiss\xF5es e o v\xEDnculo do usu\xE1rio. A separa\xE7\xE3o por empresa reduz o risco de compartilhar dados operacionais com pessoas que n\xE3o participam daquela viagem.</p><h2>3. Publique e acompanhe o aceite</h2><p>Depois da confer\xEAncia, publique o frete e acompanhe as respostas. O registro do aceite deve ficar associado \xE0 oportunidade para que a empresa saiba quem assumiu a etapa seguinte.</p><h2>4. Atualize o status da viagem</h2><p>Use status padronizados para informar se o frete est\xE1 dispon\xEDvel, reservado, em coleta, em tr\xE2nsito ou conclu\xEDdo. A atualiza\xE7\xE3o consistente melhora a comunica\xE7\xE3o entre o time operacional e o motorista.</p><h2>5. Mantenha o hist\xF3rico</h2><p>Guarde altera\xE7\xF5es, ocorr\xEAncias, documentos e comprovantes relacionados ao frete. O hist\xF3rico ajuda a resolver d\xFAvidas e a revisar o processo depois da entrega.</p><p>Para ampliar a organiza\xE7\xE3o, consulte o conte\xFAdo sobre <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">rastreamento e visibilidade operacional</a> e os <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores log\xEDsticos</a> que podem ser acompanhados.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  }
];
var publicSeoPosts = (now) => [
  {
    id: "post-seo-checklist-viagem",
    tenantId: null,
    slug: "checklist-de-viagem-para-transportadoras",
    title: "Checklist de viagem: como digitalizar a confer\xEAncia do frete",
    excerpt: "Veja como estruturar um checklist de viagem para registrar confer\xEAncias, evid\xEAncias e ocorr\xEAncias com mais consist\xEAncia.",
    author: "Atendo One",
    metaTitle: "Checklist de Viagem para Transportadoras | Atendo One",
    metaDescription: "Aprenda a montar um checklist de viagem digital para transportadoras, motoristas e equipes que precisam registrar confer\xEAncias da opera\xE7\xE3o.",
    content: '<p>O checklist de viagem transforma uma confer\xEAncia informal em um registro que pode ser consultado pela empresa e pelo motorista. Ele deve ser objetivo, estar relacionado \xE0 etapa correta da viagem e permitir o registro de observa\xE7\xF5es quando houver uma diverg\xEAncia.</p><h2>O que incluir no checklist</h2><ul><li>Identifica\xE7\xE3o do ve\xEDculo e do motorista.</li><li>Condi\xE7\xF5es aparentes do ve\xEDculo e dos equipamentos necess\xE1rios.</li><li>Confer\xEAncia de documentos e informa\xE7\xF5es da carga.</li><li>Registro de fotos ou evid\xEAncias quando aplic\xE1vel.</li><li>Observa\xE7\xF5es, ocorr\xEAncias e respons\xE1vel pela confer\xEAncia.</li></ul><h2>Como evitar checklists dif\xEDceis de usar</h2><p>Separe itens obrigat\xF3rios de itens complementares, use descri\xE7\xF5es simples e organize as perguntas na ordem em que a confer\xEAncia acontece. Um formul\xE1rio muito extenso pode reduzir a qualidade das respostas e aumentar o tempo de preenchimento.</p><h2>Por que associar o checklist ao frete</h2><p>Quando a confer\xEAncia fica vinculada ao frete, o hist\xF3rico da opera\xE7\xE3o passa a reunir dados de identifica\xE7\xE3o, status e evid\xEAncias em um mesmo contexto. Isso facilita o suporte e a an\xE1lise posterior.</p><p>O checklist \xE9 apenas uma parte do processo. Combine-o com <a href="/conteudo/gestao-de-fretes-para-transportadoras">gest\xE3o de fretes</a> e <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade da viagem</a>.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "post-seo-rastreamento-fretes",
    tenantId: null,
    slug: "rastreamento-de-fretes-e-visibilidade-operacional",
    title: "Rastreamento de fretes: como melhorar a visibilidade da opera\xE7\xE3o",
    excerpt: "Entenda como atualiza\xE7\xF5es de localiza\xE7\xE3o e status ajudam a equipe a acompanhar a viagem e agir diante de ocorr\xEAncias.",
    author: "Atendo One",
    metaTitle: "Rastreamento de Fretes e Visibilidade Operacional | Atendo One",
    metaDescription: "Descubra como organizar rastreamento, status e comunica\xE7\xE3o para acompanhar fretes e dar mais visibilidade \xE0 opera\xE7\xE3o log\xEDstica.",
    content: '<p>Rastreamento de fretes n\xE3o \xE9 apenas visualizar uma posi\xE7\xE3o no mapa. \xC9 combinar localiza\xE7\xE3o, status, respons\xE1veis e ocorr\xEAncias para que a equipe compreenda o momento da viagem e saiba quando uma a\xE7\xE3o \xE9 necess\xE1ria.</p><h2>Quais informa\xE7\xF5es formam uma boa visibilidade</h2><p>Uma vis\xE3o operacional \xFAtil re\xFAne identifica\xE7\xE3o do frete, origem e destino, motorista respons\xE1vel, \xFAltima atualiza\xE7\xE3o, etapa atual e observa\xE7\xF5es. O n\xEDvel de detalhe deve ser compat\xEDvel com a opera\xE7\xE3o e com as permiss\xF5es de cada usu\xE1rio.</p><h2>Como usar status padronizados</h2><p>Status como dispon\xEDvel, reservado, em coleta, em tr\xE2nsito e entregue criam uma linguagem comum. A equipe consegue filtrar prioridades e comunicar o andamento sem depender de interpreta\xE7\xF5es diferentes.</p><h2>O que fazer quando h\xE1 uma ocorr\xEAncia</h2><p>Registre o fato, a data, o respons\xE1vel e a provid\xEAncia tomada. Evite apagar o hist\xF3rico para substituir uma informa\xE7\xE3o; prefira registrar a atualiza\xE7\xE3o de forma rastre\xE1vel.</p><h2>Rastreamento com privacidade e seguran\xE7a</h2><p>Dados de localiza\xE7\xE3o e contato devem ser acess\xEDveis somente a pessoas autorizadas. A empresa precisa definir finalidades, permiss\xF5es e per\xEDodos de reten\xE7\xE3o compat\xEDveis com o servi\xE7o e com suas obriga\xE7\xF5es.</p><p>Para estruturar a opera\xE7\xE3o, consulte tamb\xE9m o guia de <a href="/conteudo/sistema-de-gestao-de-transportes-tms">TMS</a> e os <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores de desempenho log\xEDstico</a>.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "post-seo-indicadores-logistica",
    tenantId: null,
    slug: "indicadores-de-desempenho-na-logistica",
    title: "Indicadores log\xEDsticos: 7 m\xE9tricas para acompanhar o transporte",
    excerpt: "Conhe\xE7a m\xE9tricas que ajudam a transportadora a acompanhar prazos, ocorr\xEAncias, utiliza\xE7\xE3o e qualidade dos registros.",
    author: "Atendo One",
    metaTitle: "7 Indicadores de Desempenho Log\xEDstico | Atendo One",
    metaDescription: "Conhe\xE7a sete indicadores log\xEDsticos para acompanhar fretes, prazos, ocorr\xEAncias, utiliza\xE7\xE3o da frota e qualidade da opera\xE7\xE3o.",
    content: '<p>Indicadores log\xEDsticos ajudam a transformar registros da opera\xE7\xE3o em perguntas objetivas para a gest\xE3o. A escolha das m\xE9tricas deve considerar o tipo de transporte, o perfil dos clientes e a capacidade da equipe de agir sobre os resultados.</p><h2>Sete m\xE9tricas \xFAteis</h2><ol><li><strong>Entregas no prazo:</strong> compara a data combinada com a conclus\xE3o registrada.</li><li><strong>Tempo de ciclo do frete:</strong> observa o intervalo entre a publica\xE7\xE3o e o encerramento.</li><li><strong>Tempo at\xE9 o aceite:</strong> mostra quanto tempo uma oportunidade leva para ser assumida.</li><li><strong>Ocorr\xEAncias por viagem:</strong> ajuda a identificar padr\xF5es de falha ou risco.</li><li><strong>Fretes por ve\xEDculo:</strong> apoia a an\xE1lise de utiliza\xE7\xE3o da frota.</li><li><strong>Completude dos registros:</strong> acompanha se os campos e documentos essenciais foram preenchidos.</li><li><strong>Tempo de resposta operacional:</strong> mede a agilidade para tratar d\xFAvidas e ocorr\xEAncias.</li></ol><h2>Como transformar m\xE9trica em melhoria</h2><p>Defina uma periodicidade de acompanhamento, escolha respons\xE1veis e registre as a\xE7\xF5es tomadas. Uma m\xE9trica s\xF3 gera valor quando ajuda a decidir o que deve ser mantido, corrigido ou investigado.</p><p>Uma base confi\xE1vel depende de dados consistentes. Veja como <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">publicar fretes com clareza</a> e como usar um <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist digital</a> para melhorar os registros.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  }
];

// server/publicCommercialDefaults.ts
var commercialPage = (now, page) => ({
  ...page,
  tenantId: null,
  publicPath: "elo-log",
  isPublished: true,
  isIndexable: true,
  contentVersion: "seo-2026-08-27",
  createdAt: now,
  updatedAt: now
});
var publicCommercialPages = (now) => [
  commercialPage(now, {
    id: "page-commercial-elo-log",
    slug: "elo-log",
    title: "Atendo One para opera\xE7\xF5es log\xEDsticas",
    excerpt: "Uma plataforma para organizar fretes, equipes, motoristas, ve\xEDculos, checklists e comunica\xE7\xE3o em um s\xF3 ambiente.",
    metaTitle: "Atendo One para Opera\xE7\xF5es Log\xEDsticas | Gest\xE3o de Fretes",
    metaDescription: "Conhe\xE7a o Atendo One para organizar fretes, equipes, motoristas, ve\xEDculos, checklists e notifica\xE7\xF5es em uma plataforma log\xEDstica multiempresa.",
    content: '<p>O Atendo One ajuda transportadoras e opera\xE7\xF5es de transporte a reunir informa\xE7\xF5es essenciais em um fluxo \xFAnico. A empresa pode cadastrar fretes, organizar usu\xE1rios, administrar motoristas e ve\xEDculos, acompanhar etapas e preservar o hist\xF3rico para consulta e auditoria.</p><h2>Uma base para a rotina da transportadora</h2><p>Em vez de distribuir dados entre planilhas e conversas isoladas, a equipe trabalha com permiss\xF5es por perfil e registros associados \xE0 empresa. O objetivo \xE9 tornar a opera\xE7\xE3o mais clara sem criar uma etapa dif\xEDcil de manter.</p><h2>Recursos para come\xE7ar</h2><ul><li>Publica\xE7\xE3o e acompanhamento de fretes.</li><li>Cadastro de motoristas, v\xEDnculos e ve\xEDculos.</li><li>Formul\xE1rios e checklists da opera\xE7\xE3o.</li><li>Despesas, relat\xF3rios e trilhas de auditoria.</li><li>Notifica\xE7\xF5es com prefer\xEAncias de e-mail e WhatsApp.</li></ul><h2>Para empresas que querem mais controle</h2><p>Conhe\xE7a o <a href="/elo-log/sistema-tms">sistema TMS</a>, veja a <a href="/elo-log/publicacao-de-fretes">publica\xE7\xE3o de fretes</a> e leia sobre <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade operacional</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-sistema-tms",
    slug: "sistema-tms",
    title: "Sistema TMS para transportadoras",
    excerpt: "Organize o fluxo de transporte com fretes, equipes, motoristas, ve\xEDculos, checklists, despesas e auditoria.",
    metaTitle: "Sistema TMS para Transportadoras | Atendo One",
    metaDescription: "Sistema TMS para transportadoras com organiza\xE7\xE3o de fretes, usu\xE1rios, motoristas, ve\xEDculos, checklists, despesas e hist\xF3rico operacional.",
    content: '<p>Um sistema TMS precisa acompanhar o trabalho real da transportadora: desde o cadastro de um frete at\xE9 a conclus\xE3o da viagem. O Atendo One estrutura essas etapas em uma plataforma multiempresa, com permiss\xF5es e registros que ajudam a equipe a saber o que aconteceu e qual \xE9 a pr\xF3xima a\xE7\xE3o.</p><h2>O que organizar em um TMS</h2><p>O fluxo pode reunir dados do frete, respons\xE1veis, motoristas, ve\xEDculos, formul\xE1rios, checklists, despesas, ocorr\xEAncias e documentos relacionados. Cada empresa mant\xE9m seu espa\xE7o operacional e os usu\xE1rios acessam o que corresponde ao seu perfil.</p><h2>Visibilidade sem perder o hist\xF3rico</h2><p>Atualiza\xE7\xF5es de status, registros de viagem e trilhas de auditoria apoiam o acompanhamento di\xE1rio e a an\xE1lise posterior.</p><h2>Comece pelo processo mais importante</h2><p>Mapeie publica\xE7\xE3o, aceite, acompanhamento e encerramento. Saiba mais sobre <a href="/elo-log/gestao-de-fretes">gest\xE3o de fretes</a>, <a href="/elo-log/gestao-de-viagens">gest\xE3o de viagens</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores log\xEDsticos</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-sistema-transportadoras",
    slug: "sistema-para-transportadoras",
    title: "Sistema para transportadoras",
    excerpt: "Uma estrutura digital para controlar fretes, pessoas, ve\xEDculos e registros da opera\xE7\xE3o de transporte.",
    metaTitle: "Sistema para Transportadoras | Gest\xE3o Log\xEDstica Atendo One",
    metaDescription: "Conhe\xE7a um sistema para transportadoras organizar fretes, motoristas, ve\xEDculos, usu\xE1rios, checklists, despesas e notifica\xE7\xF5es.",
    content: '<p>Escolher um sistema para transportadoras envolve verificar se a ferramenta representa o processo da empresa, separa permiss\xF5es, preserva os dados e permite consultar o hist\xF3rico da opera\xE7\xE3o.</p><h2>Uma opera\xE7\xE3o organizada por empresa</h2><p>O Atendo One foi estruturado para opera\xE7\xF5es multiempresa. A transportadora cadastra sua equipe, motoristas, ve\xEDculos e fretes em um ambiente pr\xF3prio, com v\xEDnculos e autoriza\xE7\xF5es controlados.</p><h2>Do cadastro ao acompanhamento</h2><p>A empresa pode criar fretes, informar condi\xE7\xF5es, acompanhar aceites e usar formul\xE1rios ou checklists para registrar confer\xEAncias. Ve\xEDculos e motoristas podem ser associados conforme as regras da opera\xE7\xE3o.</p><h2>Comunica\xE7\xE3o e controle</h2><p>Notifica\xE7\xF5es por e-mail e WhatsApp seguem prefer\xEAncias de canal e consentimento. Compare <a href="/elo-log/gestao-de-motoristas">gest\xE3o de motoristas</a>, <a href="/elo-log/gestao-de-veiculos">gest\xE3o de ve\xEDculos</a> e <a href="/conteudo/gestao-de-fretes-para-transportadoras">gest\xE3o de fretes</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-gestao-fretes",
    slug: "gestao-de-fretes",
    title: "Gest\xE3o de fretes para transportadoras",
    excerpt: "Publique oportunidades, organize etapas e acompanhe o aceite e a execu\xE7\xE3o com mais clareza.",
    metaTitle: "Gest\xE3o de Fretes para Transportadoras | Atendo One",
    metaDescription: "Organize gest\xE3o de fretes, publica\xE7\xE3o, aceite, acompanhamento e hist\xF3rico operacional em uma plataforma para transportadoras.",
    content: '<p>A gest\xE3o de fretes come\xE7a com um cadastro completo e termina com um hist\xF3rico confi\xE1vel. A empresa informa origem, destino, carga, prazo, ve\xEDculo necess\xE1rio e condi\xE7\xF5es que ajudem o motorista a avaliar a oportunidade.</p><h2>Um fluxo de frete mais claro</h2><p>Etapas padronizadas ajudam o time a identificar o que est\xE1 dispon\xEDvel, reservado, em coleta, em tr\xE2nsito ou conclu\xEDdo.</p><h2>Visibilidade com controle</h2><p>A publica\xE7\xE3o pode ser direcionada aos usu\xE1rios e motoristas autorizados. Quando a empresa opta pela vitrine p\xFAblica, o sistema exibe somente um resumo e mant\xE9m valor, contatos, endere\xE7os exatos e dados internos protegidos.</p><h2>Hist\xF3rico para suporte e melhoria</h2><p>Altera\xE7\xF5es, ocorr\xEAncias, formul\xE1rios e checklists formam um hist\xF3rico \xFAtil para suporte e auditoria. Veja <a href="/elo-log/publicacao-de-fretes">como publicar fretes</a>, <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">rastreamento</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-publicacao-fretes",
    slug: "publicacao-de-fretes",
    title: "Publica\xE7\xE3o de fretes para conectar empresas e motoristas",
    excerpt: "Estruture uma oportunidade de transporte antes de disponibiliz\xE1-la para motoristas autorizados.",
    metaTitle: "Publica\xE7\xE3o de Fretes | Conecte Transportadoras e Motoristas",
    metaDescription: "Veja como publicar fretes com informa\xE7\xF5es completas, controlar visibilidade, acompanhar o aceite e manter o hist\xF3rico da opera\xE7\xE3o.",
    content: '<p>Uma boa publica\xE7\xE3o de frete responde \xE0s principais d\xFAvidas antes do primeiro contato. Origem, destino, tipo de carga, per\xEDodo, ve\xEDculo, observa\xE7\xF5es e condi\xE7\xF5es comerciais devem ser informados conforme o que a empresa realmente conhece.</p><h2>Confira antes de publicar</h2><ol><li>Re\xFAna os dados b\xE1sicos da viagem.</li><li>Defina a visibilidade para usu\xE1rios e motoristas.</li><li>Revise campos e observa\xE7\xF5es.</li><li>Publique e acompanhe manifesta\xE7\xF5es de interesse.</li><li>Atualize o status e registre ocorr\xEAncias.</li></ol><h2>Vitrine p\xFAblica com prote\xE7\xE3o</h2><p>A empresa escolhe se o frete ser\xE1 p\xFAblico. A vitrine pode mostrar um resumo, mas valor e dados internos permanecem condicionados ao cadastro, \xE0 valida\xE7\xE3o e \xE0s permiss\xF5es.</p><p>Conhe\xE7a a <a href="/vitrine-fretes">vitrine de fretes</a>, a <a href="/elo-log/gestao-de-fretes">gest\xE3o de fretes</a> e o guia de <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">conex\xE3o com motoristas</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-fretes-motoristas",
    slug: "fretes-para-motoristas",
    title: "Fretes para motoristas e caminhoneiros",
    excerpt: "Encontre oportunidades publicadas por empresas e demonstre interesse com cadastro e valida\xE7\xE3o.",
    metaTitle: "Fretes para Motoristas e Caminhoneiros | Atendo One",
    metaDescription: "Consulte oportunidades de fretes para motoristas, cadastre-se, demonstre interesse e aguarde a valida\xE7\xE3o da empresa respons\xE1vel.",
    content: '<p>Motoristas podem consultar oportunidades publicadas voluntariamente por empresas na vitrine do Atendo One. Os dados exibidos s\xE3o resumidos; valor e manifesta\xE7\xE3o de interesse dependem de cadastro, valida\xE7\xE3o e autoriza\xE7\xE3o.</p><h2>Como funciona</h2><ol><li>Pesquise por cidade, estado, carga ou c\xF3digo.</li><li>Confira o tipo de ve\xEDculo e o resumo.</li><li>Informe nome e telefone no cadastro r\xE1pido.</li><li>Complete os dados solicitados.</li><li>Aguarde a an\xE1lise da empresa.</li></ol><h2>Uma aprova\xE7\xE3o por empresa</h2><p>O cadastro do motorista pode ser utilizado em mais de uma empresa, mas cada v\xEDnculo \xE9 independente. Uma aprova\xE7\xE3o ou recusa n\xE3o decide automaticamente os demais v\xEDnculos.</p><p>Comece pela <a href="/vitrine-fretes">vitrine p\xFAblica</a>, veja <a href="/elo-log/gestao-de-motoristas">gest\xE3o de motoristas</a> e consulte <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklists de viagem</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-gestao-motoristas",
    slug: "gestao-de-motoristas",
    title: "Gest\xE3o de motoristas e v\xEDnculos por empresa",
    excerpt: "Organize cadastros, valida\xE7\xF5es e permiss\xF5es sem transformar o v\xEDnculo em uma identidade duplicada.",
    metaTitle: "Gest\xE3o de Motoristas para Transportadoras | Atendo One",
    metaDescription: "Gerencie motoristas, v\xEDnculos por empresa, aprova\xE7\xF5es e permiss\xF5es em uma plataforma multiempresa para opera\xE7\xF5es de transporte.",
    content: '<p>A gest\xE3o de motoristas precisa equilibrar reaproveitamento de informa\xE7\xF5es e responsabilidade de cada empresa. O Atendo One mant\xE9m a identidade do motorista separada dos v\xEDnculos empresariais.</p><h2>V\xEDnculos independentes</h2><p>Um motorista pode trabalhar com mais de uma empresa na plataforma. Cada empresa decide se aprova, recusa ou bloqueia o v\xEDnculo para sua pr\xF3pria opera\xE7\xE3o.</p><h2>Confer\xEAncia e diverg\xEAncias</h2><p>Durante o cadastro, o sistema pode identificar coincid\xEAncias de telefone, CPF, placa ou outros dados. A diverg\xEAncia deve ser analisada pela empresa e registrada com cuidado; a identidade n\xE3o deve ser apagada automaticamente.</p><h2>Mais controle para o time</h2><p>Permiss\xF5es, hist\xF3rico e notifica\xE7\xF5es ajudam a equipe a acompanhar solicita\xE7\xF5es. Consulte <a href="/elo-log/fretes-para-motoristas">fretes para motoristas</a>, <a href="/elo-log/gestao-de-veiculos">gest\xE3o de ve\xEDculos</a> e <a href="/conteudo/sistema-de-gestao-de-transportes-tms">TMS</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-gestao-veiculos",
    slug: "gestao-de-veiculos",
    title: "Gest\xE3o de ve\xEDculos para transportadoras",
    excerpt: "Mantenha ve\xEDculos pr\xF3prios, dados operacionais e v\xEDnculos de uso organizados.",
    metaTitle: "Gest\xE3o de Ve\xEDculos para Transportadoras | Atendo One",
    metaDescription: "Cadastre e organize ve\xEDculos pr\xF3prios, dados de identifica\xE7\xE3o, capacidade, manuten\xE7\xE3o e uso em opera\xE7\xF5es de transporte.",
    content: '<p>Ve\xEDculos pr\xF3prios s\xE3o parte importante da opera\xE7\xE3o e podem ser necess\xE1rios para documentos e registros do transporte. O Atendo One oferece uma \xE1rea espec\xEDfica para manter dados organizados por empresa.</p><h2>Dados \xFAteis no cadastro</h2><p>Placa, tipo, marca, modelo, ano, capacidade, carroceria e situa\xE7\xE3o ajudam a equipe a selecionar o ve\xEDculo adequado.</p><h2>Hist\xF3rico e inativa\xE7\xE3o</h2><p>Um ve\xEDculo que deixa de operar n\xE3o precisa desaparecer do hist\xF3rico. A inativa\xE7\xE3o preserva refer\xEAncias de viagens e documentos anteriores, reduzindo risco de perda.</p><h2>Ve\xEDculo correto para cada etapa</h2><p>A empresa consulta a frota e relaciona registros a fretes e checklists. Veja <a href="/elo-log/gestao-de-viagens">gest\xE3o de viagens</a>, <a href="/elo-log/sistema-para-transportadoras">sistema para transportadoras</a> e <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist digital</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-gestao-viagens",
    slug: "gestao-de-viagens",
    title: "Gest\xE3o de viagens e acompanhamento operacional",
    excerpt: "Acompanhe etapas, respons\xE1veis, despesas, checklists e ocorr\xEAncias relacionadas a cada opera\xE7\xE3o.",
    metaTitle: "Gest\xE3o de Viagens para Transportadoras | Atendo One",
    metaDescription: "Organize viagens com status, motoristas, ve\xEDculos, checklists, despesas, ocorr\xEAncias e hist\xF3rico operacional.",
    content: '<p>A gest\xE3o de viagens transforma o frete aceito em acompanhamento operacional com etapas e responsabilidades. A equipe precisa saber quais pessoas e ve\xEDculos est\xE3o envolvidos e quais pend\xEAncias existem.</p><h2>Etapas vis\xEDveis</h2><p>Status padronizados ajudam a comunicar coleta, tr\xE2nsito, ocorr\xEAncia e conclus\xE3o. Cada atualiza\xE7\xE3o deve preservar o hist\xF3rico e indicar a pr\xF3xima a\xE7\xE3o.</p><h2>Checklists e ocorr\xEAncias</h2><p>Formul\xE1rios e checklists registram confer\xEAncias antes, durante e depois do transporte. Uma diverg\xEAncia deve indicar contexto, respons\xE1vel e provid\xEAncia, sem apagar o registro anterior.</p><h2>Decis\xF5es baseadas em registros</h2><p>Relat\xF3rios de viagem, despesas e indicadores ajudam a identificar atrasos e padr\xF5es. Consulte <a href="/elo-log/controle-de-despesas">controle de despesas</a>, <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade</a> e <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores</a>.</p>'
  }),
  commercialPage(now, {
    id: "page-commercial-controle-despesas",
    slug: "controle-de-despesas",
    title: "Controle de despesas no transporte",
    excerpt: "Registre custos relacionados \xE0s viagens e consulte informa\xE7\xF5es que apoiam o acompanhamento da opera\xE7\xE3o.",
    metaTitle: "Controle de Despesas de Transporte | Atendo One",
    metaDescription: "Controle despesas de viagens e transporte, organize registros por opera\xE7\xE3o e acompanhe informa\xE7\xF5es para melhorar a gest\xE3o log\xEDstica.",
    content: '<p>O controle de despesas ajuda a transportadora a entender quanto uma opera\xE7\xE3o consome e onde aparecem diverg\xEAncias. O registro deve estar relacionado \xE0 viagem ou ao frete, com descri\xE7\xE3o, valor, data e respons\xE1vel quando dispon\xEDveis.</p><h2>Mais do que uma lista de valores</h2><p>Uma despesa contextualizada facilita a confer\xEAncia e a compara\xE7\xE3o posterior. A equipe pode separar custos por etapa e manter comprovantes conforme a pol\xEDtica da empresa.</p><h2>Dados para a gest\xE3o</h2><p>Quando despesas, status, ve\xEDculos e motoristas est\xE3o associados \xE0 opera\xE7\xE3o, os relat\xF3rios oferecem uma vis\xE3o mais \xFAtil. O sistema organiza registros, mas n\xE3o substitui revis\xE3o cont\xE1bil.</p><h2>Integra\xE7\xE3o com o fluxo operacional</h2><p>Combine despesas com <a href="/elo-log/gestao-de-viagens">gest\xE3o de viagens</a>, <a href="/elo-log/gestao-de-veiculos">gest\xE3o de ve\xEDculos</a> e <a href="/conteudo/gestao-de-fretes-para-transportadoras">gest\xE3o de fretes</a>.</p>'
  })
];

// server/db/sqlAdapter.ts
var import_pg = require("pg");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var SqlAdapter = class {
  constructor() {
    this.pool = null;
    this.currentConfig = {
      enabled: !!process.env.DATABASE_URL || !!process.env.DB_HOST,
      dbType: "postgres",
      host: process.env.DB_HOST || "postgres",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "elolog",
      username: process.env.DB_USER || "elolog_user",
      password: process.env.DB_PASSWORD || "",
      ssl: process.env.DB_SSL === "true",
      autoMigrate: true,
      connectionStatus: "UNCONFIGURED"
    };
    this.initializePool();
  }
  quoteIdentifier(value) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error("Identificador SQL inv\xE1lido.");
    return `"${value.replace(/"/g, '""')}"`;
  }
  getConfig() {
    return { ...this.currentConfig };
  }
  /** Executes a parametrized query for application persistence. */
  async query(text, values = []) {
    if (!this.pool) {
      this.initializePool();
    }
    if (!this.pool) {
      throw new Error("PostgreSQL pool is not initialized");
    }
    return this.pool.query(text, values);
  }
  isEnabled() {
    return this.currentConfig.enabled;
  }
  updateConfig(newConfig) {
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig
    };
    this.initializePool();
  }
  initializePool() {
    if (!this.currentConfig.enabled) {
      if (this.pool) {
        this.pool.end().catch(() => {
        });
        this.pool = null;
      }
      this.currentConfig.connectionStatus = "UNCONFIGURED";
      return;
    }
    try {
      const poolConfig = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: this.currentConfig.ssl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false
      } : {
        host: this.currentConfig.host,
        port: this.currentConfig.port,
        database: this.currentConfig.database,
        user: this.currentConfig.username,
        password: this.currentConfig.password,
        ssl: this.currentConfig.ssl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false,
        max: this.currentConfig.poolMax || 10,
        idleTimeoutMillis: 3e4,
        connectionTimeoutMillis: 5e3
      };
      if (this.pool) {
        this.pool.end().catch(() => {
        });
      }
      this.pool = new import_pg.Pool(poolConfig);
      this.pool.on("error", (err) => {
        console.warn("PostgreSQL Pool background error:", err.message);
        this.currentConfig.connectionStatus = "ERROR";
      });
    } catch (err) {
      console.warn("Failed to initialize PostgreSQL pool:", err.message);
      this.currentConfig.connectionStatus = "ERROR";
    }
  }
  /**
   * Tests connection with current or custom database parameters
   */
  async testConnection(customConfig) {
    const configToTest = {
      ...this.currentConfig,
      ...customConfig
    };
    const startTime = Date.now();
    let tempPool = null;
    try {
      const poolConfig = {
        host: configToTest.host,
        port: configToTest.port,
        database: configToTest.database,
        user: configToTest.username,
        password: configToTest.password,
        ssl: configToTest.ssl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false,
        connectionTimeoutMillis: 6e3
      };
      tempPool = new import_pg.Pool(poolConfig);
      const client = await tempPool.connect();
      try {
        const versionRes = await client.query("SELECT version();");
        const tablesRes = await client.query(`
          SELECT count(*)::int as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);
        const latencyMs = Date.now() - startTime;
        const version = versionRes.rows[0]?.version || "PostgreSQL";
        const tablesCount = tablesRes.rows[0]?.count || 0;
        this.currentConfig.connectionStatus = "CONNECTED";
        this.currentConfig.lastTestedAt = (/* @__PURE__ */ new Date()).toISOString();
        return {
          success: true,
          message: `Conex\xE3o bem-sucedida com PostgreSQL! Lat\xEAncia: ${latencyMs}ms. Tabelas detectadas: ${tablesCount}.`,
          version,
          tablesCount,
          latencyMs
        };
      } finally {
        client.release();
      }
    } catch (err) {
      this.currentConfig.connectionStatus = "ERROR";
      this.currentConfig.lastTestedAt = (/* @__PURE__ */ new Date()).toISOString();
      return {
        success: false,
        message: `Falha na conex\xE3o SQL: ${err.message || "Erro desconhecido"}`
      };
    } finally {
      if (tempPool) {
        tempPool.end().catch(() => {
        });
      }
    }
  }
  /**
   * Reads and executes the schema.sql migration on PostgreSQL
   */
  async runMigration() {
    if (!this.pool) {
      this.initializePool();
    }
    if (!this.pool) {
      return {
        success: false,
        message: "Pool de banco de dados n\xE3o est\xE1 inicializado."
      };
    }
    try {
      const schemaPath = import_path.default.join(process.cwd(), "server", "db", "schema.sql");
      let sql = "";
      if (import_fs.default.existsSync(schemaPath)) {
        sql = import_fs.default.readFileSync(schemaPath, "utf-8");
      } else {
        return {
          success: false,
          message: `Arquivo de schema n\xE3o encontrado em: ${schemaPath}`
        };
      }
      const migrationsDir = import_path.default.join(process.cwd(), "server", "db", "migrations");
      if (import_fs.default.existsSync(migrationsDir)) {
        const files = import_fs.default.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
        for (const file of files) {
          sql += "\n\n" + import_fs.default.readFileSync(import_path.default.join(migrationsDir, file), "utf-8");
        }
      }
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        this.currentConfig.connectionStatus = "CONNECTED";
        return {
          success: true,
          message: "Migra\xE7\xE3o executada com sucesso! Todas as tabelas, \xEDndices e sementes do Elo Log foram criadas ou atualizadas de forma transacional."
        };
      } catch (migrationError) {
        await client.query("ROLLBACK").catch(() => {
        });
        throw migrationError;
      } finally {
        client.release();
      }
    } catch (err) {
      return {
        success: false,
        message: `Erro ao executar migra\xE7\xE3o SQL: ${err.message}`
      };
    }
  }
  /**
   * Returns schema.sql raw content
   */
  getSchemaSql() {
    const schemaPath = import_path.default.join(process.cwd(), "server", "db", "schema.sql");
    if (import_fs.default.existsSync(schemaPath)) {
      return import_fs.default.readFileSync(schemaPath, "utf-8");
    }
    return "-- Schema file not found";
  }
  /**
   * Returns complete database diagnostic status
   */
  async getStatus() {
    const tables = [];
    const recordsCount = {};
    if (this.pool && this.currentConfig.enabled) {
      try {
        const client = await this.pool.connect();
        try {
          const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
          `);
          for (const row of res.rows) {
            const tableName = row.table_name;
            tables.push(tableName);
            try {
              const countRes = await client.query(`SELECT count(*)::int as c FROM ${this.quoteIdentifier(tableName)};`);
              recordsCount[tableName] = countRes.rows[0]?.c || 0;
            } catch {
              recordsCount[tableName] = 0;
            }
          }
          this.currentConfig.connectionStatus = "CONNECTED";
        } finally {
          client.release();
        }
      } catch (err) {
        this.currentConfig.connectionStatus = "ERROR";
      }
    }
    return {
      enabled: this.currentConfig.enabled,
      status: this.currentConfig.connectionStatus || "UNCONFIGURED",
      host: this.currentConfig.host,
      port: this.currentConfig.port,
      database: this.currentConfig.database,
      username: this.currentConfig.username,
      ssl: this.currentConfig.ssl,
      lastTestedAt: this.currentConfig.lastTestedAt,
      tables,
      recordsCount
    };
  }
};
var sqlAdapter = new SqlAdapter();

// server/db.ts
var WHATSAPP_SECRET_ID = "whatsapp-global";
var WHATSAPP_TENANT_SECRET_PREFIX = "whatsapp-tenant:";
var MAPBOX_SECRET_ID = "mapbox-global";
var EMAIL_SECRET_ID = "smtp-global";
var ASAAS_SECRET_ID = "asaas-global";
var ATENDO_CRM_ADMIN_SECRET_ID = "atendo-crm-admin";
var PUBLIC_DEMO_TENANT_ID = "tenant-demo-public";
var PUBLIC_DEMO_PRIMARY_USER_ID = "user-demo-company-admin";
var defaultTenantReportTemplates = [
  {
    type: "EXPENSE",
    title: "Presta\xE7\xE3o de Contas & Despesas de Viagem",
    subtitle: "Relat\xF3rio operacional e financeiro da viagem",
    approvalLabel: "Aprova\xE7\xE3o e Quita\xE7\xE3o de Saldo",
    signatureLabel: "Respons\xE1vel pela empresa",
    notes: "",
    source: "DEFAULT"
  },
  {
    type: "CHECKLIST",
    title: "Laudo de Vistoria e Checklist Digital",
    subtitle: "Registro de retirada e entrega do ve\xEDculo e da carga",
    approvalLabel: "Confer\xEAncia e aprova\xE7\xE3o da empresa",
    signatureLabel: "Respons\xE1vel pela empresa",
    notes: "",
    source: "DEFAULT"
  }
];
var cloneReportTemplate = (template) => ({ ...template });
function getConfigEncryptionKey() {
  let raw = process.env.CONFIG_ENCRYPTION_KEY || "";
  const keyFile = process.env.CONFIG_ENCRYPTION_KEY_FILE || "/run/secrets/elolog_config_encryption_key";
  if (!raw) {
    try {
      raw = (0, import_node_fs.readFileSync)(keyFile, "utf8").trim();
    } catch {
      raw = "";
    }
  }
  if (!raw) return null;
  return /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : (0, import_node_crypto.createHash)("sha256").update(raw, "utf8").digest();
}
function encryptConfigSecret(value) {
  const key = getConfigEncryptionKey();
  if (!key) throw new Error("Chave interna de criptografia n\xE3o configurada.");
  const iv = (0, import_node_crypto.randomBytes)(12);
  const cipher = (0, import_node_crypto.createCipheriv)("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
}
function decryptConfigSecret(ciphertext) {
  try {
    const key = getConfigEncryptionKey();
    if (!key) return null;
    const [ivEncoded, tagEncoded, encryptedEncoded] = ciphertext.split(".");
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) return null;
    const decipher = (0, import_node_crypto.createDecipheriv)("aes-256-gcm", key, Buffer.from(ivEncoded, "base64"));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64")),
      decipher.final()
    ]).toString("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
var DatabaseStore = class {
  constructor() {
    this.tenants = [];
    this.users = [];
    this.drivers = [];
    this.vehicles = [];
    this.freights = [];
    this.tripExpenses = [];
    this.notifications = [];
    this.notificationDeliveries = [];
    this.pushSubscriptions = [];
    this.forms = [];
    this.formResponses = [];
    this.auditLogs = [];
    this.errorLogs = [];
    this.visitAnalytics = [];
    this.driverCompanyLinks = [];
    this.freightInterests = [];
    this.companyVehicles = [];
    this.companyStops = [];
    this.lodgingPartners = [];
    this.clients = [];
    this.budgets = [];
    this.tenantBudgetForms = [];
    this.freightLocations = [];
    this.pages = [];
    this.posts = [];
    this.asaasPayments = [];
    this.asaasSubscriptions = [];
    this.helpPages = [
      { role: "ADMIN", content: "" },
      { role: "SUPERVISOR", content: "" },
      { role: "USER", content: "" },
      { role: "DRIVER", content: "" }
    ];
    this.whatsappConfigs = /* @__PURE__ */ new Map();
    this.tenantNotificationTemplates = /* @__PURE__ */ new Map();
    this.tenantReportTemplates = /* @__PURE__ */ new Map();
    this.globalWhatsAppConfig = {
      baseUrl: process.env.WHATSAPP_API_URL || "",
      token: process.env.WHATSAPP_API_TOKEN || "",
      provider: "WHAZING",
      defaultChannelNumber: "",
      isActive: true,
      connectionStatus: "UNKNOWN",
      autoNotifyChecklist: true,
      autoNotifyFreightStatus: true
    };
    this.atendoCrmAdminConfig = {
      baseUrl: "",
      apiId: "",
      bearerToken: ""
    };
    this.saasGlobalConfig = {
      systemName: "Atendo One",
      supportPhone: "",
      supportEmail: "contato@elolog.com.br",
      defaultCommissionPercent: 12,
      requireChecklistPhotos: true,
      minDriverAge: 18,
      otpExpirationMinutes: 5,
      allowSelfRegistration: true,
      showDemoSwitcher: false,
      plans: [
        { id: "BASICO", name: "Plano B\xE1sico", price: 299, maxFreightsMonthly: 50, maxUsers: 3, maxDrivers: 5, isActive: true },
        { id: "PROFISSIONAL", name: "Plano Profissional", price: 599, maxFreightsMonthly: 150, maxUsers: 10, maxDrivers: 30, isActive: true },
        { id: "EMPRESARIAL", name: "Plano Empresarial", price: 1499, maxFreightsMonthly: 9999, maxUsers: 50, maxDrivers: 200, isActive: true }
      ],
      notificationModule: {
        enabled: true,
        freePlanName: "WhatsApp SaaS \u2014 Gratuito",
        freePlanDescription: "Notifica\xE7\xF5es usando o telefone oficial da plataforma.",
        ownNumberPlanName: "WhatsApp Pr\xF3prio da Empresa",
        ownNumberPlanDescription: "Notifica\xE7\xF5es usando o n\xFAmero e canal WhatsApp da empresa.",
        ownNumberMonthlyPrice: 89.9,
        assistedActivationPrice: 149.9,
        extraNumberMonthlyPrice: 29.9
      },
      backupNotifications: {
        enabled: true,
        whatsappEnabled: false,
        whatsappPhone: "",
        notifyOnFailure: true,
        notifyOnSuccess: false
      },
      layout: {
        primaryColor: "#059669",
        borderRadius: "xl",
        fontFamily: "sans",
        navbarStyle: "dark",
        logoText: "ATENDO ONE",
        systemBackground: "slate"
      },
      formFields: {
        userForm: [
          { id: "name", originalLabel: "Nome Completo", label: "Nome Completo", placeholder: "Digite o nome completo", enabled: true, required: true },
          { id: "email", originalLabel: "E-mail Corporativo", label: "E-mail Corporativo", placeholder: "Digite o e-mail corporativo", enabled: true, required: true },
          { id: "phone", originalLabel: "Telefone / WhatsApp", label: "Telefone / WhatsApp", placeholder: "(99) 99999-9999", enabled: true, required: true },
          { id: "role", originalLabel: "N\xEDvel de Permiss\xE3o", label: "N\xEDvel de Permiss\xE3o", placeholder: "Selecione a permiss\xE3o", enabled: true, required: true }
        ],
        freightForm: [
          { id: "cargoDescription", originalLabel: "Descri\xE7\xE3o da Carga", label: "Descri\xE7\xE3o da Carga", placeholder: "Ex: Carga de milho ensacado", enabled: true, required: true },
          { id: "cargoType", originalLabel: "Tipo de Carga", label: "Tipo de Carga", placeholder: "Selecione o tipo", enabled: true, required: true },
          { id: "weight", originalLabel: "Peso Total (Kg)", label: "Peso Total (Kg)", placeholder: "Ex: 15000", enabled: true, required: true },
          { id: "volumes", originalLabel: "Volumes", label: "Volumes", placeholder: "Ex: 30", enabled: true, required: true },
          { id: "vehicleType", originalLabel: "Tipo de Ve\xEDculo", label: "Tipo de Ve\xEDculo", placeholder: "Selecione o ve\xEDculo", enabled: true, required: true },
          { id: "bodyType", originalLabel: "Carroceria", label: "Carroceria", placeholder: "Selecione a carroceria", enabled: true, required: true },
          { id: "brand", originalLabel: "Marca do Ve\xEDculo", label: "Marca do Ve\xEDculo", placeholder: "Marca recomendada", enabled: true, required: true },
          { id: "value", originalLabel: "Valor do Frete (R$)", label: "Valor do Frete (R$)", placeholder: "0.00", enabled: true, required: true },
          { id: "paymentMethod", originalLabel: "Forma de Pagamento", label: "Forma de Pagamento", placeholder: "Ex: Pix, Transfer\xEAncia", enabled: true, required: true },
          { id: "originCity", originalLabel: "Cidade Origem", label: "Cidade Origem", placeholder: "Cidade de coleta", enabled: true, required: true },
          { id: "originState", originalLabel: "UF Origem", label: "UF Origem", placeholder: "UF", enabled: true, required: true },
          { id: "originAddress", originalLabel: "Endere\xE7o Origem", label: "Endere\xE7o Origem", placeholder: "Rua, Avenida, etc.", enabled: true, required: true },
          { id: "originNumber", originalLabel: "N\xFAmero Origem", label: "N\xFAmero Origem", placeholder: "N\xFAmero", enabled: true, required: true },
          { id: "destCity", originalLabel: "Cidade Destino", label: "Cidade Destino", placeholder: "Cidade de entrega", enabled: true, required: true },
          { id: "destState", originalLabel: "UF Destino", label: "UF Destino", placeholder: "UF", enabled: true, required: true },
          { id: "destAddress", originalLabel: "Endere\xE7o Destino", label: "Endere\xE7o Destino", placeholder: "Rua, Avenida, etc.", enabled: true, required: true },
          { id: "destNumber", originalLabel: "N\xFAmero Destino", label: "N\xFAmero Destino", placeholder: "N\xFAmero", enabled: true, required: true }
        ],
        driverForm: [
          { id: "name", originalLabel: "Nome Completo", label: "Nome Completo", placeholder: "Nome completo do motorista", enabled: true, required: true },
          { id: "email", originalLabel: "E-mail", label: "E-mail", placeholder: "email@provedor.com", enabled: true, required: true },
          { id: "phone", originalLabel: "Telefone / WhatsApp", label: "Telefone / WhatsApp", placeholder: "(99) 99999-9999", enabled: true, required: true },
          { id: "cpf", originalLabel: "CPF", label: "CPF", placeholder: "000.000.000-00", enabled: true, required: true },
          { id: "rg", originalLabel: "RG", label: "RG", placeholder: "RG do motorista", enabled: true, required: true },
          { id: "city", originalLabel: "Cidade", label: "Cidade", placeholder: "Cidade", enabled: true, required: true },
          { id: "state", originalLabel: "Estado (UF)", label: "Estado (UF)", placeholder: "UF", enabled: true, required: true },
          { id: "cnh", originalLabel: "N\xBA CNH", label: "N\xBA CNH", placeholder: "N\xFAmero da habilita\xE7\xE3o", enabled: true, required: true },
          { id: "cnhCategory", originalLabel: "Categoria CNH", label: "Categoria CNH", placeholder: "Selecione a categoria", enabled: true, required: true },
          { id: "vehicleType", originalLabel: "Tipo de Ve\xEDculo", label: "Tipo de Ve\xEDculo", placeholder: "Tipo do caminh\xE3o", enabled: true, required: true },
          { id: "vehicleModel", originalLabel: "Marca / Modelo", label: "Marca / Modelo", placeholder: "Ex: Volvo FH 540", enabled: true, required: true },
          { id: "vehiclePlate", originalLabel: "Placa", label: "Placa", placeholder: "Placa do ve\xEDculo", enabled: true, required: true }
        ],
        expenseForm: [
          { id: "driverName", originalLabel: "Nome do Motorista", label: "Nome do Motorista", placeholder: "Nome...", enabled: true, required: true },
          { id: "clientName", originalLabel: "Cliente", label: "Cliente", placeholder: "Nome do Cliente...", enabled: true, required: true },
          { id: "vehicleModel", originalLabel: "Modelo do Ve\xEDculo", label: "Modelo do Ve\xEDculo", placeholder: "Ex: FH 540", enabled: true, required: true },
          { id: "vehiclePlate", originalLabel: "Placa do Caminh\xE3o / Ve\xEDculo", label: "Placa do Caminh\xE3o / Ve\xEDculo", placeholder: "ABC-1234", enabled: true, required: true },
          { id: "chassis", originalLabel: "Placa / Chassis", label: "Placa / Chassis", placeholder: "N\xBA Chassis", enabled: true, required: true },
          { id: "startDate", originalLabel: "Data de In\xEDcio da Viagem", label: "Data de In\xEDcio da Viagem", placeholder: "", enabled: true, required: true },
          { id: "endDate", originalLabel: "Data de T\xE9rmino da Viagem", label: "Data de T\xE9rmino da Viagem", placeholder: "", enabled: true, required: true },
          { id: "initialKm", originalLabel: "Km Inicial", label: "Km Inicial", placeholder: "0", enabled: true, required: true },
          { id: "finalKm", originalLabel: "Km Final", label: "Km Final", placeholder: "0", enabled: true, required: true },
          { id: "advanceAmount", originalLabel: "Adiantamento Pago pela Empresa (R$)", label: "Adiantamento Pago pela Empresa (R$)", placeholder: "0.00", enabled: true, required: true },
          { id: "driverLaborAmount", originalLabel: "M\xE3o de Obra Motorista (R$)", label: "M\xE3o de Obra Motorista (R$)", placeholder: "0.00", enabled: true, required: true }
        ]
      },
      databaseConfig: {
        enabled: true,
        dbType: "postgres",
        host: process.env.DB_HOST || "postgres",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        database: process.env.DB_NAME || "elolog",
        username: process.env.DB_USER || "elolog_user",
        password: process.env.DB_PASSWORD || "",
        ssl: process.env.DB_SSL === "true",
        autoMigrate: true,
        connectionStatus: "UNCONFIGURED"
      },
      imageCompression: {
        enabled: true,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        format: "image/jpeg",
        autoCompressDocuments: true,
        maxFileSizeKB: 400
      },
      mapboxConfig: {
        enabled: false,
        apiKey: process.env.MAPBOX_API_KEY || "",
        defaultZoom: 12,
        defaultStyle: "streets-v12",
        enableLiveTracking: true,
        updateIntervalSeconds: 30
      },
      emailConfig: {
        host: process.env.SMTP_HOST || "",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        user: process.env.SMTP_USER || "",
        password: process.env.SMTP_PASSWORD || "",
        senderEmail: process.env.SMTP_FROM || "",
        testEmail: "",
        isActive: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
      },
      seo: {
        siteName: "Atendo One",
        title: "Atendo One \u2014 Gest\xE3o e publica\xE7\xE3o de fretes",
        description: "Plataforma de gest\xE3o log\xEDstica para transportadoras, motoristas e opera\xE7\xF5es de fretes.",
        keywords: "gest\xE3o de fretes, transportadora, log\xEDstica, rastreamento",
        canonicalUrl: process.env.APP_URL || "https://gestor.atendo.log.br",
        ogImageUrl: "",
        locale: "pt_BR",
        allowIndexing: true
      },
      notificationTemplates: defaultNotificationTemplates.map((template) => ({ ...template, variables: [...template.variables] })),
      asaasConfig: {
        enabled: false,
        environment: "sandbox",
        apiKey: "",
        webhookToken: "",
        webhookUrl: ""
      }
    };
    // Mutex locks for atomic operations (e.g. freight acceptance)
    this.locks = /* @__PURE__ */ new Map();
    // Storage for auth tokens
    this.authTokens = /* @__PURE__ */ new Map();
    this.refreshTokens = /* @__PURE__ */ new Map();
    this.persistenceQueue = Promise.resolve();
    this.analyticsPersistTimer = null;
    this.legalDocumentVersions = [];
    this.seedInitialData();
    this.ensurePublicDemoData();
    this.ensurePublicTrackingTokens();
    this.ensureSystemContent();
    this.persistenceReady = this.hydrateFromPostgres().then(async () => {
      await this.hydrateSecureAtendoCrmConfig();
      this.ensurePublicTrackingTokens();
      this.ensureSystemContent();
      this.ensurePublicDemoData();
      return this.persistNow();
    });
  }
  async waitForPersistence() {
    await this.persistenceReady;
  }
  ensurePublicTrackingTokens() {
    for (const freight of this.freights) {
      if (!freight.publicTrackingToken) {
        freight.publicTrackingToken = (0, import_node_crypto.randomBytes)(16).toString("hex");
      }
    }
  }
  getTenantReportTemplates(tenantId) {
    const saved = this.tenantReportTemplates.get(tenantId) || [];
    return defaultTenantReportTemplates.map((defaultTemplate) => {
      const override = saved.find((template) => template.type === defaultTemplate.type);
      return {
        ...cloneReportTemplate(defaultTemplate),
        ...override ? cloneReportTemplate(override) : {},
        tenantId,
        source: override ? "TENANT" : "DEFAULT"
      };
    });
  }
  saveTenantReportTemplate(tenantId, input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const current = this.tenantReportTemplates.get(tenantId) || [];
    const saved = {
      ...cloneReportTemplate(input),
      tenantId,
      source: "TENANT",
      updatedAt: now
    };
    const next = current.filter((template) => template.type !== saved.type);
    next.push(saved);
    this.tenantReportTemplates.set(tenantId, next);
    return cloneReportTemplate(saved);
  }
  ensureSystemContent() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const legalVersion = "2026-09-07.1";
    const systemName = this.saasGlobalConfig.systemName || "Gestor";
    const supportEmail = this.saasGlobalConfig.supportEmail || "suporte informado na plataforma";
    const privacyContent = `<h1>Pol\xEDtica de Privacidade</h1><p>Vers\xE3o ${legalVersion}. Esta minuta explica como ${systemName} trata dados pessoais no servi\xE7o de gest\xE3o log\xEDstica, fretes, usu\xE1rios, motoristas, ve\xEDculos, documentos, notifica\xE7\xF5es e cobran\xE7a.</p><h2>1. Quem trata os dados</h2><p>A identifica\xE7\xE3o jur\xEDdica do controlador e o canal atualizado do encarregado devem ser preenchidos pela organiza\xE7\xE3o respons\xE1vel antes da publica\xE7\xE3o definitiva. Em opera\xE7\xF5es criadas por uma empresa cliente, essa empresa tamb\xE9m define as finalidades espec\xEDficas dos dados que insere e das decis\xF5es que toma sobre usu\xE1rios, motoristas e fretes.</p><h2>2. Dados tratados</h2><p>Podem ser tratados nome, e-mail, telefone, documentos cadastrais e de habilita\xE7\xE3o, cidade, estado, empresa, dados de ve\xEDculos, dados de fretes, despesas e documentos enviados, credenciais protegidas, registros de acesso, auditoria, suporte e prefer\xEAncias de comunica\xE7\xE3o. Dados de cart\xE3o n\xE3o s\xE3o armazenados pelo ${systemName}; o fluxo comercial deve usar Checkout ou tokeniza\xE7\xE3o do provedor de pagamentos.</p><h2>3. Finalidades e bases legais</h2><p>Os dados s\xE3o usados para criar e administrar contas, executar o contrato ou medidas pr\xE9-contratuais, operar fretes, validar v\xEDnculos de motoristas, emitir e organizar documentos, prestar suporte, prevenir fraude, manter a seguran\xE7a, cumprir obriga\xE7\xF5es legais e conciliar pagamentos. Comunica\xE7\xF5es operacionais por e-mail podem ser enviadas conforme a configura\xE7\xE3o da conta; notifica\xE7\xF5es operacionais por WhatsApp exigem autoriza\xE7\xE3o expl\xEDcita do destinat\xE1rio e podem ser revogadas a qualquer momento. O fundamento jur\xEDdico aplic\xE1vel deve ser confirmado pelo controlador em cada opera\xE7\xE3o.</p><h2>4. WhatsApp, consentimento e canais</h2><p>A empresa pode escolher o telefone oficial SaaS, sem mensalidade adicional, ou contratar o n\xFAmero pr\xF3prio. A conex\xE3o pr\xF3pria pode usar o Atendo CRM e seus endpoints configurados pela empresa. Tokens de integra\xE7\xE3o permanecem no servidor, cifrados e fora do navegador. O ${systemName} n\xE3o autoriza disparos para pessoas que n\xE3o tenham rela\xE7\xE3o com a opera\xE7\xE3o ou consentimento quando exigido. O titular pode retirar o consentimento em Prefer\xEAncias de notifica\xE7\xF5es; a retirada n\xE3o invalida tratamentos necess\xE1rios \xE0 seguran\xE7a, \xE0 autentica\xE7\xE3o ou ao cumprimento de obriga\xE7\xE3o legal.</p><h2>5. Pagamentos e Asaas</h2><p>Para assinaturas, o ${systemName} pode compartilhar com o Asaas os dados necess\xE1rios para criar o cliente e a cobran\xE7a, como identifica\xE7\xE3o empresarial, e-mail, telefone v\xE1lido e informa\xE7\xF5es do plano. O sistema mant\xE9m apenas refer\xEAncias, valores, vencimentos e estados de assinatura/pagamento necess\xE1rios \xE0 concilia\xE7\xE3o. N\xFAmero de cart\xE3o, validade e CVV n\xE3o devem ser enviados ao backend do ${systemName} nem registrados em logs, banco ou analytics.</p><h2>6. Vitrine p\xFAblica e motoristas</h2><p>Quando a empresa optar por publicar um frete, a vitrine mostra somente um resumo da oportunidade. N\xE3o s\xE3o expostos valor, endere\xE7os exatos, contatos, clientes, notas internas ou documentos fiscais. O motorista deve concluir o cadastro e a empresa respons\xE1vel analisa o interesse. O perfil de motorista pode ser global, mas cada v\xEDnculo empresarial \xE9 independente: a aprova\xE7\xE3o de uma empresa n\xE3o substitui a valida\xE7\xE3o de outra. O compartilhamento deve limitar-se ao necess\xE1rio para an\xE1lise e opera\xE7\xE3o.</p><h2>7. Analytics e visitas</h2><p>As p\xE1ginas p\xFAblicas podem registrar estat\xEDsticas agregadas para melhorar conte\xFAdo, navega\xE7\xE3o e campanhas. Podem ser tratados rota, data, origem geral, dom\xEDnio referenciador, par\xE2metros de campanha, tipo de dispositivo e, quando fornecido pelo proxy, pa\xEDs. O mecanismo n\xE3o registra o endere\xE7o IP completo, formul\xE1rios, senhas, c\xF3digos ou fingerprint individual; os registros t\xE9cnicos de visitas s\xE3o mantidos por no m\xE1ximo 366 dias e t\xEAm acesso restrito.</p><h2>8. Compartilhamento e operadores</h2><p>Dados podem ser acessados por provedores necess\xE1rios \xE0 hospedagem, banco, envio de e-mail, WhatsApp, pagamentos, seguran\xE7a e suporte, sempre conforme a finalidade e os contratos aplic\xE1veis. Compartilhamentos adicionais devem ser informados pela empresa respons\xE1vel. Transfer\xEAncias internacionais, quando ocorrerem, devem observar as salvaguardas exigidas pela legisla\xE7\xE3o.</p><h2>9. Seguran\xE7a, reten\xE7\xE3o e incidentes</h2><p>S\xE3o aplicados segrega\xE7\xE3o por empresa, controle de acesso, autentica\xE7\xE3o, cofre cifrado para segredos, n\xE3o persist\xEAncia de QR e tokens no estado operacional, auditoria, headers de seguran\xE7a, rate limiting e backups. Nenhuma medida elimina todo risco. Os dados s\xE3o mantidos pelo tempo necess\xE1rio \xE0s finalidades, \xE0 defesa de direitos e \xE0s obriga\xE7\xF5es legais; depois podem ser eliminados ou anonimizados quando permitido.</p><h2>10. Direitos do titular</h2><p>O titular pode solicitar confirma\xE7\xE3o, acesso, corre\xE7\xE3o, informa\xE7\xE3o sobre compartilhamento, anonimiza\xE7\xE3o, bloqueio, elimina\xE7\xE3o quando aplic\xE1vel, portabilidade, revis\xE3o de decis\xF5es automatizadas e revoga\xE7\xE3o de consentimento. Para exercer direitos, use ${supportEmail}, informando o m\xEDnimo necess\xE1rio para localizar a solicita\xE7\xE3o. O controlador avaliar\xE1 a identidade, a base legal, os prazos e as exce\xE7\xF5es aplic\xE1veis.</p><h2>11. Atualiza\xE7\xF5es</h2><p>Esta pol\xEDtica pode ser atualizada para refletir mudan\xE7as do servi\xE7o, da legisla\xE7\xE3o ou dos provedores. A vers\xE3o aceita no cadastro \xE9 registrada com data e vers\xE3o. Esta \xE9 uma minuta operacional e precisa de revis\xE3o jur\xEDdica, identifica\xE7\xE3o do controlador, defini\xE7\xE3o do encarregado, bases legais espec\xEDficas e valida\xE7\xE3o fiscal antes de uso definitivo.</p>`;
    const termsContent = `<h1>Termos de Uso</h1><p>Vers\xE3o ${legalVersion}. Estes Termos regulam o uso do ${systemName} por empresas, administradores, usu\xE1rios, motoristas e visitantes.</p><h2>1. Aceite e conta</h2><p>O cadastro exige leitura e aceite destes Termos e da Pol\xEDtica de Privacidade. O usu\xE1rio deve fornecer informa\xE7\xF5es verdadeiras, manter o cadastro atualizado, proteger credenciais e utilizar a conta somente em nome pr\xF3prio ou com autoriza\xE7\xE3o. A empresa responde pelos usu\xE1rios, motoristas, ve\xEDculos, fretes, documentos e decis\xF5es que administra.</p><h2>2. Uso permitido</h2><p>O servi\xE7o deve ser usado para gest\xE3o log\xEDstica leg\xEDtima, comunica\xE7\xE3o operacional autorizada e organiza\xE7\xE3o de fretes. \xC9 proibido inserir dados falsos, violar direitos de terceiros, tentar acessar outra empresa, compartilhar credenciais, explorar vulnerabilidades, contornar limites, enviar spam, praticar fraude ou usar o servi\xE7o para finalidade il\xEDcita.</p><h2>3. Motoristas, ve\xEDculos e vitrine p\xFAblica</h2><p>A empresa pode publicar ou retirar fretes da vitrine p\xFAblica. A vitrine n\xE3o deve conter valor, endere\xE7o exato, contato, cliente, nota interna ou documento fiscal. O motorista interessado poder\xE1 fazer cadastro r\xE1pido, validar o telefone e concluir seus dados; a empresa publicadora decide se aprova o v\xEDnculo. Um motorista pode se relacionar com v\xE1rias empresas, e cada empresa deve fazer sua pr\xF3pria valida\xE7\xE3o, sem bloqueio ou aprova\xE7\xE3o autom\xE1tica entre empresas.</p><h2>4. WhatsApp e mensagens</h2><p>O uso do telefone SaaS ou do n\xFAmero pr\xF3prio depende de configura\xE7\xE3o leg\xEDtima da empresa e das regras do m\xF3dulo contratado. O n\xFAmero pr\xF3prio s\xF3 \xE9 liberado ap\xF3s confirma\xE7\xE3o do pagamento aplic\xE1vel. Mensagens devem ser pertinentes \xE0 opera\xE7\xE3o, respeitar consentimento, opt-out, hor\xE1rios e legisla\xE7\xE3o. A empresa \xE9 respons\xE1vel pelo conte\xFAdo, pelos destinat\xE1rios e pela autoriza\xE7\xE3o do canal conectado ao Atendo CRM. C\xF3digos de autentica\xE7\xE3o e avisos de seguran\xE7a t\xEAm natureza transacional e podem ser necess\xE1rios para proteger a conta.</p><h2>5. Planos, Asaas e cobran\xE7as</h2><p>Os planos, limites e pre\xE7os apresentados no cadastro ou painel SaaS podem variar conforme a configura\xE7\xE3o comercial vigente. A contrata\xE7\xE3o recorrente, a troca de plano e o cancelamento s\xE3o processados pelo Asaas quando habilitado. O pagamento \xE9 considerado confirmado somente ap\xF3s concilia\xE7\xE3o do evento de pagamento. O n\xFAmero pr\xF3prio depende de pagamento ativo; o cancelamento do m\xF3dulo retorna a empresa ao telefone SaaS quando essa op\xE7\xE3o estiver dispon\xEDvel. O ${systemName} n\xE3o recebe nem armazena n\xFAmero de cart\xE3o, validade ou CVV no fluxo direto; pagamentos com cart\xE3o devem usar Checkout ou tokeniza\xE7\xE3o segura do provedor.</p><h2>6. Conte\xFAdo, documentos e responsabilidade</h2><p>O usu\xE1rio mant\xE9m a responsabilidade pelo conte\xFAdo inserido, pela origem dos documentos, pela exatid\xE3o das informa\xE7\xF5es e pelas autoriza\xE7\xF5es de compartilhamento. O ${systemName} fornece ferramentas e n\xE3o substitui aconselhamento jur\xEDdico, fiscal, cont\xE1bil, regulat\xF3rio, de transporte ou de seguran\xE7a. Recursos de emiss\xE3o ou organiza\xE7\xE3o de documentos devem ser conferidos pela empresa antes de uso oficial.</p><h2>7. Disponibilidade e seguran\xE7a</h2><p>S\xE3o aplicadas medidas de seguran\xE7a, backups, controle de acesso, auditoria e manuten\xE7\xE3o. Podem ocorrer indisponibilidades por manuten\xE7\xE3o, falhas de provedor, internet ou eventos fora do controle razo\xE1vel. Tentativas de abuso ou risco \xE0 plataforma podem resultar em limita\xE7\xE3o, suspens\xE3o ou encerramento, preservados registros necess\xE1rios \xE0 seguran\xE7a e \xE0 defesa de direitos.</p><h2>8. Propriedade e dados</h2><p>O ${systemName} e seus componentes permanecem protegidos pelos direitos aplic\xE1veis. O usu\xE1rio conserva os direitos sobre seus dados e concede somente as permiss\xF5es necess\xE1rias \xE0 execu\xE7\xE3o do servi\xE7o. A exporta\xE7\xE3o, exclus\xE3o e reten\xE7\xE3o dependem das funcionalidades dispon\xEDveis, das obriga\xE7\xF5es legais e dos direitos de terceiros.</p><h2>9. Altera\xE7\xF5es e suporte</h2><p>Termos e pre\xE7os podem ser atualizados. Mudan\xE7as relevantes ser\xE3o comunicadas pelos canais dispon\xEDveis e, quando necess\xE1rio, exigir\xE3o novo aceite. Solicita\xE7\xF5es de suporte e privacidade devem ser encaminhadas ao canal informado na plataforma. Estes Termos s\xE3o uma minuta operacional e precisam de revis\xE3o jur\xEDdica antes da cobran\xE7a real ou da publica\xE7\xE3o definitiva.</p>`;
    const legalPages = [
      {
        id: "page-legal-privacy",
        tenantId: null,
        slug: "politica-de-privacidade",
        title: "Pol\xEDtica de Privacidade",
        excerpt: "Como o Atendo One coleta, utiliza, armazena e protege dados pessoais.",
        metaTitle: "Pol\xEDtica de Privacidade | Atendo One",
        metaDescription: "Conhe\xE7a as pr\xE1ticas de privacidade e prote\xE7\xE3o de dados do Atendo One.",
        content: privacyContent,
        isPublished: true,
        isIndexable: true,
        isSystemLocked: true,
        contentVersion: legalVersion,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "page-legal-terms",
        tenantId: null,
        slug: "termos-de-uso",
        title: "Termos de Uso",
        excerpt: "Regras de utiliza\xE7\xE3o da plataforma Atendo One e responsabilidades dos usu\xE1rios.",
        metaTitle: "Termos de Uso | Atendo One",
        metaDescription: "Leia as regras de uso da plataforma Atendo One para transportadoras, motoristas e usu\xE1rios.",
        content: termsContent,
        isPublished: true,
        isIndexable: true,
        isSystemLocked: true,
        contentVersion: legalVersion,
        createdAt: now,
        updatedAt: now
      }
    ];
    for (const legalPage of legalPages) {
      const existing = this.pages.find((page) => page.slug === legalPage.slug && page.tenantId === null);
      if (!existing) this.pages.push(legalPage);
      else {
        existing.isSystemLocked = true;
        if (!existing.contentVersion) existing.contentVersion = legalVersion;
        if (existing.isIndexable === void 0) existing.isIndexable = true;
        if (existing.metaTitle === void 0) existing.metaTitle = legalPage.metaTitle;
        if (existing.metaDescription === void 0) existing.metaDescription = legalPage.metaDescription;
        if (existing.excerpt === void 0) existing.excerpt = legalPage.excerpt;
      }
    }
    this.ensurePublicSeoContent();
    this.ensureAnalyticsTermsDisclosure();
    this.ensureAnalyticsPrivacyDisclosure();
    this.ensureDriverDataDisclosure();
    this.ensureLegalCompleteness();
    this.ensureDriverCompanyLinks();
  }
  ensureLegalCompleteness() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const privacy = this.pages.find((item) => item.tenantId === null && item.slug === "politica-de-privacidade");
    const terms = this.pages.find((item) => item.tenantId === null && item.slug === "termos-de-uso");
    if (privacy && !privacy.content.includes("Controlador, operador e encarregado")) {
      privacy.content += `<h2>Controlador, operador e encarregado</h2><p>Na contrata\xE7\xE3o SaaS, a empresa cliente \xE9 respons\xE1vel pelas finalidades e decis\xF5es relativas aos dados que insere na plataforma, atuando o Atendo One como operador na execu\xE7\xE3o das instru\xE7\xF5es leg\xEDtimas do servi\xE7o. Para dados administrados diretamente pelo Atendo One, o controlador \xE9 a organiza\xE7\xE3o respons\xE1vel pela plataforma, identificada no cadastro e no canal de privacidade informado. O canal para solicita\xE7\xF5es de privacidade \xE9 ${this.saasGlobalConfig.supportEmail || "o e-mail de suporte informado na plataforma"}; a identifica\xE7\xE3o nominal e o contato do encarregado devem ser mantidos atualizados pelo respons\xE1vel antes da publica\xE7\xE3o comercial.</p><h2>Cookies e tecnologias semelhantes</h2><p>O servi\xE7o pode usar armazenamento local, cookies estritamente necess\xE1rios, sess\xE3o, seguran\xE7a, prefer\xEAncias e fila offline. Analytics n\xE3o essencial deve respeitar a configura\xE7\xE3o de privacidade aplic\xE1vel e n\xE3o deve ser usado para criar perfil individual sem base legal adequada.</p><h2>Incidentes e reclama\xE7\xF5es</h2><p>Incidentes relevantes ser\xE3o tratados conforme o plano de resposta e comunicados aos afetados e \xE0 autoridade competente quando houver obriga\xE7\xE3o legal. O titular pode procurar o canal de privacidade e, quando aplic\xE1vel, a Autoridade Nacional de Prote\xE7\xE3o de Dados (ANPD).</p><h2>Crian\xE7as e adolescentes</h2><p>O servi\xE7o n\xE3o \xE9 destinado a crian\xE7as. Cadastros de adolescentes somente devem ocorrer quando juridicamente permitidos e com as autoriza\xE7\xF5es exigidas para a finalidade espec\xEDfica.</p>`;
      privacy.contentVersion = "2026-09-07.1";
      privacy.updatedAt = now;
    }
    if (terms && !terms.content.includes("Suspens\xE3o, encerramento e portabilidade")) {
      terms.content += "<h2>Suspens\xE3o, encerramento e portabilidade</h2><p>A conta pode ser suspensa para prote\xE7\xE3o da plataforma, cumprimento legal, inadimpl\xEAncia ou viola\xE7\xE3o destes Termos, com preserva\xE7\xE3o dos registros necess\xE1rios. Quando a funcionalidade estiver dispon\xEDvel, a empresa poder\xE1 exportar seus dados em formato estruturado antes do encerramento, observadas obriga\xE7\xF5es legais, dados de terceiros e prazos de reten\xE7\xE3o.</p><h2>Foro e legisla\xE7\xE3o aplic\xE1vel</h2><p>Estes Termos devem indicar a legisla\xE7\xE3o aplic\xE1vel e o foro eleito pela entidade contratante no instrumento comercial ou cadastro jur\xEDdico vigente. Na aus\xEAncia de disposi\xE7\xE3o espec\xEDfica v\xE1lida, aplicam-se as normas brasileiras pertinentes \xE0 rela\xE7\xE3o contratual e \xE0 prote\xE7\xE3o de dados.</p>";
      terms.contentVersion = "2026-09-07.1";
      terms.updatedAt = now;
    }
  }
  ensurePublicSeoContent() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const page of publicSeoPages(now)) {
      const existing = this.pages.find((item) => item.id === page.id || item.slug === page.slug && item.tenantId === null);
      if (!existing) this.pages.push(page);
      else {
        if (existing.isIndexable === void 0) existing.isIndexable = page.isIndexable;
        if (existing.metaTitle === void 0) existing.metaTitle = page.metaTitle;
        if (existing.metaDescription === void 0) existing.metaDescription = page.metaDescription;
      }
    }
    for (const post of publicSeoPosts(now)) {
      const existing = this.posts.find((item) => item.id === post.id || item.slug === post.slug && item.tenantId === null);
      if (!existing) this.posts.push(post);
      else {
        if (existing.isIndexable === void 0) existing.isIndexable = post.isIndexable;
        if (existing.metaTitle === void 0) existing.metaTitle = post.metaTitle;
        if (existing.metaDescription === void 0) existing.metaDescription = post.metaDescription;
      }
    }
    for (const page of publicCommercialPages(now)) {
      const existing = this.pages.find((item) => item.id === page.id || item.slug === page.slug && item.tenantId === null);
      if (!existing) this.pages.push(page);
      else {
        if (existing.isIndexable === void 0) existing.isIndexable = page.isIndexable;
        if (existing.metaTitle === void 0) existing.metaTitle = page.metaTitle;
        if (existing.metaDescription === void 0) existing.metaDescription = page.metaDescription;
        if (existing.publicPath === void 0) existing.publicPath = page.publicPath;
      }
    }
  }
  ensureAnalyticsTermsDisclosure() {
    const terms = this.pages.find((item) => item.tenantId === null && item.slug === "termos-de-uso");
    if (!terms || terms.content.includes("Finalidade da medi\xE7\xE3o de visitas")) return;
    terms.content += "<h2>Finalidade da medi\xE7\xE3o de visitas</h2><p>O Elo Log poder\xE1 medir de forma agregada e proporcional as visitas \xE0s p\xE1ginas p\xFAblicas para entender quais conte\xFAdos e canais despertam interesse. Saber de onde v\xEAm as visitas ajuda a melhorar os conte\xFAdos, corrigir problemas de navega\xE7\xE3o, avaliar campanhas e aprimorar as informa\xE7\xF5es oferecidas a transportadoras e motoristas. A medi\xE7\xE3o n\xE3o registra formul\xE1rios, n\xE3o armazena o endere\xE7o IP completo, n\xE3o cria fingerprint individual e n\xE3o vende dados pessoais. Par\xE2metros de campanha e referenciadores podem ser agrupados para fins estat\xEDsticos, observando as configura\xE7\xF5es de privacidade aplic\xE1veis.</p>";
    terms.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  ensureAnalyticsPrivacyDisclosure() {
    const privacy = this.pages.find((item) => item.tenantId === null && item.slug === "politica-de-privacidade");
    if (!privacy || privacy.content.includes("Dados de acesso e analytics")) return;
    privacy.content += "<h2>Dados de acesso e analytics</h2><p>Para melhorar o conte\xFAdo, a navega\xE7\xE3o e as campanhas, o Elo Log poder\xE1 registrar estat\xEDsticas agregadas de acesso \xE0s p\xE1ginas p\xFAblicas. Essas estat\xEDsticas podem incluir a rota acessada, a data, a origem geral, o referenciador apenas pelo dom\xEDnio, par\xE2metros de campanha, tipo de dispositivo e, quando fornecido pelo proxy, o pa\xEDs. O endere\xE7o IP completo, formul\xE1rios, senhas, c\xF3digos e fingerprint individual n\xE3o s\xE3o registrados por este mecanismo. Os registros t\xE9cnicos s\xE3o mantidos por no m\xE1ximo 366 dias, com acesso restrito ao Super Admin, e n\xE3o s\xE3o vendidos a terceiros.</p>";
    privacy.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  ensureDriverDataDisclosure() {
    const terms = this.pages.find((item) => item.tenantId === null && item.slug === "termos-de-uso");
    if (terms && !terms.content.includes("Vitrine p\xFAblica e v\xEDnculos de motoristas")) {
      terms.content += "<h2>Vitrine p\xFAblica e v\xEDnculos de motoristas</h2><p>Empresas podem optar por publicar fretes de mercadorias na vitrine p\xFAblica. A vitrine exibe somente informa\xE7\xF5es resumidas da oportunidade, sem valor, endere\xE7os exatos, contatos, clientes, notas internas ou documentos fiscais. Para demonstrar interesse e consultar eventual valor liberado, o motorista conclui cadastro e valida\xE7\xE3o do telefone, e a empresa respons\xE1vel analisa a solicita\xE7\xE3o.</p><p>O cadastro de motorista \xE9 global, mas cada v\xEDnculo com uma empresa \xE9 independente. A aprova\xE7\xE3o, recusa ou bloqueio feitos por uma empresa n\xE3o aprovam, recusam ou bloqueiam automaticamente o motorista em outras empresas. Cada empresa \xE9 respons\xE1vel pela confer\xEAncia dos dados b\xE1sicos compartilhados e pela decis\xE3o de aceitar o v\xEDnculo para sua opera\xE7\xE3o.</p>";
      terms.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    const privacy = this.pages.find((item) => item.tenantId === null && item.slug === "politica-de-privacidade");
    if (privacy && !privacy.content.includes("Compartilhamento b\xE1sico com empresas")) {
      privacy.content += "<h2>Compartilhamento b\xE1sico com empresas</h2><p>Quando o motorista demonstra interesse em um frete ou solicita v\xEDnculo empresarial, dados b\xE1sicos necess\xE1rios \xE0 an\xE1lise podem ser apresentados \xE0 empresa respons\xE1vel, como nome, telefone, e-mail, cidade, documentos de habilita\xE7\xE3o e dados do ve\xEDculo informados no cadastro. O compartilhamento \xE9 limitado \xE0 finalidade de avaliar a solicita\xE7\xE3o e operar o frete. A empresa que recebe os dados assume a responsabilidade pela valida\xE7\xE3o espec\xEDfica de sua opera\xE7\xE3o; uma valida\xE7\xE3o anterior n\xE3o substitui essa responsabilidade.</p><p>Dados de pre\xE7o permanecem protegidos e s\xF3 s\xE3o retornados em \xE1rea autenticada quando a regra do frete permitir. Registros hist\xF3ricos de v\xEDnculos, ve\xEDculos pr\xF3prios e decis\xF5es administrativas s\xE3o preservados para rastreabilidade, inclusive quando um v\xEDnculo \xE9 desativado.</p>";
      privacy.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
  ensureDriverCompanyLinks() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const driver of this.drivers) {
      if (!driver.tenantId) continue;
      const exists = this.driverCompanyLinks.some((link) => link.driverId === driver.id && link.tenantId === driver.tenantId);
      if (exists) continue;
      this.driverCompanyLinks.push({
        id: `driver-link-${driver.id}-${driver.tenantId}`,
        driverId: driver.id,
        tenantId: driver.tenantId,
        status: driver.status === "INATIVO" ? "BLOQUEADO" : driver.status === "PENDENTE" ? "PENDENTE" : "APROVADO",
        scope: "EMPRESA",
        source: "IMPORTACAO",
        createdAt: driver.createdAt || now,
        updatedAt: now
      });
    }
  }
  getDriverCompanyLink(driverId, tenantId, freightId) {
    return this.driverCompanyLinks.find((link) => link.driverId === driverId && link.tenantId === tenantId && (freightId ? link.freightId === freightId : link.scope === "EMPRESA"));
  }
  hasDriverCompanyAccess(driverId, tenantId, includePending = false, freightId) {
    return this.driverCompanyLinks.some((link) => link.driverId === driverId && link.tenantId === tenantId && (link.scope === "EMPRESA" || freightId && link.freightId === freightId) && (link.status === "APROVADO" || includePending && link.status === "PENDENTE"));
  }
  upsertDriverCompanyLink(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = this.driverCompanyLinks.find((link) => link.driverId === input.driverId && link.tenantId === input.tenantId && link.scope === input.scope && link.freightId === input.freightId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: now });
      return existing;
    }
    const created = { ...input, id: `driver-link-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`, createdAt: now, updatedAt: now };
    this.driverCompanyLinks.unshift(created);
    return created;
  }
  getCompanyDriverLinks(tenantId) {
    return this.driverCompanyLinks.filter((link) => !tenantId || link.tenantId === tenantId);
  }
  serializeState() {
    const redactWhatsApp = (config) => config ? { ...config, token: "" } : config;
    const safeWhatsAppConfigs = Object.fromEntries(
      Array.from(this.whatsappConfigs.entries()).map(([tenantId, config]) => [tenantId, redactWhatsApp(config)])
    );
    const safeTenantNotificationTemplates = Object.fromEntries(
      Array.from(this.tenantNotificationTemplates.entries()).map(([tenantId, templates]) => [
        tenantId,
        templates.map((template) => ({ ...template, channels: { ...template.channels }, variables: [...template.variables] }))
      ])
    );
    const safeTenantReportTemplates = Object.fromEntries(
      Array.from(this.tenantReportTemplates.entries()).map(([tenantId, templates]) => [
        tenantId,
        templates.map((template) => ({ ...template }))
      ])
    );
    const safeDatabaseConfig = this.saasGlobalConfig.databaseConfig ? { ...this.saasGlobalConfig.databaseConfig, password: "" } : this.saasGlobalConfig.databaseConfig;
    const safeEmailConfig = this.saasGlobalConfig.emailConfig ? { ...this.saasGlobalConfig.emailConfig, password: "" } : this.saasGlobalConfig.emailConfig;
    const safeMapboxConfig = this.saasGlobalConfig.mapboxConfig ? { ...this.saasGlobalConfig.mapboxConfig, apiKey: "" } : this.saasGlobalConfig.mapboxConfig;
    const safeSaasConfig = {
      ...this.saasGlobalConfig,
      databaseConfig: safeDatabaseConfig,
      emailConfig: safeEmailConfig,
      mapboxConfig: safeMapboxConfig,
      asaasConfig: this.saasGlobalConfig.asaasConfig ? { ...this.saasGlobalConfig.asaasConfig, apiKey: "", webhookToken: "" } : this.saasGlobalConfig.asaasConfig
    };
    return {
      tenants: this.tenants,
      users: this.users,
      drivers: this.drivers,
      vehicles: this.vehicles,
      freights: this.freights,
      tripExpenses: this.tripExpenses,
      notifications: this.notifications,
      notificationDeliveries: this.notificationDeliveries,
      pushSubscriptions: this.pushSubscriptions,
      forms: this.forms,
      formResponses: this.formResponses,
      auditLogs: this.auditLogs,
      errorLogs: this.errorLogs,
      visitAnalytics: this.visitAnalytics,
      driverCompanyLinks: this.driverCompanyLinks,
      freightInterests: this.freightInterests,
      companyVehicles: this.companyVehicles,
      companyStops: this.companyStops,
      lodgingPartners: this.lodgingPartners,
      clients: this.clients,
      budgets: this.budgets,
      tenantBudgetForms: this.tenantBudgetForms,
      pages: this.pages,
      posts: this.posts,
      asaasPayments: this.asaasPayments,
      asaasSubscriptions: this.asaasSubscriptions,
      helpPages: this.helpPages,
      legalDocumentVersions: this.legalDocumentVersions,
      whatsappConfigs: safeWhatsAppConfigs,
      tenantNotificationTemplates: safeTenantNotificationTemplates,
      tenantReportTemplates: safeTenantReportTemplates,
      globalWhatsAppConfig: redactWhatsApp(this.globalWhatsAppConfig),
      saasGlobalConfig: safeSaasConfig
    };
  }
  async hydrateFromPostgres() {
    if (!sqlAdapter.isEnabled()) return;
    try {
      const result = await sqlAdapter.query("SELECT state FROM app_state WHERE id = $1", ["default"]);
      const state = result.rows[0]?.state;
      if (!state) {
        await this.hydrateSecureWhatsAppConfig();
        await this.hydrateSecureMapboxConfig();
        await this.hydrateSecureEmailConfig();
        await this.hydrateSecureAsaasConfig();
        this.ensureSystemContent();
        return;
      }
      for (const key of ["tenants", "users", "drivers", "vehicles", "freights", "freightLocations", "tripExpenses", "notifications", "notificationDeliveries", "pushSubscriptions", "forms", "formResponses", "auditLogs", "errorLogs", "visitAnalytics", "driverCompanyLinks", "freightInterests", "companyVehicles", "companyStops", "lodgingPartners", "clients", "budgets", "tenantBudgetForms", "pages", "posts", "asaasPayments", "asaasSubscriptions", "helpPages", "legalDocumentVersions"]) {
        if (Array.isArray(state[key])) this[key] = state[key];
      }
      if (state.whatsappConfigs && typeof state.whatsappConfigs === "object") {
        this.whatsappConfigs = new Map(Object.entries(state.whatsappConfigs).map(([tenantId, config]) => [
          tenantId,
          { ...config, token: "" }
        ]));
      }
      if (state.tenantNotificationTemplates && typeof state.tenantNotificationTemplates === "object") {
        this.tenantNotificationTemplates = new Map(Object.entries(state.tenantNotificationTemplates).map(([tenantId, templates]) => [
          tenantId,
          Array.isArray(templates) ? templates.filter((template) => template && typeof template.eventKey === "string").map((template) => ({
            ...template,
            channels: { ...template.channels || {} },
            variables: Array.isArray(template.variables) ? [...template.variables] : []
          })) : []
        ]));
      }
      if (state.tenantReportTemplates && typeof state.tenantReportTemplates === "object") {
        this.tenantReportTemplates = new Map(Object.entries(state.tenantReportTemplates).map(([tenantId, templates]) => [
          tenantId,
          Array.isArray(templates) ? templates.filter((template) => template && (template.type === "EXPENSE" || template.type === "CHECKLIST")).map((template) => ({
            tenantId,
            type: template.type,
            title: String(template.title || ""),
            subtitle: String(template.subtitle || ""),
            approvalLabel: String(template.approvalLabel || ""),
            signatureLabel: String(template.signatureLabel || ""),
            notes: String(template.notes || ""),
            updatedAt: template.updatedAt,
            source: "TENANT"
          })) : []
        ]));
      }
      if (state.globalWhatsAppConfig) {
        const persistedWhatsApp = state.globalWhatsAppConfig;
        const runtimeWhatsApp = this.globalWhatsAppConfig;
        this.globalWhatsAppConfig = {
          ...runtimeWhatsApp,
          ...persistedWhatsApp,
          baseUrl: persistedWhatsApp.baseUrl || runtimeWhatsApp.baseUrl || process.env.WHATSAPP_API_URL || "",
          token: runtimeWhatsApp.token || process.env.WHATSAPP_API_TOKEN || ""
        };
      }
      await this.hydrateSecureWhatsAppConfig();
      await this.hydrateSecureMapboxConfig();
      if (state.saasGlobalConfig) {
        const persisted = state.saasGlobalConfig;
        const runtime = this.saasGlobalConfig;
        const persistedTemplates = Array.isArray(persisted.notificationTemplates) ? persisted.notificationTemplates : [];
        const persistedTemplateKeys = new Set(persistedTemplates.map((template) => template.eventKey));
        const mergedNotificationTemplates = [
          ...persistedTemplates,
          ...(runtime.notificationTemplates || []).filter((template) => !persistedTemplateKeys.has(template.eventKey))
        ];
        this.saasGlobalConfig = {
          ...runtime,
          ...persisted,
          notificationTemplates: mergedNotificationTemplates,
          databaseConfig: persisted.databaseConfig ? { ...runtime.databaseConfig, ...persisted.databaseConfig, password: runtime.databaseConfig?.password || "" } : runtime.databaseConfig,
          emailConfig: persisted.emailConfig ? { ...runtime.emailConfig, ...persisted.emailConfig, password: runtime.emailConfig?.password || "" } : runtime.emailConfig,
          mapboxConfig: persisted.mapboxConfig ? { ...runtime.mapboxConfig, ...persisted.mapboxConfig, apiKey: runtime.mapboxConfig?.apiKey || "" } : runtime.mapboxConfig,
          asaasConfig: persisted.asaasConfig ? { ...runtime.asaasConfig, ...persisted.asaasConfig, apiKey: runtime.asaasConfig?.apiKey || "", webhookToken: runtime.asaasConfig?.webhookToken || "" } : runtime.asaasConfig
        };
        const layout = this.saasGlobalConfig.layout || {};
        const legacyBranding = {
          logoText: ["ELO LOG", "ATENDO ONE"],
          homeBadgeText: ["Solu\xE7\xE3o Completa Multi-Tenant de Carga", "Gest\xE3o completa para sua opera\xE7\xE3o de transporte"],
          homeSubtitle: ["O Elo Log conecta transportadoras e motoristas com total isolamento e seguran\xE7a. Publique fretes, controle frotas, execute checklists eletr\xF4nicos e audite sua opera\xE7\xE3o log\xEDstica em uma plataforma \xE1gil e offline-ready.", "O Atendo One conecta transportadoras, equipes e motoristas com seguran\xE7a. Publique fretes, controle sua frota, execute checklists eletr\xF4nicos e acompanhe toda a opera\xE7\xE3o em um s\xF3 lugar."],
          footerText: ["Elo Log \u2022 Gest\xE3o Log\xEDstica Integrada \xA9 2026", "Atendo One \u2022 Gest\xE3o Log\xEDstica Integrada \xA9 2026"]
        };
        let brandingChanged = false;
        for (const [key, [legacy, current]] of Object.entries(legacyBranding)) {
          if (layout[key] === legacy) {
            layout[key] = current;
            brandingChanged = true;
          }
        }
        if (brandingChanged) {
          this.saasGlobalConfig.layout = layout;
          await this.persistNow();
        }
      }
      await this.hydrateSecureEmailConfig();
      await this.hydrateSecureAsaasConfig();
      this.ensureSystemContent();
      if (process.env.DISABLE_RETENTION_CLEANUP !== "true") await this.pruneOperationalData();
    } catch (error) {
      if (!String(error?.message || "").includes('relation "app_state" does not exist')) {
        console.warn("PostgreSQL state hydration skipped:", error?.message || error);
      }
    }
  }
  async hydrateSecureWhatsAppConfig() {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig = this.globalWhatsAppConfig;
    let secret = null;
    try {
      const result = await sqlAdapter.query(
        "SELECT ciphertext FROM app_secrets WHERE id = $1",
        [WHATSAPP_SECRET_ID]
      );
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error) {
      if (String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`
          CREATE TABLE IF NOT EXISTS app_secrets (
            id TEXT PRIMARY KEY,
            ciphertext TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        console.warn("Secure WhatsApp configuration hydration skipped:", error?.message || error);
        return;
      }
    }
    if (secret?.baseUrl && secret?.token) {
      this.globalWhatsAppConfig = {
        ...this.globalWhatsAppConfig,
        baseUrl: String(secret.baseUrl),
        token: String(secret.token),
        provider: "WHAZING"
      };
    } else if (runtimeConfig.baseUrl && runtimeConfig.token) {
      await this.persistWhatsAppSecret(runtimeConfig.baseUrl, runtimeConfig.token);
    }
    try {
      const tenantSecrets = await sqlAdapter.query(
        "SELECT id, ciphertext FROM app_secrets WHERE id LIKE $1",
        [`${WHATSAPP_TENANT_SECRET_PREFIX}%`]
      );
      for (const row of tenantSecrets.rows) {
        const tenantId = row.id.slice(WHATSAPP_TENANT_SECRET_PREFIX.length);
        const tenantSecret = row.ciphertext ? decryptConfigSecret(row.ciphertext) : null;
        if (!tenantId || !tenantSecret?.baseUrl || !tenantSecret?.token) continue;
        const persistedConfig = this.whatsappConfigs.get(tenantId);
        this.whatsappConfigs.set(tenantId, {
          ...this.globalWhatsAppConfig,
          ...persistedConfig || {},
          ...tenantSecret,
          provider: "WHAZING",
          baseUrl: String(tenantSecret.baseUrl),
          token: String(tenantSecret.token)
        });
      }
    } catch (error) {
      if (!String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        console.warn("Secure tenant WhatsApp configuration hydration skipped:", error?.message || error);
      }
    }
  }
  async hydrateSecureMapboxConfig() {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig = this.saasGlobalConfig.mapboxConfig || {};
    try {
      const result = await sqlAdapter.query("SELECT ciphertext FROM app_secrets WHERE id = $1", [MAPBOX_SECRET_ID]);
      const secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
      if (secret?.apiKey) {
        this.saasGlobalConfig.mapboxConfig = { ...runtimeConfig, ...secret, apiKey: String(secret.apiKey) };
      } else if (runtimeConfig.apiKey || process.env.MAPBOX_ACCESS_TOKEN) {
        await this.persistMapboxSecret(String(runtimeConfig.apiKey || process.env.MAPBOX_ACCESS_TOKEN));
      }
    } catch (error) {
      if (String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      } else {
        console.warn("Secure Mapbox configuration hydration skipped:", error?.message || error);
      }
    }
  }
  async persistMapboxSecret(apiKey) {
    const normalized = String(apiKey || "").trim();
    if (!normalized || normalized === "********") throw new Error("Token Mapbox inv\xE1lido ou vazio.");
    if (!sqlAdapter.isEnabled()) throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o com seguran\xE7a.");
    const ciphertext = encryptConfigSecret({ apiKey: normalized });
    await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [MAPBOX_SECRET_ID, ciphertext]
    );
  }
  async hydrateSecureAtendoCrmConfig() {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    try {
      const result = await sqlAdapter.query("SELECT ciphertext FROM app_secrets WHERE id = $1", [ATENDO_CRM_ADMIN_SECRET_ID]);
      const secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
      if (secret?.apiId && secret?.bearerToken) {
        this.atendoCrmAdminConfig = {
          baseUrl: String(secret.baseUrl || ""),
          apiId: String(secret.apiId),
          bearerToken: String(secret.bearerToken)
        };
      }
    } catch (error) {
      if (!String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        console.warn("Secure Atendo CRM configuration hydration skipped:", error?.message || error);
      }
    }
  }
  async persistAtendoCrmAdminSecret(config) {
    if (!config.apiId || !config.bearerToken) {
      throw new Error("API ID e token administrativo do Atendo CRM s\xE3o obrigat\xF3rios.");
    }
    if (!sqlAdapter.isEnabled()) {
      throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o com seguran\xE7a.");
    }
    const ciphertext = encryptConfigSecret({
      baseUrl: String(config.baseUrl || "").trim().replace(/\/+$/, ""),
      apiId: String(config.apiId).trim(),
      bearerToken: String(config.bearerToken).trim()
    });
    await sqlAdapter.query(`
      CREATE TABLE IF NOT EXISTS app_secrets (
        id TEXT PRIMARY KEY,
        ciphertext TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [ATENDO_CRM_ADMIN_SECRET_ID, ciphertext]
    );
    this.atendoCrmAdminConfig = {
      baseUrl: String(config.baseUrl || "").trim().replace(/\/+$/, ""),
      apiId: String(config.apiId).trim(),
      bearerToken: String(config.bearerToken).trim()
    };
  }
  getAtendoCrmAdminSecretMetadata() {
    return {
      configured: Boolean(this.atendoCrmAdminConfig.apiId && this.atendoCrmAdminConfig.bearerToken),
      baseUrlConfigured: Boolean(this.atendoCrmAdminConfig.baseUrl),
      apiIdConfigured: Boolean(this.atendoCrmAdminConfig.apiId),
      tokenConfigured: Boolean(this.atendoCrmAdminConfig.bearerToken)
    };
  }
  async hydrateSecureAsaasConfig() {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig = this.saasGlobalConfig.asaasConfig || {};
    let secret = null;
    try {
      const result = await sqlAdapter.query("SELECT ciphertext FROM app_secrets WHERE id = $1", [ASAAS_SECRET_ID]);
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error) {
      if (String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      } else {
        console.warn("Secure Asaas configuration hydration skipped:", error?.message || error);
        return;
      }
    }
    if (secret?.apiKey || secret?.webhookToken) {
      this.saasGlobalConfig.asaasConfig = {
        ...runtimeConfig,
        ...secret,
        apiKey: String(secret.apiKey || ""),
        webhookToken: String(secret.webhookToken || "")
      };
      return;
    }
    if (runtimeConfig.apiKey || runtimeConfig.webhookToken) await this.persistAsaasSecret(runtimeConfig);
  }
  async persistAsaasSecret(config) {
    if (!sqlAdapter.isEnabled()) throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o Asaas com seguran\xE7a.");
    const ciphertext = encryptConfigSecret({
      enabled: config.enabled !== false,
      environment: config.environment || "sandbox",
      apiKey: config.apiKey || "",
      webhookToken: config.webhookToken || "",
      webhookUrl: config.webhookUrl || ""
    });
    await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [ASAAS_SECRET_ID, ciphertext]
    );
  }
  async hydrateSecureEmailConfig() {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig = this.saasGlobalConfig.emailConfig || {};
    let secret = null;
    try {
      const result = await sqlAdapter.query(
        "SELECT ciphertext FROM app_secrets WHERE id = $1",
        [EMAIL_SECRET_ID]
      );
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error) {
      if (String(error?.message || "").includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`
          CREATE TABLE IF NOT EXISTS app_secrets (
            id TEXT PRIMARY KEY,
            ciphertext TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        console.warn("Secure SMTP configuration hydration skipped:", error?.message || error);
        return;
      }
    }
    if (secret?.host && secret?.user && secret?.password) {
      this.saasGlobalConfig.emailConfig = {
        ...runtimeConfig,
        host: String(secret.host),
        port: Number(secret.port || 587),
        user: String(secret.user),
        password: String(secret.password),
        senderEmail: String(secret.senderEmail || ""),
        testEmail: String(secret.testEmail || ""),
        isActive: secret.isActive !== false
      };
      return;
    }
    if (runtimeConfig.host && runtimeConfig.user && runtimeConfig.password) {
      await this.persistEmailSecret(runtimeConfig);
    }
  }
  async persistEmailSecret(config) {
    if (!sqlAdapter.isEnabled()) {
      throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o SMTP com seguran\xE7a.");
    }
    const ciphertext = encryptConfigSecret({
      host: config.host,
      port: Number(config.port || 587),
      user: config.user,
      password: config.password,
      senderEmail: config.senderEmail || "",
      testEmail: config.testEmail || "",
      isActive: config.isActive !== false
    });
    await sqlAdapter.query(`
      CREATE TABLE IF NOT EXISTS app_secrets (
        id TEXT PRIMARY KEY,
        ciphertext TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [EMAIL_SECRET_ID, ciphertext]
    );
  }
  async persistWhatsAppSecret(baseUrl, token) {
    if (!sqlAdapter.isEnabled()) {
      throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o com seguran\xE7a.");
    }
    const ciphertext = encryptConfigSecret({ baseUrl, token });
    await sqlAdapter.query(`
      CREATE TABLE IF NOT EXISTS app_secrets (
        id TEXT PRIMARY KEY,
        ciphertext TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [WHATSAPP_SECRET_ID, ciphertext]
    );
  }
  async persistWhatsAppSecretForTenant(tenantId, baseUrl, token) {
    if (!tenantId || !baseUrl || !token) {
      throw new Error("Empresa, URL e token s\xE3o necess\xE1rios para salvar a configura\xE7\xE3o WhatsApp.");
    }
    if (!sqlAdapter.isEnabled()) {
      throw new Error("A persist\xEAncia PostgreSQL precisa estar habilitada para salvar a configura\xE7\xE3o com seguran\xE7a.");
    }
    const ciphertext = encryptConfigSecret({ baseUrl, token });
    await sqlAdapter.query(`
      CREATE TABLE IF NOT EXISTS app_secrets (
        id TEXT PRIMARY KEY,
        ciphertext TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [`${WHATSAPP_TENANT_SECRET_PREFIX}${tenantId}`, ciphertext]
    );
  }
  async pruneOperationalData() {
    const now = Date.now();
    const cutoff = (env, fallbackDays) => now - Math.max(1, Number(process.env[env] || fallbackDays)) * 864e5;
    const auditCutoff = cutoff("AUDIT_RETENTION_DAYS", 365);
    const notificationCutoff = cutoff("NOTIFICATION_RETENTION_DAYS", 90);
    const gpsCutoff = cutoff("GPS_RETENTION_DAYS", 30);
    const beforeAudit = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter((item) => Date.parse(item.createdAt || "") >= auditCutoff);
    const beforeNotifications = this.notifications.length;
    this.notifications = this.notifications.filter((item) => Date.parse(item.createdAt || "") >= notificationCutoff);
    const beforeGps = this.freightLocations.length;
    this.freightLocations = this.freightLocations.filter((item) => Date.parse(item.recordedAt || "") >= gpsCutoff);
    const result = { auditRemoved: beforeAudit - this.auditLogs.length, notificationsRemoved: beforeNotifications - this.notifications.length, gpsRemoved: beforeGps - this.freightLocations.length };
    if (result.auditRemoved || result.notificationsRemoved || result.gpsRemoved) await this.persistNow();
    return result;
  }
  async persistNow() {
    if (!sqlAdapter.isEnabled()) return;
    this.persistenceQueue = this.persistenceQueue.then(async () => {
      try {
        await sqlAdapter.query(
          `INSERT INTO app_state (id, state, updated_at) VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = CURRENT_TIMESTAMP`,
          ["default", JSON.stringify(this.serializeState())]
        );
      } catch (error) {
        if (!String(error?.message || "").includes('relation "app_state" does not exist')) {
          console.warn("PostgreSQL state persistence failed:", error?.message || error);
        }
      }
    }).catch(() => {
    });
    await this.persistenceQueue;
  }
  // Mutex wrapper to guarantee single atomic transaction for a given key
  async withLock(key, operation) {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    let release = () => {
    };
    const promise = new Promise((resolve) => {
      release = resolve;
    });
    this.locks.set(key, promise);
    try {
      return await operation();
    } finally {
      this.locks.delete(key);
      release();
    }
  }
  // Helper to log audit trail
  addAuditLog(entry) {
    const log = {
      ...entry,
      id: `audit-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }
  async recordLegalConsent(input) {
    if (!sqlAdapter.isEnabled()) return;
    const createSql = `CREATE TABLE IF NOT EXISTS user_legal_consents (
      id BIGSERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE SET NULL,
      terms_version VARCHAR(64) NOT NULL,
      privacy_version VARCHAR(64) NOT NULL,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ip_address INET,
      user_agent TEXT
    )`;
    try {
      await sqlAdapter.query(
        `INSERT INTO user_legal_consents (user_id, tenant_id, terms_version, privacy_version, accepted_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::inet, $7)`,
        [input.userId, input.tenantId || null, input.termsVersion, input.privacyVersion, input.acceptedAt || (/* @__PURE__ */ new Date()).toISOString(), input.ipAddress || "", input.userAgent || ""]
      );
    } catch (error) {
      if (String(error?.message || "").includes('relation "user_legal_consents" does not exist')) {
        await sqlAdapter.query(createSql);
        await sqlAdapter.query(
          `INSERT INTO user_legal_consents (user_id, tenant_id, terms_version, privacy_version, accepted_at, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::inet, $7)`,
          [input.userId, input.tenantId || null, input.termsVersion, input.privacyVersion, input.acceptedAt || (/* @__PURE__ */ new Date()).toISOString(), input.ipAddress || "", input.userAgent || ""]
        );
      } else {
        throw error;
      }
    }
  }
  recordVisit(input) {
    const keyMatches = (row) => row.date === input.date && row.path === input.path && row.source === input.source && row.medium === input.medium && row.campaign === input.campaign && row.referrer === input.referrer && row.device === input.device && row.country === input.country;
    const existing = this.visitAnalytics.find(keyMatches);
    if (existing) existing.visits += 1;
    else this.visitAnalytics.unshift({ ...input, visits: 1 });
    const cutoff = new Date(Date.now() - 366 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
    this.visitAnalytics = this.visitAnalytics.filter((row) => row.date >= cutoff).slice(0, 5e4);
    if (!this.analyticsPersistTimer) {
      this.analyticsPersistTimer = setTimeout(() => {
        this.analyticsPersistTimer = null;
        void this.persistNow();
      }, 5e3);
    }
  }
  getVisitAnalytics(days = 30) {
    const allowedDays = [7, 30, 90, 180, 365];
    const safeDays = allowedDays.includes(days) ? days : 30;
    const cutoff = new Date(Date.now() - (safeDays - 1) * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
    const rows = this.visitAnalytics.filter((row) => row.date >= cutoff);
    const aggregate = (field) => {
      const totals = /* @__PURE__ */ new Map();
      rows.forEach((row) => {
        const label = String(row[field] || "N\xE3o informado");
        totals.set(label, (totals.get(label) || 0) + row.visits);
      });
      return Array.from(totals.entries()).map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits || a.label.localeCompare(b.label));
    };
    const daily = aggregate("date");
    return {
      days: safeDays,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalVisits: rows.reduce((sum, row) => sum + row.visits, 0),
      bySource: aggregate("source"),
      byPath: aggregate("path"),
      byCampaign: aggregate("campaign").filter((row) => row.label !== "N\xE3o informado"),
      byReferrer: aggregate("referrer").filter((row) => row.label !== "N\xE3o informado"),
      byDevice: aggregate("device"),
      byCountry: aggregate("country").filter((row) => row.label !== "N\xE3o informado"),
      daily
    };
  }
  addErrorLog(entry) {
    const cleanMessage = String(entry.message || "Erro interno").replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]").replace(/(token|password|secret|authorization|otp|code)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]").replace(/\b\d{6}\b/g, "[OTP_REDACTED]").slice(0, 1e3);
    const log = {
      ...entry,
      id: `error-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`,
      correlationId: entry.correlationId || `corr-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`,
      message: cleanMessage,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      service: entry.service || "elolog-app"
    };
    this.errorLogs.unshift(log);
    if (this.errorLogs.length > 1e3) this.errorLogs.length = 1e3;
    return log;
  }
  // Helper to dispatch in-app notifications
  addNotification(entry) {
    const notif = {
      ...entry,
      id: `notif-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.notifications.unshift(notif);
    return notif;
  }
  async persistNotificationDeliverySql(delivery) {
    if (!sqlAdapter.isEnabled()) return;
    try {
      await sqlAdapter.query(
        `INSERT INTO notification_deliveries (id, event_type, tenant_id, user_id, channel, recipient, subject, status, provider_message_id, error_message, attempts, sent_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, provider_message_id = EXCLUDED.provider_message_id, error_message = EXCLUDED.error_message, attempts = EXCLUDED.attempts, sent_at = EXCLUDED.sent_at, updated_at = CURRENT_TIMESTAMP`,
        [delivery.id, delivery.eventKey, delivery.tenantId, delivery.userId, delivery.channel, delivery.subject || null, delivery.status, delivery.providerMessageId || null, delivery.errorMessage || null, delivery.attempts, delivery.sentAt || null]
      );
    } catch (error) {
      if (!String(error?.message || "").includes('relation "notification_deliveries" does not exist')) {
        console.warn("Notification delivery SQL persistence failed:", error?.message || error);
      }
    }
  }
  addNotificationDelivery(entry) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const delivery = {
      ...entry,
      id: `delivery-${Date.now()}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now
    };
    this.notificationDeliveries.unshift(delivery);
    if (this.notificationDeliveries.length > 5e3) this.notificationDeliveries.length = 5e3;
    void this.persistNotificationDeliverySql(delivery);
    return delivery;
  }
  updateNotificationDelivery(id, patch) {
    const delivery = this.notificationDeliveries.find((item) => item.id === id);
    if (!delivery) return void 0;
    Object.assign(delivery, patch, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    void this.persistNotificationDeliverySql(delivery);
    return delivery;
  }
  // Auth token persistence methods
  saveAuthToken(token, userId, expiresAt) {
    this.authTokens.set(token, { userId, expiresAt });
  }
  revokeAuthToken(token) {
    this.authTokens.delete(token);
  }
  saveRefreshToken(tokenId, userId, familyId, expiresAt) {
    this.refreshTokens.set(tokenId, { userId, familyId, expiresAt });
  }
  consumeRefreshToken(tokenId) {
    const token = this.refreshTokens.get(tokenId);
    if (!token || token.expiresAt <= /* @__PURE__ */ new Date()) {
      this.refreshTokens.delete(tokenId);
      return null;
    }
    this.refreshTokens.delete(tokenId);
    return { userId: token.userId, familyId: token.familyId };
  }
  revokeRefreshFamily(familyId) {
    for (const [tokenId, token] of this.refreshTokens) if (token.familyId === familyId) this.refreshTokens.delete(tokenId);
  }
  getUserIdFromToken(token) {
    const tokenData = this.authTokens.get(token);
    if (!tokenData) return null;
    if (tokenData.expiresAt < /* @__PURE__ */ new Date()) {
      this.authTokens.delete(token);
      return null;
    }
    return tokenData.userId;
  }
  seedInitialData() {
    const now = /* @__PURE__ */ new Date();
    const isoNow = now.toISOString();
    const tenant1 = {
      id: "tenant-translog-01",
      name: "TransLog Brasil Transportes",
      legalName: "TransLog Brasil Log\xEDstica e Cargas Ltda",
      cnpj: "12.345.678/0001-90",
      email: "operacional@translogbrasil.com.br",
      phone: "(17) 3214-5500",
      zipCode: "15015-000",
      address: "Av. Alberto Andal\xF3",
      number: "3100",
      neighborhood: "Centro",
      city: "S\xE3o Jos\xE9 do Rio Preto",
      state: "SP",
      status: "ATIVA",
      plan: "EMPRESARIAL",
      allowedOperations: ["CARGA_GERAL", "LOGISTICA_VEICULOS"],
      planLimits: {
        maxUsers: 50,
        maxDrivers: 200,
        maxFreightsMonthly: 1e3,
        customForms: true,
        exportReports: true,
        prioritySupport: true
      },
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: isoNow
    };
    const tenant2 = {
      id: "tenant-expresso-02",
      name: "Expresso Rodovi\xE1rio Paulista",
      legalName: "Expresso Rodovi\xE1rio Paulista S.A.",
      cnpj: "98.765.432/0001-10",
      email: "contato@expressorps.com.br",
      phone: "(19) 3512-8899",
      zipCode: "13080-000",
      address: "Rodovia Anhanguera",
      number: "Km 104",
      neighborhood: "Distrito Industrial",
      city: "Campinas",
      state: "SP",
      status: "ATIVA",
      plan: "PROFISSIONAL",
      allowedOperations: ["CARGA_GERAL"],
      planLimits: {
        maxUsers: 15,
        maxDrivers: 50,
        maxFreightsMonthly: 250,
        customForms: true,
        exportReports: true,
        prioritySupport: false
      },
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: isoNow
    };
    this.tenants = [tenant1, tenant2];
    this.users = [
      {
        id: "user-superadmin",
        tenantId: null,
        name: "Administrador Geral da Plataforma",
        email: "superadmin@portaldefretes.com.br",
        phone: "(11) 99999-0001",
        role: "SUPER_ADMIN",
        status: "ATIVO",
        accountType: "REAL",
        readOnly: false,
        lastLoginAt: isoNow,
        createdAt: "2026-01-01T08:00:00.000Z"
      },
      {
        id: "user-admin-atendo",
        tenantId: null,
        name: "Administrador Atendo Log",
        email: "admin@atendo.log.br",
        phone: "5517988395429",
        role: "SUPER_ADMIN",
        status: "ATIVO",
        accountType: "REAL",
        readOnly: false,
        lastLoginAt: isoNow,
        createdAt: "2026-01-01T08:00:00.000Z"
      },
      {
        id: "user-empresa-superadmin-1",
        tenantId: "tenant-translog-01",
        name: "Carlos Alberto Ferreira (Diretor)",
        email: "carlos.ferreira@translogbrasil.com.br",
        phone: "(17) 99781-1122",
        role: "EMPRESA_SUPER_ADMIN",
        status: "ATIVO",
        lastLoginAt: isoNow,
        createdAt: "2026-01-10T10:10:00.000Z"
      },
      {
        id: "user-admin-1",
        tenantId: "tenant-translog-01",
        name: "Mariana Silveira (Gerente de Fretes)",
        email: "mariana.fretes@translogbrasil.com.br",
        phone: "(17) 99782-3344",
        role: "ADMIN",
        status: "ATIVO",
        lastLoginAt: isoNow,
        createdAt: "2026-01-12T14:00:00.000Z"
      },
      {
        id: "user-supervisor-1",
        tenantId: "tenant-translog-01",
        name: "Roberto Dias (Supervisor de P\xE1tio)",
        email: "roberto.dias@translogbrasil.com.br",
        phone: "(17) 99783-5566",
        role: "SUPERVISOR",
        status: "ATIVO",
        lastLoginAt: isoNow,
        createdAt: "2026-01-15T09:00:00.000Z"
      },
      {
        id: "user-op-1",
        tenantId: "tenant-translog-01",
        name: "Juliana Castro (Operadora de Cargas)",
        email: "juliana.castro@translogbrasil.com.br",
        phone: "(17) 99784-7788",
        role: "USUARIO",
        status: "ATIVO",
        lastLoginAt: isoNow,
        createdAt: "2026-01-20T11:00:00.000Z"
      },
      {
        id: "user-driver-joao",
        tenantId: "tenant-translog-01",
        name: "Jo\xE3o da Silva",
        email: "joao.silva.motorista@gmail.com",
        phone: "(17) 98112-9090",
        role: "MOTORISTA",
        status: "ATIVO",
        driverId: "driver-joao-01",
        lastLoginAt: isoNow,
        createdAt: "2026-01-15T15:30:00.000Z"
      },
      {
        id: "user-driver-carlos",
        tenantId: "tenant-translog-01",
        name: "Carlos Eduardo Mendes",
        email: "carlos.mendes.cargas@gmail.com",
        phone: "(17) 99654-3210",
        role: "MOTORISTA",
        status: "ATIVO",
        driverId: "driver-carlos-02",
        lastLoginAt: isoNow,
        createdAt: "2026-01-18T10:00:00.000Z"
      },
      {
        id: "user-driver-marcos",
        tenantId: "tenant-translog-01",
        name: "Marcos Ant\xF4nio Rocha",
        email: "marcos.rocha.truck@gmail.com",
        phone: "(19) 98765-4321",
        role: "MOTORISTA",
        status: "ATIVO",
        driverId: "driver-marcos-03",
        lastLoginAt: isoNow,
        createdAt: "2026-02-05T09:30:00.000Z"
      },
      {
        id: "user-driver-test-17",
        tenantId: "tenant-translog-01",
        name: "Motorista Teste WhatsApp",
        email: "motorista.17991163961@elolog.com.br",
        phone: "(17) 99116-3961",
        role: "MOTORISTA",
        status: "ATIVO",
        driverId: "driver-test-17",
        lastLoginAt: isoNow,
        createdAt: "2026-02-20T10:00:00.000Z"
      }
    ];
    this.drivers = [
      {
        id: "driver-test-17",
        userId: "user-driver-test-17",
        tenantId: "tenant-translog-01",
        name: "Motorista Teste WhatsApp",
        cpf: "456.789.012-33",
        rg: "55.443.221-X SSP/SP",
        birthDate: "1990-05-12",
        phone: "(17) 99116-3961",
        email: "motorista.17991163961@elolog.com.br",
        zipCode: "15010-000",
        address: "Rua Teste WhatsApp, 100",
        city: "S\xE3o Jos\xE9 do Rio Preto",
        state: "SP",
        cnh: "09876543210",
        cnhCategory: "E",
        cnhExpiresAt: "2030-01-01",
        status: "DISPONIVEL",
        rating: 5,
        completedTrips: 15,
        rntrc: "99887766",
        notes: "Motorista de teste criado especificamente para valida\xE7\xE3o do login via WhatsApp (17) 99116-3961.",
        createdAt: "2026-02-20T10:00:00.000Z"
      },
      {
        id: "driver-joao-01",
        userId: "user-driver-joao",
        tenantId: "tenant-translog-01",
        name: "Jo\xE3o da Silva",
        cpf: "123.456.789-00",
        rg: "25.678.901-X SSP/SP",
        birthDate: "1984-06-14",
        phone: "(17) 98112-9090",
        email: "joao.silva.motorista@gmail.com",
        zipCode: "15050-000",
        address: "Rua das Palmeiras, 450",
        city: "S\xE3o Jos\xE9 do Rio Preto",
        state: "SP",
        cnh: "04598712340",
        cnhCategory: "E",
        cnhExpiresAt: "2028-09-15",
        status: "DISPONIVEL",
        rating: 4.9,
        completedTrips: 42,
        rntrc: "12345678",
        notes: "Motorista com mais de 10 anos de experi\xEAncia em rotas interestaduais SP/PR/MG.",
        createdAt: "2026-01-15T15:30:00.000Z"
      },
      {
        id: "driver-carlos-02",
        userId: "user-driver-carlos",
        tenantId: "tenant-translog-01",
        name: "Carlos Eduardo Mendes",
        cpf: "234.567.890-11",
        rg: "32.114.556-7 SSP/SP",
        birthDate: "1989-11-22",
        phone: "(17) 99654-3210",
        email: "carlos.mendes.cargas@gmail.com",
        zipCode: "15043-000",
        address: "Av. Fortunato Ernesto Vetorasso, 1120",
        city: "S\xE3o Jos\xE9 do Rio Preto",
        state: "SP",
        cnh: "05874123690",
        cnhCategory: "D",
        cnhExpiresAt: "2027-11-20",
        status: "DISPONIVEL",
        rating: 4.8,
        completedTrips: 28,
        rntrc: "87654321",
        notes: "Especialista em cargas secas e distribui\xE7\xE3o urbana/intermunicipal.",
        createdAt: "2026-01-18T10:00:00.000Z"
      },
      {
        id: "driver-marcos-03",
        userId: "user-driver-marcos",
        tenantId: "tenant-translog-01",
        name: "Marcos Ant\xF4nio Rocha",
        cpf: "345.678.901-22",
        rg: "41.987.234-5 SSP/SP",
        birthDate: "1979-03-08",
        phone: "(19) 98765-4321",
        email: "marcos.rocha.truck@gmail.com",
        zipCode: "13090-000",
        address: "Av. Jos\xE9 de Souza Campos, 890",
        city: "Campinas",
        state: "SP",
        cnh: "03214569870",
        cnhCategory: "E",
        cnhExpiresAt: "2029-01-10",
        status: "DISPONIVEL",
        rating: 5,
        completedTrips: 65,
        rntrc: "45678912",
        notes: "Disponibilidade para fretes longos em todo territ\xF3rio nacional.",
        createdAt: "2026-02-05T09:30:00.000Z"
      }
    ];
    this.vehicles = [
      {
        id: "vehicle-truck-01",
        driverId: "driver-joao-01",
        tenantId: "tenant-translog-01",
        type: "TRUCK",
        brand: "Mercedes-Benz",
        model: "Atego 2426",
        year: 2022,
        plate: "BRA2E19",
        renavam: "00987654321",
        capacityKg: 14e3,
        capacityVolumeM3: 45,
        bodyType: "BAU",
        status: "ATIVO",
        trackerInstalled: true,
        createdAt: "2026-01-15T15:40:00.000Z"
      },
      {
        id: "vehicle-toco-02",
        driverId: "driver-carlos-02",
        tenantId: "tenant-translog-01",
        type: "TOCO",
        brand: "Volkswagen",
        model: "Delivery 11.180",
        year: 2023,
        plate: "RPO4C55",
        renavam: "00123456789",
        capacityKg: 7500,
        capacityVolumeM3: 32,
        bodyType: "SIDER",
        status: "ATIVO",
        trackerInstalled: true,
        createdAt: "2026-01-18T10:15:00.000Z"
      },
      {
        id: "vehicle-carreta-03",
        driverId: "driver-marcos-03",
        tenantId: "tenant-translog-01",
        type: "CARRETA",
        brand: "Scania",
        model: "R450 6x2",
        year: 2021,
        plate: "FXS8G90",
        renavam: "00456789123",
        capacityKg: 28e3,
        capacityVolumeM3: 95,
        bodyType: "GRADE_BAIXA",
        status: "ATIVO",
        trackerInstalled: true,
        createdAt: "2026-02-05T09:45:00.000Z"
      }
    ];
    this.freights = [
      {
        id: "freight-0001",
        code: "FRT-2026-0001",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        origin: {
          zipCode: "15015-000",
          address: "Av. Alberto Andal\xF3",
          number: "3100",
          neighborhood: "Centro",
          city: "S\xE3o Jos\xE9 do Rio Preto",
          state: "SP",
          date: "2026-08-25",
          timeWindow: "08:00 \xE0s 11:00",
          contactName: "Almoxarifado Central TransLog",
          contactPhone: "(17) 3214-5500"
        },
        destination: {
          zipCode: "01001-000",
          address: "Pra\xE7a da S\xE9 / CD Mooca",
          number: "850",
          neighborhood: "Mooca",
          city: "S\xE3o Paulo",
          state: "SP",
          date: "2026-08-26",
          timeWindow: "14:00 \xE0s 18:00",
          contactName: "Recep\xE7\xE3o CD Capital",
          contactPhone: "(11) 3344-9000"
        },
        distanceKm: 440,
        cargo: {
          description: "Carga geral paletizada - Pe\xE7as industriais e componentes automotivos",
          type: "GERAL",
          weightKg: 8500,
          volumeCount: 16,
          dimensions: "16 pallets padr\xE3o PBR (1,00 x 1,20m)",
          requiresInsurance: true,
          notes: "Carga com nota fiscal e manifesto eletr\xF4nico j\xE1 emitidos. Necess\xE1rio lonamento ou ba\xFA fechado."
        },
        requirements: {
          vehicleType: "TRUCK",
          bodyTypeRequired: "BAU",
          minCapacityKg: 8e3,
          helperRequired: false,
          trackerRequired: true,
          cnhMinCategory: "C"
        },
        payment: {
          price: 1850,
          paymentMethod: "PIX",
          tollIncluded: true,
          advancePercentage: 70,
          notes: "70% de adiantamento na confirma\xE7\xE3o do carregamento e 30% no comprovante de entrega assinado via app."
        },
        status: "DISPONIVEL",
        statusHistory: [
          {
            status: "RASCUNHO",
            timestamp: "2026-08-22T14:00:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira",
            notes: "Cria\xE7\xE3o do pedido de frete inicial"
          },
          {
            status: "PUBLICADO",
            timestamp: "2026-08-22T14:30:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira",
            notes: "Aprovado pelo operacional"
          },
          {
            status: "DISPONIVEL",
            timestamp: "2026-08-22T15:00:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira",
            notes: "Liberado para aceite de motoristas com ve\xEDculo Truck"
          }
        ],
        createdByUserId: "user-admin-1",
        createdByName: "Mariana Silveira",
        createdAt: "2026-08-22T14:00:00.000Z",
        updatedAt: "2026-08-22T15:00:00.000Z"
      },
      {
        id: "freight-0002",
        code: "FRT-2026-0002",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        origin: {
          zipCode: "13080-000",
          address: "Rodovia Dom Pedro I",
          number: "Km 132",
          neighborhood: "Bar\xE3o Geraldo",
          city: "Campinas",
          state: "SP",
          date: "2026-08-25",
          timeWindow: "07:00 \xE0s 10:00",
          contactName: "Centro de Distribui\xE7\xE3o Sul",
          contactPhone: "(19) 3871-1200"
        },
        destination: {
          zipCode: "80010-000",
          address: "Av. das Ind\xFAstrias",
          number: "1420",
          neighborhood: "CIC",
          city: "Curitiba",
          state: "PR",
          date: "2026-08-27",
          timeWindow: "08:00 \xE0s 12:00",
          contactName: "Log\xEDstica Paran\xE1",
          contactPhone: "(41) 3232-4400"
        },
        distanceKm: 420,
        cargo: {
          description: "Eletroeletr\xF4nicos e insumos de inform\xE1tica lacrados",
          type: "GERAL",
          weightKg: 6200,
          volumeCount: 22,
          dimensions: "22 caixas paletizadas",
          requiresInsurance: true,
          notes: "Carga de alto valor agregado com monitoramento obrigat\xF3rio."
        },
        requirements: {
          vehicleType: "TOCO",
          bodyTypeRequired: "SIDER",
          minCapacityKg: 6e3,
          trackerRequired: true,
          cnhMinCategory: "D"
        },
        payment: {
          price: 3200,
          paymentMethod: "TRANSFERENCIA",
          tollIncluded: true,
          advancePercentage: 50,
          notes: "Pagamento 50% sa\xEDda + 50% ap\xF3s canhoto digital."
        },
        status: "DISPONIVEL",
        statusHistory: [
          {
            status: "DISPONIVEL",
            timestamp: "2026-08-22T16:00:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira",
            notes: "Frete disponibilizado para tocos e trucks"
          }
        ],
        createdByUserId: "user-admin-1",
        createdByName: "Mariana Silveira",
        createdAt: "2026-08-22T16:00:00.000Z",
        updatedAt: "2026-08-22T16:00:00.000Z"
      },
      {
        id: "freight-0003",
        code: "FRT-2026-0003",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        origin: {
          zipCode: "14055-000",
          address: "Av. Bandeirantes",
          number: "2500",
          neighborhood: "Vila Tib\xE9rio",
          city: "Ribeir\xE3o Preto",
          state: "SP",
          date: "2026-08-26",
          timeWindow: "09:00 \xE0s 13:00"
        },
        destination: {
          zipCode: "30110-000",
          address: "Anel Rodovi\xE1rio",
          number: "Km 12",
          neighborhood: "Olhos D\u2019\xC1gua",
          city: "Belo Horizonte",
          state: "MG",
          date: "2026-08-28",
          timeWindow: "08:00 \xE0s 16:00"
        },
        distanceKm: 510,
        cargo: {
          description: "Bebidas embaladas em garrafas e latas",
          type: "ALIMENTOS",
          weightKg: 24e3,
          volumeCount: 30,
          requiresInsurance: true
        },
        requirements: {
          vehicleType: "CARRETA",
          bodyTypeRequired: "GRADE_BAIXA",
          minCapacityKg: 22e3,
          cnhMinCategory: "E"
        },
        payment: {
          price: 4950,
          paymentMethod: "PIX",
          tollIncluded: true,
          advancePercentage: 70
        },
        status: "DISPONIVEL",
        statusHistory: [
          {
            status: "DISPONIVEL",
            timestamp: "2026-08-22T16:45:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira",
            notes: "Frete pesado para Carreta liberado"
          }
        ],
        createdByUserId: "user-admin-1",
        createdByName: "Mariana Silveira",
        createdAt: "2026-08-22T16:45:00.000Z",
        updatedAt: "2026-08-22T16:45:00.000Z"
      },
      {
        id: "freight-0004",
        code: "FRT-2026-0004",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        origin: {
          zipCode: "11013-000",
          address: "Avenida Portu\xE1ria",
          number: "400",
          neighborhood: "Porto",
          city: "Santos",
          state: "SP",
          date: "2026-08-21",
          timeWindow: "08:00"
        },
        destination: {
          zipCode: "74000-000",
          address: "Distrito Agroindustrial",
          number: "120",
          neighborhood: "Setor Sul",
          city: "Goi\xE2nia",
          state: "GO",
          date: "2026-08-24",
          timeWindow: "14:00"
        },
        distanceKm: 980,
        cargo: {
          description: "Insumos agr\xEDcolas e adubos especiais",
          type: "GERAL",
          weightKg: 12500,
          volumeCount: 20
        },
        requirements: {
          vehicleType: "TRUCK",
          bodyTypeRequired: "BAU",
          minCapacityKg: 12e3,
          cnhMinCategory: "C"
        },
        payment: {
          price: 5400,
          paymentMethod: "PIX",
          tollIncluded: true
        },
        status: "EM_TRANSITO",
        statusHistory: [
          {
            status: "DISPONIVEL",
            timestamp: "2026-08-21T08:00:00.000Z",
            changedByUserId: "user-admin-1",
            changedByName: "Mariana Silveira"
          },
          {
            status: "RESERVADO",
            timestamp: "2026-08-21T09:15:00.000Z",
            changedByUserId: "user-driver-joao",
            changedByName: "Jo\xE3o da Silva",
            notes: "Frete aceito pelo motorista Jo\xE3o da Silva"
          },
          {
            status: "EM_COLETA",
            timestamp: "2026-08-21T11:00:00.000Z",
            changedByUserId: "user-driver-joao",
            changedByName: "Jo\xE3o da Silva"
          },
          {
            status: "COLETADO",
            timestamp: "2026-08-21T13:30:00.000Z",
            changedByUserId: "user-driver-joao",
            changedByName: "Jo\xE3o da Silva"
          },
          {
            status: "EM_TRANSITO",
            timestamp: "2026-08-22T08:00:00.000Z",
            changedByUserId: "user-driver-joao",
            changedByName: "Jo\xE3o da Silva",
            location: "Rod. Transbrasiliana - Km 340"
          }
        ],
        createdByUserId: "user-admin-1",
        createdByName: "Mariana Silveira",
        assignedDriverId: "driver-joao-01",
        assignedDriverName: "Jo\xE3o da Silva",
        assignedDriverPhone: "(17) 98112-9090",
        assignedVehiclePlate: "BRA2E19",
        assignedVehicleModel: "Mercedes-Benz Atego 2426",
        assignedAt: "2026-08-21T09:15:00.000Z",
        startedAt: "2026-08-21T11:00:00.000Z",
        collectedAt: "2026-08-21T13:30:00.000Z",
        inTransitAt: "2026-08-22T08:00:00.000Z",
        createdAt: "2026-08-21T08:00:00.000Z",
        updatedAt: "2026-08-22T08:00:00.000Z"
      }
    ];
    this.forms = [
      {
        id: "form-checklist-elolog",
        tenantId: "tenant-translog-01",
        title: "Checklist / Vistoria de Entrega e Retirada de Ve\xEDculo e Carga (Modelo Elo Log)",
        description: "Modelo oficial de vistoria e checklist de entrega/retirada com confer\xEAncia de documentos, avarias, 17 itens de equipamentos, od\xF4metro (KM) e assinaturas de origem/destino.",
        category: "CHECKLIST_ENTREGA",
        triggerEvent: "NA_ENTREGA",
        active: true,
        fields: [
          { id: "el_cliente", name: "cliente", label: "Cliente", type: "text", required: true, order: 1 },
          { id: "el_cliente_email", name: "cliente_email", label: "E-mail do Cliente / Notifica\xE7\xE3o", type: "email", required: false, order: 2 },
          { id: "el_cliente_telefone", name: "cliente_telefone", label: "Telefone / WhatsApp Cliente", type: "phone", required: false, order: 3 },
          { id: "el_data_retirada", name: "data_retirada", label: "Data Retirada", type: "date", required: true, order: 4 },
          { id: "el_km_retirada", name: "km_retirada", label: "KM Retirada", type: "number", required: true, order: 5 },
          { id: "el_local_retirada", name: "local_retirada", label: "Local Retirada", type: "text", required: true, order: 6 },
          { id: "el_data_entrega", name: "data_entrega", label: "Data Entrega", type: "date", required: true, order: 7 },
          { id: "el_km_entrega", name: "km_entrega", label: "KM Entrega", type: "number", required: true, order: 8 },
          { id: "el_local_entrega", name: "local_entrega", label: "Local Entrega", type: "text", required: true, order: 9 },
          { id: "el_marca_veiculo", name: "marca_veiculo", label: "Marca do Ve\xEDculo", type: "select", options: ["Volkswagen", "Mercedes-Benz", "Iveco", "Scania", "Ford", "Volvo", "Outro"], required: true, order: 10 },
          { id: "el_modelo", name: "modelo", label: "Modelo do Ve\xEDculo", type: "text", required: true, order: 11 },
          { id: "el_cor", name: "cor", label: "Cor", type: "text", required: true, order: 12 },
          { id: "el_placa", name: "placa", label: "Placa", type: "text", required: true, order: 13 },
          { id: "el_chassi", name: "chassi", label: "Chassi", type: "text", required: false, order: 14 },
          { id: "el_docs", name: "documentos", label: "Documentos Presentes (CRLV, Danfe Ve\xEDculo, Manual, Danfe Equipamento)", type: "checkbox", options: ["CRLV", "Danfe Ve\xEDculo", "Manual", "Danfe Equipamento"], required: false, order: 15 },
          { id: "el_avarias", name: "avarias_resumo", label: "Apontamento de Avarias (Lataria, Pintura, Parabrisa, Interior, Pneus)", type: "textarea", placeholder: "Detalhe se houver avarias...", required: false, order: 16 },
          { id: "el_equipamentos", name: "equipamentos_status", label: "Confer\xEAncia dos 17 Equipamentos Obrigat\xF3rios", type: "radio", options: ["100% Conforme (Todos itens presentes)", "Com Pend\xEAncias / Aus\xEAncias"], required: true, order: 17 },
          { id: "el_resp_origem_nome", name: "resp_origem_nome", label: "Respons\xE1vel Vistoria (Origem) - Nome", type: "text", required: true, order: 18 },
          { id: "el_resp_origem_cpf", name: "resp_origem_cpf", label: "Respons\xE1vel Vistoria (Origem) - CPF", type: "cpf", required: true, order: 19 },
          { id: "el_resp_origem_email", name: "resp_origem_email", label: "Respons\xE1vel Vistoria (Origem) - Email", type: "email", required: false, order: 20 },
          { id: "el_resp_origem_telefone", name: "resp_origem_telefone", label: "Respons\xE1vel Vistoria (Origem) - Telefone", type: "phone", required: false, order: 21 },
          { id: "el_resp_origem_assinatura", name: "resp_origem_assinatura", label: "Assinatura Digital (Origem / Retirada)", type: "signature", required: true, order: 22 },
          { id: "el_resp_destino_nome", name: "resp_destino_nome", label: "Respons\xE1vel Vistoria (Destino) - Nome", type: "text", required: true, order: 23 },
          { id: "el_resp_destino_cpf", name: "resp_destino_cpf", label: "Respons\xE1vel Vistoria (Destino) - CPF", type: "cpf", required: true, order: 24 },
          { id: "el_resp_destino_email", name: "resp_destino_email", label: "Respons\xE1vel Vistoria (Destino) - Email", type: "email", required: false, order: 25 },
          { id: "el_resp_destino_telefone", name: "resp_destino_telefone", label: "Respons\xE1vel Vistoria (Destino) - Telefone", type: "phone", required: false, order: 26 },
          { id: "el_resp_destino_assinatura", name: "resp_destino_assinatura", label: "Assinatura Digital (Destino / Entrega)", type: "signature", required: true, order: 27 },
          { id: "el_condutor", name: "condutor_elo", label: "Condutor da ELO (Motorista)", type: "text", required: true, order: 28 },
          { id: "el_fotos", name: "fotos_vistoria", label: "Fotos do Ve\xEDculo / Avarias / Painel KM", type: "photo", required: false, order: 29 }
        ],
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: isoNow
      },
      {
        id: "form-checklist-coleta",
        tenantId: "tenant-translog-01",
        title: "Checklist de Coleta e Inspe\xE7\xE3o de Carga",
        description: "Formul\xE1rio obrigat\xF3rio executado pelo motorista no momento do carregamento da mercadoria.",
        category: "CHECKLIST_COLETA",
        triggerEvent: "DURANTE_COLETA",
        active: true,
        fields: [
          {
            id: "f1",
            name: "carga_conferida_com_nf",
            label: "A quantidade de volumes confere com a Nota Fiscal?",
            type: "radio",
            required: true,
            options: ["Sim, 100% conferido", "Diverg\xEAncia parcial", "N\xE3o foi poss\xEDvel contar"],
            order: 1
          },
          {
            id: "f2",
            name: "estado_embalagem",
            label: "Qual o estado aparente das embalagens/pallets?",
            type: "select",
            required: true,
            options: ["Excelente / Lacrado", "Bom estado", "Pequenas avarias superficiais", "Embalagens rasgadas/danificadas"],
            order: 2
          },
          {
            id: "f3",
            name: "numero_lacre",
            label: "N\xFAmero do lacre do ba\xFA/sider (se aplic\xE1vel)",
            type: "text",
            placeholder: "Ex: LCR-887412",
            required: false,
            order: 3
          },
          {
            id: "f4",
            name: "foto_carga_coleta",
            label: "Foto da carga estivada no ve\xEDculo",
            type: "photo",
            required: true,
            order: 4
          },
          {
            id: "f5",
            name: "observacoes_coleta",
            label: "Observa\xE7\xF5es adicionais da coleta",
            type: "textarea",
            placeholder: "Descreva qualquer detalhe relevante sobre o carregamento...",
            required: false,
            order: 5
          }
        ],
        createdAt: "2026-01-20T10:00:00.000Z",
        updatedAt: isoNow
      },
      {
        id: "form-comprovante-entrega",
        tenantId: "tenant-translog-01",
        title: "Comprovante Digital de Entrega (Canhoto & Assinatura)",
        description: "Formul\xE1rio para finaliza\xE7\xE3o do frete com captura do canhoto assinado e dados do recebedor.",
        category: "COMPROVANTE_ENTREGA",
        triggerEvent: "NA_ENTREGA",
        active: true,
        fields: [
          {
            id: "f10",
            name: "nome_recebedor",
            label: "Nome completo do recebedor na descarga",
            type: "text",
            placeholder: "Nome de quem recebeu e conferiu",
            required: true,
            order: 1
          },
          {
            id: "f11",
            name: "documento_recebedor",
            label: "CPF ou RG do recebedor",
            type: "text",
            placeholder: "Ex: 123.456.789-00",
            required: true,
            order: 2
          },
          {
            id: "f12",
            name: "foto_canhoto_assinado",
            label: "Foto n\xEDtida do canhoto da Nota Fiscal assinado e carimbado",
            type: "photo",
            required: true,
            order: 3
          },
          {
            id: "f13",
            name: "assinatura_digital",
            label: "Assinatura digital do recebedor na tela",
            type: "signature",
            required: true,
            order: 4
          },
          {
            id: "f14",
            name: "ocorrencia_descarga",
            label: "Houve alguma ressalva ou ocorr\xEAncia na entrega?",
            type: "radio",
            required: true,
            options: ["Entrega realizada sem ressalvas", "Avaria parcial apontada no canhoto", "Falta de mercadoria"],
            order: 5
          }
        ],
        createdAt: "2026-01-22T14:00:00.000Z",
        updatedAt: isoNow
      }
    ];
    this.notifications = [
      {
        id: "notif-001",
        tenantId: "tenant-translog-01",
        userId: "user-driver-joao",
        freightId: "freight-0001",
        type: "FRETE_DISPONIVEL",
        title: "\u{1F69A} Novo frete dispon\xEDvel para seu perfil!",
        message: "S\xE3o Jos\xE9 do Rio Preto/SP \u27A1\uFE0F S\xE3o Paulo/SP | Valor: R$ 1.850,00 (Ve\xEDculo Truck)",
        read: false,
        createdAt: "2026-08-22T15:00:00.000Z"
      },
      {
        id: "notif-002",
        tenantId: "tenant-translog-01",
        userId: "user-admin-1",
        freightId: "freight-0004",
        type: "STATUS_ATUALIZADO",
        title: "\u{1F4CD} Frete #FRT-2026-0004 em tr\xE2nsito",
        message: "O motorista Jo\xE3o da Silva iniciou a viagem de Santos/SP para Goi\xE2nia/GO.",
        read: true,
        createdAt: "2026-08-22T08:05:00.000Z"
      }
    ];
    this.auditLogs = [
      {
        id: "audit-001",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        userId: "user-admin-1",
        userName: "Mariana Silveira",
        userRole: "ADMIN",
        action: "PUBLICACAO_FRETE",
        entity: "Freight",
        entityId: "freight-0001",
        details: "Publicou o frete FRT-2026-0001 (S\xE3o Jos\xE9 do Rio Preto/SP -> S\xE3o Paulo/SP, R$ 1.850,00)",
        ip: "189.45.112.90",
        createdAt: "2026-08-22T15:00:00.000Z"
      },
      {
        id: "audit-002",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        userId: "user-driver-joao",
        userName: "Jo\xE3o da Silva",
        userRole: "MOTORISTA",
        action: "ACEITE_FRETE",
        entity: "Freight",
        entityId: "freight-0004",
        details: "Motorista aceitou e reservou o frete FRT-2026-0004 (Santos/SP -> Goi\xE2nia/GO)",
        ip: "177.33.201.12",
        createdAt: "2026-08-21T09:15:00.000Z"
      },
      {
        id: "audit-003",
        tenantId: "tenant-translog-01",
        tenantName: "TransLog Brasil Transportes",
        userId: "user-empresa-superadmin-1",
        userName: "Carlos Alberto Ferreira",
        userRole: "EMPRESA_SUPER_ADMIN",
        action: "CRIACAO_FORMULARIO",
        entity: "FormDefinition",
        entityId: "form-comprovante-entrega",
        details: "Configurou o formul\xE1rio de Comprovante Digital de Entrega",
        ip: "189.45.112.90",
        createdAt: "2026-01-22T14:00:00.000Z"
      }
    ];
    this.tripExpenses = [
      {
        id: "exp-rep-001",
        tenantId: "tenant-translog-01",
        freightId: "freight-001",
        freightCode: "FRT-2026-0001",
        driverId: "driver-001",
        driverName: "Marcos Vinicius da Silva",
        driverPhone: "(11) 98765-4321",
        vehiclePlate: "BRA2E19",
        startDate: "2026-08-20",
        endDate: "2026-08-23",
        tripDays: 4,
        initialKm: 142300,
        finalKm: 144180,
        totalKm: 1880,
        totalLiters: 650,
        averageKmPerLiter: 2.89,
        costPerKm: 2.38,
        advanceAmount: 5e3,
        totalExpenses: 4478.5,
        balanceAmount: 521.5,
        balanceStatus: "A_DEVOLVER",
        status: "ENVIADO",
        generalNotes: "Viagem tranquila entre Santos/SP e Cuiab\xE1/MT. Abastecimentos realizados nos postos conveniados.",
        items: [
          {
            id: "item-exp-1",
            category: "ABASTECIMENTO",
            date: "2026-08-20",
            description: "Abastecimento Diesel S10 320L",
            establishmentName: "Posto Graal Rodovia dos Bandeirantes",
            documentNumber: "NF-e 883921",
            amount: 1984,
            paymentMethod: "ADIANTAMENTO_EMPRESA",
            liters: 320,
            pricePerLiter: 6.2,
            odometerKm: 142450,
            fuelType: "DIESEL_S10",
            createdAt: "2026-08-20T11:30:00Z"
          },
          {
            id: "item-exp-2",
            category: "PEDAGIO",
            date: "2026-08-20",
            description: "Recarga de Tag Sem Parar",
            establishmentName: "AutoBAn Concession\xE1ria",
            documentNumber: "REC-3901",
            amount: 420,
            paymentMethod: "ADIANTAMENTO_EMPRESA",
            createdAt: "2026-08-20T08:00:00Z"
          },
          {
            id: "item-exp-3",
            category: "HOSPEDAGEM",
            date: "2026-08-21",
            description: "Pernoite e Estacionamento Seguro",
            establishmentName: "Hotel Trevo Rondon\xF3polis",
            documentNumber: "NFS-e 4492",
            amount: 180,
            paymentMethod: "ADIANTAMENTO_EMPRESA",
            nightsCount: 1,
            createdAt: "2026-08-21T21:00:00Z"
          },
          {
            id: "item-exp-4",
            category: "ABASTECIMENTO",
            date: "2026-08-22",
            description: "Abastecimento Diesel S10 330L",
            establishmentName: "Posto Ipiranga Rondon\xF3polis MT",
            documentNumber: "NF-e 992014",
            amount: 2079,
            paymentMethod: "ADIANTAMENTO_EMPRESA",
            liters: 330,
            pricePerLiter: 6.3,
            odometerKm: 143600,
            fuelType: "DIESEL_S10",
            createdAt: "2026-08-22T14:45:00Z"
          },
          {
            id: "item-exp-5",
            category: "ALIMENTACAO",
            date: "2026-08-22",
            description: "Almo\xE7o e janta no trajeto",
            establishmentName: "Restaurante Estrada Real",
            documentNumber: "CF 5591",
            amount: 85.5,
            paymentMethod: "DINHEIRO_PROPRIO",
            createdAt: "2026-08-22T19:30:00Z"
          },
          {
            id: "item-exp-6",
            category: "LOCOMOCAO_URBANA",
            date: "2026-08-23",
            description: "Deslocamento Uber do p\xE1tio ao hotel",
            establishmentName: "Uber Brasil",
            documentNumber: "UBR-99201",
            amount: 40,
            paymentMethod: "PIX_PROPRIO",
            transportOrigin: "P\xE1tio Log\xEDstico Cuiab\xE1",
            transportDestination: "Hotel Central",
            createdAt: "2026-08-23T18:00:00Z"
          }
        ],
        createdAt: "2026-08-23T14:00:00.000Z",
        updatedAt: "2026-08-23T14:00:00.000Z"
      }
    ];
  }
  ensurePublicDemoData() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const demoTenant = {
      id: PUBLIC_DEMO_TENANT_ID,
      name: "TransLog Demonstra\xE7\xE3o",
      legalName: "TransLog Demonstra\xE7\xE3o Ltda.",
      cnpj: "00.000.000/0001-00",
      email: "demo@atendo-one.example",
      phone: "5517000000000",
      zipCode: "15000-000",
      address: "Avenida da Demonstra\xE7\xE3o",
      number: "100",
      neighborhood: "Centro",
      city: "S\xE3o Jos\xE9 do Rio Preto",
      state: "SP",
      status: "ATIVA",
      plan: "PROFISSIONAL",
      planLimits: { maxUsers: 20, maxDrivers: 50, maxFreightsMonthly: 200, customForms: true, exportReports: true, prioritySupport: false },
      allowedOperations: ["CARGA_GERAL", "LOGISTICA_VEICULOS"],
      billingStatus: "INACTIVE",
      notificationPlan: "SAAS_FREE",
      notificationBillingStatus: "NOT_REQUIRED",
      atendoCrmProvisioningStatus: "NOT_CONFIGURED",
      isDemo: true,
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: now
    };
    const existingTenant = this.tenants.find((item) => item.id === PUBLIC_DEMO_TENANT_ID);
    if (!existingTenant) this.tenants.push(demoTenant);
    else Object.assign(existingTenant, { ...demoTenant, createdAt: existingTenant.createdAt || demoTenant.createdAt });
    const demoUsers = [
      {
        id: PUBLIC_DEMO_PRIMARY_USER_ID,
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: "Camila Ribeiro (Administradora de Demonstra\xE7\xE3o)",
        email: "demo.admin@atendo-one.example",
        phone: "5517000000001",
        role: "EMPRESA_SUPER_ADMIN",
        status: "ATIVO",
        accountType: "TEST",
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: "ADMIN" },
        lastLoginAt: now,
        createdAt: "2026-08-27T00:01:00.000Z"
      },
      {
        id: "user-demo-supervisor",
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: "Rafael Lima (Supervisor)",
        email: "demo.supervisor@atendo-one.example",
        phone: "5517000000002",
        role: "SUPERVISOR",
        status: "ATIVO",
        accountType: "TEST",
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: "ADMIN" },
        lastLoginAt: now,
        createdAt: "2026-08-27T00:02:00.000Z"
      },
      {
        id: "user-demo-operator",
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: "Bianca Alves (Operadora)",
        email: "demo.operador@atendo-one.example",
        phone: "5517000000003",
        role: "USUARIO",
        status: "ATIVO",
        accountType: "TEST",
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: "ADMIN" },
        lastLoginAt: now,
        createdAt: "2026-08-27T00:03:00.000Z"
      },
      {
        id: "user-demo-driver",
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: "Diego Martins (Motorista)",
        email: "demo.motorista@atendo-one.example",
        phone: "5517000000004",
        role: "MOTORISTA",
        status: "ATIVO",
        accountType: "TEST",
        readOnly: true,
        driverId: "driver-demo-01",
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: "ADMIN" },
        lastLoginAt: now,
        createdAt: "2026-08-27T00:04:00.000Z"
      }
    ];
    for (const user of demoUsers) {
      const existing = this.users.find((item) => item.id === user.id);
      if (!existing) this.users.push(user);
      else Object.assign(existing, { ...user, createdAt: existing.createdAt || user.createdAt });
    }
    const demoDriver = {
      id: "driver-demo-01",
      userId: "user-demo-driver",
      tenantId: PUBLIC_DEMO_TENANT_ID,
      name: "Diego Martins",
      cpf: "000.000.000-00",
      rg: "00.000.000-0",
      birthDate: "1988-04-15",
      phone: "5517000000004",
      email: "demo.motorista@atendo-one.example",
      zipCode: "15000-001",
      address: "Rua do Exemplo",
      city: "S\xE3o Jos\xE9 do Rio Preto",
      state: "SP",
      cnh: "00000000000",
      cnhCategory: "E",
      cnhExpiresAt: "2030-12-31",
      status: "DISPONIVEL",
      rating: 4.9,
      completedTrips: 28,
      vehiclesCount: 1,
      rntrc: "00000000",
      notes: "Registro fict\xEDcio exclusivo para demonstra\xE7\xE3o.",
      createdAt: "2026-08-27T00:05:00.000Z",
      updatedAt: now
    };
    const existingDriver = this.drivers.find((item) => item.id === demoDriver.id);
    if (!existingDriver) this.drivers.push(demoDriver);
    else Object.assign(existingDriver, demoDriver);
    const demoVehicle = {
      id: "vehicle-demo-01",
      driverId: "driver-demo-01",
      tenantId: PUBLIC_DEMO_TENANT_ID,
      type: "TRUCK",
      brand: "Volvo",
      model: "FH 460 Demonstra\xE7\xE3o",
      year: 2024,
      plate: "DEM0-001",
      renavam: "00000000000",
      capacityKg: 23e3,
      capacityVolumeM3: 90,
      bodyType: "SIDER",
      status: "ATIVO",
      trackerInstalled: true,
      createdAt: "2026-08-27T00:06:00.000Z"
    };
    if (!this.vehicles.some((item) => item.id === demoVehicle.id)) this.vehicles.push(demoVehicle);
    const demoCompanyVehicle = {
      id: "company-vehicle-demo-01",
      tenantId: PUBLIC_DEMO_TENANT_ID,
      type: "CARRETA",
      brand: "Scania",
      model: "R 450 Demonstra\xE7\xE3o",
      year: 2023,
      plate: "DEM0-002",
      renavam: "00000000001",
      capacityKg: 32e3,
      bodyType: "BAU",
      ownerName: "TransLog Demonstra\xE7\xE3o",
      ownerCnpj: "00.000.000/0001-00",
      registrationState: "SP",
      crlvNumber: "CRLV-DEMO-002",
      status: "ATIVO",
      notes: "Ve\xEDculo fict\xEDcio para demonstra\xE7\xE3o.",
      createdAt: "2026-08-27T00:07:00.000Z",
      updatedAt: now
    };
    if (!this.companyVehicles.some((item) => item.id === demoCompanyVehicle.id)) this.companyVehicles.push(demoCompanyVehicle);
    const demoFreight = {
      id: "freight-demo-01",
      code: "DEMO-2026-0001",
      tenantId: PUBLIC_DEMO_TENANT_ID,
      tenantName: demoTenant.name,
      operationType: "CARGA_GERAL",
      origin: { zipCode: "15000-010", address: "Rua da Coleta", number: "200", neighborhood: "Distrito Log\xEDstico", city: "S\xE3o Jos\xE9 do Rio Preto", state: "SP", date: "2026-08-28", timeWindow: "08:00 - 10:00", contactName: "Central de Demonstra\xE7\xE3o", contactPhone: "5517000000010" },
      destination: { zipCode: "13000-010", address: "Avenida da Entrega", number: "500", neighborhood: "Centro Industrial", city: "Campinas", state: "SP", date: "2026-08-29", timeWindow: "14:00 - 17:00", contactName: "Recebimento Demo", contactPhone: "5517000000011" },
      distanceKm: 320,
      cargo: { description: "Equipamentos log\xEDsticos de demonstra\xE7\xE3o", type: "GERAL", weightKg: 12e3, volumeCount: 18, dimensions: "Paletizado", requiresInsurance: false, notes: "Dados fict\xEDcios; nenhum cliente real est\xE1 envolvido." },
      requirements: { vehicleType: "TRUCK", bodyTypeRequired: "SIDER", minCapacityKg: 15e3, helperRequired: false, trackerRequired: true, cnhMinCategory: "E" },
      payment: { price: 1850, clientRevenue: 2400, driverCost: 1850, paymentMethod: "PIX", tollIncluded: true, advancePercentage: 50, notes: "Valor meramente demonstrativo." },
      status: "DISPONIVEL",
      statusHistory: [{ status: "RASCUNHO", timestamp: "2026-08-27T00:10:00.000Z", changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: "Camila Ribeiro", notes: "Frete de demonstra\xE7\xE3o criado." }, { status: "PUBLICADO", timestamp: "2026-08-27T00:11:00.000Z", changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: "Camila Ribeiro" }, { status: "DISPONIVEL", timestamp: "2026-08-27T00:12:00.000Z", changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: "Camila Ribeiro" }],
      createdByUserId: PUBLIC_DEMO_PRIMARY_USER_ID,
      createdByName: "Camila Ribeiro",
      assignedDriverId: "driver-demo-01",
      assignedDriverName: "Diego Martins",
      assignedDriverPhone: "5517000000004",
      assignedVehiclePlate: "DEM0-001",
      assignedVehicleModel: "Volvo FH 460 Demonstra\xE7\xE3o",
      assignedAt: "2026-08-27T00:13:00.000Z",
      createdAt: "2026-08-27T00:10:00.000Z",
      updatedAt: now
    };
    if (!this.freights.some((item) => item.id === demoFreight.id)) this.freights.push(demoFreight);
    const demoForm = {
      id: "form-demo-checklist",
      tenantId: PUBLIC_DEMO_TENANT_ID,
      title: "Checklist de Coleta \u2014 Demonstra\xE7\xE3o",
      description: "Formul\xE1rio fict\xEDcio para visualizar a opera\xE7\xE3o de coleta.",
      category: "CHECKLIST_COLETA",
      fields: [{ id: "demo_nf", name: "nota_fiscal", label: "Nota fiscal conferida?", type: "checkbox", required: true, order: 1 }, { id: "demo_avarias", name: "avarias", label: "H\xE1 avarias?", type: "radio", options: ["N\xE3o", "Sim"], required: true, order: 2 }, { id: "demo_observacao", name: "observacao", label: "Observa\xE7\xF5es", type: "textarea", required: false, order: 3 }],
      triggerEvent: "DURANTE_COLETA",
      active: true,
      createdAt: "2026-08-27T00:14:00.000Z",
      updatedAt: now
    };
    if (!this.forms.some((item) => item.id === demoForm.id)) this.forms.push(demoForm);
    const demoResponse = { id: "response-demo-01", formId: demoForm.id, formTitle: demoForm.title, tenantId: PUBLIC_DEMO_TENANT_ID, freightId: demoFreight.id, driverId: demoDriver.id, filledByUserId: "user-demo-driver", filledByName: demoDriver.name, stage: "COMPLETO", isDraft: false, answers: { nota_fiscal: true, avarias: "N\xE3o", observacao: "Coleta conclu\xEDda no ambiente demonstrativo." }, createdAt: "2026-08-27T00:15:00.000Z", updatedAt: now };
    if (!this.formResponses.some((item) => item.id === demoResponse.id)) this.formResponses.push(demoResponse);
    const demoNotifications = [
      { id: "notification-demo-01", tenantId: PUBLIC_DEMO_TENANT_ID, userId: PUBLIC_DEMO_PRIMARY_USER_ID, freightId: demoFreight.id, type: "STATUS_ATUALIZADO", title: "Frete DEMO-2026-0001 dispon\xEDvel", message: "A opera\xE7\xE3o demonstrativa possui um frete pronto para acompanhamento.", read: false, createdAt: "2026-08-27T00:16:00.000Z" },
      { id: "notification-demo-02", tenantId: PUBLIC_DEMO_TENANT_ID, userId: PUBLIC_DEMO_PRIMARY_USER_ID, type: "SISTEMA", title: "Ambiente de demonstra\xE7\xE3o", message: "Os dados desta empresa s\xE3o fict\xEDcios e as altera\xE7\xF5es operacionais s\xE3o bloqueadas.", read: false, createdAt: "2026-08-27T00:17:00.000Z" }
    ];
    for (const notification of demoNotifications) if (!this.notifications.some((item) => item.id === notification.id)) this.notifications.push(notification);
    const demoLink = { id: "link-demo-01", driverId: demoDriver.id, tenantId: PUBLIC_DEMO_TENANT_ID, status: "APROVADO", scope: "EMPRESA", source: "COMPANY_ADMIN_REGISTRATION", approvedAt: "2026-08-27T00:18:00.000Z", approvedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, createdAt: "2026-08-27T00:18:00.000Z", updatedAt: now };
    if (!this.driverCompanyLinks.some((item) => item.id === demoLink.id)) this.driverCompanyLinks.push(demoLink);
    const demoInterest = { id: "interest-demo-01", freightId: demoFreight.id, driverId: demoDriver.id, userId: "user-demo-driver", tenantId: PUBLIC_DEMO_TENANT_ID, status: "APROVADO", createdAt: "2026-08-27T00:19:00.000Z", updatedAt: now, reviewedAt: "2026-08-27T00:20:00.000Z", reviewedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, notes: "Interesse fict\xEDcio aprovado para demonstra\xE7\xE3o.", profileCompleted: true };
    if (!this.freightInterests.some((item) => item.id === demoInterest.id)) this.freightInterests.push(demoInterest);
  }
  getNextTalaoNumber() {
    let highest = 0;
    for (const resp of this.formResponses) {
      if (resp.answers && resp.answers.talaoNumber) {
        const raw = String(resp.answers.talaoNumber).replace(/\D/g, "");
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n > highest && n < 1e5) {
          highest = n;
        }
      }
    }
    const nextVal = highest + 1;
    return String(nextVal).padStart(3, "0");
  }
};
var db = new DatabaseStore();

// server/api.ts
var import_web_push = __toESM(require("web-push"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_crypto = require("crypto");

// server/atendoCrmProvisioning.ts
function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").trim().replace(/\/+$/, "");
}
var ATENDO_CRM_DEFAULT_PLAN_ID = "18";
function planToAtendoId(_plan) {
  return ATENDO_CRM_DEFAULT_PLAN_ID;
}
function trialTimeForTenant(_tenant) {
  return "3";
}
function recurrenceForTenant(_tenant) {
  return "MENSAL";
}
function buildAtendoCrmCreateTenantRequest(config, tenant, generatedPassword) {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  if (!baseUrl || !config.apiId || !config.bearerToken) {
    throw new Error("A URL, o API ID e o token administrativo do Atendo CRM s\xE3o necess\xE1rios para provisionar uma empresa.");
  }
  if (!generatedPassword || generatedPassword.length < 12) {
    throw new Error("O provisionamento exige uma senha t\xE9cnica tempor\xE1ria forte para o administrador externo.");
  }
  return {
    url: `${baseUrl}/v1/api/admin/${encodeURIComponent(config.apiId)}/createtenant`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.bearerToken}`,
      "Content-Type": "application/json"
    },
    body: {
      name: tenant.name,
      email: tenant.email,
      password: generatedPassword,
      tenantName: tenant.legalName || tenant.name,
      phone: tenant.phone,
      plano: planToAtendoId(tenant.plan),
      timetest: trialTimeForTenant(tenant),
      recurrence: recurrenceForTenant(tenant)
    }
  };
}
function externalTenantIdFromResponse(data) {
  const keys = /* @__PURE__ */ new Set(["tenantid", "tenant_id", "tenantidexternal", "externaltenantid", "id"]);
  const visited = /* @__PURE__ */ new Set();
  const queue = [data];
  let inspected = 0;
  while (queue.length && inspected < 500) {
    const current = queue.shift();
    inspected += 1;
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    for (const [key, value] of Object.entries(current)) {
      if (keys.has(key.toLowerCase()) && (typeof value === "string" || typeof value === "number") && String(value).trim()) return String(value);
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return void 0;
}

// server/sanitizeHtml.ts
var import_sanitize_html = __toESM(require("sanitize-html"), 1);
var allowedTags = [
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "code",
  "del",
  "details",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "small",
  "span",
  "strong",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
];
var allowedAttributes = {
  "*": ["class"],
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height"]
};
var sanitizeServerHtml = (value) => (0, import_sanitize_html.default)(String(value || ""), {
  allowedTags,
  allowedAttributes,
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: {
    a: ["https", "mailto"],
    img: ["https"]
  },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true
});

// src/version.ts
var APP_VERSION = "v1.8.21";

// server/budgetService.ts
var money = (value) => Math.round((Number(value) || 0) * 100) / 100;
function calculateBudget(input) {
  const expenses = (input.expenses || []).map((item) => ({ ...item, quantity: Number(item.quantity) || 0, unitPrice: money(item.unitPrice), total: money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }));
  const totalExpenses = money(expenses.reduce((sum, item) => sum + item.total, 0));
  const routeCost = money((Number(input.distanceKm) || 0) * (Number(input.pricePerKm) || 0));
  const tolls = money(input.tolls);
  const insurance = money(input.insurance);
  const lodging = money((Number(input.dailyRate) || 0) * (Number(input.dailyCount) || 0));
  const assistants = money((Number(input.assistantCount) || 0) * (Number(input.assistantDailyRate) || 0) * (Number(input.dailyCount) || 1));
  const subtotal = money(totalExpenses + routeCost + tolls + insurance + lodging + assistants);
  const totalTaxes = money((input.taxes || []).reduce((sum, tax) => {
    const base = tax.base === "DESPESAS" ? totalExpenses : tax.base === "SUBTOTAL" ? subtotal : money(Number(input.driverPassed) || 0);
    return sum + (tax.type === "FIXO" ? money(tax.fixedValue) : money(base * (Number(tax.percentage) || 0) / 100));
  }, 0));
  const totalCost = money(subtotal + totalTaxes);
  const profit = input.profitType === "FIXO" ? money(input.profitValue) : money(totalCost * (Number(input.profitValue) || 0) / 100);
  const totalFreight = money(totalCost + profit);
  const driverPassed = money(input.driverPassed);
  const driverPaid = money(input.driverPaid);
  return { totalExpenses, routeCost, tolls, insurance, lodging, assistants, subtotal, totalTaxes, totalCost, profit, totalFreight, driverPassed, driverPaid, netResult: money(totalFreight - driverPaid - totalExpenses - routeCost - tolls - insurance - lodging - assistants - totalTaxes) };
}
function normalizeExpense(input, index) {
  const quantity = Number(input.quantity ?? 1);
  const unitPrice = money(input.unitPrice ?? input.total ?? 0);
  return { id: String(input.id || `expense-${index + 1}`), description: String(input.description || "").trim().slice(0, 160), category: String(input.category || "OUTROS").slice(0, 60), quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 0, unit: String(input.unit || "un").slice(0, 30), unitPrice, total: money(quantity * unitPrice), notes: String(input.notes || "").slice(0, 500) };
}

// server/api.ts
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing or insecure.");
  process.exit(1);
}
var SAFE_JWT_SECRET = JWT_SECRET;
var requestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || "").split(",")[0].trim().slice(0, 64) || void 0;
};
var auditAuthFailure = (req, action, email, details = "Falha de autentica\xE7\xE3o.") => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
  db.addAuditLog({ ip: requestIp(req), tenantId: void 0, userId: "anonymous", userName: normalizedEmail ? `email:${normalizedEmail}` : "anonymous", userRole: "USUARIO", action, entity: "Auth", entityId: normalizedEmail || "unknown", details });
};
var apiRouter = (0, import_express.Router)();
var BACKUP_CONTROL_DIR = process.env.BACKUP_CONTROL_DIR || "/var/lib/elolog-backup";
var BACKUP_STATUS_FILE = process.env.BACKUP_STATUS_FILE || import_path2.default.join(BACKUP_CONTROL_DIR, "status.json");
var BACKUP_REQUEST_DIR = process.env.BACKUP_REQUEST_DIR || import_path2.default.join(BACKUP_CONTROL_DIR, "requests");
var BACKUP_EVENT_SECRET_FILE = process.env.BACKUP_EVENT_SECRET_FILE || "/run/secrets/elolog_backup_event_secret";
var BACKUP_EVENT_MAX_SKEW_MS = 10 * 60 * 1e3;
var BACKUP_STATE_VALUES = /* @__PURE__ */ new Set(["SUCCESS", "ERROR", "RUNNING", "UNKNOWN", "UNAVAILABLE"]);
var BACKUP_ITEM_STATUS_VALUES = /* @__PURE__ */ new Set(["SUCCESS", "ERROR", "RUNNING", "UNKNOWN"]);
var defaultBackupNotificationConfig = () => ({
  enabled: true,
  whatsappEnabled: false,
  whatsappPhone: "",
  notifyOnFailure: true,
  notifyOnSuccess: false
});
var backupNotificationConfig = () => ({
  ...defaultBackupNotificationConfig(),
  ...db.saasGlobalConfig.backupNotifications || {}
});
var maskBackupPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `${digits.slice(0, 4)}******${digits.slice(-2)}`;
};
var safeBackupNotifications = () => {
  const config = backupNotificationConfig();
  return {
    enabled: config.enabled,
    whatsappEnabled: config.whatsappEnabled,
    whatsappPhone: config.whatsappPhone ? "********" : "",
    whatsappPhoneMasked: maskBackupPhone(config.whatsappPhone),
    notifyOnFailure: config.notifyOnFailure,
    notifyOnSuccess: config.notifyOnSuccess,
    updatedAt: config.updatedAt
  };
};
var isSafeBackupName = (value) => /^[A-Za-z0-9._-]{1,100}$/.test(String(value || ""));
var isSafeRunId = (value) => /^[A-Za-z0-9._-]{1,100}$/.test(String(value || ""));
var normalizeBackupPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const candidate = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  if (!/^55\d{10,11}$/.test(candidate)) throw new Error("Informe um WhatsApp brasileiro v\xE1lido com DDD.");
  return candidate;
};
var backupNotificationConfigFromInput = (input, current) => {
  const base = { ...defaultBackupNotificationConfig(), ...current || {} };
  const rawPhone = input?.whatsappPhone === "********" ? base.whatsappPhone : input?.whatsappPhone;
  return {
    enabled: input?.enabled === void 0 ? base.enabled : Boolean(input.enabled),
    whatsappEnabled: input?.whatsappEnabled === void 0 ? base.whatsappEnabled : Boolean(input.whatsappEnabled),
    whatsappPhone: rawPhone === void 0 ? base.whatsappPhone : normalizeBackupPhone(rawPhone),
    notifyOnFailure: input?.notifyOnFailure === void 0 ? base.notifyOnFailure : Boolean(input.notifyOnFailure),
    notifyOnSuccess: input?.notifyOnSuccess === void 0 ? base.notifyOnSuccess : Boolean(input.notifyOnSuccess),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
var readBackupStatus = async () => {
  const notifications = safeBackupNotifications();
  const unavailable = {
    configured: false,
    state: "UNAVAILABLE",
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: "O monitor de backup ainda n\xE3o est\xE1 dispon\xEDvel neste processo.",
    backups: [],
    manualRequestPending: false,
    retention: Number(process.env.ELOLOG_BACKUP_RETENTION || 3),
    schedule: "Di\xE1rio \xE0s 03:00 (America/Sao_Paulo)",
    notifications: {
      enabled: notifications.enabled,
      whatsappEnabled: notifications.whatsappEnabled,
      whatsappPhoneMasked: notifications.whatsappPhoneMasked,
      notifyOnFailure: notifications.notifyOnFailure,
      notifyOnSuccess: notifications.notifyOnSuccess
    }
  };
  try {
    const raw = await import_fs2.default.promises.readFile(BACKUP_STATUS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const state = BACKUP_STATE_VALUES.has(parsed?.state) ? parsed.state : "UNKNOWN";
    const backups = Array.isArray(parsed?.backups) ? parsed.backups.filter((item) => isSafeBackupName(item?.name)).slice(0, 3).map((item) => ({
      name: String(item.name),
      generatedAt: typeof item.generatedAt === "string" ? item.generatedAt : null,
      sizeBytes: Number.isFinite(Number(item.sizeBytes)) ? Math.max(0, Number(item.sizeBytes)) : 0,
      verified: item.verified === true,
      status: BACKUP_ITEM_STATUS_VALUES.has(item.status) ? item.status : "UNKNOWN"
    })) : [];
    let manualRequestPending = parsed?.manualRequestPending === true;
    try {
      const requests = await import_fs2.default.promises.readdir(BACKUP_REQUEST_DIR);
      manualRequestPending = requests.some((name) => /^manual-[A-Za-z0-9-]+\.request$/.test(name));
    } catch {
    }
    return {
      configured: true,
      state,
      lastSuccessAt: typeof parsed?.lastSuccessAt === "string" ? parsed.lastSuccessAt : null,
      lastErrorAt: typeof parsed?.lastErrorAt === "string" ? parsed.lastErrorAt : null,
      lastErrorMessage: typeof parsed?.lastErrorMessage === "string" ? parsed.lastErrorMessage.slice(0, 180) : null,
      backups,
      manualRequestPending,
      retention: Number.isInteger(Number(parsed?.retention)) ? Math.max(1, Number(parsed.retention)) : 3,
      schedule: typeof parsed?.schedule === "string" ? parsed.schedule.slice(0, 100) : unavailable.schedule,
      notifications: unavailable.notifications
    };
  } catch (error) {
    if (error?.code !== "ENOENT") return { ...unavailable, state: "UNKNOWN", lastErrorMessage: "N\xE3o foi poss\xEDvel ler o status do monitor de backup." };
    return unavailable;
  }
};
var publicVapidKey = process.env.VAPID_PUBLIC_KEY;
var privateVapidKey = process.env.VAPID_PRIVATE_KEY;
if (publicVapidKey && privateVapidKey) {
  try {
    import_web_push.default.setVapidDetails(
      "mailto:contato@portaldefretes.com.br",
      publicVapidKey,
      privateVapidKey
    );
  } catch (e) {
    console.warn("VAPID setup warning:", e);
  }
} else {
  console.warn("VAPID keys are not configured; push notifications are disabled.");
}
async function sendPushNotificationToAll(payload) {
  const subs = db.pushSubscriptions || [];
  for (let i = subs.length - 1; i >= 0; i--) {
    const sub = subs[i];
    try {
      await import_web_push.default.sendNotification(sub, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        subs.splice(i, 1);
      }
    }
  }
}
var SUPPORT_SESSION_TTL_MS = 30 * 60 * 1e3;
var USER_SESSION_TTL_MS = 10 * 60 * 1e3;
var REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var activeSupportSessions = /* @__PURE__ */ new Map();
var activeRefreshFamilies = /* @__PURE__ */ new Map();
function issueUserSession(user) {
  const sessionId = (0, import_crypto.randomUUID)();
  const expiresAt = new Date(Date.now() + USER_SESSION_TTL_MS).toISOString();
  const refreshTokenId = (0, import_crypto.randomUUID)();
  const refreshFamilyId = activeRefreshFamilies.get(user.id) || (0, import_crypto.randomUUID)();
  activeRefreshFamilies.set(user.id, refreshFamilyId);
  user.activeSessionId = sessionId;
  user.activeSessionExpiresAt = expiresAt;
  const token = import_jsonwebtoken.default.sign({ userId: user.id, sid: sessionId, typ: "access" }, SAFE_JWT_SECRET, { expiresIn: "10m" });
  const refreshToken = import_jsonwebtoken.default.sign({ userId: user.id, jti: refreshTokenId, familyId: refreshFamilyId, typ: "refresh" }, SAFE_JWT_SECRET, { expiresIn: "7d" });
  db.saveAuthToken(token, user.id, new Date(expiresAt));
  db.saveRefreshToken(refreshTokenId, user.id, refreshFamilyId, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));
  void db.persistNow();
  return { token, refreshToken, expiresAt };
}
var TENANT_ADMIN_ROLES = ["EMPRESA_SUPER_ADMIN", "ADMIN"];
var DIRECTORY_ADMIN_ROLES = ["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"];
var TENANT_USER_ROLES = ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USUARIO", "MOTORISTA"];
var canManageTenantDirectory = (user) => Boolean(user && DIRECTORY_ADMIN_ROLES.includes(user.role));
var canAssignUserRole = (actor, targetRole) => {
  if (!actor || !TENANT_USER_ROLES.includes(targetRole) && targetRole !== "SUPER_ADMIN") return false;
  if (targetRole === "SUPER_ADMIN") return actor.role === "SUPER_ADMIN";
  if (targetRole === "EMPRESA_SUPER_ADMIN") return actor.role === "SUPER_ADMIN";
  return DIRECTORY_ADMIN_ROLES.includes(actor.role);
};
var VALID_STATUS_TRANSITIONS = {
  RASCUNHO: ["PUBLICADO", "CANCELADO"],
  PUBLICADO: ["DISPONIVEL", "RESERVADO", "CANCELADO"],
  DISPONIVEL: ["RESERVADO", "CANCELADO"],
  RESERVADO: ["EM_COLETA", "DISPONIVEL", "CANCELADO"],
  EM_COLETA: ["COLETADO", "CANCELADO"],
  COLETADO: ["EM_TRANSITO", "CANCELADO"],
  EM_TRANSITO: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: ["FINALIZADO", "CANCELADO"],
  FINALIZADO: [],
  CANCELADO: []
};
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const path4 = req.path;
  const publicPaths = [
    "/auth/login",
    "/auth/refresh",
    "/auth/request-otp",
    "/auth/verify-otp",
    "/auth/register-company",
    "/auth/verify-registration",
    "/auth/register-driver",
    "/auth/switch-demo",
    "/auth/demo-session",
    "/analytics/visit",
    "/health",
    "/internal/backups/event"
  ];
  const isPublicRoute = publicPaths.includes(path4) || req.method === "GET" && /^\/public\/tracking\/[^/]+$/.test(path4) || path4 === "/saas/config" && req.method === "GET" || path4 === "/push/vapid-key" && req.method === "GET";
  const routeExists = (apiRouter.stack || []).some((layer) => {
    if (!layer.route || typeof layer.match !== "function") return false;
    const methods = layer.route.methods || {};
    return Boolean(layer.match(path4) && (methods[req.method.toLowerCase()] || methods._all));
  });
  if (!routeExists && !publicPaths.includes(path4)) {
    return res.status(404).json({ error: "Rota n\xE3o encontrada." });
  }
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]?.trim();
    if (token) {
      try {
        const decoded = import_jsonwebtoken.default.verify(token, SAFE_JWT_SECRET);
        const foundUser = db.users.find((u) => u.id === decoded.userId);
        if (foundUser) {
          if (decoded.support !== true && (!foundUser.activeSessionId || decoded.sid !== foundUser.activeSessionId || !foundUser.activeSessionExpiresAt || Date.parse(foundUser.activeSessionExpiresAt) <= Date.now())) {
            return res.status(401).json({ error: "Sess\xE3o substitu\xEDda, expirada ou revogada. Fa\xE7a login novamente." });
          }
          if (decoded.support === true) {
            const supportSession = decoded.supportSessionId ? activeSupportSessions.get(decoded.supportSessionId) : void 0;
            const actorUser = decoded.actorUserId ? db.users.find((u) => u.id === decoded.actorUserId) : void 0;
            const validSupportSession = Boolean(
              supportSession && actorUser?.role === "SUPER_ADMIN" && supportSession.actorUserId === actorUser.id && supportSession.targetUserId === foundUser.id && decoded.targetUserId === foundUser.id && Date.parse(supportSession.expiresAt) > Date.now()
            );
            if (!validSupportSession) {
              if (decoded.supportSessionId) activeSupportSessions.delete(decoded.supportSessionId);
              return res.status(401).json({ error: "Sess\xE3o de suporte inv\xE1lida ou expirada." });
            }
            req.supportSession = supportSession;
          }
          req.user = foundUser;
          req.authToken = token;
          req.tenant = foundUser.tenantId ? db.tenants.find((t) => t.id === foundUser.tenantId) || null : null;
          return next();
        }
      } catch (err) {
      }
      if (!isPublicRoute) {
        return res.status(401).json({ error: "Token inv\xE1lido ou expirado" });
      }
    }
  }
  if (isPublicRoute) {
    return next();
  }
  return res.status(401).json({ error: "N\xE3o autenticado" });
}
function sanitizeUser(user) {
  if (!user) return user;
  const { password, activeSessionId, activeSessionExpiresAt, ...safeUser } = user;
  return safeUser;
}
function sanitizeDriver(driver) {
  if (!driver) return driver;
  const { bankName, bankAgency, bankAccount, pixKeyType, pixKey, ...safeDriver } = driver;
  return safeDriver;
}
function safeSupportIdentity(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  };
}
function getSessionDataForUser(targetUser) {
  const targetTenant = targetUser.tenantId ? db.tenants.find((t) => t.id === targetUser.tenantId) || null : null;
  let driver;
  let vehicles = [];
  if (targetUser.role === "MOTORISTA" && targetUser.driverId) {
    driver = db.drivers.find((item) => item.id === targetUser.driverId || item.userId === targetUser.id);
    if (driver) vehicles = db.vehicles.filter((vehicle) => vehicle.driverId === driver.id);
  }
  return {
    user: sanitizeUser(targetUser),
    tenant: targetTenant,
    driver,
    vehicles
  };
}
var CURRENT_LEGAL_VERSIONS = {
  terms: "2026-08-27.1",
  privacy: "2026-08-27.1"
};
var escapeEmailHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
var interpolateNotification = (template, values) => String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => String(values[key] ?? ""));
var notificationTemplateFor = (eventKey) => db.saasGlobalConfig.notificationTemplates?.find((template) => template.eventKey === eventKey);
var LOGIN_OTP_EVENT_KEY = "LOGIN_OTP";
var LOGIN_OTP_DEFAULT_BODY = "{nomePlataforma}: seu c\xF3digo de acesso \xE9 {codigo}. V\xE1lido por {validadeMinutos} minutos. N\xE3o compartilhe este c\xF3digo.";
var LOGIN_OTP_REQUIRED_VARIABLES = ["codigo", "validadeMinutos"];
var LOGIN_OTP_ALLOWED_VARIABLES = /* @__PURE__ */ new Set(["nomePlataforma", "codigo", "validadeMinutos"]);
var configuredPlatformName = () => {
  const configured = String(db.saasGlobalConfig.systemName || "").replace(/\s+/g, " ").trim().slice(0, 80);
  return configured || "Atendo One";
};
var renderLoginOtpMessage = (code, validityMinutes, tenantId) => {
  const template = notificationTemplateForTenant(LOGIN_OTP_EVENT_KEY, tenantId);
  const candidate = typeof template?.whatsappBody === "string" ? template.whatsappBody.trim() : "";
  const hasRequiredVariables = LOGIN_OTP_REQUIRED_VARIABLES.every((variable) => candidate.includes(`{${variable}}`));
  const body = hasRequiredVariables && candidate ? candidate : LOGIN_OTP_DEFAULT_BODY;
  const tenant = tenantId ? db.tenants.find((item) => item.id === tenantId) : void 0;
  return interpolateNotification(body, {
    nomePlataforma: configuredPlatformName(),
    nomeEmpresa: tenant?.name || "",
    empresa: tenant?.name || "",
    razaoSocial: tenant?.legalName || "",
    cnpjEmpresa: tenant?.cnpj || "",
    emailEmpresa: tenant?.email || "",
    telefoneEmpresa: tenant?.phone || "",
    cidadeEmpresa: tenant?.city || "",
    estadoEmpresa: tenant?.state || "",
    codigo: code,
    validadeMinutos: String(validityMinutes)
  }).trim();
};
var tenantOwnNumberActive = (tenantId) => {
  if (!tenantId) return false;
  const tenant = db.tenants.find((item) => item.id === tenantId);
  return Boolean(tenant?.notificationPlan === "OWN_NUMBER" && tenant.notificationBillingStatus === "ACTIVE");
};
var notificationTemplateForTenant = (eventKey, tenantId) => {
  const globalTemplate = notificationTemplateFor(eventKey);
  if (!globalTemplate || !tenantOwnNumberActive(tenantId)) return globalTemplate;
  const tenantTemplate = db.tenantNotificationTemplates.get(String(tenantId))?.find((template) => template.eventKey === eventKey);
  if (!tenantTemplate) return globalTemplate;
  return {
    ...globalTemplate,
    ...tenantTemplate,
    systemLocked: globalTemplate.systemLocked,
    channels: { ...globalTemplate.channels, ...tenantTemplate.channels },
    variables: [...globalTemplate.variables]
  };
};
var notificationTemplatesForTenant = (tenantId) => {
  const overrides = db.tenantNotificationTemplates.get(tenantId) || [];
  return (db.saasGlobalConfig.notificationTemplates || []).map((template) => {
    const override = overrides.find((item) => item.eventKey === template.eventKey);
    return {
      ...template,
      ...override || {},
      source: override ? "TENANT" : "GLOBAL",
      systemLocked: template.systemLocked,
      channels: { ...template.channels, ...override?.channels || {} },
      variables: [...template.variables]
    };
  });
};
var notificationValuesForTenant = (tenantId, values) => {
  const tenant = tenantId ? db.tenants.find((item) => item.id === tenantId) : void 0;
  return {
    ...values,
    nomePlataforma: configuredPlatformName(),
    empresa: values.empresa || tenant?.name || "",
    nomeEmpresa: values.nomeEmpresa || tenant?.name || "",
    razaoSocial: values.razaoSocial || tenant?.legalName || "",
    cnpjEmpresa: values.cnpjEmpresa || tenant?.cnpj || "",
    emailEmpresa: values.emailEmpresa || tenant?.email || "",
    telefoneEmpresa: values.telefoneEmpresa || tenant?.phone || "",
    cidadeEmpresa: values.cidadeEmpresa || tenant?.city || "",
    estadoEmpresa: values.estadoEmpresa || tenant?.state || ""
  };
};
var notificationValuesFor = (user, values) => notificationValuesForTenant(user.tenantId, values);
var notificationTemplateTextIsSafe = (value, allowedVariables) => {
  const text = String(value ?? "");
  const referencedVariables = Array.from(text.matchAll(/\{([a-zA-Z0-9_]+)\}/g), (match) => match[1]);
  return text.trim().length > 0 && text.length <= 1e3 && referencedVariables.every((variable) => allowedVariables.includes(variable));
};
var notificationTypeFor = (eventKey) => eventKey === "FRETE_ACEITO" ? "FRETE_ACEITO" : eventKey === "STATUS_ATUALIZADO" ? "STATUS_ATUALIZADO" : eventKey === "INTERESSE_FRETE" ? "INTERESSE_FRETE" : "SISTEMA";
var notificationConsentFor = (user) => ({
  email: user.notificationConsents?.email !== false,
  whatsapp: user.notificationConsents?.whatsapp === true
});
var addIgnoredNotificationDelivery = (eventKey, tenantId, userId, channel, subject) => {
  db.addNotificationDelivery({ eventKey, tenantId, userId, channel, status: "IGNORADO", subject, attempts: 0, errorMessage: "Sem consentimento do destinat\xE1rio para este canal." });
};
async function sendConfiguredEmail(user, subject, body) {
  const config = db.saasGlobalConfig.emailConfig;
  if (!user.email || !config?.isActive || !config.host || !config.user || !config.password) return;
  const transporter = import_nodemailer.default.createTransport({
    host: config.host,
    port: Number(config.port || 587),
    secure: Number(config.port || 587) === 465,
    auth: { user: config.user, pass: config.password }
  });
  await transporter.sendMail({
    from: config.senderEmail || config.user,
    to: user.email,
    subject: subject.slice(0, 180),
    text: body,
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-line">${escapeEmailHtml(body)}</div>`
  });
}
async function dispatchConfiguredNotification(eventKey, recipients, values) {
  const uniqueRecipients = Array.from(new Map(recipients.filter(Boolean).map((user) => [user.id, user])).values());
  for (const user of uniqueRecipients) {
    const tenantId = user.tenantId || values.tenantId || null;
    const template = notificationTemplateForTenant(eventKey, user.tenantId);
    if (!template || !template.enabled) continue;
    const recipientValues = notificationValuesFor(user, { ...values, tenantId });
    const title = interpolateNotification(template.emailSubject || template.label, recipientValues);
    const inAppMessage = interpolateNotification(template.emailBody || template.label, recipientValues);
    if (template.channels?.inApp) {
      db.addNotification({
        tenantId,
        userId: user.id,
        freightId: recipientValues.freightId,
        type: notificationTypeFor(eventKey),
        title,
        message: inAppMessage
      });
      db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: "inApp", status: "ENVIADO", subject: title, attempts: 1, sentAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (template.channels?.email && notificationConsentFor(user).email) {
      const delivery = db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: "email", status: "PENDENTE", subject: title, attempts: 0 });
      try {
        await sendConfiguredEmail(user, title, inAppMessage);
        db.updateNotificationDelivery(delivery.id, { status: "ENVIADO", attempts: 1, sentAt: (/* @__PURE__ */ new Date()).toISOString() });
      } catch (error) {
        db.updateNotificationDelivery(delivery.id, { status: "FALHOU", attempts: 1, errorMessage: "Falha no envio de e-mail." });
        db.addErrorLog({ service: "smtp", route: "notification-dispatch", method: "SMTP", event: "EMAIL_NOTIFICATION_FAILED", message: "Falha no envio de notifica\xE7\xE3o por e-mail.", tenantId: user.tenantId || void 0, userId: user.id });
        console.warn("[Notification] email dispatch failed", { eventKey, userId: user.id, status: String(error?.code || "SMTP_ERROR") });
      }
    }
    if (template.channels?.email && !notificationConsentFor(user).email) {
      addIgnoredNotificationDelivery(eventKey, tenantId, user.id, "email", title);
    }
    if (template.channels?.whatsapp === true && notificationConsentFor(user).whatsapp) {
      const config = resolveWhatsAppConfig(user.tenantId || values.tenantId);
      const delivery = db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: "whatsapp", status: "PENDENTE", subject: title, attempts: 0 });
      try {
        const result = await sendToWhatsAppGateway(config, {
          number: user.phone,
          body: interpolateNotification(template.whatsappBody, recipientValues),
          externalKey: `${eventKey}-${Date.now()}-${user.id}`
        });
        const providerMessageId = String(result?.messageId || result?.id || "") || void 0;
        db.updateNotificationDelivery(delivery.id, result.success ? { status: "ENVIADO", attempts: 1, providerMessageId, sentAt: (/* @__PURE__ */ new Date()).toISOString() } : { status: "FALHOU", attempts: 1, providerMessageId, errorMessage: "Gateway recusou a mensagem." });
        if (!result.success) console.warn("[Notification] WhatsApp gateway rejected message", { eventKey, userId: user.id });
      } catch (error) {
        db.updateNotificationDelivery(delivery.id, { status: "FALHOU", attempts: 1, errorMessage: "Falha no gateway WhatsApp." });
        db.addErrorLog({ service: "whatsapp", route: "notification-dispatch", method: "POST", event: "WHATSAPP_NOTIFICATION_FAILED", message: "Falha no envio de notifica\xE7\xE3o por WhatsApp.", tenantId: user.tenantId || void 0, userId: user.id });
        console.warn("[Notification] WhatsApp dispatch failed", { eventKey, userId: user.id, status: "GATEWAY_ERROR" });
      }
    }
    if (template.channels?.whatsapp === true && !notificationConsentFor(user).whatsapp) {
      addIgnoredNotificationDelivery(eventKey, tenantId, user.id, "whatsapp", title);
    }
  }
  void db.persistNow();
}
apiRouter.post("/webhooks/asaas", async (req, res) => {
  const configuredToken = db.saasGlobalConfig.asaasConfig?.webhookToken || "";
  const receivedToken = String(req.header("asaas-access-token") || "");
  if (!configuredToken || receivedToken !== configuredToken) return res.status(401).json({ error: "Webhook Asaas n\xE3o autorizado" });
  const eventId = String(req.body?.id || "");
  const event = String(req.body?.event || "");
  const payment = req.body?.payment || {};
  const subscriptionPayload = req.body?.subscription || {};
  if (!eventId || !event) return res.status(400).json({ error: "Evento Asaas inv\xE1lido" });
  const duplicate = db.asaasPayments.some((item) => item.webhookEventIds?.includes(eventId)) || db.asaasSubscriptions.some((item) => item.webhookEventIds?.includes(eventId));
  if (!duplicate) {
    if (payment.id || payment.subscription) {
      let paymentRecord = db.asaasPayments.find((item) => item.asaasPaymentId === payment.id);
      if (!paymentRecord) {
        paymentRecord = { asaasPaymentId: payment.id || `event-${eventId}`, tenantId: void 0, planId: void 0, subscriptionId: payment.subscription || void 0, createdAt: (/* @__PURE__ */ new Date()).toISOString(), webhookEventIds: [] };
        db.asaasPayments.push(paymentRecord);
      }
      paymentRecord.status = payment.status || event;
      paymentRecord.subscriptionId = payment.subscription || paymentRecord.subscriptionId;
      paymentRecord.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      paymentRecord.webhookEventIds = [...paymentRecord.webhookEventIds || [], eventId].slice(-50);
      const subscription = paymentRecord.subscriptionId ? db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === paymentRecord.subscriptionId) : void 0;
      if (subscription) {
        subscription.tenantId = subscription.tenantId || paymentRecord.tenantId || String(subscription.externalReference || "").split(":")[0] || void 0;
        subscription.status = event === "PAYMENT_RECEIVED" ? "ACTIVE" : event === "PAYMENT_OVERDUE" ? "OVERDUE" : payment.status || subscription.status || event;
        subscription.lastPaymentStatus = payment.status || event;
        subscription.lastPaymentId = payment.id || subscription.lastPaymentId;
        subscription.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        subscription.webhookEventIds = [...subscription.webhookEventIds || [], eventId].slice(-50);
        const tenant = db.tenants.find((item) => item.id === subscription.tenantId);
        if (tenant) {
          if (isNotificationSubscription(subscription)) {
            tenant.notificationSubscriptionId = subscription.asaasSubscriptionId;
            tenant.notificationBillingStatus = event === "PAYMENT_RECEIVED" ? "ACTIVE" : event === "PAYMENT_OVERDUE" ? "OVERDUE" : (payment.status || "").includes("CANCELED") ? "CANCELED" : tenant.notificationBillingStatus || "PENDING";
            if (event === "PAYMENT_RECEIVED") tenant.notificationPlan = "OWN_NUMBER";
            tenant.notificationBillingNextDueDate = subscription.nextDueDate;
          } else {
            tenant.asaasSubscriptionId = subscription.asaasSubscriptionId;
            tenant.billingStatus = event === "PAYMENT_RECEIVED" ? "ACTIVE" : event === "PAYMENT_OVERDUE" ? "OVERDUE" : (payment.status || "").includes("CANCELED") ? "CANCELED" : tenant.billingStatus || "PENDING";
            if (event === "PAYMENT_RECEIVED" && subscription.planId) tenant.plan = subscription.planId;
          }
          tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
    }
    if (subscriptionPayload.id) {
      let subscription = db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === subscriptionPayload.id);
      if (!subscription) {
        subscription = { asaasSubscriptionId: subscriptionPayload.id, tenantId: void 0, planId: void 0, webhookEventIds: [] };
        db.asaasSubscriptions.push(subscription);
      }
      subscription.status = subscriptionPayload.status || event;
      subscription.value = subscriptionPayload.value ?? subscription.value;
      subscription.cycle = subscriptionPayload.cycle || subscription.cycle;
      subscription.nextDueDate = subscriptionPayload.nextDueDate || subscription.nextDueDate;
      subscription.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      subscription.webhookEventIds = [...subscription.webhookEventIds || [], eventId].slice(-50);
      const externalReference = String(subscriptionPayload.externalReference || "");
      const tenantId = subscription.tenantId || externalReference.split(":")[0];
      if (tenantId) {
        subscription.tenantId = tenantId;
        const tenant = db.tenants.find((item) => item.id === tenantId);
        if (tenant) {
          if (isNotificationSubscription(subscription) || externalReference.includes(":WHATSAPP_OWN_NUMBER")) {
            tenant.notificationSubscriptionId = subscription.asaasSubscriptionId;
            tenant.notificationBillingStatus = ["SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"].includes(event) ? "INACTIVE" : subscriptionPayload.status === "OVERDUE" ? "OVERDUE" : tenant.notificationBillingStatus || "PENDING";
            tenant.notificationPlan = "OWN_NUMBER";
            tenant.notificationBillingNextDueDate = subscription.nextDueDate;
          } else {
            tenant.asaasSubscriptionId = subscription.asaasSubscriptionId;
            tenant.billingStatus = ["SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"].includes(event) ? "INACTIVE" : tenant.billingStatus || "PENDING";
            tenant.billingNextDueDate = subscription.nextDueDate;
          }
          tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
    }
    db.addAuditLog({ ip: requestIp(req), tenantId: void 0, userId: "asaas-webhook", userName: "Asaas Webhook", userRole: "SUPER_ADMIN", action: "ASAAS_WEBHOOK", entity: payment.id ? "AsaasPayment" : "AsaasSubscription", entityId: String(payment.id || subscriptionPayload.id || eventId), details: `Evento ${event} recebido e processado de forma idempotente.` });
    await db.persistNow();
  }
  return res.status(200).json({ received: true, duplicate });
});
var publicSeoConfig = () => {
  const canonicalUrl = safePublicUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL) || "https://gestor.atendo.log.br";
  return {
    siteName: String(db.saasGlobalConfig.seo?.siteName || db.saasGlobalConfig.systemName || "Atendo One").trim().slice(0, 200),
    title: String(db.saasGlobalConfig.seo?.title || `${db.saasGlobalConfig.systemName || "Atendo One"} \u2014 Gest\xE3o e publica\xE7\xE3o de fretes`).trim().slice(0, 200),
    description: String(db.saasGlobalConfig.seo?.description || "Plataforma de gest\xE3o log\xEDstica para transportadoras, motoristas e opera\xE7\xF5es de fretes.").trim().slice(0, 2e3),
    keywords: String(db.saasGlobalConfig.seo?.keywords || "").trim().slice(0, 1e3),
    canonicalUrl,
    ogImageUrl: safePublicUrl(db.saasGlobalConfig.seo?.ogImageUrl) || `${canonicalUrl}/og-default.svg`,
    locale: /^[a-z]{2}(?:_[A-Z]{2}|-[A-Z]{2})?$/.test(String(db.saasGlobalConfig.seo?.locale || "")) ? String(db.saasGlobalConfig.seo?.locale) : "pt_BR",
    allowIndexing: db.saasGlobalConfig.seo?.allowIndexing !== false
  };
};
var sanitizePublicContent = (value) => sanitizeServerHtml(value);
var registrationOnlyContentSlugs = /* @__PURE__ */ new Set(["termos-de-uso", "politica-de-privacidade"]);
var isRegistrationOnlySlug = (value) => registrationOnlyContentSlugs.has(String(value || "").trim().toLowerCase());
var publicContentItems = () => [
  ...db.pages.filter((page) => page.tenantId === null && page.isPublished && page.isIndexable !== false && !isRegistrationOnlySlug(page.slug)).map((page) => ({ ...page, kind: "page" })),
  ...db.posts.filter((post) => post.tenantId === null && post.isPublished && post.isIndexable !== false && !isRegistrationOnlySlug(post.slug)).map((post) => ({ ...post, kind: "post" }))
];
var publicContentBrand = (value) => String(value || "").replace(/Elo Log|Atendo One/gi, publicSeoConfig().siteName);
var publicContentCanonical = (item) => {
  const configuredCanonical = safePublicUrl(item.canonicalUrl);
  if (configuredCanonical) return configuredCanonical;
  const section = item.publicPath === "elo-log" ? "elo-log" : "conteudo";
  const itemPath = section === "elo-log" && item.slug === "elo-log" ? section : `${section}/${encodeURIComponent(item.slug)}`;
  return `${publicSeoConfig().canonicalUrl}/${itemPath}`;
};
var publicContentPayload = (item) => ({
  ...item,
  title: publicContentBrand(item.title),
  excerpt: publicContentBrand(item.excerpt),
  metaTitle: publicContentBrand(item.metaTitle),
  metaDescription: publicContentBrand(item.metaDescription),
  author: publicContentBrand(item.author),
  canonicalUrl: publicContentCanonical(item),
  content: sanitizePublicContent(item.content)
});
apiRouter.post("/analytics/visit", (req, res) => {
  const body = req.body || {};
  const referrer = String(body.referrer || "").trim().slice(0, 120);
  const host = referrer ? (() => {
    try {
      return new URL(referrer).hostname.toLowerCase();
    } catch {
      return "";
    }
  })() : "";
  const source = String(body.source || (host.includes("google.") ? "Google" : host.includes("bing.") ? "Bing" : /facebook|instagram|linkedin|tiktok|youtube/.test(host) ? "Rede social" : host ? host : "Acesso direto")).slice(0, 80);
  const medium = String(body.medium || (host ? "refer\xEAncia web" : "direto")).slice(0, 40);
  const campaign = String(body.campaign || "").slice(0, 120);
  const device = String(body.device || "desconhecido").slice(0, 30);
  const path4 = String(body.path || "/").replace(/[^\w\-./?=&%]/g, "").slice(0, 160) || "/";
  db.recordVisit({ date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), path: path4, source, medium, campaign, referrer: host, device, country: "" });
  return res.status(204).end();
});
apiRouter.get("/public/seo", (req, res) => {
  res.json({ seo: publicSeoConfig(), content: publicContentItems().map((item) => ({
    kind: item.kind,
    slug: item.slug,
    title: publicContentBrand(item.title),
    excerpt: publicContentBrand(item.excerpt || ""),
    updatedAt: item.updatedAt,
    canonicalUrl: publicContentCanonical(item),
    publicPath: item.publicPath === "elo-log" ? "elo-log" : "conteudo"
  })) });
});
apiRouter.get("/public/content", (req, res) => {
  res.json(publicContentItems().map(publicContentPayload));
});
apiRouter.get("/public/content/:slug", (req, res) => {
  const item = publicContentItems().find((content) => content.slug === req.params.slug);
  if (!item) return res.status(404).json({ error: "Conte\xFAdo p\xFAblico n\xE3o encontrado." });
  const requestedSection = String(req.query.section || "").trim();
  const itemSection = item.publicPath === "elo-log" ? "elo-log" : "conteudo";
  if (requestedSection && ["conteudo", "elo-log"].includes(requestedSection) && requestedSection !== itemSection) {
    return res.status(404).json({ error: "Conte\xFAdo p\xFAblico n\xE3o encontrado nesta se\xE7\xE3o." });
  }
  res.json(publicContentPayload(item));
});
apiRouter.get("/public/registration-content/:slug", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!registrationOnlyContentSlugs.has(slug)) return res.status(404).json({ error: "Conte\xFAdo dispon\xEDvel somente no cadastro n\xE3o encontrado." });
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  const item = [...db.pages, ...db.posts].find((content) => content.tenantId === null && content.slug === slug && content.isPublished);
  if (!item) return res.status(404).json({ error: "Conte\xFAdo legal ainda n\xE3o foi publicado." });
  res.json({ ...item, content: sanitizePublicContent(item.content) });
});
var normalizePublicPlate = (value) => String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
var normalizePublicIdentity = (value) => String(value || "").replace(/\D/g, "");
var publicFreightSummary = (freight) => ({
  id: freight.id,
  code: freight.code,
  operationType: freight.operationType || "CARGA_GERAL",
  originCity: freight.origin.city,
  originState: freight.origin.state,
  destinationCity: freight.destination.city,
  destinationState: freight.destination.state,
  date: freight.origin.date,
  cargoType: freight.cargo.description,
  weightKg: freight.cargo.weightKg,
  vehicleType: freight.requirements.vehicleType,
  bodyType: freight.requirements.bodyTypeRequired,
  minCapacityKg: freight.requirements.minCapacityKg,
  interestEnabled: freight.publicInterestEnabled !== false,
  publishedAt: freight.publicPublishedAt
});
var driverCanSeeFreightPrice = (driverId, freight) => {
  if (!driverId) return false;
  return db.driverCompanyLinks.some((link) => link.driverId === driverId && link.tenantId === freight.tenantId && link.status === "APROVADO" && (link.scope === "EMPRESA" || link.scope === "FRETE" && link.freightId === freight.id && freight.publicPriceVisibleToRegistered === true));
};
var redactDriverFreightPayment = (freight, driverId) => driverCanSeeFreightPrice(driverId, freight) ? freight : { ...freight, payment: { ...freight.payment, price: void 0, clientRevenue: void 0, driverCost: void 0, notes: void 0 } };
var isPublicFreight = (freight) => {
  const expiresAt = freight.origin.date ? /* @__PURE__ */ new Date(`${freight.origin.date}T23:59:59`) : null;
  return freight.publicListingEnabled === true && ["DISPONIVEL", "PUBLICADO"].includes(freight.status) && (!expiresAt || expiresAt.getTime() >= Date.now());
};
var isPublicTrackingFreight = (freight) => freight.publicTrackingEnabled !== false && !["RASCUNHO", "CANCELADO"].includes(freight.status);
var trackingSubscribers = /* @__PURE__ */ new Map();
apiRouter.get("/mapbox/geocode", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Autentica\xE7\xE3o necess\xE1ria." });
  const query = String(req.query.q || "").trim().slice(0, 180);
  const token = db.saasGlobalConfig.mapboxConfig?.apiKey || process.env.MAPBOX_ACCESS_TOKEN || "";
  if (query.length < 3) return res.json([]);
  if (!token) return res.status(503).json({ error: "Mapbox n\xE3o configurado." });
  try {
    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=br&language=pt-BR&limit=5&access_token=${encodeURIComponent(token)}`);
    if (!response.ok) return res.status(502).json({ error: "N\xE3o foi poss\xEDvel consultar o Mapbox." });
    const data = await response.json();
    return res.json((data.features || []).filter((item) => item.center).map((item) => ({ id: item.id, placeName: item.place_name, address: item.text || item.place_name, city: item.context?.find((c) => c.id.startsWith("place"))?.text, state: item.context?.find((c) => c.id.startsWith("region"))?.text, lng: item.center[0], lat: item.center[1] })));
  } catch {
    return res.status(502).json({ error: "Falha de comunica\xE7\xE3o com o Mapbox." });
  }
});
apiRouter.get("/mapbox/directions", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Autentica\xE7\xE3o necess\xE1ria." });
  const origin = String(req.query.origin || "").split(",").map(Number);
  const destination = String(req.query.destination || "").split(",").map(Number);
  const token = db.saasGlobalConfig.mapboxConfig?.apiKey || process.env.MAPBOX_ACCESS_TOKEN || "";
  if (origin.length !== 2 || destination.length !== 2 || origin.some(Number.isNaN) || destination.some(Number.isNaN)) return res.status(400).json({ error: "Coordenadas de origem e destino inv\xE1lidas." });
  if (!token) return res.status(503).json({ error: "Mapbox n\xE3o configurado." });
  try {
    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin.join(",")};${destination.join(",")}?overview=false&access_token=${encodeURIComponent(token)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.routes?.[0]) return res.status(502).json({ error: "N\xE3o foi poss\xEDvel calcular a rota no Mapbox." });
    const route = data.routes[0];
    return res.json({ distanceKm: Number(route.distance || 0) / 1e3, estimatedMinutes: Number(route.duration || 0) / 60 });
  } catch {
    return res.status(502).json({ error: "Falha de comunica\xE7\xE3o com o Mapbox." });
  }
});
apiRouter.get("/mapbox/client-config", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Autentica\xE7\xE3o necess\xE1ria." });
  const token = db.saasGlobalConfig.mapboxConfig?.apiKey || process.env.MAPBOX_ACCESS_TOKEN || "";
  const isPublicToken = token.startsWith("pk.");
  return res.json({ enabled: Boolean(db.saasGlobalConfig.mapboxConfig?.enabled && isPublicToken), apiKey: isPublicToken ? token : "", defaultStyle: db.saasGlobalConfig.mapboxConfig?.defaultStyle || "streets-v12", defaultZoom: db.saasGlobalConfig.mapboxConfig?.defaultZoom || 12 });
});
apiRouter.get("/public/freights", (req, res) => {
  res.json(db.freights.filter(isPublicFreight).map(publicFreightSummary));
});
var publicTrackingPayload = (freight) => {
  const policy = db.tenants.find((tenant) => tenant.id === freight["tenantId"])?.publicTracking || db.saasGlobalConfig.publicTracking || { enabled: true, precision: "APPROXIMATE", allowedFields: ["route", "status", "vehicle", "driver", "location", "stops"] };
  const allowed = new Set(policy.allowedFields);
  const location = freight.currentLocation && allowed.has("location") ? {
    ...freight.currentLocation,
    lat: policy.precision === "EXACT" ? freight.currentLocation.lat : Number(freight.currentLocation.lat.toFixed(2)),
    lng: policy.precision === "EXACT" ? freight.currentLocation.lng : Number(freight.currentLocation.lng.toFixed(2))
  } : void 0;
  return {
    id: freight.id,
    code: freight.code,
    tenantName: freight.tenantName,
    origin: allowed.has("route") ? { city: freight.origin.city, state: freight.origin.state, address: freight.origin.address, date: freight.origin.date, timeWindow: freight.origin.timeWindow } : void 0,
    destination: allowed.has("route") ? { city: freight.destination.city, state: freight.destination.state, address: freight.destination.address, date: freight.destination.date, timeWindow: freight.destination.timeWindow } : void 0,
    distanceKm: freight.distanceKm,
    cargo: { description: freight.cargo.description, type: freight.cargo.type, weightKg: freight.cargo.weightKg, volumeCount: freight.cargo.volumeCount },
    status: allowed.has("status") ? freight.status : void 0,
    assignedDriverName: allowed.has("driver") ? freight.assignedDriverName : void 0,
    assignedVehiclePlate: allowed.has("vehicle") ? freight.assignedVehiclePlate : void 0,
    assignedVehicleModel: allowed.has("vehicle") ? freight.assignedVehicleModel : void 0,
    currentLocation: location,
    trackingStops: allowed.has("stops") ? freight.trackingStops || [
      { id: `${freight.id}-origin`, type: "ORIGEM", city: freight.origin.city, state: freight.origin.state, status: ["EM_TRANSITO", "ENTREGUE", "FINALIZADO"].includes(freight.status) ? "CONCLUIDA" : "EM_ANDAMENTO" },
      { id: `${freight.id}-destination`, type: "DESTINO", city: freight.destination.city, state: freight.destination.state, status: ["ENTREGUE", "FINALIZADO"].includes(freight.status) ? "CONCLUIDA" : "PENDENTE" }
    ] : [],
    statusUpdatedAt: freight.updatedAt
  };
};
apiRouter.get("/public/tracking/:token", (req, res) => {
  const token = String(req.params.token || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(token)) return res.status(404).json({ error: "Rastreamento p\xFAblico n\xE3o encontrado ou encerrado." });
  const freight = db.freights.find((item) => (isPublicFreight(item) || isPublicTrackingFreight(item)) && item.publicTrackingToken === token && !item.publicTrackingRevokedAt && (!item.publicTrackingExpiresAt || new Date(item.publicTrackingExpiresAt).getTime() > Date.now()));
  if (!freight) return res.status(404).json({ error: "Rastreamento p\xFAblico n\xE3o encontrado ou encerrado." });
  const tenantPolicy = db.tenants.find((tenant) => tenant.id === freight["tenantId"])?.publicTracking;
  if (tenantPolicy?.enabled === false || !tenantPolicy && db.saasGlobalConfig.publicTracking?.enabled === false) return res.status(404).json({ error: "Rastreamento p\xFAblico desativado." });
  return res.json(publicTrackingPayload(freight));
});
apiRouter.get("/public/tracking/:token/events", (req, res) => {
  const token = String(req.params.token || "").trim();
  const freight = db.freights.find((item) => item.publicTrackingToken === token && isPublicTrackingFreight(item) && !item.publicTrackingRevokedAt && (!item.publicTrackingExpiresAt || new Date(item.publicTrackingExpiresAt).getTime() > Date.now()));
  if (!freight) return res.status(404).json({ error: "Rastreamento p\xFAblico n\xE3o encontrado ou encerrado." });
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const listeners = trackingSubscribers.get(token) || /* @__PURE__ */ new Set();
  listeners.add(res);
  trackingSubscribers.set(token, listeners);
  res.write(`event: tracking
data: ${JSON.stringify(publicTrackingPayload(freight))}

`);
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\\n\\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25e3);
  req.on("close", () => {
    clearInterval(heartbeat);
    listeners.delete(res);
    if (!listeners.size) trackingSubscribers.delete(token);
  });
});
apiRouter.post("/public/freights/:id/interest", async (req, res) => {
  const freight = db.freights.find((item) => item.id === req.params.id);
  if (!freight || !isPublicFreight(freight)) return res.status(404).json({ error: "Frete p\xFAblico n\xE3o encontrado ou encerrado." });
  const name = String(req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  if (name.length < 5 || normalizePublicIdentity(phone).length < 10) return res.status(400).json({ error: "Informe nome completo e telefone v\xE1lido." });
  if (req.body?.termsAccepted !== true || req.body?.privacyAccepted !== true) return res.status(400).json({ error: "\xC9 necess\xE1rio aceitar os Termos de Uso e a Pol\xEDtica de Privacidade." });
  const cleanPhone = normalizePhoneForLookup(phone);
  const lastInterestAttempt = publicInterestAttempts.get(cleanPhone);
  if (lastInterestAttempt && Date.now() - lastInterestAttempt < PUBLIC_INTEREST_RATE_WINDOW_MS) return res.status(429).json({ error: "J\xE1 recebemos uma solicita\xE7\xE3o para este telefone. Aguarde alguns minutos antes de tentar novamente." });
  publicInterestAttempts.set(cleanPhone, Date.now());
  if (publicInterestAttempts.size > 1e4) {
    for (const [key, timestamp] of publicInterestAttempts) if (Date.now() - timestamp >= PUBLIC_INTEREST_RATE_WINDOW_MS) publicInterestAttempts.delete(key);
  }
  const phoneMatches = db.users.filter((user2) => normalizePhoneForLookup(user2.phone) === cleanPhone);
  if (phoneMatches.length > 1) return res.status(409).json({ error: "Este telefone est\xE1 associado a mais de uma conta. Solicite suporte para evitar uma vincula\xE7\xE3o incorreta." });
  const phoneOwner = phoneMatches[0];
  if (phoneOwner && phoneOwner.role !== "MOTORISTA") return res.status(409).json({ error: "Este telefone j\xE1 est\xE1 associado a outro tipo de conta e n\xE3o pode ser duplicado como motorista." });
  const existingUser = phoneOwner;
  let driver = existingUser?.driverId ? db.drivers.find((item) => item.id === existingUser.driverId || item.userId === existingUser.id) : void 0;
  let user = existingUser;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (user && !driver) return res.status(409).json({ error: "Este telefone est\xE1 associado a uma conta de motorista sem perfil completo. Solicite suporte." });
  if (!user) {
    const userId = `user-driver-public-${Date.now()}`;
    const driverId = `driver-public-${Date.now()}`;
    user = { id: userId, tenantId: null, name, email: "", phone, role: "MOTORISTA", status: "PENDENTE", accountType: "REAL", readOnly: false, driverId, lastLoginAt: null, createdAt: now };
    driver = { id: driverId, userId, tenantId: null, name, cpf: "", rg: "", birthDate: "", phone, email: "", zipCode: "", address: "", city: "", state: "", cnh: "", cnhCategory: "B", cnhExpiresAt: "", status: "PENDENTE", rating: 0, completedTrips: 0, vehiclesCount: 0, createdAt: now };
    db.users.push(user);
    db.drivers.push(driver);
  } else {
    user.name = name;
    if (driver && !driver.name) driver.name = name;
  }
  if (!driver || !user) return res.status(500).json({ error: "N\xE3o foi poss\xEDvel preparar o cadastro do motorista." });
  const existingInterest = db.freightInterests.find((item) => item.freightId === freight.id && item.driverId === driver.id && ["PENDENTE", "APROVADO"].includes(item.status));
  if (existingInterest) return res.status(409).json({ error: existingInterest.status === "APROVADO" ? "Este motorista j\xE1 foi aprovado para o frete." : "J\xE1 existe uma solicita\xE7\xE3o pendente para este frete." });
  const companyLink = db.getDriverCompanyLink(driver.id, freight.tenantId);
  const freightLink = db.getDriverCompanyLink(driver.id, freight.tenantId, freight.id);
  if (companyLink?.status === "BLOQUEADO" || freightLink?.status === "BLOQUEADO") return res.status(403).json({ error: "A empresa bloqueou novas solicita\xE7\xF5es deste motorista." });
  const interest = { id: `freight-interest-${Date.now()}`, freightId: freight.id, driverId: driver.id, userId: user.id, tenantId: freight.tenantId, status: "PENDENTE", profileCompleted: false, createdAt: now, updatedAt: now };
  db.freightInterests.unshift(interest);
  db.upsertDriverCompanyLink({ driverId: driver.id, tenantId: freight.tenantId, status: "PENDENTE", scope: "FRETE", source: "FREIGHT_INTEREST", freightId: freight.id });
  db.addAuditLog({ ip: requestIp(req), tenantId: freight.tenantId, userId: user.id, userName: name, userRole: "MOTORISTA", action: "INTERESSE_FRETE", entity: "FreightInterest", entityId: interest.id, details: `Solicita\xE7\xE3o de interesse no frete ${freight.code} criada para an\xE1lise da empresa.` });
  const code = (0, import_crypto.randomInt)(1e5, 1e6).toString();
  const expiresAt = Date.now() + 5 * 60 * 1e3;
  activeOTPs.set(cleanPhone, { code, expiresAt, failedAttempts: 0 });
  activeOTPs.set(user.id, { code, expiresAt, failedAttempts: 0 });
  const waResult = await sendToWhatsAppGateway(resolveWhatsAppConfig(freight.tenantId), { number: cleanPhone, body: `ELO LOG: seu c\xF3digo para concluir o cadastro de interesse no frete ${freight.code} \xE9 ${code}. V\xE1lido por 5 minutos.`, externalKey: `freight-interest-${Date.now()}` });
  await db.persistNow();
  if (!waResult.success) return res.status(502).json({ error: "N\xE3o foi poss\xEDvel enviar o c\xF3digo pelo WhatsApp. Solicite novamente em alguns instantes." });
  res.status(201).json({ success: true, userId: user.id, message: "C\xF3digo enviado pelo WhatsApp. Valide o telefone para continuar." });
});
apiRouter.use(authMiddleware);
apiRouter.get("/health/detailed", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas Super Admin." });
  const sqlStatus = await sqlAdapter.getStatus();
  const postgresConnected = sqlAdapter.isEnabled() && sqlStatus.status === "CONNECTED";
  return res.json({ status: "ok", version: process.env.APP_VERSION || APP_VERSION, uptimeSeconds: Math.floor(process.uptime()), counts: { tenants: db.tenants.length, users: db.users.length, freights: db.freights.length, budgets: db.budgets.length, clients: db.clients.length, gpsLocations: db.freightLocations.length, notifications: db.notifications.length }, integrations: { mapboxConfigured: Boolean(db.saasGlobalConfig.mapboxConfig?.apiKey), cnpjWsConfigured: true, postgresConfigured: postgresConnected }, persistence: { mode: postgresConnected ? "postgresql" : "memory-with-snapshot", lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString() }, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
});
apiRouter.post("/freights/:id/public-tracking/revoke", async (req, res) => {
  const freight = db.freights.find((item) => item["id"] === req.params.id);
  if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado." });
  if (req.user?.role !== "SUPER_ADMIN" && freight.tenantId !== req.user?.tenantId) return res.status(403).json({ error: "Acesso n\xE3o autorizado." });
  freight.publicTrackingRevokedAt = req.body?.revoked === false ? void 0 : (/* @__PURE__ */ new Date()).toISOString();
  freight.publicTrackingEnabled = req.body?.revoked === false;
  freight.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await db.persistNow();
  return res.json({ success: true, revoked: Boolean(freight.publicTrackingRevokedAt), freightId: freight.id });
});
apiRouter.get("/analytics/visits", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode consultar analytics." });
  const requestedDays = Number(req.query.days || 30);
  res.json(db.getVisitAnalytics(Number.isFinite(requestedDays) ? requestedDays : 30));
});
var readBackupEventSecret = () => {
  try {
    return import_fs2.default.readFileSync(BACKUP_EVENT_SECRET_FILE, "utf8").trim();
  } catch {
    return "";
  }
};
var verifyBackupEvent = (body, signatureHeader) => {
  const secret = readBackupEventSecret();
  const state = String(body?.state || "");
  const timestamp = Number(body?.timestamp);
  const runId = String(body?.runId || "");
  const signature = String(signatureHeader || "").replace(/^sha256=/, "").trim().toLowerCase();
  if (!secret || !BACKUP_STATE_VALUES.has(state) || !Number.isSafeInteger(timestamp) || !isSafeRunId(runId) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(Date.now() - timestamp * 1e3) > BACKUP_EVENT_MAX_SKEW_MS) return false;
  const signingInput = `${timestamp}.${state}.${runId}`;
  const expected = (0, import_crypto.createHmac)("sha256", secret).update(signingInput).digest("hex");
  try {
    return (0, import_crypto.timingSafeEqual)(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
};
var sendBackupWhatsAppAlert = async (state, backupName, errorCode, runId) => {
  const config = backupNotificationConfig();
  const shouldSend = config.enabled && config.whatsappEnabled && Boolean(config.whatsappPhone) && (state === "ERROR" ? config.notifyOnFailure : config.notifyOnSuccess);
  if (!shouldSend) return { sent: false, message: "Alerta WhatsApp desativado para este evento." };
  const when = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const body = state === "ERROR" ? `Atendo One: o backup di\xE1rio apresentou falha em ${when}. C\xF3digo: ${errorCode || "BACKUP_FAILED"}. Consulte o painel Super Admin.` : `Atendo One: o backup di\xE1rio foi conclu\xEDdo em ${when}. C\xF3pia: ${backupName}. Reten\xE7\xE3o local validada.`;
  try {
    const result = await sendToWhatsAppGateway(resolveWhatsAppConfig(), {
      number: config.whatsappPhone,
      body,
      externalKey: `backup-alert-${state.toLowerCase()}-${runId}`
    });
    if (!result.success) return { sent: false, message: "Gateway WhatsApp recusou o alerta de backup." };
    return { sent: true, message: "Alerta WhatsApp enviado." };
  } catch {
    return { sent: false, message: "Falha ao enviar o alerta WhatsApp de backup." };
  }
};
apiRouter.post("/internal/backups/event", async (req, res) => {
  if (!verifyBackupEvent(req.body, req.headers["x-backup-signature"])) return res.status(401).json({ error: "Evento de backup n\xE3o autorizado." });
  const state = String(req.body?.state || "");
  if (!["SUCCESS", "ERROR"].includes(state)) return res.status(400).json({ error: "Estado de backup inv\xE1lido." });
  const backupName = String(req.body?.backupName || "");
  const errorCode = String(req.body?.errorCode || "").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40);
  const runId = String(req.body?.runId || "");
  if (backupName && !isSafeBackupName(backupName)) return res.status(400).json({ error: "Nome de backup inv\xE1lido." });
  const alert = await sendBackupWhatsAppAlert(state, backupName, errorCode, runId);
  if (state === "ERROR") {
    db.addErrorLog({ service: "backup", route: "internal/backups/event", method: "POST", event: "BACKUP_FAILED", message: "O backup local informou uma falha; consulte o monitor do Super Admin." });
  }
  console.info("[Backup] Evento recebido", { state, alertSent: alert.sent });
  return res.json({ received: true, alertSent: alert.sent });
});
apiRouter.get("/notification-consent", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "N\xE3o autenticado." });
  const consent = req.user.notificationConsents || { email: true, whatsapp: false };
  return res.json({ email: consent.email !== false, whatsapp: consent.whatsapp === true, updatedAt: consent.updatedAt || null });
});
apiRouter.put("/notification-consent", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "N\xE3o autenticado." });
  if (isPublicDemoUser(req.user)) return res.status(403).json({ code: "DEMO_FEATURE_RESTRICTED", error: "O ambiente de demonstra\xE7\xE3o n\xE3o permite alterar prefer\xEAncias de comunica\xE7\xE3o." });
  const current = req.user.notificationConsents || { email: true, whatsapp: false };
  const consent = {
    email: req.body?.email === void 0 ? current.email !== false : Boolean(req.body.email),
    whatsapp: req.body?.whatsapp === true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "USER"
  };
  req.user.notificationConsents = consent;
  db.addAuditLog({ ip: requestIp(req), tenantId: req.user.tenantId || void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ATUALIZAR_CONSENTIMENTO_NOTIFICACOES", entity: "User", entityId: req.user.id, details: `Prefer\xEAncias de canal alteradas: e-mail ${consent.email ? "ativo" : "inativo"}; WhatsApp ${consent.whatsapp ? "autorizado" : "n\xE3o autorizado"}.` });
  await db.persistNow();
  return res.json({ email: consent.email, whatsapp: consent.whatsapp, updatedAt: consent.updatedAt });
});
apiRouter.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const excludePaths = [
      "/auth/login",
      "/auth/request-otp",
      "/auth/verify-otp",
      "/auth/register-company",
      "/auth/verify-registration",
      "/auth/register-driver"
    ];
    if (excludePaths.includes(req.path)) {
      return next();
    }
    if (isTestOrDemoUser(req.user)) {
      return res.status(403).json({
        code: "READ_ONLY_TEST_ACCOUNT",
        error: "Esta conta de teste \xE9 somente leitura. Perfis criados para teste ou demonstra\xE7\xE3o n\xE3o possuem permiss\xE3o para realizar opera\xE7\xF5es de grava\xE7\xE3o ou altera\xE7\xE3o no sistema."
      });
    }
  }
  next();
});
apiRouter.use((req, res, next) => {
  if (req.user && isPublicDemoUser(req.user)) {
    const restrictedPrefixes = ["/billing/asaas", "/admin/backups", "/integrations/whatsapp", "/saas/config", "/saas/notification-templates", "/tenant/notification-templates", "/tenant/report-templates", "/error-logs"];
    if (restrictedPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      return res.status(403).json({ code: "DEMO_FEATURE_RESTRICTED", error: "Esta fun\xE7\xE3o n\xE3o est\xE1 dispon\xEDvel no ambiente de demonstra\xE7\xE3o." });
    }
  }
  next();
});
apiRouter.get("/admin/backups/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  res.set("Cache-Control", "no-store");
  return res.json(await readBackupStatus());
});
apiRouter.put("/admin/backups/notifications", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Perfis de teste n\xE3o podem alterar alertas operacionais." });
  try {
    const next = backupNotificationConfigFromInput(req.body, backupNotificationConfig());
    db.saasGlobalConfig.backupNotifications = next;
    db.addAuditLog({ ip: requestIp(req), tenantId: void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "BACKUP_ALERT_CONFIG_UPDATED", entity: "BackupNotificationConfig", entityId: "global-backup-alerts", details: `Alertas de backup atualizados; WhatsApp ${next.whatsappEnabled && next.whatsappPhone ? "habilitado" : "desabilitado"}; falhas ${next.notifyOnFailure ? "ativas" : "inativas"}; sucessos ${next.notifyOnSuccess ? "ativos" : "inativos"}.` });
    await db.persistNow();
    return res.json({ success: true, notifications: safeBackupNotifications() });
  } catch (error) {
    return res.status(400).json({ error: error?.message || "Prefer\xEAncias de alerta de backup inv\xE1lidas." });
  }
});
apiRouter.post("/admin/backups/run", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Perfis de teste n\xE3o podem iniciar backups." });
  try {
    await import_fs2.default.promises.mkdir(BACKUP_REQUEST_DIR, { recursive: true, mode: 448 });
    const pending = (await import_fs2.default.promises.readdir(BACKUP_REQUEST_DIR)).some((name) => /^manual-[A-Za-z0-9-]+\.request$/.test(name));
    const current = await readBackupStatus();
    if (pending || current.state === "RUNNING") return res.status(409).json({ error: "J\xE1 existe um backup manual ou di\xE1rio em andamento." });
    const requestId = (0, import_crypto.randomUUID)();
    const target = import_path2.default.join(BACKUP_REQUEST_DIR, `manual-${requestId}.request`);
    const temporary = import_path2.default.join(BACKUP_REQUEST_DIR, `.manual-${requestId}.tmp`);
    await import_fs2.default.promises.writeFile(temporary, JSON.stringify({ requestedAt: (/* @__PURE__ */ new Date()).toISOString() }), { encoding: "utf8", mode: 384 });
    await import_fs2.default.promises.rename(temporary, target);
    db.addAuditLog({ ip: requestIp(req), tenantId: void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "BACKUP_MANUAL_REQUESTED", entity: "BackupJob", entityId: requestId, details: "Solicitou uma execu\xE7\xE3o manual do backup local pelo painel Super Admin." });
    await db.persistNow();
    return res.status(202).json({ success: true, requestId, status: "QUEUED", message: "Backup manual enfileirado. O status ser\xE1 atualizado pelo servi\xE7o de backup." });
  } catch {
    return res.status(503).json({ error: "O controle do backup n\xE3o est\xE1 dispon\xEDvel neste processo." });
  }
});
apiRouter.post("/admin/backups/whatsapp-test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Perfis de teste n\xE3o podem enviar alertas operacionais." });
  const config = backupNotificationConfig();
  if (!config.whatsappEnabled || !config.whatsappPhone) return res.status(400).json({ error: "Cadastre e ative um WhatsApp de alerta antes do teste." });
  try {
    const result = await sendToWhatsAppGateway(resolveWhatsAppConfig(), {
      number: config.whatsappPhone,
      body: `Atendo One: teste de alerta do backup realizado pelo painel Super Admin em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
      externalKey: `backup-alert-test-${Date.now()}`
    });
    db.addAuditLog({ ip: requestIp(req), tenantId: void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: result.success ? "BACKUP_ALERT_TEST_SENT" : "BACKUP_ALERT_TEST_FAILED", entity: "BackupNotificationConfig", entityId: "global-backup-alerts", details: result.success ? "Teste de alerta WhatsApp de backup enviado." : "Gateway recusou o teste de alerta WhatsApp de backup." });
    await db.persistNow();
    return res.status(result.success ? 200 : 502).json({ success: result.success, message: result.success ? "Mensagem de teste enviada." : "O gateway n\xE3o confirmou a mensagem de teste." });
  } catch {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel enviar a mensagem de teste pelo gateway WhatsApp." });
  }
});
apiRouter.get("/public/freights/:id", (req, res) => {
  const freight = db.freights.find((item) => item.id === req.params.id);
  if (!freight || !isPublicFreight(freight)) return res.status(404).json({ error: "Frete p\xFAblico n\xE3o encontrado ou encerrado." });
  if (!req.user) return res.status(401).json({ error: "Cadastre-se e valide seu telefone para consultar o valor." });
  const interest = req.user.driverId ? db.freightInterests.find((item) => item.freightId === freight.id && item.userId === req.user?.id && ["PENDENTE", "APROVADO"].includes(item.status)) : void 0;
  const hasApprovedCompanyLink = db.driverCompanyLinks.some((item) => item.driverId === req.user?.driverId && item.tenantId === freight.tenantId && item.scope === "EMPRESA" && item.status === "APROVADO");
  if (!hasApprovedCompanyLink && (!interest || interest.profileCompleted !== true)) return res.status(403).json({ error: "\xC9 necess\xE1rio concluir o cadastro do motorista antes de consultar este valor." });
  if (!hasApprovedCompanyLink && freight.publicPriceVisibleToRegistered === false) return res.json({ ...publicFreightSummary(freight), price: null, priceAvailable: false, message: "A empresa optou por n\xE3o exibir o valor publicamente." });
  return res.json({ ...publicFreightSummary(freight), price: freight.payment.price, priceAvailable: true });
});
apiRouter.post("/public/freights/:id/interest/complete", async (req, res) => {
  const user = req.user;
  if (!user || user.role !== "MOTORISTA" || !user.driverId) return res.status(403).json({ error: "Somente o motorista autenticado pode concluir este cadastro." });
  const freight = db.freights.find((item) => item.id === req.params.id);
  const driver = db.drivers.find((item) => item.id === user.driverId || item.userId === user.id);
  if (!freight || !driver) return res.status(404).json({ error: "Solicita\xE7\xE3o ou motorista n\xE3o encontrado." });
  const interest = db.freightInterests.find((item) => item.freightId === freight.id && item.driverId === driver.id && item.status === "PENDENTE");
  if (!interest) return res.status(404).json({ error: "Solicita\xE7\xE3o pendente n\xE3o encontrada." });
  const body = req.body || {};
  const required = ["email", "cpf", "cnh", "cnhCategory", "cnhExpiresAt", "city", "state", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehiclePlate", "capacityKg"];
  if (required.some((key) => !String(body[key] || "").trim())) return res.status(400).json({ error: "Conclua todas as informa\xE7\xF5es obrigat\xF3rias do motorista e do ve\xEDculo." });
  const cleanCpf = normalizePublicIdentity(body.cpf);
  const cleanCnh = normalizePublicIdentity(body.cnh);
  const cleanEmail = String(body.email).trim().toLowerCase();
  const duplicateDriver = db.drivers.find((item) => item.id !== driver.id && (cleanCpf && normalizePublicIdentity(item.cpf) === cleanCpf || cleanCnh && normalizePublicIdentity(item.cnh) === cleanCnh));
  const duplicateEmailUser = db.users.find((item) => item.id !== user.id && item.email && item.email.trim().toLowerCase() === cleanEmail);
  const duplicateEmailDriver = db.drivers.find((item) => item.userId !== user.id && item.email && item.email.trim().toLowerCase() === cleanEmail);
  if (duplicateDriver) return res.status(409).json({ error: "CPF ou CNH j\xE1 cadastrada em outro motorista. Verifique os dados ou solicite suporte." });
  if (duplicateEmailUser || duplicateEmailDriver) return res.status(409).json({ error: "Este e-mail j\xE1 est\xE1 associado a outro cadastro. Use outro e-mail ou solicite suporte." });
  const hasApprovedLink = db.driverCompanyLinks.some((item) => item.driverId === driver.id && item.status === "APROVADO");
  const nextDriverStatus = hasApprovedLink && driver.status !== "INATIVO" ? driver.status : "PENDENTE";
  const nextUserStatus = hasApprovedLink && user.status !== "BLOQUEADO" ? user.status : "PENDENTE";
  const completedAt = (/* @__PURE__ */ new Date()).toISOString();
  Object.assign(driver, { name: String(body.name || driver.name).trim(), email: cleanEmail, phone: user.phone, cpf: String(body.cpf).trim(), cnh: String(body.cnh).trim(), cnhCategory: String(body.cnhCategory), cnhExpiresAt: String(body.cnhExpiresAt), city: String(body.city).trim(), state: String(body.state).trim().toUpperCase(), status: nextDriverStatus, updatedAt: completedAt });
  user.name = driver.name;
  user.email = driver.email;
  user.status = nextUserStatus;
  user.termsAcceptedAt = completedAt;
  user.privacyAcceptedAt = completedAt;
  user.termsVersion = CURRENT_LEGAL_VERSIONS.terms;
  user.privacyVersion = CURRENT_LEGAL_VERSIONS.privacy;
  user.updatedAt = completedAt;
  const plate = normalizePublicPlate(body.vehiclePlate);
  const existingVehicle = db.vehicles.find((item) => normalizePublicPlate(item.plate) === plate && item.driverId !== driver.id);
  if (existingVehicle) return res.status(409).json({ error: "Esta placa j\xE1 est\xE1 vinculada a outro ve\xEDculo. Verifique os dados." });
  const existingDriverVehicle = db.vehicles.find((item) => item.driverId === driver.id);
  if (existingDriverVehicle) Object.assign(existingDriverVehicle, { type: String(body.vehicleType), brand: String(body.vehicleBrand).trim(), model: String(body.vehicleModel).trim(), year: Number(body.vehicleYear), plate: String(body.vehiclePlate).trim().toUpperCase(), capacityKg: Number(body.capacityKg), bodyType: String(body.bodyType || "BAU"), renavam: String(body.vehicleRenavam || existingDriverVehicle.renavam || ""), status: "ATIVO" });
  else db.vehicles.push({ id: `vehicle-public-${Date.now()}`, driverId: driver.id, tenantId: null, type: String(body.vehicleType), brand: String(body.vehicleBrand).trim(), model: String(body.vehicleModel).trim(), year: Number(body.vehicleYear), plate: String(body.vehiclePlate).trim().toUpperCase(), renavam: String(body.vehicleRenavam || ""), capacityKg: Number(body.capacityKg), bodyType: String(body.bodyType || "BAU"), status: "ATIVO", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
  interest.profileCompleted = true;
  interest.updatedAt = completedAt;
  await db.recordLegalConsent({ userId: user.id, tenantId: freight.tenantId, termsVersion: CURRENT_LEGAL_VERSIONS.terms, privacyVersion: CURRENT_LEGAL_VERSIONS.privacy, acceptedAt: completedAt });
  db.addAuditLog({ ip: requestIp(req), tenantId: freight.tenantId, userId: user.id, userName: user.name, userRole: "MOTORISTA", action: "CONCLUIR_CADASTRO_INTERESSE", entity: "FreightInterest", entityId: interest.id, details: `Cadastro complementar conclu\xEDdo; aguardando aprova\xE7\xE3o da empresa para o frete ${freight.code}.` });
  const companyAdmins = db.users.filter((item) => item.tenantId === freight.tenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(item.role));
  void dispatchConfiguredNotification("MOTORISTA_CADASTRADO", [user, ...companyAdmins], { nome: user.name, empresa: db.tenants.find((item) => item.id === freight.tenantId)?.name || "", status: user.status, freightCode: freight.code, tenantId: freight.tenantId, link: process.env.APP_URL || "" });
  await db.persistNow();
  res.json({ success: true, status: "PENDENTE", message: "Cadastro conclu\xEDdo e enviado para an\xE1lise da empresa." });
});
apiRouter.get("/driver-company-links", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Somente administradores podem consultar documentos e v\xEDnculos de motoristas." });
  const tenantId = req.user?.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") || void 0 : req.user?.tenantId || void 0;
  if (req.user?.role !== "SUPER_ADMIN" && !tenantId) return res.status(403).json({ error: "Empresa n\xE3o identificada." });
  const links = db.getCompanyDriverLinks(tenantId).map((link) => {
    const sourceDriver = db.drivers.find((item) => item.id === link.driverId);
    const driver = sourceDriver ? {
      name: sourceDriver.name,
      phone: sourceDriver.phone,
      email: sourceDriver.email,
      cpf: sourceDriver.cpf,
      rg: sourceDriver.rg,
      city: sourceDriver.city,
      state: sourceDriver.state,
      cnh: sourceDriver.cnh,
      cnhCategory: sourceDriver.cnhCategory,
      cnhExpiresAt: sourceDriver.cnhExpiresAt,
      status: sourceDriver.status,
      vehiclesCount: sourceDriver.vehiclesCount
    } : void 0;
    const freight = link.freightId ? db.freights.find((item) => item.id === link.freightId) : void 0;
    return { ...link, driver, freightCode: freight?.code, originCity: freight?.origin.city, destinationCity: freight?.destination.city };
  });
  res.json(links);
});
apiRouter.put("/driver-company-links/:id/status", (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem alterar aprova\xE7\xF5es de motoristas." });
  const link = db.driverCompanyLinks.find((item) => item.id === req.params.id);
  if (!link) return res.status(404).json({ error: "V\xEDnculo n\xE3o encontrado." });
  if (req.user?.role !== "SUPER_ADMIN" && link.tenantId !== req.user?.tenantId) return res.status(403).json({ error: "Este v\xEDnculo pertence a outra empresa." });
  const status = String(req.body?.status || "");
  const requestedScope = String(req.body?.scope || "");
  if (!["APROVADO", "RECUSADO", "BLOQUEADO"].includes(status)) return res.status(400).json({ error: "Status de v\xEDnculo inv\xE1lido." });
  if (requestedScope && !["FRETE", "EMPRESA"].includes(requestedScope)) return res.status(400).json({ error: "Escopo de v\xEDnculo inv\xE1lido." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const driver = db.drivers.find((item) => item.id === link.driverId);
  const driverUser = driver ? db.users.find((item) => item.id === driver.userId) : void 0;
  const isCompanyDecision = requestedScope === "EMPRESA" || link.scope === "EMPRESA" && !link.freightId;
  let companyLink;
  if (isCompanyDecision && driver) {
    companyLink = db.upsertDriverCompanyLink({ driverId: link.driverId, tenantId: link.tenantId, status, scope: "EMPRESA", source: link.source, ...status === "APROVADO" ? { approvedAt: now, approvedByUserId: req.user?.id } : { rejectedAt: now, rejectionReason: String(req.body?.reason || "") } });
  }
  if (!isCompanyDecision || link.scope === "FRETE") {
    link.status = status;
    link.updatedAt = now;
    link.approvedAt = status === "APROVADO" ? now : link.approvedAt;
    link.approvedByUserId = status === "APROVADO" ? req.user?.id : link.approvedByUserId;
    link.rejectedAt = status !== "APROVADO" ? now : link.rejectedAt;
    link.rejectionReason = status !== "APROVADO" ? String(req.body?.reason || "") : void 0;
  }
  const interest = link.freightId ? db.freightInterests.find((item) => item.driverId === link.driverId && item.freightId === link.freightId) : void 0;
  if (interest && (!isCompanyDecision || status === "APROVADO")) {
    interest.status = status === "APROVADO" ? "APROVADO" : "RECUSADO";
    interest.updatedAt = now;
    interest.reviewedAt = now;
    interest.reviewedByUserId = req.user?.id;
  }
  if (driver && status === "APROVADO") {
    driver.status = "DISPONIVEL";
    if (driverUser) driverUser.status = "ATIVO";
  }
  db.addAuditLog({ ip: requestIp(req), tenantId: link.tenantId, userId: req.user?.id || "system", userName: req.user?.name || "Sistema", userRole: req.user?.role || "ADMIN", action: "ATUALIZAR_VINCULO_MOTORISTA", entity: "DriverCompanyLink", entityId: companyLink?.id || link.id, details: `V\xEDnculo do motorista atualizado para ${status} no escopo ${isCompanyDecision ? "EMPRESA" : "FRETE"}. A decis\xE3o \xE9 exclusiva desta empresa.` });
  const linkedFreight = link.freightId ? db.freights.find((item) => item.id === link.freightId) : void 0;
  if (driverUser) void dispatchConfiguredNotification("INTERESSE_FRETE", [driverUser], { nome: driverUser.name, empresa: req.tenant?.name || "empresa respons\xE1vel", status, codigoFrete: linkedFreight?.code || "", link: process.env.APP_URL || "" });
  return res.json({ success: true, link, companyLink });
});
apiRouter.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) void db.persistNow();
    });
  }
  next();
});
var getAsaasBaseUrl = () => db.saasGlobalConfig.asaasConfig?.environment === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
var getAsaasHeaders = () => ({
  "Content-Type": "application/json",
  "User-Agent": `EloLog/${process.env.npm_package_version || "1.2.7"} (Node.js; production)`,
  access_token: db.saasGlobalConfig.asaasConfig?.apiKey || ""
});
var asaasEnabled = () => Boolean(db.saasGlobalConfig.asaasConfig?.enabled && db.saasGlobalConfig.asaasConfig?.apiKey);
var asaasCycles = /* @__PURE__ */ new Set(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUALLY", "YEARLY"]);
var asaasBillingTypes = /* @__PURE__ */ new Set(["PIX", "BOLETO", "CREDIT_CARD"]);
var asaasOpenSubscriptionStatuses = /* @__PURE__ */ new Set(["ACTIVE", "PENDING", "OVERDUE"]);
var normalizeAsaasPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return void 0;
  const candidate = digits.startsWith("55") ? digits : `55${digits}`;
  return /^55\d{10,11}$/.test(candidate) ? candidate : void 0;
};
var buildAsaasCustomerPayload = (tenant, externalReference = tenant.id) => {
  const payload = {
    name: tenant.legalName || tenant.name,
    email: tenant.email,
    externalReference
  };
  const cpfCnpj = String(tenant.cnpj || "").replace(/\D/g, "");
  if ([11, 14].includes(cpfCnpj.length)) payload.cpfCnpj = cpfCnpj;
  const mobilePhone = normalizeAsaasPhone(tenant.phone);
  if (mobilePhone) payload.mobilePhone = mobilePhone;
  return payload;
};
var asaasSafeError = (body, fallback) => {
  const code = String(body?.errors?.[0]?.code || "").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 80);
  return code ? `${fallback} (c\xF3digo ${code}).` : fallback;
};
var isOpenAsaasSubscription = (subscription) => {
  const status = String(subscription?.status || "").toUpperCase();
  return Boolean(subscription?.id) && (!status || asaasOpenSubscriptionStatuses.has(status));
};
var findAsaasSubscriptionByExternalReference = async (externalReference) => {
  const response = await fetch(`${getAsaasBaseUrl()}/subscriptions?externalReference=${encodeURIComponent(externalReference)}&limit=20`, { headers: getAsaasHeaders() });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("ASAAS_SUBSCRIPTION_LOOKUP_FAILED");
  const subscriptions = Array.isArray(body?.data) ? body.data : [];
  return subscriptions.find((item) => String(item?.externalReference || "") === externalReference && isOpenAsaasSubscription(item));
};
var findOpenAsaasSubscriptionForTenant = async (tenantId, customerId) => {
  const response = await fetch(`${getAsaasBaseUrl()}/subscriptions?customer=${encodeURIComponent(customerId)}&limit=100`, { headers: getAsaasHeaders() });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("ASAAS_SUBSCRIPTION_LOOKUP_FAILED");
  const prefix = `${tenantId}:`;
  const subscriptions = Array.isArray(body?.data) ? body.data : [];
  return subscriptions.find((item) => String(item?.externalReference || "").startsWith(prefix) && isOpenAsaasSubscription(item));
};
var DEFAULT_NOTIFICATION_MODULE_CONFIG = {
  enabled: true,
  freePlanName: "WhatsApp SaaS \u2014 Gratuito",
  freePlanDescription: "Notifica\xE7\xF5es usando o telefone oficial da plataforma.",
  ownNumberPlanName: "WhatsApp Pr\xF3prio da Empresa",
  ownNumberPlanDescription: "Notifica\xE7\xF5es usando o n\xFAmero e canal WhatsApp da empresa.",
  ownNumberMonthlyPrice: 89.9,
  assistedActivationPrice: 149.9,
  extraNumberMonthlyPrice: 29.9
};
var getNotificationModuleConfig = () => ({
  ...DEFAULT_NOTIFICATION_MODULE_CONFIG,
  ...db.saasGlobalConfig.notificationModule || {}
});
var getBillingTenant = (req, rawTenantId) => {
  const requestedTenantId = req.user?.role === "SUPER_ADMIN" ? String(rawTenantId || "").trim() : String(req.user?.tenantId || "").trim();
  return requestedTenantId ? db.tenants.find((item) => item.id === requestedTenantId) : void 0;
};
var canManageNotificationBilling = (req, tenant) => {
  if (!req.user || !tenant) return false;
  if (req.user.role === "SUPER_ADMIN") return true;
  return ["ADMIN", "EMPRESA_SUPER_ADMIN"].includes(req.user.role) && req.user.tenantId === tenant.id;
};
var planLimitsFromConfig = (plan) => ({
  maxUsers: Number(plan?.maxUsers) || (plan?.id === "EMPRESARIAL" ? 100 : plan?.id === "PROFISSIONAL" ? 25 : 5),
  maxDrivers: Number(plan?.maxDrivers) || (plan?.id === "EMPRESARIAL" ? 500 : plan?.id === "PROFISSIONAL" ? 100 : 20),
  maxFreightsMonthly: Number(plan?.maxFreightsMonthly) || (plan?.id === "EMPRESARIAL" ? 2e3 : plan?.id === "PROFISSIONAL" ? 500 : 50),
  customForms: plan?.id !== "BASICO",
  exportReports: true,
  prioritySupport: plan?.id === "EMPRESARIAL"
});
var applyPlanConfigToTenant = (tenant, plan) => {
  tenant.plan = plan.id;
  tenant.planLimits = planLimitsFromConfig(plan);
};
var stableSubscriptionReference = (tenantId) => `${tenantId}:subscription`;
var notificationStatusForTenant = (tenant) => {
  const plan = tenant.notificationPlan || "SAAS_FREE";
  const billingStatus = plan === "SAAS_FREE" ? "NOT_REQUIRED" : tenant.notificationBillingStatus || "PENDING";
  return {
    tenantId: tenant.id,
    plan,
    billingStatus,
    subscriptionId: tenant.notificationSubscriptionId,
    nextDueDate: tenant.notificationBillingNextDueDate,
    canUseOwnNumber: plan === "OWN_NUMBER" && billingStatus === "ACTIVE",
    config: getNotificationModuleConfig()
  };
};
var isNotificationSubscription = (subscription) => {
  return subscription?.product === "NOTIFICATION_MODULE" || subscription?.feature === "WHATSAPP_OWN_NUMBER" || String(subscription?.externalReference || "").includes(":WHATSAPP_OWN_NUMBER");
};
async function ensureAsaasCustomer(tenant) {
  const knownId = String(tenant.asaasCustomerId || "");
  if (knownId) return { id: knownId };
  const base = getAsaasBaseUrl();
  const query = await fetch(`${base}/customers?externalReference=${encodeURIComponent(tenant.id)}&limit=1`, { headers: getAsaasHeaders() });
  const listed = await query.json().catch(() => ({}));
  if (!query.ok) return { error: asaasSafeError(listed, "Falha ao consultar cliente Asaas.") };
  const existing = Array.isArray(listed?.data) ? listed.data[0] : void 0;
  if (existing?.id) return { id: String(existing.id) };
  const response = await fetch(`${base}/customers`, {
    method: "POST",
    headers: getAsaasHeaders(),
    body: JSON.stringify(buildAsaasCustomerPayload(tenant))
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { error: asaasSafeError(body, "Falha ao criar cliente Asaas.") };
  return { id: body.id ? String(body.id) : void 0, error: body.id ? void 0 : "Cliente Asaas n\xE3o retornou identificador." };
}
apiRouter.post("/billing/asaas/test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode testar o Asaas." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/myAccount`, { headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, "Falha na autentica\xE7\xE3o Asaas.") });
    return res.json({ success: true, accountName: body.name || body.companyName || "Conta Asaas autenticada", environment: db.saasGlobalConfig.asaasConfig?.environment });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel acessar o Asaas." });
  }
});
apiRouter.post("/billing/asaas/checkout", async (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para contratar plano." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const requestedTenantId = req.user.role === "SUPER_ADMIN" ? req.body?.tenantId : req.user.tenantId;
  const tenant = db.tenants.find((t) => t.id === requestedTenantId);
  const plan = db.saasGlobalConfig.plans.find((p) => p.id === req.body?.planId);
  if (!tenant || !plan) return res.status(400).json({ error: "Empresa ou plano n\xE3o encontrado." });
  const dueDate = req.body?.dueDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  try {
    const customer = await ensureAsaasCustomer(tenant);
    if (!customer.id) return res.status(502).json({ error: customer.error || "N\xE3o foi poss\xEDvel preparar o cliente Asaas." });
    const customerId = customer.id;
    if (!customerId) return res.status(400).json({ error: "N\xE3o foi poss\xEDvel obter o cliente Asaas." });
    const paymentResponse = await fetch(`${getAsaasBaseUrl()}/payments`, {
      method: "POST",
      headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customerId, billingType: req.body?.billingType || "PIX", value: Number(plan.price), dueDate, description: `Plano ${plan.name} \u2014 ${tenant.name}`, externalReference: `${tenant.id}:${plan.id}` })
    });
    const paymentBody = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) return res.status(paymentResponse.status).json({ error: asaasSafeError(paymentBody, "Falha ao criar cobran\xE7a Asaas.") });
    db.asaasPayments.unshift({ asaasPaymentId: paymentBody.id, tenantId: tenant.id, planId: plan.id, value: plan.price, status: paymentBody.status, invoiceUrl: paymentBody.invoiceUrl, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString(), webhookEventIds: [] });
    void dispatchConfiguredNotification("PAGAMENTO_CRIADO", db.users.filter((user) => user.tenantId === tenant.id && ["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(user.role)), {
      nome: req.user.name,
      empresa: tenant.name,
      plano: plan.name,
      valor: `R$ ${plan.price.toFixed(2)}`,
      tenantId: tenant.id,
      link: paymentBody.invoiceUrl || ""
    });
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_PAYMENT_CREATED", entity: "AsaasPayment", entityId: paymentBody.id, details: `Cobran\xE7a do plano ${plan.id} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}` });
    await db.persistNow();
    return res.status(201).json({ id: paymentBody.id, status: paymentBody.status, invoiceUrl: paymentBody.invoiceUrl, bankSlipUrl: paymentBody.bankSlipUrl, value: paymentBody.value, dueDate: paymentBody.dueDate });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel criar a cobran\xE7a Asaas." });
  }
});
apiRouter.post("/billing/asaas/subscribe", async (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para contratar plano." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const requestedTenantId = req.user.role === "SUPER_ADMIN" ? req.body?.tenantId : req.user.tenantId;
  const tenant = db.tenants.find((item) => item.id === requestedTenantId);
  const plan = db.saasGlobalConfig.plans.find((item) => item.id === req.body?.planId);
  const cycle = String(req.body?.cycle || "MONTHLY").toUpperCase();
  const billingType = String(req.body?.billingType || "PIX").toUpperCase();
  if (!tenant || !plan) return res.status(400).json({ error: "Empresa ou plano n\xE3o encontrado." });
  if (!asaasCycles.has(cycle) || !asaasBillingTypes.has(billingType)) return res.status(400).json({ error: "Ciclo ou forma de cobran\xE7a Asaas inv\xE1lidos." });
  if (billingType === "CREDIT_CARD") return res.status(400).json({ error: "Cart\xE3o de cr\xE9dito deve ser processado pelo Checkout Asaas ou por tokeniza\xE7\xE3o; esta rota n\xE3o recebe n\xFAmero, validade ou CVV." });
  const dueDate = String(req.body?.nextDueDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  let customer;
  try {
    customer = await ensureAsaasCustomer(tenant);
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel consultar o cliente Asaas." });
  }
  if (!customer.id) return res.status(502).json({ error: customer.error || "N\xE3o foi poss\xEDvel preparar o cliente Asaas." });
  const externalReference = stableSubscriptionReference(tenant.id);
  try {
    const existingExternal = await findOpenAsaasSubscriptionForTenant(tenant.id, customer.id) || await findAsaasSubscriptionByExternalReference(externalReference) || await findAsaasSubscriptionByExternalReference(`${tenant.id}:${plan.id}:subscription`);
    if (existingExternal?.id) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingLocal = db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === String(existingExternal.id));
      if (!existingLocal) {
        db.asaasSubscriptions.unshift({ asaasSubscriptionId: String(existingExternal.id), tenantId: tenant.id, planId: plan.id, value: Number(existingExternal.value || plan.price), billingType: existingExternal.billingType || billingType, cycle: existingExternal.cycle || cycle, status: existingExternal.status || "PENDING", nextDueDate: existingExternal.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now });
      }
      tenant.asaasCustomerId = customer.id;
      tenant.asaasSubscriptionId = String(existingExternal.id);
      tenant.billingStatus = existingExternal.status || "PENDING";
      tenant.billingCycle = existingExternal.cycle || cycle;
      tenant.billingNextDueDate = existingExternal.nextDueDate || dueDate;
      db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_SUBSCRIPTION_RECONCILED", entity: "AsaasSubscription", entityId: String(existingExternal.id), details: `Assinatura existente do plano ${plan.id} reconciliada por refer\xEAncia externa no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}.` });
      await db.persistNow();
      return res.status(200).json({ id: String(existingExternal.id), status: existingExternal.status || "PENDING", cycle: existingExternal.cycle || cycle, nextDueDate: existingExternal.nextDueDate || dueDate, value: existingExternal.value || Number(plan.price), reconciled: true });
    }
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel verificar uma assinatura Asaas existente." });
  }
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions`, {
      method: "POST",
      headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customer.id, billingType, nextDueDate: dueDate, value: Number(plan.price), cycle, description: `Plano ${plan.name} \u2014 ${tenant.name}`, externalReference })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, "Falha ao criar assinatura Asaas.") });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    tenant.asaasCustomerId = customer.id;
    tenant.asaasSubscriptionId = body.id;
    tenant.billingStatus = "PENDING";
    tenant.billingCycle = cycle;
    tenant.billingNextDueDate = body.nextDueDate || dueDate;
    const record = { asaasSubscriptionId: body.id, tenantId: tenant.id, planId: plan.id, value: Number(plan.price), billingType, cycle, status: body.status || "PENDING", nextDueDate: body.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now };
    db.asaasSubscriptions.unshift(record);
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_SUBSCRIPTION_CREATED", entity: "AsaasSubscription", entityId: String(body.id), details: `Assinatura recorrente do plano ${plan.id} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}.` });
    void dispatchConfiguredNotification("PAGAMENTO_CRIADO", db.users.filter((user) => user.tenantId === tenant.id && ["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(user.role)), { nome: req.user.name, empresa: tenant.name, plano: plan.name, valor: `R$ ${Number(plan.price).toFixed(2)}`, tenantId: tenant.id, link: body.invoiceUrl || "" });
    await db.persistNow();
    return res.status(201).json({ id: body.id, status: body.status, cycle, nextDueDate: body.nextDueDate || dueDate, value: body.value || Number(plan.price) });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel criar a assinatura Asaas." });
  }
});
apiRouter.post("/billing/asaas/subscription/cancel", async (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para cancelar assinatura." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.body?.tenantId || "") : String(req.user.tenantId || "");
  const tenant = db.tenants.find((item) => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada." });
  const subscription = db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === tenant.asaasSubscriptionId && item.tenantId === tenant.id) || db.asaasSubscriptions.find((item) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  if (!subscription?.asaasSubscriptionId) return res.status(404).json({ error: "Nenhuma assinatura principal encontrada para a empresa." });
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(String(subscription.asaasSubscriptionId))}`, { method: "DELETE", headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 404) return res.status(response.status).json({ error: asaasSafeError(body, "Falha ao cancelar assinatura Asaas.") });
    subscription.status = "INACTIVE";
    subscription.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    tenant.billingStatus = "INACTIVE";
    tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_SUBSCRIPTION_CANCELED", entity: "AsaasSubscription", entityId: String(subscription.asaasSubscriptionId), details: `Assinatura principal cancelada${response.status === 404 ? " ap\xF3s confirma\xE7\xE3o de aus\xEAncia no Asaas" : ""}.` });
    await db.persistNow();
    return res.json({ success: true, status: "INACTIVE", subscription: { id: subscription.asaasSubscriptionId, planId: subscription.planId, cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel cancelar a assinatura Asaas." });
  }
});
apiRouter.post("/billing/asaas/subscription/change-plan", async (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para trocar de plano." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.body?.tenantId || "") : String(req.user.tenantId || "");
  const tenant = db.tenants.find((item) => item.id === tenantId);
  const targetPlanId = String(req.body?.planId || "").toUpperCase();
  const plan = db.saasGlobalConfig.plans.find((item) => item.id === targetPlanId);
  if (!tenant || !plan) return res.status(400).json({ error: "Empresa ou plano de destino n\xE3o encontrado." });
  if (tenant.plan === plan.id) return res.status(400).json({ error: "A empresa j\xE1 est\xE1 neste plano." });
  const subscription = db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === tenant.asaasSubscriptionId && item.tenantId === tenant.id) || db.asaasSubscriptions.find((item) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  if (!subscription?.asaasSubscriptionId) return res.status(409).json({ error: "A empresa n\xE3o possui assinatura principal local para alterar." });
  if (!["ACTIVE", "PENDING", "OVERDUE"].includes(String(subscription.status || "").toUpperCase())) return res.status(409).json({ error: "A assinatura principal n\xE3o est\xE1 ativa ou pendente para troca de plano." });
  const cycle = String(req.body?.cycle || subscription.cycle || "MONTHLY").toUpperCase();
  const billingType = String(req.body?.billingType || subscription.billingType || "PIX").toUpperCase();
  if (!asaasCycles.has(cycle) || !asaasBillingTypes.has(billingType)) return res.status(400).json({ error: "Ciclo ou forma de cobran\xE7a Asaas inv\xE1lidos." });
  if (billingType === "CREDIT_CARD") return res.status(400).json({ error: "A troca com cart\xE3o deve usar Checkout Asaas ou tokeniza\xE7\xE3o segura; esta rota n\xE3o recebe n\xFAmero, validade ou CVV." });
  const nextDueDate = req.body?.nextDueDate === void 0 ? void 0 : String(req.body.nextDueDate || "");
  if (nextDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) return res.status(400).json({ error: "A pr\xF3xima data de vencimento deve usar o formato AAAA-MM-DD." });
  const updatePendingPayments = req.body?.updatePendingPayments === true;
  const payload = { value: Number(plan.price), cycle, billingType, description: `Plano ${plan.name} \u2014 ${tenant.name}`, updatePendingPayments };
  if (nextDueDate) payload.nextDueDate = nextDueDate;
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(String(subscription.asaasSubscriptionId))}`, { method: "PUT", headers: getAsaasHeaders(), body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, "Falha ao atualizar assinatura Asaas.") });
    applyPlanConfigToTenant(tenant, plan);
    subscription.planId = plan.id;
    subscription.value = Number(body.value ?? plan.price);
    subscription.cycle = body.cycle || cycle;
    subscription.billingType = body.billingType || billingType;
    subscription.status = body.status || subscription.status;
    subscription.nextDueDate = body.nextDueDate || nextDueDate || subscription.nextDueDate;
    subscription.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    tenant.billingStatus = subscription.status || "PENDING";
    tenant.billingCycle = subscription.cycle;
    tenant.billingNextDueDate = subscription.nextDueDate;
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_SUBSCRIPTION_PLAN_CHANGED", entity: "AsaasSubscription", entityId: String(subscription.asaasSubscriptionId), details: `Plano alterado para ${plan.id}; cobran\xE7as pendentes atualizadas: ${updatePendingPayments ? "sim" : "n\xE3o"}.` });
    await db.persistNow();
    return res.json({ success: true, id: subscription.asaasSubscriptionId, planId: plan.id, status: subscription.status, cycle: subscription.cycle, billingType: subscription.billingType, value: subscription.value, nextDueDate: subscription.nextDueDate });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel atualizar a assinatura Asaas." });
  }
});
apiRouter.get("/billing/asaas/notification-module", (req, res) => {
  const tenant = getBillingTenant(req, req.query.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: "Sem permiss\xE3o para consultar o m\xF3dulo de notifica\xE7\xF5es desta empresa." });
  return res.json(notificationStatusForTenant(tenant));
});
apiRouter.post("/billing/asaas/notification-module/free", async (req, res) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: "Sem permiss\xE3o para configurar o m\xF3dulo desta empresa." });
  const moduleConfig = getNotificationModuleConfig();
  if (!moduleConfig.enabled) return res.status(409).json({ error: "O m\xF3dulo de notifica\xE7\xF5es est\xE1 temporariamente indispon\xEDvel." });
  if (tenant.notificationSubscriptionId && ["PENDING", "ACTIVE", "OVERDUE"].includes(tenant.notificationBillingStatus || "")) {
    return res.status(409).json({ error: "A assinatura do n\xFAmero pr\xF3prio ainda est\xE1 ativa ou pendente. Cancele-a no Asaas antes de voltar ao telefone SaaS." });
  }
  tenant.notificationPlan = "SAAS_FREE";
  tenant.notificationBillingStatus = "NOT_REQUIRED";
  tenant.notificationSubscriptionId = void 0;
  tenant.notificationBillingNextDueDate = void 0;
  tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "NOTIFICATION_MODULE_FREE_SELECTED", entity: "NotificationModule", entityId: tenant.id, details: "M\xF3dulo gratuito selecionado com uso do telefone SaaS." });
  await db.persistNow();
  return res.json(notificationStatusForTenant(tenant));
});
apiRouter.post("/billing/asaas/notification-module/subscribe", async (req, res) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: "Sem permiss\xE3o para contratar o m\xF3dulo desta empresa." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const moduleConfig = getNotificationModuleConfig();
  if (!moduleConfig.enabled) return res.status(409).json({ error: "O m\xF3dulo de notifica\xE7\xF5es est\xE1 temporariamente indispon\xEDvel." });
  if (tenant.notificationSubscriptionId && ["PENDING", "ACTIVE", "OVERDUE"].includes(tenant.notificationBillingStatus || "")) return res.status(409).json({ error: "Esta empresa j\xE1 possui uma assinatura do m\xF3dulo ativa ou pendente." });
  const billingType = String(req.body?.billingType || "PIX").toUpperCase();
  if (!asaasBillingTypes.has(billingType)) return res.status(400).json({ error: "Forma de cobran\xE7a Asaas inv\xE1lida." });
  const dueDate = String(req.body?.nextDueDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  let customer;
  try {
    customer = await ensureAsaasCustomer(tenant);
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel consultar o cliente Asaas." });
  }
  if (!customer.id) return res.status(502).json({ error: customer.error || "N\xE3o foi poss\xEDvel preparar o cliente Asaas." });
  const externalReference = `${tenant.id}:WHATSAPP_OWN_NUMBER`;
  try {
    const existingExternal = await findOpenAsaasSubscriptionForTenant(tenant.id, customer.id) || await findAsaasSubscriptionByExternalReference(externalReference);
    if (existingExternal?.id) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingLocal = db.asaasSubscriptions.find((item) => item.asaasSubscriptionId === String(existingExternal.id));
      if (!existingLocal) {
        db.asaasSubscriptions.unshift({ asaasSubscriptionId: String(existingExternal.id), tenantId: tenant.id, planId: "NOTIFICATION_MODULE", product: "NOTIFICATION_MODULE", feature: "WHATSAPP_OWN_NUMBER", value: Number(existingExternal.value || moduleConfig.ownNumberMonthlyPrice), billingType: existingExternal.billingType || billingType, cycle: existingExternal.cycle || "MONTHLY", status: existingExternal.status || "PENDING", nextDueDate: existingExternal.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now });
      }
      tenant.notificationPlan = "OWN_NUMBER";
      tenant.notificationBillingStatus = existingExternal.status || "PENDING";
      tenant.notificationSubscriptionId = String(existingExternal.id);
      tenant.notificationBillingNextDueDate = existingExternal.nextDueDate || dueDate;
      await db.persistNow();
      return res.status(200).json({ id: String(existingExternal.id), status: existingExternal.status || "PENDING", value: existingExternal.value || Number(moduleConfig.ownNumberMonthlyPrice), nextDueDate: existingExternal.nextDueDate || dueDate, module: "WHATSAPP_OWN_NUMBER", reconciled: true });
    }
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel verificar uma assinatura existente do m\xF3dulo no Asaas." });
  }
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions`, {
      method: "POST",
      headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customer.id, billingType, nextDueDate: dueDate, value: Number(moduleConfig.ownNumberMonthlyPrice), cycle: "MONTHLY", description: moduleConfig.ownNumberPlanName, externalReference })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, "Falha ao criar assinatura do m\xF3dulo no Asaas.") });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    tenant.notificationPlan = "OWN_NUMBER";
    tenant.notificationBillingStatus = "PENDING";
    tenant.notificationSubscriptionId = String(body.id || "");
    tenant.notificationBillingNextDueDate = body.nextDueDate || dueDate;
    const record = { asaasSubscriptionId: body.id, tenantId: tenant.id, planId: "NOTIFICATION_MODULE", product: "NOTIFICATION_MODULE", feature: "WHATSAPP_OWN_NUMBER", value: Number(moduleConfig.ownNumberMonthlyPrice), billingType, cycle: "MONTHLY", status: body.status || "PENDING", nextDueDate: body.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now };
    db.asaasSubscriptions.unshift(record);
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_NOTIFICATION_MODULE_SUBSCRIPTION_CREATED", entity: "AsaasSubscription", entityId: String(body.id), details: `Assinatura do m\xF3dulo ${moduleConfig.ownNumberPlanName} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}. A ativa\xE7\xE3o depende do webhook de pagamento.` });
    await db.persistNow();
    return res.status(201).json({ id: body.id, status: body.status || "PENDING", value: Number(moduleConfig.ownNumberMonthlyPrice), nextDueDate: body.nextDueDate || dueDate, module: "WHATSAPP_OWN_NUMBER" });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel criar a assinatura do m\xF3dulo no Asaas." });
  }
});
apiRouter.get("/billing/asaas/notification-module/subscription", (req, res) => {
  const tenant = getBillingTenant(req, req.query.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: "Sem permiss\xE3o para consultar a assinatura do m\xF3dulo." });
  return res.json(notificationStatusForTenant(tenant));
});
apiRouter.post("/billing/asaas/notification-module/cancel", async (req, res) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: "Sem permiss\xE3o para cancelar o m\xF3dulo de notifica\xE7\xF5es." });
  if (!asaasEnabled()) return res.status(400).json({ error: "Asaas est\xE1 desativado ou sem API Key." });
  const subscriptionId = String(tenant?.notificationSubscriptionId || "");
  if (!tenant || !subscriptionId) return res.status(404).json({ error: "Nenhuma assinatura do m\xF3dulo encontrada para a empresa." });
  const record = db.asaasSubscriptions.find((item) => String(item.asaasSubscriptionId) === subscriptionId && item.tenantId === tenant.id);
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "DELETE", headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 404) return res.status(response.status).json({ error: asaasSafeError(body, "Falha ao cancelar o m\xF3dulo no Asaas.") });
    tenant.notificationPlan = "SAAS_FREE";
    tenant.notificationBillingStatus = "CANCELED";
    delete tenant.notificationSubscriptionId;
    delete tenant.notificationBillingNextDueDate;
    if (record) {
      record.status = "INACTIVE";
      record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    db.addAuditLog({ ip: requestIp(req), tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ASAAS_NOTIFICATION_MODULE_CANCELED", entity: "AsaasSubscription", entityId: subscriptionId, details: `M\xF3dulo de n\xFAmero pr\xF3prio cancelado${response.status === 404 ? " ap\xF3s confirma\xE7\xE3o de aus\xEAncia no Asaas" : ""}; fallback para o telefone SaaS.` });
    await db.persistNow();
    return res.json({ success: true, plan: "SAAS_FREE", billingStatus: "CANCELED", canUseOwnNumber: false, subscriptionId: null });
  } catch (_error) {
    return res.status(502).json({ error: "N\xE3o foi poss\xEDvel cancelar o m\xF3dulo no Asaas." });
  }
});
apiRouter.get("/billing/asaas/subscription", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para consultar assinatura." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : String(req.user.tenantId || "");
  const tenant = db.tenants.find((item) => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada." });
  const subscription = db.asaasSubscriptions.find((item) => item.tenantId === tenant.id && item.asaasSubscriptionId === tenant.asaasSubscriptionId) || db.asaasSubscriptions.find((item) => item.tenantId === tenant.id);
  return res.json({ tenantId: tenant.id, plan: tenant.plan, billingStatus: tenant.billingStatus || "PENDING", customerId: tenant.asaasCustomerId || null, subscription: subscription ? { id: subscription.asaasSubscriptionId, planId: subscription.planId, cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } : null });
});
apiRouter.get("/billing/asaas/financial-summary", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para consultar o financeiro." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : String(req.user.tenantId || "");
  const tenant = db.tenants.find((item) => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada." });
  const subscription = db.asaasSubscriptions.find((item) => item.tenantId === tenant.id && item.asaasSubscriptionId === tenant.asaasSubscriptionId) || db.asaasSubscriptions.find((item) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  const payments = db.asaasPayments.filter((item) => item.tenantId === tenant.id).slice(0, 100).map((item) => ({ id: item.asaasPaymentId, planId: item.planId, value: Number(item.value || 0), status: item.status || "PENDING", invoiceUrl: item.invoiceUrl || null, dueDate: item.dueDate || null, createdAt: item.createdAt, updatedAt: item.updatedAt }));
  const received = payments.filter((item) => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  const pending = payments.filter((item) => ["PENDING", "AWAITING_RISK_ANALYSIS"].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  const overdue = payments.filter((item) => ["OVERDUE", "DUNNING_REQUESTED", "DUNNING_RECEIVED"].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  return res.json({ tenantId: tenant.id, plan: tenant.plan, billingStatus: tenant.billingStatus || "PENDING", subscription: subscription ? { id: subscription.asaasSubscriptionId, planId: subscription.planId, value: Number(subscription.value || 0), cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } : null, totals: { received, pending, overdue }, payments });
});
apiRouter.get("/pages", (req, res) => {
  const pages = req.user?.role === "SUPER_ADMIN" ? db.pages : req.tenant ? db.pages.filter((p) => p.tenantId === req.tenant?.id) : [];
  if (!req.user) return res.status(403).json({ error: "Usu\xE1rio n\xE3o identificado" });
  res.json(pages.map((page) => ({ ...page, content: sanitizeServerHtml(page.content), canonicalUrl: safePublicUrl(page.canonicalUrl), coverImageUrl: safePublicUrl(page.coverImageUrl) })));
});
apiRouter.post("/pages", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para criar p\xE1ginas institucionais" });
  const tenantId = req.user.role === "SUPER_ADMIN" ? req.body?.tenantId ?? null : req.tenant?.id;
  if (tenantId === void 0 || tenantId !== null && !db.tenants.some((tenant) => tenant.id === tenantId)) return res.status(403).json({ error: "Tenant n\xE3o identificado" });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newPage = {
    id: `page-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    tenantId,
    slug: String(req.body?.slug || "").trim().toLowerCase(),
    title: String(req.body?.title || "").trim().slice(0, 200),
    content: sanitizeServerHtml(req.body?.content || ""),
    excerpt: String(req.body?.excerpt || "").trim().slice(0, 1e3),
    metaTitle: String(req.body?.metaTitle || "").trim().slice(0, 200),
    metaDescription: String(req.body?.metaDescription || "").trim().slice(0, 2e3),
    canonicalUrl: safePublicUrl(req.body?.canonicalUrl),
    coverImageUrl: safePublicUrl(req.body?.coverImageUrl),
    isPublished: req.body?.isPublished !== false,
    isIndexable: req.body?.isIndexable !== false,
    createdAt: now,
    updatedAt: now
  };
  if (!newPage.slug || !newPage.title || !newPage.content) return res.status(400).json({ error: "T\xEDtulo, slug e conte\xFAdo s\xE3o obrigat\xF3rios." });
  db.pages.push(newPage);
  res.status(201).json({ ...newPage, content: sanitizeServerHtml(newPage.content) });
});
apiRouter.get("/posts", (req, res) => {
  const posts = req.user?.role === "SUPER_ADMIN" ? db.posts : req.tenant ? db.posts.filter((p) => p.tenantId === req.tenant?.id) : [];
  if (!req.user) return res.status(403).json({ error: "Usu\xE1rio n\xE3o identificado" });
  res.json(posts.map((post) => ({ ...post, content: sanitizeServerHtml(post.content), canonicalUrl: safePublicUrl(post.canonicalUrl), coverImageUrl: safePublicUrl(post.coverImageUrl) })));
});
apiRouter.post("/posts", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para publicar artigos no blog" });
  const tenantId = req.user.role === "SUPER_ADMIN" ? req.body?.tenantId ?? null : req.tenant?.id;
  if (tenantId === void 0 || tenantId !== null && !db.tenants.some((tenant) => tenant.id === tenantId)) return res.status(403).json({ error: "Tenant n\xE3o identificado" });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newPost = {
    id: `post-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    tenantId,
    slug: String(req.body?.slug || "").trim().toLowerCase(),
    title: String(req.body?.title || "").trim().slice(0, 200),
    excerpt: String(req.body?.excerpt || "").trim().slice(0, 1e3),
    content: sanitizeServerHtml(req.body?.content || ""),
    author: String(req.body?.author || req.user.name || "Administrador").trim().slice(0, 200),
    metaTitle: String(req.body?.metaTitle || "").trim().slice(0, 200),
    metaDescription: String(req.body?.metaDescription || "").trim().slice(0, 2e3),
    canonicalUrl: safePublicUrl(req.body?.canonicalUrl),
    coverImageUrl: safePublicUrl(req.body?.coverImageUrl),
    isPublished: req.body?.isPublished !== false,
    isIndexable: req.body?.isIndexable !== false,
    publishedAt: req.body?.isPublished === false ? void 0 : now,
    createdAt: now,
    updatedAt: now
  };
  if (!newPost.slug || !newPost.title || !newPost.content) return res.status(400).json({ error: "T\xEDtulo, slug e conte\xFAdo s\xE3o obrigat\xF3rios." });
  db.posts.push(newPost);
  res.status(201).json({ ...newPost, content: sanitizeServerHtml(newPost.content) });
});
var LEGAL_PAGE_DOCUMENTS = {
  "termos-de-uso": "TERMS",
  "politica-de-privacidade": "PRIVACY"
};
apiRouter.get("/pages/:id/versions", (req, res) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Somente o Super Admin pode consultar vers\xF5es jur\xEDdicas." });
  const page = db.pages.find((item) => item.id === req.params.id && item.tenantId === null);
  if (!page || !LEGAL_PAGE_DOCUMENTS[page.slug]) return res.status(404).json({ error: "Hist\xF3rico jur\xEDdico n\xE3o encontrado." });
  const versions = db.legalDocumentVersions.filter((item) => item.documentType === LEGAL_PAGE_DOCUMENTS[page.slug]).slice(0, 50);
  return res.json({ currentVersion: page.contentVersion || null, versions });
});
apiRouter.put("/pages/:id", async (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para editar p\xE1ginas." });
  const page = db.pages.find((item) => item.id === req.params.id && (req.user?.role === "SUPER_ADMIN" || item.tenantId === req.tenant?.id));
  if (!page) return res.status(404).json({ error: "P\xE1gina n\xE3o encontrada." });
  const legalType = page.tenantId === null ? LEGAL_PAGE_DOCUMENTS[page.slug] : void 0;
  if (legalType && req.user.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Somente o Super Admin pode editar documentos jur\xEDdicos globais." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (legalType) {
    const previousVersion = page.contentVersion || "2026-08-27.1";
    const snapshot = {
      id: `legal-version-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
      documentType: legalType,
      version: previousVersion,
      title: page.title,
      content: page.content,
      excerpt: page.excerpt,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      publishedAt: page.updatedAt || page.createdAt,
      createdAt: now,
      createdByUserId: req.user.id,
      createdByName: req.user.name,
      changeNote: String(req.body?.changeNote || "Snapshot anterior \xE0 publica\xE7\xE3o").trim().slice(0, 240)
    };
    db.legalDocumentVersions.unshift(snapshot);
    if (db.legalDocumentVersions.length > 100) db.legalDocumentVersions.length = 100;
    const requestedVersion = String(req.body?.contentVersion || "").trim().slice(0, 64);
    page.contentVersion = requestedVersion || `${now.slice(0, 10)}.${now.slice(11, 19).replace(/:/g, "")}`;
    page.isSystemLocked = true;
  }
  page.title = String(req.body?.title || page.title).trim().slice(0, 200);
  page.slug = String(req.body?.slug || page.slug).trim().toLowerCase();
  page.content = sanitizeServerHtml(req.body?.content ?? page.content);
  if (req.body?.excerpt !== void 0) page.excerpt = String(req.body.excerpt || "").trim().slice(0, 1e3);
  if (req.body?.metaTitle !== void 0) page.metaTitle = String(req.body.metaTitle || "").trim().slice(0, 200);
  if (req.body?.metaDescription !== void 0) page.metaDescription = String(req.body.metaDescription || "").trim().slice(0, 2e3);
  if (req.body?.canonicalUrl !== void 0) page.canonicalUrl = safePublicUrl(req.body.canonicalUrl);
  if (req.body?.coverImageUrl !== void 0) page.coverImageUrl = safePublicUrl(req.body.coverImageUrl);
  if (req.body?.isPublished !== void 0) page.isPublished = Boolean(req.body.isPublished);
  if (req.body?.isIndexable !== void 0) page.isIndexable = Boolean(req.body.isIndexable);
  page.updatedAt = now;
  db.addAuditLog({ ip: requestIp(req), tenantId: page.tenantId || void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: legalType ? "PUBLICAR_DOCUMENTO_JURIDICO" : "EDITAR_PAGINA", entity: "WebPage", entityId: page.id, details: legalType ? `Documento ${legalType} publicado na vers\xE3o ${page.contentVersion}.` : `P\xE1gina ${page.slug} atualizada.` });
  await db.persistNow();
  return res.json(page);
});
apiRouter.delete("/pages/:id", async (req, res) => {
  if (!req.user || ["MOTORISTA", "USUARIO"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para despublicar p\xE1ginas." });
  const page = db.pages.find((item) => item.id === req.params.id && (req.user?.role === "SUPER_ADMIN" || item.tenantId === req.tenant?.id));
  if (!page) return res.status(404).json({ error: "P\xE1gina n\xE3o encontrada." });
  if (page.isSystemLocked) return res.status(403).json({ error: "P\xE1ginas legais do sistema n\xE3o podem ser exclu\xEDdas; apenas editadas e publicadas." });
  page.isPublished = false;
  page.isIndexable = false;
  page.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({ ip: requestIp(req), tenantId: page.tenantId || void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "DESPUBLICAR_PAGINA", entity: "WebPage", entityId: page.id, details: `P\xE1gina ${page.slug} despublicada sem apagar conte\xFAdo ou hist\xF3rico.` });
  await db.persistNow();
  return res.json({ success: true, message: "P\xE1gina despublicada; conte\xFAdo e hist\xF3rico preservados." });
});
apiRouter.put("/posts/:id", (req, res) => {
  if (!req.user || !["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para editar posts." });
  const post = db.posts.find((item) => item.id === req.params.id && (req.user?.role === "SUPER_ADMIN" || item.tenantId === req.tenant?.id));
  if (!post) return res.status(404).json({ error: "Post n\xE3o encontrado." });
  post.title = String(req.body?.title || post.title).trim().slice(0, 200);
  post.slug = String(req.body?.slug || post.slug).trim().toLowerCase();
  post.content = sanitizeServerHtml(req.body?.content ?? post.content);
  if (req.body?.excerpt !== void 0) post.excerpt = String(req.body.excerpt || "").trim().slice(0, 1e3);
  if (req.body?.metaTitle !== void 0) post.metaTitle = String(req.body.metaTitle || "").trim().slice(0, 200);
  if (req.body?.metaDescription !== void 0) post.metaDescription = String(req.body.metaDescription || "").trim().slice(0, 2e3);
  if (req.body?.canonicalUrl !== void 0) post.canonicalUrl = safePublicUrl(req.body.canonicalUrl);
  if (req.body?.coverImageUrl !== void 0) post.coverImageUrl = safePublicUrl(req.body.coverImageUrl);
  if (req.body?.author !== void 0) post.author = String(req.body.author || "").trim().slice(0, 200);
  if (req.body?.isPublished !== void 0) post.isPublished = Boolean(req.body.isPublished);
  if (req.body?.isIndexable !== void 0) post.isIndexable = Boolean(req.body.isIndexable);
  if (post.isPublished && !post.publishedAt) post.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
  post.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  return res.json(post);
});
apiRouter.delete("/posts/:id", async (req, res) => {
  if (!req.user || ["MOTORISTA", "USUARIO"].includes(req.user.role)) return res.status(403).json({ error: "Permiss\xE3o insuficiente para despublicar posts." });
  const post = db.posts.find((item) => item.id === req.params.id && (req.user?.role === "SUPER_ADMIN" || item.tenantId === req.tenant?.id));
  if (!post) return res.status(404).json({ error: "Post n\xE3o encontrado." });
  post.isPublished = false;
  post.isIndexable = false;
  post.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({ ip: requestIp(req), tenantId: post.tenantId || void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "DESPUBLICAR_POST", entity: "BlogPost", entityId: post.id, details: `Post ${post.slug} despublicado sem apagar conte\xFAdo ou hist\xF3rico.` });
  await db.persistNow();
  return res.json({ success: true, message: "Post despublicado; conte\xFAdo e hist\xF3rico preservados." });
});
apiRouter.get("/auth/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "N\xE3o autenticado" });
  }
  const sessionData = getSessionDataForUser(req.user);
  const supportSession = req.supportSession;
  const actorUser = supportSession ? db.users.find((item) => item.id === supportSession.actorUserId) : void 0;
  res.json({
    ...sessionData,
    supportSession: supportSession && actorUser ? {
      id: supportSession.id,
      targetUser: safeSupportIdentity(req.user),
      actorUser: safeSupportIdentity(actorUser),
      expiresAt: supportSession.expiresAt
    } : null,
    availableDemoAccounts: process.env.NODE_ENV === "production" ? [] : db.users.filter(isPublicDemoUser).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId,
      driverId: u.driverId
    }))
  });
});
apiRouter.post("/auth/logout", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "N\xE3o autenticado" });
  if (req.authToken) db.revokeAuthToken(req.authToken);
  const refreshFamilyId = activeRefreshFamilies.get(req.user.id);
  if (refreshFamilyId) {
    db.revokeRefreshFamily(refreshFamilyId);
    activeRefreshFamilies.delete(req.user.id);
  }
  delete req.user.activeSessionId;
  delete req.user.activeSessionExpiresAt;
  db.addAuditLog({ ip: requestIp(req), tenantId: req.user.tenantId || void 0, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "LOGOUT", entity: "User", entityId: req.user.id, details: "Sess\xE3o atual revogada pelo pr\xF3prio usu\xE1rio." });
  await db.persistNow();
  return res.json({ success: true });
});
apiRouter.post("/support/sessions", (req, res) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN" || req.supportSession) {
    return res.status(403).json({ error: "Somente um Super Admin autenticado pode iniciar uma sess\xE3o de suporte." });
  }
  const targetUserId = typeof req.body?.targetUserId === "string" ? req.body.targetUserId.trim() : "";
  if (!targetUserId) return res.status(400).json({ error: "targetUserId \xE9 obrigat\xF3rio." });
  const targetUser = db.users.find((user) => user.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: "Usu\xE1rio de suporte n\xE3o encontrado." });
  if (targetUser.role === "SUPER_ADMIN") return res.status(400).json({ error: "Uma sess\xE3o de suporte n\xE3o pode assumir outro Super Admin." });
  if (targetUser.status !== "ATIVO") return res.status(409).json({ error: "Somente usu\xE1rios ativos podem receber acesso de suporte." });
  const expiresAt = new Date(Date.now() + SUPPORT_SESSION_TTL_MS).toISOString();
  const supportSession = {
    id: (0, import_crypto.randomUUID)(),
    actorUserId: req.user.id,
    targetUserId: targetUser.id,
    expiresAt
  };
  activeSupportSessions.set(supportSession.id, supportSession);
  const token = import_jsonwebtoken.default.sign({
    userId: targetUser.id,
    support: true,
    supportSessionId: supportSession.id,
    actorUserId: req.user.id,
    targetUserId: targetUser.id,
    iss: "elolog-support"
  }, SAFE_JWT_SECRET, { expiresIn: "30m" });
  db.saveAuthToken(token, targetUser.id, new Date(expiresAt));
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    tenantName: targetUser.tenantId ? db.tenants.find((t) => t.id === targetUser.tenantId)?.name : void 0,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "SUPORTE_INICIADO",
    entity: "SupportSession",
    entityId: supportSession.id,
    details: `Acesso assistido iniciado para ${targetUser.name} (${targetUser.role}); expira em 30 minutos.`
  });
  return res.json({
    ...getSessionDataForUser(targetUser),
    token,
    supportSession: {
      id: supportSession.id,
      targetUser: safeSupportIdentity(targetUser),
      actorUser: safeSupportIdentity(req.user),
      expiresAt: supportSession.expiresAt
    }
  });
});
apiRouter.post("/support/sessions/end", (req, res) => {
  const supportSession = req.supportSession;
  if (!supportSession || !req.user) {
    return res.status(400).json({ error: "N\xE3o existe uma sess\xE3o de suporte ativa." });
  }
  const actorUser = db.users.find((user) => user.id === supportSession.actorUserId);
  if (!actorUser || actorUser.role !== "SUPER_ADMIN") {
    activeSupportSessions.delete(supportSession.id);
    return res.status(401).json({ error: "O administrador de origem da sess\xE3o n\xE3o est\xE1 mais dispon\xEDvel." });
  }
  activeSupportSessions.delete(supportSession.id);
  const { token } = issueUserSession(actorUser);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: req.user.tenantId || void 0,
    tenantName: req.tenant?.name || void 0,
    userId: actorUser.id,
    userName: actorUser.name,
    userRole: actorUser.role,
    action: "SUPORTE_ENCERRADO",
    entity: "SupportSession",
    entityId: supportSession.id,
    details: `Acesso assistido encerrado para ${req.user.name}. Retorno ao Super Admin.`
  });
  return res.json({ ...getSessionDataForUser(actorUser), token });
});
apiRouter.post("/auth/login", async (req, res) => {
  const { email, role, password } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "E-mail \xE9 obrigat\xF3rio." });
  }
  const targetUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!targetUser) {
    auditAuthFailure(req, "LOGIN_FAILED", email, "Tentativa de login com usu\xE1rio inexistente.");
    return res.status(401).json({ error: "Credenciais inv\xE1lidas." });
  }
  if (targetUser.status === "PENDENTE") {
    return res.status(403).json({ error: "Seu cadastro foi realizado com sucesso, mas ainda n\xE3o foi liberado. Aguarde a aprova\xE7\xE3o do Super Administrador." });
  }
  if (!targetUser.password || typeof targetUser.password !== "string" || !targetUser.password.startsWith("$2")) {
    return res.status(401).json({ error: "Este usu\xE1rio deve acessar pelo c\xF3digo OTP do WhatsApp." });
  }
  if (!password) {
    return res.status(401).json({ error: "Senha \xE9 obrigat\xF3ria para este usu\xE1rio." });
  }
  const isMatch = await import_bcryptjs.default.compare(password, targetUser.password).catch(() => false);
  if (!isMatch) {
    auditAuthFailure(req, "LOGIN_FAILED", email, "Tentativa de login com senha inv\xE1lida.");
    return res.status(401).json({ error: "Credenciais inv\xE1lidas." });
  }
  targetUser.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  const { token, refreshToken } = issueUserSession(targetUser);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    tenantName: targetUser.tenantId ? db.tenants.find((t) => t.id === targetUser?.tenantId)?.name : "Plataforma Global",
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: "LOGIN",
    entity: "User",
    entityId: targetUser.id,
    details: `Login realizado com sucesso via perfil ${targetUser.role}`
  });
  res.json({
    user: sanitizeUser(targetUser),
    token,
    refreshToken
  });
});
apiRouter.post("/auth/refresh", (req, res) => {
  const rawRefreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "";
  if (!rawRefreshToken) return res.status(401).json({ error: "Refresh token ausente." });
  try {
    const decoded = import_jsonwebtoken.default.verify(rawRefreshToken, SAFE_JWT_SECRET);
    if (decoded.typ !== "refresh" || !decoded.userId || !decoded.jti || !decoded.familyId) return res.status(401).json({ error: "Refresh token inv\xE1lido." });
    const consumed = db.consumeRefreshToken(decoded.jti);
    if (!consumed || consumed.userId !== decoded.userId || consumed.familyId !== decoded.familyId) {
      db.revokeRefreshFamily(decoded.familyId);
      activeRefreshFamilies.delete(decoded.userId);
      return res.status(401).json({ error: "Refresh token reutilizado, expirado ou revogado. Fa\xE7a login novamente." });
    }
    const user = db.users.find((item) => item.id === decoded.userId && item.status === "ATIVO");
    if (!user) return res.status(401).json({ error: "Usu\xE1rio inv\xE1lido ou inativo." });
    const issued = issueUserSession(user);
    db.addAuditLog({ ip: requestIp(req), tenantId: user.tenantId || void 0, userId: user.id, userName: user.name, userRole: user.role, action: "REFRESH_ROTATED", entity: "UserSession", entityId: user.id, details: "Refresh token consumido uma \xFAnica vez e substitu\xEDdo por nova sess\xE3o." });
    return res.json({ user: sanitizeUser(user), token: issued.token, refreshToken: issued.refreshToken });
  } catch {
    auditAuthFailure(req, "REFRESH_FAILED", void 0, "Refresh token inv\xE1lido ou expirado.");
    return res.status(401).json({ error: "Refresh token inv\xE1lido ou expirado." });
  }
});
apiRouter.post("/auth/demo-session", async (req, res) => {
  await db.waitForPersistence();
  const requestedUserId = typeof req.body?.userId === "string" && req.body.userId.trim() ? req.body.userId.trim() : PUBLIC_DEMO_PRIMARY_USER_ID;
  const targetUser = db.users.find((user) => user.id === requestedUserId);
  if (!targetUser || !isPublicDemoUser(targetUser)) {
    return res.status(404).json({ error: "Perfil fict\xEDcio de demonstra\xE7\xE3o n\xE3o encontrado." });
  }
  targetUser.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  const { token } = issueUserSession(targetUser);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: PUBLIC_DEMO_TENANT_ID,
    tenantName: db.tenants.find((item) => item.id === PUBLIC_DEMO_TENANT_ID)?.name || "Demonstra\xE7\xE3o",
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: requestedUserId === PUBLIC_DEMO_PRIMARY_USER_ID ? "DEMO_SESSION_STARTED" : "DEMO_PROFILE_SELECTED",
    entity: "DemoSession",
    entityId: targetUser.id,
    details: `Sess\xE3o p\xFAblica de demonstra\xE7\xE3o iniciada no perfil ${targetUser.role}, com dados fict\xEDcios e permiss\xF5es restritas.`
  });
  await db.persistNow();
  return res.json({ ...getSessionDataForUser(targetUser), token, demo: true });
});
apiRouter.post("/auth/switch-demo", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "A troca de perfil de demonstra\xE7\xE3o est\xE1 desabilitada em produ\xE7\xE3o." });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId \xE9 obrigat\xF3rio." });
  }
  const targetUser = db.users.find((u) => u.id === userId);
  if (!targetUser || !isPublicDemoUser(targetUser)) {
    return res.status(404).json({ error: "Usu\xE1rio de demonstra\xE7\xE3o n\xE3o encontrado." });
  }
  targetUser.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  const { token } = issueUserSession(targetUser);
  res.json({ ...getSessionDataForUser(targetUser), token });
});
var activeOTPs = /* @__PURE__ */ new Map();
var otpLastSentAt = /* @__PURE__ */ new Map();
var publicInterestAttempts = /* @__PURE__ */ new Map();
var PUBLIC_INTEREST_RATE_WINDOW_MS = 10 * 60 * 1e3;
var OTP_RESEND_COOLDOWN_MS = 60 * 1e3;
var pendingRegistrations = /* @__PURE__ */ new Map();
var registrationLastSentAt = /* @__PURE__ */ new Map();
var REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1e3;
var REGISTRATION_MAX_FAILED_ATTEMPTS = 5;
var cleanupPendingRegistrations = () => {
  const now = Date.now();
  pendingRegistrations.forEach((pending, key) => {
    if (pending.expiresAt <= now) {
      pendingRegistrations.delete(key);
      registrationLastSentAt.delete(key);
    }
  });
};
var pendingRegistrationCleanup = setInterval(cleanupPendingRegistrations, 5 * 60 * 1e3);
pendingRegistrationCleanup.unref();
var normalizePhoneForLookup = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.startsWith("55") && digits.length === 13 ? digits.slice(2) : digits;
};
var isValidBrazilianLoginPhone = (value) => /^(?:\d{10}|\d{11})$/.test(value);
apiRouter.post("/auth/request-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Telefone \xE9 obrigat\xF3rio" });
  }
  const cleanPhone = normalizePhoneForLookup(phone);
  if (!isValidBrazilianLoginPhone(cleanPhone)) {
    return res.status(400).json({ error: "N\xFAmero de telefone inv\xE1lido. Informe DDD e n\xFAmero com 10 ou 11 d\xEDgitos." });
  }
  const matchingUsers = db.users.filter((user) => normalizePhoneForLookup(user.phone) === cleanPhone);
  if (matchingUsers.length > 1) {
    return res.status(409).json({ error: "Este telefone est\xE1 associado a mais de uma conta. Solicite suporte." });
  }
  const targetUser = matchingUsers[0];
  if (!targetUser) {
    return res.status(404).json({ error: "Nenhum usu\xE1rio cadastrado com este telefone." });
  }
  if (targetUser.status === "PENDENTE") {
    return res.status(403).json({ error: "Cadastro pendente de aprova\xE7\xE3o pelo Super Administrador." });
  }
  const lastSentAt = otpLastSentAt.get(cleanPhone);
  if (lastSentAt && Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: "Um c\xF3digo j\xE1 foi solicitado recentemente. Aguarde um minuto antes de pedir outro." });
  }
  const code = String((0, import_crypto.randomInt)(1e5, 1e6));
  const expiresAt = Date.now() + 5 * 60 * 1e3;
  const cleanUserPhone = normalizePhoneForLookup(targetUser.phone);
  activeOTPs.set(cleanPhone, { code, expiresAt, failedAttempts: 0 });
  if (cleanUserPhone !== cleanPhone) {
    activeOTPs.set(cleanUserPhone, { code, expiresAt, failedAttempts: 0 });
  }
  activeOTPs.set(targetUser.id, { code, expiresAt, failedAttempts: 0 });
  otpLastSentAt.set(cleanPhone, Date.now());
  if (otpLastSentAt.size > 1e4) {
    const cutoff = Date.now() - OTP_RESEND_COOLDOWN_MS;
    for (const [key, timestamp] of otpLastSentAt) if (timestamp < cutoff) otpLastSentAt.delete(key);
  }
  const tenantId = targetUser.tenantId || "tenant-translog-01";
  const config = resolveWhatsAppConfig(tenantId);
  const messageBody = renderLoginOtpMessage(code, 5, targetUser.tenantId);
  const waResult = await sendToWhatsAppGateway(config, {
    number: cleanPhone,
    body: messageBody,
    externalKey: `otp-${Date.now()}`
  });
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: "OTP_REQUEST",
    entity: "User",
    entityId: targetUser.id,
    details: `Solicita\xE7\xE3o OTP via WhatsApp para o telefone ${phone} [${waResult.success ? "ACEITA_PELO_GATEWAY" : "FALHA"}]`
  });
  if (!waResult.success) {
    return res.status(502).json({
      error: "N\xE3o foi poss\xEDvel enviar o c\xF3digo OTP pelo WhatsApp. Verifique a configura\xE7\xE3o ou a sess\xE3o do canal e tente novamente."
    });
  }
  res.json({
    success: true,
    message: `C\xF3digo de login aceito pelo gateway WhatsApp para ${phone}. Verifique suas mensagens.`
  });
});
apiRouter.post("/auth/verify-otp", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Telefone e c\xF3digo s\xE3o obrigat\xF3rios." });
  }
  const cleanPhone = normalizePhoneForLookup(phone);
  if (!isValidBrazilianLoginPhone(cleanPhone)) {
    return res.status(400).json({ error: "N\xFAmero de telefone inv\xE1lido." });
  }
  const submittedCode = String(code).trim();
  if (!/^\d{6}$/.test(submittedCode)) {
    return res.status(400).json({ error: "C\xF3digo de verifica\xE7\xE3o inv\xE1lido." });
  }
  const matchingUsers = db.users.filter((user) => normalizePhoneForLookup(user.phone) === cleanPhone);
  if (matchingUsers.length > 1) {
    return res.status(409).json({ error: "Este telefone est\xE1 associado a mais de uma conta. Solicite suporte." });
  }
  const targetUser = matchingUsers[0];
  if (!targetUser) {
    auditAuthFailure(req, "OTP_VERIFY_FAILED", `phone-last4:${cleanPhone.slice(-4)}`, "Tentativa OTP para telefone n\xE3o cadastrado.");
    return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado para este telefone." });
  }
  const cleanUserPhone = normalizePhoneForLookup(targetUser.phone);
  const activeOtp = activeOTPs.get(cleanPhone) || activeOTPs.get(cleanUserPhone) || activeOTPs.get(targetUser.id);
  if (!activeOtp) {
    return res.status(400).json({ error: "Nenhum c\xF3digo ativo encontrado para este telefone. Solicite um novo c\xF3digo." });
  }
  if (Date.now() > activeOtp.expiresAt) {
    activeOTPs.delete(cleanPhone);
    activeOTPs.delete(cleanUserPhone);
    activeOTPs.delete(targetUser.id);
    return res.status(400).json({ error: "C\xF3digo de verifica\xE7\xE3o expirou (validade de 5 minutos)." });
  }
  const expectedCode = Buffer.from(activeOtp.code, "utf8");
  const providedCode = Buffer.from(submittedCode, "utf8");
  const codesMatch = expectedCode.length === providedCode.length && (0, import_crypto.timingSafeEqual)(expectedCode, providedCode);
  if (!codesMatch) {
    activeOtp.failedAttempts = (activeOtp.failedAttempts || 0) + 1;
    auditAuthFailure(req, "OTP_VERIFY_FAILED", `user:${targetUser.id}`, `C\xF3digo OTP inv\xE1lido; tentativa ${activeOtp.failedAttempts}/5.`);
    if (activeOtp.failedAttempts >= 5) {
      activeOTPs.delete(cleanPhone);
      activeOTPs.delete(cleanUserPhone);
      activeOTPs.delete(targetUser.id);
      return res.status(429).json({ error: "Muitas tentativas incorretas. C\xF3digo bloqueado. Solicite um novo c\xF3digo." });
    }
    return res.status(400).json({ error: `C\xF3digo de verifica\xE7\xE3o inv\xE1lido. Tentativa ${activeOtp.failedAttempts}/5.` });
  }
  activeOTPs.delete(cleanPhone);
  activeOTPs.delete(cleanUserPhone);
  activeOTPs.delete(targetUser.id);
  targetUser.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  const { token, refreshToken } = issueUserSession(targetUser);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: "LOGIN",
    entity: "User",
    entityId: targetUser.id,
    details: `Login realizado com sucesso via WhatsApp OTP`
  });
  res.json({
    user: sanitizeUser(targetUser),
    token,
    refreshToken
  });
});
async function provisionAtendoCrmTenant(tenant) {
  await db.waitForPersistence();
  if (tenant.atendoCrmTenantId && tenant.atendoCrmProvisioningStatus === "PROVISIONED") {
    return { status: "PROVISIONED", externalTenantId: tenant.atendoCrmTenantId };
  }
  const config = db.atendoCrmAdminConfig;
  if (!config.baseUrl || !config.apiId || !config.bearerToken) {
    tenant.atendoCrmProvisioningStatus = "NOT_CONFIGURED";
    tenant.atendoCrmProvisioningError = "Configura\xE7\xE3o administrativa do Atendo CRM n\xE3o est\xE1 dispon\xEDvel.";
    await db.persistNow();
    return { status: "NOT_CONFIGURED", error: tenant.atendoCrmProvisioningError };
  }
  tenant.atendoCrmProvisioningStatus = "PENDING";
  tenant.atendoCrmProvisioningError = void 0;
  await db.persistNow();
  try {
    const generatedPassword = (0, import_crypto.randomBytes)(24).toString("base64url");
    const request = buildAtendoCrmCreateTenantRequest(config, tenant, generatedPassword);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    let response;
    try {
      response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const contentType = response.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      tenant.atendoCrmProvisioningStatus = "ERROR";
      const providerMessage = typeof responseData === "string" ? responseData.replace(/\s+/g, " ").trim().slice(0, 180) : String(responseData?.message || responseData?.error || responseData?.detail || "").replace(/\s+/g, " ").trim().slice(0, 180);
      tenant.atendoCrmProvisioningError = `Atendo CRM retornou HTTP ${response.status}${providerMessage ? `: ${providerMessage}` : "."}`;
      db.addErrorLog({ service: "atendo-crm-admin", route: "createtenant", method: "POST", statusCode: response.status, event: "ATENDO_CRM_PROVISIONING_REJECTED", message: "O Atendo CRM rejeitou o provisionamento de uma empresa." });
      await db.persistNow();
      return { status: "ERROR", error: tenant.atendoCrmProvisioningError };
    }
    const externalTenantId = externalTenantIdFromResponse(responseData);
    if (!externalTenantId) {
      tenant.atendoCrmProvisioningStatus = "ERROR";
      tenant.atendoCrmProvisioningError = "Atendo CRM respondeu sem identificador externo reconhec\xEDvel.";
      db.addErrorLog({ service: "atendo-crm-admin", route: "createtenant", method: "POST", statusCode: response.status, event: "ATENDO_CRM_PROVISIONING_INVALID_RESPONSE", message: "O Atendo CRM respondeu sem identificador de tenant reconhec\xEDvel." });
      await db.persistNow();
      return { status: "ERROR", error: tenant.atendoCrmProvisioningError };
    }
    tenant.atendoCrmTenantId = externalTenantId;
    tenant.atendoCrmProvisioningStatus = "PROVISIONED";
    tenant.atendoCrmProvisionedAt = (/* @__PURE__ */ new Date()).toISOString();
    tenant.atendoCrmProvisioningError = void 0;
    await db.persistNow();
    return { status: "PROVISIONED", externalTenantId };
  } catch (error) {
    tenant.atendoCrmProvisioningStatus = "ERROR";
    const reason = String(error?.name === "AbortError" ? "tempo limite excedido" : error?.message || "").replace(/\s+/g, " ").trim().slice(0, 180);
    tenant.atendoCrmProvisioningError = `Falha de comunica\xE7\xE3o com o Atendo CRM durante o provisionamento${reason ? `: ${reason}` : "."}`;
    db.addErrorLog({ service: "atendo-crm-admin", route: "createtenant", method: "POST", event: "ATENDO_CRM_PROVISIONING_ERROR", message: "Falha de comunica\xE7\xE3o ao provisionar uma empresa no Atendo CRM." });
    await db.persistNow();
    return { status: "ERROR", error: tenant.atendoCrmProvisioningError };
  }
}
apiRouter.post("/auth/register-company", async (req, res) => {
  const { companyName, cnpj, responsibleName, email, phone, password, termsAccepted, privacyAccepted } = req.body || {};
  const normalizedCompanyName = String(companyName || "").replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const normalizedCnpj = normalizePublicIdentity(cnpj);
  const normalizedResponsibleName = String(responsibleName || "").replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();
  const cleanRegistrationPhone = normalizePhoneForLookup(normalizedPhone);
  const passwordValue = typeof password === "string" ? password : "";
  if (normalizedCompanyName.length < 3 || normalizedResponsibleName.length < 3 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedCnpj.length !== 14 || !isValidBrazilianLoginPhone(cleanRegistrationPhone) || passwordValue.length < 8 || termsAccepted !== true || privacyAccepted !== true) {
    return res.status(400).json({ error: "Preencha os campos com formatos v\xE1lidos e aceite os termos." });
  }
  const emailExists = db.users.some((u) => String(u.email || "").trim().toLowerCase() === normalizedEmail);
  if (emailExists) {
    return res.status(400).json({ error: "Este e-mail j\xE1 est\xE1 sendo utilizado por outra conta." });
  }
  const cnpjExists = db.tenants.some((t) => normalizePublicIdentity(t.cnpj) === normalizedCnpj);
  if (cnpjExists) {
    return res.status(400).json({ error: "Este CNPJ j\xE1 est\xE1 cadastrado no sistema." });
  }
  cleanupPendingRegistrations();
  const key = normalizedEmail;
  const previousPending = pendingRegistrations.get(key);
  const previousSentAt = registrationLastSentAt.get(key);
  if (previousPending && previousSentAt && Date.now() - previousSentAt < REGISTRATION_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: "Aguarde um minuto antes de solicitar outro c\xF3digo." });
  }
  const code = String((0, import_crypto.randomInt)(1e5, 1e6));
  const passwordHash = await import_bcryptjs.default.hash(passwordValue, 12);
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  pendingRegistrations.set(key, {
    code,
    expiresAt,
    companyName: normalizedCompanyName,
    cnpj: normalizedCnpj,
    responsibleName: normalizedResponsibleName,
    email: normalizedEmail,
    phone: cleanRegistrationPhone,
    passwordHash,
    failedAttempts: 0,
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion: CURRENT_LEGAL_VERSIONS.terms,
    privacyVersion: CURRENT_LEGAL_VERSIONS.privacy,
    acceptedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  registrationLastSentAt.set(key, Date.now());
  const cleanPhone = cleanRegistrationPhone;
  const config = db.globalWhatsAppConfig;
  if (config?.baseUrl && config?.token && config?.isActive) {
    sendToWhatsAppGateway(config, {
      number: cleanPhone,
      body: `\u{1F69A} [ELO LOG] Ol\xE1 ${responsibleName}, seu c\xF3digo de verifica\xE7\xE3o para o cadastro da empresa ${companyName} \xE9: *${code}*.`,
      externalKey: `reg-wa-${Date.now()}`
    }).catch((err) => console.error("WhatsApp reg err:", err));
  }
  res.json({
    success: true,
    message: "C\xF3digo de verifica\xE7\xE3o enviado para o e-mail e WhatsApp do respons\xE1vel!"
  });
});
apiRouter.post("/auth/verify-registration", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "E-mail e c\xF3digo de verifica\xE7\xE3o s\xE3o obrigat\xF3rios." });
  }
  const key = String(email).trim().toLowerCase();
  const pending = pendingRegistrations.get(key);
  if (!pending) {
    return res.status(404).json({ error: "Nenhum cadastro pendente encontrado para este e-mail." });
  }
  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(key);
    registrationLastSentAt.delete(key);
    return res.status(400).json({ error: "O c\xF3digo de verifica\xE7\xE3o expirou. Fa\xE7a o cadastro novamente." });
  }
  const submittedCode = String(code).trim();
  const expectedCode = Buffer.from(pending.code, "utf8");
  const providedCode = Buffer.from(submittedCode, "utf8");
  const codesMatch = /^\d{6}$/.test(submittedCode) && expectedCode.length === providedCode.length && (0, import_crypto.timingSafeEqual)(expectedCode, providedCode);
  if (!codesMatch) {
    pending.failedAttempts += 1;
    if (pending.failedAttempts >= REGISTRATION_MAX_FAILED_ATTEMPTS) {
      pendingRegistrations.delete(key);
      return res.status(429).json({ error: "Muitas tentativas incorretas. Fa\xE7a o cadastro novamente." });
    }
    return res.status(400).json({ error: "C\xF3digo de verifica\xE7\xE3o incorreto." });
  }
  const tenantId = `tenant-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const hashedPassword = pending.passwordHash;
  const newTenant = {
    id: tenantId,
    name: pending.companyName,
    legalName: pending.companyName,
    cnpj: pending.cnpj,
    email: pending.email,
    phone: pending.phone,
    zipCode: "01000-000",
    address: "Av. Industrial",
    number: "123",
    neighborhood: "Distrito Industrial",
    city: "S\xE3o Paulo",
    state: "SP",
    status: "PENDENTE",
    // Crucial: Starts as PENDENTE
    notificationPlan: "SAAS_FREE",
    notificationBillingStatus: "NOT_REQUIRED",
    plan: "BASICO",
    planLimits: {
      maxUsers: 5,
      maxDrivers: 20,
      maxFreightsMonthly: 50,
      customForms: false,
      exportReports: true,
      prioritySupport: false
    },
    createdAt: now,
    updatedAt: now
  };
  const newUser = {
    id: userId,
    tenantId,
    name: pending.responsibleName,
    email: pending.email,
    phone: pending.phone,
    role: "EMPRESA_SUPER_ADMIN",
    // Owner of the tenant
    status: "PENDENTE",
    accountType: "REAL",
    readOnly: false,
    password: hashedPassword,
    termsAcceptedAt: pending.acceptedAt || now,
    privacyAcceptedAt: pending.acceptedAt || now,
    termsVersion: pending.termsVersion || CURRENT_LEGAL_VERSIONS.terms,
    privacyVersion: pending.privacyVersion || CURRENT_LEGAL_VERSIONS.privacy,
    createdAt: now
  };
  db.tenants.push(newTenant);
  db.users.push(newUser);
  await db.recordLegalConsent({
    userId: newUser.id,
    tenantId,
    termsVersion: pending.termsVersion || CURRENT_LEGAL_VERSIONS.terms,
    privacyVersion: pending.privacyVersion || CURRENT_LEGAL_VERSIONS.privacy,
    acceptedAt: pending.acceptedAt || now,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || ""
  });
  void dispatchConfiguredNotification("EMPRESA_CADASTRADA", [
    newUser,
    ...db.users.filter((user) => user.role === "SUPER_ADMIN")
  ], {
    nome: newUser.name,
    empresa: newTenant.name,
    email: newUser.email,
    telefone: newUser.phone,
    tenantId,
    link: process.env.APP_URL || ""
  });
  db.addNotification({
    tenantId: null,
    title: "\u{1F3E2} Novo Cadastro de Empresa",
    message: `A empresa "${pending.companyName}" se cadastrou e aguarda sua aprova\xE7\xE3o no Painel Global.`,
    type: "SISTEMA",
    userId: "user-superadmin"
  });
  db.addAuditLog({
    ip: requestIp(req),
    tenantId,
    userId,
    userName: pending.responsibleName,
    userRole: "EMPRESA_SUPER_ADMIN",
    action: "REGISTRO_EMPRESA",
    entity: "Tenant",
    entityId: tenantId,
    details: `Empresa ${pending.companyName} cadastrada e verificada por c\xF3digo. Aguardando aprova\xE7\xE3o do Super Admin.`
  });
  const provisioning = await provisionAtendoCrmTenant(newTenant);
  pendingRegistrations.delete(key);
  registrationLastSentAt.delete(key);
  res.json({
    success: true,
    provisioningStatus: provisioning.status,
    message: provisioning.status === "PROVISIONED" ? "Cadastro realizado e empresa criada no Atendo CRM. Aguarde a libera\xE7\xE3o do Super Administrador para acessar a plataforma." : "Cadastro realizado no Gestor. O provisionamento do Atendo CRM ficar\xE1 pendente para nova tentativa pelo administrador."
  });
});
apiRouter.post("/auth/register-driver", (_req, res) => {
  return res.status(410).json({ error: "Este endpoint legado foi desativado. Use o cadastro r\xE1pido da vitrine ou o cadastro autenticado da empresa." });
});
apiRouter.get("/tenants", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return res.json(db.tenants);
  }
  const tenant = db.tenants.find((t) => t.id === req.user?.tenantId);
  res.json(tenant ? [tenant] : []);
});
apiRouter.post("/tenants", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Apenas Super Admin pode criar empresas" });
  }
  await db.waitForPersistence();
  const {
    name,
    legalName,
    cnpj,
    email,
    phone,
    city,
    state,
    plan,
    allowedOperations,
    responsibleName,
    password,
    termsAccepted,
    privacyAccepted
  } = req.body || {};
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCnpj = String(cnpj || "").replace(/\D/g, "");
  const normalizedPhone = String(phone || "").trim();
  if (!normalizedName || normalizedName.length < 2 || normalizedCnpj.length !== 14 || !responsibleName || !normalizedEmail || !normalizedPhone || !password) {
    return res.status(400).json({ error: "Preencha os mesmos campos obrigat\xF3rios do cadastro da home." });
  }
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Informe um e-mail v\xE1lido para o respons\xE1vel." });
  }
  if (normalizePhoneForLookup(normalizedPhone).length < 10) {
    return res.status(400).json({ error: "Informe um celular v\xE1lido para o respons\xE1vel." });
  }
  if (String(password).length < 6 || password !== req.body.confirmPassword) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres e coincidir com a confirma\xE7\xE3o." });
  }
  if (termsAccepted !== true || privacyAccepted !== true) {
    return res.status(400).json({ error: "O cadastro exige aceite dos Termos de Uso e da Pol\xEDtica de Privacidade." });
  }
  if (db.tenants.some((tenant) => String(tenant.cnpj || "").replace(/\D/g, "") === normalizedCnpj)) {
    return res.status(400).json({ error: "Este CNPJ j\xE1 est\xE1 cadastrado no sistema." });
  }
  if (db.users.some((user) => user.email?.trim().toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Este e-mail j\xE1 est\xE1 sendo utilizado por outra conta." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const selectedPlan = plan === "EMPRESARIAL" || plan === "PROFISSIONAL" ? plan : "BASICO";
  const newTenant = {
    id: `tenant-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    name: normalizedName,
    legalName: String(legalName || normalizedName).trim() || normalizedName,
    cnpj: String(cnpj).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    zipCode: String(req.body.zipCode || "").trim(),
    address: String(req.body.address || "").trim(),
    number: String(req.body.number || "").trim(),
    neighborhood: String(req.body.neighborhood || "").trim(),
    city: String(city || "").trim(),
    state: String(state || "").trim().toUpperCase(),
    status: "ATIVA",
    notificationPlan: "SAAS_FREE",
    notificationBillingStatus: "NOT_REQUIRED",
    plan: selectedPlan,
    allowedOperations: Array.isArray(allowedOperations) && allowedOperations.length ? allowedOperations : ["CARGA_GERAL"],
    planLimits: {
      maxUsers: selectedPlan === "EMPRESARIAL" ? 100 : selectedPlan === "PROFISSIONAL" ? 25 : 5,
      maxDrivers: selectedPlan === "EMPRESARIAL" ? 500 : selectedPlan === "PROFISSIONAL" ? 100 : 20,
      maxFreightsMonthly: selectedPlan === "EMPRESARIAL" ? 2e3 : selectedPlan === "PROFISSIONAL" ? 500 : 50,
      customForms: selectedPlan !== "BASICO",
      exportReports: true,
      prioritySupport: selectedPlan === "EMPRESARIAL"
    },
    atendoCrmProvisioningStatus: "PENDING",
    createdAt: now,
    updatedAt: now
  };
  const newUser = {
    id: `user-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    tenantId: newTenant.id,
    name: String(responsibleName).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: "EMPRESA_SUPER_ADMIN",
    status: "ATIVO",
    accountType: "REAL",
    readOnly: false,
    password: await import_bcryptjs.default.hash(String(password), 10),
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
    termsVersion: CURRENT_LEGAL_VERSIONS.terms,
    privacyVersion: CURRENT_LEGAL_VERSIONS.privacy,
    createdAt: now
  };
  db.tenants.push(newTenant);
  db.users.push(newUser);
  await db.recordLegalConsent({ userId: newUser.id, tenantId: newTenant.id, termsVersion: CURRENT_LEGAL_VERSIONS.terms, privacyVersion: CURRENT_LEGAL_VERSIONS.privacy, acceptedAt: now, ipAddress: req.ip, userAgent: req.get("user-agent") || "" });
  db.addAuditLog({
    ip: requestIp(req),
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "CRIACAO_EMPRESA",
    entity: "Tenant",
    entityId: newTenant.id,
    details: `Empresa ${newTenant.name} criada com administrador respons\xE1vel e provisionamento Atendo CRM iniciado.`
  });
  const provisioning = await provisionAtendoCrmTenant(newTenant);
  await db.persistNow();
  void dispatchConfiguredNotification("EMPRESA_CADASTRADA", [newUser, ...db.users.filter((user) => user.role === "SUPER_ADMIN")], { nome: newUser.name, empresa: newTenant.name, email: newUser.email, telefone: newUser.phone, tenantId: newTenant.id, link: process.env.APP_URL || "" });
  res.status(201).json({ ...newTenant, atendoCrmProvisioningStatus: provisioning.status, atendoCrmTenantId: provisioning.externalTenantId });
});
apiRouter.post("/tenants/:id/provision-atendo", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas Super Admin pode reprocessar o provisionamento Atendo CRM." });
  const tenant = db.tenants.find((item) => item.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada." });
  const result = await provisionAtendoCrmTenant(tenant);
  await db.persistNow();
  return res.json({ success: result.status === "PROVISIONED", status: result.status, tenant: { ...tenant, atendoCrmProvisioningError: result.status === "ERROR" ? tenant.atendoCrmProvisioningError : void 0 } });
});
apiRouter.put("/tenants/:id", async (req, res) => {
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const isCompanyAdmin = (req.user?.role === "EMPRESA_SUPER_ADMIN" || req.user?.role === "ADMIN") && req.user?.tenantId === req.params.id;
  if (!isSuperAdmin && !isCompanyAdmin) {
    return res.status(403).json({ error: "Sem permiss\xE3o para editar esta empresa" });
  }
  const tenant = db.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada" });
  const { name, legalName, cnpj, email, phone, zipCode, address, number, neighborhood, city, state, plan, status, allowedOperations } = req.body;
  if (name) tenant.name = name;
  if (legalName) tenant.legalName = legalName;
  if (cnpj) tenant.cnpj = cnpj;
  if (email) tenant.email = email;
  if (phone) tenant.phone = phone;
  if (zipCode) tenant.zipCode = zipCode;
  if (address) tenant.address = address;
  if (number) tenant.number = number;
  if (neighborhood) tenant.neighborhood = neighborhood;
  if (city) tenant.city = city;
  if (state) tenant.state = state;
  if (allowedOperations && isSuperAdmin) {
    tenant.allowedOperations = allowedOperations;
  }
  if (plan && plan !== tenant.plan) {
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Apenas o Super Administrador pode alterar o plano contratado da empresa." });
    }
    tenant.plan = plan;
    tenant.planLimits = {
      maxUsers: plan === "EMPRESARIAL" ? 100 : plan === "PROFISSIONAL" ? 25 : 5,
      maxDrivers: plan === "EMPRESARIAL" ? 500 : plan === "PROFISSIONAL" ? 100 : 20,
      maxFreightsMonthly: plan === "EMPRESARIAL" ? 2e3 : plan === "PROFISSIONAL" ? 500 : 50,
      customForms: plan !== "BASICO",
      exportReports: true,
      prioritySupport: plan === "EMPRESARIAL"
    };
  }
  if (status && status !== tenant.status) {
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Apenas o Super Administrador pode aprovar ou alterar o status operacional da empresa." });
    }
    tenant.status = status;
    if (status === "ATIVA") {
      db.users.forEach((u) => {
        if (u.tenantId === tenant.id && u.status === "PENDENTE") {
          u.status = "ATIVO";
        }
      });
      const responsibleUser = db.users.find(
        (user) => user.tenantId === tenant.id && user.role === "EMPRESA_SUPER_ADMIN" && String(user.email || "").trim().toLowerCase() === String(tenant.email || "").trim().toLowerCase()
      ) || db.users.find((user) => user.tenantId === tenant.id && user.role === "EMPRESA_SUPER_ADMIN");
      const notificationRecipients = [
        responsibleUser,
        ...db.users.filter((user) => user.role === "SUPER_ADMIN")
      ].filter((user) => Boolean(user));
      void dispatchConfiguredNotification("EMPRESA_APROVADA", notificationRecipients, {
        nome: responsibleUser?.name || tenant.name,
        empresa: tenant.name,
        tenantId: tenant.id,
        link: process.env.APP_URL || ""
      });
      await provisionAtendoCrmTenant(tenant);
    }
  }
  tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "ATUALIZAR_EMPRESA",
    entity: "Tenant",
    entityId: tenant.id,
    details: `Empresa ${tenant.name} atualizada`
  });
  await db.persistNow();
  res.json(tenant);
});
apiRouter.post("/tenants/:id/activate-plan", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas Super Admin pode ativar planos manualmente." });
  const tenant = db.tenants.find((item) => item.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: "Empresa n\xE3o encontrada." });
  const plan = req.body?.plan || tenant.plan;
  const validPlans = ["BASICO", "PROFISSIONAL", "EMPRESARIAL"];
  if (!validPlans.includes(plan)) return res.status(400).json({ error: "Plano inv\xE1lido." });
  const days = Number(req.body?.days ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > 3660) return res.status(400).json({ error: "A validade deve ser um n\xFAmero inteiro entre 1 e 3660 dias." });
  tenant.plan = plan;
  tenant.planLimits = {
    maxUsers: plan === "EMPRESARIAL" ? 100 : plan === "PROFISSIONAL" ? 25 : 5,
    maxDrivers: plan === "EMPRESARIAL" ? 500 : plan === "PROFISSIONAL" ? 100 : 20,
    maxFreightsMonthly: plan === "EMPRESARIAL" ? 2e3 : plan === "PROFISSIONAL" ? 500 : 50,
    customForms: plan !== "BASICO",
    exportReports: true,
    prioritySupport: plan === "EMPRESARIAL"
  };
  tenant.status = "ATIVA";
  tenant.billingStatus = "ACTIVE";
  tenant.billingCycle = "MANUAL";
  tenant.billingNextDueDate = new Date(Date.now() + days * 864e5).toISOString();
  tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.users.forEach((user) => {
    if (user.tenantId === tenant.id && user.status === "PENDENTE") user.status = "ATIVO";
  });
  db.addAuditLog({ ip: requestIp(req), userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "ATIVAR_PLANO_MANUAL", entity: "Tenant", entityId: tenant.id, details: `Plano ${plan} ativado manualmente por ${days} dias.` });
  await db.persistNow();
  return res.json({ success: true, tenant });
});
apiRouter.delete("/tenants/:id", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Apenas Super Admin pode excluir empresas" });
  }
  const index = db.tenants.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Empresa n\xE3o encontrada" });
  if (db.tenants.length <= 1) {
    return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel excluir a \xFAltima empresa do sistema" });
  }
  const tenant = db.tenants[index];
  tenant.status = "INATIVA";
  tenant.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: tenant.id,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "DESATIVAR_EMPRESA",
    entity: "Tenant",
    entityId: tenant.id,
    details: `Empresa ${tenant.name} desativada sem apagar usu\xE1rios, documentos ou hist\xF3rico.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Empresa desativada; usu\xE1rios, documentos e hist\xF3rico preservados." });
});
apiRouter.get("/users", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return res.json(db.users.map(sanitizeUser));
  }
  const tenantUsers = db.users.filter((u) => u.tenantId === req.user?.tenantId);
  res.json(tenantUsers.map(sanitizeUser));
});
apiRouter.post("/users", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas administradores reais podem cadastrar usu\xE1rios." });
  const {
    name,
    email,
    phone,
    role,
    tenantId,
    password,
    // Driver fields
    createAsDriver,
    cpf,
    rg,
    birthDate,
    zipCode,
    address,
    city,
    state,
    cnh,
    cnhCategory,
    cnhExpiresAt,
    rntrc,
    notes,
    // Bank info
    bankName,
    bankAgency,
    bankAccount,
    pixKeyType,
    pixKey,
    // Vehicle fields
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    vehiclePlate,
    vehicleRenavam,
    capacityKg,
    bodyType
  } = req.body;
  const requestedRole = role || (createAsDriver ? "MOTORISTA" : "USUARIO");
  if (!canAssignUserRole(req.user, requestedRole)) return res.status(403).json({ error: "Voc\xEA n\xE3o pode atribuir este n\xEDvel de acesso." });
  const targetTenantId = req.user?.role === "SUPER_ADMIN" ? requestedRole === "SUPER_ADMIN" ? null : tenantId : req.user?.tenantId;
  if (requestedRole !== "SUPER_ADMIN" && (!targetTenantId || !db.tenants.some((tenant) => tenant.id === targetTenantId))) return res.status(400).json({ error: "Empresa v\xE1lida \xE9 obrigat\xF3ria para este perfil." });
  if (!name || !email) {
    return res.status(400).json({ error: "Nome e e-mail s\xE3o obrigat\xF3rios" });
  }
  const emailExists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Este e-mail j\xE1 est\xE1 sendo utilizado por outra conta." });
  }
  const hashedPassword = password && password.trim() ? await import_bcryptjs.default.hash(password.trim(), 10) : void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newUserId = `user-${Date.now()}`;
  const newDriverId = `driver-${Date.now()}`;
  const isDriver = requestedRole === "MOTORISTA" || createAsDriver;
  const newUser = {
    id: newUserId,
    tenantId: targetTenantId || null,
    name,
    email,
    phone: phone || "",
    role: isDriver ? "MOTORISTA" : requestedRole,
    status: "ATIVO",
    accountType: "REAL",
    readOnly: false,
    password: hashedPassword,
    driverId: isDriver ? newDriverId : void 0,
    createdAt: now
  };
  db.users.push(newUser);
  if (isDriver) {
    const newDriver = {
      id: newDriverId,
      userId: newUserId,
      tenantId: targetTenantId || null,
      name,
      cpf: cpf || "",
      rg: rg || "",
      birthDate: birthDate || "",
      phone: phone || "",
      email,
      zipCode: zipCode || "",
      address: address || "",
      city: city || "",
      state: state || "",
      cnh: cnh || "",
      cnhCategory: cnhCategory || "",
      cnhExpiresAt: cnhExpiresAt || "",
      status: "DISPONIVEL",
      rating: 5,
      completedTrips: 0,
      rntrc: rntrc || "",
      notes: notes || "",
      bankName: bankName || "",
      bankAgency: bankAgency || "",
      bankAccount: bankAccount || "",
      pixKeyType: pixKeyType || "",
      pixKey: pixKey || "",
      createdAt: now
    };
    db.drivers.push(newDriver);
    if (vehiclePlate || vehicleModel) {
      const newVehicleId = `vehicle-${Date.now()}`;
      const newVehicle = {
        id: newVehicleId,
        driverId: newDriverId,
        tenantId: targetTenantId || db.tenants[0].id,
        type: vehicleType || "TRUCK",
        brand: vehicleBrand || "Mercedes-Benz",
        model: vehicleModel || "Atego",
        year: Number(vehicleYear) || 2022,
        plate: vehiclePlate || "ABC1D23",
        renavam: vehicleRenavam || "00123456789",
        capacityKg: Number(capacityKg) || 12e3,
        bodyType: bodyType || "BAU",
        status: "ATIVO",
        createdAt: now
      };
      db.vehicles.push(newVehicle);
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetTenantId || void 0,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "CRIACAO_USUARIO",
    entity: "User",
    entityId: newUser.id,
    details: isDriver ? `Criado usu\xE1rio ${newUser.name} com perfil Motorista e registro completo de documentos, dados banc\xE1rios e ve\xEDculo` : `Criado usu\xE1rio ${newUser.name} com perfil ${newUser.role}`
  });
  const tenantUsers = targetTenantId ? db.users.filter((user) => user.tenantId === targetTenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(user.role)) : [];
  void dispatchConfiguredNotification("USUARIO_CADASTRADO", [newUser, ...tenantUsers], {
    nome: newUser.name,
    empresa: targetTenantId ? db.tenants.find((tenant) => tenant.id === targetTenantId)?.name || "" : "Elo Log",
    email: newUser.email,
    telefone: newUser.phone,
    tenantId: targetTenantId || void 0,
    link: process.env.APP_URL || ""
  });
  res.status(201).json(sanitizeUser(newUser));
});
apiRouter.put("/users/:id", async (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
  }
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const isSelf = req.user?.id === user.id;
  const isSameTenantAdmin = Boolean(req.user && TENANT_ADMIN_ROLES.includes(req.user.role) && req.user.tenantId === user.tenantId);
  const canManageUserFields = Boolean(isSuperAdmin || isSameTenantAdmin && !isSelf);
  if (!isSuperAdmin && !isSelf && !isSameTenantAdmin) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para editar este usu\xE1rio" });
  }
  const { name, email, phone, role, status, password } = req.body || {};
  const previousUserStatus = user.status;
  const normalizedName = name === void 0 ? user.name : String(name).trim().slice(0, 160);
  const normalizedEmail = email === void 0 ? user.email : String(email).trim().toLowerCase().slice(0, 254);
  const normalizedPhone = phone === void 0 ? user.phone : String(phone).trim().slice(0, 30);
  if (normalizedName.length < 2 || !normalizedEmail.includes("@")) return res.status(400).json({ error: "Nome e e-mail v\xE1lidos s\xE3o obrigat\xF3rios." });
  if (db.users.some((item) => item.id !== user.id && item.email.trim().toLowerCase() === normalizedEmail)) return res.status(409).json({ error: "Este e-mail j\xE1 est\xE1 sendo utilizado por outra conta." });
  if (normalizedPhone && db.users.some((item) => item.id !== user.id && item.phone && normalizePhoneForLookup(item.phone) === normalizePhoneForLookup(normalizedPhone))) return res.status(409).json({ error: "Este telefone j\xE1 est\xE1 associado a outra conta." });
  if ((role !== void 0 || status !== void 0) && !canManageUserFields) return res.status(403).json({ error: "Somente administradores podem alterar papel ou status." });
  if (role !== void 0 && !canAssignUserRole(req.user, role)) return res.status(403).json({ error: "Voc\xEA n\xE3o pode atribuir este n\xEDvel de acesso." });
  if (status !== void 0 && !["ATIVO", "PENDENTE", "BLOQUEADO"].includes(status)) return res.status(400).json({ error: "Status de usu\xE1rio inv\xE1lido." });
  if (password !== void 0 && String(password).trim() && String(password).trim().length < 8) return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  user.name = normalizedName;
  user.email = normalizedEmail;
  user.phone = normalizedPhone;
  if (password && String(password).trim()) {
    user.password = await import_bcryptjs.default.hash(String(password).trim(), 12);
  }
  if (canManageUserFields && role !== void 0) user.role = role;
  if (canManageUserFields && status !== void 0) user.status = status;
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (user.driverId) {
    const driver = db.drivers.find((d) => d.id === user.driverId || d.userId === user.id);
    if (driver) {
      if (name) driver.name = name;
      if (email) driver.email = email;
      if (phone) driver.phone = phone;
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: user.tenantId || void 0,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "ATUALIZAR_USUARIO",
    entity: "User",
    entityId: user.id,
    details: `Usu\xE1rio ${user.name} atualizado com sucesso`
  });
  if (status && status !== previousUserStatus) {
    const tenantAdmins = user.tenantId ? db.users.filter((item) => item.tenantId === user.tenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(item.role)) : [];
    void dispatchConfiguredNotification("USUARIO_STATUS_ATUALIZADO", [user, ...tenantAdmins], {
      nome: user.name,
      empresa: user.tenantId ? db.tenants.find((tenant) => tenant.id === user.tenantId)?.name || "" : "Elo Log",
      status: user.status,
      email: user.email,
      telefone: user.phone,
      tenantId: user.tenantId || void 0,
      link: process.env.APP_URL || ""
    });
  }
  res.json(sanitizeUser(user));
});
apiRouter.delete("/users/:id", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem desativar usu\xE1rios." });
  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
  if (req.user?.id === targetUser.id) return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel desativar seu pr\xF3prio usu\xE1rio logado" });
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const isSameTenantAdmin = (req.user?.role === "ADMIN" || req.user?.role === "EMPRESA_SUPER_ADMIN") && req.user?.tenantId === targetUser.tenantId;
  if (!isSuperAdmin && !isSameTenantAdmin) return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para desativar este usu\xE1rio" });
  targetUser.status = "BLOQUEADO";
  targetUser.readOnly = true;
  targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "BLOQUEAR_USUARIO",
    entity: "User",
    entityId: targetUser.id,
    details: `Usu\xE1rio ${targetUser.name} (${targetUser.email}) bloqueado sem apagar cadastro ou auditoria.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Usu\xE1rio bloqueado; cadastro e hist\xF3rico preservados." });
});
apiRouter.put("/auth/profile", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "N\xE3o autenticado" });
  }
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
  }
  const { name, email, phone, password } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (password && password.trim()) {
    user.password = await import_bcryptjs.default.hash(password.trim(), 10);
  }
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: user.tenantId || void 0,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: "UPDATE_PROFILE",
    entity: "User",
    entityId: user.id,
    details: `Usu\xE1rio atualizou o pr\xF3prio perfil ${password && password.trim() ? "(incluindo altera\xE7\xE3o de senha)" : ""}`
  });
  let updatedDriver;
  if (user.driverId) {
    const driver = db.drivers.find((d) => d.id === user.driverId || d.userId === user.id);
    if (driver) {
      if (name) driver.name = name;
      if (email) driver.email = email;
      if (phone) driver.phone = phone;
      if (req.body.address) driver.address = req.body.address;
      if (req.body.city) driver.city = req.body.city;
      if (req.body.state) driver.state = req.body.state;
      if (req.body.zipCode) driver.zipCode = req.body.zipCode;
      updatedDriver = driver;
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: user.tenantId || void 0,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: "ATUALIZAR_PERFIL",
    entity: "User",
    entityId: user.id,
    details: `Perfil de usu\xE1rio atualizado pelo pr\xF3prio titular`
  });
  res.json({
    success: true,
    user: sanitizeUser(user),
    driver: updatedDriver
  });
});
apiRouter.post("/drivers/register", async (req, res) => {
  const allowedRoles = ["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"];
  if (!req.user || !allowedRoles.includes(req.user.role) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas administradores reais podem cadastrar motorista." });
  const targetTenantId = req.user.role === "SUPER_ADMIN" ? String(req.body?.tenantId || "") : String(req.user.tenantId || "");
  if (!targetTenantId || !db.tenants.some((tenant) => tenant.id === targetTenantId)) return res.status(400).json({ error: "Empresa de v\xEDnculo n\xE3o identificada." });
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const cpf = String(req.body?.cpf || "").trim();
  const cnh = String(req.body?.cnh || "").trim();
  if (name.length < 5 || !email || normalizePhoneForLookup(phone).length < 10 || !cpf || !cnh) return res.status(400).json({ error: "Preencha nome, e-mail, telefone, CPF e CNH." });
  const cleanPhone = normalizePhoneForLookup(phone);
  const cleanEmail = email.toLowerCase();
  const cleanCpf = normalizePublicIdentity(cpf);
  const cleanCnh = normalizePublicIdentity(cnh);
  const duplicateUser = db.users.find((user) => user.email?.trim().toLowerCase() === cleanEmail || normalizePhoneForLookup(user.phone) === cleanPhone);
  const duplicateDriver = db.drivers.find((driver) => normalizePublicIdentity(driver.cpf) === cleanCpf || normalizePublicIdentity(driver.cnh) === cleanCnh);
  const plate = String(req.body?.vehiclePlate || "").trim().toUpperCase();
  const duplicatePlate = plate && db.vehicles.some((vehicle) => normalizePublicPlate(vehicle.plate) === normalizePublicPlate(plate));
  if (duplicateUser) return res.status(409).json({ error: "E-mail ou telefone j\xE1 est\xE1 associado a outro cadastro." });
  if (duplicateDriver) return res.status(409).json({ error: "CPF ou CNH j\xE1 est\xE1 associado a outro motorista." });
  if (duplicatePlate) return res.status(409).json({ error: "A placa j\xE1 est\xE1 associada a outro ve\xEDculo." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userId = `user-driver-${Date.now()}`;
  const driverId = `driver-${Date.now()}`;
  const vehicleId = `vehicle-${Date.now()}`;
  const newUser = { id: userId, tenantId: null, name, email, phone, role: "MOTORISTA", status: "ATIVO", accountType: "REAL", readOnly: false, driverId, lastLoginAt: null, createdAt: now };
  const newDriver = { id: driverId, userId, tenantId: null, name, cpf, rg: String(req.body?.rg || ""), birthDate: String(req.body?.birthDate || ""), phone, email, zipCode: String(req.body?.zipCode || ""), address: String(req.body?.address || ""), city: String(req.body?.city || ""), state: String(req.body?.state || "").toUpperCase(), cnh, cnhCategory: String(req.body?.cnhCategory || "B"), cnhExpiresAt: String(req.body?.cnhExpiresAt || ""), status: "DISPONIVEL", rating: 0, completedTrips: 0, vehiclesCount: 1, createdAt: now };
  const newVehicle = { id: vehicleId, driverId, tenantId: null, type: String(req.body?.vehicleType || "TRUCK"), brand: String(req.body?.vehicleBrand || ""), model: String(req.body?.vehicleModel || ""), year: Number(req.body?.vehicleYear || (/* @__PURE__ */ new Date()).getFullYear()), plate, renavam: String(req.body?.vehicleRenavam || ""), capacityKg: Number(req.body?.capacityKg || 0), bodyType: String(req.body?.bodyType || "BAU"), status: "ATIVO", createdAt: now };
  db.users.push(newUser);
  db.drivers.push(newDriver);
  db.vehicles.push(newVehicle);
  db.upsertDriverCompanyLink({ driverId, tenantId: targetTenantId, status: "APROVADO", scope: "EMPRESA", source: "COMPANY_ADMIN_REGISTRATION", approvedAt: now, approvedByUserId: req.user.id });
  db.addAuditLog({ ip: requestIp(req), tenantId: targetTenantId, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "CADASTRO_MOTORISTA", entity: "Driver", entityId: driverId, details: `Motorista global cadastrado e aprovado para a empresa ${targetTenantId}.` });
  void dispatchConfiguredNotification("MOTORISTA_CADASTRADO", [newUser, ...db.users.filter((user) => user.tenantId === targetTenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(user.role))], { nome: name, empresa: db.tenants.find((tenant) => tenant.id === targetTenantId)?.name || "", status: newUser.status, link: process.env.APP_URL || "" });
  await db.persistNow();
  return res.status(201).json({ user: sanitizeUser(newUser), driver: newDriver, vehicle: newVehicle });
});
apiRouter.get("/drivers", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return res.json(db.drivers.map(sanitizeDriver));
  }
  const drivers = db.drivers.filter((d) => req.user?.tenantId ? db.hasDriverCompanyAccess(d.id, req.user.tenantId, true) : false);
  res.json(drivers.map(sanitizeDriver));
});
apiRouter.put("/drivers/:id", (req, res) => {
  const driver = db.drivers.find((d) => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: "Motorista n\xE3o encontrado" });
  const isSelfDriver = req.user?.role === "MOTORISTA" && (driver.userId === req.user.id || driver.id === req.user.driverId);
  const isCompanyAdmin = req.user?.role === "SUPER_ADMIN" || Boolean(req.user?.tenantId) && TENANT_ADMIN_ROLES.includes(req.user.role) && db.hasDriverCompanyAccess(driver.id, req.user.tenantId, true);
  if (!isSelfDriver && !isCompanyAdmin) return res.status(403).json({ error: "Apenas o pr\xF3prio motorista ou um administrador da empresa pode editar este cadastro." });
  const body = req.body || {};
  const text = (value, fallback, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : fallback;
  if (body.name !== void 0) driver.name = text(body.name, driver.name, 160);
  if (body.phone !== void 0) driver.phone = text(body.phone, driver.phone, 30);
  if (body.zipCode !== void 0) driver.zipCode = text(body.zipCode, driver.zipCode, 20);
  if (body.address !== void 0) driver.address = text(body.address, driver.address, 300);
  if (body.city !== void 0) driver.city = text(body.city, driver.city, 120);
  if (body.state !== void 0) driver.state = text(body.state, driver.state, 2).toUpperCase();
  if (isCompanyAdmin) {
    if (body.cpf !== void 0) driver.cpf = text(body.cpf, driver.cpf, 30);
    if (body.rg !== void 0) driver.rg = text(body.rg, driver.rg, 30);
    if (body.birthDate !== void 0) driver.birthDate = text(body.birthDate, driver.birthDate, 32);
    if (body.cnh !== void 0) driver.cnh = text(body.cnh, driver.cnh, 30);
    if (body.cnhCategory !== void 0) driver.cnhCategory = text(body.cnhCategory, driver.cnhCategory, 2);
    if (body.cnhExpiresAt !== void 0) driver.cnhExpiresAt = text(body.cnhExpiresAt, driver.cnhExpiresAt, 32);
    if (body.status !== void 0 && ["DISPONIVEL", "EM_VIAGEM", "INATIVO", "PENDENTE"].includes(body.status)) driver.status = body.status;
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: driver.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "ATUALIZAR_MOTORISTA",
    entity: "Driver",
    entityId: driver.id,
    details: `Motorista ${driver.name} atualizado`
  });
  res.json(sanitizeDriver(driver));
});
apiRouter.get("/vehicles", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") return res.json(db.vehicles);
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.json([]);
  const vehicles = db.vehicles.filter((vehicle) => vehicle.tenantId === tenantId || vehicle.tenantId === null && db.hasDriverCompanyAccess(vehicle.driverId, tenantId, true));
  res.json(vehicles);
});
apiRouter.get("/company-vehicles", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") return res.json(db.companyVehicles.map((vehicle) => ({ ...vehicle, tenantName: db.tenants.find((t) => t.id === vehicle.tenantId)?.name })));
  if (!req.user?.tenantId) return res.status(403).json({ error: "Empresa n\xE3o identificada." });
  res.json(db.companyVehicles.filter((vehicle) => vehicle.tenantId === req.user?.tenantId));
});
apiRouter.post("/company-vehicles", (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas administradores reais podem cadastrar ve\xEDculos pr\xF3prios." });
  const tenantId = req.user?.role === "SUPER_ADMIN" ? String(req.body?.tenantId || "") : req.user?.tenantId || "";
  if (!tenantId) return res.status(400).json({ error: "Empresa obrigat\xF3ria para cadastrar ve\xEDculo pr\xF3prio." });
  const body = req.body || {};
  const plate = normalizePublicPlate(body.plate);
  const renavam = normalizePublicIdentity(body.renavam);
  if (!plate || !renavam || !body.brand || !body.model || !body.type || !body.bodyType) return res.status(400).json({ error: "Placa, RENAVAM, tipo, carroceria, marca e modelo s\xE3o obrigat\xF3rios." });
  if (db.companyVehicles.some((vehicle2) => normalizePublicPlate(vehicle2.plate) === plate || normalizePublicIdentity(vehicle2.renavam) === renavam)) return res.status(409).json({ error: "J\xE1 existe ve\xEDculo pr\xF3prio com esta placa ou RENAVAM." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const vehicle = { id: `company-vehicle-${Date.now()}`, tenantId, type: body.type, brand: String(body.brand).trim(), model: String(body.model).trim(), year: Number(body.year || (/* @__PURE__ */ new Date()).getFullYear()), plate: String(body.plate).trim().toUpperCase(), renavam: String(body.renavam).trim(), capacityKg: Number(body.capacityKg || 0), bodyType: body.bodyType, ownerName: String(body.ownerName || "").trim(), ownerCnpj: String(body.ownerCnpj || "").trim(), registrationState: String(body.registrationState || "").trim().toUpperCase(), crlvNumber: String(body.crlvNumber || "").trim(), status: "ATIVO", notes: String(body.notes || "").trim(), createdAt: now, updatedAt: now };
  db.companyVehicles.unshift(vehicle);
  db.addAuditLog({ ip: requestIp(req), tenantId, userId: req.user?.id || "system", userName: req.user?.name || "Sistema", userRole: req.user?.role || "ADMIN", action: "CRIAR_VEICULO_PROPRIO", entity: "CompanyVehicle", entityId: vehicle.id, details: `Ve\xEDculo pr\xF3prio ${vehicle.plate} cadastrado para documentos e opera\xE7\xF5es da empresa.` });
  res.status(201).json(vehicle);
});
apiRouter.put("/company-vehicles/:id", (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas administradores reais podem editar ve\xEDculos pr\xF3prios." });
  const vehicle = db.companyVehicles.find((item) => item.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Ve\xEDculo pr\xF3prio n\xE3o encontrado." });
  if (req.user?.role !== "SUPER_ADMIN" && vehicle.tenantId !== req.user?.tenantId) return res.status(403).json({ error: "Este ve\xEDculo pertence a outra empresa." });
  const body = req.body || {};
  const nextPlate = normalizePublicPlate(body.plate || vehicle.plate);
  const nextRenavam = normalizePublicIdentity(body.renavam || vehicle.renavam);
  if (db.companyVehicles.some((item) => item.id !== vehicle.id && (normalizePublicPlate(item.plate) === nextPlate || normalizePublicIdentity(item.renavam) === nextRenavam))) return res.status(409).json({ error: "J\xE1 existe outro ve\xEDculo pr\xF3prio com esta placa ou RENAVAM." });
  const allowed = ["type", "brand", "model", "year", "plate", "renavam", "capacityKg", "bodyType", "ownerName", "ownerCnpj", "registrationState", "crlvNumber", "status", "notes"];
  for (const key of allowed) if (body[key] !== void 0) vehicle[key] = key === "plate" ? String(body[key]).trim().toUpperCase() : body[key];
  vehicle.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  res.json(vehicle);
});
apiRouter.delete("/company-vehicles/:id", (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas administradores reais podem desativar ve\xEDculos pr\xF3prios." });
  const vehicle = db.companyVehicles.find((item) => item.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Ve\xEDculo pr\xF3prio n\xE3o encontrado." });
  if (req.user?.role !== "SUPER_ADMIN" && vehicle.tenantId !== req.user?.tenantId) return res.status(403).json({ error: "Este ve\xEDculo pertence a outra empresa." });
  vehicle.status = "INATIVO";
  vehicle.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({ ip: requestIp(req), tenantId: vehicle.tenantId, userId: req.user?.id || "system", userName: req.user?.name || "Sistema", userRole: req.user?.role || "ADMIN", action: "DESATIVAR_VEICULO_PROPRIO", entity: "CompanyVehicle", entityId: vehicle.id, details: `Ve\xEDculo pr\xF3prio ${vehicle.plate} desativado sem apagar hist\xF3rico.` });
  res.json({ success: true, message: "Ve\xEDculo pr\xF3prio desativado; hist\xF3rico preservado." });
});
apiRouter.get("/freights", (req, res) => {
  const { status, originCity, destinationCity, vehicleType, onlyMine } = req.query;
  let list = db.freights;
  if (req.user?.role === "SUPER_ADMIN") {
  } else if (req.user?.role === "MOTORISTA") {
    const driverId = req.user.driverId;
    if (onlyMine === "true") {
      list = list.filter((f) => f.assignedDriverId === driverId);
    } else {
      list = list.filter(
        (f) => db.hasDriverCompanyAccess(driverId || "", f.tenantId, false, f.id) && ["DISPONIVEL", "PUBLICADO"].includes(f.status) || f.assignedDriverId === driverId
      );
    }
  } else {
    list = list.filter((f) => f.tenantId === req.user?.tenantId);
  }
  if (status) {
    list = list.filter((f) => f.status === status);
  }
  if (originCity) {
    list = list.filter((f) => f.origin.city.toLowerCase().includes(originCity.toLowerCase()));
  }
  if (destinationCity) {
    list = list.filter((f) => f.destination.city.toLowerCase().includes(destinationCity.toLowerCase()));
  }
  if (vehicleType) {
    list = list.filter((f) => f.requirements.vehicleType === vehicleType);
  }
  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(req.user?.role === "MOTORISTA" ? list.map((freight) => redactDriverFreightPayment(freight, req.user?.driverId)) : list);
});
apiRouter.get("/freights/:id", (req, res) => {
  const freight = db.freights.find((f) => f.id === req.params.id);
  if (!freight) {
    return res.status(404).json({ error: "Frete n\xE3o encontrado" });
  }
  if (req.user?.role !== "SUPER_ADMIN" && (req.user?.role === "MOTORISTA" ? !req.user.driverId || !db.hasDriverCompanyAccess(req.user.driverId, freight.tenantId, false, freight.id) : req.user?.tenantId !== freight.tenantId)) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado a este frete" });
  }
  const formResponses = db.formResponses.filter(
    (response) => response.freightId === freight.id && (req.user?.role !== "MOTORISTA" || response.filledByUserId === req.user.id || response.driverId === req.user.driverId)
  );
  const safeFreight = req.user?.role === "MOTORISTA" ? redactDriverFreightPayment(freight, req.user.driverId) : freight;
  res.json({
    ...safeFreight,
    companyVehicle: freight.companyVehicleId ? db.companyVehicles.find((vehicle) => vehicle.id === freight.companyVehicleId) : void 0,
    formResponses
  });
});
apiRouter.post("/freights", (req, res) => {
  if (req.user?.role === "MOTORISTA") {
    return res.status(403).json({ error: "Motoristas n\xE3o possuem permiss\xE3o para cadastrar fretes" });
  }
  const tenantId = req.user?.role === "SUPER_ADMIN" ? req.body.tenantId || null : req.user?.tenantId;
  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (tenant) {
    const currentMonth = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
    const tenantFreightsThisMonth = db.freights.filter(
      (f) => f.tenantId === tenant.id && f.createdAt.startsWith(currentMonth)
    ).length;
    const maxLimit = tenant.planLimits?.maxFreightsMonthly || 0;
    if (tenantFreightsThisMonth >= maxLimit) {
      return res.status(403).json({
        error: "Limite de fretes mensais atingido para o plano atual (" + maxLimit + "). Fa\xE7a o upgrade para continuar cadastrando."
      });
    }
  }
  const {
    origin,
    destination,
    cargo,
    requirements,
    payment,
    publishImmediately,
    distanceKm,
    customData,
    companyVehicleId,
    publicListingEnabled,
    publicPriceVisibleToRegistered,
    publicInterestEnabled
  } = req.body;
  const requestedBudgetId = customData?.budgetId ? String(customData.budgetId) : "";
  const linkedBudget = requestedBudgetId ? db.budgets.find((budget) => budget.id === requestedBudgetId && budget.tenantId === tenantId && !budget.convertedFreightId) : void 0;
  if (requestedBudgetId && !linkedBudget) return res.status(400).json({ error: "Or\xE7amento selecionado n\xE3o pertence \xE0 empresa, n\xE3o existe ou j\xE1 foi convertido." });
  if (!origin?.city || !origin?.state || !destination?.city || !destination?.state || !payment?.price) {
    return res.status(400).json({ error: "Origem, destino e valor s\xE3o obrigat\xF3rios" });
  }
  if (companyVehicleId && !db.companyVehicles.some((vehicle) => vehicle.id === companyVehicleId && vehicle.tenantId === tenantId && vehicle.status === "ATIVO")) return res.status(400).json({ error: "Ve\xEDculo pr\xF3prio selecionado n\xE3o pertence \xE0 empresa ou est\xE1 inativo." });
  if (req.body.operationType !== void 0 && !["CARGA_GERAL", "LOGISTICA_VEICULOS"].includes(req.body.operationType)) return res.status(400).json({ error: "Tipo de opera\xE7\xE3o inv\xE1lido." });
  const safeOperationType = req.body.operationType === "LOGISTICA_VEICULOS" ? "LOGISTICA_VEICULOS" : "CARGA_GERAL";
  const safePublicListing = Boolean(publicListingEnabled);
  const initialStatus = publishImmediately ? "DISPONIVEL" : "RASCUNHO";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const nextSeq = db.freights.length + 1;
  const code = `FRT-2026-${String(nextSeq).padStart(4, "0")}`;
  const newFreight = {
    id: `freight-${Date.now()}`,
    code,
    tenantId,
    tenantName: tenant?.name || "Transportadora",
    operationType: safeOperationType,
    origin: {
      zipCode: origin.zipCode || "15000-000",
      address: origin.address || "Endere\xE7o de Coleta",
      number: origin.number || "S/N",
      neighborhood: origin.neighborhood || "Industrial",
      city: origin.city,
      state: origin.state,
      date: origin.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timeWindow: origin.timeWindow || "08:00 \xE0s 17:00",
      lat: Number.isFinite(Number(origin.lat)) ? Number(origin.lat) : void 0,
      lng: Number.isFinite(Number(origin.lng)) ? Number(origin.lng) : void 0,
      mapboxPlaceId: origin.mapboxPlaceId ? String(origin.mapboxPlaceId).slice(0, 180) : void 0,
      contactName: origin.contactName,
      contactPhone: origin.contactPhone
    },
    destination: {
      zipCode: destination.zipCode || "01000-000",
      address: destination.address || "Endere\xE7o de Entrega",
      number: destination.number || "S/N",
      neighborhood: destination.neighborhood || "Comercial",
      city: destination.city,
      state: destination.state,
      date: destination.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timeWindow: destination.timeWindow || "08:00 \xE0s 18:00",
      lat: Number.isFinite(Number(destination.lat)) ? Number(destination.lat) : void 0,
      lng: Number.isFinite(Number(destination.lng)) ? Number(destination.lng) : void 0,
      mapboxPlaceId: destination.mapboxPlaceId ? String(destination.mapboxPlaceId).slice(0, 180) : void 0,
      contactName: destination.contactName,
      contactPhone: destination.contactPhone
    },
    distanceKm: Number(distanceKm) || 450,
    cargo: {
      description: cargo?.description || "Carga geral",
      type: cargo?.type || "GERAL",
      weightKg: Number(cargo?.weightKg) || 8e3,
      volumeCount: Number(cargo?.volumeCount) || 10,
      dimensions: cargo?.dimensions,
      requiresInsurance: cargo?.requiresInsurance ?? true,
      notes: cargo?.notes
    },
    requirements: {
      vehicleType: requirements?.vehicleType || "TRUCK",
      bodyTypeRequired: requirements?.bodyTypeRequired || "BAU",
      minCapacityKg: Number(requirements?.minCapacityKg) || 8e3,
      helperRequired: requirements?.helperRequired || false,
      trackerRequired: requirements?.trackerRequired ?? true,
      cnhMinCategory: requirements?.cnhMinCategory || "C"
    },
    payment: {
      price: Number(payment.price),
      paymentMethod: payment.paymentMethod || "PIX",
      tollIncluded: payment.tollIncluded ?? true,
      advancePercentage: payment.advancePercentage || 70,
      notes: payment.notes
    },
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        changedByUserId: req.user.id,
        changedByName: req.user.name,
        notes: publishImmediately ? "Frete criado e publicado imediatamente" : "Rascunho criado"
      }
    ],
    createdByUserId: req.user.id,
    createdByName: req.user.name,
    createdAt: now,
    updatedAt: now,
    customData: requestedBudgetId ? { ...customData || {}, budgetCode: linkedBudget?.code, budgetStatus: linkedBudget?.status } : customData,
    companyVehicleId: companyVehicleId || void 0,
    publicListingEnabled: safePublicListing,
    publicPriceVisibleToRegistered: safePublicListing && publicPriceVisibleToRegistered !== false,
    publicInterestEnabled: safePublicListing && publicInterestEnabled !== false,
    publicPublishedAt: safePublicListing && publishImmediately ? now : void 0,
    publicTrackingToken: (0, import_crypto.randomBytes)(16).toString("hex")
  };
  db.freights.unshift(newFreight);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: tenantId || void 0,
    tenantName: tenant?.name,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: publishImmediately ? "CRIACAO_E_PUBLICACAO_FRETE" : "CRIACAO_RASCUNHO_FRETE",
    entity: "Freight",
    entityId: newFreight.id,
    details: `Criou frete ${newFreight.code}: ${newFreight.origin.city}/${newFreight.origin.state} \u27A1\uFE0F ${newFreight.destination.city}/${newFreight.destination.state} por R$ ${newFreight.payment.price.toFixed(2)}`
  });
  if (publishImmediately) {
    const eligibleDrivers = db.drivers.filter((d) => d.tenantId === tenantId);
    eligibleDrivers.forEach((d) => {
      db.addNotification({
        tenantId,
        userId: d.userId,
        freightId: newFreight.id,
        type: "FRETE_DISPONIVEL",
        title: "\u{1F69A} Novo frete dispon\xEDvel!",
        message: `${newFreight.origin.city}/${newFreight.origin.state} \u27A1\uFE0F ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      });
    });
    const driverUsers = eligibleDrivers.map((driver) => db.users.find((user) => user.id === driver.userId)).filter((user) => Boolean(user));
    void dispatchConfiguredNotification("FRETE_PUBLICADO", driverUsers, {
      codigoFrete: newFreight.code,
      origem: `${newFreight.origin.city}/${newFreight.origin.state}`,
      destino: `${newFreight.destination.city}/${newFreight.destination.state}`,
      valor: `R$ ${newFreight.payment.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      empresa: newFreight.tenantName,
      tenantId: newFreight.tenantId,
      freightId: newFreight.id,
      link: process.env.APP_URL || ""
    });
    sendPushNotificationToAll({
      title: "\u{1F69A} Novo Frete Dispon\xEDvel na Elo Log!",
      body: `${newFreight.origin.city}/${newFreight.origin.state} \u27A1\uFE0F ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      url: "/"
    }).catch(console.error);
  }
  res.status(201).json(newFreight);
});
apiRouter.put("/freights/:id", (req, res) => {
  const freight = db.freights.find((f) => f.id === req.params.id);
  if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado" });
  if (req.user?.role !== "SUPER_ADMIN" && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este frete pertence a outra empresa." });
  }
  if (["RESERVADO", "EM_COLETA", "COLETADO", "EM_TRANSITO", "ENTREGUE", "FINALIZADO"].includes(freight.status)) {
    return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel editar frete que j\xE1 foi reservado ou iniciado" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const nextCompanyVehicleId = body.companyVehicleId !== void 0 ? body.companyVehicleId ? String(body.companyVehicleId) : void 0 : freight.companyVehicleId;
  if (nextCompanyVehicleId && !db.companyVehicles.some((vehicle) => vehicle.id === nextCompanyVehicleId && vehicle.tenantId === freight.tenantId && vehicle.status === "ATIVO")) return res.status(400).json({ error: "Ve\xEDculo pr\xF3prio selecionado n\xE3o pertence \xE0 empresa ou est\xE1 inativo." });
  const nextOperationType = body.operationType !== void 0 ? body.operationType : freight.operationType || "CARGA_GERAL";
  if (!["CARGA_GERAL", "LOGISTICA_VEICULOS"].includes(nextOperationType)) return res.status(400).json({ error: "Tipo de opera\xE7\xE3o inv\xE1lido." });
  const requestedStatus = body.status !== void 0 ? body.status : body.publishImmediately === true && freight.status === "RASCUNHO" ? "DISPONIVEL" : freight.status;
  const nextStatus = requestedStatus;
  if (nextStatus !== freight.status && !(VALID_STATUS_TRANSITIONS[freight.status] || []).includes(nextStatus)) return res.status(400).json({ error: "Transi\xE7\xE3o de status inv\xE1lida. Use o endpoint espec\xEDfico de status para esta opera\xE7\xE3o." });
  const text = (value, fallback, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : fallback;
  const finiteNumber = (value, fallback, min = 0, max = 1e9) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const updateLocation = (current, incoming) => {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return current;
    return {
      ...current,
      zipCode: text(incoming.zipCode, current.zipCode, 20),
      address: text(incoming.address, current.address, 300),
      number: text(incoming.number, current.number, 30),
      neighborhood: text(incoming.neighborhood, current.neighborhood || "", 160),
      city: text(incoming.city, current.city, 120),
      state: text(incoming.state, current.state, 2).toUpperCase(),
      date: text(incoming.date, current.date, 32),
      timeWindow: text(incoming.timeWindow, current.timeWindow || "", 100),
      contactName: text(incoming.contactName, current.contactName || "", 160),
      contactPhone: text(incoming.contactPhone, current.contactPhone || "", 30)
    };
  };
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (body.origin !== void 0) freight.origin = updateLocation(freight.origin, body.origin);
  if (body.destination !== void 0) freight.destination = updateLocation(freight.destination, body.destination);
  if (body.distanceKm !== void 0) freight.distanceKm = finiteNumber(body.distanceKm, freight.distanceKm, 0, 1e7);
  if (body.cargo && typeof body.cargo === "object" && !Array.isArray(body.cargo)) freight.cargo = {
    ...freight.cargo,
    description: text(body.cargo.description, freight.cargo.description, 500),
    type: text(body.cargo.type, freight.cargo.type, 80),
    weightKg: finiteNumber(body.cargo.weightKg, freight.cargo.weightKg),
    volumeCount: finiteNumber(body.cargo.volumeCount, freight.cargo.volumeCount),
    dimensions: text(body.cargo.dimensions, freight.cargo.dimensions || "", 200),
    requiresInsurance: body.cargo.requiresInsurance === void 0 ? freight.cargo.requiresInsurance : Boolean(body.cargo.requiresInsurance),
    notes: text(body.cargo.notes, freight.cargo.notes || "", 1e3),
    vehicleProduct: text(body.cargo.vehicleProduct, freight.cargo.vehicleProduct || "", 300),
    chassis: text(body.cargo.chassis, freight.cargo.chassis || "", 100),
    nfVehicleSale: text(body.cargo.nfVehicleSale, freight.cargo.nfVehicleSale || "", 100),
    nfFacchini: text(body.cargo.nfFacchini, freight.cargo.nfFacchini || "", 100),
    trackerStatus: text(body.cargo.trackerStatus, freight.cargo.trackerStatus || "", 100),
    platesStatus: text(body.cargo.platesStatus, freight.cargo.platesStatus || "", 100)
  };
  if (body.requirements && typeof body.requirements === "object" && !Array.isArray(body.requirements)) freight.requirements = {
    ...freight.requirements,
    vehicleType: text(body.requirements.vehicleType, freight.requirements.vehicleType, 80),
    vehicleBrand: text(body.requirements.vehicleBrand, freight.requirements.vehicleBrand || "", 120),
    bodyTypeRequired: text(body.requirements.bodyTypeRequired, freight.requirements.bodyTypeRequired || "", 80),
    minCapacityKg: finiteNumber(body.requirements.minCapacityKg, freight.requirements.minCapacityKg),
    helperRequired: body.requirements.helperRequired === void 0 ? freight.requirements.helperRequired : Boolean(body.requirements.helperRequired),
    trackerRequired: body.requirements.trackerRequired === void 0 ? freight.requirements.trackerRequired : Boolean(body.requirements.trackerRequired),
    cnhMinCategory: text(body.requirements.cnhMinCategory, freight.requirements.cnhMinCategory || "", 1)
  };
  if (body.payment && typeof body.payment === "object" && !Array.isArray(body.payment)) freight.payment = {
    ...freight.payment,
    price: finiteNumber(body.payment.price, freight.payment.price),
    clientRevenue: body.payment.clientRevenue === void 0 ? freight.payment.clientRevenue : finiteNumber(body.payment.clientRevenue, 0),
    driverCost: body.payment.driverCost === void 0 ? freight.payment.driverCost : finiteNumber(body.payment.driverCost, 0),
    paymentMethod: text(body.payment.paymentMethod, freight.payment.paymentMethod, 50),
    tollIncluded: body.payment.tollIncluded === void 0 ? freight.payment.tollIncluded : Boolean(body.payment.tollIncluded),
    advancePercentage: body.payment.advancePercentage === void 0 ? freight.payment.advancePercentage : finiteNumber(body.payment.advancePercentage, 0, 0, 100),
    notes: text(body.payment.notes, freight.payment.notes || "", 1e3)
  };
  if (body.customData !== void 0 && body.customData && typeof body.customData === "object" && !Array.isArray(body.customData)) {
    const serializedCustomData = JSON.stringify(body.customData);
    if (serializedCustomData.length > 5e4) return res.status(400).json({ error: "Dados adicionais excedem o limite permitido." });
    freight.customData = body.customData;
  }
  freight.operationType = nextOperationType;
  freight.companyVehicleId = nextCompanyVehicleId;
  freight.updatedAt = updatedAt;
  if (nextStatus !== freight.status) {
    const previousStatus = freight.status;
    freight.status = nextStatus;
    freight.statusHistory.push({ status: nextStatus, timestamp: updatedAt, changedByUserId: req.user.id, changedByName: req.user.name, notes: text(body.statusNotes, `Status atualizado de ${previousStatus} para ${nextStatus}`, 500) });
  }
  if (nextOperationType === "LOGISTICA_VEICULOS" || !["DISPONIVEL", "PUBLICADO"].includes(nextStatus)) {
    freight.publicListingEnabled = false;
    freight.publicInterestEnabled = false;
    freight.publicPriceVisibleToRegistered = false;
    freight.publicPublishedAt = void 0;
  } else {
    freight.publicListingEnabled = body.publicListingEnabled === void 0 ? freight.publicListingEnabled : Boolean(body.publicListingEnabled);
    freight.publicInterestEnabled = freight.publicListingEnabled && (body.publicInterestEnabled === void 0 ? freight.publicInterestEnabled !== false : Boolean(body.publicInterestEnabled));
    freight.publicPriceVisibleToRegistered = freight.publicListingEnabled && (body.publicPriceVisibleToRegistered === void 0 ? freight.publicPriceVisibleToRegistered !== false : Boolean(body.publicPriceVisibleToRegistered));
    if (freight.publicListingEnabled && !freight.publicPublishedAt) freight.publicPublishedAt = updatedAt;
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: freight.tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "EDICAO_FRETE",
    entity: "Freight",
    entityId: freight.id,
    details: `Editou dados do frete ${freight.code}`
  });
  res.json(freight);
});
apiRouter.post("/freights/:id/accept", async (req, res) => {
  const freightId = req.params.id;
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: "N\xE3o autenticado" });
  }
  if (user.role !== "MOTORISTA") {
    return res.status(403).json({ error: "Apenas usu\xE1rios com perfil Motorista podem aceitar fretes" });
  }
  const driver = db.drivers.find((d) => d.id === user.driverId || d.userId === user.id);
  if (!driver) {
    return res.status(400).json({ error: "Perfil de motorista n\xE3o configurado para este usu\xE1rio" });
  }
  const vehicle = db.vehicles.find((v) => v.driverId === driver.id);
  const result = await db.withLock(`freight-accept-${freightId}`, async () => {
    const freight = db.freights.find((f) => f.id === freightId);
    if (!freight) {
      return { success: false, status: 404, error: "Frete n\xE3o encontrado" };
    }
    if (freight.status !== "DISPONIVEL" && freight.status !== "PUBLICADO") {
      return {
        success: false,
        status: 409,
        error: `Frete indispon\xEDvel para aceite. Status atual: ${freight.status}. Outro motorista pode ter aceitado primeiro.`
      };
    }
    if (user.driverId && !db.hasDriverCompanyAccess(user.driverId, freight.tenantId, false, freight.id)) {
      return { success: false, status: 403, error: "A empresa ainda n\xE3o aprovou este motorista para seus fretes." };
    }
    if (freight.assignedDriverId) {
      return {
        success: false,
        status: 409,
        error: "Este frete j\xE1 foi reservado por outro motorista."
      };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    freight.status = "RESERVADO";
    freight.assignedDriverId = driver.id;
    freight.assignedDriverName = driver.name;
    freight.assignedDriverPhone = driver.phone;
    freight.assignedVehiclePlate = vehicle?.plate || "N\xE3o inf.";
    freight.assignedVehicleModel = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Ve\xEDculo padr\xE3o";
    freight.assignedAt = now;
    freight.updatedAt = now;
    freight.statusHistory.push({
      status: "RESERVADO",
      timestamp: now,
      changedByUserId: user.id,
      changedByName: driver.name,
      notes: `Frete aceito e reservado pelo motorista ${driver.name} (Ve\xEDculo: ${freight.assignedVehiclePlate})`
    });
    const companyAdmins = db.users.filter((u) => u.tenantId === freight.tenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(u.role));
    void dispatchConfiguredNotification("FRETE_ACEITO", [...companyAdmins, user], {
      codigoFrete: freight.code,
      nomeMotorista: driver.name,
      empresa: freight.tenantName,
      status: freight.status,
      tenantId: freight.tenantId,
      freightId: freight.id,
      link: process.env.APP_URL || ""
    });
    db.addAuditLog({
      ip: requestIp(req),
      tenantId: freight.tenantId,
      tenantName: freight.tenantName,
      userId: user.id,
      userName: driver.name,
      userRole: "MOTORISTA",
      action: "ACEITE_FRETE_TRANSACIONAL",
      entity: "Freight",
      entityId: freight.id,
      details: `Motorista ${driver.name} (CPF: ${driver.cpf}) aceitou e reservou o frete ${freight.code}`
    });
    return { success: true, freight };
  });
  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.error });
  }
  res.json({
    message: "Frete aceito com sucesso.",
    freight: result.freight
  });
});
apiRouter.get("/freights/:id/locations", (req, res) => {
  const freight = db.freights.find((item) => item.id === req.params.id);
  if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado." });
  if (req.user?.role !== "SUPER_ADMIN" && freight.tenantId !== req.user?.tenantId) return res.status(403).json({ error: "Acesso n\xE3o autorizado." });
  return res.json(db.freightLocations.filter((item) => item.freightId === freight.id).slice(0, 2e3));
});
apiRouter.post("/freights/:id/location", async (req, res) => {
  const freight = db.freights.find((item) => item.id === req.params.id);
  if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado." });
  const isAssignedDriver = req.user?.role === "MOTORISTA" && freight.assignedDriverId === req.user.driverId;
  const isTenantOperator = req.user?.role !== "MOTORISTA" && req.user?.role !== "SUPER_ADMIN" && freight.tenantId === req.user?.tenantId;
  if (!isAssignedDriver && !isTenantOperator && req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acesso n\xE3o autorizado a este frete." });
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: "Coordenadas GPS inv\xE1lidas." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  freight.currentLocation = {
    lat,
    lng,
    speedKmh: Number.isFinite(Number(req.body?.speedKmh)) ? Math.max(0, Math.min(250, Number(req.body.speedKmh))) : void 0,
    accuracyMeters: Number.isFinite(Number(req.body?.accuracyMeters)) ? Math.max(0, Math.min(1e4, Number(req.body.accuracyMeters))) : void 0,
    label: typeof req.body?.label === "string" ? req.body.label.trim().slice(0, 120) : void 0,
    recordedAt: now
  };
  freight.publicTrackingEnabled = true;
  freight.updatedAt = now;
  const historyEntry = { freightId: freight.id, tenantId: freight.tenantId, ...freight.currentLocation };
  db.freightLocations = db.freightLocations.filter((item) => item.freightId !== freight.id || item.recordedAt !== now);
  db.freightLocations.unshift(historyEntry);
  db.freightLocations = db.freightLocations.filter((item) => item.freightId !== freight.id || Date.now() - new Date(item.recordedAt).getTime() < 90 * 24 * 60 * 60 * 1e3).slice(0, 1e5);
  await db.persistNow();
  if (freight.publicTrackingToken) {
    const message = `event: tracking
data: ${JSON.stringify(publicTrackingPayload(freight))}

`;
    trackingSubscribers.get(freight.publicTrackingToken)?.forEach((listener) => {
      try {
        listener.write(message);
      } catch {
        trackingSubscribers.get(freight.publicTrackingToken)?.delete(listener);
      }
    });
  }
  return res.json(freight);
});
apiRouter.post("/freights/:id/status", (req, res) => {
  const { newStatus, notes, location } = req.body;
  const freight = db.freights.find((f) => f.id === req.params.id);
  if (!freight) {
    return res.status(404).json({ error: "Frete n\xE3o encontrado" });
  }
  if (req.user?.role !== "SUPER_ADMIN") {
    if (req.user?.role === "MOTORISTA") {
      if (freight.assignedDriverId !== req.user.driverId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este frete n\xE3o est\xE1 atribu\xEDdo a voc\xEA." });
      }
    } else if (freight.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: "Acesso n\xE3o autorizado a este frete." });
    }
  }
  const currentStatus = freight.status;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return res.status(400).json({
      error: `Transi\xE7\xE3o inv\xE1lida: N\xE3o \xE9 permitido mudar de '${currentStatus}' para '${newStatus}'. Transi\xE7\xF5es permitidas: ${allowedTransitions.join(", ")}`
    });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  freight.status = newStatus;
  freight.updatedAt = now;
  if (!["DISPONIVEL", "PUBLICADO"].includes(newStatus)) {
    freight.publicListingEnabled = false;
    freight.publicInterestEnabled = false;
    freight.publicPriceVisibleToRegistered = false;
    freight.publicPublishedAt = void 0;
  }
  if (newStatus === "EM_COLETA") freight.startedAt = now;
  if (newStatus === "COLETADO") freight.collectedAt = now;
  if (newStatus === "EM_TRANSITO") freight.inTransitAt = now;
  if (newStatus === "ENTREGUE") freight.deliveredAt = now;
  if (newStatus === "FINALIZADO") freight.completedAt = now;
  if (newStatus === "CANCELADO") {
    freight.cancelledAt = now;
    freight.cancelReason = notes || "Cancelado pelo operador";
  }
  freight.statusHistory.push({
    status: newStatus,
    timestamp: now,
    changedByUserId: req.user.id,
    changedByName: req.user.name,
    notes: notes || `Status atualizado para ${newStatus}`,
    location
  });
  const relevantUsers = [
    ...db.users.filter((user) => user.tenantId === freight.tenantId && ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(user.role)),
    ...db.users.filter((user) => user.driverId === freight.assignedDriverId),
    req.user
  ];
  void dispatchConfiguredNotification("STATUS_ATUALIZADO", relevantUsers, {
    codigoFrete: freight.code,
    nomeMotorista: freight.assignedDriverName || req.user?.name || "",
    empresa: freight.tenantName,
    status: newStatus,
    tenantId: freight.tenantId,
    freightId: freight.id,
    link: process.env.APP_URL || ""
  });
  if (newStatus === "CANCELADO") {
    void dispatchConfiguredNotification("FRETE_CANCELADO", relevantUsers, {
      codigoFrete: freight.code,
      empresa: freight.tenantName,
      motivo: notes || "Cancelado pelo operador",
      status: newStatus,
      tenantId: freight.tenantId,
      freightId: freight.id,
      link: process.env.APP_URL || ""
    });
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: freight.tenantId,
    tenantName: freight.tenantName,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: `STATUS_${newStatus}`,
    entity: "Freight",
    entityId: freight.id,
    details: `Transi\xE7\xE3o de ${currentStatus} para ${newStatus}${location ? ` (Local: ${location})` : ""}`
  });
  res.json(freight);
});
var canManageLocalResources = (user) => Boolean(user && DIRECTORY_ADMIN_ROLES.includes(user.role));
var resourceTenantId = (req) => req.user?.role === "SUPER_ADMIN" ? String(req.body?.tenantId || req.query?.tenantId || "") : req.user?.tenantId || "";
apiRouter.get("/company-stops", (req, res) => {
  if (!req.user || !TENANT_USER_ROLES.includes(req.user.role)) return res.status(403).json({ error: "Acesso n\xE3o autorizado." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Empresa obrigat\xF3ria." });
  return res.json(db.companyStops.filter((stop) => stop.tenantId === tenantId && stop.active));
});
apiRouter.post("/company-stops", async (req, res) => {
  if (!canManageLocalResources(req.user)) return res.status(403).json({ error: "Somente administradores podem cadastrar paradas." });
  const tenantId = resourceTenantId(req);
  const { name, type = "PARADA", address, city, state, phone, notes } = req.body || {};
  if (!tenantId || !name || !address || !city || !state) return res.status(400).json({ error: "Nome, endere\xE7o, cidade e estado s\xE3o obrigat\xF3rios." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const stop = { id: `stop-${(0, import_crypto.randomUUID)()}`, tenantId, name: String(name).trim(), type, address: String(address).trim(), city: String(city).trim(), state: String(state).trim().toUpperCase(), phone: phone ? String(phone).trim() : void 0, notes: notes ? String(notes).trim() : void 0, active: true, createdAt: now, updatedAt: now };
  db.companyStops.push(stop);
  await db.persistNow();
  return res.status(201).json(stop);
});
apiRouter.get("/lodging-partners", (req, res) => {
  if (!req.user || !TENANT_USER_ROLES.includes(req.user.role)) return res.status(403).json({ error: "Acesso n\xE3o autorizado." });
  const tenantId = req.user.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Empresa obrigat\xF3ria." });
  return res.json(db.lodgingPartners.filter((partner) => partner.tenantId === tenantId && partner.active));
});
apiRouter.post("/lodging-partners", async (req, res) => {
  if (!canManageLocalResources(req.user)) return res.status(403).json({ error: "Somente administradores podem cadastrar hospedagens." });
  const tenantId = resourceTenantId(req);
  const { name, address, city, state, phone, discount, rules } = req.body || {};
  if (!tenantId || !name || !address || !city || !state) return res.status(400).json({ error: "Nome, endere\xE7o, cidade e estado s\xE3o obrigat\xF3rios." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const partner = { id: `lodging-${(0, import_crypto.randomUUID)()}`, tenantId, name: String(name).trim(), address: String(address).trim(), city: String(city).trim(), state: String(state).trim().toUpperCase(), phone: phone ? String(phone).trim() : void 0, discount: discount ? String(discount).trim() : void 0, rules: rules ? String(rules).trim() : void 0, active: true, createdAt: now, updatedAt: now };
  db.lodgingPartners.push(partner);
  await db.persistNow();
  return res.status(201).json(partner);
});
apiRouter.get("/forms", (req, res) => {
  const { triggerEvent } = req.query;
  let forms = db.forms;
  if (req.user?.role !== "SUPER_ADMIN") {
    forms = forms.filter((f) => f.tenantId === req.user?.tenantId);
  }
  if (triggerEvent) {
    forms = forms.filter((f) => f.triggerEvent === triggerEvent && f.active);
  }
  res.json(forms);
});
apiRouter.post("/forms", (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: "Somente administradores reais podem criar formul\xE1rios." });
  }
  const { title, description, category, triggerEvent, fields, tenantId } = req.body;
  const targetTenantId = req.user?.role === "SUPER_ADMIN" ? tenantId || db.tenants[0].id : req.user?.tenantId;
  if (!title || !fields || !Array.isArray(fields)) {
    return res.status(400).json({ error: "T\xEDtulo e campos do formul\xE1rio s\xE3o obrigat\xF3rios" });
  }
  const newForm = {
    id: `form-${Date.now()}`,
    tenantId: targetTenantId,
    title,
    description: description || "",
    category: category || "CHECKLIST_COLETA",
    triggerEvent: triggerEvent || "MANUAL",
    fields,
    active: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.forms.push(newForm);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetTenantId || void 0,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "CRIACAO_FORMULARIO",
    entity: "FormDefinition",
    entityId: newForm.id,
    details: `Formul\xE1rio '${newForm.title}' criado com ${newForm.fields.length} campos`
  });
  res.status(201).json(newForm);
});
apiRouter.post("/forms/:id/copy", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem copiar formul\xE1rios." });
  const source = db.forms.find((form) => form.id === req.params.id);
  if (!source) return res.status(404).json({ error: "Modelo de formul\xE1rio n\xE3o encontrado." });
  const targetTenantId = req.user.role === "SUPER_ADMIN" ? req.body?.tenantId || source.tenantId : req.user.tenantId;
  if (!targetTenantId || !db.tenants.some((tenant) => tenant.id === targetTenantId)) return res.status(400).json({ error: "Empresa de destino inv\xE1lida." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const copy = {
    ...source,
    id: `form-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    tenantId: targetTenantId,
    title: req.body?.title || `${source.title} (C\xF3pia)`,
    fields: source.fields.map((field, index) => ({ ...field, id: `field-${(0, import_crypto.randomUUID)().slice(0, 8)}`, order: index + 1 })),
    createdAt: now,
    updatedAt: now
  };
  db.forms.push(copy);
  db.addAuditLog({ ip: requestIp(req), tenantId: targetTenantId, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "COPIAR_FORMULARIO_MODELO", entity: "FormDefinition", entityId: copy.id, details: `Formul\xE1rio '${source.title}' copiado como '${copy.title}'.` });
  await db.persistNow();
  return res.status(201).json(copy);
});
apiRouter.put("/forms/:id", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem editar formul\xE1rios." });
  const form = db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ error: "Formul\xE1rio n\xE3o encontrado." });
  if (req.user.role !== "SUPER_ADMIN" && form.tenantId !== req.user.tenantId) return res.status(403).json({ error: "Este formul\xE1rio pertence a outra empresa." });
  if (typeof req.body?.title === "string" && req.body.title.trim()) form.title = req.body.title.trim();
  if (typeof req.body?.description === "string") form.description = req.body.description;
  if (Array.isArray(req.body?.fields)) form.fields = req.body.fields.map((field, index) => ({ ...field, id: field.id || `field-${(0, import_crypto.randomUUID)().slice(0, 8)}`, order: index + 1 }));
  if (req.body?.category) form.category = req.body.category;
  if (req.body?.triggerEvent) form.triggerEvent = req.body.triggerEvent;
  form.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({ ip: requestIp(req), tenantId: form.tenantId, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "EDITAR_FORMULARIO", entity: "FormDefinition", entityId: form.id, details: `Formul\xE1rio '${form.title}' editado.` });
  await db.persistNow();
  return res.json(form);
});
apiRouter.post("/forms/responses", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "N\xE3o autenticado." });
  const { responseId, formId, freightId, answers, stage, isDraft } = req.body || {};
  const form = db.forms.find((f) => f.id === formId);
  if (!form) {
    return res.status(404).json({ error: "Formul\xE1rio n\xE3o encontrado" });
  }
  if (req.user.role !== "SUPER_ADMIN" && form.tenantId !== req.user.tenantId) return res.status(403).json({ error: "Este formul\xE1rio pertence a outra empresa." });
  if (stage !== void 0 && !["RETIRADA_INICIADA", "FINALIZADO_ENTREGA", "COMPLETO"].includes(stage)) return res.status(400).json({ error: "Etapa de formul\xE1rio inv\xE1lida." });
  if (answers !== void 0 && (!answers || typeof answers !== "object" || Array.isArray(answers) || JSON.stringify(answers).length > 1e5)) return res.status(400).json({ error: "Respostas inv\xE1lidas ou acima do limite permitido." });
  if (freightId) {
    const freight = db.freights.find((f) => f.id === freightId);
    if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado." });
    if (freight) {
      if (req.user?.role !== "SUPER_ADMIN") {
        if (req.user?.role === "MOTORISTA") {
          if (freight.assignedDriverId !== req.user.driverId) {
            return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este frete n\xE3o est\xE1 atribu\xEDdo a voc\xEA." });
          }
        } else if (freight.tenantId !== req.user?.tenantId) {
          return res.status(403).json({ error: "Acesso n\xE3o autorizado a este frete." });
        }
      }
    }
  }
  let existingResponse;
  if (responseId) {
    existingResponse = db.formResponses.find((r) => r.id === String(responseId) && r.tenantId === form.tenantId);
  } else if (freightId && formId) {
    existingResponse = db.formResponses.find((r) => r.freightId === freightId && r.formId === formId && r.tenantId === form.tenantId && (req.user?.role !== "MOTORISTA" || r.filledByUserId === req.user.id || r.driverId === req.user.driverId));
  }
  if (existingResponse && req.user.role === "MOTORISTA" && existingResponse.filledByUserId !== req.user.id && existingResponse.driverId !== req.user.driverId) return res.status(403).json({ error: "Voc\xEA s\xF3 pode alterar suas pr\xF3prias respostas." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (existingResponse) {
    const prevAnswers = existingResponse.answers || {};
    const originAlreadySigned = Boolean(prevAnswers.origem?.assinado && prevAnswers.origem?.signatureImage);
    let updatedAnswers = {
      ...prevAnswers,
      ...answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {}
    };
    if (originAlreadySigned) {
      updatedAnswers.talaoNumber = prevAnswers.talaoNumber || updatedAnswers.talaoNumber;
      updatedAnswers.cliente = prevAnswers.cliente || updatedAnswers.cliente;
      updatedAnswers.clienteEmail = prevAnswers.clienteEmail || updatedAnswers.clienteEmail;
      updatedAnswers.clienteTelefone = prevAnswers.clienteTelefone || updatedAnswers.clienteTelefone;
      updatedAnswers.retirada = prevAnswers.retirada || updatedAnswers.retirada;
      updatedAnswers.veiculo = prevAnswers.veiculo || updatedAnswers.veiculo;
      updatedAnswers.documentos = prevAnswers.documentos || updatedAnswers.documentos;
      updatedAnswers.avarias = prevAnswers.avarias || updatedAnswers.avarias;
      updatedAnswers.equipamentos = prevAnswers.equipamentos || updatedAnswers.equipamentos;
      updatedAnswers.origem = prevAnswers.origem || updatedAnswers.origem;
      updatedAnswers.condutor = prevAnswers.condutor || updatedAnswers.condutor;
      updatedAnswers.condutorTelefone = prevAnswers.condutorTelefone || updatedAnswers.condutorTelefone;
    }
    existingResponse.answers = updatedAnswers;
    if (stage) existingResponse.stage = stage;
    if (isDraft !== void 0) existingResponse.isDraft = isDraft;
    existingResponse.updatedAt = now;
    db.addAuditLog({
      ip: requestIp(req),
      tenantId: form.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: isDraft ? "RASCUNHO_FORMULARIO" : "ATUALIZACAO_FORMULARIO",
      entity: "FormResponse",
      entityId: existingResponse.id,
      details: `${isDraft ? "Salvo rascunho de progresso" : "Atualizado formul\xE1rio"} '${form.title}' (Etapa: ${stage || "Andamento"})${freightId ? ` para o frete #${freightId}` : ""}`
    });
    return res.json(existingResponse);
  }
  const newResponse = {
    id: `resp-${Date.now()}`,
    formId,
    formTitle: form.title,
    tenantId: form.tenantId,
    freightId,
    driverId: req.user?.driverId,
    filledByUserId: req.user.id,
    filledByName: req.user.name,
    stage: stage || (isDraft ? "RETIRADA_INICIADA" : "COMPLETO"),
    isDraft: isDraft || false,
    answers: answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {},
    createdAt: now,
    updatedAt: now
  };
  db.formResponses.push(newResponse);
  if (freightId) {
    const freight = db.freights.find((f) => f.id === freightId);
    if (freight) {
      freight.formResponsesCount = (freight.formResponsesCount || 0) + 1;
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: form.tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: isDraft ? "RASCUNHO_FORMULARIO" : "RESPOSTA_FORMULARIO",
    entity: "FormResponse",
    entityId: newResponse.id,
    details: `${isDraft ? "Iniciou e salvou etapa de retirada" : "Respondeu e finalizou formul\xE1rio"} '${form.title}'${freightId ? ` para o frete #${freightId}` : ""}`
  });
  res.status(201).json(newResponse);
});
function resolveWhatsAppConfig(tenantId) {
  const tenant = tenantId ? db.tenants.find((item) => item.id === tenantId) : void 0;
  if (tenant?.notificationPlan === "SAAS_FREE") return db.globalWhatsAppConfig;
  if (tenant?.notificationPlan === "OWN_NUMBER" && tenant.notificationBillingStatus !== "ACTIVE") return db.globalWhatsAppConfig;
  const tenantConfig = tenantId ? db.whatsappConfigs.get(tenantId) : void 0;
  if (tenantConfig?.token && tenantConfig.baseUrl) return tenantConfig;
  return db.globalWhatsAppConfig;
}
function normalizeWhatsAppTenantId(rawTenantId) {
  if (typeof rawTenantId !== "string") return void 0;
  const value = rawTenantId.trim();
  return value || void 0;
}
function canManageWhatsAppTenant(req, tenantId) {
  if (!req.user) return false;
  if (req.user.role === "SUPER_ADMIN") {
    return Boolean(tenantId && db.tenants.some((tenant) => tenant.id === tenantId));
  }
  return Boolean(
    tenantId && req.user.tenantId === tenantId && ["ADMIN", "EMPRESA_SUPER_ADMIN"].includes(req.user.role)
  );
}
function getWhatsAppScope(req, rawTenantId) {
  const requestedTenantId = normalizeWhatsAppTenantId(rawTenantId);
  if (req.user?.role === "SUPER_ADMIN" && !requestedTenantId) {
    return { isGlobal: true };
  }
  const tenantId = requestedTenantId || normalizeWhatsAppTenantId(req.user?.tenantId);
  if (!tenantId || !canManageWhatsAppTenant(req, tenantId)) return null;
  return { tenantId, isGlobal: false };
}
function safeWhatsAppConfig(config, scope) {
  return {
    ...config,
    token: "",
    tokenMasked: config.token ? "********" : "",
    tenantId: scope.tenantId || null,
    scope: scope.isGlobal ? "GLOBAL" : "TENANT"
  };
}
function isPrivateOrLocalHostname(rawHostname) {
  const hostname = String(rawHostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || ["localhost", "localhost.localdomain", "metadata.google.internal"].includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || !hostname.includes(".")) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    const octets = hostname.split(".").map(Number);
    if (octets.some((octet) => octet > 255)) return true;
    const [first, second] = octets;
    return first === 0 || first === 10 || first === 127 || first === 169 && second === 254 || first === 172 && second >= 16 && second <= 31 || first === 192 && second === 168;
  }
  if (hostname.includes(":")) return hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80") || hostname.startsWith("::ffff:127.") || hostname.startsWith("::ffff:10.") || hostname.startsWith("::ffff:192.168.");
  return false;
}
function validateWhatsAppBaseUrl(rawValue) {
  const value = String(rawValue || "").trim().replace(/\/+$/, "");
  if (!value) return "";
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("A URL da API WhatsApp \xE9 inv\xE1lida.");
  }
  const localDevelopment = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (!localDevelopment && isPrivateOrLocalHostname(parsed.hostname)) throw new Error("A URL da API WhatsApp n\xE3o pode apontar para rede local.");
  if (parsed.protocol !== "https:" && !localDevelopment) {
    throw new Error("A URL da API WhatsApp deve usar HTTPS.");
  }
  return value;
}
function extractWhatsAppProviderField(data, fieldNames) {
  const wanted = new Set(fieldNames.map((name) => name.toLowerCase()));
  const queue = [{ value: data, depth: 0 }];
  const visited = /* @__PURE__ */ new Set();
  let inspected = 0;
  while (queue.length > 0 && inspected < 1e3) {
    const current = queue.shift();
    inspected += 1;
    if (!current.value || typeof current.value !== "object" || current.depth > 6 || visited.has(current.value)) continue;
    visited.add(current.value);
    for (const [key, value] of Object.entries(current.value)) {
      if (wanted.has(key.toLowerCase()) && typeof value === "string" && value.trim()) return value.trim();
      if (value && typeof value === "object") queue.push({ value, depth: current.depth + 1 });
    }
  }
  return null;
}
function extractWhatsAppQrCode(data) {
  return extractWhatsAppProviderField(data, ["QRCode", "qrcode", "qrCode"]);
}
function extractWhatsAppPairingCode(data) {
  return extractWhatsAppProviderField(data, ["pairingCode", "pairing_code", "pairingcode"]);
}
function mapWhatsAppConnectionStatus(data) {
  const normalized = JSON.stringify(data || {}).toLowerCase();
  if (data?.connected === true || data?.Connected === true || data?.isConnected === true || data?.status === "connected" || data?.status === "online") return "CONNECTED";
  if (data?.connected === false || data?.Connected === false || data?.isConnected === false || /disconnected|offline|desconectad/.test(normalized)) return "DISCONNECTED";
  if (extractWhatsAppPairingCode(data)) return "PAIRING_CODE_AVAILABLE";
  if (extractWhatsAppQrCode(data) || /qrcode|qr_code|qr code|aguardando.*qr/.test(normalized)) return "QR_AVAILABLE";
  return "UNKNOWN";
}
async function callWhatsAppGateway(config, pathName, options = {}) {
  if (!config.baseUrl || !config.token) return { ok: false, status: 0 };
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(`${baseUrl}${pathName}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        ...options.body ? { "Content-Type": "application/json" } : {},
        ...options.headers || {}
      },
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeoutId);
  }
}
function formatPhoneForWhatsApp(rawPhone) {
  let cleaned = (rawPhone || "").replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}
async function sendToWhatsAppGateway(config, payload) {
  const cleanNumber = formatPhoneForWhatsApp(payload.number);
  const extKey = payload.externalKey || `ext-${Date.now()}`;
  if (config.isActive === false) {
    return { success: false, message: "A integra\xE7\xE3o WhatsApp est\xE1 desativada para esta empresa." };
  }
  if (!config.baseUrl || !config.token) {
    const simulated = process.env.NODE_ENV !== "production";
    return {
      success: simulated,
      message: simulated ? "Notifica\xE7\xE3o simulada fora da produ\xE7\xE3o. Configure a URL e o token da API para envio real." : "API WhatsApp n\xE3o configurada para envio em produ\xE7\xE3o.",
      data: simulated ? { simulated: true, recipient: cleanNumber, externalKey: extKey } : void 0
    };
  }
  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
  let endpointUrl = cleanBaseUrl;
  let requestBody;
  if (payload.useButtonApi && payload.buttons && payload.buttons.length > 0) {
    endpointUrl = `${cleanBaseUrl}/apiplus`;
    requestBody = {
      number: cleanNumber,
      contents: {
        type: "button",
        body: {
          text: payload.body
        },
        action: {
          buttons: payload.buttons.map((b, idx) => ({
            type: "reply",
            reply: {
              id: b.id || String(idx + 1),
              title: b.text.slice(0, 20)
            }
          }))
        }
      }
    };
  } else if (payload.mediaUrl) {
    requestBody = {
      body: payload.body,
      number: cleanNumber,
      externalKey: extKey,
      mediaUrl: payload.mediaUrl
    };
  } else {
    requestBody = {
      body: payload.body,
      number: cleanNumber,
      externalKey: extKey
    };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.token.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const contentType = response.headers.get("content-type") || "";
    let responseData;
    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    if (!response.ok) {
      db.addErrorLog({
        correlationId: extKey,
        service: "whatsapp-gateway",
        route: "external-send-message",
        method: "POST",
        statusCode: response.status,
        event: "WHATSAPP_SEND_REJECTED",
        message: "O gateway WhatsApp rejeitou o envio da mensagem."
      });
      return {
        success: false,
        message: `Gateway WhatsApp retornou erro (HTTP ${response.status}).`,
        rawResponse: responseData
      };
    }
    return {
      success: true,
      message: "Mensagem transmitida com sucesso para o canal WhatsApp.",
      data: responseData
    };
  } catch (error) {
    db.addErrorLog({
      correlationId: extKey,
      service: "whatsapp-gateway",
      route: "external-send-message",
      method: "POST",
      event: "WHATSAPP_SEND_ERROR",
      message: "Falha de comunica\xE7\xE3o com o gateway WhatsApp."
    });
    return {
      success: false,
      message: "Erro na comunica\xE7\xE3o com o Gateway WhatsApp."
    };
  }
}
function getOperationalWhatsAppTenantId(req, rawTenantId) {
  const requestedTenantId = normalizeWhatsAppTenantId(rawTenantId);
  if (req.user?.role === "SUPER_ADMIN") return requestedTenantId;
  if (requestedTenantId && requestedTenantId !== req.user?.tenantId) return null;
  return normalizeWhatsAppTenantId(req.user?.tenantId);
}
function updateWhatsAppConnectionState(tenantId, patch) {
  const current = tenantId ? db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig : db.globalWhatsAppConfig;
  const updated = { ...current, ...patch, provider: "WHAZING" };
  if (tenantId) db.whatsappConfigs.set(tenantId, updated);
  else db.globalWhatsAppConfig = updated;
  return updated;
}
apiRouter.get("/integrations/whatsapp/config", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "A configura\xE7\xE3o da API est\xE1 dispon\xEDvel somente no painel SaaS." });
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.query.tenantId);
  if (!scope) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para consultar a configura\xE7\xE3o WhatsApp desta empresa." });
  }
  const config = scope.isGlobal ? db.globalWhatsAppConfig : db.whatsappConfigs.get(scope.tenantId) || { ...db.globalWhatsAppConfig, token: "" };
  const tenantHasDedicatedConfig = Boolean(scope.tenantId && db.whatsappConfigs.has(scope.tenantId));
  res.json({
    ...safeWhatsAppConfig(config, scope),
    provider: "WHAZING",
    tenantHasDedicatedConfig
  });
});
function isPublicDemoUser(user) {
  return Boolean(
    user && user.accountType === "TEST" && user.readOnly === true && user.tenantId === PUBLIC_DEMO_TENANT_ID && user.role !== "SUPER_ADMIN"
  );
}
function isTestOrDemoUser(user) {
  if (!user) return false;
  if (user.accountType === "REAL" && user.readOnly !== true) return false;
  if (user.accountType === "TEST" || user.readOnly === true) return true;
  const userId = String(user.id || "").toLowerCase();
  return userId === "user-driver-test-17" || userId.includes("test") || userId.includes("demo");
}
apiRouter.post("/integrations/whatsapp/config", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "A configura\xE7\xE3o da API est\xE1 dispon\xEDvel somente no painel SaaS." });
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.body?.tenantId);
  if (!scope) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para configurar o WhatsApp desta empresa." });
  }
  if (isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: "Perfis criados para teste n\xE3o possuem permiss\xE3o para editar ou alterar informa\xE7\xF5es e configura\xE7\xF5es do sistema." });
  }
  if (!scope.isGlobal && req.user?.role !== "SUPER_ADMIN") {
    const tenant = db.tenants.find((item) => item.id === scope.tenantId);
    if (tenant?.notificationPlan === "SAAS_FREE") return res.status(402).json({ error: "O plano gratuito usa o telefone SaaS. Contrate o m\xF3dulo de n\xFAmero pr\xF3prio para cadastrar outro canal." });
    if (tenant?.notificationPlan === "OWN_NUMBER" && tenant.notificationBillingStatus !== "ACTIVE") return res.status(402).json({ error: "A assinatura do n\xFAmero pr\xF3prio ainda n\xE3o est\xE1 ativa no Asaas." });
  }
  const { baseUrl, token, defaultChannelNumber, isActive, autoNotifyChecklist, autoNotifyFreightStatus } = req.body || {};
  const tenantId = scope.tenantId;
  const existingConfig = scope.isGlobal ? db.globalWhatsAppConfig : {
    ...db.globalWhatsAppConfig,
    ...db.whatsappConfigs.get(tenantId) || {},
    baseUrl: db.whatsappConfigs.get(tenantId)?.baseUrl || db.globalWhatsAppConfig.baseUrl,
    token: db.whatsappConfigs.get(tenantId)?.token || ""
  };
  let normalizedBaseUrl;
  try {
    normalizedBaseUrl = baseUrl !== void 0 ? validateWhatsAppBaseUrl(baseUrl) : existingConfig.baseUrl;
  } catch (error) {
    return res.status(400).json({ error: error?.message || "URL da API WhatsApp inv\xE1lida." });
  }
  const normalizedToken = token && String(token).trim() !== "********" ? String(token).trim() : existingConfig.token;
  const newConfig = {
    ...existingConfig,
    provider: "WHAZING",
    baseUrl: normalizedBaseUrl,
    token: normalizedToken,
    defaultChannelNumber: defaultChannelNumber !== void 0 ? String(defaultChannelNumber).trim() : existingConfig.defaultChannelNumber,
    isActive: isActive !== void 0 ? Boolean(isActive) : existingConfig.isActive,
    autoNotifyChecklist: autoNotifyChecklist !== void 0 ? Boolean(autoNotifyChecklist) : existingConfig.autoNotifyChecklist,
    autoNotifyFreightStatus: autoNotifyFreightStatus !== void 0 ? Boolean(autoNotifyFreightStatus) : existingConfig.autoNotifyFreightStatus,
    lastConnectionError: void 0
  };
  if (!newConfig.baseUrl || !newConfig.token) {
    return res.status(400).json({ error: "URL e token do Gateway WhatsApp s\xE3o necess\xE1rios. Deixe o token vazio para manter o token atual." });
  }
  try {
    if (scope.isGlobal) {
      await db.persistWhatsAppSecret(newConfig.baseUrl, newConfig.token);
      db.globalWhatsAppConfig = newConfig;
    } else {
      await db.persistWhatsAppSecretForTenant(tenantId, newConfig.baseUrl, newConfig.token);
      db.whatsappConfigs.set(tenantId, newConfig);
    }
  } catch (error) {
    return res.status(503).json({ error: error?.message || "N\xE3o foi poss\xEDvel persistir a configura\xE7\xE3o WhatsApp com seguran\xE7a." });
  }
  await db.persistNow();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "CONFIG_WHATSAPP",
    entity: "WhatsAppGateway",
    entityId: `wa-config-${scope.isGlobal ? "global" : tenantId}`,
    details: `Atualizou configura\xE7\xE3o Atendo CRM ${scope.isGlobal ? "global" : "da empresa"}; credenciais armazenadas de forma criptografada`
  });
  res.json({
    success: true,
    config: safeWhatsAppConfig(newConfig, scope)
  });
});
apiRouter.get("/integrations/whatsapp/status", async (req, res) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.query.tenantId);
  if (!scope) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para consultar o status WhatsApp desta empresa." });
  }
  const config = scope.isGlobal ? db.globalWhatsAppConfig : resolveWhatsAppConfig(scope.tenantId);
  if (!config) {
    return res.json({ success: false, status: "UNKNOWN", message: "Esta empresa ainda n\xE3o possui uma configura\xE7\xE3o Atendo CRM pr\xF3pria.", config: safeWhatsAppConfig({ ...db.globalWhatsAppConfig, token: "", baseUrl: "" }, scope) });
  }
  if (!config.baseUrl || !config.token) {
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: "UNKNOWN",
      lastStatusCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastConnectionError: "API WhatsApp n\xE3o configurada."
    });
    await db.persistNow();
    return res.json({ success: false, status: updated.connectionStatus, message: "API WhatsApp n\xE3o configurada.", config: safeWhatsAppConfig(updated, scope) });
  }
  if (config.isActive === false) {
    return res.json({ success: true, status: "DISCONNECTED", message: "Integra\xE7\xE3o WhatsApp desativada.", config: safeWhatsAppConfig({ ...config, connectionStatus: "DISCONNECTED" }, scope) });
  }
  try {
    const result = await callWhatsAppGateway(config, "/statuschannel", { method: "GET" });
    const qrCode = result.ok ? extractWhatsAppQrCode(result.data) : null;
    const pairingCode = result.ok ? extractWhatsAppPairingCode(result.data) : null;
    const status = result.ok ? pairingCode ? "PAIRING_CODE_AVAILABLE" : qrCode ? "QR_AVAILABLE" : mapWhatsAppConnectionStatus(result.data) : "ERROR";
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: status,
      lastStatusCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastConnectionError: result.ok ? void 0 : `Gateway retornou HTTP ${result.status}.`
    });
    await db.persistNow();
    if (!result.ok) {
      db.addErrorLog({ service: "whatsapp-gateway", route: "external-status-channel", method: "GET", statusCode: result.status, event: "WHATSAPP_STATUS_REJECTED", message: "O gateway WhatsApp rejeitou a consulta de status." });
    }
    return res.json({
      success: result.ok,
      status,
      message: result.ok ? pairingCode ? "C\xF3digo de pareamento dispon\xEDvel." : qrCode ? "QR Code dispon\xEDvel." : "Status do canal consultado." : "N\xE3o foi poss\xEDvel consultar o status do canal.",
      ...pairingCode ? { pairingCode } : {},
      ...qrCode ? { qrCode } : {},
      config: safeWhatsAppConfig(updated, scope)
    });
  } catch {
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: "ERROR",
      lastStatusCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastConnectionError: "Falha de comunica\xE7\xE3o com o gateway WhatsApp."
    });
    await db.persistNow();
    db.addErrorLog({ service: "whatsapp-gateway", route: "external-status-channel", method: "GET", event: "WHATSAPP_STATUS_ERROR", message: "Falha de comunica\xE7\xE3o com o gateway WhatsApp." });
    return res.status(502).json({ success: false, status: "ERROR", message: "Falha de comunica\xE7\xE3o com o gateway WhatsApp.", config: safeWhatsAppConfig(updated, scope) });
  }
});
apiRouter.post("/integrations/whatsapp/qr", async (req, res) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.body?.tenantId);
  if (!scope) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para conectar o WhatsApp desta empresa." });
  }
  const config = scope.isGlobal ? db.globalWhatsAppConfig : resolveWhatsAppConfig(scope.tenantId);
  if (!config) {
    return res.status(400).json({ error: "Configure uma URL e um token pr\xF3prios do Atendo CRM para esta empresa antes de solicitar o QR Code." });
  }
  if (!config.baseUrl || !config.token) {
    return res.status(400).json({ error: "Configure a URL e o token da API Atendo CRM antes de solicitar o QR Code." });
  }
  if (config.isActive === false) {
    return res.status(409).json({ error: "A integra\xE7\xE3o WhatsApp est\xE1 desativada para esta empresa." });
  }
  try {
    const requestedPhone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const requestedNumber = requestedPhone ? formatPhoneForWhatsApp(requestedPhone) : null;
    if (requestedPhone && !requestedNumber) {
      return res.status(400).json({ error: "O n\xFAmero informado para o pareamento \xE9 inv\xE1lido." });
    }
    const result = await callWhatsAppGateway(config, "/qrcode", {
      method: "POST",
      body: JSON.stringify({ number: requestedNumber })
    });
    if (!result.ok) {
      db.addErrorLog({ service: "whatsapp-gateway", route: "external-qrcode", method: "POST", statusCode: result.status, event: "WHATSAPP_QR_REJECTED", message: "O gateway WhatsApp rejeitou a solicita\xE7\xE3o de QR Code." });
      return res.status(502).json({ success: false, error: "O gateway WhatsApp n\xE3o gerou o QR Code." });
    }
    let qrCode = extractWhatsAppQrCode(result.data);
    let pairingCode = extractWhatsAppPairingCode(result.data);
    if (!qrCode && !pairingCode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const statusResult = await callWhatsAppGateway(config, "/statuschannel", { method: "GET" });
      if (statusResult.ok) {
        qrCode = extractWhatsAppQrCode(statusResult.data);
        pairingCode = extractWhatsAppPairingCode(statusResult.data);
      }
    }
    const status = pairingCode ? "PAIRING_CODE_AVAILABLE" : qrCode ? "QR_AVAILABLE" : "PENDING";
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: status,
      lastStatusCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastConnectionError: void 0
    });
    await db.persistNow();
    return res.json({
      success: true,
      status,
      message: pairingCode ? "C\xF3digo de pareamento tempor\xE1rio gerado." : qrCode ? "QR Code tempor\xE1rio gerado." : result.status === 202 ? "Solicita\xE7\xE3o aceita. Aguardando o canal retornar o c\xF3digo." : "Solicita\xE7\xE3o aceita. Consulte o status do canal para obter o c\xF3digo.",
      ...pairingCode ? { pairingCode } : {},
      ...qrCode ? { qrCode, expiresInSeconds: 60 } : {},
      config: safeWhatsAppConfig(updated, scope)
    });
  } catch {
    db.addErrorLog({ service: "whatsapp-gateway", route: "external-qrcode", method: "POST", event: "WHATSAPP_QR_ERROR", message: "Falha de comunica\xE7\xE3o com o gateway WhatsApp ao solicitar QR Code." });
    return res.status(502).json({ success: false, error: "Falha de comunica\xE7\xE3o com o gateway WhatsApp ao solicitar QR Code." });
  }
});
apiRouter.post("/integrations/whatsapp/test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Permiss\xE3o exclusiva do Super Admin do Elo Log." });
  }
  const tenantId = getOperationalWhatsAppTenantId(req, req.body?.tenantId);
  if (tenantId === null) return res.status(403).json({ error: "Empresa WhatsApp inv\xE1lida para este usu\xE1rio." });
  const { phone, message, baseUrl, token } = req.body || {};
  const savedConfig = tenantId ? db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig : db.globalWhatsAppConfig;
  const testConfig = {
    ...savedConfig,
    baseUrl: baseUrl ? validateWhatsAppBaseUrl(baseUrl) : savedConfig.baseUrl,
    token: token ? String(token).trim() : savedConfig.token
  };
  const targetPhone = phone || testConfig.defaultChannelNumber;
  if (!targetPhone) {
    return res.status(400).json({ error: "Telefone de destino n\xE3o configurado." });
  }
  const testMessage = message || `Mensagem de teste de conex\xE3o do sistema Gestor. Hor\xE1rio: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR")}`;
  const result = await sendToWhatsAppGateway(testConfig, {
    number: targetPhone,
    body: testMessage,
    externalKey: `test-${Date.now()}`
  });
  const updated = updateWhatsAppConnectionState(tenantId, {
    lastTestedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastTestStatus: result.success ? "SUCCESS" : "ERROR",
    lastTestMessage: result.message
  });
  await db.persistNow();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "TESTE_WHATSAPP",
    entity: "WhatsAppGateway",
    entityId: `wa-test-${Date.now()}`,
    details: `Teste de envio WhatsApp para n\xFAmero informado: ${result.success ? "SUCESSO" : "FALHA"}`
  });
  res.json({
    success: result.success,
    message: result.message,
    recipient: formatPhoneForWhatsApp(targetPhone),
    details: result.data || result.rawResponse
  });
});
apiRouter.post("/integrations/whatsapp/notify", async (req, res) => {
  const { phone, message, freightCode, templateType, externalKey, mediaUrl, useButtonApi, buttons, tenantId: requestedTenantId } = req.body || {};
  const tenantId = getOperationalWhatsAppTenantId(req, requestedTenantId);
  if (tenantId === null) return res.status(403).json({ error: "Empresa WhatsApp inv\xE1lida para este usu\xE1rio." });
  const config = resolveWhatsAppConfig(tenantId || void 0);
  if (!phone || !message) {
    return res.status(400).json({ error: "N\xFAmero de telefone e mensagem s\xE3o obrigat\xF3rios para envio." });
  }
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const result = await sendToWhatsAppGateway(config, {
    number: cleanPhone,
    body: message,
    externalKey: externalKey || (freightCode ? `freight-${freightCode}` : `notify-${Date.now()}`),
    mediaUrl,
    useButtonApi,
    buttons
  });
  db.addAuditLog({
    ip: requestIp(req),
    tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "DISPARO_WHATSAPP",
    entity: "WhatsAppNotification",
    entityId: `wa-${Date.now()}`,
    details: `Notifica\xE7\xE3o Atendo CRM (${templateType || "Geral"}) para o n\xFAmero informado: ${result.success ? "SUCESSO" : "FALHA"}`
  });
  res.json({
    success: result.success,
    messageId: `wa-msg-${Date.now()}`,
    recipient: cleanPhone,
    status: result.success ? "ENVIADO" : "ERRO",
    sentAt: (/* @__PURE__ */ new Date()).toISOString(),
    details: result.message,
    gatewayResponse: result.data || result.rawResponse
  });
});
apiRouter.get("/forms/responses", (req, res) => {
  const { freightId, formId } = req.query;
  let responses = db.formResponses;
  if (req.user?.role !== "SUPER_ADMIN") {
    responses = responses.filter((r) => r.tenantId === req.user?.tenantId);
  }
  if (req.user?.role === "MOTORISTA") {
    responses = responses.filter((r) => r.filledByUserId === req.user?.id || r.driverId === req.user?.driverId);
  }
  if (freightId) {
    responses = responses.filter((r) => r.freightId === freightId);
  }
  if (formId) {
    responses = responses.filter((r) => r.formId === formId);
  }
  res.json(responses);
});
apiRouter.get("/forms/next-talao", (req, res) => {
  const nextNumber = db.getNextTalaoNumber();
  res.json({ nextNumber });
});
apiRouter.post("/forms/send-dispatch", async (req, res) => {
  const {
    responseId,
    stage,
    talaoNumber,
    freightCode,
    recipientType,
    recipientName,
    recipientEmail,
    recipientPhone,
    maskedData,
    receiptText
  } = req.body;
  const tenantId = req.user?.tenantId || "tenant-translog-01";
  const cleanPhone = recipientPhone ? formatPhoneForWhatsApp(recipientPhone) : "";
  let emailStatus = "NAO_INFORMADO";
  if (recipientEmail && recipientEmail.includes("@")) {
    emailStatus = "ENVIADO";
    db.notifications.unshift({
      id: `notif-email-${Date.now()}`,
      tenantId,
      userId: req.user.id,
      title: `\u{1F4E7} Comprovante de Checklist #${talaoNumber || "001"} Enviado por E-mail`,
      message: `Comprovante da etapa [${stage || "VISTORIA"}] transmitido com sucesso para ${recipientEmail} (${recipientName || "Respons\xE1vel"}).`,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      type: "STATUS_ATUALIZADO"
    });
  }
  let whatsappLink = "";
  if (cleanPhone && receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(receiptText)}`;
  } else if (receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "DISPARO_COMPROVANTE_CHECKLIST",
    entity: "ChecklistReceipt",
    entityId: responseId || `talao-${talaoNumber}`,
    details: `Disparo de comprovante do Tal\xE3o N\xBA ${talaoNumber || "001"} (${stage || "VISTORIA"}) para ${recipientName || "Respons\xE1vel"}. E-mail: ${recipientEmail || "N/A"} [${emailStatus}], WhatsApp: ${cleanPhone || "N/A"}`
  });
  res.json({
    success: true,
    emailStatus,
    recipientEmail: recipientEmail || null,
    recipientPhone: cleanPhone || null,
    whatsappLink,
    sentAt: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/notifications", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "N\xE3o autenticado" });
  const userNotifs = db.notifications.filter((n) => n.userId === req.user?.id);
  res.json(userNotifs);
});
apiRouter.put("/notifications/:id/read", (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === req.user?.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});
apiRouter.put("/notifications/mark-all-read", (req, res) => {
  db.notifications.forEach((n) => {
    if (n.userId === req.user?.id) {
      n.read = true;
    }
  });
  res.json({ success: true });
});
apiRouter.get("/error-logs", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode consultar o log de erros." });
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  const event = String(req.query.event || "").trim();
  const status = Number(req.query.status || 0);
  const filtered = db.errorLogs.filter((log) => (!event || log.event === event) && (!status || log.statusCode === status));
  res.json({ items: filtered.slice(0, limit), total: filtered.length });
});
apiRouter.delete("/error-logs", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode limpar o log de erros." });
  const days = Math.min(Math.max(Number(req.body?.olderThanDays || 90), 1), 3650);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1e3;
  const before = db.errorLogs.length;
  db.errorLogs = db.errorLogs.filter((log) => new Date(log.createdAt).getTime() >= cutoff);
  res.json({ success: true, removed: before - db.errorLogs.length });
});
apiRouter.get("/audit-logs", (req, res) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return res.json(db.auditLogs);
  }
  const logs = db.auditLogs.filter((l) => l.tenantId === req.user?.tenantId);
  res.json(logs);
});
apiRouter.get("/stats", (req, res) => {
  let freights = db.freights;
  let drivers = db.drivers;
  let vehicles = db.vehicles;
  let users = db.users;
  if (req.user?.role !== "SUPER_ADMIN") {
    freights = freights.filter((f) => f.tenantId === req.user?.tenantId);
    drivers = drivers.filter((d) => d.tenantId === req.user?.tenantId);
    vehicles = vehicles.filter((v) => v.tenantId === req.user?.tenantId);
    users = users.filter((u) => u.tenantId === req.user?.tenantId);
  }
  const availableFreights = freights.filter((f) => ["PUBLICADO", "DISPONIVEL"].includes(f.status)).length;
  const reservedFreights = freights.filter((f) => f.status === "RESERVADO").length;
  const inProgressFreights = freights.filter((f) => ["EM_COLETA", "COLETADO", "EM_TRANSITO"].includes(f.status)).length;
  const completedFreights = freights.filter((f) => ["ENTREGUE", "FINALIZADO"].includes(f.status)).length;
  const cancelledFreights = freights.filter((f) => f.status === "CANCELADO").length;
  const totalFreightValue = freights.reduce((acc, f) => acc + (f.payment?.price || 0), 0);
  const activeDrivers = drivers.filter((d) => d.status === "DISPONIVEL" || d.status === "EM_VIAGEM").length;
  res.json({
    totalFreights: freights.length,
    availableFreights,
    reservedFreights,
    inProgressFreights,
    completedFreights,
    cancelledFreights,
    totalFreightValue,
    totalDrivers: drivers.length,
    activeDrivers,
    totalVehicles: vehicles.length,
    totalUsers: users.length,
    recentFreights: freights.slice(0, 5),
    recentActivities: db.auditLogs.filter((l) => req.user?.role === "SUPER_ADMIN" || l.tenantId === req.user?.tenantId).slice(0, 8)
  });
});
apiRouter.delete("/freights/:id", async (req, res) => {
  const freight = db.freights.find((f) => f.id === req.params.id);
  if (!freight) return res.status(404).json({ error: "Frete n\xE3o encontrado" });
  if (req.user?.role !== "SUPER_ADMIN" && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este frete pertence a outra empresa." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  freight.status = "CANCELADO";
  freight.publicListingEnabled = false;
  freight.publicPublishedAt = void 0;
  freight.updatedAt = now;
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: freight.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "CANCELAR_FRETE",
    entity: "Freight",
    entityId: freight.id,
    details: `Frete ${freight.code} cancelado sem apagar documentos ou hist\xF3rico.`
  });
  const relevantUsers = db.users.filter((user) => user.tenantId === freight.tenantId);
  void dispatchConfiguredNotification("FRETE_CANCELADO", relevantUsers, { codigo: freight.code, empresa: db.tenants.find((item) => item.id === freight.tenantId)?.name || "", link: process.env.APP_URL || "" });
  await db.persistNow();
  res.json({ success: true, message: "Frete cancelado; documentos e hist\xF3rico preservados." });
});
apiRouter.delete("/drivers/:id", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem desativar motoristas." });
  const driver = db.drivers.find((d) => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: "Motorista n\xE3o encontrado" });
  if (req.user?.role !== "SUPER_ADMIN" && (!req.user?.tenantId || !db.hasDriverCompanyAccess(driver.id, req.user.tenantId, true))) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este motorista n\xE3o possui v\xEDnculo com a empresa." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  driver.status = "INATIVO";
  for (const link of db.driverCompanyLinks.filter((item) => item.driverId === driver.id)) {
    if (req.user?.role === "SUPER_ADMIN" || link.tenantId === req.user?.tenantId) {
      link.status = "BLOQUEADO";
      link.updatedAt = now;
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: req.user?.role === "SUPER_ADMIN" ? driver.tenantId : req.user?.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "DESATIVAR_MOTORISTA",
    entity: "Driver",
    entityId: driver.id,
    details: `Motorista ${driver.name} desativado sem apagar a identidade global ou o hist\xF3rico.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Motorista desativado; cadastro global e hist\xF3rico preservados." });
});
apiRouter.delete("/users/:id", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem desativar usu\xE1rios." });
  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
  if (req.user?.role !== "SUPER_ADMIN" && targetUser.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este usu\xE1rio pertence a outra empresa." });
  }
  if (targetUser.id === req.user?.id) return res.status(400).json({ error: "Voc\xEA n\xE3o pode desativar seu pr\xF3prio usu\xE1rio" });
  targetUser.status = "BLOQUEADO";
  targetUser.readOnly = true;
  targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: targetUser.tenantId || void 0,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "BLOQUEAR_USUARIO",
    entity: "User",
    entityId: targetUser.id,
    details: `Usu\xE1rio ${targetUser.name} (${targetUser.email}) bloqueado sem apagar cadastro ou auditoria.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Usu\xE1rio bloqueado; cadastro e hist\xF3rico preservados." });
});
apiRouter.delete("/forms/:id", async (req, res) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Somente administradores reais podem desativar formul\xE1rios." });
  const form = db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ error: "Formul\xE1rio n\xE3o encontrado" });
  if (req.user?.role !== "SUPER_ADMIN" && form.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Este formul\xE1rio pertence a outra empresa." });
  }
  form.active = false;
  form.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: form.tenantId || void 0,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "DESATIVAR_FORMULARIO",
    entity: "FormDefinition",
    entityId: form.id,
    details: `Formul\xE1rio ${form.title} desativado sem apagar respostas ou hist\xF3rico.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Formul\xE1rio desativado; respostas e hist\xF3rico preservados." });
});
apiRouter.delete("/vehicles/:id", async (req, res) => {
  const vehicle = db.vehicles.find((v) => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Ve\xEDculo n\xE3o encontrado" });
  const isOwnDriverVehicle = req.user?.role === "MOTORISTA" && req.user.driverId === vehicle.driverId;
  const isCompanyAdmin = canManageTenantDirectory(req.user) && (req.user?.role === "SUPER_ADMIN" || vehicle.tenantId === req.user?.tenantId);
  if (!isCompanyAdmin && !isOwnDriverVehicle) {
    return res.status(403).json({ error: "Acesso n\xE3o autorizado. Ve\xEDculos de parceiros s\xF3 podem ser desativados pelo pr\xF3prio motorista ou pelo Super Admin." });
  }
  vehicle.status = "INATIVO";
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: vehicle.tenantId || req.user?.tenantId || void 0,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "DESATIVAR_VEICULO",
    entity: "Vehicle",
    entityId: vehicle.id,
    details: `Ve\xEDculo placa ${vehicle.plate} desativado sem apagar hist\xF3rico.`
  });
  await db.persistNow();
  res.json({ success: true, message: "Ve\xEDculo desativado; hist\xF3rico preservado." });
});
apiRouter.get("/push/vapid-key", (req, res) => {
  res.json({ publicKey: publicVapidKey });
});
apiRouter.post("/push/subscribe", async (req, res) => {
  if (!req.user || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Perfis de teste e demo n\xE3o podem registrar notifica\xE7\xF5es." });
  const subscription = req.body;
  const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint.trim() : "";
  const keys = subscription?.keys;
  let endpointUrl;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return res.status(400).json({ error: "Endpoint de subscription inv\xE1lido." });
  }
  if (endpointUrl.protocol !== "https:" || endpoint.length > 2048 || !keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string" || keys.p256dh.length > 512 || keys.auth.length > 256 || !/^[A-Za-z0-9_-]+$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]+$/.test(keys.auth)) {
    return res.status(400).json({ error: "Subscription Web Push inv\xE1lida." });
  }
  if (!db.pushSubscriptions) {
    db.pushSubscriptions = [];
  }
  const subs = db.pushSubscriptions;
  const existing = subs.find((item) => item.endpoint === endpoint);
  if (existing && existing.userId !== req.user.id) return res.status(409).json({ error: "Este dispositivo j\xE1 est\xE1 vinculado a outra sess\xE3o." });
  if (!existing) {
    subs.push({
      endpoint,
      expirationTime: subscription.expirationTime === null ? null : void 0,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userId: req.user.id,
      tenantId: req.user.tenantId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await db.persistNow();
  }
  res.json({ success: true, message: "Push subscription registrada com sucesso" });
});
apiRouter.post("/push/test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN" || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Apenas o Super Admin real pode disparar o teste de broadcast." });
  if (!publicVapidKey || !privateVapidKey) return res.status(503).json({ error: "Notifica\xE7\xF5es Push n\xE3o est\xE3o configuradas." });
  try {
    await sendPushNotificationToAll({
      title: "Teste de Notifica\xE7\xE3o Push",
      body: "As notifica\xE7\xF5es push est\xE3o ativas e funcionando.",
      url: "/"
    });
    res.json({ success: true, message: "Notifica\xE7\xE3o de teste disparada com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao enviar notifica\xE7\xE3o de teste" });
  }
});
apiRouter.get("/notification-deliveries", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode consultar as entregas." });
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  res.json(db.notificationDeliveries.slice(0, limit));
});
apiRouter.get("/saas/notification-templates", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode consultar os modelos de mensagens." });
  res.json((db.saasGlobalConfig.notificationTemplates || []).map(safeNotificationTemplate));
});
apiRouter.put("/saas/notification-templates/:id", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Apenas o Super Admin pode editar os modelos de mensagens." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Contas de teste n\xE3o podem alterar mensagens ou configura\xE7\xF5es." });
  const templates = db.saasGlobalConfig.notificationTemplates || [];
  const template = templates.find((item) => item.id === req.params.id);
  if (!template) return res.status(404).json({ error: "Modelo de mensagem n\xE3o encontrado." });
  if (template.systemLocked || template.editable === false || template.eventKey === "ERRO_SISTEMA") return res.status(403).json({ error: "Mensagens de erro do sistema s\xE3o protegidas e n\xE3o podem ser editadas." });
  const body = req.body || {};
  template.label = String(body.label ?? template.label).trim().slice(0, 140);
  template.description = String(body.description ?? template.description).trim().slice(0, 500);
  template.enabled = body.enabled === void 0 ? template.enabled : Boolean(body.enabled);
  template.channels = {
    email: body.channels?.email === void 0 ? template.channels.email : Boolean(body.channels.email),
    whatsapp: body.channels?.whatsapp === void 0 ? template.channels.whatsapp : Boolean(body.channels.whatsapp),
    inApp: body.channels?.inApp === void 0 ? template.channels.inApp : Boolean(body.channels.inApp)
  };
  template.emailSubject = String(body.emailSubject ?? template.emailSubject).replace(/[<>]/g, "").trim().slice(0, 240);
  template.emailBody = sanitizeServerHtml(String(body.emailBody ?? template.emailBody).slice(0, 5e3));
  const nextWhatsappBody = String(body.whatsappBody ?? template.whatsappBody).replace(/[<>]/g, "").trim().slice(0, 1e3);
  if (template.eventKey === LOGIN_OTP_EVENT_KEY) {
    const referencedVariables = Array.from(nextWhatsappBody.matchAll(/\{([a-zA-Z0-9_]+)\}/g), (match) => match[1]);
    const hasRequiredVariables = LOGIN_OTP_REQUIRED_VARIABLES.every((variable) => referencedVariables.includes(variable));
    const hasOnlyAllowedVariables = referencedVariables.every((variable) => LOGIN_OTP_ALLOWED_VARIABLES.has(variable));
    if (!nextWhatsappBody || nextWhatsappBody.length > 500 || !hasRequiredVariables || !hasOnlyAllowedVariables) {
      return res.status(400).json({ error: "O modelo de OTP deve conter {codigo} e {validadeMinutos} e usar apenas vari\xE1veis permitidas." });
    }
    template.enabled = true;
    template.channels = { email: false, whatsapp: true, inApp: false };
  }
  template.whatsappBody = nextWhatsappBody;
  template.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await db.persistNow();
  res.json(template);
});
var getTenantReportOwner = (req) => {
  if (!req.user?.tenantId) return void 0;
  return db.tenants.find((item) => item.id === req.user.tenantId);
};
var getEditableTenantReportOwner = (req) => {
  if (!req.user || !["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return void 0;
  return getTenantReportOwner(req);
};
var reportTemplateText = (value, fallback, maxLength, allowEmpty = false) => {
  const text = String(value ?? fallback).replace(/[<>]/g, "").replace(/[\r\n]+/g, " ").trim();
  if (!text && allowEmpty) return "";
  return text.slice(0, maxLength);
};
var reportTemplateTypes = /* @__PURE__ */ new Set(["EXPENSE", "CHECKLIST"]);
apiRouter.get("/tenant/report-templates", (req, res) => {
  const tenant = getTenantReportOwner(req);
  if (!tenant) return res.status(403).json({ error: "A edi\xE7\xE3o dos modelos exige perfil administrador da empresa." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Contas de teste n\xE3o podem acessar a edi\xE7\xE3o de modelos." });
  return res.json(db.getTenantReportTemplates(tenant.id));
});
apiRouter.put("/tenant/report-templates/:type", async (req, res) => {
  const tenant = getEditableTenantReportOwner(req);
  if (!tenant) return res.status(403).json({ error: "A edi\xE7\xE3o dos modelos exige perfil administrador da empresa." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Contas de teste n\xE3o podem alterar modelos de relat\xF3rio." });
  const type = String(req.params.type || "").toUpperCase();
  if (!reportTemplateTypes.has(type)) return res.status(400).json({ error: "Tipo de relat\xF3rio inv\xE1lido." });
  const current = db.getTenantReportTemplates(tenant.id).find((template) => template.type === type);
  if (!current) return res.status(404).json({ error: "Modelo de relat\xF3rio n\xE3o encontrado." });
  const body = req.body || {};
  const nextInput = {
    type,
    title: reportTemplateText(body.title, current.title, 140),
    subtitle: reportTemplateText(body.subtitle, current.subtitle, 240),
    approvalLabel: reportTemplateText(body.approvalLabel, current.approvalLabel, 140),
    signatureLabel: reportTemplateText(body.signatureLabel, current.signatureLabel, 140),
    notes: reportTemplateText(body.notes, current.notes, 500, true)
  };
  if (!nextInput.title || !nextInput.subtitle || !nextInput.approvalLabel || !nextInput.signatureLabel) {
    return res.status(400).json({ error: "T\xEDtulo, subt\xEDtulo, aprova\xE7\xE3o e assinatura s\xE3o obrigat\xF3rios." });
  }
  const saved = db.saveTenantReportTemplate(tenant.id, nextInput);
  const actor = safeTenantNotificationAuditActor(req);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
    action: "TENANT_REPORT_TEMPLATE_UPDATED",
    entity: "TenantReportTemplate",
    entityId: type,
    details: `Modelo ${type} personalizado pela empresa; identidade legal e rodap\xE9 do SaaS permanecem obrigat\xF3rios; sess\xE3o assistida ${req.supportSession ? "sim" : "n\xE3o"}.`
  });
  await db.persistNow();
  return res.json(saved);
});
var getEditableTenantNotificationOwner = (req) => {
  if (!req.user || !["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role) || !req.user.tenantId) return void 0;
  const tenant = db.tenants.find((item) => item.id === req.user.tenantId);
  return tenant && tenantOwnNumberActive(tenant.id) ? tenant : void 0;
};
var safeTenantNotificationAuditActor = (req) => {
  if (req.supportSession) return db.users.find((user) => user.id === req.supportSession.actorUserId) || req.user;
  return req.user;
};
apiRouter.get("/tenant/notification-templates", (req, res) => {
  const tenant = getEditableTenantNotificationOwner(req);
  if (!tenant) return res.status(403).json({ error: "A edi\xE7\xE3o de mensagens exige o m\xF3dulo ativo de WhatsApp com n\xFAmero pr\xF3prio da empresa." });
  return res.json(notificationTemplatesForTenant(tenant.id));
});
apiRouter.put("/tenant/notification-templates/:id", async (req, res) => {
  const tenant = getEditableTenantNotificationOwner(req);
  if (!tenant) return res.status(403).json({ error: "A edi\xE7\xE3o de mensagens exige o m\xF3dulo ativo de WhatsApp com n\xFAmero pr\xF3prio da empresa." });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Contas de teste n\xE3o podem alterar mensagens ou configura\xE7\xF5es." });
  const globalTemplate = (db.saasGlobalConfig.notificationTemplates || []).find((item) => item.id === req.params.id);
  if (!globalTemplate) return res.status(404).json({ error: "Modelo de mensagem n\xE3o encontrado." });
  if (globalTemplate.systemLocked || globalTemplate.editable === false || globalTemplate.eventKey === "ERRO_SISTEMA") {
    return res.status(403).json({ error: "Este modelo \xE9 protegido e n\xE3o pode ser personalizado pela empresa." });
  }
  const body = req.body || {};
  const emailSubject = String(body.emailSubject ?? globalTemplate.emailSubject).trim();
  const emailBody = String(body.emailBody ?? globalTemplate.emailBody);
  const whatsappBody = String(body.whatsappBody ?? globalTemplate.whatsappBody).trim();
  const allowedVariables = globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY ? Array.from(LOGIN_OTP_ALLOWED_VARIABLES) : [...globalTemplate.variables, "nomePlataforma", "nomeEmpresa", "razaoSocial", "cnpjEmpresa", "emailEmpresa", "telefoneEmpresa", "cidadeEmpresa", "estadoEmpresa"];
  const allTextSafe = notificationTemplateTextIsSafe(emailSubject, allowedVariables) && notificationTemplateTextIsSafe(emailBody, allowedVariables) && notificationTemplateTextIsSafe(whatsappBody, allowedVariables);
  const hasOtpVariables = globalTemplate.eventKey !== LOGIN_OTP_EVENT_KEY || LOGIN_OTP_REQUIRED_VARIABLES.every((variable) => whatsappBody.includes(`{${variable}}`));
  if (!allTextSafe || !hasOtpVariables) {
    return res.status(400).json({ error: globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY ? "O modelo de OTP deve conter {codigo} e {validadeMinutos} e usar apenas vari\xE1veis permitidas." : "O modelo cont\xE9m texto vazio, vari\xE1vel n\xE3o permitida ou excede o limite de seguran\xE7a." });
  }
  const currentOverrides = db.tenantNotificationTemplates.get(tenant.id) || [];
  const nextTemplate = {
    ...globalTemplate,
    label: String(body.label ?? globalTemplate.label).trim().slice(0, 140),
    description: String(body.description ?? globalTemplate.description).trim().slice(0, 500),
    enabled: globalTemplate.enabled,
    editable: true,
    channels: globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY ? { email: false, whatsapp: true, inApp: false } : { ...globalTemplate.channels },
    emailSubject,
    emailBody,
    whatsappBody,
    variables: [...globalTemplate.variables],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "TENANT"
  };
  const nextOverrides = [...currentOverrides.filter((item) => item.id !== globalTemplate.id), nextTemplate];
  db.tenantNotificationTemplates.set(tenant.id, nextOverrides);
  const actor = safeTenantNotificationAuditActor(req);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
    action: "TENANT_NOTIFICATION_TEMPLATE_UPDATED",
    entity: "NotificationTemplate",
    entityId: globalTemplate.id,
    details: `Modelo ${globalTemplate.eventKey} personalizado pela empresa; sess\xE3o assistida ${req.supportSession ? "sim" : "n\xE3o"}.`
  });
  await db.persistNow();
  return res.json(nextTemplate);
});
var safeConfigText = (value, maxLength = 500) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";
var safeConfigNumber = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
var safePublicUrl = (value) => {
  const candidate = safeConfigText(value, 2048);
  if (!candidate) return "";
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};
var safeSeoConfig = (seo) => seo ? {
  siteName: safeConfigText(seo.siteName),
  title: safeConfigText(seo.title),
  description: safeConfigText(seo.description, 2e3),
  keywords: safeConfigText(seo.keywords, 1e3),
  canonicalUrl: safePublicUrl(seo.canonicalUrl),
  ogImageUrl: safePublicUrl(seo.ogImageUrl) || void 0,
  locale: /^[a-z]{2}(?:-[A-Z]{2})?$/.test(String(seo.locale || "")) ? String(seo.locale) : "pt-BR",
  allowIndexing: Boolean(seo.allowIndexing)
} : void 0;
var safeLayoutConfig = (layout) => layout ? {
  primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(layout.primaryColor || "")) ? layout.primaryColor : "#059669",
  borderRadius: ["none", "sm", "md", "lg", "xl", "2xl"].includes(layout.borderRadius) ? layout.borderRadius : "xl",
  fontFamily: ["sans", "serif", "mono", "display"].includes(layout.fontFamily) ? layout.fontFamily : "sans",
  navbarStyle: ["dark", "light", "colored"].includes(layout.navbarStyle) ? layout.navbarStyle : "dark",
  logoText: safeConfigText(layout.logoText),
  logoImageUrl: safePublicUrl(layout.logoImageUrl) || void 0,
  faviconUrl: safePublicUrl(layout.faviconUrl) || void 0,
  appIconUrl: safePublicUrl(layout.appIconUrl) || void 0,
  homeHeroImageUrl: safePublicUrl(layout.homeHeroImageUrl) || void 0,
  browserTabTitle: safeConfigText(layout.browserTabTitle),
  footerText: safeConfigText(layout.footerText, 1e3),
  systemBackground: ["minimal", "warm", "slate"].includes(layout.systemBackground) ? layout.systemBackground : "minimal",
  homeBadgeText: safeConfigText(layout.homeBadgeText),
  homeTitle: safeConfigText(layout.homeTitle),
  homeTitleAccent: safeConfigText(layout.homeTitleAccent),
  homeSubtitle: safeConfigText(layout.homeSubtitle, 2e3)
} : void 0;
var safeFormField = (field) => field && typeof field.id === "string" ? {
  id: safeConfigText(field.id, 80),
  originalLabel: safeConfigText(field.originalLabel, 200),
  label: safeConfigText(field.label, 200),
  placeholder: safeConfigText(field.placeholder, 500),
  enabled: Boolean(field.enabled),
  required: Boolean(field.required)
} : null;
var safeFormFieldsConfig = (fields) => fields ? {
  userForm: Array.isArray(fields.userForm) ? fields.userForm.map(safeFormField).filter(Boolean) : [],
  freightForm: Array.isArray(fields.freightForm) ? fields.freightForm.map(safeFormField).filter(Boolean) : [],
  driverForm: Array.isArray(fields.driverForm) ? fields.driverForm.map(safeFormField).filter(Boolean) : [],
  expenseForm: Array.isArray(fields.expenseForm) ? fields.expenseForm.map(safeFormField).filter(Boolean) : []
} : void 0;
var safeNotificationTemplate = (template) => template && typeof template.id === "string" ? {
  id: safeConfigText(template.id, 120),
  eventKey: safeConfigText(template.eventKey, 120),
  label: safeConfigText(template.label, 140),
  description: safeConfigText(template.description, 500),
  category: template.category,
  enabled: Boolean(template.enabled),
  editable: Boolean(template.editable),
  systemLocked: Boolean(template.systemLocked),
  channels: {
    email: Boolean(template.channels?.email),
    whatsapp: Boolean(template.channels?.whatsapp),
    inApp: Boolean(template.channels?.inApp)
  },
  emailSubject: safeConfigText(template.emailSubject, 240).replace(/[<>]/g, ""),
  emailBody: sanitizeServerHtml(String(template.emailBody || "").slice(0, 5e3)),
  whatsappBody: safeConfigText(template.whatsappBody, 1e3).replace(/[<>]/g, ""),
  variables: Array.isArray(template.variables) ? template.variables.filter((value) => /^[a-zA-Z0-9_]{1,80}$/.test(String(value))).slice(0, 50) : [],
  updatedAt: safeConfigText(template.updatedAt, 64),
  source: template.source === "TENANT" ? "TENANT" : "GLOBAL"
} : null;
var safePlanConfig = (plan) => plan && typeof plan.id === "string" ? {
  id: plan.id,
  name: safeConfigText(plan.name, 200),
  price: safeConfigNumber(plan.price, 0, 0, 1e8),
  maxFreightsMonthly: safeConfigNumber(plan.maxFreightsMonthly, 0, 0, 1e8),
  maxUsers: safeConfigNumber(plan.maxUsers, 0, 0, 1e6),
  maxDrivers: safeConfigNumber(plan.maxDrivers, 0, 0, 1e6),
  isActive: Boolean(plan.isActive)
} : null;
var safeNotificationModule = (module2) => module2 ? {
  enabled: Boolean(module2.enabled),
  freePlanName: safeConfigText(module2.freePlanName, 200),
  freePlanDescription: safeConfigText(module2.freePlanDescription, 1e3),
  ownNumberPlanName: safeConfigText(module2.ownNumberPlanName, 200),
  ownNumberPlanDescription: safeConfigText(module2.ownNumberPlanDescription, 1e3),
  ownNumberMonthlyPrice: safeConfigNumber(module2.ownNumberMonthlyPrice, 0, 0, 1e8),
  assistedActivationPrice: safeConfigNumber(module2.assistedActivationPrice, 0, 0, 1e8),
  extraNumberMonthlyPrice: safeConfigNumber(module2.extraNumberMonthlyPrice, 0, 0, 1e8)
} : void 0;
var exposeSafeSaaSConfig = (config) => ({
  systemName: safeConfigText(config.systemName, 200),
  supportPhone: safeConfigText(config.supportPhone, 40),
  supportEmail: safeConfigText(config.supportEmail, 254),
  defaultCommissionPercent: safeConfigNumber(config.defaultCommissionPercent, 0, 0, 100),
  requireChecklistPhotos: Boolean(config.requireChecklistPhotos),
  minDriverAge: safeConfigNumber(config.minDriverAge, 18, 0, 120),
  otpExpirationMinutes: safeConfigNumber(config.otpExpirationMinutes, 5, 1, 60),
  allowSelfRegistration: Boolean(config.allowSelfRegistration),
  showDemoSwitcher: Boolean(config.showDemoSwitcher),
  plans: Array.isArray(config.plans) ? config.plans.map(safePlanConfig).filter(Boolean) : [],
  layout: safeLayoutConfig(config.layout),
  formFields: safeFormFieldsConfig(config.formFields),
  emailConfig: config.emailConfig ? {
    host: safeConfigText(config.emailConfig.host, 255),
    port: safeConfigNumber(config.emailConfig.port, 587, 1, 65535),
    user: safeConfigText(config.emailConfig.user, 254),
    password: config.emailConfig.password ? "********" : "",
    senderEmail: safeConfigText(config.emailConfig.senderEmail, 254),
    testEmail: safeConfigText(config.emailConfig.testEmail, 254),
    isActive: Boolean(config.emailConfig.isActive)
  } : void 0,
  databaseConfig: config.databaseConfig ? {
    enabled: Boolean(config.databaseConfig.enabled),
    dbType: ["postgres", "mysql", "sqlite"].includes(config.databaseConfig.dbType) ? config.databaseConfig.dbType : "postgres",
    host: safeConfigText(config.databaseConfig.host, 255),
    port: safeConfigNumber(config.databaseConfig.port, 5432, 1, 65535),
    database: safeConfigText(config.databaseConfig.database, 255),
    username: safeConfigText(config.databaseConfig.username, 255),
    password: config.databaseConfig.password ? "********" : "",
    ssl: Boolean(config.databaseConfig.ssl),
    poolMax: safeConfigNumber(config.databaseConfig.poolMax, 10, 1, 1e3),
    autoMigrate: Boolean(config.databaseConfig.autoMigrate),
    connectionStatus: config.databaseConfig.connectionStatus,
    lastTestedAt: safeConfigText(config.databaseConfig.lastTestedAt, 64)
  } : void 0,
  imageCompression: config.imageCompression ? {
    enabled: Boolean(config.imageCompression.enabled),
    maxWidth: safeConfigNumber(config.imageCompression.maxWidth, 1920, 1, 1e4),
    maxHeight: safeConfigNumber(config.imageCompression.maxHeight, 1080, 1, 1e4),
    quality: safeConfigNumber(config.imageCompression.quality, 0.8, 0.1, 1),
    format: ["image/jpeg", "image/webp", "image/png"].includes(config.imageCompression.format) ? config.imageCompression.format : "image/webp",
    autoCompressDocuments: Boolean(config.imageCompression.autoCompressDocuments),
    maxFileSizeKB: safeConfigNumber(config.imageCompression.maxFileSizeKB, 10240, 1, 102400)
  } : void 0,
  mapboxConfig: config.mapboxConfig ? {
    enabled: Boolean(config.mapboxConfig.enabled),
    apiKey: config.mapboxConfig.apiKey ? "********" : "",
    defaultZoom: safeConfigNumber(config.mapboxConfig.defaultZoom, 7, 0, 24),
    defaultStyle: config.mapboxConfig.defaultStyle,
    enableLiveTracking: Boolean(config.mapboxConfig.enableLiveTracking),
    updateIntervalSeconds: safeConfigNumber(config.mapboxConfig.updateIntervalSeconds, 15, 1, 3600)
  } : void 0,
  asaasConfig: config.asaasConfig ? {
    enabled: Boolean(config.asaasConfig.enabled),
    environment: config.asaasConfig.environment === "production" ? "production" : "sandbox",
    apiKey: config.asaasConfig.apiKey ? "********" : "",
    webhookToken: config.asaasConfig.webhookToken ? "********" : "",
    webhookUrl: safePublicUrl(config.asaasConfig.webhookUrl) || void 0
  } : void 0,
  notificationModule: safeNotificationModule(config.notificationModule),
  backupNotifications: safeBackupNotifications(),
  seo: safeSeoConfig(config.seo),
  notificationTemplates: Array.isArray(config.notificationTemplates) ? config.notificationTemplates.map(safeNotificationTemplate).filter(Boolean) : []
});
var exposePublicSaaSConfig = (config) => ({
  systemName: safeConfigText(config.systemName, 200),
  supportPhone: safeConfigText(config.supportPhone, 40),
  supportEmail: safeConfigText(config.supportEmail, 254),
  allowSelfRegistration: Boolean(config.allowSelfRegistration),
  showDemoSwitcher: Boolean(config.showDemoSwitcher),
  plans: Array.isArray(config.plans) ? config.plans.map(safePlanConfig).filter((plan) => plan?.isActive) : [],
  notificationModule: safeNotificationModule(config.notificationModule),
  layout: safeLayoutConfig(config.layout),
  formFields: safeFormFieldsConfig(config.formFields),
  seo: safeSeoConfig(config.seo)
});
apiRouter.get("/saas/config", (req, res) => {
  res.setHeader("Cache-Control", req.user?.role === "SUPER_ADMIN" ? "no-store" : "public, max-age=300");
  res.json(req.user?.role === "SUPER_ADMIN" ? exposeSafeSaaSConfig(db.saasGlobalConfig) : exposePublicSaaSConfig(db.saasGlobalConfig));
});
apiRouter.post("/saas/config", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Permiss\xE3o insuficiente para alterar configura\xE7\xF5es globais do SaaS." });
  }
  if (isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: "Perfis criados para teste n\xE3o possuem permiss\xE3o para editar ou salvar informa\xE7\xF5es e configura\xE7\xF5es do sistema." });
  }
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: "Configura\xE7\xE3o inv\xE1lida." });
  }
  const existing = db.saasGlobalConfig;
  const keepSecret = (incoming, current, field) => {
    if (!incoming) return current;
    const value = incoming[field];
    return value === "********" || value === "" || value === void 0 ? current?.[field] || "" : value;
  };
  const emailConfig = newConfig.emailConfig ? { ...newConfig.emailConfig, password: keepSecret(newConfig.emailConfig, existing.emailConfig, "password") } : existing.emailConfig;
  const databaseConfig = newConfig.databaseConfig ? { ...newConfig.databaseConfig, password: keepSecret(newConfig.databaseConfig, existing.databaseConfig, "password") } : existing.databaseConfig;
  const mapboxConfig = newConfig.mapboxConfig ? { ...newConfig.mapboxConfig, apiKey: keepSecret(newConfig.mapboxConfig, existing.mapboxConfig, "apiKey") } : existing.mapboxConfig;
  const asaasConfig = newConfig.asaasConfig ? {
    ...newConfig.asaasConfig,
    apiKey: keepSecret(newConfig.asaasConfig, existing.asaasConfig, "apiKey"),
    webhookToken: keepSecret(newConfig.asaasConfig, existing.asaasConfig, "webhookToken")
  } : existing.asaasConfig;
  let backupNotifications = existing.backupNotifications || defaultBackupNotificationConfig();
  if (newConfig.backupNotifications) {
    try {
      backupNotifications = backupNotificationConfigFromInput(newConfig.backupNotifications, backupNotifications);
    } catch (error) {
      return res.status(400).json({ error: error?.message || "Alertas de backup inv\xE1lidos." });
    }
  }
  db.saasGlobalConfig = {
    ...existing,
    ...newConfig,
    emailConfig,
    databaseConfig,
    mapboxConfig,
    asaasConfig,
    backupNotifications
  };
  if (newConfig.databaseConfig) {
    sqlAdapter.updateConfig(databaseConfig);
  }
  if (mapboxConfig?.apiKey) {
    try {
      await db.persistMapboxSecret(mapboxConfig.apiKey);
    } catch (error) {
      return res.status(500).json({ error: error?.message || "N\xE3o foi poss\xEDvel armazenar a configura\xE7\xE3o Mapbox com seguran\xE7a." });
    }
  }
  if (emailConfig?.host && emailConfig?.user && emailConfig?.password) {
    try {
      await db.persistEmailSecret(emailConfig);
    } catch (error) {
      return res.status(500).json({ error: "N\xE3o foi poss\xEDvel armazenar a configura\xE7\xE3o SMTP com seguran\xE7a." });
    }
  }
  if (asaasConfig?.apiKey || asaasConfig?.webhookToken) {
    try {
      await db.persistAsaasSecret(asaasConfig);
    } catch (error) {
      return res.status(500).json({ error: "N\xE3o foi poss\xEDvel armazenar a configura\xE7\xE3o Asaas com seguran\xE7a." });
    }
  }
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: void 0,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "CONFIG_SAAS",
    entity: "SaaSConfig",
    entityId: "global-saas-config",
    details: `Atualizou configura\xE7\xF5es globais do SaaS (Nome: ${db.saasGlobalConfig.systemName})`
  });
  await db.persistNow();
  res.json({ success: true, config: exposeSafeSaaSConfig(db.saasGlobalConfig) });
});
apiRouter.get("/database/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }
  try {
    const status = await sqlAdapter.getStatus();
    res.json({
      success: true,
      ...status,
      imageCompression: db.saasGlobalConfig.imageCompression
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.post("/database/test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }
  const customConfig = req.body || {};
  const result = await sqlAdapter.testConnection(customConfig);
  res.json(result);
});
apiRouter.post("/database/migrate", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }
  const result = await sqlAdapter.runMigration();
  if (result.success) {
    db.addAuditLog({
      ip: requestIp(req),
      tenantId: void 0,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: "MIGRATE_SQL_DATABASE",
      entity: "Database",
      entityId: "postgres",
      details: "Executou a migra\xE7\xE3o completa do banco de dados SQL (todas as tabelas criadas/atualizadas)."
    });
  }
  res.json(result);
});
apiRouter.get("/database/schema", (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }
  const sql = sqlAdapter.getSchemaSql();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(sql);
});
apiRouter.get("/installation/ssh-script", (req, res) => {
  const installScriptPath = import_path2.default.join(process.cwd(), "install.sh");
  if (import_fs2.default.existsSync(installScriptPath)) {
    const script = import_fs2.default.readFileSync(installScriptPath, "utf-8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(script);
  } else {
    res.status(404).send('#!/bin/bash\necho "install.sh not found"\n');
  }
});
apiRouter.get("/installation/portainer-stack", (req, res) => {
  const portainerPath = import_path2.default.join(process.cwd(), "docker-compose.portainer.yml");
  if (import_fs2.default.existsSync(portainerPath)) {
    const composeYaml = import_fs2.default.readFileSync(portainerPath, "utf-8");
    res.setHeader("Content-Type", "text/yaml; charset=utf-8");
    res.send(composeYaml);
  } else {
    res.status(404).send("# docker-compose.portainer.yml not found");
  }
});
apiRouter.get("/expenses", (req, res) => {
  let list = db.tripExpenses || [];
  const { freightId, driverId, status } = req.query;
  const includeArchived = req.query.includeArchived === "true" && ["SUPER_ADMIN", "EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user?.role || "");
  if (!includeArchived) list = list.filter((report) => !report.archivedAt);
  if (req.user?.role === "MOTORISTA") {
    list = list.filter((e) => e.driverId === req.user?.id || e.driverId === req.user?.driverId || req.user?.name && e.driverName === req.user.name);
  } else if (req.user?.role !== "SUPER_ADMIN") {
    list = list.filter((e) => !e.tenantId || e.tenantId === req.user?.tenantId);
  }
  if (freightId) {
    list = list.filter((e) => e.freightId === freightId);
  }
  if (driverId) {
    list = list.filter((e) => e.driverId === driverId);
  }
  if (status) {
    list = list.filter((e) => e.status === status);
  }
  res.json(list);
});
apiRouter.get("/expenses/:id", (req, res) => {
  const report = (db.tripExpenses || []).find((e) => e.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Relat\xF3rio de presta\xE7\xE3o de contas n\xE3o encontrado" });
  }
  if (req.user?.role !== "SUPER_ADMIN") {
    if (req.user?.role === "MOTORISTA") {
      const isOwner = report.driverId === req.user?.id || report.driverId === req.user?.driverId || report.driverName === req.user?.name;
      if (!isOwner) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado a este relat\xF3rio" });
      }
    } else if (report.tenantId && report.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: "Acesso n\xE3o autorizado a relat\xF3rios de outra empresa" });
    }
  }
  res.json(report);
});
var normalizeExpenseText = (value, max = 500) => typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
var normalizeExpenseItems = (raw, fallback = []) => {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, 100).filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item, index) => ({
    id: normalizeExpenseText(item.id, 100) || `item-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}-${index}`,
    category: normalizeExpenseText(item.category, 60),
    date: normalizeExpenseText(item.date, 32),
    description: normalizeExpenseText(item.description, 500),
    establishmentName: normalizeExpenseText(item.establishmentName, 200),
    documentNumber: normalizeExpenseText(item.documentNumber, 100),
    amount: Math.min(1e8, Math.max(0, Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0)),
    paymentMethod: normalizeExpenseText(item.paymentMethod, 50),
    liters: item.liters === void 0 ? void 0 : Math.max(0, Number(item.liters) || 0),
    pricePerLiter: item.pricePerLiter === void 0 ? void 0 : Math.max(0, Number(item.pricePerLiter) || 0),
    odometerKm: item.odometerKm === void 0 ? void 0 : Math.max(0, Number(item.odometerKm) || 0),
    fuelType: item.fuelType ? normalizeExpenseText(item.fuelType, 40) : void 0,
    arlaLiters: item.arlaLiters === void 0 ? void 0 : Math.max(0, Number(item.arlaLiters) || 0),
    arlaAmount: item.arlaAmount === void 0 ? void 0 : Math.max(0, Number(item.arlaAmount) || 0),
    nightsCount: item.nightsCount === void 0 ? void 0 : Math.max(0, Number(item.nightsCount) || 0),
    transportOrigin: normalizeExpenseText(item.transportOrigin, 160),
    transportDestination: normalizeExpenseText(item.transportDestination, 160),
    receiptPhotoUrl: typeof item.receiptPhotoUrl === "string" && /^(?:https:\/\/|data:image\/)/i.test(item.receiptPhotoUrl) ? item.receiptPhotoUrl.slice(0, 2e5) : void 0,
    receiptPhotoUrls: Array.isArray(item.receiptPhotoUrls) ? item.receiptPhotoUrls.filter((url) => typeof url === "string" && /^(?:https:\/\/|data:image\/)/i.test(url)).slice(0, 6).map((url) => url.slice(0, 2e5)) : void 0,
    notes: normalizeExpenseText(item.notes, 1e3),
    createdAt: normalizeExpenseText(item.createdAt, 32) || (/* @__PURE__ */ new Date()).toISOString()
  }));
};
apiRouter.post("/expenses", (req, res) => {
  const data = req.body && typeof req.body === "object" ? req.body : null;
  if (!req.user || !data) return res.status(400).json({ error: "Dados da presta\xE7\xE3o de contas inv\xE1lidos." });
  const canSubmitExpense = req.user.role === "SUPER_ADMIN" || ["EMPRESA_SUPER_ADMIN", "ADMIN", "SUPERVISOR", "MOTORISTA"].includes(req.user.role);
  if (!canSubmitExpense || isTestOrDemoUser(req.user)) return res.status(403).json({ error: "Este perfil n\xE3o pode criar presta\xE7\xF5es de contas." });
  const requestedTenantId = req.user.role === "SUPER_ADMIN" ? String(data.tenantId || "") : String(req.user.tenantId || "");
  const assignedTenantId = requestedTenantId && db.tenants.some((tenant) => tenant.id === requestedTenantId) ? requestedTenantId : "";
  if (!assignedTenantId) return res.status(400).json({ error: "Empresa v\xE1lida \xE9 obrigat\xF3ria para a presta\xE7\xE3o de contas." });
  const freight = data.freightId ? db.freights.find((item) => item.id === String(data.freightId)) : void 0;
  if (data.freightId && (!freight || freight.tenantId !== assignedTenantId)) return res.status(403).json({ error: "Frete n\xE3o pertence \xE0 empresa informada." });
  const requestedDriverId = req.user.role === "MOTORISTA" ? req.user.driverId || req.user.id : String(data.driverId || "");
  const driver = requestedDriverId ? db.drivers.find((item) => item.id === requestedDriverId || item.userId === requestedDriverId) : void 0;
  if (!driver || req.user.role === "MOTORISTA" && driver.userId !== req.user.id && driver.id !== req.user.driverId || !["SUPER_ADMIN", "MOTORISTA"].includes(req.user.role) && !db.hasDriverCompanyAccess(driver.id, assignedTenantId, true)) return res.status(403).json({ error: "Motorista n\xE3o autorizado para esta presta\xE7\xE3o de contas." });
  const items = normalizeExpenseItems(data.items);
  const totalExpenses = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items.filter((it) => it.category === "ABASTECIMENTO" && it.liters).reduce((acc, it) => acc + (Number(it.liters) || 0), 0);
  const initialKm = Number(data.initialKm) || 0;
  const finalKm = Number(data.finalKm) || 0;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : Number(data.totalKm) || 0;
  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;
  const advanceAmount = Number(data.advanceAmount) || 0;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus = balanceAmount >= 0 ? "A_DEVOLVER" : "REEMBOLSO_A_RECEBER";
  const newReport = {
    id: `exp-${Date.now()}-${(0, import_crypto.randomUUID)().slice(0, 8)}`,
    tenantId: assignedTenantId,
    freightId: freight?.id,
    freightCode: freight?.code,
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    vehiclePlate: normalizeExpenseText(data.vehiclePlate, 20),
    chassis: normalizeExpenseText(data.chassis, 100),
    vehicleModel: normalizeExpenseText(data.vehicleModel, 120),
    clientName: normalizeExpenseText(data.clientName, 200),
    startDate: normalizeExpenseText(data.startDate, 32) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    endDate: normalizeExpenseText(data.endDate, 32) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    tripDays: Math.min(366, Math.max(1, Number(data.tripDays) || 1)),
    initialKm,
    finalKm,
    totalKm,
    totalLiters,
    averageKmPerLiter,
    costPerKm,
    advanceAmount,
    driverLaborAmount: Math.max(0, Number(data.driverLaborAmount) || 0),
    totalExpenses,
    balanceAmount,
    balanceStatus,
    status: data.status === "RASCUNHO" ? "RASCUNHO" : "ENVIADO",
    items,
    generalNotes: normalizeExpenseText(data.generalNotes, 2e3),
    reviewerNotes: "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!db.tripExpenses) {
    db.tripExpenses = [];
  }
  db.tripExpenses.unshift(newReport);
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: newReport.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "MOTORISTA",
    action: "CRIACAO_PRESTACAO_CONTAS",
    entity: "TripExpenseReport",
    entityId: newReport.id,
    details: `Presta\xE7\xE3o de contas criada para a viagem/frete ${newReport.freightCode || newReport.id} (Total: R$ ${totalExpenses.toFixed(2)})`
  });
  res.status(201).json(newReport);
});
apiRouter.put("/expenses/:id", (req, res) => {
  const index = (db.tripExpenses || []).findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Relat\xF3rio de despesas n\xE3o encontrado" });
  }
  const existing = db.tripExpenses[index];
  const updates = req.body && typeof req.body === "object" ? req.body : {};
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const isCompanyStaff = (req.user?.role === "ADMIN" || req.user?.role === "EMPRESA_SUPER_ADMIN" || req.user?.role === "SUPERVISOR") && (!existing.tenantId || existing.tenantId === req.user?.tenantId);
  const isDriverOwner = req.user?.role === "MOTORISTA" && (existing.driverId === req.user?.id || existing.driverId === req.user?.driverId || existing.driverName === req.user?.name);
  if (!isSuperAdmin && !isCompanyStaff && !isDriverOwner) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para editar este relat\xF3rio" });
  }
  const requestedStatus = updates.status === void 0 ? existing.status : String(updates.status);
  if (!["RASCUNHO", "ENVIADO", "EM_ANALISE", "APROVADO", "REJEITADO", "QUITADO"].includes(requestedStatus)) return res.status(400).json({ error: "Status de presta\xE7\xE3o de contas inv\xE1lido." });
  const canApproveExpense = isSuperAdmin || (req.user?.role === "EMPRESA_SUPER_ADMIN" || req.user?.role === "ADMIN") && existing.tenantId === req.user?.tenantId;
  if (["APROVADO", "QUITADO"].includes(requestedStatus) && !canApproveExpense) return res.status(403).json({ error: "Apenas administradores da empresa podem aprovar ou quitar despesas." });
  if (req.user?.role === "MOTORISTA" && (existing.status === "APROVADO" || existing.status === "QUITADO")) return res.status(403).json({ error: "Este relat\xF3rio j\xE1 foi aprovado/quitado e n\xE3o pode mais ser alterado pelo motorista." });
  const items = normalizeExpenseItems(updates.items, existing.items);
  const totalExpenses = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items.filter((it) => it.category === "ABASTECIMENTO" && it.liters).reduce((acc, it) => acc + (Number(it.liters) || 0), 0);
  const initialKm = updates.initialKm !== void 0 ? Math.max(0, Number(updates.initialKm) || 0) : existing.initialKm;
  const finalKm = updates.finalKm !== void 0 ? Math.max(0, Number(updates.finalKm) || 0) : existing.finalKm;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : updates.totalKm !== void 0 ? Math.max(0, Number(updates.totalKm) || 0) : existing.totalKm;
  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : existing.averageKmPerLiter;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : existing.costPerKm;
  const advanceAmount = updates.advanceAmount !== void 0 ? Math.max(0, Number(updates.advanceAmount) || 0) : existing.advanceAmount;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus = balanceAmount >= 0 ? "A_DEVOLVER" : "REEMBOLSO_A_RECEBER";
  const updatedReport = {
    id: existing.id,
    tenantId: existing.tenantId,
    freightId: existing.freightId,
    freightCode: existing.freightCode,
    driverId: existing.driverId,
    driverName: existing.driverName,
    driverPhone: existing.driverPhone,
    vehiclePlate: updates.vehiclePlate === void 0 ? existing.vehiclePlate : normalizeExpenseText(updates.vehiclePlate, 20),
    chassis: updates.chassis === void 0 ? existing.chassis : normalizeExpenseText(updates.chassis, 100),
    vehicleModel: updates.vehicleModel === void 0 ? existing.vehicleModel : normalizeExpenseText(updates.vehicleModel, 120),
    clientName: updates.clientName === void 0 ? existing.clientName : normalizeExpenseText(updates.clientName, 200),
    startDate: updates.startDate === void 0 ? existing.startDate : normalizeExpenseText(updates.startDate, 32),
    endDate: updates.endDate === void 0 ? existing.endDate : normalizeExpenseText(updates.endDate, 32),
    tripDays: updates.tripDays === void 0 ? existing.tripDays : Math.min(366, Math.max(1, Number(updates.tripDays) || 1)),
    initialKm,
    finalKm,
    totalKm,
    totalLiters,
    averageKmPerLiter,
    costPerKm,
    advanceAmount,
    driverLaborAmount: updates.driverLaborAmount === void 0 ? existing.driverLaborAmount : Math.max(0, Number(updates.driverLaborAmount) || 0),
    totalExpenses,
    balanceAmount,
    balanceStatus,
    status: requestedStatus,
    items,
    generalNotes: updates.generalNotes === void 0 ? existing.generalNotes : normalizeExpenseText(updates.generalNotes, 2e3),
    reviewerNotes: canApproveExpense && updates.reviewerNotes !== void 0 ? normalizeExpenseText(updates.reviewerNotes, 2e3) : existing.reviewerNotes,
    reviewedBy: existing.reviewedBy,
    reviewedAt: existing.reviewedAt,
    approvedAt: existing.approvedAt,
    createdAt: existing.createdAt,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    archivedAt: existing.archivedAt
  };
  if (requestedStatus === "APROVADO" && existing.status !== "APROVADO") {
    updatedReport.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    updatedReport.reviewedBy = req.user?.name || "Administrador";
    updatedReport.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  db.tripExpenses[index] = updatedReport;
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: updatedReport.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "ATUALIZACAO_PRESTACAO_CONTAS",
    entity: "TripExpenseReport",
    entityId: updatedReport.id,
    details: `Presta\xE7\xE3o de contas #${updatedReport.id.slice(0, 8)} atualizada (Status: ${updatedReport.status})`
  });
  res.json(updatedReport);
});
apiRouter.delete("/expenses/:id", (req, res) => {
  const index = (db.tripExpenses || []).findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Relat\xF3rio n\xE3o encontrado" });
  }
  const report = db.tripExpenses[index];
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const isCompanyAdmin = (req.user?.role === "ADMIN" || req.user?.role === "EMPRESA_SUPER_ADMIN") && (!report.tenantId || report.tenantId === req.user?.tenantId);
  const isDriverOwner = req.user?.role === "MOTORISTA" && (report.driverId === req.user?.id || report.driverId === req.user?.driverId) && (report.status === "RASCUNHO" || report.status === "ENVIADO");
  if (!isSuperAdmin && !isCompanyAdmin && !isDriverOwner) {
    return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para excluir este relat\xF3rio" });
  }
  report.archivedAt = (/* @__PURE__ */ new Date()).toISOString();
  report.updatedAt = report.archivedAt;
  db.addAuditLog({
    ip: requestIp(req),
    tenantId: report.tenantId,
    userId: req.user?.id || "system",
    userName: req.user?.name || "Sistema",
    userRole: req.user?.role || "ADMIN",
    action: "ARQUIVAR_PRESTACAO_CONTAS",
    entity: "TripExpenseReport",
    entityId: report.id,
    details: `Presta\xE7\xE3o de contas #${report.id} arquivada sem apagar recibos ou hist\xF3rico.`
  });
  db.persistNow();
  res.json({ success: true, message: "Relat\xF3rio arquivado; recibos e hist\xF3rico preservados." });
});
apiRouter.get("/help", (req, res) => {
  res.json(db.helpPages.map((page) => ({ ...page, content: sanitizeServerHtml(page.content) })));
});
apiRouter.post("/help", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Apenas Super Administradores podem editar a ajuda." });
  }
  const role = String(req.body?.role || "").trim().toUpperCase();
  const allowedRoles = /* @__PURE__ */ new Set(["ADMIN", "SUPERVISOR", "USER", "DRIVER"]);
  if (!allowedRoles.has(role)) return res.status(400).json({ error: "Perfil de ajuda inv\xE1lido." });
  const content = sanitizeServerHtml(String(req.body?.content || "").slice(0, 2e4));
  const index = db.helpPages.findIndex((h) => h.role === role);
  if (index !== -1) {
    db.helpPages[index].content = content;
  } else {
    db.helpPages.push({ role, content });
  }
  await db.persistNow();
  res.json({ success: true });
});
apiRouter.post("/integrations/email/test", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN" || isTestOrDemoUser(req.user)) {
    return res.status(403).json({ success: false, message: "Apenas o Super Administrador real pode realizar testes de conex\xE3o SMTP." });
  }
  const host = String(req.body?.host || "").trim();
  const port = Number(req.body?.port);
  const user = String(req.body?.user || "").trim();
  const incomingPassword = typeof req.body?.password === "string" ? req.body.password : "";
  const password = incomingPassword && incomingPassword !== "********" ? incomingPassword : String(db.saasGlobalConfig.emailConfig?.password || "");
  const senderEmail = String(req.body?.senderEmail || "").trim().slice(0, 254);
  const testEmail = String(req.body?.testEmail || "").trim().slice(0, 254);
  if (!host || !Number.isInteger(port) || ![25, 465, 587, 2525].includes(port) || !user || !senderEmail || !testEmail || isPrivateOrLocalHostname(host) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail)) {
    return res.status(400).json({ success: false, message: "Host, porta ou e-mails inv\xE1lidos para teste SMTP." });
  }
  try {
    const transporter = import_nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587 || port === 2525,
      connectionTimeout: 15e3,
      greetingTimeout: 15e3,
      socketTimeout: 2e4,
      auth: { user, pass: password }
    });
    await transporter.verify();
    await transporter.sendMail({
      from: senderEmail,
      to: testEmail,
      subject: "Teste de conex\xE3o SMTP",
      text: "A conex\xE3o SMTP foi configurada com sucesso.",
      html: "<p>A conex\xE3o SMTP foi configurada com sucesso.</p>"
    });
    res.json({ success: true, message: "E-mail de teste enviado com sucesso!" });
  } catch (err) {
    console.error("SMTP test failed", { code: err?.code || "UNKNOWN", name: err?.name || "Error" });
    const message = err?.code === "EAUTH" ? "O servidor SMTP recusou as credenciais." : err?.code === "ETIMEDOUT" || err?.code === "ESOCKET" ? "O servidor SMTP n\xE3o respondeu dentro do prazo." : "N\xE3o foi poss\xEDvel concluir o teste SMTP. Confira host, porta, TLS e remetente.";
    res.status(502).json({ success: false, message });
  }
});
var budgetActor = (req) => req.user && (req.user.role === "SUPER_ADMIN" || ["EMPRESA_SUPER_ADMIN", "ADMIN"].includes(req.user.role)) ? req.user : null;
var budgetTenantId = (req) => req.user?.role === "SUPER_ADMIN" ? String(req.body?.tenantId || req.query?.tenantId || "") : String(req.user?.tenantId || "");
var budgetForRequest = (req, id) => db.budgets.find((item) => item.id === id && (req.user?.role === "SUPER_ADMIN" || item.tenantId === req.user?.tenantId));
var validBudgetTransition = { RASCUNHO: ["EM_ANALISE", "CANCELADO"], EM_ANALISE: ["APROVADO", "REPROVADO", "CANCELADO"], APROVADO: ["CONVERTIDO", "CANCELADO"], REPROVADO: ["EM_ANALISE", "CANCELADO"], CANCELADO: [], CONVERTIDO: [] };
var clientTenantId = (req) => req.user?.role === "SUPER_ADMIN" ? String(req.body?.tenantId || req.query?.tenantId || "") : String(req.user?.tenantId || "");
var clientForRequest = (req, id) => db.clients.find((client) => client.id === id && (req.user?.role === "SUPER_ADMIN" || client.tenantId === req.user?.tenantId));
var clientCnpj = (value) => normalizePublicIdentity(value).slice(0, 14);
var clientLookupCache = /* @__PURE__ */ new Map();
var clientLookupRate = /* @__PURE__ */ new Map();
var CLIENT_LOOKUP_WINDOW_MS = 6e4;
var CLIENT_LOOKUP_LIMIT = 30;
var clientPayload = (body, tenantId, existing) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return { ...existing || { id: (0, import_crypto.randomUUID)(), createdAt: now }, tenantId, cnpj: clientCnpj(body?.cnpj), legalName: String(body?.legalName || body?.razaoSocial || "").trim().slice(0, 180), tradeName: String(body?.tradeName || body?.nomeFantasia || "").trim().slice(0, 180) || void 0, email: String(body?.email || "").trim().slice(0, 180) || void 0, phone: String(body?.phone || body?.telefone || "").trim().slice(0, 40) || void 0, address: String(body?.address || body?.logradouro || "").trim().slice(0, 240) || void 0, number: String(body?.number || body?.numero || "").trim().slice(0, 30) || void 0, complement: String(body?.complement || body?.complemento || "").trim().slice(0, 120) || void 0, neighborhood: String(body?.neighborhood || body?.bairro || "").trim().slice(0, 120) || void 0, zipCode: String(body?.zipCode || body?.cep || "").trim().slice(0, 20) || void 0, city: String(body?.city || body?.municipio || "").trim().slice(0, 120) || void 0, state: String(body?.state || body?.uf || "").trim().slice(0, 10) || void 0, status: String(body?.status || "ATIVO").slice(0, 30), source: body?.source === "CNPJ_WS" ? "CNPJ_WS" : "MANUAL", cnpjData: body?.cnpjData && typeof body.cnpjData === "object" ? body.cnpjData : existing?.cnpjData, updatedAt: now };
};
apiRouter.get("/clients/cnpj/:cnpj/lookup", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const cnpj = clientCnpj(req.params.cnpj);
  if (cnpj.length !== 14) return res.status(400).json({ error: "CNPJ inv\xE1lido." });
  const ip = requestIp(req) || "unknown";
  const nowMs = Date.now();
  const attempts = (clientLookupRate.get(ip) || []).filter((timestamp) => nowMs - timestamp < CLIENT_LOOKUP_WINDOW_MS);
  if (attempts.length >= CLIENT_LOOKUP_LIMIT) return res.status(429).json({ error: "Limite de consultas atingido. Tente novamente em alguns instantes." });
  attempts.push(nowMs);
  clientLookupRate.set(ip, attempts);
  const cached = clientLookupCache.get(cnpj);
  if (cached && cached.expiresAt > nowMs) return res.json({ cnpj, data: cached.data, cached: true });
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { headers: { Accept: "application/json", "X-Forwarded-For": ip, "X-Real-IP": ip }, signal: AbortSignal.timeout(1e4) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status === 404 ? 404 : 502).json({ error: data?.detalhes || data?.message || "N\xE3o foi poss\xEDvel consultar o CNPJ." });
    clientLookupCache.set(cnpj, { data, expiresAt: nowMs + 10 * 6e4 });
    db.auditLogs.unshift({ id: (0, import_crypto.randomUUID)(), tenantId: req.user?.tenantId, tenantName: req.tenant?.name, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: "CONSULTA_CNPJ", entity: "CLIENT", entityId: cnpj, details: `Consulta CNPJ realizada${ip !== "unknown" ? ` pelo IP ${ip}` : ""}`, ip, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    await db.persistNow();
    return res.json({ cnpj, data });
  } catch (error) {
    console.error("CNPJ lookup failed", error);
    return res.status(502).json({ error: "Servi\xE7o de CNPJ indispon\xEDvel no momento." });
  }
});
apiRouter.get("/clients", (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const tenantId = req.user?.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : String(req.user?.tenantId || "");
  const search = String(req.query.search || "").trim().toLowerCase();
  return res.json(db.clients.filter((client) => (!tenantId || client.tenantId === tenantId) && client.status !== "ARQUIVADO" && (!search || [client.cnpj, client.legalName, client.tradeName, client.email].some((value) => String(value || "").toLowerCase().includes(search)))));
});
apiRouter.post("/clients", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const tenantId = clientTenantId(req);
  const cnpj = clientCnpj(req.body?.cnpj);
  if (!tenantId || !db.tenants.some((tenant) => tenant.id === tenantId)) return res.status(400).json({ error: "Empresa inv\xE1lida." });
  if (cnpj.length !== 14 || !String(req.body?.legalName || req.body?.razaoSocial || "").trim()) return res.status(400).json({ error: "CNPJ e raz\xE3o social s\xE3o obrigat\xF3rios." });
  if (db.clients.some((client2) => client2.tenantId === tenantId && client2.cnpj === cnpj && client2.status !== "ARQUIVADO")) return res.status(409).json({ error: "Este CNPJ j\xE1 est\xE1 cadastrado." });
  const client = clientPayload(req.body, tenantId);
  db.clients.unshift(client);
  await db.persistNow();
  return res.status(201).json(client);
});
apiRouter.put("/clients/:id", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const client = clientForRequest(req, req.params.id);
  if (!client) return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  const next = clientPayload(req.body, client.tenantId, client);
  if (next.cnpj.length !== 14 || !next.legalName) return res.status(400).json({ error: "CNPJ e raz\xE3o social s\xE3o obrigat\xF3rios." });
  Object.assign(client, next);
  await db.persistNow();
  return res.json(client);
});
apiRouter.delete("/clients/:id", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const client = clientForRequest(req, req.params.id);
  if (!client) return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  client.status = "ARQUIVADO";
  client.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await db.persistNow();
  return res.json(client);
});
apiRouter.get("/budget-forms", (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const tenantId = req.user?.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : String(req.user?.tenantId || "");
  return res.json(db.tenantBudgetForms.filter((form) => !tenantId || form.tenantId === tenantId));
});
apiRouter.put("/budget-forms/:kind", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const tenantId = budgetTenantId(req);
  const kind = String(req.params.kind || "").toUpperCase();
  if (!tenantId || !["BUDGET", "EXPENSE"].includes(kind)) return res.status(400).json({ error: "Empresa ou tipo inv\xE1lido." });
  const fields = Array.isArray(req.body?.fields) ? req.body.fields.slice(0, 100).map((field, index) => ({ ...field, id: String(field.id || (0, import_crypto.randomUUID)()), key: String(field.key || `campo_${index + 1}`).slice(0, 80), label: String(field.label || "").slice(0, 160), order: index })) : [];
  const current = db.tenantBudgetForms.find((form) => form.tenantId === tenantId && form.kind === kind && form.active);
  const next = { id: (0, import_crypto.randomUUID)(), tenantId, kind, version: (current?.version || 0) + 1, fields, active: true, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  db.tenantBudgetForms.filter((form) => form.tenantId === tenantId && form.kind === kind).forEach((form) => {
    form.active = false;
  });
  db.tenantBudgetForms.unshift(next);
  await db.persistNow();
  return res.json(next);
});
apiRouter.get("/budgets", (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o para or\xE7amentos." });
  const tenantId = req.user?.role === "SUPER_ADMIN" ? String(req.query.tenantId || "") : req.user?.tenantId;
  res.json(db.budgets.filter((item) => !tenantId || item.tenantId === tenantId));
});
apiRouter.post("/budgets/calculate", (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o para calcular or\xE7amento." });
  const expenses = Array.isArray(req.body?.expenses) ? req.body.expenses.map((item, index) => normalizeExpense(item, index)) : [];
  res.json({ expenses, financials: calculateBudget({ ...req.body, expenses }) });
});
apiRouter.post("/budgets", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o para criar or\xE7amento." });
  const tenantId = budgetTenantId(req);
  if (!tenantId || !db.tenants.some((item) => item.id === tenantId)) return res.status(400).json({ error: "Empresa inv\xE1lida." });
  if (req.body?.clientId && !db.clients.some((client) => client.id === req.body.clientId && client.tenantId === tenantId && client.status !== "ARQUIVADO")) return res.status(400).json({ error: "Cliente inv\xE1lido para esta empresa." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const expenses = Array.isArray(req.body?.expenses) ? req.body.expenses.map((item, index) => normalizeExpense(item, index)) : [];
  const base = { id: (0, import_crypto.randomUUID)(), tenantId, code: `ORC-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(db.budgets.length + 1).padStart(4, "0")}`, status: "RASCUNHO", version: 1, clientId: req.body?.clientId || void 0, clientName: String(req.body?.clientName || "").trim().slice(0, 180), origin: req.body?.origin || {}, destination: req.body?.destination || {}, date: String(req.body?.date || ""), cargoType: String(req.body?.cargoType || ""), weightKg: Math.max(0, Number(req.body?.weightKg) || 0), quantity: Math.max(0, Number(req.body?.quantity) || 0), vehicleType: String(req.body?.vehicleType || ""), driverId: req.body?.driverId || void 0, distanceKm: Math.max(0, Number(req.body?.distanceKm) || 0), pricePerKm: Math.max(0, Number(req.body?.pricePerKm) || 0), priceTableReference: String(req.body?.priceTableReference || "").slice(0, 160), tolls: Math.max(0, Number(req.body?.tolls) || 0), insurance: Math.max(0, Number(req.body?.insurance) || 0), dailyRate: Math.max(0, Number(req.body?.dailyRate) || 0), dailyCount: Math.max(0, Number(req.body?.dailyCount) || 0), assistantCount: Math.max(0, Number(req.body?.assistantCount) || 0), assistantDailyRate: Math.max(0, Number(req.body?.assistantDailyRate) || 0), estimatedMinutes: Math.max(0, Number(req.body?.estimatedMinutes) || 0), notes: String(req.body?.notes || "").slice(0, 2e3), expenses, taxes: Array.isArray(req.body?.taxes) ? req.body.taxes : [], profitType: req.body?.profitType === "FIXO" ? "FIXO" : "PERCENTUAL", profitValue: Number(req.body?.profitValue) || 0, driverPassed: Number(req.body?.driverPassed) || 0, driverPaid: Number(req.body?.driverPaid) || 0, customFields: req.body?.customFields || {}, versions: [], createdAt: now, updatedAt: now };
  base.financials = calculateBudget(base);
  const version = { id: (0, import_crypto.randomUUID)(), budgetId: base.id, version: 1, snapshot: JSON.parse(JSON.stringify(base)), createdAt: now, createdByUserId: req.user.id };
  base.versions = [version];
  db.budgets.unshift(base);
  await db.persistNow();
  res.status(201).json(base);
});
apiRouter.get("/budgets/:id", (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const budget = budgetForRequest(req, req.params.id);
  return budget ? res.json(budget) : res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
});
apiRouter.put("/budgets/:id", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const budget = budgetForRequest(req, req.params.id);
  if (!budget) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
  if (budget.status === "CONVERTIDO") return res.status(409).json({ error: "Or\xE7amento convertido exige nova vers\xE3o." });
  const expectedVersion = req.body?.expectedVersion === void 0 ? void 0 : Number(req.body.expectedVersion);
  if (expectedVersion !== void 0 && (!Number.isInteger(expectedVersion) || expectedVersion !== budget.version)) return res.status(409).json({ error: "Este or\xE7amento foi alterado por outra sess\xE3o. Recarregue os dados antes de salvar.", currentVersion: budget.version });
  if (req.body?.clientId !== void 0 && !db.clients.some((client) => client.id === req.body.clientId && client.tenantId === budget.tenantId && client.status !== "ARQUIVADO")) return res.status(400).json({ error: "Cliente inv\xE1lido para esta empresa." });
  const allowed = ["clientId", "clientName", "origin", "destination", "date", "cargoType", "weightKg", "quantity", "vehicleType", "driverId", "distanceKm", "pricePerKm", "priceTableReference", "tolls", "insurance", "dailyRate", "dailyCount", "assistantCount", "assistantDailyRate", "estimatedMinutes", "notes", "taxes", "profitType", "profitValue", "driverPassed", "driverPaid", "customFields"];
  for (const key of allowed) if (req.body[key] !== void 0) budget[key] = req.body[key];
  if (Array.isArray(req.body.expenses)) budget.expenses = req.body.expenses.map((item, index) => normalizeExpense(item, index));
  budget.version += 1;
  budget.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  budget.financials = calculateBudget(budget);
  budget.versions.push({ id: (0, import_crypto.randomUUID)(), budgetId: budget.id, version: budget.version, snapshot: JSON.parse(JSON.stringify(budget)), createdAt: budget.updatedAt, createdByUserId: req.user.id });
  await db.persistNow();
  res.json(budget);
});
apiRouter.post("/budgets/:id/status", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const budget = budgetForRequest(req, req.params.id);
  if (!budget) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
  const status = String(req.body?.status || "");
  if (!validBudgetTransition[budget.status]?.includes(status)) return res.status(409).json({ error: `Transi\xE7\xE3o ${budget.status} \u2192 ${status} n\xE3o permitida.` });
  budget.status = status;
  budget.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await db.persistNow();
  res.json(budget);
});
apiRouter.post("/budgets/:id/duplicate", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const source = budgetForRequest(req, req.params.id);
  if (!source) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const copy = { ...JSON.parse(JSON.stringify(source)), id: (0, import_crypto.randomUUID)(), code: `ORC-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(db.budgets.length + 1).padStart(4, "0")}`, status: "RASCUNHO", version: 1, convertedFreightId: void 0, createdAt: now, updatedAt: now, versions: [] };
  copy.expenses = copy.expenses.map((item, index) => ({ ...item, id: (0, import_crypto.randomUUID)() }));
  copy.financials = calculateBudget(copy);
  copy.versions = [{ id: (0, import_crypto.randomUUID)(), budgetId: copy.id, version: 1, snapshot: JSON.parse(JSON.stringify(copy)), createdAt: now, createdByUserId: req.user.id }];
  db.budgets.unshift(copy);
  await db.persistNow();
  res.status(201).json(copy);
});
apiRouter.post("/budgets/:id/convert", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const budget = budgetForRequest(req, req.params.id);
  if (!budget) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
  if (budget.convertedFreightId) return res.json({ budget, freightId: budget.convertedFreightId, idempotent: true });
  if (budget.status !== "APROVADO") return res.status(409).json({ error: "Apenas or\xE7amento aprovado pode virar frete." });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const freight = { id: (0, import_crypto.randomUUID)(), code: `FRT-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(db.freights.length + 1).padStart(4, "0")}`, tenantId: budget.tenantId, tenantName: db.tenants.find((t) => t.id === budget.tenantId)?.name, origin: budget.origin, destination: budget.destination, distanceKm: budget.distanceKm, cargo: { description: budget.cargoType, type: "GERAL", weightKg: budget.weightKg, volumeCount: budget.quantity }, requirements: { vehicleType: budget.vehicleType || "TRUCK", minCapacityKg: budget.weightKg }, payment: { price: budget.financials.totalFreight, clientRevenue: budget.financials.totalFreight, driverCost: budget.financials.driverPaid, paymentMethod: "A_VISTA", tollIncluded: false }, status: "RASCUNHO", statusHistory: [], createdByUserId: req.user.id, createdByName: req.user.name, createdAt: now, updatedAt: now, customData: { budgetId: budget.id, budgetVersion: budget.version, budgetFinancials: budget.financials, budgetTaxes: budget.taxes, budgetExpenses: budget.expenses }, publicTrackingEnabled: false, publicTrackingToken: (0, import_crypto.randomBytes)(16).toString("hex") };
  db.freights.unshift(freight);
  budget.convertedFreightId = freight.id;
  budget.status = "CONVERTIDO";
  budget.updatedAt = now;
  await db.persistNow();
  res.status(201).json({ budget, freightId: freight.id, idempotent: false });
});
apiRouter.delete("/budgets/:id", async (req, res) => {
  if (!budgetActor(req)) return res.status(403).json({ error: "Sem permiss\xE3o." });
  const budget = budgetForRequest(req, req.params.id);
  if (!budget) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado." });
  if (budget.status === "CONVERTIDO") return res.status(409).json({ error: "Or\xE7amento convertido n\xE3o pode ser apagado." });
  budget.status = "CANCELADO";
  budget.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await db.persistNow();
  res.json(budget);
});

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const requireHttps = process.env.REQUIRE_HTTPS === "true" || process.env.NODE_ENV === "production" && String(process.env.APP_URL || "").startsWith("https://");
  app.use((req, res, next) => {
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
    const isHttps = forwardedProto === "https" || req.secure;
    if (requireHttps && !isHttps && req.path !== "/api/health") {
      const host = String(req.headers.host || "").split(",")[0].trim();
      if (!host) return res.status(400).json({ error: "Host inv\xE1lido." });
      return res.redirect(308, `https://${host}${req.originalUrl}`);
    }
    next();
  });
  const allowedOrigins = new Set(
    (process.env.CORS_ALLOWED_ORIGINS || process.env.APP_URL || "https://gestor.atendo.log.br").split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean)
  );
  app.use((req, res, next) => {
    const origin = String(req.headers.origin || "").replace(/\/$/, "");
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, asaas-access-token");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") return res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
    next();
  });
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), geolocation=(self), microphone=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'sha256-b7b03057e94fe25acc9a10366b6cc21263896dd2ad2eac92946794b1306f9f6e' https://off.atendo.log.br; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://off.atendo.log.br; worker-src 'self' blob:; form-action 'self'");
    const forwardedProto = String(res.req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    if (forwardedProto === "https" || res.req.secure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  const rateBuckets = /* @__PURE__ */ new Map();
  const rateWindowMs = 60 * 1e3;
  const authOperation = (path4) => path4.includes("/login") ? "login" : path4.includes("/request-otp") ? "otp-request" : path4.includes("/verify-otp") ? "otp-verify" : path4.includes("register") ? "register" : path4.includes("password") || path4.includes("recovery") ? "recovery" : "auth";
  const getRateKey = (req) => `${req.ip}:${req.path.startsWith("/api/auth/") ? authOperation(req.path) : req.path === "/api/webhooks/asaas" ? "webhook" : "api"}`;
  const rateLimit = (req, res, next) => {
    const now = Date.now();
    const key = getRateKey(req);
    const isAuth = key.includes(":login") || key.includes(":otp-") || key.includes(":register") || key.includes(":recovery") || key.endsWith(":auth");
    const isWebhook = key.endsWith(":webhook");
    const limit = isAuth ? 10 : isWebhook ? 180 : 240;
    const windowMs = isAuth ? 15 * 60 * 1e3 : rateWindowMs;
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) rateBuckets.set(key, { count: 1, resetAt: now + windowMs, failures: current?.failures || 0, blockedUntil: current?.blockedUntil || 0 });
    else current.count += 1;
    const bucket = rateBuckets.get(key);
    if (bucket.blockedUntil > now) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.blockedUntil - now) / 1e3)));
      return res.status(429).json({ error: "Acesso temporariamente bloqueado ap\xF3s tentativas consecutivas. Aguarde antes de tentar novamente." });
    }
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1e3)));
    if (bucket.count > limit) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1e3))));
      return res.status(429).json({ error: "Muitas requisi\xE7\xF5es. Aguarde antes de tentar novamente." });
    }
    res.once("finish", () => {
      if (!isAuth) return;
      if ([401, 403, 429].includes(res.statusCode)) {
        bucket.failures += 1;
        const backoffMinutes = Math.min(60, Math.max(1, 2 ** Math.min(bucket.failures - 1, 6)));
        bucket.blockedUntil = Date.now() + backoffMinutes * 60 * 1e3;
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        bucket.failures = 0;
        bucket.blockedUntil = 0;
      }
    });
    next();
  };
  const rateCleanup = setInterval(() => {
    const now = Date.now();
    rateBuckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) rateBuckets.delete(key);
    });
  }, 5 * 60 * 1e3);
  rateCleanup.unref();
  app.use(rateLimit);
  app.use(import_express2.default.json({ limit: "10mb" }));
  app.use("/api", async (req, res, next) => {
    try {
      await db.waitForPersistence();
      res.once("finish", () => {
        void db.persistNow();
      });
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use("/api", apiRouter);
  app.get("/api/health", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "ok",
      service: "Portal de Fretes e Motoristas SaaS API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api", (_req, res) => res.status(404).json({ error: "Rota n\xE3o encontrada." }));
  const cleanAnalyticsValue = (value, max = 120) => String(Array.isArray(value) ? value[0] || "" : value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
  const trackPublicVisit = (req) => {
    if (req.method !== "GET" || !(req.path === "/" || req.path === "/vitrine-fretes" || req.path.startsWith("/conteudo/") || req.path.startsWith("/elo-log/"))) return;
    const userAgent = cleanAnalyticsValue(req.headers["user-agent"], 300);
    if (/bot|crawler|spider|slurp|headless|facebookexternalhit|preview/i.test(userAgent)) return;
    const rawReferer = cleanAnalyticsValue(req.headers.referer, 500);
    let referrer = "";
    let referrerHost = "";
    try {
      if (rawReferer) {
        const parsed = new URL(rawReferer);
        referrerHost = parsed.hostname.toLowerCase();
        referrer = referrerHost.slice(0, 120);
      }
    } catch {
      referrer = "";
    }
    const utmSource = cleanAnalyticsValue(req.query.utm_source, 80).toLowerCase();
    const utmMedium = cleanAnalyticsValue(req.query.utm_medium, 80).toLowerCase();
    const utmCampaign = cleanAnalyticsValue(req.query.utm_campaign, 120);
    const source = utmSource || (referrerHost.includes("google.") ? "google" : referrerHost.includes("bing.") ? "bing" : referrerHost.includes("duckduckgo.") ? "duckduckgo" : referrer ? "referral" : "direct");
    const medium = utmMedium || (["google", "bing", "duckduckgo"].includes(source) ? "organic" : referrer ? "referral" : "direct");
    const device = /tablet|ipad/i.test(userAgent) ? "tablet" : /mobile|iphone|android/i.test(userAgent) ? "mobile" : "desktop";
    const countryHeader = Array.isArray(req.headers["cf-ipcountry"]) ? req.headers["cf-ipcountry"][0] : req.headers["cf-ipcountry"];
    db.recordVisit({
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      path: cleanAnalyticsValue(req.path, 180) || "/",
      source,
      medium,
      campaign: utmCampaign,
      referrer,
      device,
      country: cleanAnalyticsValue(countryHeader, 2).toUpperCase()
    });
  };
  app.use((req, _res, next) => {
    trackPublicVisit(req);
    next();
  });
  const distPath = import_path3.default.join(process.cwd(), "dist");
  const hasDist = import_fs3.default.existsSync(import_path3.default.join(distPath, "index.html"));
  if (process.env.NODE_ENV === "production" || hasDist) {
    console.log("\u{1F4E6} Serving production-bundled static files from /dist");
    app.use(import_express2.default.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        const isVersionedAsset = filePath.includes("/assets/") && /-[A-Za-z0-9_-]{6,}\.(?:js|css|map|png|jpe?g|webp|svg|woff2?)$/i.test(filePath);
        res.setHeader("Cache-Control", isVersionedAsset ? "public, max-age=31536000, immutable" : "public, max-age=3600");
      }
    }));
    const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
    const stripUnsafeMarkup = (value) => sanitizeServerHtml(value);
    const safeHttpsUrl = (value, fallback = "") => {
      const candidate = String(value || "").trim();
      if (!candidate) return fallback;
      try {
        const parsed = new URL(candidate);
        return parsed.protocol === "https:" ? parsed.toString().replace(/\/$/, "") : fallback;
      } catch {
        return fallback;
      }
    };
    const normalizeSeoBrand = (value, siteName) => String(value || "").replace(/Elo Log|Atendo One/gi, siteName).replace(/\s{2,}/g, " ").trim();
    const publicSeo = () => ({
      siteName: db.saasGlobalConfig.seo?.siteName || db.saasGlobalConfig.systemName || "Elo Log",
      title: db.saasGlobalConfig.seo?.title || `${db.saasGlobalConfig.systemName || "Elo Log"} \u2014 Gest\xE3o e publica\xE7\xE3o de fretes`,
      description: db.saasGlobalConfig.seo?.description || "Plataforma de gest\xE3o log\xEDstica para transportadoras, motoristas e opera\xE7\xF5es de fretes.",
      keywords: db.saasGlobalConfig.seo?.keywords || "",
      canonicalUrl: safeHttpsUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL, "https://gestor.atendo.log.br"),
      ogImageUrl: safeHttpsUrl(db.saasGlobalConfig.seo?.ogImageUrl, `${safeHttpsUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL, "https://gestor.atendo.log.br")}/og-default.svg`),
      locale: /^[a-z]{2}(?:_[A-Z]{2}|-[A-Z]{2})?$/.test(String(db.saasGlobalConfig.seo?.locale || "")) ? String(db.saasGlobalConfig.seo?.locale) : "pt_BR",
      allowIndexing: db.saasGlobalConfig.seo?.allowIndexing !== false
    });
    const registrationOnlyContentSlugs2 = /* @__PURE__ */ new Set(["termos-de-uso", "politica-de-privacidade"]);
    const isRegistrationOnlySlug2 = (value) => registrationOnlyContentSlugs2.has(String(value || "").trim().toLowerCase());
    const publicItems = () => [
      ...db.pages.filter((item) => item.tenantId === null && item.isPublished && item.isIndexable !== false && !isRegistrationOnlySlug2(item.slug)).map((item) => ({ ...item, kind: "page" })),
      ...db.posts.filter((item) => item.tenantId === null && item.isPublished && item.isIndexable !== false && !isRegistrationOnlySlug2(item.slug)).map((item) => ({ ...item, kind: "post" }))
    ];
    const publicItemBySlug = (slug) => publicItems().find((item) => item.slug === slug);
    const renderSeoHtml = (req) => {
      const seo = publicSeo();
      const isSolutionIndex = req.path === "/elo-log";
      const isContentIndex = req.path === "/conteudo";
      const publicSection = req.path.startsWith("/elo-log") ? "elo-log" : "conteudo";
      const slug = req.path.startsWith("/conteudo/") || req.path.startsWith("/elo-log/") ? decodeURIComponent(req.path.replace(/^\/(?:conteudo|elo-log)\//, "").split("/")[0]) : "";
      const item = slug ? publicItemBySlug(slug) : null;
      const isShowcase = req.path === "/vitrine-fretes";
      const routeMatchesItem = Boolean(item && (item.publicPath === publicSection || !item.publicPath && publicSection === "conteudo"));
      const isKnownPublicRoute = req.path === "/" || isShowcase || isSolutionIndex || isContentIndex || (req.path.startsWith("/conteudo/") || req.path.startsWith("/elo-log/")) && routeMatchesItem;
      const isNotFound = !isKnownPublicRoute;
      const title = isNotFound ? `P\xE1gina n\xE3o encontrada | ${seo.siteName}` : isSolutionIndex ? `Solu\xE7\xF5es para opera\xE7\xF5es log\xEDsticas | ${seo.siteName}` : isContentIndex ? `Conte\xFAdos sobre transporte e gest\xE3o de fretes | ${seo.siteName}` : isShowcase ? `Fretes de mercadorias dispon\xEDveis | ${seo.siteName}` : normalizeSeoBrand(item?.metaTitle || item?.title || seo.title, seo.siteName);
      const description = isNotFound ? "A p\xE1gina solicitada n\xE3o foi encontrada." : isSolutionIndex ? "Conhe\xE7a as solu\xE7\xF5es do Atendo One para gest\xE3o de fretes, transportadoras, motoristas, ve\xEDculos e viagens." : isContentIndex ? "Guias e conte\xFAdos pr\xE1ticos sobre TMS, fretes, motoristas, viagens, checklists e opera\xE7\xE3o log\xEDstica." : isShowcase ? "Encontre fretes de mercadorias publicados por empresas e cadastre-se para demonstrar interesse com seguran\xE7a." : item?.metaDescription || item?.excerpt || seo.description;
      const itemPath = item ? item.publicPath === "elo-log" ? "elo-log" : "conteudo" : publicSection;
      const itemCanonical = safeHttpsUrl(item?.canonicalUrl);
      const canonical = isNotFound ? `${seo.canonicalUrl}/404` : isSolutionIndex ? `${seo.canonicalUrl}/elo-log` : isContentIndex ? `${seo.canonicalUrl}/conteudo` : isShowcase ? `${seo.canonicalUrl}/vitrine-fretes` : itemCanonical || `${seo.canonicalUrl}${slug ? `/${itemPath}/${encodeURIComponent(slug)}` : "/"}`;
      const robots = isNotFound || !seo.allowIndexing || isRegistrationOnlySlug2(slug) || item && item.isIndexable === false ? "noindex,nofollow" : "index,follow";
      const contentHtml = item?.content ? stripUnsafeMarkup(item.content).replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "") : "";
      const organizationLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${seo.canonicalUrl}/#organization`,
        name: seo.siteName,
        url: `${seo.canonicalUrl}/`,
        description: seo.description
      };
      const websiteLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${seo.canonicalUrl}/#website`,
        name: seo.siteName,
        url: `${seo.canonicalUrl}/`,
        description: seo.description,
        inLanguage: "pt-BR",
        publisher: { "@id": `${seo.canonicalUrl}/#organization` },
        image: seo.ogImageUrl ? [seo.ogImageUrl] : void 0
      };
      const breadcrumbLd = item ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "In\xEDcio", item: `${seo.canonicalUrl}/` },
          { "@type": "ListItem", position: 2, name: item.publicPath === "elo-log" ? "Solu\xE7\xF5es" : "Conte\xFAdos", item: `${seo.canonicalUrl}/${item.publicPath === "elo-log" ? "elo-log" : "conteudo"}/${encodeURIComponent(item.slug)}` },
          { "@type": "ListItem", position: 3, name: item.title, item: canonical }
        ]
      } : void 0;
      const itemLd = item ? {
        "@context": "https://schema.org",
        "@type": item.kind === "post" ? "Article" : "WebPage",
        "@id": canonical,
        name: item.title,
        headline: item.title,
        description,
        url: canonical,
        inLanguage: "pt-BR",
        dateModified: item.updatedAt,
        ...item.publishedAt ? { datePublished: item.publishedAt } : {},
        image: seo.ogImageUrl ? [seo.ogImageUrl] : void 0,
        author: item.kind === "post" ? { "@type": "Person", name: item.author || seo.siteName } : { "@type": "Organization", name: seo.siteName },
        isPartOf: { "@id": `${seo.canonicalUrl}/#website` }
      } : void 0;
      const jsonLd = isNotFound ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: "pt-BR"
      } : item ? [itemLd, breadcrumbLd] : isSolutionIndex || isContentIndex ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${seo.canonicalUrl}/#website` }
      } : isShowcase ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${seo.canonicalUrl}/#website` }
      } : [websiteLd, organizationLd];
      const indexItems = publicItems().filter((entry) => isSolutionIndex ? entry.publicPath === "elo-log" : entry.publicPath !== "elo-log");
      const indexLinks = indexItems.map((entry) => `<li><a href="/${isSolutionIndex ? "elo-log" : "conteudo"}/${encodeURIComponent(entry.slug)}">${escapeHtml(entry.title)}</a></li>`).join("");
      const seoBody = isNotFound ? `<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="/">Voltar para a p\xE1gina inicial</a></p></main>` : item ? `<main><nav aria-label="Breadcrumb"><a href="/">In\xEDcio</a> \u203A <a href="/${item.publicPath === "elo-log" ? "elo-log" : "conteudo"}">${item.publicPath === "elo-log" ? "Solu\xE7\xF5es" : "Conte\xFAdos"}</a> \u203A <span aria-current="page">${escapeHtml(item.title)}</span></nav><article><h1>${escapeHtml(item.title)}</h1>${item.excerpt ? `<p>${escapeHtml(item.excerpt)}</p>` : ""}<div>${contentHtml}</div></article></main>` : isSolutionIndex || isContentIndex ? `<main><nav aria-label="Breadcrumb"><a href="/">In\xEDcio</a> \u203A <span aria-current="page">${isSolutionIndex ? "Solu\xE7\xF5es" : "Conte\xFAdos"}</span></nav><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${indexLinks}</ul></main>` : `<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${isShowcase ? "<p>Os valores s\xE3o liberados ap\xF3s cadastro e valida\xE7\xE3o do motorista pela empresa respons\xE1vel.</p>" : ""}<nav aria-label="Conte\xFAdos p\xFAblicos"><a href="/vitrine-fretes">Fretes de mercadorias dispon\xEDveis</a> \xB7 <a href="/conteudo">Conte\xFAdos para transportadoras</a> \xB7 <a href="/elo-log">Solu\xE7\xF5es Atendo One</a></nav></main>`;
      const baseHtml = import_fs3.default.readFileSync(import_path3.default.join(distPath, "index.html"), "utf8").replace(/<title>[\s\S]*?<\/title>/i, "").replace(/<meta[^>]+(?:name=["'](?:description|keywords|robots)["']|property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi, "").replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");
      const headTags = `<meta name="description" content="${escapeHtml(description)}"><meta name="keywords" content="${escapeHtml(item?.keywords || seo.keywords)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="${item?.kind === "post" ? "article" : "website"}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:locale" content="${escapeHtml(seo.locale)}"><meta property="og:image" content="${escapeHtml(seo.ogImageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(seo.ogImageUrl)}">${item?.kind === "post" && item.publishedAt ? `<meta property="article:published_time" content="${escapeHtml(item.publishedAt)}">` : ""}${item?.kind === "post" ? `<meta property="article:modified_time" content="${escapeHtml(item.updatedAt)}">` : ""}<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "<")}</script>`;
      const initialBody = req.path === "/" ? "" : seoBody;
      return baseHtml.replace('<div id="root"></div>', `<div id="root">${initialBody}</div>`).replace("</head>", `<title>${escapeHtml(title)}</title>${headTags}</head>`);
    };
    app.get("/robots.txt", (req, res) => {
      const seo = publicSeo();
      res.type("text/plain").send(`${seo.allowIndexing ? "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /painel/\n" : "User-agent: *\nDisallow: /\n"}Sitemap: ${seo.canonicalUrl}/sitemap.xml
`);
    });
    app.get("/sitemap.xml", (req, res) => {
      const seo = publicSeo();
      const toSitemapDate = (value) => {
        const parsed = new Date(String(value || ""));
        return Number.isNaN(parsed.getTime()) ? "" : `<lastmod>${parsed.toISOString()}</lastmod>`;
      };
      const entries = seo.allowIndexing ? [
        `<url><loc>${escapeHtml(`${seo.canonicalUrl}/`)}</loc></url>`,
        `<url><loc>${escapeHtml(`${seo.canonicalUrl}/vitrine-fretes`)}</loc></url>`,
        ...publicItems().map((item) => {
          const section = item.publicPath === "elo-log" ? "elo-log" : "conteudo";
          const itemPath = section === "elo-log" && item.slug === "elo-log" ? section : `${section}/${encodeURIComponent(item.slug)}`;
          return `<url><loc>${escapeHtml(`${seo.canonicalUrl}/${itemPath}`)}</loc>${toSitemapDate(item.updatedAt || item.publishedAt || item.createdAt)}</url>`;
        })
      ] : [];
      res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`);
    });
    app.get("*", (req, res) => {
      const normalizedPath = req.path.replace(/\/+$/, "") || "/";
      const publicPathMatch = normalizedPath.match(/^\/(conteudo|elo-log)\/([^/]+)$/);
      const publicItem = publicPathMatch ? publicItemBySlug(decodeURIComponent(publicPathMatch[2])) : null;
      const publicItemMatchesSection = Boolean(publicItem && (publicItem.publicPath === publicPathMatch?.[1] || !publicItem.publicPath && publicPathMatch?.[1] === "conteudo"));
      const isKnownPublic = normalizedPath === "/" || normalizedPath === "/vitrine-fretes" || normalizedPath === "/elo-log" || normalizedPath === "/conteudo" || publicItemMatchesSection;
      res.status(isKnownPublic ? 200 : 404).type("html").send(renderSeoHtml(req));
    });
  } else {
    console.log("\u26A1 Starting Vite development server middleware");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.use((error, req, res, next) => {
    const correlationId = String(req.headers["x-request-id"] || `corr-${Date.now()}-${(0, import_node_crypto2.randomUUID)().slice(0, 8)}`);
    db.addErrorLog({
      correlationId,
      service: "elolog-app",
      route: req.path,
      method: req.method,
      statusCode: Number(error?.status || 500),
      event: "EXPRESS_UNHANDLED_ERROR",
      message: "Erro interno n\xE3o tratado na aplica\xE7\xE3o."
    });
    if (res.headersSent) return next(error);
    res.status(Number(error?.status || 500)).json({ error: "Ocorreu um erro interno. Consulte o suporte com o identificador de atendimento.", correlationId });
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F69A} Portal de Fretes SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
