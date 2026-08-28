export interface WebPage {
  id: string;
  tenantId: string | null; // null for global/superadmin
  slug: string;
  title: string;
  content: string; // HTML or Markdown
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  publicPath?: 'conteudo' | 'elo-log';
  coverImageUrl?: string;
  isPublished: boolean;
  isIndexable?: boolean;
  isSystemLocked?: boolean;
  contentVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  tenantId: string | null; // null for global/superadmin
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  author: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  isIndexable?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'EMPRESA_SUPER_ADMIN' 
  | 'ADMIN' 
  | 'SUPERVISOR' 
  | 'USUARIO' 
  | 'MOTORISTA';

export type TenantStatus = 'ATIVA' | 'INATIVA' | 'BLOQUEADA' | 'PENDENTE';
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'PENDENTE';
export type DriverStatus = 'DISPONIVEL' | 'EM_VIAGEM' | 'INATIVO' | 'PENDENTE';
export type VehicleStatus = 'ATIVO' | 'MANUTENCAO' | 'INATIVO';

export type VehicleType = 
  | 'TRUCK' 
  | 'TOCO' 
  | 'CARRETA' 
  | 'BITREM' 
  | 'RODOTREM'
  | 'VUC' 
  | 'FIORINO' 
  | 'UTILITARIO' 
  | 'VAN';

export type BodyType = 
  | 'BAU' 
  | 'SIDER' 
  | 'GRADE_BAIXA' 
  | 'GRANELEIRO' 
  | 'REFRIGERADO' 
  | 'CACAMBA' 
  | 'PLATAFORMA'
  | 'TANQUE';

export type CargoType = 
  | 'GERAL' 
  | 'FRAGIL' 
  | 'REFRIGERADA' 
  | 'PERIGOSA' 
  | 'ALIMENTOS' 
  | 'CONSTRUCAO' 
  | 'MAQUINARIO'
  | 'GRAOS';

export type PaymentMethod = 
  | 'TRANSFERENCIA' 
  | 'PIX' 
  | 'A_VISTA' 
  | 'FATURADO_30D'
  | 'FATURADO_15D'
  | 'ADIANTAMENTO_70_30';

export type FreightStatus = 
  | 'RASCUNHO' 
  | 'PUBLICADO' 
  | 'DISPONIVEL' 
  | 'RESERVADO' 
  | 'EM_COLETA' 
  | 'COLETADO' 
  | 'EM_TRANSITO' 
  | 'ENTREGUE' 
  | 'FINALIZADO' 
  | 'CANCELADO';

export interface TenantPlanLimits {
  maxUsers: number;
  maxDrivers: number;
  maxFreightsMonthly: number;
  customForms: boolean;
  exportReports: boolean;
  prioritySupport: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  status: TenantStatus;
  plan: 'BASICO' | 'PROFISSIONAL' | 'EMPRESARIAL';
  planLimits: TenantPlanLimits;
  allowedOperations?: OperationType[];
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  billingStatus?: 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'INACTIVE' | 'CANCELED';
  billingCycle?: string;
  billingNextDueDate?: string;
  notificationPlan?: NotificationModulePlan;
  notificationBillingStatus?: NotificationBillingStatus;
  notificationSubscriptionId?: string;
  notificationBillingNextDueDate?: string;
  isDemo?: boolean;
  atendoCrmTenantId?: string;
  atendoCrmProvisioningStatus?: 'NOT_REQUESTED' | 'PENDING' | 'PROVISIONED' | 'ERROR' | 'NOT_CONFIGURED';
  atendoCrmProvisioningError?: string;
  atendoCrmProvisionedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationConsent {
  email: boolean;
  whatsapp: boolean;
  updatedAt?: string;
  source?: 'USER' | 'ADMIN' | 'REGISTRATION';
}

export interface User {
  id: string;
  tenantId: string | null; // null for SUPER_ADMIN
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  accountType?: 'REAL' | 'TEST';
  readOnly?: boolean;
  notificationConsents?: NotificationConsent;
  driverId?: string; // If role is MOTORISTA
  password?: string; // For company logins
  lastLoginAt?: string;
  termsAcceptedAt?: string;
  privacyAcceptedAt?: string;
  termsVersion?: string;
  privacyVersion?: string;
  createdAt: string;
  updatedAt?: string;
  activeSessionId?: string;
  activeSessionExpiresAt?: string;
}

export interface LegalDocumentVersion {
  id: string;
  documentType: 'TERMS' | 'PRIVACY';
  version: string;
  title: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt: string;
  createdAt: string;
  createdByUserId?: string;
  createdByName?: string;
  changeNote?: string;
}

export interface SupportSessionInfo {
  id: string;
  targetUser: Pick<User, 'id' | 'name' | 'email' | 'role' | 'tenantId'>;
  actorUser: Pick<User, 'id' | 'name' | 'email' | 'role' | 'tenantId'>;
  expiresAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  tenantId: string | null;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  zipCode: string;
  address: string;
  city: string;
  state: string;
  cnh: string;
  cnhCategory: 'B' | 'C' | 'D' | 'E';
  cnhExpiresAt: string;
  status: DriverStatus;
  rating: number;
  completedTrips: number;
  vehiclesCount?: number;
  rntrc?: string;
  notes?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKeyType?: string;
  pixKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DriverCompanyLinkStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'BLOQUEADO';
export type DriverCompanyLinkScope = 'FRETE' | 'EMPRESA';
export interface DriverCompanyLink {
  id: string;
  driverId: string;
  tenantId: string;
  status: DriverCompanyLinkStatus;
  scope: DriverCompanyLinkScope;
  source: 'FREIGHT_INTEREST' | 'IMPORTACAO' | 'CONVITE' | 'COMPANY_ADMIN_REGISTRATION';
  freightId?: string;
  approvedAt?: string;
  approvedByUserId?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
export type FreightInterestStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'CANCELADO';
export interface FreightInterest {
  id: string;
  freightId: string;
  driverId: string;
  userId: string;
  tenantId: string;
  status: FreightInterestStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  notes?: string;
  profileCompleted?: boolean;
}
export interface CompanyVehicle {
  id: string;
  tenantId: string | null;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  renavam: string;
  capacityKg: number;
  bodyType: BodyType;
  ownerName?: string;
  ownerCnpj?: string;
  registrationState?: string;
  crlvNumber?: string;
  status: VehicleStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
export interface PublicFreightSummary {
  id: string;
  code: string;
  operationType: OperationType;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  date: string;
  cargoType: string;
  weightKg: number;
  vehicleType: VehicleType;
  bodyType?: BodyType;
  minCapacityKg: number;
  interestEnabled: boolean;
  publishedAt?: string;
}
export interface Vehicle {
  id: string;
  driverId: string;
  tenantId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  renavam: string;
  capacityKg: number;
  capacityVolumeM3?: number;
  bodyType: BodyType;
  status: VehicleStatus;
  trackerInstalled?: boolean;
  createdAt: string;
}

export interface FreightLocation {
  zipCode: string;
  address: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  date: string;
  timeWindow?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface FreightCargo {
  description: string;
  type: CargoType | 'VEICULO';
  weightKg: number;
  volumeCount: number;
  dimensions?: string;
  requiresInsurance?: boolean;
  notes?: string;
  
  // Detalhes da Carga / Veículo Transportado (Liberado após aceite)
  vehicleProduct?: string;
  chassis?: string;
  nfVehicleSale?: string;
  nfFacchini?: string;
  trackerStatus?: string;
  platesStatus?: string;
}

export interface FreightRequirements {
  vehicleType: VehicleType;
  vehicleBrand?: string;
  bodyTypeRequired?: BodyType;
  minCapacityKg: number;
  helperRequired?: boolean;
  trackerRequired?: boolean;
  cnhMinCategory?: 'B' | 'C' | 'D' | 'E';
}

export interface FreightPayment {
  price: number; // Used for general cargo or as a fallback
  clientRevenue?: number; // Valor cobrado do cliente (NF/CT-e)
  driverCost?: number; // Valor repassado ao motorista
  paymentMethod: PaymentMethod;
  tollIncluded: boolean;
  advancePercentage?: number;
  notes?: string;
}

export type OperationType = 'CARGA_GERAL' | 'LOGISTICA_VEICULOS';

export interface FreightStatusHistoryEntry {
  status: FreightStatus;
  timestamp: string;
  changedByUserId: string;
  changedByName: string;
  notes?: string;
  location?: string;
}

export interface Freight {
  id: string;
  code: string;
  tenantId: string;
  tenantName?: string;
  operationType?: OperationType;
  origin: FreightLocation;
  destination: FreightLocation;
  distanceKm: number;
  cargo: FreightCargo;
  requirements: FreightRequirements;
  payment: FreightPayment;
  status: FreightStatus;
  statusHistory: FreightStatusHistoryEntry[];
  createdByUserId: string;
  createdByName: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehiclePlate?: string;
  assignedVehicleModel?: string;
  assignedAt?: string;
  startedAt?: string;
  collectedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  formResponsesCount?: number;
  createdAt: string;
  updatedAt: string;
  customData?: Record<string, any>;
  companyVehicleId?: string;
  companyVehicle?: CompanyVehicle;
  publicListingEnabled?: boolean;
  publicPriceVisibleToRegistered?: boolean;
  publicInterestEnabled?: boolean;
  publicPublishedAt?: string;
}

export type NotificationType = 
  | 'FRETE_DISPONIVEL' 
  | 'FRETE_PUBLICADO'
  | 'FRETE_ACEITO' 
  | 'STATUS_ATUALIZADO' 
  | 'FRETE_CANCELADO' 
  | 'EMPRESA_CADASTRADA'
  | 'EMPRESA_APROVADA'
  | 'USUARIO_CADASTRADO'
  | 'USUARIO_STATUS_ATUALIZADO'
  | 'MOTORISTA_CADASTRADO'
  | 'INTERESSE_FRETE'
  | 'PAGAMENTO_CRIADO'
  | 'SISTEMA';

export interface AppNotification {
  id: string;
  tenantId: string | null;
  userId: string;
  freightId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type NotificationChannel = 'email' | 'whatsapp' | 'inApp';
export type NotificationDeliveryStatus = 'PENDENTE' | 'ENVIADO' | 'FALHOU' | 'IGNORADO';
export interface NotificationDelivery {
  id: string;
  eventKey: string;
  tenantId: string | null;
  userId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  subject?: string;
  providerMessageId?: string;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}
export type NotificationCategory = 'USUARIO' | 'EMPRESA' | 'FRETE' | 'PAGAMENTO' | 'SISTEMA';

export interface NotificationTemplate {
  id: string;
  eventKey: string;
  label: string;
  description: string;
  category: NotificationCategory;
  enabled: boolean;
  editable: boolean;
  systemLocked?: boolean;
  channels: {
    email: boolean;
    whatsapp: boolean;
    inApp: boolean;
  };
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  variables: string[];
  updatedAt?: string;
  source?: 'GLOBAL' | 'TENANT';
}

export type ReportTemplateType = 'EXPENSE' | 'CHECKLIST';

export interface TenantReportTemplate {
  tenantId?: string;
  type: ReportTemplateType;
  title: string;
  subtitle: string;
  approvalLabel: string;
  signatureLabel: string;
  notes: string;
  updatedAt?: string;
  source?: 'DEFAULT' | 'TENANT';
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'cpf' 
  | 'cnpj' 
  | 'phone' 
  | 'email' 
  | 'date' 
  | 'time' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'file' 
  | 'photo' 
  | 'signature';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select, radio, checkbox
  order: number;
}

export type FormEventTrigger = 
  | 'ANTES_COLETA' 
  | 'DURANTE_COLETA' 
  | 'EM_TRANSITO' 
  | 'NA_ENTREGA' 
  | 'FINALIZACAO' 
  | 'MANUAL';

export interface FormDefinition {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: 'CHECKLIST_COLETA' | 'CHECKLIST_ENTREGA' | 'COMPROVANTE_ENTREGA' | 'AVALIACAO_MOTORISTA' | 'CADASTRO_MOTORISTA' | 'OCORRENCIA';
  fields: FormField[];
  triggerEvent: FormEventTrigger;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  tenantId: string;
  freightId?: string;
  driverId?: string;
  filledByUserId: string;
  filledByName: string;
  stage?: 'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO';
  isDraft?: boolean;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface ErrorLogEntry {
  id: string;
  correlationId: string;
  createdAt: string;
  service: string;
  route?: string;
  method?: string;
  statusCode?: number;
  event?: string;
  message: string;
  tenantId?: string;
  userId?: string;
}
export interface VisitAnalyticsBucket {
  date: string;
  path: string;
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  device: string;
  country: string;
  visits: number;
}
export interface VisitAnalyticsRow {
  label: string;
  visits: number;
}
export interface VisitAnalyticsResponse {
  days: number;
  generatedAt: string;
  totalVisits: number;
  bySource: VisitAnalyticsRow[];
  byPath: VisitAnalyticsRow[];
  byCampaign: VisitAnalyticsRow[];
  byReferrer: VisitAnalyticsRow[];
  byDevice: VisitAnalyticsRow[];
  byCountry: VisitAnalyticsRow[];
  daily: VisitAnalyticsRow[];
}
export interface AuditLog {
  id: string;
  tenantId?: string;
  tenantName?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ip?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalFreights: number;
  availableFreights: number;
  reservedFreights: number;
  inProgressFreights: number;
  completedFreights: number;
  cancelledFreights: number;
  totalFreightValue: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  totalUsers: number;
  recentFreights: Freight[];
  recentActivities: AuditLog[];
}

export type WhatsAppConnectionStatus = 'UNKNOWN' | 'DISCONNECTED' | 'QR_AVAILABLE' | 'PAIRING_CODE_AVAILABLE' | 'CONNECTED' | 'ERROR' | 'PENDING';

export interface WhatsAppConfig {
  baseUrl: string;
  token: string;
  provider?: 'WHAZING';
  defaultChannelNumber?: string;
  isActive: boolean;
  autoNotifyChecklist: boolean;
  autoNotifyFreightStatus: boolean;
  connectionStatus?: WhatsAppConnectionStatus;
  lastStatusCheckedAt?: string;
  lastConnectionError?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'ERROR';
  lastTestMessage?: string;
}

export interface WhatsAppPairingResult {
  success: boolean;
  status: WhatsAppConnectionStatus;
  message: string;
  pairingCode?: string;
  qrCode?: string;
  expiresInSeconds?: number;
}
export interface WhatsAppNotificationPayload {
  phone: string;
  message: string;
  freightCode?: string;
  templateType?: string;
  externalKey?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  useButtonApi?: boolean;
  buttons?: Array<{ id: string; text: string }>;
}

export interface PlanConfig {
  id: 'BASICO' | 'PROFISSIONAL' | 'EMPRESARIAL';
  name: string;
  price: number;
  maxFreightsMonthly: number;
  maxUsers: number;
  maxDrivers: number;
  isActive: boolean;
}

export type NotificationModulePlan = 'SAAS_FREE' | 'OWN_NUMBER';
export type NotificationBillingStatus = 'NOT_REQUIRED' | 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'INACTIVE' | 'CANCELED';

export interface NotificationModuleConfig {
  enabled: boolean;
  freePlanName: string;
  freePlanDescription: string;
  ownNumberPlanName: string;
  ownNumberPlanDescription: string;
  ownNumberMonthlyPrice: number;
  assistedActivationPrice: number;
  extraNumberMonthlyPrice: number;
}

export interface NotificationModuleStatus {
  tenantId: string;
  plan: NotificationModulePlan;
  billingStatus: NotificationBillingStatus;
  subscriptionId?: string;
  nextDueDate?: string;
  canUseOwnNumber: boolean;
  config: NotificationModuleConfig;
}

export interface SaaSLayoutConfig {
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  navbarStyle: 'dark' | 'light' | 'colored';
  logoText?: string;
  browserTabTitle?: string;
  footerText?: string;
  systemBackground: 'minimal' | 'warm' | 'slate';
  homeBadgeText?: string;
  homeTitle?: string;
  homeTitleAccent?: string;
  homeSubtitle?: string;
}

export interface FormFieldSetting {
  id: string;
  originalLabel: string;
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
}

export interface SaaSFormFieldsConfig {
  userForm: FormFieldSetting[];
  freightForm: FormFieldSetting[];
  driverForm: FormFieldSetting[];
  expenseForm: FormFieldSetting[];
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password?: string; // Should be handled carefully, maybe just for display
  senderEmail: string;
  testEmail?: string;
  isActive: boolean;
}

export interface SqlDatabaseConfig {
  enabled: boolean;
  dbType: 'postgres' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl: boolean;
  poolMax?: number;
  autoMigrate: boolean;
  connectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  lastTestedAt?: string;
}

export interface ImageCompressionConfig {
  enabled: boolean;
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.1 to 1.0
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  autoCompressDocuments: boolean;
  maxFileSizeKB: number;
}

export interface MapboxConfig {
  enabled: boolean;
  apiKey: string;
  defaultZoom: number;
  defaultStyle: 'streets-v12' | 'satellite-streets-v12' | 'dark-v11' | 'light-v11' | 'navigation-night-v1';
  enableLiveTracking: boolean;
  updateIntervalSeconds: number;
}

export interface AsaasConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  apiKey: string;
  webhookToken: string;
  webhookUrl?: string;
}
export interface SeoConfig {
  siteName: string;
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImageUrl?: string;
  locale: string;
  allowIndexing: boolean;
}

export interface BackupNotificationConfig {
  enabled: boolean;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
  updatedAt?: string;
}

export interface BackupHistoryItem {
  name: string;
  generatedAt: string | null;
  sizeBytes: number;
  verified: boolean;
  status: 'SUCCESS' | 'ERROR' | 'RUNNING' | 'UNKNOWN';
}

export interface BackupStatusResponse {
  configured: boolean;
  state: 'SUCCESS' | 'ERROR' | 'RUNNING' | 'UNAVAILABLE' | 'UNKNOWN';
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  backups: BackupHistoryItem[];
  manualRequestPending: boolean;
  retention: number;
  schedule: string;
  notifications: {
    enabled: boolean;
    whatsappEnabled: boolean;
    whatsappPhoneMasked: string;
    notifyOnFailure: boolean;
    notifyOnSuccess: boolean;
  };
}

export interface SaaSGlobalConfig {
  systemName: string;
  supportPhone: string;
  supportEmail: string;
  defaultCommissionPercent: number;
  requireChecklistPhotos: boolean;
  minDriverAge: number;
  otpExpirationMinutes: number;
  allowSelfRegistration: boolean;
  showDemoSwitcher?: boolean;
  plans: PlanConfig[];
  layout?: SaaSLayoutConfig;
  formFields?: SaaSFormFieldsConfig;
  emailConfig?: EmailConfig;
  databaseConfig?: SqlDatabaseConfig;
  imageCompression?: ImageCompressionConfig;
  mapboxConfig?: MapboxConfig;
  asaasConfig?: AsaasConfig;
  notificationModule?: NotificationModuleConfig;
  backupNotifications?: BackupNotificationConfig;
  seo?: SeoConfig;
  notificationTemplates?: NotificationTemplate[];
}

export type ExpenseCategory = 
  | 'ABASTECIMENTO'
  | 'HOSPEDAGEM'
  | 'PEDAGIO'
  | 'LOCOMOCAO_URBANA' // Uber, Táxi, Ônibus, Metrô
  | 'PASSAGEM_AEREA'
  | 'PASSAGEM_RODOVIARIA'
  | 'ALIMENTACAO'
  | 'MANUTENCAO_BORRACHARIA'
  | 'ESTACIONAMENTO'
  | 'BALSA'
  | 'OUTROS';

export interface TripExpenseItem {
  id: string;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  description: string;
  establishmentName?: string; // Nome do Posto / Hotel / Cia / Estabelecimento
  documentNumber?: string; // Nº Cupom Fiscal / NF / Bilhete
  amount: number;
  paymentMethod: 'ADIANTAMENTO_EMPRESA' | 'CARTAO_CORPORATIVO' | 'DINHEIRO_PROPRIO' | 'PIX_PROPRIO' | 'TAG_AUTOMATICA';
  
  // Specific category fields
  liters?: number; // For Abastecimento
  pricePerLiter?: number; // For Abastecimento
  odometerKm?: number; // Km no momento do abastecimento
  fuelType?: 'DIESEL_S10' | 'DIESEL_S500' | 'GASOLINA' | 'ETANOL' | 'ARLA_32';
  arlaLiters?: number; // Quantidade de Arla
  arlaAmount?: number; // Valor gasto com Arla
  
  nightsCount?: number; // For Hospedagem
  transportOrigin?: string; // For Passagens / Locomoção
  transportDestination?: string; // For Passagens / Locomoção
  
  receiptPhotoUrl?: string; // Deprecated: keep for backwards compatibility
  receiptPhotoUrls?: string[]; // Multiple photos support
  notes?: string;
  createdAt: string;
}

export type TripExpenseStatus = 
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'QUITADO';

export interface TripExpenseReport {
  id: string;
  tenantId?: string;
  freightId?: string;
  freightCode?: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  vehiclePlate?: string;
  chassis?: string;
  vehicleModel?: string;
  clientName?: string;
  
  // Trip general info
  startDate: string; // YYYY-MM-DD or ISO
  endDate: string; // YYYY-MM-DD or ISO
  tripDays: number;
  initialKm: number;
  finalKm: number;
  totalKm: number;
  totalLiters: number;
  averageKmPerLiter: number;
  costPerKm: number;
  
  // Financial Summary
  advanceAmount: number; // Adiantamento recebido da empresa
  driverLaborAmount?: number; // Mão de obra do motorista
  totalExpenses: number; // Total de despesas comprovadas
  balanceAmount: number; // advanceAmount - totalExpenses (Positivo = A Devolver / Negativo = A Reembolsar)
  balanceStatus: 'A_DEVOLVER' | 'REEMBOLSO_A_RECEBER' | 'QUITADO';
  
  status: TripExpenseStatus;
  items: TripExpenseItem[];
  
  generalNotes?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

