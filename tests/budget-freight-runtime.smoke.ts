import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { apiRouter } from '../server/api';
import { db } from '../server/db';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is required for runtime test.');

const now = new Date().toISOString();
const tenantId = `tenant-test-${randomUUID()}`;
const realAdminId = `user-admin-${randomUUID()}`;
const testAdminId = `user-test-admin-${randomUUID()}`;
const superAdminId = `user-super-admin-${randomUUID()}`;
const incompleteBudgetId = `budget-incomplete-${randomUUID()}`;
const completeBudgetId = `budget-complete-${randomUUID()}`;

const tenant = {
  id: tenantId,
  name: 'Tenant Runtime Test',
  legalName: 'Tenant Runtime Test LTDA',
  cnpj: '12345678000199',
  email: 'tenant-runtime@example.com',
  phone: '5511999999999',
  city: 'São Paulo',
  state: 'SP',
  plan: 'PROFISSIONAL',
  status: 'ATIVA',
  allowedOperations: ['CARGA_GERAL'],
  planLimits: { maxUsers: 25, maxDrivers: 100, maxFreightsMonthly: 500, customForms: true, exportReports: true, prioritySupport: false },
  createdAt: now,
  updatedAt: now
} as any;

const makeUser = (id: string, role: string, accountType: 'REAL' | 'TEST', readOnly = false, userTenantId?: string) => ({
  id,
  tenantId: userTenantId,
  name: `${role}-${id.slice(0, 6)}`,
  email: `${id}@example.com`,
  password: 'irrelevant',
  role,
  status: 'ATIVO',
  accountType,
  readOnly,
  createdAt: now,
  updatedAt: now
} as any);

const realAdmin = makeUser(realAdminId, 'ADMIN', 'REAL', false, tenantId);
const testAdmin = makeUser(testAdminId, 'ADMIN', 'TEST', true, tenantId);
const superAdmin = makeUser(superAdminId, 'SUPER_ADMIN', 'REAL', false);

const makeToken = (user: any) => {
  const sid = `sid-${randomUUID()}`;
  user.activeSessionId = sid;
  user.activeSessionExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return jwt.sign({ userId: user.id, sid, typ: 'access' }, secret, { expiresIn: '10m' });
};

const incompleteBudget = {
  id: incompleteBudgetId,
  tenantId,
  code: 'ORC-RUNTIME-1',
  status: 'APROVADO',
  version: 1,
  origin: { city: 'São Paulo', state: 'SP' },
  destination: { city: 'Campinas', state: 'SP' },
  cargoType: '',
  weightKg: 0,
  quantity: 0,
  financials: { totalFreight: 0, driverPaid: 0 },
  taxes: [],
  expenses: [],
  createdAt: now,
  updatedAt: now
} as any;

const completeBudget = {
  id: completeBudgetId,
  tenantId,
  code: 'ORC-RUNTIME-2',
  status: 'APROVADO',
  version: 1,
  origin: { address: 'Av. Paulista', number: '1000', city: 'São Paulo', state: 'SP', lat: -23.56, lng: -46.65 },
  destination: { address: 'Rua Conceição', number: '200', city: 'Campinas', state: 'SP', lat: -22.9, lng: -47.06 },
  cargoType: 'Carga seca',
  weightKg: 1200,
  quantity: 3,
  vehicleType: 'TRUCK',
  distanceKm: 100,
  financials: { totalFreight: 2500, driverPaid: 1200 },
  taxes: [],
  expenses: [],
  createdAt: now,
  updatedAt: now
} as any;

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const server = await new Promise<import('node:http').Server>((resolve) => {
  const instance = app.listen(0, () => resolve(instance));
});

const port = (server.address() as any).port;
const baseUrl = `http://127.0.0.1:${port}/api`;

const request = async (path: string, token: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', ['Bearer', token].join(' '));
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const json = await response.json().catch(() => ({}));
  return { response, json };
};

try {
  db.tenants.push(tenant);
  db.users.push(realAdmin, testAdmin, superAdmin);
  db.budgets.unshift(incompleteBudget, completeBudget);

  const realAdminToken = makeToken(realAdmin);
  const testAdminToken = makeToken(testAdmin);
  const superAdminToken = makeToken(superAdmin);

  const tenantAdminTemplates = await request('/tenant/report-templates', realAdminToken);
  assert.equal(tenantAdminTemplates.response.status, 200);
  assert.ok(Array.isArray(tenantAdminTemplates.json));

  const superAdminTemplates = await request(`/tenant/report-templates?tenantId=${encodeURIComponent(tenantId)}`, superAdminToken);
  assert.equal(superAdminTemplates.response.status, 200);
  assert.ok(Array.isArray(superAdminTemplates.json));

  const testAdminTemplates = await request('/tenant/report-templates', testAdminToken);
  assert.equal(testAdminTemplates.response.status, 403);
  assert.match(String(testAdminTemplates.json.error || ''), /teste/i);

  const invalidConversion = await request(`/budgets/${incompleteBudgetId}/convert`, realAdminToken, { method: 'POST', body: JSON.stringify({}) });
  assert.equal(invalidConversion.response.status, 409);
  assert.match(String(invalidConversion.json.error || ''), /Preencha os campos obrigatórios antes da conversão/i);

  const validConversion = await request(`/budgets/${completeBudgetId}/convert`, superAdminToken, { method: 'POST', body: JSON.stringify({}) });
  assert.equal(validConversion.response.status, 201);
  assert.equal(validConversion.json.budget?.status, 'CONVERTIDO');
  assert.ok(validConversion.json.freightId);

  console.log('BUDGET_FREIGHT_RUNTIME_SMOKE_OK');
} finally {
  server.close();
  db.budgets = db.budgets.filter((item: any) => ![incompleteBudgetId, completeBudgetId].includes(item.id));
  db.freights = db.freights.filter((item: any) => item.tenantId !== tenantId);
  db.users = db.users.filter((item: any) => ![realAdminId, testAdminId, superAdminId].includes(item.id));
  db.tenants = db.tenants.filter((item: any) => item.id !== tenantId);
}
