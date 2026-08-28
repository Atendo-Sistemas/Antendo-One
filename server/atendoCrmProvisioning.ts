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
  const candidates = [
    data?.tenantId,
    data?.tenant?.id,
    data?.data?.tenantId,
    data?.data?.tenant?.id,
    data?.id
  ];
  const value = candidates.find(candidate => typeof candidate === 'string' || typeof candidate === 'number');
  return value === undefined ? undefined : String(value);
}
