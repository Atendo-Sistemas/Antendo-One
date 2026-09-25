import { User, Tenant, Driver, Vehicle, Freight, Tenant as TenantType, Metrics, Invoice } from '../types';

type OfflineResponse = { formId: string; freightId?: string; responseId: string; stage: string; isDraft: boolean; answers: Record<string, any> };

export const normalizeCnpj = (value: unknown): string => String(value ?? '').replace(/\D/g, '').slice(0, 14);
export const formatCnpj = (value: unknown): string => {
  const digits = normalizeCnpj(value);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
};

// Session tokens are HttpOnly cookies. These compatibility helpers intentionally do not persist tokens in browser storage.
export const setAuthToken = (_token: string) => undefined;
export const getAuthToken = (): string => '';

export const clearAuthToken = () => {
  // Cookies are invalidated by the server logout endpoint.
};

export const setAuthSession = (token: string, refreshToken?: string) => {
  void token;
  void refreshToken;
};

const getCsrfToken = (): string => document.cookie.split('; ').find(item => item.startsWith('atendo_csrf='))?.split('=').slice(1).join('=') || '';

let refreshPromise: Promise<boolean> | null = null;

const refreshAuthSession = async (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': getCsrfToken() }
      });
      const refreshData = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && (refreshData.user || refreshData.success)) {
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// Offline Queue Management
export const getOfflineQueue = (): OfflineResponse[] => {
  try {
    return JSON.parse(localStorage.getItem('elolog_offline_queue') || '[]');
  } catch {
    return [];
  }
};

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

async function request<T>(endpoint: string, options: RequestInit = {}, allowRefresh = true): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const method = String(options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', getCsrfToken());

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include',
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
    if (res.status === 401 && allowRefresh && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/logout')) {
      if (await refreshAuthSession()) return request<T>(endpoint, options, false);
      clearAuthToken();
    } else if (res.status === 401) clearAuthToken();
    const error = new Error(data.message || data.error || `Erro ${res.status}: Ocorreu um erro na requisição`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${endpoint}`, { ...options, credentials: 'omit', headers: { Accept: 'application/json', ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || data.error || `Erro ${res.status}: não foi possível carregar o rastreamento`) as Error & { status?: number };
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
      availableDemoAccounts?: any[];
      supportSession?: any;
    }>('/auth/me');
  },
  async verifyOtp(phone: string, code: string) {
    return request<{ token: string; refreshToken: string; user: User }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) });
  },
  async startFreightInterest(data: any) {
  return publicRequest<{ userId: string }>(`/public/freights/${encodeURIComponent(data.freightId)}/interest`, { method: 'POST', body: JSON.stringify(data) });
  },
  async completeQuickDriver(userId: string, data: any) {
    return request<{ driver: Driver }>(`/drivers/${userId}/quick-complete`, { method: 'POST', body: JSON.stringify(data) });
  },
  subscribePublicTracking(token: string, callback: (update: any) => void) {
    try {
      const eventSource = new EventSource(`/api/public/tracking/${encodeURIComponent(token)}/subscribe`);
      eventSource.onmessage = (event) => callback(JSON.parse(event.data));
      eventSource.onerror = () => eventSource.close();
      return () => eventSource.close();
    } catch (err) {
      console.error('Erro ao subscrever rastreamento público:', err);
    }
  },

  // Freights
  async getFreights(search = '', status = '', vehicleType = '') {
    return request<Freight[]>(`/freights?${new URLSearchParams({ search, status, vehicleType }).toString()}`);
  },
  async getFreight(id: string) { return request<Freight>(`/freights/${id}`); },
  async createFreight(data: Partial<Freight>) { return request<Freight>('/freights', { method: 'POST', body: JSON.stringify(data) }); },
  async updateFreight(id: string, data: Partial<Freight>) { return request<Freight>(`/freights/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async updateFreightStatus(id: string, status: string, notes?: string) { return request<Freight>(`/freights/${id}/status`, { method: 'POST', body: JSON.stringify({ status, ...(notes ? { notes } : {}) }) }); },
  async deleteFreight(id: string) { return request<{ success: boolean }>(`/freights/${id}`, { method: 'DELETE' }); },
  async publishFreight(id: string, data: any) { return request<Freight>(`/freights/${id}/publish`, { method: 'POST', body: JSON.stringify(data) }); },
  async unpublishFreight(id: string) { return request<Freight>(`/freights/${id}/unpublish`, { method: 'POST' }); },
  async getPublicFreights(filters?: any) { return publicRequest<Freight[]>(`/public/freights?${new URLSearchParams(filters).toString()}`); },
  async getFreightPublicInterests(id: string) { return request<any[]>(`/freights/${id}/public-interests`); },
  async updateFreightLocation(id: string, location: any) { return request<Freight>(`/freights/${id}/location`, { method: 'POST', body: JSON.stringify(location) }); },
  async getFreightLocations(id: string, hours = 24) { return request<any[]>(`/freights/${id}/locations?hours=${hours}`); },
  async updateFreightOccurrence(id: string, occurrence: any) { return request<any>(`/freights/${id}/occurrences`, { method: 'POST', body: JSON.stringify(occurrence) }); },
  async getFreightOccurrences(id: string) { return request<any[]>(`/freights/${id}/occurrences`); },
  async getPages() { return request<any[]>('/pages'); },
  async createPage(data: any) { return request<any>('/pages', { method: 'POST', body: JSON.stringify(data) }); },
  async updatePage(id: string, data: any) { return request<any>(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deletePage(id: string) { return request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }); },
  async createPost(data: any) { return request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }); },
  async updatePost(id: string, data: any) { return request<any>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deletePost(id: string) { return request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }); },
  async getPublicSeo() { return request<{ seo: any; content: any[] }>('/public/seo'); },
  async getVisitAnalytics(days = 30) { return request<any>(`/analytics/visits?days=${days}`); },
  async recordPublicVisit(payload: any) { return request<void>('/analytics/visit', { method: 'POST', body: JSON.stringify(payload) }); },
  async getPublicContent(slug: string, section?: string) { return request<any>(`/public/content/${encodeURIComponent(slug)}${section ? `?section=${section}` : ''}`); },
  async getRegistrationLegalContent(slug: string) { return request<any>(`/public/registration-content/${encodeURIComponent(slug)}`); },
  async getNotificationDeliveries(limit = 100) { return request<any[]>(`/notification-deliveries?limit=${limit}`); },
  async getNotificationConsent() { return request<any>('/notification-consent'); },
  async updateNotificationConsent(payload: any) { return request<any>('/notification-consent', { method: 'POST', body: JSON.stringify(payload) }); },
  async getNotificationTemplates() { return request<any[]>('/saas/notification-templates'); },
  async updateNotificationTemplate(id: string, data: any) { return request<any>(`/saas/notification-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getTenantNotificationTemplates() { return request<any[]>('/tenant/notification-templates'); },
  async updateTenantNotificationTemplate(id: string, data: any) { return request<any>(`/tenant/notification-templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getTenantEmailConfig() { return request<any>('/tenant/email-config'); },
  async updateTenantEmailConfig(data: any) { return request<any>('/tenant/email-config', { method: 'PUT', body: JSON.stringify(data) }); },
  async getTenantReportTemplates() { return request<any[]>('/tenant/report-templates'); },
  async updateTenantReportTemplate(id: string, data: any) { return request<any>(`/tenant/report-templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async syncOfflineQueue() {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    let syncedCount = 0;
    const remainingQueue: OfflineResponse[] = [];

    for (const item of queue) {
      try {
        await request<any>('/forms/responses', {
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

  async sendWhatsAppNotification(data: any) {
    return request<any>('/integrations/whatsapp/notify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWhatsAppConfig(tenantId?: string) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    return request<any>(`/integrations/whatsapp/config${query}`);
  },

  async updateWhatsAppConfig(data: any) {
    return request<any>('/integrations/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWhatsAppStatus(tenantId?: string) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    return request<any>(`/integrations/whatsapp/status${query}`);
  },

  async requestWhatsAppQr(tenantId?: string, phone?: string) {
    return request<{ status: string; message: string; qrCode?: string; pairingCode?: string }>('/integrations/whatsapp/qr', {
      method: 'POST',
      body: JSON.stringify({
        ...(tenantId ? { tenantId } : {}),
        ...(phone?.trim() ? { phone: phone.trim() } : {})
      })
    });
  },

  async testWhatsAppConnection(data: any) {
    return request<any>('/integrations/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async testEmailConnection(data: any) {
    return request<any>('/integrations/email/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getFormResponses(params?: any) {
    const query = new URLSearchParams();
    if (params?.freightId) query.append('freightId', params.freightId);
    if (params?.formId) query.append('formId', params.formId);
    return request<any[]>(`/forms/responses?${query.toString()}`);
  },

  // Users
  async getUsers() { return request<User[]>('/users'); },
  async getUser(id: string) { return request<User>(`/users/${id}`); },
  async createUser(data: any) { return request<User>('/users', { method: 'POST', body: JSON.stringify(data) }); },
  async updateUser(id: string, data: any) { return request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteUser(id: string) { return request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }); },

  // Drivers
  async getDrivers(search = '') { return request<Driver[]>(`/drivers?search=${encodeURIComponent(search)}`); },
  async lookupDriver(phone?: string, cnh?: string) { return request<any>(`/drivers/lookup?${new URLSearchParams({ ...(phone ? { phone } : {}), ...(cnh ? { cnh } : {}) }).toString()}`); },
  async linkDriverToCompany(driverId: string, tenantId?: string) { return request<any>(`/drivers/${encodeURIComponent(driverId)}/company-link`, { method: 'POST', body: JSON.stringify(tenantId ? { tenantId } : {}) }); },
  async getDriverCompanyProfile(driverId: string, tenantId?: string) { return request<any>(`/drivers/${encodeURIComponent(driverId)}/company-profile${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''}`); },
  async updateDriverCompanyProfile(driverId: string, data: any) { return request<any>(`/drivers/${encodeURIComponent(driverId)}/company-profile`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getDriver(id: string) { return request<Driver>(`/drivers/${id}`); },
  async createDriver(data: any) { return request<Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) }); },
  async updateDriver(id: string, data: any) { return request<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteDriver(id: string) { return request<{ success: boolean }>(`/drivers/${id}`, { method: 'DELETE' }); },
  async inviteDriver(email: string) { return request<{ success: boolean }>('/drivers/invite', { method: 'POST', body: JSON.stringify({ email }) }); },
  async unlinkDriverFromCompany(linkId: string) { return request<{ success: boolean }>(`/driver-company-links/${linkId}`, { method: 'DELETE' }); },

  // Compatibility methods used by legacy and administrative screens
  async login(...args: any[]) { return request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email: args[0], password: args[2] ?? args[1] }) }); },
  async requestOtp(phone: string) { return request<any>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) }); },
  async registerCompany(data: any) { return request<any>('/auth/register-company', { method: 'POST', body: JSON.stringify(data) }); },
  async verifyRegistration(...args: any[]) { return request<any>('/auth/verify-registration', { method: 'POST', body: JSON.stringify({ email: args[0], code: args[1], ...(typeof args[0] === 'object' ? args[0] : {}) }) }); },
  async getPublicTracking(code: string) { return publicRequest<any>(`/public/tracking/${encodeURIComponent(code)}`); },
  async getPublicFreightDetails(id: string) { return publicRequest<any>(`/public/freights/${encodeURIComponent(id)}`); },
  async getForms() { return request<any[]>('/forms'); },
  async createForm(data: any) { return request<any>('/forms', { method: 'POST', body: JSON.stringify(data) }); },
  async updateForm(id: string, data: any) { return request<any>(`/forms/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async copyForm(id: string) { return request<any>(`/forms/${encodeURIComponent(id)}/copy`, { method: 'POST' }); },
  async deleteForm(id: string) { return request<any>(`/forms/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async submitFormResponse(data: any) { return request<any>('/forms/responses', { method: 'POST', body: JSON.stringify(data) }); },
  async getAuditLogs(...args: any[]) { return request<any[]>('/audit-logs'); },
  async getHelp() { return request<any[]>('/help'); },
  async saveHelp(role: string, content: string) { return request<{ success: boolean }>('/help', { method: 'POST', body: JSON.stringify({ role, content }) }); },
  async getTenants() { return request<Tenant[]>('/tenants'); },
  async createTenant(data: any) { return request<any>('/tenants', { method: 'POST', body: JSON.stringify(data) }); },
  async updateTenant(id: string, data: any) { return request<any>(`/tenants/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteTenant(id: string) { return request<any>(`/tenants/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async provisionTenantAtendo(id: string, data?: any) { return request<any>(`/tenants/${encodeURIComponent(id)}/provision-atendo`, { method: 'POST', body: JSON.stringify(data || {}) }); },
  async activateTenantPlan(id: string, ...args: any[]) { return request<any>(`/tenants/${encodeURIComponent(id)}/activate-plan`, { method: 'POST', body: JSON.stringify({ plan: args[0], days: args[1], ...(typeof args[0] === 'object' ? args[0] : {}) }) }); },
  async getNotifications() { return request<any[]>('/notifications'); },
  async markNotificationRead(id: string) { return request<any>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }); },
  async markAllNotificationsRead() { return request<any>('/notifications/mark-all-read', { method: 'PUT' }); },
  async updateProfile(data: any) { return request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }); },
  async switchDemoUser(userId: string) { return request<any>('/auth/switch-demo', { method: 'POST', body: JSON.stringify({ userId }) }); },
  async startDemoSession(userId?: string) { return request<any>('/auth/demo-session', { method: 'POST', body: JSON.stringify(userId ? { userId } : {}) }); },
  async startSupportSession(targetUserId: string) { return request<any>('/support/sessions', { method: 'POST', body: JSON.stringify({ targetUserId }) }); },
  async endSupportSession() { return request<any>('/support/sessions/end', { method: 'POST' }); },
  async getNotificationModuleStatus(...args: any[]) { return request<any>('/billing/asaas/notification-module'); },
  async selectFreeNotificationModule(data?: any) { return request<any>('/billing/asaas/notification-module/free', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async createNotificationModuleSubscription(data: any) { return request<any>('/billing/asaas/notification-module/subscribe', { method: 'POST', body: JSON.stringify(data) }); },
  async cancelNotificationModule(data?: any) { return request<any>('/billing/asaas/notification-module/cancel', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async getAsaasFinancialSummary(...args: any[]) { return request<any>('/billing/asaas/financial-summary'); },
  async changeAsaasPlan(data: any) { return request<any>('/billing/asaas/subscription/change-plan', { method: 'POST', body: JSON.stringify(data) }); },
  async createAsaasSubscription(data: any) { return request<any>('/billing/asaas/subscribe', { method: 'POST', body: JSON.stringify(data) }); },
  async cancelAsaasSubscription(data: any) { return request<any>('/billing/asaas/subscription/cancel', { method: 'POST', body: JSON.stringify(data) }); },
  async getAsaasSubscription(...args: any[]) { return request<any>('/billing/asaas/subscription'); },
  async testAsaasConnection(data?: any) { return request<any>('/billing/asaas/test', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async getCompanyStops(...args: any[]) { return request<any[]>('/company-stops'); },
  async createCompanyStop(data: any) { return request<any>('/company-stops', { method: 'POST', body: JSON.stringify(data) }); },
  async getLodgingPartners(...args: any[]) { return request<any[]>('/lodging-partners'); },
  async createLodgingPartner(data: any) { return request<any>('/lodging-partners', { method: 'POST', body: JSON.stringify(data) }); },
  async acceptFreight(id: string) { return request<any>(`/freights/${encodeURIComponent(id)}/accept`, { method: 'POST' }); },
  async assignFreightDriver(id: string, driverId: string) { return request<any>(`/freights/${encodeURIComponent(id)}/assign-driver`, { method: 'POST', body: JSON.stringify({ driverId }) }); },
  async getDriverCompanyLinks(...args: any[]) { return request<any[]>('/driver-company-links'); },
  async updateDriverCompanyLinkStatus(id: string, ...args: any[]) { return request<any>(`/driver-company-links/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status: args[0], freightId: args[1], scope: args[2], ...(typeof args[0] === 'object' ? args[0] : {}) }) }); },
  async registerDriver(data: any) { return request<any>('/drivers/register', { method: 'POST', body: JSON.stringify(data) }); },
  async getTripExpenses(...args: any[]) { return request<any[]>('/expenses'); },
  async createTripExpense(data: any) { return request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }); },
  async updateTripExpense(id: string, data: any) { return request<any>(`/expenses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteTripExpense(id: string) { return request<any>(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async getNextTalaoNumber(...args: any[]) { return request<any>('/forms/next-talao'); },
  async sendChecklistDispatch(data: any) { return request<any>('/notifications/checklist-dispatch', { method: 'POST', body: JSON.stringify(data) }); },
  async setPublicTrackingRevoked(id: string, revoked: boolean) { return request<any>(`/freights/${encodeURIComponent(id)}/public-tracking/revoke`, { method: 'POST', body: JSON.stringify({ revoked }) }); },
  async getStats(...args: any[]) { return request<any>('/stats'); },
  async getDetailedHealth(...args: any[]) { return request<any>('/health/detailed'); },
  async getPosts() { return request<any[]>('/posts'); },
  async getPageVersions(id: string) { return request<any>(`/pages/${encodeURIComponent(id)}/versions`); },
  async getErrorLogs(...args: any[]) { return request<any>('/error-logs'); },
  async cleanupErrorLogs(data?: any) { return request<any>('/error-logs', { method: 'DELETE', body: JSON.stringify(typeof data === 'number' ? { olderThanDays: data } : data || {}) }); },
  async getSaaSGlobalConfig() { return request<any>('/saas/config'); },
  async updateSaaSGlobalConfig(data: any) { return request<any>('/saas/config', { method: 'POST', body: JSON.stringify(data) }); },
  async testMapboxConnection(apiKey?: string) { return request<{ success: boolean; message: string }>('/saas/mapbox/test', { method: 'POST', body: JSON.stringify({ apiKey: apiKey || undefined }) }); },
  async getBackupStatus(...args: any[]) { return request<any>('/admin/backups/status'); },
  async requestManualBackup(data?: any) { return request<any>('/admin/backups/run', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async updateBackupNotifications(data: any) { return request<any>('/admin/backups/notifications', { method: 'PUT', body: JSON.stringify(data) }); },
  async testBackupWhatsApp(data?: any) { return request<any>('/admin/backups/whatsapp-test', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async getDatabaseStatus(...args: any[]) { return request<any>('/database/status'); },
  async getSshInstallScript(...args: any[]) { return request<any>('/database/ssh-install-script'); },
  async getPortainerStackYaml(...args: any[]) { return request<any>('/database/portainer-stack-yaml'); },
  async getDatabaseSchema(...args: any[]) { return request<any>('/database/schema'); },
  async testDatabaseConnection(data?: any) { return request<any>('/database/test', { method: 'POST', body: JSON.stringify(data || {}) }); },
  async migrateDatabase(data?: any) { return request<any>('/database/migrate', { method: 'POST', body: JSON.stringify(data || {}) }); },

  // Vehicles
  async getVehicles(search = '') { return request<Vehicle[]>(`/vehicles?search=${encodeURIComponent(search)}`); },
  async getVehicle(id: string) { return request<Vehicle>(`/vehicles/${id}`); },
  async createVehicle(data: any) { return request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }); },
  async updateVehicle(id: string, data: any) { return request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteVehicle(id: string) { return request<{ success: boolean }>(`/vehicles/${id}`, { method: 'DELETE' }); },
  async getCompanyVehicles() { return request<any[]>('/company-vehicles'); },
  async createCompanyVehicle(data: any) { return request<any>('/company-vehicles', { method: 'POST', body: JSON.stringify(data) }); },
  async updateCompanyVehicle(id: string, data: any) { return request<any>(`/company-vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteCompanyVehicle(id: string) { return request<{ success: boolean }>(`/company-vehicles/${id}`, { method: 'DELETE' }); },

  // Budgets
  async getBudgets() { return request<any[]>('/budgets'); },
  async getBudget(id: string) { return request<any>(`/budgets/${id}`); },
  async createBudget(data: any) { return request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }); },
  async updateBudget(id: string, data: any) { return request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, expectedVersion: (data as any).version }) }); },
  async updateBudgetStatus(id: string, status: string) { return request<any>(`/budgets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }); },
  async duplicateBudget(id: string) { return request<any>(`/budgets/${id}/duplicate`, { method: 'POST' }); },
  async convertBudgetToFreight(id: string) { return request<any>(`/budgets/${id}/convert`, { method: 'POST' }); },
  async deleteBudget(id: string) { return request<any>(`/budgets/${id}`, { method: 'DELETE' }); },
  async geocode(query: string, options?: RequestInit) { return request<any[]>(`/mapbox/geocode?q=${encodeURIComponent(query)}`, options); },
  // ✅ NOVO: Endpoint protegido para geocodificação em rastreamento (token não exposto no cliente)
  async geocodeTracking(query: string, options?: RequestInit) {
    return request<any[]>(`/mapbox/geocode-tracking?q=${encodeURIComponent(query)}`, options);
  },
  async getDirections(origin: any, destination: any) { return request<any>(`/mapbox/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`); },
  async getClientConfig() { return request<any>('/mapbox/client-config'); },
};

export const budgetApi = {
  list: (search?: string, tenantId?: string) => request<any[]>(`/budgets?${new URLSearchParams({ ...(search ? { search } : {}), ...(tenantId ? { tenantId } : {}) }).toString()}`),
  get: (id: string) => request<any>(`/budgets/${id}`),
  create: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, expectedVersion: (data as any).version }) }),
  status: (id: string, status: string) => request<any>(`/budgets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  duplicate: (id: string) => request<any>(`/budgets/${id}/duplicate`, { method: 'POST' }),
  convert: (id: string) => request<any>(`/budgets/${id}/convert`, { method: 'POST' }),
  remove: (id: string) => request<any>(`/budgets/${id}`, { method: 'DELETE' }),
  geocode: (query: string, signal?: AbortSignal) => request<any[]>(`/mapbox/geocode?q=${encodeURIComponent(query)}`, signal ? { signal } : undefined),
  // ✅ NOVO: Endpoint protegido para geocodificação em rastreamento
  geocodeTracking: (query: string, options?: RequestInit) => request<any[]>(`/mapbox/geocode-tracking?q=${encodeURIComponent(query)}`, options),
  directions: (origin: any, destination: any) => {
    if (!Number.isFinite(Number(origin?.lng)) || !Number.isFinite(Number(origin?.lat)) || !Number.isFinite(Number(destination?.lng)) || !Number.isFinite(Number(destination?.lat))) {
      return Promise.reject(new Error('Coordenadas válidas de origem e destino são necessárias para calcular a rota.'));
    }
    const params = new URLSearchParams({
      origin: `${Number(origin.lng)},${Number(origin.lat)}`,
      destination: `${Number(destination.lng)},${Number(destination.lat)}`
    });
    return request<any>(`/mapbox/directions?${params.toString()}`);
  },
  clientConfig: () => request<any>('/mapbox/client-config')
};

export const publicTrackingApi = {
  geocode: (query: string, signal?: AbortSignal) => publicRequest<Array<{ id: string; placeName: string; address: string; city?: string; state?: string; lat: number; lng: number }>>(`/public/mapbox/geocode?q=${encodeURIComponent(query)}`, signal ? { signal } : undefined),
  lookupCep: (cep: string) => publicRequest<{ zipCode: string; address: string; neighborhood: string; city: string; state: string; complement?: string }>(`/public/cep?cep=${encodeURIComponent(cep)}`),
  clientConfig: () => publicRequest<{ enabled: boolean; apiKey: string; defaultStyle: string; defaultZoom: number }>(`/public/mapbox/client-config`)
};

export const clientApi = {
  list: (search = '', tenantId?: string) => request<any[]>(`/clients?${new URLSearchParams({ ...(search ? { search } : {}), ...(tenantId ? { tenantId } : {}) }).toString()}`),
  lookupCnpj: (cnpj: string, tenantId?: string) => {
    const normalized = normalizeCnpj(cnpj);
    return request<any>(`/clients/cnpj/${encodeURIComponent(normalized)}/lookup${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''}`);
  },
  create: (data: any, tenantId?: string) => request<any>('/clients', { method: 'POST', body: JSON.stringify({ ...data, ...(tenantId ? { tenantId } : {}) }) }),
  update: (id: string, data: any) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/clients/${id}`, { method: 'DELETE' })
};

export const tenantApi = {
  getTenants: () => request<Tenant[]>('/tenants'),
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  createTenant: (data: any) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id: string, data: any) => request<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTenant: (id: string) => request<{ success: boolean }>(`/tenants/${id}`, { method: 'DELETE' }),
  getMetrics: () => request<Metrics>('/admin/metrics'),
  listTenants: () => request<Tenant[]>('/tenants'),
  listInvoices: () => Promise.resolve([] as Invoice[]), // request<Invoice[]>('/admin/invoices'),
};
