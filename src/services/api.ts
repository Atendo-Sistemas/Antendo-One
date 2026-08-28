import { 
  User, 
  Tenant, 
  Driver, 
  Vehicle, 
  Freight, 
  FreightStatus, 
  AppNotification, 
  FormDefinition, 
  FormResponse, 
  AuditLog, 
  DashboardStats,
  WhatsAppConfig,
  WhatsAppNotificationPayload,
  SaaSGlobalConfig,
  TripExpenseReport,
  EmailConfig,
  WebPage,
  BlogPost,
  NotificationTemplate,
  VisitAnalyticsResponse,
  CompanyVehicle,
  PublicFreightSummary,
  DriverCompanyLink,
  NotificationDelivery,
  SupportSessionInfo,
  WhatsAppPairingResult,
  NotificationModuleStatus,
  BackupStatusResponse,
  TenantReportTemplate,
  ReportTemplateType
} from '../types';

let currentToken: string | null = null;
const AUTH_TOKEN_STORAGE_KEY = 'frete_auth_token';

export const setAuthToken = (token: string) => {
  currentToken = token || null;
  if (typeof window === 'undefined') return;
  try {
    if (currentToken) window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, currentToken);
    else window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private/restricted browser contexts; memory session still works.
  }
};

export const clearAuthToken = () => setAuthToken('');

export const getAuthToken = (): string => {
  if (currentToken) return currentToken;
  if (typeof window === 'undefined') return '';
  try {
    currentToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || null;
  } catch {
    currentToken = null;
  }
  return currentToken || '';
};

export interface OfflineResponse {
  id: string;
  formId: string;
  freightId?: string;
  responseId?: string;
  stage?: 'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO';
  isDraft?: boolean;
  answers: Record<string, any>;
  createdAt: string;
}

// Get items pending offline sync from local storage
export const getOfflineQueue = (): OfflineResponse[] => {
  try {
    return JSON.parse(localStorage.getItem('elolog_offline_queue') || '[]');
  } catch {
    return [];
  }
};

// Save items pending offline sync to local storage
export const saveOfflineQueue = (queue: OfflineResponse[]) => {
  localStorage.setItem('elolog_offline_queue', JSON.stringify(queue));
};

// Check if we are simulated offline or genuinely offline
export const isOfflineMode = (): boolean => {
  const simulated = localStorage.getItem('elolog_simulate_offline') === 'true';
  const realOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return simulated || realOffline;
};

