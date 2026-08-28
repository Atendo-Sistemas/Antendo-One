import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { 
  Tenant, 
  User, 
  Driver, 
  Vehicle, 
  Freight, 
  FreightStatus, 
  AppNotification, 
  FormDefinition, 
  FormResponse, 
  AuditLog,
  ErrorLogEntry,
  UserRole,
  WhatsAppConfig,
  SaaSGlobalConfig,
  PlanConfig,
  TripExpenseReport,
  WebPage,
  BlogPost,
  VisitAnalyticsBucket,
  DriverCompanyLink,
  FreightInterest,
  CompanyVehicle,
  NotificationDelivery,
  NotificationTemplate,
  LegalDocumentVersion,
  ReportTemplateType,
  TenantReportTemplate
} from '../src/types';
import { defaultNotificationTemplates } from './notificationDefaults';
import { publicSeoPages, publicSeoPosts } from './publicContentDefaults';
import { publicCommercialPages } from './publicCommercialDefaults';
import { sqlAdapter } from './db/sqlAdapter';

const WHATSAPP_SECRET_ID = 'whatsapp-global';
const WHATSAPP_TENANT_SECRET_PREFIX = 'whatsapp-tenant:';
const EMAIL_SECRET_ID = 'smtp-global';
const ASAAS_SECRET_ID = 'asaas-global';
const ATENDO_CRM_ADMIN_SECRET_ID = 'atendo-crm-admin';
export const PUBLIC_DEMO_TENANT_ID = 'tenant-demo-public';
export const PUBLIC_DEMO_PRIMARY_USER_ID = 'user-demo-company-admin';

export const defaultTenantReportTemplates: TenantReportTemplate[] = [
  {
    type: 'EXPENSE',
    title: 'Prestação de Contas & Despesas de Viagem',
    subtitle: 'Relatório operacional e financeiro da viagem',
    approvalLabel: 'Aprovação e Quitação de Saldo',
    signatureLabel: 'Responsável pela empresa',
    notes: '',
    source: 'DEFAULT'
  },
  {
    type: 'CHECKLIST',
    title: 'Laudo de Vistoria e Checklist Digital',
    subtitle: 'Registro de retirada e entrega do veículo e da carga',
    approvalLabel: 'Conferência e aprovação da empresa',
    signatureLabel: 'Responsável pela empresa',
    notes: '',
    source: 'DEFAULT'
  }
];

const cloneReportTemplate = (template: TenantReportTemplate): TenantReportTemplate => ({ ...template });

function getConfigEncryptionKey(): Buffer | null {
  let raw = process.env.CONFIG_ENCRYPTION_KEY || '';
  const keyFile = process.env.CONFIG_ENCRYPTION_KEY_FILE || '/run/secrets/elolog_config_encryption_key';
  if (!raw) {
    try {
      raw = readFileSync(keyFile, 'utf8').trim();
    } catch {
      raw = '';
    }
  }
  if (!raw) return null;
  return /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : createHash('sha256').update(raw, 'utf8').digest();
}

function encryptConfigSecret(value: object): string {
  const key = getConfigEncryptionKey();
  if (!key) throw new Error('Chave interna de criptografia não configurada.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64')).join('.');
}

