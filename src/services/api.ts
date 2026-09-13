import { User, Tenant, Driver, Vehicle, Freight, Tenant as TenantType } from '../types';

type OfflineResponse = { formId: string; freightId?: string; responseId: string; stage: string; isDraft: boolean; answers: Record<string, any> };

// Auth Token Management
export const setAuthToken = (token: string) => {
  localStorage.setItem('elolog_auth_token', token);
};

export const getAuthToken = (): string => {
  return localStorage.getItem('elolog_auth_token') || '';
};

export const clearAuthToken = () => {
  localStorage.removeItem('elolog_auth_token');
  localStorage.removeItem('elolog_refresh_token');
};

export const setAuthSession = (token: string, refreshToken?: string) => {
  setAuthToken(token);
  if (refreshToken) {
    localStorage.setItem('elolog_refresh_token', refreshToken);
  }
};

const getRefreshToken = (): string => {
  return localStorage.getItem('elolog_refresh_token') || '';
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
    if (res.status === 401 && token && allowRefresh && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/logout') && getRefreshToken()) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ refreshToken: getRefreshToken() }) });
        const refreshData = await refreshResponse.json().catch(() => ({}));
        if (refreshResponse.ok && refreshData.token && refreshData.refreshToken) {
          setAuthSession(refreshData.token, refreshData.refreshToken);
          return request<T>(endpoint, options, false);
        }
      } catch { /* fall through to session clearing */ }
      clearAuthToken();
    } else if (res.status === 401 && token) clearAuthToken();
    const error = new Error(data.message || data.error || `Erro ${res.status}: Ocorreu um erro na requisição`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

async function publicRequest<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/api${endpoint}`, { headers: { Accept: 'application/json' } });
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
    }>('/auth/me');
  },
  async verifyOtp(phone: string, code: string) {
    return request<{ token: string; refreshToken: string; user: User }>('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
  },
  async startFreightInterest(data: any) {
    return request<{ userId: string }>('/freights/interest', { method: 'POST', body: JSON.stringify(data) });
  },
  async completeQuickDriver(userId: string, data: any) {
    return request<{ driver: Driver }>(`/drivers/${userId}/quick-complete`, { method: 'POST', body: JSON.stringify(data) });
  },
  async subscribePublicTracking(token: string, callback: (update: any) => void) {
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
  async updateFreightStatus(id: string, status: string) { return request<Freight>(`/freights/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }); },
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
    return request<any>('/integrations/whatsapp/qr', {
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
  async getDriver(id: string) { return request<Driver>(`/drivers/${id}`); },
  async createDriver(data: any) { return request<Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) }); },
  async updateDriver(id: string, data: any) { return request<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteDriver(id: string) { return request<{ success: boolean }>(`/drivers/${id}`, { method: 'DELETE' }); },
  async inviteDriver(email: string) { return request<{ success: boolean }>('/drivers/invite', { method: 'POST', body: JSON.stringify({ email }) }); },
  async linkDriverToCompany(driverId: string, tenantId: string) { return request<any>('/driver-company-links', { method: 'POST', body: JSON.stringify({ driverId, tenantId }) }); },
  async unlinkDriverFromCompany(linkId: string) { return request<{ success: boolean }>(`/driver-company-links/${linkId}`, { method: 'DELETE' }); },

  // Vehicles
  async getVehicles(search = '') { return request<Vehicle[]>(`/vehicles?search=${encodeURIComponent(search)}`); },
  async getVehicle(id: string) { return request<Vehicle>(`/vehicles/${id}`); },
  async createVehicle(data: any) { return request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }); },
  async updateVehicle(id: string, data: any) { return request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteVehicle(id: string) { return request<{ success: boolean }>(`/vehicles/${id}`, { method: 'DELETE' }); },

  // Budgets
  async getBudgets() { return request<any[]>('/budgets'); },
  async getBudget(id: string) { return request<any>(`/budgets/${id}`); },
  async createBudget(data: any) { return request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }); },
  async updateBudget(id: string, data: any) { return request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, expectedVersion: (data as any).version }) }); },
  async updateBudgetStatus(id: string, status: string) { return request<any>(`/budgets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }); },
  async duplicateBudget(id: string) { return request<any>(`/budgets/${id}/duplicate`, { method: 'POST' }); },
  async convertBudgetToFreight(id: string) { return request<any>(`/budgets/${id}/convert`, { method: 'POST' }); },
  async deleteBudget(id: string) { return request<any>(`/budgets/${id}`, { method: 'DELETE' }); },
  async geocode(query: string) { return request<any[]>(`/mapbox/geocode?q=${encodeURIComponent(query)}`); },
  // ✅ NOVO: Endpoint protegido para geocodificação em rastreamento (token não exposto no cliente)
  async geocodeTracking(query: string, options?: RequestInit) { 
    return request<any[]>(`/mapbox/geocode-tracking?q=${encodeURIComponent(query)}`, options); 
  },
  async getDirections(origin: any, destination: any) { return request<any>(`/mapbox/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`); },
  async getClientConfig() { return request<any>('/mapbox/client-config'); },
};

export const budgetApi = {
  list: () => request<any[]>('/budgets'),
  get: (id: string) => request<any>(`/budgets/${id}`),
  create: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, expectedVersion: (data as any).version }) }),
  status: (id: string, status: string) => request<any>(`/budgets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  duplicate: (id: string) => request<any>(`/budgets/${id}/duplicate`, { method: 'POST' }),
  convert: (id: string) => request<any>(`/budgets/${id}/convert`, { method: 'POST' }),
  remove: (id: string) => request<any>(`/budgets/${id}`, { method: 'DELETE' }),
  geocode: (query: string) => request<any[]>(`/mapbox/geocode?q=${encodeURIComponent(query)}`),
  // ✅ NOVO: Endpoint protegido para geocodificação em rastreamento
  geocodeTracking: (query: string, options?: RequestInit) => request<any[]>(`/mapbox/geocode-tracking?q=${encodeURIComponent(query)}`, options),
  directions: (origin: any, destination: any) => request<any>(`/mapbox/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`),
  clientConfig: () => request<any>('/mapbox/client-config')
};

export const clientApi = {
  list: (search = '') => request<any[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  lookupCnpj: (cnpj: string) => request<any>(`/clients/cnpj/${encodeURIComponent(cnpj)}/lookup`),
  create: (data: any) => request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/clients/${id}`, { method: 'DELETE' })
};

export const tenantApi = {
  getTenants: () => request<Tenant[]>('/tenants'),
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  createTenant: (data: any) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id: string, data: any) => request<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTenant: (id: string) => request<{ success: boolean }>(`/tenants/${id}`, { method: 'DELETE' }),
};