// Toggle offline simulation mode
export const setSimulatedOffline = (offline: boolean) => {
  localStorage.setItem('elolog_simulate_offline', offline ? 'true' : 'false');
  window.dispatchEvent(new Event('elolog_offline_queue_changed'));
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (res.status === 429) {
      throw new Error('Limite de requisições excedido pelo servidor. Por favor, aguarde alguns segundos.');
    }
    throw new Error(text || 'Ocorreu um erro inesperado no servidor');
  }

  if (!res.ok) {
    if (res.status === 401 && token) clearAuthToken();
    const error = new Error(data.message || data.error || `Erro ${res.status}: Ocorreu um erro na requisição`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async logout() { return request<{ success: boolean }>('/auth/logout', { method: 'POST' }); },
  async getMe() {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      availableDemoAccounts: Array<{ id: string; name: string; email: string; role: string; tenantId: string | null; driverId?: string }>;
      supportSession?: SupportSessionInfo | null;
    }>('/auth/me');
  },

  async login(email: string, role?: string, password?: string) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role, password })
    });
  },

  async switchDemoUser(userId: string) {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      token: string;
    }>('/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async startDemoSession(userId?: string) {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      token: string;
      demo: true;
    }>('/auth/demo-session', {
      method: 'POST',
      body: JSON.stringify(userId ? { userId } : {})
    });
  },

  async startSupportSession(targetUserId: string) {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      token: string;
      supportSession: SupportSessionInfo;
    }>('/support/sessions', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  },

  async endSupportSession() {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      token: string;
    }>('/support/sessions/end', { method: 'POST' });
  },

  async requestOtp(phone: string) {
    return request<{ success: boolean; message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },

  async verifyOtp(phone: string, code: string) {
    return request<{ user: User; token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code })
    });
  },

  async registerCompany(data: {
    companyName: string;
    cnpj: string;
    responsibleName: string;
    email: string;
    phone: string;
    password?: string;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
  }) {
    return request<{ success: boolean; message: string }>('/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async verifyRegistration(email: string, code: string) {
    return request<{ success: boolean; message: string }>('/auth/verify-registration', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
  },

  async registerDriver(data: any) {
    return request<{ user: User; driver: Driver; vehicle: Vehicle; token?: string }>('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Content management
  async getPages() { return request<WebPage[]>('/pages'); },
  async createPage(data: Partial<WebPage>) { return request<WebPage>('/pages', { method: 'POST', body: JSON.stringify(data) }); },
  async updatePage(id: string, data: Partial<WebPage> & { contentVersion?: string; changeNote?: string }) { return request<WebPage>(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getPageVersions(id: string) { return request<{ currentVersion: string | null; versions: import('../types').LegalDocumentVersion[] }>(`/pages/${id}/versions`); },
  async deletePage(id: string) { return request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }); },
  async getPosts() { return request<BlogPost[]>('/posts'); },
  async createPost(data: Partial<BlogPost>) { return request<BlogPost>('/posts', { method: 'POST', body: JSON.stringify(data) }); },
  async updatePost(id: string, data: Partial<BlogPost>) { return request<BlogPost>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deletePost(id: string) { return request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }); },
  async getPublicSeo() { return request<{ seo: any; content: any[] }>('/public/seo'); },
  async getVisitAnalytics(days = 30) { return request<VisitAnalyticsResponse>(`/analytics/visits?days=${days}`); },
  async getPublicContent(slug: string, section?: 'conteudo' | 'elo-log') { return request<any>(`/public/content/${encodeURIComponent(slug)}${section ? `?section=${section}` : ''}`); },
  async getRegistrationLegalContent(slug: string) { return request<any>(`/public/registration-content/${encodeURIComponent(slug)}`); },
  async getNotificationDeliveries(limit = 100) { return request<NotificationDelivery[]>(`/notification-deliveries?limit=${limit}`); },
  async getNotificationConsent() { return request<{ email: boolean; whatsapp: boolean; updatedAt?: string | null }>('/notification-consent'); },
  async updateNotificationConsent(payload: { email?: boolean; whatsapp?: boolean }) { return request<{ email: boolean; whatsapp: boolean; updatedAt: string }>('/notification-consent', { method: 'PUT', body: JSON.stringify(payload) }); },

  async getNotificationTemplates() { return request<NotificationTemplate[]>('/saas/notification-templates'); },
  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) { return request<NotificationTemplate>(`/saas/notification-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getTenantNotificationTemplates() { return request<NotificationTemplate[]>('/tenant/notification-templates'); },
  async updateTenantNotificationTemplate(id: string, data: Partial<NotificationTemplate>) { return request<NotificationTemplate>(`/tenant/notification-templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getTenantReportTemplates() { return request<TenantReportTemplate[]>('/tenant/report-templates'); },
  async updateTenantReportTemplate(type: ReportTemplateType, data: Partial<TenantReportTemplate>) { return request<TenantReportTemplate>(`/tenant/report-templates/${encodeURIComponent(type)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getErrorLogs(params?: { limit?: number; event?: string; status?: number }) { const query = new URLSearchParams(); if (params?.limit) query.set('limit', String(params.limit)); if (params?.event) query.set('event', params.event); if (params?.status) query.set('status', String(params.status)); return request<{ items: import('../types').ErrorLogEntry[]; total: number }>(`/error-logs?${query.toString()}`); },
  async getBackupStatus() { return request<BackupStatusResponse>('/admin/backups/status'); },
  async requestManualBackup() { return request<{ success: boolean; requestId: string; status: 'QUEUED'; message: string }>('/admin/backups/run', { method: 'POST', body: JSON.stringify({}) }); },
  async updateBackupNotifications(data: { enabled: boolean; whatsappEnabled: boolean; whatsappPhone: string; notifyOnFailure: boolean; notifyOnSuccess: boolean }) { return request<{ success: boolean; notifications: { enabled: boolean; whatsappEnabled: boolean; whatsappPhone: string; whatsappPhoneMasked: string; notifyOnFailure: boolean; notifyOnSuccess: boolean; updatedAt?: string } }>('/admin/backups/notifications', { method: 'PUT', body: JSON.stringify(data) }); },
  async testBackupWhatsApp() { return request<{ success: boolean; message: string }>('/admin/backups/whatsapp-test', { method: 'POST', body: JSON.stringify({}) }); },
  async cleanupErrorLogs(olderThanDays = 90) { return request<{ success: boolean; removed: number }>('/error-logs', { method: 'DELETE', body: JSON.stringify({ olderThanDays }) }); },
  async testAsaasConnection() { return request<{ success: boolean; accountName: string; environment: string }>('/billing/asaas/test', { method: 'POST', body: JSON.stringify({}) }); },
  async createAsaasSubscription(payload: { tenantId: string; planId: string; cycle: string; billingType: string; nextDueDate?: string }) { return request<{ id: string; status: string; cycle: string; nextDueDate: string; value: number }>('/billing/asaas/subscribe', { method: 'POST', body: JSON.stringify(payload) }); },
  async getAsaasSubscription(tenantId?: string) { const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''; return request<any>(`/billing/asaas/subscription${query}`); },
  async getAsaasFinancialSummary(tenantId?: string) { const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''; return request<any>(`/billing/asaas/financial-summary${query}`); },
  async cancelAsaasSubscription(tenantId?: string) { return request<any>('/billing/asaas/subscription/cancel', { method: 'POST', body: JSON.stringify(tenantId ? { tenantId } : {}) }); },
  async changeAsaasPlan(payload: { tenantId?: string; planId: string; cycle?: string; billingType?: string; nextDueDate?: string; updatePendingPayments?: boolean }) { return request<any>('/billing/asaas/subscription/change-plan', { method: 'POST', body: JSON.stringify(payload) }); },
  async getNotificationModuleStatus(tenantId?: string) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    return request<NotificationModuleStatus>(`/billing/asaas/notification-module${query}`);
  },
  async selectFreeNotificationModule(tenantId?: string) {
    return request<NotificationModuleStatus>('/billing/asaas/notification-module/free', {
      method: 'POST',
      body: JSON.stringify(tenantId ? { tenantId } : {})
    });
  },
  async createNotificationModuleSubscription(payload: { tenantId?: string; billingType?: string; nextDueDate?: string }) {
    return request<{ id: string; status: string; value: number; nextDueDate: string; module: string }>('/billing/asaas/notification-module/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async cancelNotificationModule(tenantId?: string) { return request<any>('/billing/asaas/notification-module/cancel', { method: 'POST', body: JSON.stringify(tenantId ? { tenantId } : {}) }); },
  // Tenants
  async getTenants() {
    return request<Tenant[]>('/tenants');
  },

  async createTenant(data: Partial<Tenant> & {
    responsibleName: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
  }) {
    return request<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async provisionTenantAtendo(id: string) {
    return request<{ success: boolean; status: string; tenant: Tenant }>(`/tenants/${id}/provision-atendo`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async updateTenant(id: string, data: Partial<Tenant>) {
    return request<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTenant(id: string) {
    return request<{ success: boolean; message: string }>(`/tenants/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  async getUsers() {
    return request<User[]>('/users');
  },

  async createUser(data: Partial<User>) {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateUser(id: string, data: Partial<User>) {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteUser(id: string) {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  async updateProfile(data: Partial<User> & { address?: string; city?: string; state?: string; zipCode?: string; password?: string }) {
    return request<{ success: boolean; user: User; driver?: Driver }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Drivers & Vehicles
  async getDrivers() {
    return request<Driver[]>('/drivers');
  },

  async updateDriver(id: string, data: Partial<Driver>) {
    return request<Driver>(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getDriverDetails(id: string) {
    return request<{ driver: Driver; vehicles: Vehicle[]; freightsHistory: Freight[] }>(`/drivers/${id}`);
  },

  async getVehicles() {
    return request<Vehicle[]>('/vehicles');
  },
  async getCompanyVehicles() {
    return request<CompanyVehicle[]>('/company-vehicles');
  },
  async createCompanyVehicle(data: Partial<CompanyVehicle>) {
    return request<CompanyVehicle>('/company-vehicles', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateCompanyVehicle(id: string, data: Partial<CompanyVehicle>) {
    return request<CompanyVehicle>(`/company-vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteCompanyVehicle(id: string) {
    return request<{ success: boolean; message: string }>(`/company-vehicles/${id}`, { method: 'DELETE' });
  },
  async getDriverCompanyLinks() {
    return request<Array<DriverCompanyLink & { driver?: Driver; freightCode?: string; originCity?: string; destinationCity?: string }>>('/driver-company-links');
  },
  async updateDriverCompanyLinkStatus(id: string, status: 'APROVADO' | 'RECUSADO' | 'BLOQUEADO', reason?: string, scope?: 'FRETE' | 'EMPRESA') {
    return request<{ success: boolean; link: DriverCompanyLink }>(`/driver-company-links/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason, scope }) });
  },

  // Freights
  async getFreights(params?: { status?: string; originCity?: string; destinationCity?: string; vehicleType?: string; onlyMine?: boolean }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.originCity) query.set('originCity', params.originCity);
    if (params?.destinationCity) query.set('destinationCity', params.destinationCity);
    if (params?.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params?.onlyMine) query.set('onlyMine', 'true');
    
    return request<Freight[]>(`/freights?${query.toString()}`);
  },

  async getFreight(id: string) {
    return request<Freight & { formResponses: FormResponse[] }>(`/freights/${id}`);
  },
  async getPublicFreights() {
    return request<PublicFreightSummary[]>('/public/freights');
  },
  async getPublicFreightDetails(id: string) {
    return request<PublicFreightSummary & { price: number | null; priceAvailable: boolean; message?: string }>(`/public/freights/${id}`);
  },
  async startFreightInterest(data: { freightId: string; name: string; phone: string; termsAccepted: boolean; privacyAccepted: boolean }) {
    return request<{ success: boolean; userId: string; message: string }>(`/public/freights/${data.freightId}/interest`, { method: 'POST', body: JSON.stringify(data) });
  },
  async completeQuickDriver(userId: string, data: Record<string, any>) {
    return request<{ success: boolean; status: string; message: string }>(`/public/freights/${data.freightId}/interest/complete`, { method: 'POST', body: JSON.stringify({ ...data, userId }) });
  },

  async createFreight(data: any) {
    return request<Freight>('/freights', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateFreight(id: string, data: any) {
    return request<Freight>(`/freights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Atomic Accept (Mutex protected in backend)
  async acceptFreight(id: string) {
    return request<{ message: string; freight: Freight }>(`/freights/${id}/accept`, {
      method: 'POST'
    });
  },

  // Status transition
  async updateFreightStatus(id: string, newStatus: FreightStatus, notes?: string, location?: string) {
    return request<Freight>(`/freights/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, notes, location })
    });
  },

  // Forms
  async getForms(params?: { triggerEvent?: string }) {
    const query = new URLSearchParams();
    if (params?.triggerEvent) query.set('triggerEvent', params.triggerEvent);
    return request<FormDefinition[]>(`/forms?${query.toString()}`);
  },

  async createForm(data: Partial<FormDefinition>) {
    return request<FormDefinition>('/forms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async submitFormResponse(data: { 
    formId: string; 
    freightId?: string; 
    responseId?: string;
    stage?: 'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO';
    isDraft?: boolean;
    answers: Record<string, any>;
  }) {
    if (isOfflineMode()) {
      const offlineId = `offline-${Date.now()}`;
      const mockResponse: FormResponse = {
        id: data.responseId || offlineId,
        formId: data.formId,
        formTitle: 'Vistoria',
        tenantId: 'offline',
        freightId: data.freightId || undefined,
        driverId: 'offline',
        filledByUserId: 'offline',
        filledByName: 'Motorista',
        stage: data.stage || 'COMPLETO',
        isDraft: data.isDraft || false,
        answers: data.answers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to local storage offline queue
      const queue = getOfflineQueue();
      // Remove duplicate pending response for same freight and form to avoid duplicates
      const filtered = queue.filter(q => !(q.formId === data.formId && q.freightId === data.freightId));
      filtered.push({
        id: mockResponse.id,
        formId: data.formId,
        freightId: data.freightId,
        responseId: data.responseId,
        stage: data.stage,
        isDraft: data.isDraft,
        answers: data.answers,
        createdAt: new Date().toISOString()
      });
      saveOfflineQueue(filtered);

      // Trigger a custom event to notify components that the queue changed
      window.dispatchEvent(new Event('elolog_offline_queue_changed'));

      return mockResponse;
    }

    return request<FormResponse>('/forms/responses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number }> {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    let syncedCount = 0;
    const remainingQueue: OfflineResponse[] = [];

    for (const item of queue) {
      try {
        await request<FormResponse>('/forms/responses', {
          method: 'POST',
          body: JSON.stringify({
            formId: item.formId,
            freightId: item.freightId,
            responseId: item.responseId?.startsWith('offline-') ? undefined : item.responseId,
            stage: item.stage,
            isDraft: item.isDraft,
            answers: item.answers
          })
        });
        syncedCount++;
      } catch (err) {
        console.error('Falha ao sincronizar item offline:', item, err);
        remainingQueue.push(item);
      }
    }

    saveOfflineQueue(remainingQueue);
    window.dispatchEvent(new Event('elolog_offline_queue_changed'));
    return { success: remainingQueue.length === 0, syncedCount };
  },

  async sendWhatsAppNotification(data: WhatsAppNotificationPayload) {
    return request<{ 
      success: boolean; 
      messageId: string; 
      recipient: string; 
      status: string; 
      details: string;
      gatewayResponse?: any;
    }>('/integrations/whatsapp/notify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWhatsAppConfig(tenantId?: string) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    return request<WhatsAppConfig & { tokenMasked?: string; tenantId?: string | null; scope?: 'GLOBAL' | 'TENANT'; tenantHasDedicatedConfig?: boolean }>(`/integrations/whatsapp/config${query}`);
  },

  async updateWhatsAppConfig(data: Partial<WhatsAppConfig> & { tenantId?: string }) {
    return request<{ success: boolean; config: WhatsAppConfig & { tokenMasked?: string; tenantId?: string | null } }>('/integrations/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWhatsAppStatus(tenantId?: string) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    return request<{ success: boolean; status: string; message: string; pairingCode?: string; qrCode?: string; config: WhatsAppConfig & { tokenMasked?: string } }>(`/integrations/whatsapp/status${query}`);
  },

  async requestWhatsAppQr(tenantId?: string, phone?: string) {
    return request<WhatsAppPairingResult & { config?: WhatsAppConfig & { tokenMasked?: string } }>('/integrations/whatsapp/qr', {
      method: 'POST',
      body: JSON.stringify({
        ...(tenantId ? { tenantId } : {}),
        ...(phone?.trim() ? { phone: phone.trim() } : {})
      })
    });
  },

  async testWhatsAppConnection(data: { phone?: string; message?: string; baseUrl?: string; token?: string; tenantId?: string }) {
    return request<{ success: boolean; message: string; recipient: string; details?: any }>('/integrations/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async testEmailConnection(data: EmailConfig) {
    return request<{ success: boolean; message: string }>('/integrations/email/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getFormResponses(params?: { freightId?: string; formId?: string }) {
    const query = new URLSearchParams();
    if (params?.freightId) query.set('freightId', params.freightId);
    if (params?.formId) query.set('formId', params.formId);
    return request<FormResponse[]>(`/forms/responses?${query.toString()}`);
  },

  async getNextTalaoNumber() {
    return request<{ nextNumber: string }>('/forms/next-talao');
  },

  async sendChecklistDispatch(data: {
    responseId?: string;
    stage: 'RETIRADA' | 'ENTREGA' | 'COMPLETO';
    talaoNumber: string;
    freightCode?: string;
    recipientType: 'ORIGEM' | 'DESTINO' | 'CLIENTE';
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    maskedData?: any;
    receiptText: string;
  }) {
    return request<{
      success: boolean;
      emailStatus: string;
      recipientEmail: string | null;
      recipientPhone: string | null;
      whatsappLink: string;
      sentAt: string;
    }>('/forms/send-dispatch', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Notifications
  async getNotifications() {
    return request<AppNotification[]>('/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'PUT'
    });
  },

  // Audit Logs & Stats
  async getAuditLogs() {
    return request<AuditLog[]>('/audit-logs');
  },

  async getStats() {
    return request<DashboardStats>('/stats');
  },

  // Deletes
  async deleteFreight(id: string) {
    return request<{ success: boolean; message: string }>(`/freights/${id}`, { method: 'DELETE' });
  },
  async deleteDriver(id: string) {
    return request<{ success: boolean; message: string }>(`/drivers/${id}`, { method: 'DELETE' });
  },
  async deleteForm(id: string) {
    return request<{ success: boolean; message: string }>(`/forms/${id}`, { method: 'DELETE' });
  },
  async deleteVehicle(id: string) {
    return request<{ success: boolean; message: string }>(`/vehicles/${id}`, { method: 'DELETE' });
  },

  // SaaS Global Configurations
  async getSaaSGlobalConfig() {
    return request<SaaSGlobalConfig>('/saas/config');
  },

  async updateSaaSGlobalConfig(data: Partial<SaaSGlobalConfig>) {
    return request<{ success: boolean; config: SaaSGlobalConfig }>('/saas/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Trip Expenses & Accountability (Prestação de Contas ELO LOG)
  async getTripExpenses(params?: { freightId?: string; driverId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.freightId) query.append('freightId', params.freightId);
    if (params?.driverId) query.append('driverId', params.driverId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<TripExpenseReport[]>(`/expenses${qs}`);
  },

  async getTripExpense(id: string) {
    return request<TripExpenseReport>(`/expenses/${id}`);
  },

  async createTripExpense(data: Partial<TripExpenseReport>) {
    return request<TripExpenseReport>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTripExpense(id: string, data: Partial<TripExpenseReport>) {
    return request<TripExpenseReport>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTripExpense(id: string) {
    return request<{ success: boolean; message: string }>(`/expenses/${id}`, {
      method: 'DELETE'
    });
  },

  // SQL Database & Installation Management
  async getDatabaseStatus() {
    return request<{
      success: boolean;
      enabled: boolean;
      status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
      host: string;
      port: number;
      database: string;
      username: string;
      ssl: boolean;
      lastTestedAt?: string;
      tables: string[];
      recordsCount: Record<string, number>;
      imageCompression?: any;
    }>('/database/status');
  },

  async testDatabaseConnection(customConfig?: any) {
    return request<{
      success: boolean;
      message: string;
      version?: string;
      tablesCount?: number;
      latencyMs?: number;
    }>('/database/test', {
      method: 'POST',
      body: JSON.stringify(customConfig || {})
    });
  },

  async migrateDatabase() {
    return request<{
      success: boolean;
      message: string;
    }>('/database/migrate', {
      method: 'POST'
    });
  },

  async getDatabaseSchema() {
    const token = getAuthToken();
    const res = await fetch('/api/database/schema', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error(`Erro ao carregar schema SQL: ${res.status}`);
    }
    return res.text();
  },

  async getSshInstallScript() {
    const token = getAuthToken();
    const res = await fetch('/api/installation/ssh-script', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error(`Erro ao carregar script SSH: ${res.status}`);
    }
    return res.text();
  },

  async getPortainerStackYaml() {
    const token = getAuthToken();
    const res = await fetch('/api/installation/portainer-stack', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error(`Erro ao carregar stack Portainer: ${res.status}`);
    }
    return res.text();
  },

  async getHelp() {
    return request<any>('/help');
  },

  async saveHelp(role: string, content: string) {
    const token = getAuthToken();
    return request('/help', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ role, content })
    });
  }
};
