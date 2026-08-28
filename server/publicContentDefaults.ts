import { BlogPost, WebPage } from '../src/types';

export const publicSeoPages = (now: string): WebPage[] => [
  {
    id: 'page-seo-gestao-de-fretes',
    tenantId: null,
    slug: 'gestao-de-fretes-para-transportadoras',
    title: 'Gestão de fretes para transportadoras: guia prático',
    excerpt: 'Entenda como organizar a publicação, a negociação e o acompanhamento de fretes em uma operação de transporte.',
    metaTitle: 'Gestão de Fretes para Transportadoras | Atendo One',
    metaDescription: 'Veja como uma gestão de fretes organizada ajuda transportadoras a centralizar oportunidades, motoristas, documentos e acompanhamento operacional.',
    content: '<p>A gestão de fretes reúne as etapas que começam na identificação de uma demanda de transporte e terminam no acompanhamento da entrega. Para uma transportadora, organizar esse fluxo significa registrar informações, distribuir oportunidades com clareza e manter a operação visível para as pessoas certas.</p><h2>O que uma gestão de fretes precisa organizar</h2><p>Uma rotina bem estruturada normalmente concentra dados de origem e destino, tipo de carga, veículo necessário, prazo, condições comerciais, responsável pelo acompanhamento e status da viagem. O objetivo não é apenas armazenar dados, mas reduzir retrabalho e facilitar decisões durante a operação.</p><h2>Como digitalizar o fluxo de publicação</h2><p>O primeiro passo é padronizar o cadastro do frete. Em seguida, a empresa pode publicar a oportunidade para os motoristas habilitados, registrar o aceite e acompanhar as mudanças de status em um único ambiente. Esse processo cria um histórico útil para suporte, auditoria e melhoria contínua.</p><h2>Benefícios para transportadoras</h2><ul><li>Mais clareza sobre fretes disponíveis, reservados e em andamento.</li><li>Menos dependência de mensagens dispersas e planilhas paralelas.</li><li>Histórico operacional para identificar pendências e ocorrências.</li><li>Comunicação mais organizada entre empresa, usuário e motorista.</li></ul><h2>Por onde começar</h2><p>Comece mapeando as etapas que já existem na sua operação e defina quais informações precisam ser obrigatórias em cada etapa. Depois, escolha uma plataforma que permita controlar permissões, registrar alterações e manter os dados separados por empresa.</p><p>Conheça também o <a href="/conteudo/sistema-de-gestao-de-transportes-tms">sistema de gestão de transportes (TMS)</a> e veja <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">como publicar fretes e conectar transportadoras a motoristas</a>.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'page-seo-tms',
    tenantId: null,
    slug: 'sistema-de-gestao-de-transportes-tms',
    title: 'Sistema de gestão de transportes (TMS): recursos essenciais',
    excerpt: 'Saiba quais recursos avaliar ao escolher um sistema para organizar fretes, frotas, usuários e acompanhamento de viagens.',
    metaTitle: 'Sistema de Gestão de Transportes TMS | Atendo One',
    metaDescription: 'Conheça os recursos essenciais de um TMS para transportadoras: fretes, usuários, motoristas, checklists, rastreamento e auditoria.',
    content: '<p>Um sistema de gestão de transportes, conhecido como TMS, ajuda a estruturar informações e rotinas de uma operação logística. A ferramenta ideal deve acompanhar o processo real da empresa e oferecer visibilidade sem criar etapas desnecessárias.</p><h2>Recursos essenciais de um TMS</h2><h3>Cadastro e publicação de fretes</h3><p>O sistema deve permitir registrar os detalhes do frete, controlar o ciclo de vida e disponibilizar a oportunidade aos usuários autorizados. A publicação precisa ser clara para reduzir dúvidas e acelerar a tomada de decisão.</p><h3>Gestão de empresas, usuários e motoristas</h3><p>Em operações com diferentes equipes, é importante separar os dados por empresa e definir permissões por função. Assim, cada pessoa visualiza e executa somente as tarefas que correspondem ao seu papel.</p><h3>Checklists e registros da viagem</h3><p>Checklists digitais ajudam a documentar conferências antes, durante e depois do transporte. Quando os registros ficam associados à viagem, a empresa consegue consultar o histórico com mais facilidade.</p><h3>Rastreamento e comunicação</h3><p>Recursos de localização, atualização de status e notificações ajudam a manter os envolvidos informados. A plataforma deve permitir configurar os canais disponíveis e preservar um histórico das comunicações relevantes.</p><h3>Auditoria e relatórios</h3><p>Relatórios e trilhas de auditoria apoiam o acompanhamento da operação e a investigação de divergências. É recomendável verificar se os documentos gerados exibem os dados corretos da empresa e do frete.</p><h2>Como avaliar uma plataforma</h2><p>Antes de escolher um TMS, avalie a facilidade de cadastro, a segurança das permissões, a capacidade de integração, a qualidade do suporte e a forma como os dados são preservados durante atualizações.</p><p>Veja também o guia de <a href="/conteudo/gestao-de-fretes-para-transportadoras">gestão de fretes para transportadoras</a> e as práticas para um <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist de viagem digital</a>.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'page-seo-publicacao-fretes',
    tenantId: null,
    slug: 'publicacao-de-fretes-e-conexao-com-motoristas',
    title: 'Como publicar fretes e conectar transportadoras a motoristas',
    excerpt: 'Um passo a passo para estruturar a publicação de oportunidades de transporte e facilitar o aceite pelo motorista.',
    metaTitle: 'Como Publicar Fretes e Encontrar Motoristas | Atendo One',
    metaDescription: 'Aprenda a organizar a publicação de fretes, informar as condições da viagem e acompanhar o aceite de motoristas em uma plataforma logística.',
    content: '<p>Publicar um frete com informações completas facilita a análise do motorista e diminui a necessidade de mensagens complementares. A qualidade do cadastro é uma parte importante da eficiência de uma operação de transporte.</p><h2>1. Reúna as informações do frete</h2><p>Registre origem, destino, datas, tipo de carga, veículo necessário, observações e condições comerciais. Quando uma informação ainda não estiver definida, sinalize a pendência em vez de preencher o campo com uma suposição.</p><h2>2. Defina quem pode visualizar</h2><p>Em uma operação multiempresa, a visibilidade deve respeitar as permissões e o vínculo do usuário. A separação por empresa reduz o risco de compartilhar dados operacionais com pessoas que não participam daquela viagem.</p><h2>3. Publique e acompanhe o aceite</h2><p>Depois da conferência, publique o frete e acompanhe as respostas. O registro do aceite deve ficar associado à oportunidade para que a empresa saiba quem assumiu a etapa seguinte.</p><h2>4. Atualize o status da viagem</h2><p>Use status padronizados para informar se o frete está disponível, reservado, em coleta, em trânsito ou concluído. A atualização consistente melhora a comunicação entre o time operacional e o motorista.</p><h2>5. Mantenha o histórico</h2><p>Guarde alterações, ocorrências, documentos e comprovantes relacionados ao frete. O histórico ajuda a resolver dúvidas e a revisar o processo depois da entrega.</p><p>Para ampliar a organização, consulte o conteúdo sobre <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">rastreamento e visibilidade operacional</a> e os <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores logísticos</a> que podem ser acompanhados.</p>',
    isPublished: true,
    isIndexable: true,
    createdAt: now,
    updatedAt: now
  }
];

