import { Tenant } from '../src/types';

export interface AtendoCrmAdminConfig {
  baseUrl: string;
  apiId: string;
  bearerToken: string;
}

export interface AtendoCrmCreateTenantRequest {
  url: string;
  method: 'POST';
  headers: {
    Authorization: string;
    'Content-Type': 'application/json';
  };
  body: {
    name: string;
    email: string;
    password: string;
    tenantName: string;
    phone: string;
    plano: string;
    timetest: string;
    recurrence: string;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return String(baseUrl || '').trim().replace(/\/+$/, '');
}

// Plan 18 is the plan configured for automatic provisioning in this Atendo One environment.
const ATENDO_CRM_DEFAULT_PLAN_ID = '18';

function planToAtendoId(_plan: Tenant['plan']): string {
  return ATENDO_CRM_DEFAULT_PLAN_ID;
}

function trialTimeForTenant(_tenant: Tenant): string {
  return '3';
}

function recurrenceForTenant(_tenant: Tenant): string {
  return 'MENSAL';
}

export function buildAtendoCrmCreateTenantRequest(
  config: AtendoCrmAdminConfig,
  tenant: Tenant,
  generatedPassword: string
): AtendoCrmCreateTenantRequest {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  if (!baseUrl || !config.apiId || !config.bearerToken) {
    throw new Error('A URL, o API ID e o token administrativo do Atendo CRM são necessários para provisionar uma empresa.');
  }
  if (!generatedPassword || generatedPassword.length < 12) {
    throw new Error('O provisionamento exige uma senha técnica temporária forte para o administrador externo.');
  }
  return {
    url: `${baseUrl}/v1/api/admin/${encodeURIComponent(config.apiId)}/createtenant`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.bearerToken}`,
      'Content-Type': 'application/json'
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

export function externalTenantIdFromResponse(data: any): string | undefined {
  const keys = new Set(['tenantid', 'tenant_id', 'tenantidexternal', 'externaltenantid', 'id']);
  const visited = new Set<any>();
  const queue: any[] = [data];
  let inspected = 0;
  while (queue.length && inspected < 500) {
    const current = queue.shift();
    inspected += 1;
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    for (const [key, value] of Object.entries(current)) {
      if (keys.has(key.toLowerCase()) && (typeof value === 'string' || typeof value === 'number') && String(value).trim()) return String(value);
      if (value && typeof value === 'object') queue.push(value);
    }
  }
  return undefined;
}