function decryptConfigSecret(ciphertext: string): any | null {
  try {
    const key = getConfigEncryptionKey();
    if (!key) return null;
    const [ivEncoded, tagEncoded, encryptedEncoded] = ciphertext.split('.');
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivEncoded, 'base64'));
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64')),
      decipher.final()
    ]).toString('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// In-Memory Multi-Tenant Store with realistic seed data
class DatabaseStore {
  tenants: Tenant[] = [];
  users: User[] = [];
  drivers: Driver[] = [];
  vehicles: Vehicle[] = [];
  freights: Freight[] = [];
  tripExpenses: TripExpenseReport[] = [];
  notifications: AppNotification[] = [];
  notificationDeliveries: NotificationDelivery[] = [];
  pushSubscriptions: any[] = [];
  forms: FormDefinition[] = [];
  formResponses: FormResponse[] = [];
  auditLogs: AuditLog[] = [];
  errorLogs: ErrorLogEntry[] = [];
  visitAnalytics: VisitAnalyticsBucket[] = [];
  driverCompanyLinks: DriverCompanyLink[] = [];
  freightInterests: FreightInterest[] = [];
  companyVehicles: CompanyVehicle[] = [];
  pages: WebPage[] = [];
  posts: BlogPost[] = [];
  asaasPayments: any[] = [];
  asaasSubscriptions: any[] = [];
  helpPages: { role: string; content: string }[] = [
    { role: 'ADMIN', content: '' },
    { role: 'SUPERVISOR', content: '' },
    { role: 'USER', content: '' },
    { role: 'DRIVER', content: '' }
  ];
  whatsappConfigs: Map<string, WhatsAppConfig> = new Map();
  tenantNotificationTemplates: Map<string, NotificationTemplate[]> = new Map();
  tenantReportTemplates: Map<string, TenantReportTemplate[]> = new Map();
  globalWhatsAppConfig: WhatsAppConfig = {
    baseUrl: process.env.WHATSAPP_API_URL || '',
    token: process.env.WHATSAPP_API_TOKEN || '',
    provider: 'WHAZING',
    defaultChannelNumber: '',
    isActive: true,
    connectionStatus: 'UNKNOWN',
    autoNotifyChecklist: true,
    autoNotifyFreightStatus: true
  };
  atendoCrmAdminConfig: { baseUrl: string; apiId: string; bearerToken: string } = {
    baseUrl: '',
    apiId: '',
    bearerToken: ''
  };
  saasGlobalConfig: SaaSGlobalConfig = {
    systemName: 'Atendo One',
    supportPhone: '',
    supportEmail: 'contato@elolog.com.br',
    defaultCommissionPercent: 12,
    requireChecklistPhotos: true,
    minDriverAge: 18,
    otpExpirationMinutes: 5,
    allowSelfRegistration: true,
    showDemoSwitcher: false,
    plans: [
      { id: 'BASICO', name: 'Plano Básico', price: 299, maxFreightsMonthly: 50, maxUsers: 3, maxDrivers: 5, isActive: true },
      { id: 'PROFISSIONAL', name: 'Plano Profissional', price: 599, maxFreightsMonthly: 150, maxUsers: 10, maxDrivers: 30, isActive: true },
      { id: 'EMPRESARIAL', name: 'Plano Empresarial', price: 1499, maxFreightsMonthly: 9999, maxUsers: 50, maxDrivers: 200, isActive: true }
    ],
    notificationModule: {
      enabled: true,
      freePlanName: 'WhatsApp SaaS — Gratuito',
      freePlanDescription: 'Notificações usando o telefone oficial da plataforma.',
      ownNumberPlanName: 'WhatsApp Próprio da Empresa',
      ownNumberPlanDescription: 'Notificações usando o número e canal WhatsApp da empresa.',
      ownNumberMonthlyPrice: 89.90,
      assistedActivationPrice: 149.90,
      extraNumberMonthlyPrice: 29.90
    },
    backupNotifications: {
      enabled: true,
      whatsappEnabled: false,
      whatsappPhone: '',
      notifyOnFailure: true,
      notifyOnSuccess: false
    },
    layout: {
      primaryColor: '#059669',
      borderRadius: 'xl',
      fontFamily: 'sans',
      navbarStyle: 'dark',
      logoText: 'ELO LOG',
      systemBackground: 'slate'
    },
    formFields: {
      userForm: [
        { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Digite o nome completo', enabled: true, required: true },
        { id: 'email', originalLabel: 'E-mail Corporativo', label: 'E-mail Corporativo', placeholder: 'Digite o e-mail corporativo', enabled: true, required: true },
        { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(99) 99999-9999', enabled: true, required: true },
        { id: 'role', originalLabel: 'Nível de Permissão', label: 'Nível de Permissão', placeholder: 'Selecione a permissão', enabled: true, required: true }
      ],
      freightForm: [
        { id: 'cargoDescription', originalLabel: 'Descrição da Carga', label: 'Descrição da Carga', placeholder: 'Ex: Carga de milho ensacado', enabled: true, required: true },
        { id: 'cargoType', originalLabel: 'Tipo de Carga', label: 'Tipo de Carga', placeholder: 'Selecione o tipo', enabled: true, required: true },
        { id: 'weight', originalLabel: 'Peso Total (Kg)', label: 'Peso Total (Kg)', placeholder: 'Ex: 15000', enabled: true, required: true },
        { id: 'volumes', originalLabel: 'Volumes', label: 'Volumes', placeholder: 'Ex: 30', enabled: true, required: true },
        { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: 'Selecione o veículo', enabled: true, required: true },
        { id: 'bodyType', originalLabel: 'Carroceria', label: 'Carroceria', placeholder: 'Selecione a carroceria', enabled: true, required: true },
        { id: 'brand', originalLabel: 'Marca do Veículo', label: 'Marca do Veículo', placeholder: 'Marca recomendada', enabled: true, required: true },
        { id: 'value', originalLabel: 'Valor do Frete (R$)', label: 'Valor do Frete (R$)', placeholder: '0.00', enabled: true, required: true },
        { id: 'paymentMethod', originalLabel: 'Forma de Pagamento', label: 'Forma de Pagamento', placeholder: 'Ex: Pix, Transferência', enabled: true, required: true },
        { id: 'originCity', originalLabel: 'Cidade Origem', label: 'Cidade Origem', placeholder: 'Cidade de coleta', enabled: true, required: true },
        { id: 'originState', originalLabel: 'UF Origem', label: 'UF Origem', placeholder: 'UF', enabled: true, required: true },
        { id: 'originAddress', originalLabel: 'Endereço Origem', label: 'Endereço Origem', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true },
        { id: 'originNumber', originalLabel: 'Número Origem', label: 'Número Origem', placeholder: 'Número', enabled: true, required: true },
        { id: 'destCity', originalLabel: 'Cidade Destino', label: 'Cidade Destino', placeholder: 'Cidade de entrega', enabled: true, required: true },
        { id: 'destState', originalLabel: 'UF Destino', label: 'UF Destino', placeholder: 'UF', enabled: true, required: true },
        { id: 'destAddress', originalLabel: 'Endereço Destino', label: 'Endereço Destino', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true },
        { id: 'destNumber', originalLabel: 'Número Destino', label: 'Número Destino', placeholder: 'Número', enabled: true, required: true }
      ],
      driverForm: [
        { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Nome completo do motorista', enabled: true, required: true },
        { id: 'email', originalLabel: 'E-mail', label: 'E-mail', placeholder: 'email@provedor.com', enabled: true, required: true },
        { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(99) 99999-9999', enabled: true, required: true },
        { id: 'cpf', originalLabel: 'CPF', label: 'CPF', placeholder: '000.000.000-00', enabled: true, required: true },
        { id: 'rg', originalLabel: 'RG', label: 'RG', placeholder: 'RG do motorista', enabled: true, required: true },
        { id: 'city', originalLabel: 'Cidade', label: 'Cidade', placeholder: 'Cidade', enabled: true, required: true },
        { id: 'state', originalLabel: 'Estado (UF)', label: 'Estado (UF)', placeholder: 'UF', enabled: true, required: true },
        { id: 'cnh', originalLabel: 'Nº CNH', label: 'Nº CNH', placeholder: 'Número da habilitação', enabled: true, required: true },
        { id: 'cnhCategory', originalLabel: 'Categoria CNH', label: 'Categoria CNH', placeholder: 'Selecione a categoria', enabled: true, required: true },
        { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: 'Tipo do caminhão', enabled: true, required: true },
        { id: 'vehicleModel', originalLabel: 'Marca / Modelo', label: 'Marca / Modelo', placeholder: 'Ex: Volvo FH 540', enabled: true, required: true },
        { id: 'vehiclePlate', originalLabel: 'Placa', label: 'Placa', placeholder: 'Placa do veículo', enabled: true, required: true }
      ],
      expenseForm: [
        { id: 'driverName', originalLabel: 'Nome do Motorista', label: 'Nome do Motorista', placeholder: 'Nome...', enabled: true, required: true },
        { id: 'clientName', originalLabel: 'Cliente', label: 'Cliente', placeholder: 'Nome do Cliente...', enabled: true, required: true },
        { id: 'vehicleModel', originalLabel: 'Modelo do Veículo', label: 'Modelo do Veículo', placeholder: 'Ex: FH 540', enabled: true, required: true },
        { id: 'vehiclePlate', originalLabel: 'Placa do Caminhão / Veículo', label: 'Placa do Caminhão / Veículo', placeholder: 'ABC-1234', enabled: true, required: true },
        { id: 'chassis', originalLabel: 'Placa / Chassis', label: 'Placa / Chassis', placeholder: 'Nº Chassis', enabled: true, required: true },
        { id: 'startDate', originalLabel: 'Data de Início da Viagem', label: 'Data de Início da Viagem', placeholder: '', enabled: true, required: true },
        { id: 'endDate', originalLabel: 'Data de Término da Viagem', label: 'Data de Término da Viagem', placeholder: '', enabled: true, required: true },
        { id: 'initialKm', originalLabel: 'Km Inicial', label: 'Km Inicial', placeholder: '0', enabled: true, required: true },
        { id: 'finalKm', originalLabel: 'Km Final', label: 'Km Final', placeholder: '0', enabled: true, required: true },
        { id: 'advanceAmount', originalLabel: 'Adiantamento Pago pela Empresa (R$)', label: 'Adiantamento Pago pela Empresa (R$)', placeholder: '0.00', enabled: true, required: true },
        { id: 'driverLaborAmount', originalLabel: 'Mão de Obra Motorista (R$)', label: 'Mão de Obra Motorista (R$)', placeholder: '0.00', enabled: true, required: true }
      ]
    },
    databaseConfig: {
      enabled: true,
      dbType: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'elolog',
      username: process.env.DB_USER || 'elolog_user',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true',
      autoMigrate: true,
      connectionStatus: 'UNCONFIGURED'
    },
    imageCompression: {
      enabled: true,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
      format: 'image/jpeg',
      autoCompressDocuments: true,
      maxFileSizeKB: 400
    },
    mapboxConfig: {
      enabled: false,
      apiKey: process.env.MAPBOX_API_KEY || '',
      defaultZoom: 12,
      defaultStyle: 'streets-v12',
      enableLiveTracking: true,
      updateIntervalSeconds: 30
    },
    emailConfig: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      senderEmail: process.env.SMTP_FROM || '',
      testEmail: '',
      isActive: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
    },
    seo: {
      siteName: 'Atendo One',
      title: 'Atendo One — Gestão e publicação de fretes',
      description: 'Plataforma de gestão logística para transportadoras, motoristas e operações de fretes.',
      keywords: 'gestão de fretes, transportadora, logística, rastreamento',
      canonicalUrl: process.env.APP_URL || 'https://gestor.atendo.log.br',
      ogImageUrl: '',
      locale: 'pt_BR',
      allowIndexing: true
    },
    notificationTemplates: defaultNotificationTemplates.map(template => ({ ...template, variables: [...template.variables] })),
    asaasConfig: {
      enabled: false,
      environment: 'sandbox',
      apiKey: '',
      webhookToken: '',
      webhookUrl: ''
    }
  };

  // Mutex locks for atomic operations (e.g. freight acceptance)
  private locks: Map<string, Promise<void>> = new Map();
  
  // Storage for auth tokens
  private authTokens: Map<string, { userId: string, expiresAt: Date }> = new Map();
  private persistenceReady: Promise<void>;
  private persistenceQueue: Promise<void> = Promise.resolve();
  private analyticsPersistTimer: ReturnType<typeof setTimeout> | null = null;
  legalDocumentVersions: LegalDocumentVersion[] = [];

  constructor() {
    this.seedInitialData();
    this.ensurePublicDemoData();
    this.ensureSystemContent();
    this.persistenceReady = this.hydrateFromPostgres().then(async () => {
      await this.hydrateSecureAtendoCrmConfig();
      this.ensureSystemContent();
      this.ensurePublicDemoData();
      return this.persistNow();
    });
  }

  async waitForPersistence(): Promise<void> {
    await this.persistenceReady;
  }

  getTenantReportTemplates(tenantId: string): TenantReportTemplate[] {
    const saved = this.tenantReportTemplates.get(tenantId) || [];
    return defaultTenantReportTemplates.map(defaultTemplate => {
      const override = saved.find(template => template.type === defaultTemplate.type);
      return {
        ...cloneReportTemplate(defaultTemplate),
        ...(override ? cloneReportTemplate(override) : {}),
        tenantId,
        source: override ? 'TENANT' : 'DEFAULT'
      };
    });
  }

  saveTenantReportTemplate(tenantId: string, input: Omit<TenantReportTemplate, 'tenantId' | 'updatedAt' | 'source'>): TenantReportTemplate {
    const now = new Date().toISOString();
    const current = this.tenantReportTemplates.get(tenantId) || [];
    const saved: TenantReportTemplate = {
      ...cloneReportTemplate(input as TenantReportTemplate),
      tenantId,
      source: 'TENANT',
      updatedAt: now
    };
    const next = current.filter(template => template.type !== saved.type);
    next.push(saved);
    this.tenantReportTemplates.set(tenantId, next);
    return cloneReportTemplate(saved);
  }
  private ensureSystemContent(): void {
    const now = new Date().toISOString();
    const legalVersion = '2026-08-27.1';
    const systemName = this.saasGlobalConfig.systemName || 'Gestor';
    const supportEmail = this.saasGlobalConfig.supportEmail || 'suporte informado na plataforma';
    const privacyContent = `<h1>Política de Privacidade</h1><p>Versão ${legalVersion}. Esta minuta explica como ${systemName} trata dados pessoais no serviço de gestão logística, fretes, usuários, motoristas, veículos, documentos, notificações e cobrança.</p><h2>1. Quem trata os dados</h2><p>A identificação jurídica do controlador e o canal atualizado do encarregado devem ser preenchidos pela organização responsável antes da publicação definitiva. Em operações criadas por uma empresa cliente, essa empresa também define as finalidades específicas dos dados que insere e das decisões que toma sobre usuários, motoristas e fretes.</p><h2>2. Dados tratados</h2><p>Podem ser tratados nome, e-mail, telefone, documentos cadastrais e de habilitação, cidade, estado, empresa, dados de veículos, dados de fretes, despesas e documentos enviados, credenciais protegidas, registros de acesso, auditoria, suporte e preferências de comunicação. Dados de cartão não são armazenados pelo ${systemName}; o fluxo comercial deve usar Checkout ou tokenização do provedor de pagamentos.</p><h2>3. Finalidades e bases legais</h2><p>Os dados são usados para criar e administrar contas, executar o contrato ou medidas pré-contratuais, operar fretes, validar vínculos de motoristas, emitir e organizar documentos, prestar suporte, prevenir fraude, manter a segurança, cumprir obrigações legais e conciliar pagamentos. Comunicações operacionais por e-mail podem ser enviadas conforme a configuração da conta; notificações operacionais por WhatsApp exigem autorização explícita do destinatário e podem ser revogadas a qualquer momento. O fundamento jurídico aplicável deve ser confirmado pelo controlador em cada operação.</p><h2>4. WhatsApp, consentimento e canais</h2><p>A empresa pode escolher o telefone oficial SaaS, sem mensalidade adicional, ou contratar o número próprio. A conexão própria pode usar o Atendo CRM e seus endpoints configurados pela empresa. Tokens de integração permanecem no servidor, cifrados e fora do navegador. O ${systemName} não autoriza disparos para pessoas que não tenham relação com a operação ou consentimento quando exigido. O titular pode retirar o consentimento em Preferências de notificações; a retirada não invalida tratamentos necessários à segurança, à autenticação ou ao cumprimento de obrigação legal.</p><h2>5. Pagamentos e Asaas</h2><p>Para assinaturas, o ${systemName} pode compartilhar com o Asaas os dados necessários para criar o cliente e a cobrança, como identificação empresarial, e-mail, telefone válido e informações do plano. O sistema mantém apenas referências, valores, vencimentos e estados de assinatura/pagamento necessários à conciliação. Número de cartão, validade e CVV não devem ser enviados ao backend do ${systemName} nem registrados em logs, banco ou analytics.</p><h2>6. Vitrine pública e motoristas</h2><p>Quando a empresa optar por publicar um frete, a vitrine mostra somente um resumo da oportunidade. Não são expostos valor, endereços exatos, contatos, clientes, notas internas ou documentos fiscais. O motorista deve concluir o cadastro e a empresa responsável analisa o interesse. O perfil de motorista pode ser global, mas cada vínculo empresarial é independente: a aprovação de uma empresa não substitui a validação de outra. O compartilhamento deve limitar-se ao necessário para análise e operação.</p><h2>7. Analytics e visitas</h2><p>As páginas públicas podem registrar estatísticas agregadas para melhorar conteúdo, navegação e campanhas. Podem ser tratados rota, data, origem geral, domínio referenciador, parâmetros de campanha, tipo de dispositivo e, quando fornecido pelo proxy, país. O mecanismo não registra o endereço IP completo, formulários, senhas, códigos ou fingerprint individual; os registros técnicos de visitas são mantidos por no máximo 366 dias e têm acesso restrito.</p><h2>8. Compartilhamento e operadores</h2><p>Dados podem ser acessados por provedores necessários à hospedagem, banco, envio de e-mail, WhatsApp, pagamentos, segurança e suporte, sempre conforme a finalidade e os contratos aplicáveis. Compartilhamentos adicionais devem ser informados pela empresa responsável. Transferências internacionais, quando ocorrerem, devem observar as salvaguardas exigidas pela legislação.</p><h2>9. Segurança, retenção e incidentes</h2><p>São aplicados segregação por empresa, controle de acesso, autenticação, cofre cifrado para segredos, não persistência de QR e tokens no estado operacional, auditoria, headers de segurança, rate limiting e backups. Nenhuma medida elimina todo risco. Os dados são mantidos pelo tempo necessário às finalidades, à defesa de direitos e às obrigações legais; depois podem ser eliminados ou anonimizados quando permitido.</p><h2>10. Direitos do titular</h2><p>O titular pode solicitar confirmação, acesso, correção, informação sobre compartilhamento, anonimização, bloqueio, eliminação quando aplicável, portabilidade, revisão de decisões automatizadas e revogação de consentimento. Para exercer direitos, use ${supportEmail}, informando o mínimo necessário para localizar a solicitação. O controlador avaliará a identidade, a base legal, os prazos e as exceções aplicáveis.</p><h2>11. Atualizações</h2><p>Esta política pode ser atualizada para refletir mudanças do serviço, da legislação ou dos provedores. A versão aceita no cadastro é registrada com data e versão. Esta é uma minuta operacional e precisa de revisão jurídica, identificação do controlador, definição do encarregado, bases legais específicas e validação fiscal antes de uso definitivo.</p>`;
    const termsContent = `<h1>Termos de Uso</h1><p>Versão ${legalVersion}. Estes Termos regulam o uso do ${systemName} por empresas, administradores, usuários, motoristas e visitantes.</p><h2>1. Aceite e conta</h2><p>O cadastro exige leitura e aceite destes Termos e da Política de Privacidade. O usuário deve fornecer informações verdadeiras, manter o cadastro atualizado, proteger credenciais e utilizar a conta somente em nome próprio ou com autorização. A empresa responde pelos usuários, motoristas, veículos, fretes, documentos e decisões que administra.</p><h2>2. Uso permitido</h2><p>O serviço deve ser usado para gestão logística legítima, comunicação operacional autorizada e organização de fretes. É proibido inserir dados falsos, violar direitos de terceiros, tentar acessar outra empresa, compartilhar credenciais, explorar vulnerabilidades, contornar limites, enviar spam, praticar fraude ou usar o serviço para finalidade ilícita.</p><h2>3. Motoristas, veículos e vitrine pública</h2><p>A empresa pode publicar ou retirar fretes da vitrine pública. A vitrine não deve conter valor, endereço exato, contato, cliente, nota interna ou documento fiscal. O motorista interessado poderá fazer cadastro rápido, validar o telefone e concluir seus dados; a empresa publicadora decide se aprova o vínculo. Um motorista pode se relacionar com várias empresas, e cada empresa deve fazer sua própria validação, sem bloqueio ou aprovação automática entre empresas.</p><h2>4. WhatsApp e mensagens</h2><p>O uso do telefone SaaS ou do número próprio depende de configuração legítima da empresa e das regras do módulo contratado. O número próprio só é liberado após confirmação do pagamento aplicável. Mensagens devem ser pertinentes à operação, respeitar consentimento, opt-out, horários e legislação. A empresa é responsável pelo conteúdo, pelos destinatários e pela autorização do canal conectado ao Atendo CRM. Códigos de autenticação e avisos de segurança têm natureza transacional e podem ser necessários para proteger a conta.</p><h2>5. Planos, Asaas e cobranças</h2><p>Os planos, limites e preços apresentados no cadastro ou painel SaaS podem variar conforme a configuração comercial vigente. A contratação recorrente, a troca de plano e o cancelamento são processados pelo Asaas quando habilitado. O pagamento é considerado confirmado somente após conciliação do evento de pagamento. O número próprio depende de pagamento ativo; o cancelamento do módulo retorna a empresa ao telefone SaaS quando essa opção estiver disponível. O ${systemName} não recebe nem armazena número de cartão, validade ou CVV no fluxo direto; pagamentos com cartão devem usar Checkout ou tokenização segura do provedor.</p><h2>6. Conteúdo, documentos e responsabilidade</h2><p>O usuário mantém a responsabilidade pelo conteúdo inserido, pela origem dos documentos, pela exatidão das informações e pelas autorizações de compartilhamento. O ${systemName} fornece ferramentas e não substitui aconselhamento jurídico, fiscal, contábil, regulatório, de transporte ou de segurança. Recursos de emissão ou organização de documentos devem ser conferidos pela empresa antes de uso oficial.</p><h2>7. Disponibilidade e segurança</h2><p>São aplicadas medidas de segurança, backups, controle de acesso, auditoria e manutenção. Podem ocorrer indisponibilidades por manutenção, falhas de provedor, internet ou eventos fora do controle razoável. Tentativas de abuso ou risco à plataforma podem resultar em limitação, suspensão ou encerramento, preservados registros necessários à segurança e à defesa de direitos.</p><h2>8. Propriedade e dados</h2><p>O ${systemName} e seus componentes permanecem protegidos pelos direitos aplicáveis. O usuário conserva os direitos sobre seus dados e concede somente as permissões necessárias à execução do serviço. A exportação, exclusão e retenção dependem das funcionalidades disponíveis, das obrigações legais e dos direitos de terceiros.</p><h2>9. Alterações e suporte</h2><p>Termos e preços podem ser atualizados. Mudanças relevantes serão comunicadas pelos canais disponíveis e, quando necessário, exigirão novo aceite. Solicitações de suporte e privacidade devem ser encaminhadas ao canal informado na plataforma. Estes Termos são uma minuta operacional e precisam de revisão jurídica antes da cobrança real ou da publicação definitiva.</p>`;
    const legalPages: WebPage[] = [
      {
        id: 'page-legal-privacy',
        tenantId: null,
        slug: 'politica-de-privacidade',
        title: 'Política de Privacidade',
        excerpt: 'Como o Atendo One coleta, utiliza, armazena e protege dados pessoais.',
        metaTitle: 'Política de Privacidade | Atendo One',
        metaDescription: 'Conheça as práticas de privacidade e proteção de dados do Atendo One.',
        content: privacyContent,
        isPublished: true,
        isIndexable: true,
        isSystemLocked: true,
        contentVersion: legalVersion,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'page-legal-terms',
        tenantId: null,
        slug: 'termos-de-uso',
        title: 'Termos de Uso',
        excerpt: 'Regras de utilização da plataforma Atendo One e responsabilidades dos usuários.',
        metaTitle: 'Termos de Uso | Atendo One',
        metaDescription: 'Leia as regras de uso da plataforma Atendo One para transportadoras, motoristas e usuários.',
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
      const existing = this.pages.find(page => page.slug === legalPage.slug && page.tenantId === null);
      if (!existing) this.pages.push(legalPage);
      else {
        // Documentos legais continuam protegidos contra exclusão, mas podem ser editados
        // pelo Super Admin. Nunca sobrescrever o conteúdo persistido automaticamente.
        existing.isSystemLocked = true;
        if (!existing.contentVersion) existing.contentVersion = legalVersion;
        if (existing.isIndexable === undefined) existing.isIndexable = true;
        if (existing.metaTitle === undefined) existing.metaTitle = legalPage.metaTitle;
        if (existing.metaDescription === undefined) existing.metaDescription = legalPage.metaDescription;
        if (existing.excerpt === undefined) existing.excerpt = legalPage.excerpt;
      }
    }
    this.ensurePublicSeoContent();
    this.ensureAnalyticsTermsDisclosure();
    this.ensureAnalyticsPrivacyDisclosure();
    this.ensureDriverDataDisclosure();
    this.ensureDriverCompanyLinks();
  }
  private ensurePublicSeoContent(): void {
    const now = new Date().toISOString();
    for (const page of publicSeoPages(now)) {
      const existing = this.pages.find(item => item.id === page.id || (item.slug === page.slug && item.tenantId === null));
      if (!existing) this.pages.push(page);
      else {
        if (existing.isIndexable === undefined) existing.isIndexable = page.isIndexable;
        if (existing.metaTitle === undefined) existing.metaTitle = page.metaTitle;
        if (existing.metaDescription === undefined) existing.metaDescription = page.metaDescription;
      }
    }
    for (const post of publicSeoPosts(now)) {
      const existing = this.posts.find(item => item.id === post.id || (item.slug === post.slug && item.tenantId === null));
      if (!existing) this.posts.push(post);
      else {
        if (existing.isIndexable === undefined) existing.isIndexable = post.isIndexable;
        if (existing.metaTitle === undefined) existing.metaTitle = post.metaTitle;
        if (existing.metaDescription === undefined) existing.metaDescription = post.metaDescription;
      }
    }
    for (const page of publicCommercialPages(now)) {
      const existing = this.pages.find(item => item.id === page.id || (item.slug === page.slug && item.tenantId === null));
      if (!existing) this.pages.push(page);
      else {
        if (existing.isIndexable === undefined) existing.isIndexable = page.isIndexable;
        if (existing.metaTitle === undefined) existing.metaTitle = page.metaTitle;
        if (existing.metaDescription === undefined) existing.metaDescription = page.metaDescription;
        if (existing.publicPath === undefined) existing.publicPath = page.publicPath;
      }
    }
  }
  private ensureAnalyticsTermsDisclosure(): void {
    const terms = this.pages.find(item => item.tenantId === null && item.slug === 'termos-de-uso');
    if (!terms || terms.content.includes('Finalidade da medição de visitas')) return;
    terms.content += '<h2>Finalidade da medição de visitas</h2><p>O Elo Log poderá medir de forma agregada e proporcional as visitas às páginas públicas para entender quais conteúdos e canais despertam interesse. Saber de onde vêm as visitas ajuda a melhorar os conteúdos, corrigir problemas de navegação, avaliar campanhas e aprimorar as informações oferecidas a transportadoras e motoristas. A medição não registra formulários, não armazena o endereço IP completo, não cria fingerprint individual e não vende dados pessoais. Parâmetros de campanha e referenciadores podem ser agrupados para fins estatísticos, observando as configurações de privacidade aplicáveis.</p>';
    terms.updatedAt = new Date().toISOString();
  }
  private ensureAnalyticsPrivacyDisclosure(): void {
    const privacy = this.pages.find(item => item.tenantId === null && item.slug === 'politica-de-privacidade');
    if (!privacy || privacy.content.includes('Dados de acesso e analytics')) return;
    privacy.content += '<h2>Dados de acesso e analytics</h2><p>Para melhorar o conteúdo, a navegação e as campanhas, o Elo Log poderá registrar estatísticas agregadas de acesso às páginas públicas. Essas estatísticas podem incluir a rota acessada, a data, a origem geral, o referenciador apenas pelo domínio, parâmetros de campanha, tipo de dispositivo e, quando fornecido pelo proxy, o país. O endereço IP completo, formulários, senhas, códigos e fingerprint individual não são registrados por este mecanismo. Os registros técnicos são mantidos por no máximo 366 dias, com acesso restrito ao Super Admin, e não são vendidos a terceiros.</p>';
    privacy.updatedAt = new Date().toISOString();
  }
  private ensureDriverDataDisclosure(): void {
    const terms = this.pages.find(item => item.tenantId === null && item.slug === 'termos-de-uso');
    if (terms && !terms.content.includes('Vitrine pública e vínculos de motoristas')) {
      terms.content += '<h2>Vitrine pública e vínculos de motoristas</h2><p>Empresas podem optar por publicar fretes de mercadorias na vitrine pública. A vitrine exibe somente informações resumidas da oportunidade, sem valor, endereços exatos, contatos, clientes, notas internas ou documentos fiscais. Para demonstrar interesse e consultar eventual valor liberado, o motorista conclui cadastro e validação do telefone, e a empresa responsável analisa a solicitação.</p><p>O cadastro de motorista é global, mas cada vínculo com uma empresa é independente. A aprovação, recusa ou bloqueio feitos por uma empresa não aprovam, recusam ou bloqueiam automaticamente o motorista em outras empresas. Cada empresa é responsável pela conferência dos dados básicos compartilhados e pela decisão de aceitar o vínculo para sua operação.</p>';
      terms.updatedAt = new Date().toISOString();
    }
    const privacy = this.pages.find(item => item.tenantId === null && item.slug === 'politica-de-privacidade');
    if (privacy && !privacy.content.includes('Compartilhamento básico com empresas')) {
      privacy.content += '<h2>Compartilhamento básico com empresas</h2><p>Quando o motorista demonstra interesse em um frete ou solicita vínculo empresarial, dados básicos necessários à análise podem ser apresentados à empresa responsável, como nome, telefone, e-mail, cidade, documentos de habilitação e dados do veículo informados no cadastro. O compartilhamento é limitado à finalidade de avaliar a solicitação e operar o frete. A empresa que recebe os dados assume a responsabilidade pela validação específica de sua operação; uma validação anterior não substitui essa responsabilidade.</p><p>Dados de preço permanecem protegidos e só são retornados em área autenticada quando a regra do frete permitir. Registros históricos de vínculos, veículos próprios e decisões administrativas são preservados para rastreabilidade, inclusive quando um vínculo é desativado.</p>';
      privacy.updatedAt = new Date().toISOString();
    }
  }
  private ensureDriverCompanyLinks(): void {
    const now = new Date().toISOString();
    for (const driver of this.drivers) {
      if (!driver.tenantId) continue;
      const exists = this.driverCompanyLinks.some(link => link.driverId === driver.id && link.tenantId === driver.tenantId);
      if (exists) continue;
      this.driverCompanyLinks.push({
        id: `driver-link-${driver.id}-${driver.tenantId}`,
        driverId: driver.id,
        tenantId: driver.tenantId,
        status: driver.status === 'INATIVO' ? 'BLOQUEADO' : driver.status === 'PENDENTE' ? 'PENDENTE' : 'APROVADO',
        scope: 'EMPRESA',
        source: 'IMPORTACAO',
        createdAt: driver.createdAt || now,
        updatedAt: now
      });
    }
  }
  getDriverCompanyLink(driverId: string, tenantId: string, freightId?: string): DriverCompanyLink | undefined {
    return this.driverCompanyLinks.find(link => link.driverId === driverId && link.tenantId === tenantId && (freightId ? link.freightId === freightId : link.scope === 'EMPRESA'));
  }
  hasDriverCompanyAccess(driverId: string, tenantId: string, includePending = false, freightId?: string): boolean {
    return this.driverCompanyLinks.some(link => link.driverId === driverId && link.tenantId === tenantId && (link.scope === 'EMPRESA' || (freightId && link.freightId === freightId)) && (link.status === 'APROVADO' || (includePending && link.status === 'PENDENTE')));
  }
  upsertDriverCompanyLink(input: Omit<DriverCompanyLink, 'id' | 'createdAt' | 'updatedAt'>): DriverCompanyLink {
    const now = new Date().toISOString();
    const existing = this.driverCompanyLinks.find(link => link.driverId === input.driverId && link.tenantId === input.tenantId && link.scope === input.scope && link.freightId === input.freightId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: now });
      return existing;
    }
    const created: DriverCompanyLink = { ...input, id: `driver-link-${Date.now()}-${randomUUID().slice(0, 8)}`, createdAt: now, updatedAt: now };
    this.driverCompanyLinks.unshift(created);
    return created;
  }
  getCompanyDriverLinks(tenantId?: string): DriverCompanyLink[] {
    return this.driverCompanyLinks.filter(link => !tenantId || link.tenantId === tenantId);
  }
  private serializeState() {
    // Never persist credentials or API keys in the JSONB compatibility snapshot.
    const redactWhatsApp = (config: any) => config ? { ...config, token: '' } : config;
    const safeWhatsAppConfigs = Object.fromEntries(
      Array.from(this.whatsappConfigs.entries()).map(([tenantId, config]) => [tenantId, redactWhatsApp(config)])
    );
    const safeTenantNotificationTemplates = Object.fromEntries(
      Array.from(this.tenantNotificationTemplates.entries()).map(([tenantId, templates]) => [
        tenantId,
        templates.map(template => ({ ...template, channels: { ...template.channels }, variables: [...template.variables] }))
      ])
    );
    const safeTenantReportTemplates = Object.fromEntries(
      Array.from(this.tenantReportTemplates.entries()).map(([tenantId, templates]) => [
        tenantId,
        templates.map(template => ({ ...template }))
      ])
    );
    const safeDatabaseConfig = this.saasGlobalConfig.databaseConfig
      ? { ...this.saasGlobalConfig.databaseConfig, password: '' }
      : this.saasGlobalConfig.databaseConfig;
    const safeEmailConfig = this.saasGlobalConfig.emailConfig
      ? { ...this.saasGlobalConfig.emailConfig, password: '' }
      : this.saasGlobalConfig.emailConfig;
    const safeMapboxConfig = this.saasGlobalConfig.mapboxConfig
      ? { ...this.saasGlobalConfig.mapboxConfig, apiKey: '' }
      : this.saasGlobalConfig.mapboxConfig;
    const safeSaasConfig = {
      ...this.saasGlobalConfig,
      databaseConfig: safeDatabaseConfig,
      emailConfig: safeEmailConfig,
      mapboxConfig: safeMapboxConfig,
      asaasConfig: this.saasGlobalConfig.asaasConfig
        ? { ...this.saasGlobalConfig.asaasConfig, apiKey: '', webhookToken: '' }
        : this.saasGlobalConfig.asaasConfig
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

  private async hydrateFromPostgres(): Promise<void> {
    if (!sqlAdapter.isEnabled()) return;
    try {
      const result = await sqlAdapter.query<{ state: any }>('SELECT state FROM app_state WHERE id = $1', ['default']);
      const state = result.rows[0]?.state;
      if (!state) {
        await this.hydrateSecureWhatsAppConfig();
        await this.hydrateSecureEmailConfig();
        await this.hydrateSecureAsaasConfig();
        this.ensureSystemContent();
        return;
      }
      for (const key of ['tenants', 'users', 'drivers', 'vehicles', 'freights', 'tripExpenses', 'notifications', 'notificationDeliveries', 'pushSubscriptions', 'forms', 'formResponses', 'auditLogs', 'errorLogs', 'visitAnalytics', 'driverCompanyLinks', 'freightInterests', 'companyVehicles', 'pages', 'posts', 'asaasPayments', 'asaasSubscriptions', 'helpPages', 'legalDocumentVersions']) {
        if (Array.isArray(state[key])) (this as any)[key] = state[key];
      }
      if (state.whatsappConfigs && typeof state.whatsappConfigs === 'object') {
        this.whatsappConfigs = new Map(Object.entries(state.whatsappConfigs).map(([tenantId, config]) => [
          tenantId,
          { ...(config as any), token: '' }
        ]));
      }
      if (state.tenantNotificationTemplates && typeof state.tenantNotificationTemplates === 'object') {
        this.tenantNotificationTemplates = new Map(Object.entries(state.tenantNotificationTemplates).map(([tenantId, templates]) => [
          tenantId,
          Array.isArray(templates) ? (templates as any[]).filter(template => template && typeof template.eventKey === 'string').map(template => ({
            ...template,
            channels: { ...(template.channels || {}) },
            variables: Array.isArray(template.variables) ? [...template.variables] : []
          })) : []
        ]));
      }
      if (state.tenantReportTemplates && typeof state.tenantReportTemplates === 'object') {
        this.tenantReportTemplates = new Map(Object.entries(state.tenantReportTemplates).map(([tenantId, templates]) => [
          tenantId,
          Array.isArray(templates) ? (templates as any[]).filter(template => template && (template.type === 'EXPENSE' || template.type === 'CHECKLIST')).map(template => ({
            tenantId,
            type: template.type as ReportTemplateType,
            title: String(template.title || ''),
            subtitle: String(template.subtitle || ''),
            approvalLabel: String(template.approvalLabel || ''),
            signatureLabel: String(template.signatureLabel || ''),
            notes: String(template.notes || ''),
            updatedAt: template.updatedAt,
            source: 'TENANT' as const
          })) : []
        ]));
      }
      if (state.globalWhatsAppConfig) {
        const persistedWhatsApp = state.globalWhatsAppConfig as Partial<WhatsAppConfig>;
        const runtimeWhatsApp = this.globalWhatsAppConfig;
        this.globalWhatsAppConfig = {
          ...runtimeWhatsApp,
          ...persistedWhatsApp,
          baseUrl: persistedWhatsApp.baseUrl || runtimeWhatsApp.baseUrl || process.env.WHATSAPP_API_URL || '',
          token: runtimeWhatsApp.token || process.env.WHATSAPP_API_TOKEN || '',
        };
      }
      await this.hydrateSecureWhatsAppConfig();
      if (state.saasGlobalConfig) {
        const persisted = state.saasGlobalConfig;
        const runtime = this.saasGlobalConfig;
        const persistedTemplates = Array.isArray((persisted as any).notificationTemplates) ? (persisted as any).notificationTemplates : [];
        const persistedTemplateKeys = new Set(persistedTemplates.map((template: any) => template.eventKey));
        const mergedNotificationTemplates = [
          ...persistedTemplates,
          ...((runtime.notificationTemplates || []).filter(template => !persistedTemplateKeys.has(template.eventKey)))
        ];
        this.saasGlobalConfig = {
          ...runtime,
          ...persisted,
          notificationTemplates: mergedNotificationTemplates,
          databaseConfig: persisted.databaseConfig
            ? { ...runtime.databaseConfig, ...persisted.databaseConfig, password: runtime.databaseConfig?.password || '' }
            : runtime.databaseConfig,
          emailConfig: persisted.emailConfig
            ? { ...runtime.emailConfig, ...persisted.emailConfig, password: runtime.emailConfig?.password || '' }
            : runtime.emailConfig,
          mapboxConfig: persisted.mapboxConfig
            ? { ...runtime.mapboxConfig, ...persisted.mapboxConfig, apiKey: runtime.mapboxConfig?.apiKey || '' }
            : runtime.mapboxConfig,
          asaasConfig: persisted.asaasConfig
            ? { ...runtime.asaasConfig, ...persisted.asaasConfig, apiKey: runtime.asaasConfig?.apiKey || '', webhookToken: runtime.asaasConfig?.webhookToken || '' }
            : runtime.asaasConfig
        };
      }
      await this.hydrateSecureEmailConfig();
      await this.hydrateSecureAsaasConfig();
      this.ensureSystemContent();
    } catch (error: any) {
      if (!String(error?.message || '').includes('relation "app_state" does not exist')) {
        console.warn('PostgreSQL state hydration skipped:', error?.message || error);
      }
    }
  }

  private async hydrateSecureWhatsAppConfig(): Promise<void> {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig = this.globalWhatsAppConfig;
    let secret: any | null = null;
    try {
      const result = await sqlAdapter.query<{ ciphertext: string }>(
        'SELECT ciphertext FROM app_secrets WHERE id = $1',
        [WHATSAPP_SECRET_ID]
      );
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error: any) {
      if (String(error?.message || '').includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`
          CREATE TABLE IF NOT EXISTS app_secrets (
            id TEXT PRIMARY KEY,
            ciphertext TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        console.warn('Secure WhatsApp configuration hydration skipped:', error?.message || error);
        return;
      }
    }
    if (secret?.baseUrl && secret?.token) {
      this.globalWhatsAppConfig = {
        ...this.globalWhatsAppConfig,
        baseUrl: String(secret.baseUrl),
        token: String(secret.token),
        provider: 'WHAZING'
      };
    } else if (runtimeConfig.baseUrl && runtimeConfig.token) {
      await this.persistWhatsAppSecret(runtimeConfig.baseUrl, runtimeConfig.token);
    }

    try {
      const tenantSecrets = await sqlAdapter.query<{ id: string; ciphertext: string }>(
        'SELECT id, ciphertext FROM app_secrets WHERE id LIKE $1',
        [`${WHATSAPP_TENANT_SECRET_PREFIX}%`]
      );
      for (const row of tenantSecrets.rows) {
        const tenantId = row.id.slice(WHATSAPP_TENANT_SECRET_PREFIX.length);
        const tenantSecret = row.ciphertext ? decryptConfigSecret(row.ciphertext) : null;
        if (!tenantId || !tenantSecret?.baseUrl || !tenantSecret?.token) continue;
        const persistedConfig = this.whatsappConfigs.get(tenantId);
        this.whatsappConfigs.set(tenantId, {
          ...this.globalWhatsAppConfig,
          ...(persistedConfig || {}),
          ...tenantSecret,
          provider: 'WHAZING',
          baseUrl: String(tenantSecret.baseUrl),
          token: String(tenantSecret.token)
        });
      }
    } catch (error: any) {
      if (!String(error?.message || '').includes('relation "app_secrets" does not exist')) {
        console.warn('Secure tenant WhatsApp configuration hydration skipped:', error?.message || error);
      }
    }
  }

  private async hydrateSecureAtendoCrmConfig(): Promise<void> {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    try {
      const result = await sqlAdapter.query<{ ciphertext: string }>('SELECT ciphertext FROM app_secrets WHERE id = $1', [ATENDO_CRM_ADMIN_SECRET_ID]);
      const secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
      if (secret?.apiId && secret?.bearerToken) {
        this.atendoCrmAdminConfig = {
          baseUrl: String(secret.baseUrl || ''),
          apiId: String(secret.apiId),
          bearerToken: String(secret.bearerToken)
        };
      }
    } catch (error: any) {
      if (!String(error?.message || '').includes('relation "app_secrets" does not exist')) {
        console.warn('Secure Atendo CRM configuration hydration skipped:', error?.message || error);
      }
    }
  }

  async persistAtendoCrmAdminSecret(config: { baseUrl?: string; apiId: string; bearerToken: string }): Promise<void> {
    if (!config.apiId || !config.bearerToken) {
      throw new Error('API ID e token administrativo do Atendo CRM são obrigatórios.');
    }
    if (!sqlAdapter.isEnabled()) {
      throw new Error('A persistência PostgreSQL precisa estar habilitada para salvar a configuração com segurança.');
    }
    const ciphertext = encryptConfigSecret({
      baseUrl: String(config.baseUrl || '').trim().replace(/\/+$/, ''),
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
      baseUrl: String(config.baseUrl || '').trim().replace(/\/+$/, ''),
      apiId: String(config.apiId).trim(),
      bearerToken: String(config.bearerToken).trim()
    };
  }

  getAtendoCrmAdminSecretMetadata(): { configured: boolean; baseUrlConfigured: boolean; apiIdConfigured: boolean; tokenConfigured: boolean } {
    return {
      configured: Boolean(this.atendoCrmAdminConfig.apiId && this.atendoCrmAdminConfig.bearerToken),
      baseUrlConfigured: Boolean(this.atendoCrmAdminConfig.baseUrl),
      apiIdConfigured: Boolean(this.atendoCrmAdminConfig.apiId),
      tokenConfigured: Boolean(this.atendoCrmAdminConfig.bearerToken)
    };
  }

  private async hydrateSecureAsaasConfig(): Promise<void> {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig: any = this.saasGlobalConfig.asaasConfig || {};
    let secret: any | null = null;
    try {
      const result = await sqlAdapter.query<{ ciphertext: string }>('SELECT ciphertext FROM app_secrets WHERE id = $1', [ASAAS_SECRET_ID]);
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error: any) {
      if (String(error?.message || '').includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      } else {
        console.warn('Secure Asaas configuration hydration skipped:', error?.message || error);
        return;
      }
    }
    if (secret?.apiKey || secret?.webhookToken) {
      this.saasGlobalConfig.asaasConfig = {
        ...runtimeConfig,
        ...secret,
        apiKey: String(secret.apiKey || ''),
        webhookToken: String(secret.webhookToken || '')
      };
      return;
    }
    if (runtimeConfig.apiKey || runtimeConfig.webhookToken) await this.persistAsaasSecret(runtimeConfig);
  }
  async persistAsaasSecret(config: { enabled?: boolean; environment?: string; apiKey?: string; webhookToken?: string; webhookUrl?: string }): Promise<void> {
    if (!sqlAdapter.isEnabled()) throw new Error('A persistência PostgreSQL precisa estar habilitada para salvar a configuração Asaas com segurança.');
    const ciphertext = encryptConfigSecret({
      enabled: config.enabled !== false,
      environment: config.environment || 'sandbox',
      apiKey: config.apiKey || '',
      webhookToken: config.webhookToken || '',
      webhookUrl: config.webhookUrl || ''
    });
    await sqlAdapter.query(`CREATE TABLE IF NOT EXISTS app_secrets (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await sqlAdapter.query(
      `INSERT INTO app_secrets (id, ciphertext, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = CURRENT_TIMESTAMP`,
      [ASAAS_SECRET_ID, ciphertext]
    );
  }
  private async hydrateSecureEmailConfig(): Promise<void> {
    if (!sqlAdapter.isEnabled() || !getConfigEncryptionKey()) return;
    const runtimeConfig: any = this.saasGlobalConfig.emailConfig || {};
    let secret: any | null = null;
    try {
      const result = await sqlAdapter.query<{ ciphertext: string }>(
        'SELECT ciphertext FROM app_secrets WHERE id = $1',
        [EMAIL_SECRET_ID]
      );
      secret = result.rows[0]?.ciphertext ? decryptConfigSecret(result.rows[0].ciphertext) : null;
    } catch (error: any) {
      if (String(error?.message || '').includes('relation "app_secrets" does not exist')) {
        await sqlAdapter.query(`
          CREATE TABLE IF NOT EXISTS app_secrets (
            id TEXT PRIMARY KEY,
            ciphertext TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        console.warn('Secure SMTP configuration hydration skipped:', error?.message || error);
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
        senderEmail: String(secret.senderEmail || ''),
        testEmail: String(secret.testEmail || ''),
        isActive: secret.isActive !== false
      };
      return;
    }
    if (runtimeConfig.host && runtimeConfig.user && runtimeConfig.password) {
      await this.persistEmailSecret(runtimeConfig);
    }
  }
  async persistEmailSecret(config: { host: string; port?: number; user: string; password: string; senderEmail?: string; testEmail?: string; isActive?: boolean }): Promise<void> {
    if (!sqlAdapter.isEnabled()) {
      throw new Error('A persistência PostgreSQL precisa estar habilitada para salvar a configuração SMTP com segurança.');
    }
    const ciphertext = encryptConfigSecret({
      host: config.host,
      port: Number(config.port || 587),
      user: config.user,
      password: config.password,
      senderEmail: config.senderEmail || '',
      testEmail: config.testEmail || '',
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
  async persistWhatsAppSecret(baseUrl: string, token: string): Promise<void> {
    if (!sqlAdapter.isEnabled()) {
      throw new Error('A persistência PostgreSQL precisa estar habilitada para salvar a configuração com segurança.');
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

  async persistWhatsAppSecretForTenant(tenantId: string, baseUrl: string, token: string): Promise<void> {
    if (!tenantId || !baseUrl || !token) {
      throw new Error('Empresa, URL e token são necessários para salvar a configuração WhatsApp.');
    }
    if (!sqlAdapter.isEnabled()) {
      throw new Error('A persistência PostgreSQL precisa estar habilitada para salvar a configuração com segurança.');
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

  async persistNow(): Promise<void> {
    if (!sqlAdapter.isEnabled()) return;
    this.persistenceQueue = this.persistenceQueue.then(async () => {
      try {
        await sqlAdapter.query(
          `INSERT INTO app_state (id, state, updated_at) VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = CURRENT_TIMESTAMP`,
          ['default', JSON.stringify(this.serializeState())]
        );
      } catch (error: any) {
        if (!String(error?.message || '').includes('relation "app_state" does not exist')) {
          console.warn('PostgreSQL state persistence failed:', error?.message || error);
        }
      }
    }).catch(() => {});
    await this.persistenceQueue;
  }

  // Mutex wrapper to guarantee single atomic transaction for a given key
  async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
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
  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  async recordLegalConsent(input: { userId: string; tenantId?: string | null; termsVersion: string; privacyVersion: string; acceptedAt?: string; ipAddress?: string; userAgent?: string }): Promise<void> {
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
        [input.userId, input.tenantId || null, input.termsVersion, input.privacyVersion, input.acceptedAt || new Date().toISOString(), input.ipAddress || '', input.userAgent || '']
      );
    } catch (error: any) {
      if (String(error?.message || '').includes('relation "user_legal_consents" does not exist')) {
        await sqlAdapter.query(createSql);
        await sqlAdapter.query(
          `INSERT INTO user_legal_consents (user_id, tenant_id, terms_version, privacy_version, accepted_at, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::inet, $7)`,
          [input.userId, input.tenantId || null, input.termsVersion, input.privacyVersion, input.acceptedAt || new Date().toISOString(), input.ipAddress || '', input.userAgent || '']
        );
      } else {
        throw error;
      }
    }
  }

  recordVisit(input: Omit<VisitAnalyticsBucket, 'visits'>): void {
    const keyMatches = (row: VisitAnalyticsBucket) => row.date === input.date && row.path === input.path && row.source === input.source && row.medium === input.medium && row.campaign === input.campaign && row.referrer === input.referrer && row.device === input.device && row.country === input.country;
    const existing = this.visitAnalytics.find(keyMatches);
    if (existing) existing.visits += 1;
    else this.visitAnalytics.unshift({ ...input, visits: 1 });
    const cutoff = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    this.visitAnalytics = this.visitAnalytics.filter(row => row.date >= cutoff).slice(0, 50000);
    if (!this.analyticsPersistTimer) {
      this.analyticsPersistTimer = setTimeout(() => {
        this.analyticsPersistTimer = null;
        void this.persistNow();
      }, 5000);
    }
  }
  getVisitAnalytics(days = 30) {
    const allowedDays = [7, 30, 90, 180, 365];
    const safeDays = allowedDays.includes(days) ? days : 30;
    const cutoff = new Date(Date.now() - (safeDays - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rows = this.visitAnalytics.filter(row => row.date >= cutoff);
    const aggregate = (field: keyof VisitAnalyticsBucket) => {
      const totals = new Map<string, number>();
      rows.forEach(row => {
        const label = String(row[field] || 'Não informado');
        totals.set(label, (totals.get(label) || 0) + row.visits);
      });
      return Array.from(totals.entries()).map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits || a.label.localeCompare(b.label));
    };
    const daily = aggregate('date');
    return {
      days: safeDays,
      generatedAt: new Date().toISOString(),
      totalVisits: rows.reduce((sum, row) => sum + row.visits, 0),
      bySource: aggregate('source'),
      byPath: aggregate('path'),
      byCampaign: aggregate('campaign').filter(row => row.label !== 'Não informado'),
      byReferrer: aggregate('referrer').filter(row => row.label !== 'Não informado'),
      byDevice: aggregate('device'),
      byCountry: aggregate('country').filter(row => row.label !== 'Não informado'),
      daily
    };
  }
  addErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'createdAt' | 'correlationId'> & { correlationId?: string }): ErrorLogEntry {
    const cleanMessage = String(entry.message || 'Erro interno').replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]').replace(/(token|password|secret|authorization|otp|code)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').replace(/\b\d{6}\b/g, '[OTP_REDACTED]').slice(0, 1000);
    const log: ErrorLogEntry = {
      ...entry,
      id: `error-${Date.now()}-${randomUUID().slice(0, 8)}`,
      correlationId: entry.correlationId || `corr-${Date.now()}-${randomUUID().slice(0, 8)}`,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      service: entry.service || 'elolog-app'
    };
    this.errorLogs.unshift(log);
    if (this.errorLogs.length > 1000) this.errorLogs.length = 1000;
    return log;
  }

  // Helper to dispatch in-app notifications
  addNotification(entry: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
    const notif: AppNotification = {
      ...entry,
      id: `notif-${Date.now()}-${randomUUID().slice(0, 8)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    return notif;
  }

  private async persistNotificationDeliverySql(delivery: NotificationDelivery): Promise<void> {
    if (!sqlAdapter.isEnabled()) return;
    try {
      await sqlAdapter.query(
        `INSERT INTO notification_deliveries (id, event_type, tenant_id, user_id, channel, recipient, subject, status, provider_message_id, error_message, attempts, sent_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, provider_message_id = EXCLUDED.provider_message_id, error_message = EXCLUDED.error_message, attempts = EXCLUDED.attempts, sent_at = EXCLUDED.sent_at, updated_at = CURRENT_TIMESTAMP`,
        [delivery.id, delivery.eventKey, delivery.tenantId, delivery.userId, delivery.channel, delivery.subject || null, delivery.status, delivery.providerMessageId || null, delivery.errorMessage || null, delivery.attempts, delivery.sentAt || null]
      );
    } catch (error: any) {
      if (!String(error?.message || '').includes('relation "notification_deliveries" does not exist')) {
        console.warn('Notification delivery SQL persistence failed:', error?.message || error);
      }
    }
  }

  addNotificationDelivery(entry: Omit<NotificationDelivery, 'id' | 'createdAt' | 'updatedAt'>): NotificationDelivery {
    const now = new Date().toISOString();
    const delivery: NotificationDelivery = {
      ...entry,
      id: `delivery-${Date.now()}-${randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.notificationDeliveries.unshift(delivery);
    if (this.notificationDeliveries.length > 5000) this.notificationDeliveries.length = 5000;
    void this.persistNotificationDeliverySql(delivery);
    return delivery;
  }

  updateNotificationDelivery(id: string, patch: Partial<Pick<NotificationDelivery, 'status' | 'providerMessageId' | 'errorMessage' | 'attempts' | 'sentAt'>>): NotificationDelivery | undefined {
    const delivery = this.notificationDeliveries.find(item => item.id === id);
    if (!delivery) return undefined;
    Object.assign(delivery, patch, { updatedAt: new Date().toISOString() });
    void this.persistNotificationDeliverySql(delivery);
    return delivery;
  }

  // Auth token persistence methods
  saveAuthToken(token: string, userId: string, expiresAt: Date) {
    this.authTokens.set(token, { userId, expiresAt });
  }

  getUserIdFromToken(token: string): string | null {
    const tokenData = this.authTokens.get(token);
    if (!tokenData) return null;
    if (tokenData.expiresAt < new Date()) {
      this.authTokens.delete(token);
      return null;
    }
    return tokenData.userId;
  }

  private seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Tenants (Empresas)
    const tenant1: Tenant = {
      id: 'tenant-translog-01',
      name: 'TransLog Brasil Transportes',
      legalName: 'TransLog Brasil Logística e Cargas Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'operacional@translogbrasil.com.br',
      phone: '(17) 3214-5500',
      zipCode: '15015-000',
      address: 'Av. Alberto Andaló',
      number: '3100',
      neighborhood: 'Centro',
      city: 'São José do Rio Preto',
      state: 'SP',
      status: 'ATIVA',
      plan: 'EMPRESARIAL',
      allowedOperations: ['CARGA_GERAL', 'LOGISTICA_VEICULOS'],
      planLimits: {
        maxUsers: 50,
        maxDrivers: 200,
        maxFreightsMonthly: 1000,
        customForms: true,
        exportReports: true,
        prioritySupport: true
      },
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: isoNow
    };

    const tenant2: Tenant = {
      id: 'tenant-expresso-02',
      name: 'Expresso Rodoviário Paulista',
      legalName: 'Expresso Rodoviário Paulista S.A.',
      cnpj: '98.765.432/0001-10',
      email: 'contato@expressorps.com.br',
      phone: '(19) 3512-8899',
      zipCode: '13080-000',
      address: 'Rodovia Anhanguera',
      number: 'Km 104',
      neighborhood: 'Distrito Industrial',
      city: 'Campinas',
      state: 'SP',
      status: 'ATIVA',
      plan: 'PROFISSIONAL',
      allowedOperations: ['CARGA_GERAL'],
      planLimits: {
        maxUsers: 15,
        maxDrivers: 50,
        maxFreightsMonthly: 250,
        customForms: true,
        exportReports: true,
        prioritySupport: false
      },
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: isoNow
    };

    this.tenants = [tenant1, tenant2];

    // 2. Users with RBAC
    this.users = [
      {
        id: 'user-superadmin',
        tenantId: null,
        name: 'Administrador Geral da Plataforma',
        email: 'superadmin@portaldefretes.com.br',
        phone: '(11) 99999-0001',
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
        accountType: 'REAL',
        readOnly: false,
        lastLoginAt: isoNow,
        createdAt: '2026-01-01T08:00:00.000Z'
      },
      {
        id: 'user-admin-atendo',
        tenantId: null,
        name: 'Administrador Atendo Log',
        email: 'admin@atendo.log.br',
        phone: '5517988395429',
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
        accountType: 'REAL',
        readOnly: false,
        lastLoginAt: isoNow,
        createdAt: '2026-01-01T08:00:00.000Z'
      },
      {
        id: 'user-empresa-superadmin-1',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Alberto Ferreira (Diretor)',
        email: 'carlos.ferreira@translogbrasil.com.br',
        phone: '(17) 99781-1122',
        role: 'EMPRESA_SUPER_ADMIN',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-10T10:10:00.000Z'
      },
      {
        id: 'user-admin-1',
        tenantId: 'tenant-translog-01',
        name: 'Mariana Silveira (Gerente de Fretes)',
        email: 'mariana.fretes@translogbrasil.com.br',
        phone: '(17) 99782-3344',
        role: 'ADMIN',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-12T14:00:00.000Z'
      },
      {
        id: 'user-supervisor-1',
        tenantId: 'tenant-translog-01',
        name: 'Roberto Dias (Supervisor de Pátio)',
        email: 'roberto.dias@translogbrasil.com.br',
        phone: '(17) 99783-5566',
        role: 'SUPERVISOR',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-15T09:00:00.000Z'
      },
      {
        id: 'user-op-1',
        tenantId: 'tenant-translog-01',
        name: 'Juliana Castro (Operadora de Cargas)',
        email: 'juliana.castro@translogbrasil.com.br',
        phone: '(17) 99784-7788',
        role: 'USUARIO',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-20T11:00:00.000Z'
      },
      {
        id: 'user-driver-joao',
        tenantId: 'tenant-translog-01',
        name: 'João da Silva',
        email: 'joao.silva.motorista@gmail.com',
        phone: '(17) 98112-9090',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-joao-01',
        lastLoginAt: isoNow,
        createdAt: '2026-01-15T15:30:00.000Z'
      },
      {
        id: 'user-driver-carlos',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Eduardo Mendes',
        email: 'carlos.mendes.cargas@gmail.com',
        phone: '(17) 99654-3210',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-carlos-02',
        lastLoginAt: isoNow,
        createdAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: 'user-driver-marcos',
        tenantId: 'tenant-translog-01',
        name: 'Marcos Antônio Rocha',
        email: 'marcos.rocha.truck@gmail.com',
        phone: '(19) 98765-4321',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-marcos-03',
        lastLoginAt: isoNow,
        createdAt: '2026-02-05T09:30:00.000Z'
      },
      {
        id: 'user-driver-test-17',
        tenantId: 'tenant-translog-01',
        name: 'Motorista Teste WhatsApp',
        email: 'motorista.17991163961@elolog.com.br',
        phone: '(17) 99116-3961',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-test-17',
        lastLoginAt: isoNow,
        createdAt: '2026-02-20T10:00:00.000Z'
      }
    ];

    // 3. Drivers
    this.drivers = [
      {
        id: 'driver-test-17',
        userId: 'user-driver-test-17',
        tenantId: 'tenant-translog-01',
        name: 'Motorista Teste WhatsApp',
        cpf: '456.789.012-33',
        rg: '55.443.221-X SSP/SP',
        birthDate: '1990-05-12',
        phone: '(17) 99116-3961',
        email: 'motorista.17991163961@elolog.com.br',
        zipCode: '15010-000',
        address: 'Rua Teste WhatsApp, 100',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '09876543210',
        cnhCategory: 'E',
        cnhExpiresAt: '2030-01-01',
        status: 'DISPONIVEL',
        rating: 5.0,
        completedTrips: 15,
        rntrc: '99887766',
        notes: 'Motorista de teste criado especificamente para validação do login via WhatsApp (17) 99116-3961.',
        createdAt: '2026-02-20T10:00:00.000Z'
      },
      {
        id: 'driver-joao-01',
        userId: 'user-driver-joao',
        tenantId: 'tenant-translog-01',
        name: 'João da Silva',
        cpf: '123.456.789-00',
        rg: '25.678.901-X SSP/SP',
        birthDate: '1984-06-14',
        phone: '(17) 98112-9090',
        email: 'joao.silva.motorista@gmail.com',
        zipCode: '15050-000',
        address: 'Rua das Palmeiras, 450',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '04598712340',
        cnhCategory: 'E',
        cnhExpiresAt: '2028-09-15',
        status: 'DISPONIVEL',
        rating: 4.9,
        completedTrips: 42,
        rntrc: '12345678',
        notes: 'Motorista com mais de 10 anos de experiência em rotas interestaduais SP/PR/MG.',
        createdAt: '2026-01-15T15:30:00.000Z'
      },
      {
        id: 'driver-carlos-02',
        userId: 'user-driver-carlos',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Eduardo Mendes',
        cpf: '234.567.890-11',
        rg: '32.114.556-7 SSP/SP',
        birthDate: '1989-11-22',
        phone: '(17) 99654-3210',
        email: 'carlos.mendes.cargas@gmail.com',
        zipCode: '15043-000',
        address: 'Av. Fortunato Ernesto Vetorasso, 1120',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '05874123690',
        cnhCategory: 'D',
        cnhExpiresAt: '2027-11-20',
        status: 'DISPONIVEL',
        rating: 4.8,
        completedTrips: 28,
        rntrc: '87654321',
        notes: 'Especialista em cargas secas e distribuição urbana/intermunicipal.',
        createdAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: 'driver-marcos-03',
        userId: 'user-driver-marcos',
        tenantId: 'tenant-translog-01',
        name: 'Marcos Antônio Rocha',
        cpf: '345.678.901-22',
        rg: '41.987.234-5 SSP/SP',
        birthDate: '1979-03-08',
        phone: '(19) 98765-4321',
        email: 'marcos.rocha.truck@gmail.com',
        zipCode: '13090-000',
        address: 'Av. José de Souza Campos, 890',
        city: 'Campinas',
        state: 'SP',
        cnh: '03214569870',
        cnhCategory: 'E',
        cnhExpiresAt: '2029-01-10',
        status: 'DISPONIVEL',
        rating: 5.0,
        completedTrips: 65,
        rntrc: '45678912',
        notes: 'Disponibilidade para fretes longos em todo território nacional.',
        createdAt: '2026-02-05T09:30:00.000Z'
      }
    ];

    // 4. Vehicles
    this.vehicles = [
      {
        id: 'vehicle-truck-01',
        driverId: 'driver-joao-01',
        tenantId: 'tenant-translog-01',
        type: 'TRUCK',
        brand: 'Mercedes-Benz',
        model: 'Atego 2426',
        year: 2022,
        plate: 'BRA2E19',
        renavam: '00987654321',
        capacityKg: 14000,
        capacityVolumeM3: 45,
        bodyType: 'BAU',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-01-15T15:40:00.000Z'
      },
      {
        id: 'vehicle-toco-02',
        driverId: 'driver-carlos-02',
        tenantId: 'tenant-translog-01',
        type: 'TOCO',
        brand: 'Volkswagen',
        model: 'Delivery 11.180',
        year: 2023,
        plate: 'RPO4C55',
        renavam: '00123456789',
        capacityKg: 7500,
        capacityVolumeM3: 32,
        bodyType: 'SIDER',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-01-18T10:15:00.000Z'
      },
      {
        id: 'vehicle-carreta-03',
        driverId: 'driver-marcos-03',
        tenantId: 'tenant-translog-01',
        type: 'CARRETA',
        brand: 'Scania',
        model: 'R450 6x2',
        year: 2021,
        plate: 'FXS8G90',
        renavam: '00456789123',
        capacityKg: 28000,
        capacityVolumeM3: 95,
        bodyType: 'GRADE_BAIXA',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-02-05T09:45:00.000Z'
      }
    ];

    // 5. Freights (Initial set matching the MVP prompt)
    this.freights = [
      {
        id: 'freight-0001',
        code: 'FRT-2026-0001',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '15015-000',
          address: 'Av. Alberto Andaló',
          number: '3100',
          neighborhood: 'Centro',
          city: 'São José do Rio Preto',
          state: 'SP',
          date: '2026-08-25',
          timeWindow: '08:00 às 11:00',
          contactName: 'Almoxarifado Central TransLog',
          contactPhone: '(17) 3214-5500'
        },
        destination: {
          zipCode: '01001-000',
          address: 'Praça da Sé / CD Mooca',
          number: '850',
          neighborhood: 'Mooca',
          city: 'São Paulo',
          state: 'SP',
          date: '2026-08-26',
          timeWindow: '14:00 às 18:00',
          contactName: 'Recepção CD Capital',
          contactPhone: '(11) 3344-9000'
        },
        distanceKm: 440,
        cargo: {
          description: 'Carga geral paletizada - Peças industriais e componentes automotivos',
          type: 'GERAL',
          weightKg: 8500,
          volumeCount: 16,
          dimensions: '16 pallets padrão PBR (1,00 x 1,20m)',
          requiresInsurance: true,
          notes: 'Carga com nota fiscal e manifesto eletrônico já emitidos. Necessário lonamento ou baú fechado.'
        },
        requirements: {
          vehicleType: 'TRUCK',
          bodyTypeRequired: 'BAU',
          minCapacityKg: 8000,
          helperRequired: false,
          trackerRequired: true,
          cnhMinCategory: 'C'
        },
        payment: {
          price: 1850.00,
          paymentMethod: 'PIX',
          tollIncluded: true,
          advancePercentage: 70,
          notes: '70% de adiantamento na confirmação do carregamento e 30% no comprovante de entrega assinado via app.'
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'RASCUNHO',
            timestamp: '2026-08-22T14:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Criação do pedido de frete inicial'
          },
          {
            status: 'PUBLICADO',
            timestamp: '2026-08-22T14:30:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Aprovado pelo operacional'
          },
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T15:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Liberado para aceite de motoristas com veículo Truck'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T14:00:00.000Z',
        updatedAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'freight-0002',
        code: 'FRT-2026-0002',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '13080-000',
          address: 'Rodovia Dom Pedro I',
          number: 'Km 132',
          neighborhood: 'Barão Geraldo',
          city: 'Campinas',
          state: 'SP',
          date: '2026-08-25',
          timeWindow: '07:00 às 10:00',
          contactName: 'Centro de Distribuição Sul',
          contactPhone: '(19) 3871-1200'
        },
        destination: {
          zipCode: '80010-000',
          address: 'Av. das Indústrias',
          number: '1420',
          neighborhood: 'CIC',
          city: 'Curitiba',
          state: 'PR',
          date: '2026-08-27',
          timeWindow: '08:00 às 12:00',
          contactName: 'Logística Paraná',
          contactPhone: '(41) 3232-4400'
        },
        distanceKm: 420,
        cargo: {
          description: 'Eletroeletrônicos e insumos de informática lacrados',
          type: 'GERAL',
          weightKg: 6200,
          volumeCount: 22,
          dimensions: '22 caixas paletizadas',
          requiresInsurance: true,
          notes: 'Carga de alto valor agregado com monitoramento obrigatório.'
        },
        requirements: {
          vehicleType: 'TOCO',
          bodyTypeRequired: 'SIDER',
          minCapacityKg: 6000,
          trackerRequired: true,
          cnhMinCategory: 'D'
        },
        payment: {
          price: 3200.00,
          paymentMethod: 'TRANSFERENCIA',
          tollIncluded: true,
          advancePercentage: 50,
          notes: 'Pagamento 50% saída + 50% após canhoto digital.'
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T16:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Frete disponibilizado para tocos e trucks'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T16:00:00.000Z',
        updatedAt: '2026-08-22T16:00:00.000Z'
      },
      {
        id: 'freight-0003',
        code: 'FRT-2026-0003',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '14055-000',
          address: 'Av. Bandeirantes',
          number: '2500',
          neighborhood: 'Vila Tibério',
          city: 'Ribeirão Preto',
          state: 'SP',
          date: '2026-08-26',
          timeWindow: '09:00 às 13:00'
        },
        destination: {
          zipCode: '30110-000',
          address: 'Anel Rodoviário',
          number: 'Km 12',
          neighborhood: 'Olhos D’Água',
          city: 'Belo Horizonte',
          state: 'MG',
          date: '2026-08-28',
          timeWindow: '08:00 às 16:00'
        },
        distanceKm: 510,
        cargo: {
          description: 'Bebidas embaladas em garrafas e latas',
          type: 'ALIMENTOS',
          weightKg: 24000,
          volumeCount: 30,
          requiresInsurance: true
        },
        requirements: {
          vehicleType: 'CARRETA',
          bodyTypeRequired: 'GRADE_BAIXA',
          minCapacityKg: 22000,
          cnhMinCategory: 'E'
        },
        payment: {
          price: 4950.00,
          paymentMethod: 'PIX',
          tollIncluded: true,
          advancePercentage: 70
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T16:45:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Frete pesado para Carreta liberado'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T16:45:00.000Z',
        updatedAt: '2026-08-22T16:45:00.000Z'
      },
      {
        id: 'freight-0004',
        code: 'FRT-2026-0004',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '11013-000',
          address: 'Avenida Portuária',
          number: '400',
          neighborhood: 'Porto',
          city: 'Santos',
          state: 'SP',
          date: '2026-08-21',
          timeWindow: '08:00'
        },
        destination: {
          zipCode: '74000-000',
          address: 'Distrito Agroindustrial',
          number: '120',
          neighborhood: 'Setor Sul',
          city: 'Goiânia',
          state: 'GO',
          date: '2026-08-24',
          timeWindow: '14:00'
        },
        distanceKm: 980,
        cargo: {
          description: 'Insumos agrícolas e adubos especiais',
          type: 'GERAL',
          weightKg: 12500,
          volumeCount: 20
        },
        requirements: {
          vehicleType: 'TRUCK',
          bodyTypeRequired: 'BAU',
          minCapacityKg: 12000,
          cnhMinCategory: 'C'
        },
        payment: {
          price: 5400.00,
          paymentMethod: 'PIX',
          tollIncluded: true
        },
        status: 'EM_TRANSITO',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-21T08:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira'
          },
          {
            status: 'RESERVADO',
            timestamp: '2026-08-21T09:15:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva',
            notes: 'Frete aceito pelo motorista João da Silva'
          },
          {
            status: 'EM_COLETA',
            timestamp: '2026-08-21T11:00:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva'
          },
          {
            status: 'COLETADO',
            timestamp: '2026-08-21T13:30:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva'
          },
          {
            status: 'EM_TRANSITO',
            timestamp: '2026-08-22T08:00:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva',
            location: 'Rod. Transbrasiliana - Km 340'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        assignedDriverId: 'driver-joao-01',
        assignedDriverName: 'João da Silva',
        assignedDriverPhone: '(17) 98112-9090',
        assignedVehiclePlate: 'BRA2E19',
        assignedVehicleModel: 'Mercedes-Benz Atego 2426',
        assignedAt: '2026-08-21T09:15:00.000Z',
        startedAt: '2026-08-21T11:00:00.000Z',
        collectedAt: '2026-08-21T13:30:00.000Z',
        inTransitAt: '2026-08-22T08:00:00.000Z',
        createdAt: '2026-08-21T08:00:00.000Z',
        updatedAt: '2026-08-22T08:00:00.000Z'
      }
    ];

    // 6. Configurable Forms (SaaS Form Builder)
    this.forms = [
      {
        id: 'form-checklist-elolog',
        tenantId: 'tenant-translog-01',
        title: 'Checklist / Vistoria de Entrega e Retirada de Veículo e Carga (Modelo Elo Log)',
        description: 'Modelo oficial de vistoria e checklist de entrega/retirada com conferência de documentos, avarias, 17 itens de equipamentos, odômetro (KM) e assinaturas de origem/destino.',
        category: 'CHECKLIST_ENTREGA',
        triggerEvent: 'NA_ENTREGA',
        active: true,
        fields: [
          { id: 'el_cliente', name: 'cliente', label: 'Cliente', type: 'text', required: true, order: 1 },
          { id: 'el_cliente_email', name: 'cliente_email', label: 'E-mail do Cliente / Notificação', type: 'email', required: false, order: 2 },
          { id: 'el_cliente_telefone', name: 'cliente_telefone', label: 'Telefone / WhatsApp Cliente', type: 'phone', required: false, order: 3 },
          { id: 'el_data_retirada', name: 'data_retirada', label: 'Data Retirada', type: 'date', required: true, order: 4 },
          { id: 'el_km_retirada', name: 'km_retirada', label: 'KM Retirada', type: 'number', required: true, order: 5 },
          { id: 'el_local_retirada', name: 'local_retirada', label: 'Local Retirada', type: 'text', required: true, order: 6 },
          { id: 'el_data_entrega', name: 'data_entrega', label: 'Data Entrega', type: 'date', required: true, order: 7 },
          { id: 'el_km_entrega', name: 'km_entrega', label: 'KM Entrega', type: 'number', required: true, order: 8 },
          { id: 'el_local_entrega', name: 'local_entrega', label: 'Local Entrega', type: 'text', required: true, order: 9 },
          { id: 'el_marca_veiculo', name: 'marca_veiculo', label: 'Marca do Veículo', type: 'select', options: ['Volkswagen', 'Mercedes-Benz', 'Iveco', 'Scania', 'Ford', 'Volvo', 'Outro'], required: true, order: 10 },
          { id: 'el_modelo', name: 'modelo', label: 'Modelo do Veículo', type: 'text', required: true, order: 11 },
          { id: 'el_cor', name: 'cor', label: 'Cor', type: 'text', required: true, order: 12 },
          { id: 'el_placa', name: 'placa', label: 'Placa', type: 'text', required: true, order: 13 },
          { id: 'el_chassi', name: 'chassi', label: 'Chassi', type: 'text', required: false, order: 14 },
          { id: 'el_docs', name: 'documentos', label: 'Documentos Presentes (CRLV, Danfe Veículo, Manual, Danfe Equipamento)', type: 'checkbox', options: ['CRLV', 'Danfe Veículo', 'Manual', 'Danfe Equipamento'], required: false, order: 15 },
          { id: 'el_avarias', name: 'avarias_resumo', label: 'Apontamento de Avarias (Lataria, Pintura, Parabrisa, Interior, Pneus)', type: 'textarea', placeholder: 'Detalhe se houver avarias...', required: false, order: 16 },
          { id: 'el_equipamentos', name: 'equipamentos_status', label: 'Conferência dos 17 Equipamentos Obrigatórios', type: 'radio', options: ['100% Conforme (Todos itens presentes)', 'Com Pendências / Ausências'], required: true, order: 17 },
          { id: 'el_resp_origem_nome', name: 'resp_origem_nome', label: 'Responsável Vistoria (Origem) - Nome', type: 'text', required: true, order: 18 },
          { id: 'el_resp_origem_cpf', name: 'resp_origem_cpf', label: 'Responsável Vistoria (Origem) - CPF', type: 'cpf', required: true, order: 19 },
          { id: 'el_resp_origem_email', name: 'resp_origem_email', label: 'Responsável Vistoria (Origem) - Email', type: 'email', required: false, order: 20 },
          { id: 'el_resp_origem_telefone', name: 'resp_origem_telefone', label: 'Responsável Vistoria (Origem) - Telefone', type: 'phone', required: false, order: 21 },
          { id: 'el_resp_origem_assinatura', name: 'resp_origem_assinatura', label: 'Assinatura Digital (Origem / Retirada)', type: 'signature', required: true, order: 22 },
          { id: 'el_resp_destino_nome', name: 'resp_destino_nome', label: 'Responsável Vistoria (Destino) - Nome', type: 'text', required: true, order: 23 },
          { id: 'el_resp_destino_cpf', name: 'resp_destino_cpf', label: 'Responsável Vistoria (Destino) - CPF', type: 'cpf', required: true, order: 24 },
          { id: 'el_resp_destino_email', name: 'resp_destino_email', label: 'Responsável Vistoria (Destino) - Email', type: 'email', required: false, order: 25 },
          { id: 'el_resp_destino_telefone', name: 'resp_destino_telefone', label: 'Responsável Vistoria (Destino) - Telefone', type: 'phone', required: false, order: 26 },
          { id: 'el_resp_destino_assinatura', name: 'resp_destino_assinatura', label: 'Assinatura Digital (Destino / Entrega)', type: 'signature', required: true, order: 27 },
          { id: 'el_condutor', name: 'condutor_elo', label: 'Condutor da ELO (Motorista)', type: 'text', required: true, order: 28 },
          { id: 'el_fotos', name: 'fotos_vistoria', label: 'Fotos do Veículo / Avarias / Painel KM', type: 'photo', required: false, order: 29 }
        ],
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: isoNow
      },
      {
        id: 'form-checklist-coleta',
        tenantId: 'tenant-translog-01',
        title: 'Checklist de Coleta e Inspeção de Carga',
        description: 'Formulário obrigatório executado pelo motorista no momento do carregamento da mercadoria.',
        category: 'CHECKLIST_COLETA',
        triggerEvent: 'DURANTE_COLETA',
        active: true,
        fields: [
          {
            id: 'f1',
            name: 'carga_conferida_com_nf',
            label: 'A quantidade de volumes confere com a Nota Fiscal?',
            type: 'radio',
            required: true,
            options: ['Sim, 100% conferido', 'Divergência parcial', 'Não foi possível contar'],
            order: 1
          },
          {
            id: 'f2',
            name: 'estado_embalagem',
            label: 'Qual o estado aparente das embalagens/pallets?',
            type: 'select',
            required: true,
            options: ['Excelente / Lacrado', 'Bom estado', 'Pequenas avarias superficiais', 'Embalagens rasgadas/danificadas'],
            order: 2
          },
          {
            id: 'f3',
            name: 'numero_lacre',
            label: 'Número do lacre do baú/sider (se aplicável)',
            type: 'text',
            placeholder: 'Ex: LCR-887412',
            required: false,
            order: 3
          },
          {
            id: 'f4',
            name: 'foto_carga_coleta',
            label: 'Foto da carga estivada no veículo',
            type: 'photo',
            required: true,
            order: 4
          },
          {
            id: 'f5',
            name: 'observacoes_coleta',
            label: 'Observações adicionais da coleta',
            type: 'textarea',
            placeholder: 'Descreva qualquer detalhe relevante sobre o carregamento...',
            required: false,
            order: 5
          }
        ],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: isoNow
      },
      {
        id: 'form-comprovante-entrega',
        tenantId: 'tenant-translog-01',
        title: 'Comprovante Digital de Entrega (Canhoto & Assinatura)',
        description: 'Formulário para finalização do frete com captura do canhoto assinado e dados do recebedor.',
        category: 'COMPROVANTE_ENTREGA',
        triggerEvent: 'NA_ENTREGA',
        active: true,
        fields: [
          {
            id: 'f10',
            name: 'nome_recebedor',
            label: 'Nome completo do recebedor na descarga',
            type: 'text',
            placeholder: 'Nome de quem recebeu e conferiu',
            required: true,
            order: 1
          },
          {
            id: 'f11',
            name: 'documento_recebedor',
            label: 'CPF ou RG do recebedor',
            type: 'text',
            placeholder: 'Ex: 123.456.789-00',
            required: true,
            order: 2
          },
          {
            id: 'f12',
            name: 'foto_canhoto_assinado',
            label: 'Foto nítida do canhoto da Nota Fiscal assinado e carimbado',
            type: 'photo',
            required: true,
            order: 3
          },
          {
            id: 'f13',
            name: 'assinatura_digital',
            label: 'Assinatura digital do recebedor na tela',
            type: 'signature',
            required: true,
            order: 4
          },
          {
            id: 'f14',
            name: 'ocorrencia_descarga',
            label: 'Houve alguma ressalva ou ocorrência na entrega?',
            type: 'radio',
            required: true,
            options: ['Entrega realizada sem ressalvas', 'Avaria parcial apontada no canhoto', 'Falta de mercadoria'],
            order: 5
          }
        ],
        createdAt: '2026-01-22T14:00:00.000Z',
        updatedAt: isoNow
      }
    ];

    // 7. Notifications
    this.notifications = [
      {
        id: 'notif-001',
        tenantId: 'tenant-translog-01',
        userId: 'user-driver-joao',
        freightId: 'freight-0001',
        type: 'FRETE_DISPONIVEL',
        title: '🚚 Novo frete disponível para seu perfil!',
        message: 'São José do Rio Preto/SP ➡️ São Paulo/SP | Valor: R$ 1.850,00 (Veículo Truck)',
        read: false,
        createdAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'notif-002',
        tenantId: 'tenant-translog-01',
        userId: 'user-admin-1',
        freightId: 'freight-0004',
        type: 'STATUS_ATUALIZADO',
        title: '📍 Frete #FRT-2026-0004 em trânsito',
        message: 'O motorista João da Silva iniciou a viagem de Santos/SP para Goiânia/GO.',
        read: true,
        createdAt: '2026-08-22T08:05:00.000Z'
      }
    ];

    // 8. Audit Logs
    this.auditLogs = [
      {
        id: 'audit-001',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-admin-1',
        userName: 'Mariana Silveira',
        userRole: 'ADMIN',
        action: 'PUBLICACAO_FRETE',
        entity: 'Freight',
        entityId: 'freight-0001',
        details: 'Publicou o frete FRT-2026-0001 (São José do Rio Preto/SP -> São Paulo/SP, R$ 1.850,00)',
        ip: '189.45.112.90',
        createdAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'audit-002',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-driver-joao',
        userName: 'João da Silva',
        userRole: 'MOTORISTA',
        action: 'ACEITE_FRETE',
        entity: 'Freight',
        entityId: 'freight-0004',
        details: 'Motorista aceitou e reservou o frete FRT-2026-0004 (Santos/SP -> Goiânia/GO)',
        ip: '177.33.201.12',
        createdAt: '2026-08-21T09:15:00.000Z'
      },
      {
        id: 'audit-003',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-empresa-superadmin-1',
        userName: 'Carlos Alberto Ferreira',
        userRole: 'EMPRESA_SUPER_ADMIN',
        action: 'CRIACAO_FORMULARIO',
        entity: 'FormDefinition',
        entityId: 'form-comprovante-entrega',
        details: 'Configurou o formulário de Comprovante Digital de Entrega',
        ip: '189.45.112.90',
        createdAt: '2026-01-22T14:00:00.000Z'
      }
    ];

    // Seed Trip Expenses & Accountability Reports
    this.tripExpenses = [
      {
        id: 'exp-rep-001',
        tenantId: 'tenant-translog-01',
        freightId: 'freight-001',
        freightCode: 'FRT-2026-0001',
        driverId: 'driver-001',
        driverName: 'Marcos Vinicius da Silva',
        driverPhone: '(11) 98765-4321',
        vehiclePlate: 'BRA2E19',
        startDate: '2026-08-20',
        endDate: '2026-08-23',
        tripDays: 4,
        initialKm: 142300,
        finalKm: 144180,
        totalKm: 1880,
        totalLiters: 650,
        averageKmPerLiter: 2.89,
        costPerKm: 2.38,
        advanceAmount: 5000.00,
        totalExpenses: 4478.50,
        balanceAmount: 521.50,
        balanceStatus: 'A_DEVOLVER',
        status: 'ENVIADO',
        generalNotes: 'Viagem tranquila entre Santos/SP e Cuiabá/MT. Abastecimentos realizados nos postos conveniados.',
        items: [
          {
            id: 'item-exp-1',
            category: 'ABASTECIMENTO',
            date: '2026-08-20',
            description: 'Abastecimento Diesel S10 320L',
            establishmentName: 'Posto Graal Rodovia dos Bandeirantes',
            documentNumber: 'NF-e 883921',
            amount: 1984.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            liters: 320,
            pricePerLiter: 6.20,
            odometerKm: 142450,
            fuelType: 'DIESEL_S10',
            createdAt: '2026-08-20T11:30:00Z'
          },
          {
            id: 'item-exp-2',
            category: 'PEDAGIO',
            date: '2026-08-20',
            description: 'Recarga de Tag Sem Parar',
            establishmentName: 'AutoBAn Concessionária',
            documentNumber: 'REC-3901',
            amount: 420.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            createdAt: '2026-08-20T08:00:00Z'
          },
          {
            id: 'item-exp-3',
            category: 'HOSPEDAGEM',
            date: '2026-08-21',
            description: 'Pernoite e Estacionamento Seguro',
            establishmentName: 'Hotel Trevo Rondonópolis',
            documentNumber: 'NFS-e 4492',
            amount: 180.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            nightsCount: 1,
            createdAt: '2026-08-21T21:00:00Z'
          },
          {
            id: 'item-exp-4',
            category: 'ABASTECIMENTO',
            date: '2026-08-22',
            description: 'Abastecimento Diesel S10 330L',
            establishmentName: 'Posto Ipiranga Rondonópolis MT',
            documentNumber: 'NF-e 992014',
            amount: 2079.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            liters: 330,
            pricePerLiter: 6.30,
            odometerKm: 143600,
            fuelType: 'DIESEL_S10',
            createdAt: '2026-08-22T14:45:00Z'
          },
          {
            id: 'item-exp-5',
            category: 'ALIMENTACAO',
            date: '2026-08-22',
            description: 'Almoço e janta no trajeto',
            establishmentName: 'Restaurante Estrada Real',
            documentNumber: 'CF 5591',
            amount: 85.50,
            paymentMethod: 'DINHEIRO_PROPRIO',
            createdAt: '2026-08-22T19:30:00Z'
          },
          {
            id: 'item-exp-6',
            category: 'LOCOMOCAO_URBANA',
            date: '2026-08-23',
            description: 'Deslocamento Uber do pátio ao hotel',
            establishmentName: 'Uber Brasil',
            documentNumber: 'UBR-99201',
            amount: 40.00,
            paymentMethod: 'PIX_PROPRIO',
            transportOrigin: 'Pátio Logístico Cuiabá',
            transportDestination: 'Hotel Central',
            createdAt: '2026-08-23T18:00:00Z'
          }
        ],
        createdAt: '2026-08-23T14:00:00.000Z',
        updatedAt: '2026-08-23T14:00:00.000Z'
      }
    ];
  }

  private ensurePublicDemoData(): void {
    const now = new Date().toISOString();
    const demoTenant: Tenant = {
      id: PUBLIC_DEMO_TENANT_ID,
      name: 'TransLog Demonstração',
      legalName: 'TransLog Demonstração Ltda.',
      cnpj: '00.000.000/0001-00',
      email: 'demo@atendo-one.example',
      phone: '5517000000000',
      zipCode: '15000-000',
      address: 'Avenida da Demonstração',
      number: '100',
      neighborhood: 'Centro',
      city: 'São José do Rio Preto',
      state: 'SP',
      status: 'ATIVA',
      plan: 'PROFISSIONAL',
      planLimits: { maxUsers: 20, maxDrivers: 50, maxFreightsMonthly: 200, customForms: true, exportReports: true, prioritySupport: false },
      allowedOperations: ['CARGA_GERAL', 'LOGISTICA_VEICULOS'],
      billingStatus: 'INACTIVE',
      notificationPlan: 'SAAS_FREE',
      notificationBillingStatus: 'NOT_REQUIRED',
      atendoCrmProvisioningStatus: 'NOT_CONFIGURED',
      isDemo: true,
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: now
    };
    const existingTenant = this.tenants.find(item => item.id === PUBLIC_DEMO_TENANT_ID);
    if (!existingTenant) this.tenants.push(demoTenant);
    else Object.assign(existingTenant, { ...demoTenant, createdAt: existingTenant.createdAt || demoTenant.createdAt });

    const demoUsers: User[] = [
      {
        id: PUBLIC_DEMO_PRIMARY_USER_ID,
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: 'Camila Ribeiro (Administradora de Demonstração)',
        email: 'demo.admin@atendo-one.example',
        phone: '5517000000001',
        role: 'EMPRESA_SUPER_ADMIN',
        status: 'ATIVO',
        accountType: 'TEST',
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: 'ADMIN' },
        lastLoginAt: now,
        createdAt: '2026-08-27T00:01:00.000Z'
      },
      {
        id: 'user-demo-supervisor',
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: 'Rafael Lima (Supervisor)',
        email: 'demo.supervisor@atendo-one.example',
        phone: '5517000000002',
        role: 'SUPERVISOR',
        status: 'ATIVO',
        accountType: 'TEST',
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: 'ADMIN' },
        lastLoginAt: now,
        createdAt: '2026-08-27T00:02:00.000Z'
      },
      {
        id: 'user-demo-operator',
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: 'Bianca Alves (Operadora)',
        email: 'demo.operador@atendo-one.example',
        phone: '5517000000003',
        role: 'USUARIO',
        status: 'ATIVO',
        accountType: 'TEST',
        readOnly: true,
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: 'ADMIN' },
        lastLoginAt: now,
        createdAt: '2026-08-27T00:03:00.000Z'
      },
      {
        id: 'user-demo-driver',
        tenantId: PUBLIC_DEMO_TENANT_ID,
        name: 'Diego Martins (Motorista)',
        email: 'demo.motorista@atendo-one.example',
        phone: '5517000000004',
        role: 'MOTORISTA',
        status: 'ATIVO',
        accountType: 'TEST',
        readOnly: true,
        driverId: 'driver-demo-01',
        notificationConsents: { email: true, whatsapp: false, updatedAt: now, source: 'ADMIN' },
        lastLoginAt: now,
        createdAt: '2026-08-27T00:04:00.000Z'
      }
    ];
    for (const user of demoUsers) {
      const existing = this.users.find(item => item.id === user.id);
      if (!existing) this.users.push(user);
      else Object.assign(existing, { ...user, createdAt: existing.createdAt || user.createdAt });
    }

    const demoDriver: Driver = {
      id: 'driver-demo-01',
      userId: 'user-demo-driver',
      tenantId: PUBLIC_DEMO_TENANT_ID,
      name: 'Diego Martins',
      cpf: '000.000.000-00',
      rg: '00.000.000-0',
      birthDate: '1988-04-15',
      phone: '5517000000004',
      email: 'demo.motorista@atendo-one.example',
      zipCode: '15000-001',
      address: 'Rua do Exemplo',
      city: 'São José do Rio Preto',
      state: 'SP',
      cnh: '00000000000',
      cnhCategory: 'E',
      cnhExpiresAt: '2030-12-31',
      status: 'DISPONIVEL',
      rating: 4.9,
      completedTrips: 28,
      vehiclesCount: 1,
      rntrc: '00000000',
      notes: 'Registro fictício exclusivo para demonstração.',
      createdAt: '2026-08-27T00:05:00.000Z',
      updatedAt: now
    };
    const existingDriver = this.drivers.find(item => item.id === demoDriver.id);
    if (!existingDriver) this.drivers.push(demoDriver);
    else Object.assign(existingDriver, demoDriver);

    const demoVehicle: Vehicle = {
      id: 'vehicle-demo-01',
      driverId: 'driver-demo-01',
      tenantId: PUBLIC_DEMO_TENANT_ID,
      type: 'TRUCK',
      brand: 'Volvo',
      model: 'FH 460 Demonstração',
      year: 2024,
      plate: 'DEM0-001',
      renavam: '00000000000',
      capacityKg: 23000,
      capacityVolumeM3: 90,
      bodyType: 'SIDER',
      status: 'ATIVO',
      trackerInstalled: true,
      createdAt: '2026-08-27T00:06:00.000Z'
    };
    if (!this.vehicles.some(item => item.id === demoVehicle.id)) this.vehicles.push(demoVehicle);
    const demoCompanyVehicle: CompanyVehicle = {
      id: 'company-vehicle-demo-01',
      tenantId: PUBLIC_DEMO_TENANT_ID,
      type: 'CARRETA',
      brand: 'Scania',
      model: 'R 450 Demonstração',
      year: 2023,
      plate: 'DEM0-002',
      renavam: '00000000001',
      capacityKg: 32000,
      bodyType: 'BAU',
      ownerName: 'TransLog Demonstração',
      ownerCnpj: '00.000.000/0001-00',
      registrationState: 'SP',
      crlvNumber: 'CRLV-DEMO-002',
      status: 'ATIVO',
      notes: 'Veículo fictício para demonstração.',
      createdAt: '2026-08-27T00:07:00.000Z',
      updatedAt: now
    };
    if (!this.companyVehicles.some(item => item.id === demoCompanyVehicle.id)) this.companyVehicles.push(demoCompanyVehicle);

    const demoFreight: Freight = {
      id: 'freight-demo-01',
      code: 'DEMO-2026-0001',
      tenantId: PUBLIC_DEMO_TENANT_ID,
      tenantName: demoTenant.name,
      operationType: 'CARGA_GERAL',
      origin: { zipCode: '15000-010', address: 'Rua da Coleta', number: '200', neighborhood: 'Distrito Logístico', city: 'São José do Rio Preto', state: 'SP', date: '2026-08-28', timeWindow: '08:00 - 10:00', contactName: 'Central de Demonstração', contactPhone: '5517000000010' },
      destination: { zipCode: '13000-010', address: 'Avenida da Entrega', number: '500', neighborhood: 'Centro Industrial', city: 'Campinas', state: 'SP', date: '2026-08-29', timeWindow: '14:00 - 17:00', contactName: 'Recebimento Demo', contactPhone: '5517000000011' },
      distanceKm: 320,
      cargo: { description: 'Equipamentos logísticos de demonstração', type: 'GERAL', weightKg: 12000, volumeCount: 18, dimensions: 'Paletizado', requiresInsurance: false, notes: 'Dados fictícios; nenhum cliente real está envolvido.' },
      requirements: { vehicleType: 'TRUCK', bodyTypeRequired: 'SIDER', minCapacityKg: 15000, helperRequired: false, trackerRequired: true, cnhMinCategory: 'E' },
      payment: { price: 1850, clientRevenue: 2400, driverCost: 1850, paymentMethod: 'PIX', tollIncluded: true, advancePercentage: 50, notes: 'Valor meramente demonstrativo.' },
      status: 'DISPONIVEL',
      statusHistory: [{ status: 'RASCUNHO', timestamp: '2026-08-27T00:10:00.000Z', changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: 'Camila Ribeiro', notes: 'Frete de demonstração criado.' }, { status: 'PUBLICADO', timestamp: '2026-08-27T00:11:00.000Z', changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: 'Camila Ribeiro' }, { status: 'DISPONIVEL', timestamp: '2026-08-27T00:12:00.000Z', changedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, changedByName: 'Camila Ribeiro' }],
      createdByUserId: PUBLIC_DEMO_PRIMARY_USER_ID,
      createdByName: 'Camila Ribeiro',
      assignedDriverId: 'driver-demo-01',
      assignedDriverName: 'Diego Martins',
      assignedDriverPhone: '5517000000004',
      assignedVehiclePlate: 'DEM0-001',
      assignedVehicleModel: 'Volvo FH 460 Demonstração',
      assignedAt: '2026-08-27T00:13:00.000Z',
      createdAt: '2026-08-27T00:10:00.000Z',
      updatedAt: now
    };
    if (!this.freights.some(item => item.id === demoFreight.id)) this.freights.push(demoFreight);

    const demoForm: FormDefinition = {
      id: 'form-demo-checklist',
      tenantId: PUBLIC_DEMO_TENANT_ID,
      title: 'Checklist de Coleta — Demonstração',
      description: 'Formulário fictício para visualizar a operação de coleta.',
      category: 'CHECKLIST_COLETA',
      fields: [{ id: 'demo_nf', name: 'nota_fiscal', label: 'Nota fiscal conferida?', type: 'checkbox', required: true, order: 1 }, { id: 'demo_avarias', name: 'avarias', label: 'Há avarias?', type: 'radio', options: ['Não', 'Sim'], required: true, order: 2 }, { id: 'demo_observacao', name: 'observacao', label: 'Observações', type: 'textarea', required: false, order: 3 }],
      triggerEvent: 'DURANTE_COLETA',
      active: true,
      createdAt: '2026-08-27T00:14:00.000Z',
      updatedAt: now
    };
    if (!this.forms.some(item => item.id === demoForm.id)) this.forms.push(demoForm);
    const demoResponse: FormResponse = { id: 'response-demo-01', formId: demoForm.id, formTitle: demoForm.title, tenantId: PUBLIC_DEMO_TENANT_ID, freightId: demoFreight.id, driverId: demoDriver.id, filledByUserId: 'user-demo-driver', filledByName: demoDriver.name, stage: 'COMPLETO', isDraft: false, answers: { nota_fiscal: true, avarias: 'Não', observacao: 'Coleta concluída no ambiente demonstrativo.' }, createdAt: '2026-08-27T00:15:00.000Z', updatedAt: now };
    if (!this.formResponses.some(item => item.id === demoResponse.id)) this.formResponses.push(demoResponse);

    const demoNotifications: AppNotification[] = [
      { id: 'notification-demo-01', tenantId: PUBLIC_DEMO_TENANT_ID, userId: PUBLIC_DEMO_PRIMARY_USER_ID, freightId: demoFreight.id, type: 'STATUS_ATUALIZADO', title: 'Frete DEMO-2026-0001 disponível', message: 'A operação demonstrativa possui um frete pronto para acompanhamento.', read: false, createdAt: '2026-08-27T00:16:00.000Z' },
      { id: 'notification-demo-02', tenantId: PUBLIC_DEMO_TENANT_ID, userId: PUBLIC_DEMO_PRIMARY_USER_ID, type: 'SISTEMA', title: 'Ambiente de demonstração', message: 'Os dados desta empresa são fictícios e as alterações operacionais são bloqueadas.', read: false, createdAt: '2026-08-27T00:17:00.000Z' }
    ];
    for (const notification of demoNotifications) if (!this.notifications.some(item => item.id === notification.id)) this.notifications.push(notification);

    const demoLink: DriverCompanyLink = { id: 'link-demo-01', driverId: demoDriver.id, tenantId: PUBLIC_DEMO_TENANT_ID, status: 'APROVADO', scope: 'EMPRESA', source: 'COMPANY_ADMIN_REGISTRATION', approvedAt: '2026-08-27T00:18:00.000Z', approvedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, createdAt: '2026-08-27T00:18:00.000Z', updatedAt: now };
    if (!this.driverCompanyLinks.some(item => item.id === demoLink.id)) this.driverCompanyLinks.push(demoLink);
    const demoInterest: FreightInterest = { id: 'interest-demo-01', freightId: demoFreight.id, driverId: demoDriver.id, userId: 'user-demo-driver', tenantId: PUBLIC_DEMO_TENANT_ID, status: 'APROVADO', createdAt: '2026-08-27T00:19:00.000Z', updatedAt: now, reviewedAt: '2026-08-27T00:20:00.000Z', reviewedByUserId: PUBLIC_DEMO_PRIMARY_USER_ID, notes: 'Interesse fictício aprovado para demonstração.', profileCompleted: true };
    if (!this.freightInterests.some(item => item.id === demoInterest.id)) this.freightInterests.push(demoInterest);
  }

  getNextTalaoNumber(): string {
    let highest = 0;
    for (const resp of this.formResponses) {
      if (resp.answers && resp.answers.talaoNumber) {
        const raw = String(resp.answers.talaoNumber).replace(/\D/g, '');
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n > highest && n < 100000) {
          highest = n;
        }
      }
    }
    const nextVal = highest + 1;
    return String(nextVal).padStart(3, '0');
  }
}

// Export singleton instance
export const db = new DatabaseStore();