export const publicSeoPosts = (now: string): BlogPost[] => [
  {
    id: 'post-seo-checklist-viagem',
    tenantId: null,
    slug: 'checklist-de-viagem-para-transportadoras',
    title: 'Checklist de viagem: como digitalizar a conferência do frete',
    excerpt: 'Veja como estruturar um checklist de viagem para registrar conferências, evidências e ocorrências com mais consistência.',
    author: 'Atendo One',
    metaTitle: 'Checklist de Viagem para Transportadoras | Atendo One',
    metaDescription: 'Aprenda a montar um checklist de viagem digital para transportadoras, motoristas e equipes que precisam registrar conferências da operação.',
    content: '<p>O checklist de viagem transforma uma conferência informal em um registro que pode ser consultado pela empresa e pelo motorista. Ele deve ser objetivo, estar relacionado à etapa correta da viagem e permitir o registro de observações quando houver uma divergência.</p><h2>O que incluir no checklist</h2><ul><li>Identificação do veículo e do motorista.</li><li>Condições aparentes do veículo e dos equipamentos necessários.</li><li>Conferência de documentos e informações da carga.</li><li>Registro de fotos ou evidências quando aplicável.</li><li>Observações, ocorrências e responsável pela conferência.</li></ul><h2>Como evitar checklists difíceis de usar</h2><p>Separe itens obrigatórios de itens complementares, use descrições simples e organize as perguntas na ordem em que a conferência acontece. Um formulário muito extenso pode reduzir a qualidade das respostas e aumentar o tempo de preenchimento.</p><h2>Por que associar o checklist ao frete</h2><p>Quando a conferência fica vinculada ao frete, o histórico da operação passa a reunir dados de identificação, status e evidências em um mesmo contexto. Isso facilita o suporte e a análise posterior.</p><p>O checklist é apenas uma parte do processo. Combine-o com <a href="/conteudo/gestao-de-fretes-para-transportadoras">gestão de fretes</a> e <a href="/conteudo/rastreamento-de-fretes-e-visibilidade-operacional">visibilidade da viagem</a>.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post-seo-rastreamento-fretes',
    tenantId: null,
    slug: 'rastreamento-de-fretes-e-visibilidade-operacional',
    title: 'Rastreamento de fretes: como melhorar a visibilidade da operação',
    excerpt: 'Entenda como atualizações de localização e status ajudam a equipe a acompanhar a viagem e agir diante de ocorrências.',
    author: 'Atendo One',
    metaTitle: 'Rastreamento de Fretes e Visibilidade Operacional | Atendo One',
    metaDescription: 'Descubra como organizar rastreamento, status e comunicação para acompanhar fretes e dar mais visibilidade à operação logística.',
    content: '<p>Rastreamento de fretes não é apenas visualizar uma posição no mapa. É combinar localização, status, responsáveis e ocorrências para que a equipe compreenda o momento da viagem e saiba quando uma ação é necessária.</p><h2>Quais informações formam uma boa visibilidade</h2><p>Uma visão operacional útil reúne identificação do frete, origem e destino, motorista responsável, última atualização, etapa atual e observações. O nível de detalhe deve ser compatível com a operação e com as permissões de cada usuário.</p><h2>Como usar status padronizados</h2><p>Status como disponível, reservado, em coleta, em trânsito e entregue criam uma linguagem comum. A equipe consegue filtrar prioridades e comunicar o andamento sem depender de interpretações diferentes.</p><h2>O que fazer quando há uma ocorrência</h2><p>Registre o fato, a data, o responsável e a providência tomada. Evite apagar o histórico para substituir uma informação; prefira registrar a atualização de forma rastreável.</p><h2>Rastreamento com privacidade e segurança</h2><p>Dados de localização e contato devem ser acessíveis somente a pessoas autorizadas. A empresa precisa definir finalidades, permissões e períodos de retenção compatíveis com o serviço e com suas obrigações.</p><p>Para estruturar a operação, consulte também o guia de <a href="/conteudo/sistema-de-gestao-de-transportes-tms">TMS</a> e os <a href="/conteudo/indicadores-de-desempenho-na-logistica">indicadores de desempenho logístico</a>.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post-seo-indicadores-logistica',
    tenantId: null,
    slug: 'indicadores-de-desempenho-na-logistica',
    title: 'Indicadores logísticos: 7 métricas para acompanhar o transporte',
    excerpt: 'Conheça métricas que ajudam a transportadora a acompanhar prazos, ocorrências, utilização e qualidade dos registros.',
    author: 'Atendo One',
    metaTitle: '7 Indicadores de Desempenho Logístico | Atendo One',
    metaDescription: 'Conheça sete indicadores logísticos para acompanhar fretes, prazos, ocorrências, utilização da frota e qualidade da operação.',
    content: '<p>Indicadores logísticos ajudam a transformar registros da operação em perguntas objetivas para a gestão. A escolha das métricas deve considerar o tipo de transporte, o perfil dos clientes e a capacidade da equipe de agir sobre os resultados.</p><h2>Sete métricas úteis</h2><ol><li><strong>Entregas no prazo:</strong> compara a data combinada com a conclusão registrada.</li><li><strong>Tempo de ciclo do frete:</strong> observa o intervalo entre a publicação e o encerramento.</li><li><strong>Tempo até o aceite:</strong> mostra quanto tempo uma oportunidade leva para ser assumida.</li><li><strong>Ocorrências por viagem:</strong> ajuda a identificar padrões de falha ou risco.</li><li><strong>Fretes por veículo:</strong> apoia a análise de utilização da frota.</li><li><strong>Completude dos registros:</strong> acompanha se os campos e documentos essenciais foram preenchidos.</li><li><strong>Tempo de resposta operacional:</strong> mede a agilidade para tratar dúvidas e ocorrências.</li></ol><h2>Como transformar métrica em melhoria</h2><p>Defina uma periodicidade de acompanhamento, escolha responsáveis e registre as ações tomadas. Uma métrica só gera valor quando ajuda a decidir o que deve ser mantido, corrigido ou investigado.</p><p>Uma base confiável depende de dados consistentes. Veja como <a href="/conteudo/publicacao-de-fretes-e-conexao-com-motoristas">publicar fretes com clareza</a> e como usar um <a href="/conteudo/checklist-de-viagem-para-transportadoras">checklist digital</a> para melhorar os registros.</p>',
    isPublished: true,
    isIndexable: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  }
];
