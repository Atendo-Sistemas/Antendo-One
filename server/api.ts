import { Router, Request, Response, NextFunction } from 'express';
import { db, PUBLIC_DEMO_TENANT_ID, PUBLIC_DEMO_PRIMARY_USER_ID } from './db';
import { sqlAdapter } from './db/sqlAdapter';
import webpush from 'web-push';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { buildAtendoCrmCreateTenantRequest, externalTenantIdFromResponse } from './atendoCrmProvisioning';
import { sanitizeServerHtml } from './sanitizeHtml';
import {
  User,
  FreightStatus,
  Freight,
  Tenant,
  Driver,
  Vehicle,
  FormDefinition,
  FormResponse,
  UserRole,
  WhatsAppConfig,
  WhatsAppConnectionStatus,
  TripExpenseReport,
  TripExpenseItem,
  WebPage,
  BlogPost,
  DriverCompanyLink,
  FreightInterest,
  CompanyVehicle,
  PublicFreightSummary,
  NotificationModuleConfig,
  NotificationModulePlan,
  NotificationBillingStatus,
  NotificationModuleStatus,
  NotificationTemplate,
  BackupNotificationConfig,
  BackupStatusResponse,
  LegalDocumentVersion,
  ReportTemplateType,
  TenantReportTemplate
} from '../src/types';


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing or insecure.');
  process.exit(1);
}
const SAFE_JWT_SECRET = JWT_SECRET;

export const apiRouter = Router();

const BACKUP_CONTROL_DIR = process.env.BACKUP_CONTROL_DIR || '/var/lib/elolog-backup';
const BACKUP_STATUS_FILE = process.env.BACKUP_STATUS_FILE || path.join(BACKUP_CONTROL_DIR, 'status.json');
const BACKUP_REQUEST_DIR = process.env.BACKUP_REQUEST_DIR || path.join(BACKUP_CONTROL_DIR, 'requests');
const BACKUP_EVENT_SECRET_FILE = process.env.BACKUP_EVENT_SECRET_FILE || '/run/secrets/elolog_backup_event_secret';
const BACKUP_EVENT_MAX_SKEW_MS = 10 * 60 * 1000;
const BACKUP_STATE_VALUES = new Set(['SUCCESS', 'ERROR', 'RUNNING', 'UNKNOWN', 'UNAVAILABLE']);
const BACKUP_ITEM_STATUS_VALUES = new Set(['SUCCESS', 'ERROR', 'RUNNING', 'UNKNOWN']);

const defaultBackupNotificationConfig = (): BackupNotificationConfig => ({
  enabled: true,
  whatsappEnabled: false,
  whatsappPhone: '',
  notifyOnFailure: true,
  notifyOnSuccess: false
});

const backupNotificationConfig = (): BackupNotificationConfig => ({
  ...defaultBackupNotificationConfig(),
  ...(db.saasGlobalConfig.backupNotifications || {})
});

const maskBackupPhone = (phone: string): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return `${digits.slice(0, 4)}******${digits.slice(-2)}`;
};

const safeBackupNotifications = () => {
  const config = backupNotificationConfig();
  return {
    enabled: config.enabled,
    whatsappEnabled: config.whatsappEnabled,
    whatsappPhone: config.whatsappPhone ? '********' : '',
    whatsappPhoneMasked: maskBackupPhone(config.whatsappPhone),
    notifyOnFailure: config.notifyOnFailure,
    notifyOnSuccess: config.notifyOnSuccess,
    updatedAt: config.updatedAt
  };
};

const isSafeBackupName = (value: unknown): boolean => /^[A-Za-z0-9._-]{1,100}$/.test(String(value || ''));
const isSafeRunId = (value: unknown): boolean => /^[A-Za-z0-9._-]{1,100}$/.test(String(value || ''));
const normalizeBackupPhone = (value: unknown): string => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  const candidate = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  if (!/^55\d{10,11}$/.test(candidate)) throw new Error('Informe um WhatsApp brasileiro válido com DDD.');
  return candidate;
};

const backupNotificationConfigFromInput = (input: any, current?: BackupNotificationConfig): BackupNotificationConfig => {
  const base = { ...defaultBackupNotificationConfig(), ...(current || {}) };
  const rawPhone = input?.whatsappPhone === '********' ? base.whatsappPhone : input?.whatsappPhone;
  return {
    enabled: input?.enabled === undefined ? base.enabled : Boolean(input.enabled),
    whatsappEnabled: input?.whatsappEnabled === undefined ? base.whatsappEnabled : Boolean(input.whatsappEnabled),
    whatsappPhone: rawPhone === undefined ? base.whatsappPhone : normalizeBackupPhone(rawPhone),
    notifyOnFailure: input?.notifyOnFailure === undefined ? base.notifyOnFailure : Boolean(input.notifyOnFailure),
    notifyOnSuccess: input?.notifyOnSuccess === undefined ? base.notifyOnSuccess : Boolean(input.notifyOnSuccess),
    updatedAt: new Date().toISOString()
  };
};

const readBackupStatus = async (): Promise<BackupStatusResponse> => {
  const notifications = safeBackupNotifications();
  const unavailable: BackupStatusResponse = {
    configured: false,
    state: 'UNAVAILABLE',
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: 'O monitor de backup ainda não está disponível neste processo.',
    backups: [],
    manualRequestPending: false,
    retention: Number(process.env.ELOLOG_BACKUP_RETENTION || 3),
    schedule: 'Diário às 03:00 (America/Sao_Paulo)',
    notifications: {
      enabled: notifications.enabled,
      whatsappEnabled: notifications.whatsappEnabled,
      whatsappPhoneMasked: notifications.whatsappPhoneMasked,
      notifyOnFailure: notifications.notifyOnFailure,
      notifyOnSuccess: notifications.notifyOnSuccess
    }
  };
  try {
    const raw = await fs.promises.readFile(BACKUP_STATUS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as any;
    const state = BACKUP_STATE_VALUES.has(parsed?.state) ? parsed.state : 'UNKNOWN';
    const backups = Array.isArray(parsed?.backups) ? parsed.backups.filter((item: any) => isSafeBackupName(item?.name)).slice(0, 3).map((item: any) => ({
      name: String(item.name),
      generatedAt: typeof item.generatedAt === 'string' ? item.generatedAt : null,
      sizeBytes: Number.isFinite(Number(item.sizeBytes)) ? Math.max(0, Number(item.sizeBytes)) : 0,
      verified: item.verified === true,
      status: BACKUP_ITEM_STATUS_VALUES.has(item.status) ? item.status : 'UNKNOWN'
    })) : [];
    let manualRequestPending = parsed?.manualRequestPending === true;
    try {
      const requests = await fs.promises.readdir(BACKUP_REQUEST_DIR);
      manualRequestPending = requests.some(name => /^manual-[A-Za-z0-9-]+\.request$/.test(name));
    } catch {
      // The request directory is optional until the host bridge is mounted.
    }
    return {
      configured: true,
      state,
      lastSuccessAt: typeof parsed?.lastSuccessAt === 'string' ? parsed.lastSuccessAt : null,
      lastErrorAt: typeof parsed?.lastErrorAt === 'string' ? parsed.lastErrorAt : null,
      lastErrorMessage: typeof parsed?.lastErrorMessage === 'string' ? parsed.lastErrorMessage.slice(0, 180) : null,
      backups,
      manualRequestPending,
      retention: Number.isInteger(Number(parsed?.retention)) ? Math.max(1, Number(parsed.retention)) : 3,
      schedule: typeof parsed?.schedule === 'string' ? parsed.schedule.slice(0, 100) : unavailable.schedule,
      notifications: unavailable.notifications
    };
  } catch (error: any) {
    if (error?.code !== 'ENOENT') return { ...unavailable, state: 'UNKNOWN', lastErrorMessage: 'Não foi possível ler o status do monitor de backup.' };
    return unavailable;
  }
};

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(
      'mailto:contato@portaldefretes.com.br',
      publicVapidKey,
      privateVapidKey
    );
  } catch (e) {
    console.warn('VAPID setup warning:', e);
  }
} else {
  console.warn('VAPID keys are not configured; push notifications are disabled.');
}

export async function sendPushNotificationToAll(payload: any) {
  const subs = (db as any).pushSubscriptions || [];
  for (let i = subs.length - 1; i >= 0; i--) {
    const sub = subs[i];
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        subs.splice(i, 1);
      }
    }
  }
}

// Middleware to extract user from Authorization header or session demo token
interface SupportSessionRecord {
  id: string;
  actorUserId: string;
  targetUserId: string;
  expiresAt: string;
}

const SUPPORT_SESSION_TTL_MS = 30 * 60 * 1000;
const USER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const activeSupportSessions = new Map<string, SupportSessionRecord>();

function issueUserSession(user: User) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + USER_SESSION_TTL_MS).toISOString();
  user.activeSessionId = sessionId;
  user.activeSessionExpiresAt = expiresAt;
  const token = jwt.sign({ userId: user.id, sid: sessionId }, SAFE_JWT_SECRET, { expiresIn: '24h' });
  db.saveAuthToken(token, user.id, new Date(expiresAt));
  void db.persistNow();
  return { token, expiresAt };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenant?: Tenant | null;
  supportSession?: SupportSessionRecord;
}

const TENANT_ADMIN_ROLES: UserRole[] = ['EMPRESA_SUPER_ADMIN', 'ADMIN'];
const DIRECTORY_ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'];
const TENANT_USER_ROLES: UserRole[] = ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USUARIO', 'MOTORISTA'];
const canManageTenantDirectory = (user: User | undefined): boolean => Boolean(user && DIRECTORY_ADMIN_ROLES.includes(user.role));
const canAssignUserRole = (actor: User | undefined, targetRole: unknown): targetRole is UserRole => {
  if (!actor || !TENANT_USER_ROLES.includes(targetRole as UserRole) && targetRole !== 'SUPER_ADMIN') return false;
  if (targetRole === 'SUPER_ADMIN') return actor.role === 'SUPER_ADMIN';
  if (targetRole === 'EMPRESA_SUPER_ADMIN') return actor.role === 'SUPER_ADMIN';
  return DIRECTORY_ADMIN_ROLES.includes(actor.role);
};

const VALID_STATUS_TRANSITIONS: Record<FreightStatus, FreightStatus[]> = {
  RASCUNHO: ['PUBLICADO', 'CANCELADO'],
  PUBLICADO: ['DISPONIVEL', 'RESERVADO', 'CANCELADO'],
  DISPONIVEL: ['RESERVADO', 'CANCELADO'],
  RESERVADO: ['EM_COLETA', 'DISPONIVEL', 'CANCELADO'],
  EM_COLETA: ['COLETADO', 'CANCELADO'],
  COLETADO: ['EM_TRANSITO', 'CANCELADO'],
  EM_TRANSITO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: []
};

// Auth / Identity Middleware
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const path = req.path;

  // Explicit public / unauthenticated routes
  const publicPaths = [
    '/auth/login',
    '/auth/request-otp',
    '/auth/verify-otp',
    '/auth/register-company',
    '/auth/verify-registration',
    '/auth/register-driver',
    '/auth/switch-demo',
    '/auth/demo-session',
    '/health',
    '/internal/backups/event'
  ];

  const isPublicRoute =
    publicPaths.includes(path) ||
    (path === '/saas/config' && req.method === 'GET') ||
    (path === '/push/vapid-key' && req.method === 'GET');
  const routeExists = ((apiRouter as any).stack || []).some((layer: any) => {
    if (!layer.route || typeof layer.match !== 'function') return false;
    const methods = layer.route.methods || {};
    return Boolean(layer.match(path) && (methods[req.method.toLowerCase()] || methods._all));
  });
  if (!routeExists && !publicPaths.includes(path)) {
    return res.status(404).json({ error: 'Rota não encontrada.' });
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();

    if (token) {
      // 1. Attempt JWT verification
      try {
                const decoded = jwt.verify(token, SAFE_JWT_SECRET) as {
          userId: string;
          support?: boolean;
          supportSessionId?: string;
          sid?: string;
          actorUserId?: string;
          targetUserId?: string;
        };
        const foundUser = db.users.find(u => u.id === decoded.userId);
        if (foundUser) {
          if (decoded.support !== true && foundUser.activeSessionId && (decoded.sid !== foundUser.activeSessionId || !foundUser.activeSessionExpiresAt || Date.parse(foundUser.activeSessionExpiresAt) <= Date.now())) {
            return res.status(401).json({ error: 'Sessão substituída, expirada ou revogada. Faça login novamente.' });
          }
          if (decoded.support === true) {
            const supportSession = decoded.supportSessionId ? activeSupportSessions.get(decoded.supportSessionId) : undefined;
            const actorUser = decoded.actorUserId ? db.users.find(u => u.id === decoded.actorUserId) : undefined;
            const validSupportSession = Boolean(
              supportSession &&
              actorUser?.role === 'SUPER_ADMIN' &&
              supportSession.actorUserId === actorUser.id &&
              supportSession.targetUserId === foundUser.id &&
              decoded.targetUserId === foundUser.id &&
              Date.parse(supportSession.expiresAt) > Date.now()
            );
            if (!validSupportSession) {
              if (decoded.supportSessionId) activeSupportSessions.delete(decoded.supportSessionId);
              return res.status(401).json({ error: 'Sessão de suporte inválida ou expirada.' });
            }
            req.supportSession = supportSession;
          }
          req.user = foundUser;
          req.tenant = foundUser.tenantId ? db.tenants.find(t => t.id === foundUser.tenantId) || null : null;
          return next();
        }
      } catch (err) {
        // Fall through to direct user id check
      }

      // Invalid JWTs are never accepted as user identifiers.
      // If token provided was invalid and route is not public, reject
      if (!isPublicRoute) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
    }
  }

  // Allow public routes through without user
  if (isPublicRoute) {
    return next();
  }

  return res.status(401).json({ error: 'Não autenticado' });
}

// Helper to safely strip sensitive credentials before returning User object to client
export function sanitizeUser(user?: User | null): any {
  if (!user) return user;
  const { password, activeSessionId, activeSessionExpiresAt, ...safeUser } = user as any;
  return safeUser;
}

function sanitizeDriver(driver?: Driver | null): any {
  if (!driver) return driver;
  const { bankName, bankAgency, bankAccount, pixKeyType, pixKey, ...safeDriver } = driver as any;
  return safeDriver;
}

function safeSupportIdentity(user: User): Pick<User, 'id' | 'name' | 'email' | 'role' | 'tenantId'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  };
}

function getSessionDataForUser(targetUser: User) {
  const targetTenant = targetUser.tenantId ? db.tenants.find(t => t.id === targetUser.tenantId) || null : null;
  let driver: Driver | undefined;
  let vehicles: Vehicle[] = [];
  if (targetUser.role === 'MOTORISTA' && targetUser.driverId) {
    driver = db.drivers.find(item => item.id === targetUser.driverId || item.userId === targetUser.id);
    if (driver) vehicles = db.vehicles.filter(vehicle => vehicle.driverId === driver!.id);
  }
  return {
    user: sanitizeUser(targetUser),
    tenant: targetTenant,
    driver,
    vehicles
  };
}

const CURRENT_LEGAL_VERSIONS = {
  terms: '2026-08-27.1',
  privacy: '2026-08-27.1'
};
const escapeEmailHtml = (value: string) => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
const interpolateNotification = (template: string, values: Record<string, any>) => String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => String(values[key] ?? ''));
const notificationTemplateFor = (eventKey: string): any => db.saasGlobalConfig.notificationTemplates?.find(template => template.eventKey === eventKey);
const LOGIN_OTP_EVENT_KEY = 'LOGIN_OTP';
const LOGIN_OTP_DEFAULT_BODY = '{nomePlataforma}: seu código de acesso é {codigo}. Válido por {validadeMinutos} minutos. Não compartilhe este código.';
const LOGIN_OTP_REQUIRED_VARIABLES = ['codigo', 'validadeMinutos'] as const;
const LOGIN_OTP_ALLOWED_VARIABLES = new Set(['nomePlataforma', 'codigo', 'validadeMinutos']);

const configuredPlatformName = (): string => {
  const configured = String(db.saasGlobalConfig.systemName || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return configured || 'Atendo One';
};

const renderLoginOtpMessage = (code: string, validityMinutes: number, tenantId?: string | null): string => {
  const template = notificationTemplateForTenant(LOGIN_OTP_EVENT_KEY, tenantId);
  const candidate = typeof template?.whatsappBody === 'string' ? template.whatsappBody.trim() : '';
  const hasRequiredVariables = LOGIN_OTP_REQUIRED_VARIABLES.every(variable => candidate.includes(`{${variable}}`));
  const body = hasRequiredVariables && candidate ? candidate : LOGIN_OTP_DEFAULT_BODY;
  const tenant = tenantId ? db.tenants.find(item => item.id === tenantId) : undefined;
  return interpolateNotification(body, {
    nomePlataforma: configuredPlatformName(),
    nomeEmpresa: tenant?.name || '',
    empresa: tenant?.name || '',
    razaoSocial: tenant?.legalName || '',
    cnpjEmpresa: tenant?.cnpj || '',
    emailEmpresa: tenant?.email || '',
    telefoneEmpresa: tenant?.phone || '',
    cidadeEmpresa: tenant?.city || '',
    estadoEmpresa: tenant?.state || '',
    codigo: code,
    validadeMinutos: String(validityMinutes)
  }).trim();
};

const tenantOwnNumberActive = (tenantId?: string | null): boolean => {
  if (!tenantId) return false;
  const tenant = db.tenants.find(item => item.id === tenantId);
  return Boolean(tenant?.notificationPlan === 'OWN_NUMBER' && tenant.notificationBillingStatus === 'ACTIVE');
};

const notificationTemplateForTenant = (eventKey: string, tenantId?: string | null): NotificationTemplate | undefined => {
  const globalTemplate = notificationTemplateFor(eventKey) as NotificationTemplate | undefined;
  if (!globalTemplate || !tenantOwnNumberActive(tenantId)) return globalTemplate;
  const tenantTemplate = db.tenantNotificationTemplates.get(String(tenantId))?.find(template => template.eventKey === eventKey);
  if (!tenantTemplate) return globalTemplate;
  return {
    ...globalTemplate,
    ...tenantTemplate,
    systemLocked: globalTemplate.systemLocked,
    channels: { ...globalTemplate.channels, ...tenantTemplate.channels },
    variables: [...globalTemplate.variables]
  };
};

const notificationTemplatesForTenant = (tenantId: string): Array<NotificationTemplate & { source: 'GLOBAL' | 'TENANT' }> => {
  const overrides = db.tenantNotificationTemplates.get(tenantId) || [];
  return (db.saasGlobalConfig.notificationTemplates || []).map(template => {
    const override = overrides.find(item => item.eventKey === template.eventKey);
    return {
      ...template,
      ...(override || {}),
      source: override ? 'TENANT' : 'GLOBAL',
      systemLocked: template.systemLocked,
      channels: { ...template.channels, ...(override?.channels || {}) },
      variables: [...template.variables]
    };
  });
};

const notificationValuesForTenant = (tenantId: string | null | undefined, values: Record<string, any>): Record<string, any> => {
  const tenant = tenantId ? db.tenants.find(item => item.id === tenantId) : undefined;
  return {
    ...values,
    nomePlataforma: configuredPlatformName(),
    empresa: values.empresa || tenant?.name || '',
    nomeEmpresa: values.nomeEmpresa || tenant?.name || '',
    razaoSocial: values.razaoSocial || tenant?.legalName || '',
    cnpjEmpresa: values.cnpjEmpresa || tenant?.cnpj || '',
    emailEmpresa: values.emailEmpresa || tenant?.email || '',
    telefoneEmpresa: values.telefoneEmpresa || tenant?.phone || '',
    cidadeEmpresa: values.cidadeEmpresa || tenant?.city || '',
    estadoEmpresa: values.estadoEmpresa || tenant?.state || ''
  };
};

const notificationValuesFor = (user: User, values: Record<string, any>): Record<string, any> => notificationValuesForTenant(user.tenantId, values);

const notificationTemplateTextIsSafe = (value: unknown, allowedVariables: string[]): boolean => {
  const text = String(value ?? '');
  const referencedVariables = Array.from(text.matchAll(/\{([a-zA-Z0-9_]+)\}/g), match => match[1]);
  return text.trim().length > 0 && text.length <= 1000 && referencedVariables.every(variable => allowedVariables.includes(variable));
};

const notificationTypeFor = (eventKey: string): any => eventKey === 'FRETE_ACEITO' ? 'FRETE_ACEITO' : eventKey === 'STATUS_ATUALIZADO' ? 'STATUS_ATUALIZADO' : eventKey === 'INTERESSE_FRETE' ? 'INTERESSE_FRETE' : 'SISTEMA';
const notificationConsentFor = (user: User) => ({
  email: user.notificationConsents?.email !== false,
  whatsapp: user.notificationConsents?.whatsapp === true
});
const addIgnoredNotificationDelivery = (eventKey: string, tenantId: string | null, userId: string, channel: 'email' | 'whatsapp', subject: string) => {
  db.addNotificationDelivery({ eventKey, tenantId, userId, channel, status: 'IGNORADO', subject, attempts: 0, errorMessage: 'Sem consentimento do destinatário para este canal.' });
};
async function sendConfiguredEmail(user: User, subject: string, body: string): Promise<void> {
  const config: any = db.saasGlobalConfig.emailConfig;
  if (!user.email || !config?.isActive || !config.host || !config.user || !config.password) return;
  const transporter = nodemailer.createTransport({
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
export async function dispatchConfiguredNotification(eventKey: string, recipients: User[], values: Record<string, any>): Promise<void> {
  const uniqueRecipients = Array.from(new Map(recipients.filter(Boolean).map(user => [user.id, user])).values());
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
      db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: 'inApp', status: 'ENVIADO', subject: title, attempts: 1, sentAt: new Date().toISOString() });
    }
    if (template.channels?.email && notificationConsentFor(user).email) {
      const delivery = db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: 'email', status: 'PENDENTE', subject: title, attempts: 0 });
      try {
        await sendConfiguredEmail(user, title, inAppMessage);
        db.updateNotificationDelivery(delivery.id, { status: 'ENVIADO', attempts: 1, sentAt: new Date().toISOString() });
      } catch (error: any) {
        db.updateNotificationDelivery(delivery.id, { status: 'FALHOU', attempts: 1, errorMessage: 'Falha no envio de e-mail.' });
        db.addErrorLog({ service: 'smtp', route: 'notification-dispatch', method: 'SMTP', event: 'EMAIL_NOTIFICATION_FAILED', message: 'Falha no envio de notificação por e-mail.', tenantId: user.tenantId || undefined, userId: user.id });
        console.warn('[Notification] email dispatch failed', { eventKey, userId: user.id, status: String(error?.code || 'SMTP_ERROR') });
      }
    }
    if (template.channels?.email && !notificationConsentFor(user).email) {
      addIgnoredNotificationDelivery(eventKey, tenantId, user.id, 'email', title);
    }
    if (template.channels?.whatsapp === true && notificationConsentFor(user).whatsapp) {
      const config = resolveWhatsAppConfig(user.tenantId || values.tenantId);
      const delivery = db.addNotificationDelivery({ eventKey, tenantId, userId: user.id, channel: 'whatsapp', status: 'PENDENTE', subject: title, attempts: 0 });
      try {
        const result = await sendToWhatsAppGateway(config, {
          number: user.phone,
          body: interpolateNotification(template.whatsappBody, recipientValues),
          externalKey: `${eventKey}-${Date.now()}-${user.id}`
        });
        const providerMessageId = String((result as any)?.messageId || (result as any)?.id || '') || undefined;
        db.updateNotificationDelivery(delivery.id, result.success ? { status: 'ENVIADO', attempts: 1, providerMessageId, sentAt: new Date().toISOString() } : { status: 'FALHOU', attempts: 1, providerMessageId, errorMessage: 'Gateway recusou a mensagem.' });
        if (!result.success) console.warn('[Notification] WhatsApp gateway rejected message', { eventKey, userId: user.id });
      } catch (error: any) {
        db.updateNotificationDelivery(delivery.id, { status: 'FALHOU', attempts: 1, errorMessage: 'Falha no gateway WhatsApp.' });
        db.addErrorLog({ service: 'whatsapp', route: 'notification-dispatch', method: 'POST', event: 'WHATSAPP_NOTIFICATION_FAILED', message: 'Falha no envio de notificação por WhatsApp.', tenantId: user.tenantId || undefined, userId: user.id });
        console.warn('[Notification] WhatsApp dispatch failed', { eventKey, userId: user.id, status: 'GATEWAY_ERROR' });
      }
    }
    if (template.channels?.whatsapp === true && !notificationConsentFor(user).whatsapp) {
      addIgnoredNotificationDelivery(eventKey, tenantId, user.id, 'whatsapp', title);
    }
  }
  void db.persistNow();
}

// Asaas webhook: public endpoint protected by the configured asaas-access-token.
apiRouter.post('/webhooks/asaas', async (req: AuthenticatedRequest, res: Response) => {
  const configuredToken = db.saasGlobalConfig.asaasConfig?.webhookToken || '';
  const receivedToken = String(req.header('asaas-access-token') || '');
  if (!configuredToken || receivedToken !== configuredToken) return res.status(401).json({ error: 'Webhook Asaas não autorizado' });
  const eventId = String(req.body?.id || '');
  const event = String(req.body?.event || '');
  const payment = req.body?.payment || {};
  const subscriptionPayload = req.body?.subscription || {};
  if (!eventId || !event) return res.status(400).json({ error: 'Evento Asaas inválido' });
  const duplicate = db.asaasPayments.some((item: any) => item.webhookEventIds?.includes(eventId)) || db.asaasSubscriptions.some((item: any) => item.webhookEventIds?.includes(eventId));
  if (!duplicate) {
    if (payment.id || payment.subscription) {
      let paymentRecord = db.asaasPayments.find((item: any) => item.asaasPaymentId === payment.id);
      if (!paymentRecord) {
        paymentRecord = { asaasPaymentId: payment.id || `event-${eventId}`, tenantId: undefined, planId: undefined, subscriptionId: payment.subscription || undefined, createdAt: new Date().toISOString(), webhookEventIds: [] };
        db.asaasPayments.push(paymentRecord);
      }
      paymentRecord.status = payment.status || event;
      paymentRecord.subscriptionId = payment.subscription || paymentRecord.subscriptionId;
      paymentRecord.updatedAt = new Date().toISOString();
      paymentRecord.webhookEventIds = [...(paymentRecord.webhookEventIds || []), eventId].slice(-50);
      const subscription = paymentRecord.subscriptionId ? db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === paymentRecord.subscriptionId) : undefined;
      if (subscription) {
        subscription.tenantId = subscription.tenantId || paymentRecord.tenantId || String(subscription.externalReference || '').split(':')[0] || undefined;
        subscription.status = event === 'PAYMENT_RECEIVED' ? 'ACTIVE' : (event === 'PAYMENT_OVERDUE' ? 'OVERDUE' : (payment.status || subscription.status || event));
        subscription.lastPaymentStatus = payment.status || event;
        subscription.lastPaymentId = payment.id || subscription.lastPaymentId;
        subscription.updatedAt = new Date().toISOString();
        subscription.webhookEventIds = [...(subscription.webhookEventIds || []), eventId].slice(-50);
        const tenant = db.tenants.find(item => item.id === subscription.tenantId);
        if (tenant) {
          if (isNotificationSubscription(subscription)) {
            tenant.notificationSubscriptionId = subscription.asaasSubscriptionId;
            tenant.notificationBillingStatus = event === 'PAYMENT_RECEIVED' ? 'ACTIVE' : (event === 'PAYMENT_OVERDUE' ? 'OVERDUE' : ((payment.status || '').includes('CANCELED') ? 'CANCELED' : (tenant.notificationBillingStatus || 'PENDING')));
            if (event === 'PAYMENT_RECEIVED') tenant.notificationPlan = 'OWN_NUMBER';
            tenant.notificationBillingNextDueDate = subscription.nextDueDate;
          } else {
            (tenant as any).asaasSubscriptionId = subscription.asaasSubscriptionId;
            (tenant as any).billingStatus = event === 'PAYMENT_RECEIVED' ? 'ACTIVE' : (event === 'PAYMENT_OVERDUE' ? 'OVERDUE' : ((payment.status || '').includes('CANCELED') ? 'CANCELED' : ((tenant as any).billingStatus || 'PENDING')));
            if (event === 'PAYMENT_RECEIVED' && subscription.planId) tenant.plan = subscription.planId;
          }
          tenant.updatedAt = new Date().toISOString();
        }
      }
    }
    if (subscriptionPayload.id) {
      let subscription = db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === subscriptionPayload.id);
      if (!subscription) {
        subscription = { asaasSubscriptionId: subscriptionPayload.id, tenantId: undefined, planId: undefined, webhookEventIds: [] };
        db.asaasSubscriptions.push(subscription);
      }
      subscription.status = subscriptionPayload.status || event;
      subscription.value = subscriptionPayload.value ?? subscription.value;
      subscription.cycle = subscriptionPayload.cycle || subscription.cycle;
      subscription.nextDueDate = subscriptionPayload.nextDueDate || subscription.nextDueDate;
      subscription.updatedAt = new Date().toISOString();
      subscription.webhookEventIds = [...(subscription.webhookEventIds || []), eventId].slice(-50);
      const externalReference = String(subscriptionPayload.externalReference || '');
      const tenantId = subscription.tenantId || externalReference.split(':')[0];
      if (tenantId) {
        subscription.tenantId = tenantId;
        const tenant = db.tenants.find(item => item.id === tenantId);
        if (tenant) {
          if (isNotificationSubscription(subscription) || externalReference.includes(':WHATSAPP_OWN_NUMBER')) {
            tenant.notificationSubscriptionId = subscription.asaasSubscriptionId;
            tenant.notificationBillingStatus = ['SUBSCRIPTION_INACTIVATED', 'SUBSCRIPTION_DELETED'].includes(event) ? 'INACTIVE' : (subscriptionPayload.status === 'OVERDUE' ? 'OVERDUE' : (tenant.notificationBillingStatus || 'PENDING'));
            tenant.notificationPlan = 'OWN_NUMBER';
            tenant.notificationBillingNextDueDate = subscription.nextDueDate;
          } else {
            (tenant as any).asaasSubscriptionId = subscription.asaasSubscriptionId;
            (tenant as any).billingStatus = ['SUBSCRIPTION_INACTIVATED', 'SUBSCRIPTION_DELETED'].includes(event) ? 'INACTIVE' : ((tenant as any).billingStatus || 'PENDING');
            (tenant as any).billingNextDueDate = subscription.nextDueDate;
          }
          tenant.updatedAt = new Date().toISOString();
        }
      }
    }
    db.addAuditLog({ tenantId: undefined, userId: 'asaas-webhook', userName: 'Asaas Webhook', userRole: 'SUPER_ADMIN', action: 'ASAAS_WEBHOOK', entity: payment.id ? 'AsaasPayment' : 'AsaasSubscription', entityId: String(payment.id || subscriptionPayload.id || eventId), details: `Evento ${event} recebido e processado de forma idempotente.` });
    await db.persistNow();
  }
  return res.status(200).json({ received: true, duplicate });
});

// Public SEO/content endpoints. Only globally published content is exposed.
const publicSeoConfig = () => {
  const canonicalUrl = safePublicUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL) || 'https://gestor.atendo.log.br';
  return {
    siteName: String(db.saasGlobalConfig.seo?.siteName || db.saasGlobalConfig.systemName || 'Atendo One').trim().slice(0, 200),
    title: String(db.saasGlobalConfig.seo?.title || `${db.saasGlobalConfig.systemName || 'Atendo One'} — Gestão e publicação de fretes`).trim().slice(0, 200),
    description: String(db.saasGlobalConfig.seo?.description || 'Plataforma de gestão logística para transportadoras, motoristas e operações de fretes.').trim().slice(0, 2000),
    keywords: String(db.saasGlobalConfig.seo?.keywords || '').trim().slice(0, 1000),
    canonicalUrl,
    ogImageUrl: safePublicUrl(db.saasGlobalConfig.seo?.ogImageUrl) || `${canonicalUrl}/og-default.svg`,
    locale: /^[a-z]{2}(?:_[A-Z]{2}|-[A-Z]{2})?$/.test(String(db.saasGlobalConfig.seo?.locale || '')) ? String(db.saasGlobalConfig.seo?.locale) : 'pt_BR',
    allowIndexing: db.saasGlobalConfig.seo?.allowIndexing !== false
  };
};
const sanitizePublicContent = (value: unknown) => sanitizeServerHtml(value);
const registrationOnlyContentSlugs = new Set(['termos-de-uso', 'politica-de-privacidade']);
const isRegistrationOnlySlug = (value: unknown) => registrationOnlyContentSlugs.has(String(value || '').trim().toLowerCase());
const publicContentItems = () => [
  ...db.pages.filter(page => page.tenantId === null && page.isPublished && page.isIndexable !== false && !isRegistrationOnlySlug(page.slug)).map(page => ({ ...page, kind: 'page' as const })),
  ...db.posts.filter(post => post.tenantId === null && post.isPublished && post.isIndexable !== false && !isRegistrationOnlySlug(post.slug)).map(post => ({ ...post, kind: 'post' as const }))
];
const publicContentBrand = (value: unknown) => String(value || '').replace(/Elo Log|Atendo One/gi, publicSeoConfig().siteName);
const publicContentCanonical = (item: any) => {
  const configuredCanonical = safePublicUrl(item.canonicalUrl);
  if (configuredCanonical) return configuredCanonical;
  const section = item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo';
  const itemPath = section === 'elo-log' && item.slug === 'elo-log' ? section : `${section}/${encodeURIComponent(item.slug)}`;
  return `${publicSeoConfig().canonicalUrl}/${itemPath}`;
};
const publicContentPayload = (item: any) => ({
  ...item,
  title: publicContentBrand(item.title),
  excerpt: publicContentBrand(item.excerpt),
  metaTitle: publicContentBrand(item.metaTitle),
  metaDescription: publicContentBrand(item.metaDescription),
  author: publicContentBrand(item.author),
  canonicalUrl: publicContentCanonical(item),
  content: sanitizePublicContent(item.content)
});
apiRouter.get('/public/seo', (req: AuthenticatedRequest, res: Response) => {
  res.json({ seo: publicSeoConfig(), content: publicContentItems().map(item => ({
    kind: item.kind,
    slug: item.slug,
    title: publicContentBrand(item.title),
    excerpt: publicContentBrand(item.excerpt || ''),
    updatedAt: item.updatedAt,
    canonicalUrl: publicContentCanonical(item),
    publicPath: (item as any).publicPath === 'elo-log' ? 'elo-log' : 'conteudo'
  })) });
});
apiRouter.get('/public/content', (req: AuthenticatedRequest, res: Response) => {
  res.json(publicContentItems().map(publicContentPayload));
});
apiRouter.get('/public/content/:slug', (req: AuthenticatedRequest, res: Response) => {
  const item = publicContentItems().find(content => content.slug === req.params.slug);
  if (!item) return res.status(404).json({ error: 'Conteúdo público não encontrado.' });
  const requestedSection = String(req.query.section || '').trim();
  const itemSection = (item as any).publicPath === 'elo-log' ? 'elo-log' : 'conteudo';
  if (requestedSection && ['conteudo', 'elo-log'].includes(requestedSection) && requestedSection !== itemSection) {
    return res.status(404).json({ error: 'Conteúdo público não encontrado nesta seção.' });
  }
  res.json(publicContentPayload(item));
});
apiRouter.get('/public/registration-content/:slug', (req: AuthenticatedRequest, res: Response) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  if (!registrationOnlyContentSlugs.has(slug)) return res.status(404).json({ error: 'Conteúdo disponível somente no cadastro não encontrado.' });
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const item = [...db.pages, ...db.posts].find(content => content.tenantId === null && content.slug === slug && content.isPublished);
  if (!item) return res.status(404).json({ error: 'Conteúdo legal ainda não foi publicado.' });
  res.json({ ...item, content: sanitizePublicContent(item.content) });
});

const normalizePublicPlate = (value: unknown) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const normalizePublicIdentity = (value: unknown) => String(value || '').replace(/\D/g, '');
const publicFreightSummary = (freight: Freight): PublicFreightSummary => ({
  id: freight.id,
  code: freight.code,
  operationType: freight.operationType || 'CARGA_GERAL',
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
const driverCanSeeFreightPrice = (driverId: string | undefined, freight: Freight) => {
  if (!driverId) return false;
  return db.driverCompanyLinks.some(link => link.driverId === driverId && link.tenantId === freight.tenantId && link.status === 'APROVADO' && (link.scope === 'EMPRESA' || (link.scope === 'FRETE' && link.freightId === freight.id && freight.publicPriceVisibleToRegistered === true)));
};
const redactDriverFreightPayment = (freight: Freight, driverId: string | undefined): Freight => driverCanSeeFreightPrice(driverId, freight)
  ? freight
  : { ...freight, payment: { ...freight.payment, price: undefined, clientRevenue: undefined, driverCost: undefined, notes: undefined } } as any;
const isPublicFreight = (freight: Freight) => {
  const expiresAt = freight.origin.date ? new Date(`${freight.origin.date}T23:59:59`) : null;
  return freight.publicListingEnabled === true && freight.operationType !== 'LOGISTICA_VEICULOS' && ['DISPONIVEL', 'PUBLICADO'].includes(freight.status) && (!expiresAt || expiresAt.getTime() >= Date.now());
};
apiRouter.get('/public/freights', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.freights.filter(isPublicFreight).map(publicFreightSummary));
});
apiRouter.post('/public/freights/:id/interest', async (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(item => item.id === req.params.id);
  if (!freight || !isPublicFreight(freight)) return res.status(404).json({ error: 'Frete público não encontrado ou encerrado.' });
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').trim();
  if (name.length < 5 || normalizePublicIdentity(phone).length < 10) return res.status(400).json({ error: 'Informe nome completo e telefone válido.' });
  if (req.body?.termsAccepted !== true || req.body?.privacyAccepted !== true) return res.status(400).json({ error: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' });
  const cleanPhone = normalizePhoneForLookup(phone);
  const lastInterestAttempt = publicInterestAttempts.get(cleanPhone);
  if (lastInterestAttempt && Date.now() - lastInterestAttempt < PUBLIC_INTEREST_RATE_WINDOW_MS) return res.status(429).json({ error: 'Já recebemos uma solicitação para este telefone. Aguarde alguns minutos antes de tentar novamente.' });
  publicInterestAttempts.set(cleanPhone, Date.now());
  if (publicInterestAttempts.size > 10000) { for (const [key, timestamp] of publicInterestAttempts) if (Date.now() - timestamp >= PUBLIC_INTEREST_RATE_WINDOW_MS) publicInterestAttempts.delete(key); }
  const phoneMatches = db.users.filter(user => normalizePhoneForLookup(user.phone) === cleanPhone);
  if (phoneMatches.length > 1) return res.status(409).json({ error: 'Este telefone está associado a mais de uma conta. Solicite suporte para evitar uma vinculação incorreta.' });
  const phoneOwner = phoneMatches[0];
  if (phoneOwner && phoneOwner.role !== 'MOTORISTA') return res.status(409).json({ error: 'Este telefone já está associado a outro tipo de conta e não pode ser duplicado como motorista.' });
  const existingUser = phoneOwner;
  let driver = existingUser?.driverId ? db.drivers.find(item => item.id === existingUser!.driverId || item.userId === existingUser!.id) : undefined;
  let user = existingUser;
  const now = new Date().toISOString();
  if (user && !driver) return res.status(409).json({ error: 'Este telefone está associado a uma conta de motorista sem perfil completo. Solicite suporte.' });
  if (!user) {
    const userId = `user-driver-public-${Date.now()}`;
    const driverId = `driver-public-${Date.now()}`;
    user = { id: userId, tenantId: null, name, email: '', phone, role: 'MOTORISTA', status: 'PENDENTE', accountType: 'REAL', readOnly: false, driverId, lastLoginAt: null, createdAt: now } as User;
    driver = { id: driverId, userId, tenantId: null, name, cpf: '', rg: '', birthDate: '', phone, email: '', zipCode: '', address: '', city: '', state: '', cnh: '', cnhCategory: 'B', cnhExpiresAt: '', status: 'PENDENTE', rating: 0, completedTrips: 0, vehiclesCount: 0, createdAt: now } as Driver;
    db.users.push(user);
    db.drivers.push(driver);
  } else {
    user.name = name;
    if (driver && !driver.name) driver.name = name;
  }
  if (!driver || !user) return res.status(500).json({ error: 'Não foi possível preparar o cadastro do motorista.' });
  const existingInterest = db.freightInterests.find(item => item.freightId === freight.id && item.driverId === driver!.id && ['PENDENTE', 'APROVADO'].includes(item.status));
  if (existingInterest) return res.status(409).json({ error: existingInterest.status === 'APROVADO' ? 'Este motorista já foi aprovado para o frete.' : 'Já existe uma solicitação pendente para este frete.' });
  const companyLink = db.getDriverCompanyLink(driver.id, freight.tenantId);
  const freightLink = db.getDriverCompanyLink(driver.id, freight.tenantId, freight.id);
  if (companyLink?.status === 'BLOQUEADO' || freightLink?.status === 'BLOQUEADO') return res.status(403).json({ error: 'A empresa bloqueou novas solicitações deste motorista.' });
  const interest: FreightInterest = { id: `freight-interest-${Date.now()}`, freightId: freight.id, driverId: driver.id, userId: user.id, tenantId: freight.tenantId, status: 'PENDENTE', profileCompleted: false, createdAt: now, updatedAt: now };
  db.freightInterests.unshift(interest);
  db.upsertDriverCompanyLink({ driverId: driver.id, tenantId: freight.tenantId, status: 'PENDENTE', scope: 'FRETE', source: 'FREIGHT_INTEREST', freightId: freight.id });
  db.addAuditLog({ tenantId: freight.tenantId, userId: user.id, userName: name, userRole: 'MOTORISTA', action: 'INTERESSE_FRETE', entity: 'FreightInterest', entityId: interest.id, details: `Solicitação de interesse no frete ${freight.code} criada para análise da empresa.` });
  const code = randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  activeOTPs.set(cleanPhone, { code, expiresAt, failedAttempts: 0 });
  activeOTPs.set(user.id, { code, expiresAt, failedAttempts: 0 });
  const waResult = await sendToWhatsAppGateway(resolveWhatsAppConfig(freight.tenantId), { number: cleanPhone, body: `ELO LOG: seu código para concluir o cadastro de interesse no frete ${freight.code} é ${code}. Válido por 5 minutos.`, externalKey: `freight-interest-${Date.now()}` });
  await db.persistNow();
  if (!waResult.success) return res.status(502).json({ error: 'Não foi possível enviar o código pelo WhatsApp. Solicite novamente em alguns instantes.' });
  res.status(201).json({ success: true, userId: user.id, message: 'Código enviado pelo WhatsApp. Valide o telefone para continuar.' });
});
// Apply auth middleware to all authenticated /api routes.
apiRouter.use(authMiddleware);

// Keep analytics after authMiddleware so req.user is available for the Super Admin check.
apiRouter.get('/analytics/visits', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode consultar analytics.' });
  const requestedDays = Number(req.query.days || 30);
  res.json(db.getVisitAnalytics(Number.isFinite(requestedDays) ? requestedDays : 30));
});

const readBackupEventSecret = (): string => {
  try {
    return fs.readFileSync(BACKUP_EVENT_SECRET_FILE, 'utf8').trim();
  } catch {
    return '';
  }
};

const verifyBackupEvent = (body: any, signatureHeader: unknown): boolean => {
  const secret = readBackupEventSecret();
  const state = String(body?.state || '');
  const timestamp = Number(body?.timestamp);
  const runId = String(body?.runId || '');
  const signature = String(signatureHeader || '').replace(/^sha256=/, '').trim().toLowerCase();
  if (!secret || !BACKUP_STATE_VALUES.has(state) || !Number.isSafeInteger(timestamp) || !isSafeRunId(runId) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(Date.now() - timestamp * 1000) > BACKUP_EVENT_MAX_SKEW_MS) return false;
  const signingInput = `${timestamp}.${state}.${runId}`;
  const expected = createHmac('sha256', secret).update(signingInput).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
};

const sendBackupWhatsAppAlert = async (state: 'SUCCESS' | 'ERROR', backupName: string, errorCode: string, runId: string): Promise<{ sent: boolean; message: string }> => {
  const config = backupNotificationConfig();
  const shouldSend = config.enabled && config.whatsappEnabled && Boolean(config.whatsappPhone) && (state === 'ERROR' ? config.notifyOnFailure : config.notifyOnSuccess);
  if (!shouldSend) return { sent: false, message: 'Alerta WhatsApp desativado para este evento.' };
  const when = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const body = state === 'ERROR'
    ? `Atendo One: o backup diário apresentou falha em ${when}. Código: ${errorCode || 'BACKUP_FAILED'}. Consulte o painel Super Admin.`
    : `Atendo One: o backup diário foi concluído em ${when}. Cópia: ${backupName}. Retenção local validada.`;
  try {
    const result = await sendToWhatsAppGateway(resolveWhatsAppConfig(), {
      number: config.whatsappPhone,
      body,
      externalKey: `backup-alert-${state.toLowerCase()}-${runId}`
    });
    if (!result.success) return { sent: false, message: 'Gateway WhatsApp recusou o alerta de backup.' };
    return { sent: true, message: 'Alerta WhatsApp enviado.' };
  } catch {
    return { sent: false, message: 'Falha ao enviar o alerta WhatsApp de backup.' };
  }
};

apiRouter.post('/internal/backups/event', async (req: AuthenticatedRequest, res: Response) => {
  if (!verifyBackupEvent(req.body, req.headers['x-backup-signature'])) return res.status(401).json({ error: 'Evento de backup não autorizado.' });
  const state = String(req.body?.state || '');
  if (!['SUCCESS', 'ERROR'].includes(state)) return res.status(400).json({ error: 'Estado de backup inválido.' });
  const backupName = String(req.body?.backupName || '');
  const errorCode = String(req.body?.errorCode || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40);
  const runId = String(req.body?.runId || '');
  if (backupName && !isSafeBackupName(backupName)) return res.status(400).json({ error: 'Nome de backup inválido.' });
  const alert = await sendBackupWhatsAppAlert(state as 'SUCCESS' | 'ERROR', backupName, errorCode, runId);
  if (state === 'ERROR') {
    db.addErrorLog({ service: 'backup', route: 'internal/backups/event', method: 'POST', event: 'BACKUP_FAILED', message: 'O backup local informou uma falha; consulte o monitor do Super Admin.' });
  }
  console.info('[Backup] Evento recebido', { state, alertSent: alert.sent });
  return res.json({ received: true, alertSent: alert.sent });
});

apiRouter.get('/notification-consent', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  const consent = req.user.notificationConsents || { email: true, whatsapp: false };
  return res.json({ email: consent.email !== false, whatsapp: consent.whatsapp === true, updatedAt: consent.updatedAt || null });
});

apiRouter.put('/notification-consent', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  if (isPublicDemoUser(req.user)) return res.status(403).json({ code: 'DEMO_FEATURE_RESTRICTED', error: 'O ambiente de demonstração não permite alterar preferências de comunicação.' });
  const current = req.user.notificationConsents || { email: true, whatsapp: false };
  const consent = {
    email: req.body?.email === undefined ? current.email !== false : Boolean(req.body.email),
    whatsapp: req.body?.whatsapp === true,
    updatedAt: new Date().toISOString(),
    source: 'USER' as const
  };
  req.user.notificationConsents = consent;
  db.addAuditLog({ tenantId: req.user.tenantId || undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ATUALIZAR_CONSENTIMENTO_NOTIFICACOES', entity: 'User', entityId: req.user.id, details: `Preferências de canal alteradas: e-mail ${consent.email ? 'ativo' : 'inativo'}; WhatsApp ${consent.whatsapp ? 'autorizado' : 'não autorizado'}.` });
  await db.persistNow();
  return res.json({ email: consent.email, whatsapp: consent.whatsapp, updatedAt: consent.updatedAt });
});

// Read-only / Test account Middleware
apiRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const excludePaths = [
      '/auth/login',
      '/auth/request-otp',
      '/auth/verify-otp',
      '/auth/register-company',
      '/auth/verify-registration',
      '/auth/register-driver'
    ];
    if (excludePaths.includes(req.path)) {
      return next();
    }

    if (isTestOrDemoUser(req.user)) {
      return res.status(403).json({
        code: 'READ_ONLY_TEST_ACCOUNT',
        error: 'Esta conta de teste é somente leitura. Perfis criados para teste ou demonstração não possuem permissão para realizar operações de gravação ou alteração no sistema.'
      });
    }
  }
  next();
});

// Demo accounts may operate only on the fictional tenant; sensitive platform controls stay server-side blocked.
apiRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && isPublicDemoUser(req.user)) {
    const restrictedPrefixes = ['/billing/asaas', '/admin/backups', '/integrations/whatsapp', '/saas/config', '/saas/notification-templates', '/tenant/notification-templates', '/tenant/report-templates', '/error-logs'];
    if (restrictedPrefixes.some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      return res.status(403).json({ code: 'DEMO_FEATURE_RESTRICTED', error: 'Esta função não está disponível no ambiente de demonstração.' });
    }
  }
  next();
});

apiRouter.get('/admin/backups/status', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  res.set('Cache-Control', 'no-store');
  return res.json(await readBackupStatus());
});

apiRouter.put('/admin/backups/notifications', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Perfis de teste não podem alterar alertas operacionais.' });
  try {
    const next = backupNotificationConfigFromInput(req.body, backupNotificationConfig());
    db.saasGlobalConfig.backupNotifications = next;
    db.addAuditLog({ tenantId: undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'BACKUP_ALERT_CONFIG_UPDATED', entity: 'BackupNotificationConfig', entityId: 'global-backup-alerts', details: `Alertas de backup atualizados; WhatsApp ${next.whatsappEnabled && next.whatsappPhone ? 'habilitado' : 'desabilitado'}; falhas ${next.notifyOnFailure ? 'ativas' : 'inativas'}; sucessos ${next.notifyOnSuccess ? 'ativos' : 'inativos'}.` });
    await db.persistNow();
    return res.json({ success: true, notifications: safeBackupNotifications() });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Preferências de alerta de backup inválidas.' });
  }
});

apiRouter.post('/admin/backups/run', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Perfis de teste não podem iniciar backups.' });
  try {
    await fs.promises.mkdir(BACKUP_REQUEST_DIR, { recursive: true, mode: 0o700 });
    const pending = (await fs.promises.readdir(BACKUP_REQUEST_DIR)).some(name => /^manual-[A-Za-z0-9-]+\.request$/.test(name));
    const current = await readBackupStatus();
    if (pending || current.state === 'RUNNING') return res.status(409).json({ error: 'Já existe um backup manual ou diário em andamento.' });
    const requestId = randomUUID();
    const target = path.join(BACKUP_REQUEST_DIR, `manual-${requestId}.request`);
    const temporary = path.join(BACKUP_REQUEST_DIR, `.manual-${requestId}.tmp`);
    await fs.promises.writeFile(temporary, JSON.stringify({ requestedAt: new Date().toISOString() }), { encoding: 'utf8', mode: 0o600 });
    await fs.promises.rename(temporary, target);
    db.addAuditLog({ tenantId: undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'BACKUP_MANUAL_REQUESTED', entity: 'BackupJob', entityId: requestId, details: 'Solicitou uma execução manual do backup local pelo painel Super Admin.' });
    await db.persistNow();
    return res.status(202).json({ success: true, requestId, status: 'QUEUED', message: 'Backup manual enfileirado. O status será atualizado pelo serviço de backup.' });
  } catch {
    return res.status(503).json({ error: 'O controle do backup não está disponível neste processo.' });
  }
});

apiRouter.post('/admin/backups/whatsapp-test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Perfis de teste não podem enviar alertas operacionais.' });
  const config = backupNotificationConfig();
  if (!config.whatsappEnabled || !config.whatsappPhone) return res.status(400).json({ error: 'Cadastre e ative um WhatsApp de alerta antes do teste.' });
  try {
    const result = await sendToWhatsAppGateway(resolveWhatsAppConfig(), {
      number: config.whatsappPhone,
      body: `Atendo One: teste de alerta do backup realizado pelo painel Super Admin em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
      externalKey: `backup-alert-test-${Date.now()}`
    });
    db.addAuditLog({ tenantId: undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: result.success ? 'BACKUP_ALERT_TEST_SENT' : 'BACKUP_ALERT_TEST_FAILED', entity: 'BackupNotificationConfig', entityId: 'global-backup-alerts', details: result.success ? 'Teste de alerta WhatsApp de backup enviado.' : 'Gateway recusou o teste de alerta WhatsApp de backup.' });
    await db.persistNow();
    return res.status(result.success ? 200 : 502).json({ success: result.success, message: result.success ? 'Mensagem de teste enviada.' : 'O gateway não confirmou a mensagem de teste.' });
  } catch {
    return res.status(502).json({ error: 'Não foi possível enviar a mensagem de teste pelo gateway WhatsApp.' });
  }
});

apiRouter.get('/public/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(item => item.id === req.params.id);
  if (!freight || !isPublicFreight(freight)) return res.status(404).json({ error: 'Frete público não encontrado ou encerrado.' });
  if (!req.user) return res.status(401).json({ error: 'Cadastre-se e valide seu telefone para consultar o valor.' });
  const interest = req.user.driverId ? db.freightInterests.find(item => item.freightId === freight.id && item.userId === req.user?.id && ['PENDENTE', 'APROVADO'].includes(item.status)) : undefined;
  const hasApprovedCompanyLink = db.driverCompanyLinks.some(item => item.driverId === req.user?.driverId && item.tenantId === freight.tenantId && item.scope === 'EMPRESA' && item.status === 'APROVADO');
  if (!hasApprovedCompanyLink && (!interest || interest.profileCompleted !== true)) return res.status(403).json({ error: 'É necessário concluir o cadastro do motorista antes de consultar este valor.' });
  if (!hasApprovedCompanyLink && freight.publicPriceVisibleToRegistered === false) return res.json({ ...publicFreightSummary(freight), price: null, priceAvailable: false, message: 'A empresa optou por não exibir o valor publicamente.' });
  return res.json({ ...publicFreightSummary(freight), price: freight.payment.price, priceAvailable: true });
});
apiRouter.post('/public/freights/:id/interest/complete', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== 'MOTORISTA' || !user.driverId) return res.status(403).json({ error: 'Somente o motorista autenticado pode concluir este cadastro.' });
  const freight = db.freights.find(item => item.id === req.params.id);
  const driver = db.drivers.find(item => item.id === user.driverId || item.userId === user.id);
  if (!freight || !driver) return res.status(404).json({ error: 'Solicitação ou motorista não encontrado.' });
  const interest = db.freightInterests.find(item => item.freightId === freight.id && item.driverId === driver.id && item.status === 'PENDENTE');
  if (!interest) return res.status(404).json({ error: 'Solicitação pendente não encontrada.' });
  const body = req.body || {};
  const required = ['email', 'cpf', 'cnh', 'cnhCategory', 'cnhExpiresAt', 'city', 'state', 'vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleYear', 'vehiclePlate', 'capacityKg'];
  if (required.some(key => !String(body[key] || '').trim())) return res.status(400).json({ error: 'Conclua todas as informações obrigatórias do motorista e do veículo.' });
  const cleanCpf = normalizePublicIdentity(body.cpf);
  const cleanCnh = normalizePublicIdentity(body.cnh);
  const cleanEmail = String(body.email).trim().toLowerCase();
  const duplicateDriver = db.drivers.find(item => item.id !== driver.id && ((cleanCpf && normalizePublicIdentity(item.cpf) === cleanCpf) || (cleanCnh && normalizePublicIdentity(item.cnh) === cleanCnh)));
  const duplicateEmailUser = db.users.find(item => item.id !== user.id && item.email && item.email.trim().toLowerCase() === cleanEmail);
  const duplicateEmailDriver = db.drivers.find(item => item.userId !== user.id && item.email && item.email.trim().toLowerCase() === cleanEmail);
  if (duplicateDriver) return res.status(409).json({ error: 'CPF ou CNH já cadastrada em outro motorista. Verifique os dados ou solicite suporte.' });
  if (duplicateEmailUser || duplicateEmailDriver) return res.status(409).json({ error: 'Este e-mail já está associado a outro cadastro. Use outro e-mail ou solicite suporte.' });
  const hasApprovedLink = db.driverCompanyLinks.some(item => item.driverId === driver.id && item.status === 'APROVADO');
  const nextDriverStatus = hasApprovedLink && driver.status !== 'INATIVO' ? driver.status : 'PENDENTE';
  const nextUserStatus = hasApprovedLink && user.status !== 'BLOQUEADO' ? user.status : 'PENDENTE';
  const completedAt = new Date().toISOString();
  Object.assign(driver, { name: String(body.name || driver.name).trim(), email: cleanEmail, phone: user.phone, cpf: String(body.cpf).trim(), cnh: String(body.cnh).trim(), cnhCategory: String(body.cnhCategory), cnhExpiresAt: String(body.cnhExpiresAt), city: String(body.city).trim(), state: String(body.state).trim().toUpperCase(), status: nextDriverStatus, updatedAt: completedAt });
  user.name = driver.name; user.email = driver.email; user.status = nextUserStatus; user.termsAcceptedAt = completedAt; user.privacyAcceptedAt = completedAt; user.termsVersion = CURRENT_LEGAL_VERSIONS.terms; user.privacyVersion = CURRENT_LEGAL_VERSIONS.privacy; user.updatedAt = completedAt;
  const plate = normalizePublicPlate(body.vehiclePlate);
  const existingVehicle = db.vehicles.find(item => normalizePublicPlate(item.plate) === plate && item.driverId !== driver.id);
  if (existingVehicle) return res.status(409).json({ error: 'Esta placa já está vinculada a outro veículo. Verifique os dados.' });
  const existingDriverVehicle = db.vehicles.find(item => item.driverId === driver.id);
  if (existingDriverVehicle) Object.assign(existingDriverVehicle, { type: String(body.vehicleType), brand: String(body.vehicleBrand).trim(), model: String(body.vehicleModel).trim(), year: Number(body.vehicleYear), plate: String(body.vehiclePlate).trim().toUpperCase(), capacityKg: Number(body.capacityKg), bodyType: String(body.bodyType || 'BAU'), renavam: String(body.vehicleRenavam || existingDriverVehicle.renavam || ''), status: 'ATIVO' });
  else db.vehicles.push({ id: `vehicle-public-${Date.now()}`, driverId: driver.id, tenantId: null, type: String(body.vehicleType), brand: String(body.vehicleBrand).trim(), model: String(body.vehicleModel).trim(), year: Number(body.vehicleYear), plate: String(body.vehiclePlate).trim().toUpperCase(), renavam: String(body.vehicleRenavam || ''), capacityKg: Number(body.capacityKg), bodyType: String(body.bodyType || 'BAU'), status: 'ATIVO', createdAt: new Date().toISOString() } as Vehicle);
  interest.profileCompleted = true;
  interest.updatedAt = completedAt;
  await db.recordLegalConsent({ userId: user.id, tenantId: freight.tenantId, termsVersion: CURRENT_LEGAL_VERSIONS.terms, privacyVersion: CURRENT_LEGAL_VERSIONS.privacy, acceptedAt: completedAt });
  db.addAuditLog({ tenantId: freight.tenantId, userId: user.id, userName: user.name, userRole: 'MOTORISTA', action: 'CONCLUIR_CADASTRO_INTERESSE', entity: 'FreightInterest', entityId: interest.id, details: `Cadastro complementar concluído; aguardando aprovação da empresa para o frete ${freight.code}.` });
  const companyAdmins = db.users.filter(item => item.tenantId === freight.tenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(item.role));
  void dispatchConfiguredNotification('MOTORISTA_CADASTRADO', [user, ...companyAdmins], { nome: user.name, empresa: db.tenants.find(item => item.id === freight.tenantId)?.name || '', status: user.status, freightCode: freight.code, tenantId: freight.tenantId, link: process.env.APP_URL || '' });
  await db.persistNow();
  res.json({ success: true, status: 'PENDENTE', message: 'Cadastro concluído e enviado para análise da empresa.' });
});
apiRouter.get('/driver-company-links', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || (!['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role))) return res.status(403).json({ error: 'Somente administradores podem consultar documentos e vínculos de motoristas.' });
  const tenantId = req.user?.role === 'SUPER_ADMIN' ? String(req.query.tenantId || '') || undefined : req.user?.tenantId || undefined;
  if (req.user?.role !== 'SUPER_ADMIN' && !tenantId) return res.status(403).json({ error: 'Empresa não identificada.' });
  const links = db.getCompanyDriverLinks(tenantId).map(link => {
    const sourceDriver = db.drivers.find(item => item.id === link.driverId);
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
    } : undefined;
    const freight = link.freightId ? db.freights.find(item => item.id === link.freightId) : undefined;
    return { ...link, driver, freightCode: freight?.code, originCity: freight?.origin.city, destinationCity: freight?.destination.city };
  });
  res.json(links);
});
apiRouter.put('/driver-company-links/:id/status', (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Somente administradores reais podem alterar aprovações de motoristas.' });
  const link = db.driverCompanyLinks.find(item => item.id === req.params.id);
  if (!link) return res.status(404).json({ error: 'Vínculo não encontrado.' });
  if (req.user?.role !== 'SUPER_ADMIN' && link.tenantId !== req.user?.tenantId) return res.status(403).json({ error: 'Este vínculo pertence a outra empresa.' });
  const status = String(req.body?.status || '');
  const requestedScope = String(req.body?.scope || '');
  if (!['APROVADO', 'RECUSADO', 'BLOQUEADO'].includes(status)) return res.status(400).json({ error: 'Status de vínculo inválido.' });
  if (requestedScope && !['FRETE', 'EMPRESA'].includes(requestedScope)) return res.status(400).json({ error: 'Escopo de vínculo inválido.' });
  const now = new Date().toISOString();
  const driver = db.drivers.find(item => item.id === link.driverId);
  const driverUser = driver ? db.users.find(item => item.id === driver.userId) : undefined;
  const isCompanyDecision = requestedScope === 'EMPRESA' || (link.scope === 'EMPRESA' && !link.freightId);
  let companyLink: DriverCompanyLink | undefined;
  if (isCompanyDecision && driver) {
    companyLink = db.upsertDriverCompanyLink({ driverId: link.driverId, tenantId: link.tenantId, status: status as any, scope: 'EMPRESA', source: link.source, ...(status === 'APROVADO' ? { approvedAt: now, approvedByUserId: req.user?.id } : { rejectedAt: now, rejectionReason: String(req.body?.reason || '') }) });
  }
  // A company-wide decision never changes the existing FRETE link into an EMPRESA link.
  // If the request originated from a freight interest, approval also releases that freight.
  if (!isCompanyDecision || link.scope === 'FRETE') {
    link.status = status as any;
    link.updatedAt = now;
    link.approvedAt = status === 'APROVADO' ? now : link.approvedAt;
    link.approvedByUserId = status === 'APROVADO' ? req.user?.id : link.approvedByUserId;
    link.rejectedAt = status !== 'APROVADO' ? now : link.rejectedAt;
    link.rejectionReason = status !== 'APROVADO' ? String(req.body?.reason || '') : undefined;
  }
  const interest = link.freightId ? db.freightInterests.find(item => item.driverId === link.driverId && item.freightId === link.freightId) : undefined;
  if (interest && (!isCompanyDecision || status === 'APROVADO')) {
    interest.status = status === 'APROVADO' ? 'APROVADO' : 'RECUSADO';
    interest.updatedAt = now;
    interest.reviewedAt = now;
    interest.reviewedByUserId = req.user?.id;
  }
  if (driver && status === 'APROVADO') {
    driver.status = 'DISPONIVEL';
    if (driverUser) driverUser.status = 'ATIVO';
  }
  db.addAuditLog({ tenantId: link.tenantId, userId: req.user?.id || 'system', userName: req.user?.name || 'Sistema', userRole: req.user?.role || 'ADMIN', action: 'ATUALIZAR_VINCULO_MOTORISTA', entity: 'DriverCompanyLink', entityId: companyLink?.id || link.id, details: `Vínculo do motorista atualizado para ${status} no escopo ${isCompanyDecision ? 'EMPRESA' : 'FRETE'}. A decisão é exclusiva desta empresa.` });
  const linkedFreight = link.freightId ? db.freights.find(item => item.id === link.freightId) : undefined;
  if (driverUser) void dispatchConfiguredNotification('INTERESSE_FRETE', [driverUser], { nome: driverUser.name, empresa: req.tenant?.name || 'empresa responsável', status, codigoFrete: linkedFreight?.code || '', link: process.env.APP_URL || '' });
  return res.json({ success: true, link, companyLink });
});
// Persist every successful write after the route has completed. This protects
// existing CRUD routes as well as newly added modules from restart data loss.
apiRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) void db.persistNow();
    });
  }
  next();
});
const getAsaasBaseUrl = () => db.saasGlobalConfig.asaasConfig?.environment === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://api-sandbox.asaas.com/v3';
const getAsaasHeaders = () => ({
  'Content-Type': 'application/json',
  'User-Agent': `EloLog/${process.env.npm_package_version || '1.2.7'} (Node.js; production)`,
  access_token: db.saasGlobalConfig.asaasConfig?.apiKey || ''
});
const asaasEnabled = () => Boolean(db.saasGlobalConfig.asaasConfig?.enabled && db.saasGlobalConfig.asaasConfig?.apiKey);
const asaasCycles = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY']);
  const asaasBillingTypes = new Set(['PIX', 'BOLETO', 'CREDIT_CARD']);
  const asaasOpenSubscriptionStatuses = new Set(['ACTIVE', 'PENDING', 'OVERDUE']);
  const normalizeAsaasPhone = (value: unknown): string | undefined => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return undefined;
    const candidate = digits.startsWith('55') ? digits : `55${digits}`;
    return /^55\d{10,11}$/.test(candidate) ? candidate : undefined;
  };
  const buildAsaasCustomerPayload = (tenant: Tenant, externalReference = tenant.id): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      name: tenant.legalName || tenant.name,
      email: tenant.email,
      externalReference
    };
    const cpfCnpj = String(tenant.cnpj || '').replace(/\D/g, '');
    if ([11, 14].includes(cpfCnpj.length)) payload.cpfCnpj = cpfCnpj;
    const mobilePhone = normalizeAsaasPhone(tenant.phone);
    if (mobilePhone) payload.mobilePhone = mobilePhone;
    return payload;
  };
  const asaasSafeError = (body: any, fallback: string): string => {
    const code = String(body?.errors?.[0]?.code || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 80);
    return code ? `${fallback} (código ${code}).` : fallback;
  };
  const isOpenAsaasSubscription = (subscription: any): boolean => {
    const status = String(subscription?.status || '').toUpperCase();
    return Boolean(subscription?.id) && (!status || asaasOpenSubscriptionStatuses.has(status));
  };
  const findAsaasSubscriptionByExternalReference = async (externalReference: string): Promise<any | undefined> => {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions?externalReference=${encodeURIComponent(externalReference)}&limit=20`, { headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('ASAAS_SUBSCRIPTION_LOOKUP_FAILED');
    const subscriptions = Array.isArray(body?.data) ? body.data : [];
    return subscriptions.find((item: any) => String(item?.externalReference || '') === externalReference && isOpenAsaasSubscription(item));
  };
  const findOpenAsaasSubscriptionForTenant = async (tenantId: string, customerId: string): Promise<any | undefined> => {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions?customer=${encodeURIComponent(customerId)}&limit=100`, { headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('ASAAS_SUBSCRIPTION_LOOKUP_FAILED');
    const prefix = `${tenantId}:`;
    const subscriptions = Array.isArray(body?.data) ? body.data : [];
    return subscriptions.find((item: any) => String(item?.externalReference || '').startsWith(prefix) && isOpenAsaasSubscription(item));
  };

const DEFAULT_NOTIFICATION_MODULE_CONFIG: NotificationModuleConfig = {
  enabled: true,
  freePlanName: 'WhatsApp SaaS — Gratuito',
  freePlanDescription: 'Notificações usando o telefone oficial da plataforma.',
  ownNumberPlanName: 'WhatsApp Próprio da Empresa',
  ownNumberPlanDescription: 'Notificações usando o número e canal WhatsApp da empresa.',
  ownNumberMonthlyPrice: 89.90,
  assistedActivationPrice: 149.90,
  extraNumberMonthlyPrice: 29.90
};
const getNotificationModuleConfig = (): NotificationModuleConfig => ({
  ...DEFAULT_NOTIFICATION_MODULE_CONFIG,
  ...(db.saasGlobalConfig.notificationModule || {})
});
const getBillingTenant = (req: AuthenticatedRequest, rawTenantId?: unknown): Tenant | undefined => {
  const requestedTenantId = req.user?.role === 'SUPER_ADMIN'
    ? String(rawTenantId || '').trim()
    : String(req.user?.tenantId || '').trim();
  return requestedTenantId ? db.tenants.find(item => item.id === requestedTenantId) : undefined;
};
const canManageNotificationBilling = (req: AuthenticatedRequest, tenant: Tenant | undefined): boolean => {
  if (!req.user || !tenant) return false;
  if (req.user.role === 'SUPER_ADMIN') return true;
  return ['ADMIN', 'EMPRESA_SUPER_ADMIN'].includes(req.user.role) && req.user.tenantId === tenant.id;
};
const planLimitsFromConfig = (plan: any) => ({
  maxUsers: Number(plan?.maxUsers) || (plan?.id === 'EMPRESARIAL' ? 100 : plan?.id === 'PROFISSIONAL' ? 25 : 5),
  maxDrivers: Number(plan?.maxDrivers) || (plan?.id === 'EMPRESARIAL' ? 500 : plan?.id === 'PROFISSIONAL' ? 100 : 20),
  maxFreightsMonthly: Number(plan?.maxFreightsMonthly) || (plan?.id === 'EMPRESARIAL' ? 2000 : plan?.id === 'PROFISSIONAL' ? 500 : 50),
  customForms: plan?.id !== 'BASICO',
  exportReports: true,
  prioritySupport: plan?.id === 'EMPRESARIAL'
});
const applyPlanConfigToTenant = (tenant: Tenant, plan: any) => {
  tenant.plan = plan.id;
  tenant.planLimits = planLimitsFromConfig(plan);
};
const stableSubscriptionReference = (tenantId: string) => `${tenantId}:subscription`;
const notificationStatusForTenant = (tenant: Tenant): NotificationModuleStatus => {
  const plan: NotificationModulePlan = tenant.notificationPlan || 'SAAS_FREE';
  const billingStatus: NotificationBillingStatus = plan === 'SAAS_FREE'
    ? 'NOT_REQUIRED'
    : (tenant.notificationBillingStatus || 'PENDING');
  return {
    tenantId: tenant.id,
    plan,
    billingStatus,
    subscriptionId: tenant.notificationSubscriptionId,
    nextDueDate: tenant.notificationBillingNextDueDate,
    canUseOwnNumber: plan === 'OWN_NUMBER' && billingStatus === 'ACTIVE',
    config: getNotificationModuleConfig()
  };
};
const isNotificationSubscription = (subscription: any): boolean => {
  return subscription?.product === 'NOTIFICATION_MODULE'
    || subscription?.feature === 'WHATSAPP_OWN_NUMBER'
    || String(subscription?.externalReference || '').includes(':WHATSAPP_OWN_NUMBER');
};
async function ensureAsaasCustomer(tenant: Tenant): Promise<{ id?: string; error?: string }> {
  const knownId = String((tenant as any).asaasCustomerId || '');
  if (knownId) return { id: knownId };
  const base = getAsaasBaseUrl();
  const query = await fetch(`${base}/customers?externalReference=${encodeURIComponent(tenant.id)}&limit=1`, { headers: getAsaasHeaders() });
  const listed = await query.json().catch(() => ({}));
  if (!query.ok) return { error: asaasSafeError(listed, 'Falha ao consultar cliente Asaas.') };
  const existing = Array.isArray(listed?.data) ? listed.data[0] : undefined;
  if (existing?.id) return { id: String(existing.id) };
  const response = await fetch(`${base}/customers`, {
    method: 'POST', headers: getAsaasHeaders(),
    body: JSON.stringify(buildAsaasCustomerPayload(tenant))
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { error: asaasSafeError(body, 'Falha ao criar cliente Asaas.') };
  return { id: body.id ? String(body.id) : undefined, error: body.id ? undefined : 'Cliente Asaas não retornou identificador.' };
}

apiRouter.post('/billing/asaas/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode testar o Asaas.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/myAccount`, { headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha na autenticação Asaas.') });
    return res.json({ success: true, accountName: body.name || body.companyName || 'Conta Asaas autenticada', environment: db.saasGlobalConfig.asaasConfig?.environment });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível acessar o Asaas.' });
  }
});

apiRouter.post('/billing/asaas/checkout', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para contratar plano.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const requestedTenantId = req.user.role === 'SUPER_ADMIN' ? req.body?.tenantId : req.user.tenantId;
  const tenant = db.tenants.find(t => t.id === requestedTenantId);
  const plan = db.saasGlobalConfig.plans.find(p => p.id === req.body?.planId);
  if (!tenant || !plan) return res.status(400).json({ error: 'Empresa ou plano não encontrado.' });
  const dueDate = req.body?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  try {
    const customer = await ensureAsaasCustomer(tenant);
    if (!customer.id) return res.status(502).json({ error: customer.error || 'Não foi possível preparar o cliente Asaas.' });
    const customerId = customer.id;
    if (!customerId) return res.status(400).json({ error: 'Não foi possível obter o cliente Asaas.' });
    const paymentResponse = await fetch(`${getAsaasBaseUrl()}/payments`, {
      method: 'POST', headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customerId, billingType: req.body?.billingType || 'PIX', value: Number(plan.price), dueDate, description: `Plano ${plan.name} — ${tenant.name}`, externalReference: `${tenant.id}:${plan.id}` })
    });
    const paymentBody = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) return res.status(paymentResponse.status).json({ error: asaasSafeError(paymentBody, 'Falha ao criar cobrança Asaas.') });
    db.asaasPayments.unshift({ asaasPaymentId: paymentBody.id, tenantId: tenant.id, planId: plan.id, value: plan.price, status: paymentBody.status, invoiceUrl: paymentBody.invoiceUrl, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), webhookEventIds: [] });
    void dispatchConfiguredNotification('PAGAMENTO_CRIADO', db.users.filter(user => user.tenantId === tenant.id && ['EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(user.role)), {
      nome: req.user.name,
      empresa: tenant.name,
      plano: plan.name,
      valor: `R$ ${plan.price.toFixed(2)}`,
      tenantId: tenant.id,
      link: paymentBody.invoiceUrl || ''
    });
    db.addAuditLog({ tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ASAAS_PAYMENT_CREATED', entity: 'AsaasPayment', entityId: paymentBody.id, details: `Cobrança do plano ${plan.id} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}` });
    await db.persistNow();
    return res.status(201).json({ id: paymentBody.id, status: paymentBody.status, invoiceUrl: paymentBody.invoiceUrl, bankSlipUrl: paymentBody.bankSlipUrl, value: paymentBody.value, dueDate: paymentBody.dueDate });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível criar a cobrança Asaas.' });
  }
});

apiRouter.post('/billing/asaas/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para contratar plano.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const requestedTenantId = req.user.role === 'SUPER_ADMIN' ? req.body?.tenantId : req.user.tenantId;
  const tenant = db.tenants.find(item => item.id === requestedTenantId);
  const plan = db.saasGlobalConfig.plans.find(item => item.id === req.body?.planId);
  const cycle = String(req.body?.cycle || 'MONTHLY').toUpperCase();
  const billingType = String(req.body?.billingType || 'PIX').toUpperCase();
  if (!tenant || !plan) return res.status(400).json({ error: 'Empresa ou plano não encontrado.' });
  if (!asaasCycles.has(cycle) || !asaasBillingTypes.has(billingType)) return res.status(400).json({ error: 'Ciclo ou forma de cobrança Asaas inválidos.' });
  if (billingType === 'CREDIT_CARD') return res.status(400).json({ error: 'Cartão de crédito deve ser processado pelo Checkout Asaas ou por tokenização; esta rota não recebe número, validade ou CVV.' });
  const dueDate = String(req.body?.nextDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  let customer: { id?: string; error?: string };
  try {
    customer = await ensureAsaasCustomer(tenant);
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível consultar o cliente Asaas.' });
  }
  if (!customer.id) return res.status(502).json({ error: customer.error || 'Não foi possível preparar o cliente Asaas.' });
  const externalReference = stableSubscriptionReference(tenant.id);
  try {
    const existingExternal = await findOpenAsaasSubscriptionForTenant(tenant.id, customer.id)
      || await findAsaasSubscriptionByExternalReference(externalReference)
      || await findAsaasSubscriptionByExternalReference(`${tenant.id}:${plan.id}:subscription`);
    if (existingExternal?.id) {
      const now = new Date().toISOString();
      const existingLocal = db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === String(existingExternal.id));
      if (!existingLocal) {
        db.asaasSubscriptions.unshift({ asaasSubscriptionId: String(existingExternal.id), tenantId: tenant.id, planId: plan.id, value: Number(existingExternal.value || plan.price), billingType: existingExternal.billingType || billingType, cycle: existingExternal.cycle || cycle, status: existingExternal.status || 'PENDING', nextDueDate: existingExternal.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now });
      }
      (tenant as any).asaasCustomerId = customer.id;
      (tenant as any).asaasSubscriptionId = String(existingExternal.id);
      (tenant as any).billingStatus = existingExternal.status || 'PENDING';
      (tenant as any).billingCycle = existingExternal.cycle || cycle;
      (tenant as any).billingNextDueDate = existingExternal.nextDueDate || dueDate;
      db.addAuditLog({ tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ASAAS_SUBSCRIPTION_RECONCILED', entity: 'AsaasSubscription', entityId: String(existingExternal.id), details: `Assinatura existente do plano ${plan.id} reconciliada por referência externa no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}.` });
      await db.persistNow();
      return res.status(200).json({ id: String(existingExternal.id), status: existingExternal.status || 'PENDING', cycle: existingExternal.cycle || cycle, nextDueDate: existingExternal.nextDueDate || dueDate, value: existingExternal.value || Number(plan.price), reconciled: true });
    }
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível verificar uma assinatura Asaas existente.' });
  }
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions`, {
      method: 'POST', headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customer.id, billingType, nextDueDate: dueDate, value: Number(plan.price), cycle, description: `Plano ${plan.name} — ${tenant.name}`, externalReference })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha ao criar assinatura Asaas.') });
    const now = new Date().toISOString();
    (tenant as any).asaasCustomerId = customer.id;
    (tenant as any).asaasSubscriptionId = body.id;
    // Creating the subscription does not prove payment. Activation is payment-webhook driven.
    (tenant as any).billingStatus = 'PENDING';
    (tenant as any).billingCycle = cycle;
    (tenant as any).billingNextDueDate = body.nextDueDate || dueDate;
    const record = { asaasSubscriptionId: body.id, tenantId: tenant.id, planId: plan.id, value: Number(plan.price), billingType, cycle, status: body.status || 'PENDING', nextDueDate: body.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now };
    db.asaasSubscriptions.unshift(record);
    db.addAuditLog({ tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ASAAS_SUBSCRIPTION_CREATED', entity: 'AsaasSubscription', entityId: String(body.id), details: `Assinatura recorrente do plano ${plan.id} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}.` });
    void dispatchConfiguredNotification('PAGAMENTO_CRIADO', db.users.filter(user => user.tenantId === tenant.id && ['EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(user.role)), { nome: req.user.name, empresa: tenant.name, plano: plan.name, valor: `R$ ${Number(plan.price).toFixed(2)}`, tenantId: tenant.id, link: body.invoiceUrl || '' });
    await db.persistNow();
    return res.status(201).json({ id: body.id, status: body.status, cycle, nextDueDate: body.nextDueDate || dueDate, value: body.value || Number(plan.price) });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível criar a assinatura Asaas.' });
  }
});

apiRouter.post('/billing/asaas/subscription/cancel', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para cancelar assinatura.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? String(req.body?.tenantId || '') : String(req.user.tenantId || '');
  const tenant = db.tenants.find(item => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada.' });
  const subscription = db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === (tenant as any).asaasSubscriptionId && item.tenantId === tenant.id)
    || db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  if (!subscription?.asaasSubscriptionId) return res.status(404).json({ error: 'Nenhuma assinatura principal encontrada para a empresa.' });
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(String(subscription.asaasSubscriptionId))}`, { method: 'DELETE', headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 404) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha ao cancelar assinatura Asaas.') });
    subscription.status = 'INACTIVE';
    subscription.updatedAt = new Date().toISOString();
    (tenant as any).billingStatus = 'INACTIVE';
    (tenant as any).updatedAt = new Date().toISOString();
    db.addAuditLog({ tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ASAAS_SUBSCRIPTION_CANCELED', entity: 'AsaasSubscription', entityId: String(subscription.asaasSubscriptionId), details: `Assinatura principal cancelada${response.status === 404 ? ' após confirmação de ausência no Asaas' : ''}.` });
    await db.persistNow();
    return res.json({ success: true, status: 'INACTIVE', subscription: { id: subscription.asaasSubscriptionId, planId: subscription.planId, cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível cancelar a assinatura Asaas.' });
  }
});

apiRouter.post('/billing/asaas/subscription/change-plan', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para trocar de plano.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? String(req.body?.tenantId || '') : String(req.user.tenantId || '');
  const tenant = db.tenants.find(item => item.id === tenantId);
  const targetPlanId = String(req.body?.planId || '').toUpperCase();
  const plan = db.saasGlobalConfig.plans.find(item => item.id === targetPlanId);
  if (!tenant || !plan) return res.status(400).json({ error: 'Empresa ou plano de destino não encontrado.' });
  if (tenant.plan === plan.id) return res.status(400).json({ error: 'A empresa já está neste plano.' });
  const subscription = db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === (tenant as any).asaasSubscriptionId && item.tenantId === tenant.id)
    || db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  if (!subscription?.asaasSubscriptionId) return res.status(409).json({ error: 'A empresa não possui assinatura principal local para alterar.' });
  if (!['ACTIVE', 'PENDING', 'OVERDUE'].includes(String(subscription.status || '').toUpperCase())) return res.status(409).json({ error: 'A assinatura principal não está ativa ou pendente para troca de plano.' });
  const cycle = String(req.body?.cycle || subscription.cycle || 'MONTHLY').toUpperCase();
  const billingType = String(req.body?.billingType || subscription.billingType || 'PIX').toUpperCase();
  if (!asaasCycles.has(cycle) || !asaasBillingTypes.has(billingType)) return res.status(400).json({ error: 'Ciclo ou forma de cobrança Asaas inválidos.' });
  if (billingType === 'CREDIT_CARD') return res.status(400).json({ error: 'A troca com cartão deve usar Checkout Asaas ou tokenização segura; esta rota não recebe número, validade ou CVV.' });
  const nextDueDate = req.body?.nextDueDate === undefined ? undefined : String(req.body.nextDueDate || '');
  if (nextDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) return res.status(400).json({ error: 'A próxima data de vencimento deve usar o formato AAAA-MM-DD.' });
  const updatePendingPayments = req.body?.updatePendingPayments === true;
  const payload: Record<string, unknown> = { value: Number(plan.price), cycle, billingType, description: `Plano ${plan.name} — ${tenant.name}`, updatePendingPayments };
  if (nextDueDate) payload.nextDueDate = nextDueDate;
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(String(subscription.asaasSubscriptionId))}`, { method: 'PUT', headers: getAsaasHeaders(), body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha ao atualizar assinatura Asaas.') });
    applyPlanConfigToTenant(tenant, plan);
    subscription.planId = plan.id;
    subscription.value = Number(body.value ?? plan.price);
    subscription.cycle = body.cycle || cycle;
    subscription.billingType = body.billingType || billingType;
    subscription.status = body.status || subscription.status;
    subscription.nextDueDate = body.nextDueDate || nextDueDate || subscription.nextDueDate;
    subscription.updatedAt = new Date().toISOString();
    (tenant as any).billingStatus = subscription.status || 'PENDING';
    (tenant as any).billingCycle = subscription.cycle;
    (tenant as any).billingNextDueDate = subscription.nextDueDate;
    db.addAuditLog({ tenantId: tenant.id, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'ASAAS_SUBSCRIPTION_PLAN_CHANGED', entity: 'AsaasSubscription', entityId: String(subscription.asaasSubscriptionId), details: `Plano alterado para ${plan.id}; cobranças pendentes atualizadas: ${updatePendingPayments ? 'sim' : 'não'}.` });
    await db.persistNow();
    return res.json({ success: true, id: subscription.asaasSubscriptionId, planId: plan.id, status: subscription.status, cycle: subscription.cycle, billingType: subscription.billingType, value: subscription.value, nextDueDate: subscription.nextDueDate });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível atualizar a assinatura Asaas.' });
  }
});

apiRouter.get('/billing/asaas/notification-module', (req: AuthenticatedRequest, res: Response) => {
  const tenant = getBillingTenant(req, req.query.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: 'Sem permissão para consultar o módulo de notificações desta empresa.' });
  return res.json(notificationStatusForTenant(tenant!));
});

apiRouter.post('/billing/asaas/notification-module/free', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: 'Sem permissão para configurar o módulo desta empresa.' });
  const moduleConfig = getNotificationModuleConfig();
  if (!moduleConfig.enabled) return res.status(409).json({ error: 'O módulo de notificações está temporariamente indisponível.' });
  if (tenant!.notificationSubscriptionId && ['PENDING', 'ACTIVE', 'OVERDUE'].includes(tenant!.notificationBillingStatus || '')) {
    return res.status(409).json({ error: 'A assinatura do número próprio ainda está ativa ou pendente. Cancele-a no Asaas antes de voltar ao telefone SaaS.' });
  }
  tenant!.notificationPlan = 'SAAS_FREE';
  tenant!.notificationBillingStatus = 'NOT_REQUIRED';
  tenant!.notificationSubscriptionId = undefined;
  tenant!.notificationBillingNextDueDate = undefined;
  tenant!.updatedAt = new Date().toISOString();
  db.addAuditLog({ tenantId: tenant!.id, userId: req.user!.id, userName: req.user!.name, userRole: req.user!.role, action: 'NOTIFICATION_MODULE_FREE_SELECTED', entity: 'NotificationModule', entityId: tenant!.id, details: 'Módulo gratuito selecionado com uso do telefone SaaS.' });
  await db.persistNow();
  return res.json(notificationStatusForTenant(tenant!));
});

apiRouter.post('/billing/asaas/notification-module/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: 'Sem permissão para contratar o módulo desta empresa.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const moduleConfig = getNotificationModuleConfig();
  if (!moduleConfig.enabled) return res.status(409).json({ error: 'O módulo de notificações está temporariamente indisponível.' });
  if (tenant!.notificationSubscriptionId && ['PENDING', 'ACTIVE', 'OVERDUE'].includes(tenant!.notificationBillingStatus || '')) return res.status(409).json({ error: 'Esta empresa já possui uma assinatura do módulo ativa ou pendente.' });
  const billingType = String(req.body?.billingType || 'PIX').toUpperCase();
  if (!asaasBillingTypes.has(billingType)) return res.status(400).json({ error: 'Forma de cobrança Asaas inválida.' });
  const dueDate = String(req.body?.nextDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  let customer: { id?: string; error?: string };
  try {
    customer = await ensureAsaasCustomer(tenant!);
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível consultar o cliente Asaas.' });
  }
  if (!customer.id) return res.status(502).json({ error: customer.error || 'Não foi possível preparar o cliente Asaas.' });
  const externalReference = `${tenant!.id}:WHATSAPP_OWN_NUMBER`;
  try {
    const existingExternal = await findOpenAsaasSubscriptionForTenant(tenant!.id, customer.id)
      || await findAsaasSubscriptionByExternalReference(externalReference);
    if (existingExternal?.id) {
      const now = new Date().toISOString();
      const existingLocal = db.asaasSubscriptions.find((item: any) => item.asaasSubscriptionId === String(existingExternal.id));
      if (!existingLocal) {
        db.asaasSubscriptions.unshift({ asaasSubscriptionId: String(existingExternal.id), tenantId: tenant!.id, planId: 'NOTIFICATION_MODULE', product: 'NOTIFICATION_MODULE', feature: 'WHATSAPP_OWN_NUMBER', value: Number(existingExternal.value || moduleConfig.ownNumberMonthlyPrice), billingType: existingExternal.billingType || billingType, cycle: existingExternal.cycle || 'MONTHLY', status: existingExternal.status || 'PENDING', nextDueDate: existingExternal.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now });
      }
      tenant!.notificationPlan = 'OWN_NUMBER';
      tenant!.notificationBillingStatus = existingExternal.status || 'PENDING';
      tenant!.notificationSubscriptionId = String(existingExternal.id);
      tenant!.notificationBillingNextDueDate = existingExternal.nextDueDate || dueDate;
      await db.persistNow();
      return res.status(200).json({ id: String(existingExternal.id), status: existingExternal.status || 'PENDING', value: existingExternal.value || Number(moduleConfig.ownNumberMonthlyPrice), nextDueDate: existingExternal.nextDueDate || dueDate, module: 'WHATSAPP_OWN_NUMBER', reconciled: true });
    }
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível verificar uma assinatura existente do módulo no Asaas.' });
  }
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions`, {
      method: 'POST', headers: getAsaasHeaders(),
      body: JSON.stringify({ customer: customer.id, billingType, nextDueDate: dueDate, value: Number(moduleConfig.ownNumberMonthlyPrice), cycle: 'MONTHLY', description: moduleConfig.ownNumberPlanName, externalReference })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha ao criar assinatura do módulo no Asaas.') });
    const now = new Date().toISOString();
    tenant!.notificationPlan = 'OWN_NUMBER';
    tenant!.notificationBillingStatus = 'PENDING';
    tenant!.notificationSubscriptionId = String(body.id || '');
    tenant!.notificationBillingNextDueDate = body.nextDueDate || dueDate;
    const record = { asaasSubscriptionId: body.id, tenantId: tenant!.id, planId: 'NOTIFICATION_MODULE', product: 'NOTIFICATION_MODULE', feature: 'WHATSAPP_OWN_NUMBER', value: Number(moduleConfig.ownNumberMonthlyPrice), billingType, cycle: 'MONTHLY', status: body.status || 'PENDING', nextDueDate: body.nextDueDate || dueDate, externalReference, webhookEventIds: [], createdAt: now, updatedAt: now };
    db.asaasSubscriptions.unshift(record);
    db.addAuditLog({ tenantId: tenant!.id, userId: req.user!.id, userName: req.user!.name, userRole: req.user!.role, action: 'ASAAS_NOTIFICATION_MODULE_SUBSCRIPTION_CREATED', entity: 'AsaasSubscription', entityId: String(body.id), details: `Assinatura do módulo ${moduleConfig.ownNumberPlanName} criada no ambiente ${db.saasGlobalConfig.asaasConfig?.environment}. A ativação depende do webhook de pagamento.` });
    await db.persistNow();
    return res.status(201).json({ id: body.id, status: body.status || 'PENDING', value: Number(moduleConfig.ownNumberMonthlyPrice), nextDueDate: body.nextDueDate || dueDate, module: 'WHATSAPP_OWN_NUMBER' });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível criar a assinatura do módulo no Asaas.' });
  }
});

apiRouter.get('/billing/asaas/notification-module/subscription', (req: AuthenticatedRequest, res: Response) => {
  const tenant = getBillingTenant(req, req.query.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: 'Sem permissão para consultar a assinatura do módulo.' });
  return res.json(notificationStatusForTenant(tenant!));
});

apiRouter.post('/billing/asaas/notification-module/cancel', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = getBillingTenant(req, req.body?.tenantId);
  if (!canManageNotificationBilling(req, tenant)) return res.status(403).json({ error: 'Sem permissão para cancelar o módulo de notificações.' });
  if (!asaasEnabled()) return res.status(400).json({ error: 'Asaas está desativado ou sem API Key.' });
  const subscriptionId = String(tenant?.notificationSubscriptionId || '');
  if (!tenant || !subscriptionId) return res.status(404).json({ error: 'Nenhuma assinatura do módulo encontrada para a empresa.' });
  const record = db.asaasSubscriptions.find((item: any) => String(item.asaasSubscriptionId) === subscriptionId && item.tenantId === tenant.id);
  try {
    const response = await fetch(`${getAsaasBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'DELETE', headers: getAsaasHeaders() });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 404) return res.status(response.status).json({ error: asaasSafeError(body, 'Falha ao cancelar o módulo no Asaas.') });
    tenant.notificationPlan = 'SAAS_FREE';
    tenant.notificationBillingStatus = 'CANCELED';
    delete tenant.notificationSubscriptionId;
    delete tenant.notificationBillingNextDueDate;
    if (record) { record.status = 'INACTIVE'; record.updatedAt = new Date().toISOString(); }
    db.addAuditLog({ tenantId: tenant.id, userId: req.user!.id, userName: req.user!.name, userRole: req.user!.role, action: 'ASAAS_NOTIFICATION_MODULE_CANCELED', entity: 'AsaasSubscription', entityId: subscriptionId, details: `Módulo de número próprio cancelado${response.status === 404 ? ' após confirmação de ausência no Asaas' : ''}; fallback para o telefone SaaS.` });
    await db.persistNow();
    return res.json({ success: true, plan: 'SAAS_FREE', billingStatus: 'CANCELED', canUseOwnNumber: false, subscriptionId: null });
  } catch (_error) {
    return res.status(502).json({ error: 'Não foi possível cancelar o módulo no Asaas.' });
  }
});

apiRouter.get('/billing/asaas/subscription', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para consultar assinatura.' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? String(req.query.tenantId || '') : String(req.user.tenantId || '');
  const tenant = db.tenants.find(item => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada.' });
  const subscription = db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id && item.asaasSubscriptionId === (tenant as any).asaasSubscriptionId) || db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id);
  return res.json({ tenantId: tenant.id, plan: tenant.plan, billingStatus: (tenant as any).billingStatus || 'PENDING', customerId: (tenant as any).asaasCustomerId || null, subscription: subscription ? { id: subscription.asaasSubscriptionId, planId: subscription.planId, cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } : null });
});

apiRouter.get('/billing/asaas/financial-summary', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para consultar o financeiro.' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? String(req.query.tenantId || '') : String(req.user.tenantId || '');
  const tenant = db.tenants.find(item => item.id === tenantId);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada.' });
  const subscription = db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id && item.asaasSubscriptionId === (tenant as any).asaasSubscriptionId) || db.asaasSubscriptions.find((item: any) => item.tenantId === tenant.id && !isNotificationSubscription(item));
  const payments = db.asaasPayments.filter((item: any) => item.tenantId === tenant.id).slice(0, 100).map((item: any) => ({ id: item.asaasPaymentId, planId: item.planId, value: Number(item.value || 0), status: item.status || 'PENDING', invoiceUrl: item.invoiceUrl || null, dueDate: item.dueDate || null, createdAt: item.createdAt, updatedAt: item.updatedAt }));
  const received = payments.filter(item => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  const pending = payments.filter(item => ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  const overdue = payments.filter(item => ['OVERDUE', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED'].includes(String(item.status).toUpperCase())).reduce((sum, item) => sum + item.value, 0);
  return res.json({ tenantId: tenant.id, plan: tenant.plan, billingStatus: (tenant as any).billingStatus || 'PENDING', subscription: subscription ? { id: subscription.asaasSubscriptionId, planId: subscription.planId, value: Number(subscription.value || 0), cycle: subscription.cycle, billingType: subscription.billingType, status: subscription.status, nextDueDate: subscription.nextDueDate, updatedAt: subscription.updatedAt } : null, totals: { received, pending, overdue }, payments });
});

// Get Pages for current Tenant
apiRouter.get('/pages', (req: AuthenticatedRequest, res: Response) => {
  const pages = req.user?.role === 'SUPER_ADMIN'
    ? db.pages
    : (req.tenant ? db.pages.filter(p => p.tenantId === req.tenant?.id) : []);
  if (!req.user) return res.status(403).json({ error: 'Usuário não identificado' });
  res.json(pages.map(page => ({ ...page, content: sanitizeServerHtml(page.content), canonicalUrl: safePublicUrl(page.canonicalUrl), coverImageUrl: safePublicUrl(page.coverImageUrl) })));
});

// Create Page (Tenant administrators / Super Admins only)
apiRouter.post('/pages', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para criar páginas institucionais' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? (req.body?.tenantId ?? null) : req.tenant?.id;
  if (tenantId === undefined || (tenantId !== null && !db.tenants.some(tenant => tenant.id === tenantId))) return res.status(403).json({ error: 'Tenant não identificado' });
  const now = new Date().toISOString();
  const newPage: WebPage = {
    id: `page-${Date.now()}-${randomUUID().slice(0, 8)}`,
    tenantId,
    slug: String(req.body?.slug || '').trim().toLowerCase(),
    title: String(req.body?.title || '').trim().slice(0, 200),
    content: sanitizeServerHtml(req.body?.content || ''),
    excerpt: String(req.body?.excerpt || '').trim().slice(0, 1000),
    metaTitle: String(req.body?.metaTitle || '').trim().slice(0, 200),
    metaDescription: String(req.body?.metaDescription || '').trim().slice(0, 2000),
    canonicalUrl: safePublicUrl(req.body?.canonicalUrl),
    coverImageUrl: safePublicUrl(req.body?.coverImageUrl),
    isPublished: req.body?.isPublished !== false,
    isIndexable: req.body?.isIndexable !== false,
    createdAt: now,
    updatedAt: now
  };
  if (!newPage.slug || !newPage.title || !newPage.content) return res.status(400).json({ error: 'Título, slug e conteúdo são obrigatórios.' });
  db.pages.push(newPage);
  res.status(201).json({ ...newPage, content: sanitizeServerHtml(newPage.content) });
});

// Get Posts for current Tenant
apiRouter.get('/posts', (req: AuthenticatedRequest, res: Response) => {
  const posts = req.user?.role === 'SUPER_ADMIN'
    ? db.posts
    : (req.tenant ? db.posts.filter(p => p.tenantId === req.tenant?.id) : []);
  if (!req.user) return res.status(403).json({ error: 'Usuário não identificado' });
  res.json(posts.map(post => ({ ...post, content: sanitizeServerHtml(post.content), canonicalUrl: safePublicUrl(post.canonicalUrl), coverImageUrl: safePublicUrl(post.coverImageUrl) })));
});

// Create Post (Tenant administrators / Super Admins only)
apiRouter.post('/posts', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para publicar artigos no blog' });
  const tenantId = req.user.role === 'SUPER_ADMIN' ? (req.body?.tenantId ?? null) : req.tenant?.id;
  if (tenantId === undefined || (tenantId !== null && !db.tenants.some(tenant => tenant.id === tenantId))) return res.status(403).json({ error: 'Tenant não identificado' });
  const now = new Date().toISOString();
  const newPost: BlogPost = {
    id: `post-${Date.now()}-${randomUUID().slice(0, 8)}`,
    tenantId,
    slug: String(req.body?.slug || '').trim().toLowerCase(),
    title: String(req.body?.title || '').trim().slice(0, 200),
    excerpt: String(req.body?.excerpt || '').trim().slice(0, 1000),
    content: sanitizeServerHtml(req.body?.content || ''),
    author: String(req.body?.author || req.user.name || 'Administrador').trim().slice(0, 200),
    metaTitle: String(req.body?.metaTitle || '').trim().slice(0, 200),
    metaDescription: String(req.body?.metaDescription || '').trim().slice(0, 2000),
    canonicalUrl: safePublicUrl(req.body?.canonicalUrl),
    coverImageUrl: safePublicUrl(req.body?.coverImageUrl),
    isPublished: req.body?.isPublished !== false,
    isIndexable: req.body?.isIndexable !== false,
    publishedAt: req.body?.isPublished === false ? undefined : now,
    createdAt: now,
    updatedAt: now
  };
  if (!newPost.slug || !newPost.title || !newPost.content) return res.status(400).json({ error: 'Título, slug e conteúdo são obrigatórios.' });
  db.posts.push(newPost);
  res.status(201).json({ ...newPost, content: sanitizeServerHtml(newPost.content) });
});

// Update/Delete content for the current tenant.
const LEGAL_PAGE_DOCUMENTS: Record<string, LegalDocumentVersion['documentType']> = {
  'termos-de-uso': 'TERMS',
  'politica-de-privacidade': 'PRIVACY'
};

apiRouter.get('/pages/:id/versions', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Somente o Super Admin pode consultar versões jurídicas.' });
  const page = db.pages.find(item => item.id === req.params.id && item.tenantId === null);
  if (!page || !LEGAL_PAGE_DOCUMENTS[page.slug]) return res.status(404).json({ error: 'Histórico jurídico não encontrado.' });
  const versions = db.legalDocumentVersions
    .filter(item => item.documentType === LEGAL_PAGE_DOCUMENTS[page.slug])
    .slice(0, 50);
  return res.json({ currentVersion: page.contentVersion || null, versions });
});

apiRouter.put('/pages/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para editar páginas.' });
  const page = db.pages.find(item => item.id === req.params.id && (req.user?.role === 'SUPER_ADMIN' || item.tenantId === req.tenant?.id));
  if (!page) return res.status(404).json({ error: 'Página não encontrada.' });
  const legalType = page.tenantId === null ? LEGAL_PAGE_DOCUMENTS[page.slug] : undefined;
  if (legalType && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Somente o Super Admin pode editar documentos jurídicos globais.' });

  const now = new Date().toISOString();
  if (legalType) {
    const previousVersion = page.contentVersion || '2026-08-27.1';
    const snapshot: LegalDocumentVersion = {
      id: `legal-version-${Date.now()}-${randomUUID().slice(0, 8)}`,
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
      changeNote: String(req.body?.changeNote || 'Snapshot anterior à publicação').trim().slice(0, 240)
    };
    db.legalDocumentVersions.unshift(snapshot);
    if (db.legalDocumentVersions.length > 100) db.legalDocumentVersions.length = 100;
    const requestedVersion = String(req.body?.contentVersion || '').trim().slice(0, 64);
    page.contentVersion = requestedVersion || `${now.slice(0, 10)}.${now.slice(11, 19).replace(/:/g, '')}`;
    page.isSystemLocked = true;
  }
  page.title = String(req.body?.title || page.title).trim().slice(0, 200);
  page.slug = String(req.body?.slug || page.slug).trim().toLowerCase();
  page.content = sanitizeServerHtml(req.body?.content ?? page.content);
  if (req.body?.excerpt !== undefined) page.excerpt = String(req.body.excerpt || '').trim().slice(0, 1000);
  if (req.body?.metaTitle !== undefined) page.metaTitle = String(req.body.metaTitle || '').trim().slice(0, 200);
  if (req.body?.metaDescription !== undefined) page.metaDescription = String(req.body.metaDescription || '').trim().slice(0, 2000);
  if (req.body?.canonicalUrl !== undefined) page.canonicalUrl = safePublicUrl(req.body.canonicalUrl);
  if (req.body?.coverImageUrl !== undefined) page.coverImageUrl = safePublicUrl(req.body.coverImageUrl);
  if (req.body?.isPublished !== undefined) page.isPublished = Boolean(req.body.isPublished);
  if (req.body?.isIndexable !== undefined) page.isIndexable = Boolean(req.body.isIndexable);
  page.updatedAt = now;
  db.addAuditLog({ tenantId: page.tenantId || undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: legalType ? 'PUBLICAR_DOCUMENTO_JURIDICO' : 'EDITAR_PAGINA', entity: 'WebPage', entityId: page.id, details: legalType ? `Documento ${legalType} publicado na versão ${page.contentVersion}.` : `Página ${page.slug} atualizada.` });
  await db.persistNow();
  return res.json(page);
});
apiRouter.delete('/pages/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || ['MOTORISTA', 'USUARIO'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para despublicar páginas.' });
  const page = db.pages.find(item => item.id === req.params.id && (req.user?.role === 'SUPER_ADMIN' || item.tenantId === req.tenant?.id));
  if (!page) return res.status(404).json({ error: 'Página não encontrada.' });
  if (page.isSystemLocked) return res.status(403).json({ error: 'Páginas legais do sistema não podem ser excluídas; apenas editadas e publicadas.' });
  page.isPublished = false;
  page.isIndexable = false;
  page.updatedAt = new Date().toISOString();
  db.addAuditLog({ tenantId: page.tenantId || undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'DESPUBLICAR_PAGINA', entity: 'WebPage', entityId: page.id, details: `Página ${page.slug} despublicada sem apagar conteúdo ou histórico.` });
  await db.persistNow();
  return res.json({ success: true, message: 'Página despublicada; conteúdo e histórico preservados.' });
});
apiRouter.put('/posts/:id', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para editar posts.' });
  const post = db.posts.find(item => item.id === req.params.id && (req.user?.role === 'SUPER_ADMIN' || item.tenantId === req.tenant?.id));
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
  post.title = String(req.body?.title || post.title).trim().slice(0, 200);
  post.slug = String(req.body?.slug || post.slug).trim().toLowerCase();
  post.content = sanitizeServerHtml(req.body?.content ?? post.content);
  if (req.body?.excerpt !== undefined) post.excerpt = String(req.body.excerpt || '').trim().slice(0, 1000);
  if (req.body?.metaTitle !== undefined) post.metaTitle = String(req.body.metaTitle || '').trim().slice(0, 200);
  if (req.body?.metaDescription !== undefined) post.metaDescription = String(req.body.metaDescription || '').trim().slice(0, 2000);
  if (req.body?.canonicalUrl !== undefined) post.canonicalUrl = safePublicUrl(req.body.canonicalUrl);
  if (req.body?.coverImageUrl !== undefined) post.coverImageUrl = safePublicUrl(req.body.coverImageUrl);
  if (req.body?.author !== undefined) post.author = String(req.body.author || '').trim().slice(0, 200);
  if (req.body?.isPublished !== undefined) post.isPublished = Boolean(req.body.isPublished);
  if (req.body?.isIndexable !== undefined) post.isIndexable = Boolean(req.body.isIndexable);
  if (post.isPublished && !post.publishedAt) post.publishedAt = new Date().toISOString();
  post.updatedAt = new Date().toISOString();
  return res.json(post);
});
apiRouter.delete('/posts/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || ['MOTORISTA', 'USUARIO'].includes(req.user.role)) return res.status(403).json({ error: 'Permissão insuficiente para despublicar posts.' });
  const post = db.posts.find(item => item.id === req.params.id && (req.user?.role === 'SUPER_ADMIN' || item.tenantId === req.tenant?.id));
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
  post.isPublished = false;
  post.isIndexable = false;
  post.updatedAt = new Date().toISOString();
  db.addAuditLog({ tenantId: post.tenantId || undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'DESPUBLICAR_POST', entity: 'BlogPost', entityId: post.id, details: `Post ${post.slug} despublicado sem apagar conteúdo ou histórico.` });
  await db.persistNow();
  return res.json({ success: true, message: 'Post despublicado; conteúdo e histórico preservados.' });
});
/* =========================================================================
   1. AUTH & USER IDENTITY
   ========================================================================= */

// Get current logged-in user profile
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const sessionData = getSessionDataForUser(req.user);
  const supportSession = req.supportSession;
  const actorUser = supportSession ? db.users.find(item => item.id === supportSession.actorUserId) : undefined;

  res.json({
    ...sessionData,
    supportSession: supportSession && actorUser ? {
      id: supportSession.id,
      targetUser: safeSupportIdentity(req.user),
      actorUser: safeSupportIdentity(actorUser),
      expiresAt: supportSession.expiresAt
    } : null,
    availableDemoAccounts: process.env.NODE_ENV === 'production' ? [] : db.users.filter(isPublicDemoUser).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId,
      driverId: u.driverId
    }))
  });
});

apiRouter.post('/auth/logout', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  delete req.user.activeSessionId;
  delete req.user.activeSessionExpiresAt;
  db.addAuditLog({ tenantId: req.user.tenantId || undefined, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'LOGOUT', entity: 'User', entityId: req.user.id, details: 'Sessão atual revogada pelo próprio usuário.' });
  await db.persistNow();
  return res.json({ success: true });
});

// Temporary support access. It never accepts a target identity from the browser as a login credential;
// the authenticated Super Admin creates a short-lived, signed, in-memory support session.
apiRouter.post('/support/sessions', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN' || req.supportSession) {
    return res.status(403).json({ error: 'Somente um Super Admin autenticado pode iniciar uma sessão de suporte.' });
  }
  const targetUserId = typeof req.body?.targetUserId === 'string' ? req.body.targetUserId.trim() : '';
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId é obrigatório.' });

  const targetUser = db.users.find(user => user.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: 'Usuário de suporte não encontrado.' });
  if (targetUser.role === 'SUPER_ADMIN') return res.status(400).json({ error: 'Uma sessão de suporte não pode assumir outro Super Admin.' });
  if (targetUser.status !== 'ATIVO') return res.status(409).json({ error: 'Somente usuários ativos podem receber acesso de suporte.' });

  const expiresAt = new Date(Date.now() + SUPPORT_SESSION_TTL_MS).toISOString();
  const supportSession: SupportSessionRecord = {
    id: randomUUID(),
    actorUserId: req.user.id,
    targetUserId: targetUser.id,
    expiresAt
  };
  activeSupportSessions.set(supportSession.id, supportSession);

  const token = jwt.sign({
    userId: targetUser.id,
    support: true,
    supportSessionId: supportSession.id,
    actorUserId: req.user.id,
    targetUserId: targetUser.id,
    iss: 'elolog-support'
  }, SAFE_JWT_SECRET, { expiresIn: '30m' });
  db.saveAuthToken(token, targetUser.id, new Date(expiresAt));
  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    tenantName: targetUser.tenantId ? db.tenants.find(t => t.id === targetUser.tenantId)?.name : undefined,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'SUPORTE_INICIADO',
    entity: 'SupportSession',
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

apiRouter.post('/support/sessions/end', (req: AuthenticatedRequest, res: Response) => {
  const supportSession = req.supportSession;
  if (!supportSession || !req.user) {
    return res.status(400).json({ error: 'Não existe uma sessão de suporte ativa.' });
  }
  const actorUser = db.users.find(user => user.id === supportSession.actorUserId);
  if (!actorUser || actorUser.role !== 'SUPER_ADMIN') {
    activeSupportSessions.delete(supportSession.id);
    return res.status(401).json({ error: 'O administrador de origem da sessão não está mais disponível.' });
  }

  activeSupportSessions.delete(supportSession.id);
  const { token } = issueUserSession(actorUser);
  db.addAuditLog({
    tenantId: req.user.tenantId || undefined,
    tenantName: req.tenant?.name || undefined,
    userId: actorUser.id,
    userName: actorUser.name,
    userRole: actorUser.role,
    action: 'SUPORTE_ENCERRADO',
    entity: 'SupportSession',
    entityId: supportSession.id,
    details: `Acesso assistido encerrado para ${req.user.name}. Retorno ao Super Admin.`
  });

  return res.json({ ...getSessionDataForUser(actorUser), token });
});

// Login endpoint
apiRouter.post('/auth/login', async (req: AuthenticatedRequest, res: Response) => {
  const { email, role, password } = req.body;

    if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-mail é obrigatório.' });
  }

  const targetUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!targetUser) {

    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Check if pending approval
  if (targetUser.status === 'PENDENTE') {
    return res.status(403).json({ error: 'Seu cadastro foi realizado com sucesso, mas ainda não foi liberado. Aguarde a aprovação do Super Administrador.' });
  }

  // Password login is allowed only for accounts with a bcrypt hash.
  // Accounts without a password must use the protected WhatsApp OTP flow.
  if (!targetUser.password || typeof targetUser.password !== 'string' || !targetUser.password.startsWith('$2')) {
    return res.status(401).json({ error: 'Este usuário deve acessar pelo código OTP do WhatsApp.' });
  }
  if (!password) {
    return res.status(401).json({ error: 'Senha é obrigatória para este usuário.' });
  }
  const isMatch = await bcrypt.compare(password, targetUser.password).catch(() => false);
  if (!isMatch) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();

  // Um novo login substitui a sessão anterior do mesmo usuário.
  const { token } = issueUserSession(targetUser);

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    tenantName: targetUser.tenantId ? db.tenants.find(t => t.id === targetUser?.tenantId)?.name : 'Plataforma Global',
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: targetUser.id,
    details: `Login realizado com sucesso via perfil ${targetUser.role}`
  });

  res.json({
    user: sanitizeUser(targetUser),
    token: token
  });
});

// Public demonstration session: only fixed TEST users from the public demo tenant can mint tokens.
apiRouter.post('/auth/demo-session', async (req: AuthenticatedRequest, res: Response) => {
  await db.waitForPersistence();
  const requestedUserId = typeof req.body?.userId === 'string' && req.body.userId.trim()
    ? req.body.userId.trim()
    : PUBLIC_DEMO_PRIMARY_USER_ID;
  const targetUser = db.users.find(user => user.id === requestedUserId);
  if (!targetUser || !isPublicDemoUser(targetUser)) {
    return res.status(404).json({ error: 'Perfil fictício de demonstração não encontrado.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();
  const { token } = issueUserSession(targetUser);
  db.addAuditLog({
    tenantId: PUBLIC_DEMO_TENANT_ID,
    tenantName: db.tenants.find(item => item.id === PUBLIC_DEMO_TENANT_ID)?.name || 'Demonstração',
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: requestedUserId === PUBLIC_DEMO_PRIMARY_USER_ID ? 'DEMO_SESSION_STARTED' : 'DEMO_PROFILE_SELECTED',
    entity: 'DemoSession',
    entityId: targetUser.id,
    details: `Sessão pública de demonstração iniciada no perfil ${targetUser.role}, com dados fictícios e permissões restritas.`
  });
  await db.persistNow();
  return res.json({ ...getSessionDataForUser(targetUser), token, demo: true });
});

// Demo switching remains development-only and can target only fixed TEST users from the demo tenant.
apiRouter.post('/auth/switch-demo', (req: AuthenticatedRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'A troca de perfil de demonstração está desabilitada em produção.' });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório.' });
  }

  const targetUser = db.users.find(u => u.id === userId);
  if (!targetUser || !isPublicDemoUser(targetUser)) {
    return res.status(404).json({ error: 'Usuário de demonstração não encontrado.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();
  const { token } = issueUserSession(targetUser);

  res.json({ ...getSessionDataForUser(targetUser), token });
});

// Active WhatsApp Login OTPs Map with rate limiting & attempt tracking
const activeOTPs = new Map<string, { code: string; expiresAt: number; failedAttempts?: number }>();
const otpLastSentAt = new Map<string, number>();
const publicInterestAttempts = new Map<string, number>();
const PUBLIC_INTEREST_RATE_WINDOW_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// Pending registration OTPs Map
const pendingRegistrations = new Map<string, {
  code: string;
  expiresAt: number;
  companyName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  passwordHash: string;
  failedAttempts: number;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  termsVersion?: string;
  privacyVersion?: string;
  acceptedAt?: string;
}>();
const registrationLastSentAt = new Map<string, number>();
const REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1000;
const REGISTRATION_MAX_FAILED_ATTEMPTS = 5;
const cleanupPendingRegistrations = () => {
  const now = Date.now();
  pendingRegistrations.forEach((pending, key) => {
    if (pending.expiresAt <= now) {
      pendingRegistrations.delete(key);
      registrationLastSentAt.delete(key);
    }
  });
};
const pendingRegistrationCleanup = setInterval(cleanupPendingRegistrations, 5 * 60 * 1000);
pendingRegistrationCleanup.unref();

const normalizePhoneForLookup = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('55') && digits.length === 13 ? digits.slice(2) : digits;
};
const isValidBrazilianLoginPhone = (value: string) => /^(?:\d{10}|\d{11})$/.test(value);

// Request WhatsApp OTP for Login
apiRouter.post('/auth/request-otp', async (req: AuthenticatedRequest, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' });
  }

  // Clean phone string to match digits
  const cleanPhone = normalizePhoneForLookup(phone);
  if (!isValidBrazilianLoginPhone(cleanPhone)) {
    return res.status(400).json({ error: 'Número de telefone inválido. Informe DDD e número com 10 ou 11 dígitos.' });
  }

  const matchingUsers = db.users.filter(user => normalizePhoneForLookup(user.phone) === cleanPhone);
  if (matchingUsers.length > 1) {
    return res.status(409).json({ error: 'Este telefone está associado a mais de uma conta. Solicite suporte.' });
  }
  const targetUser = matchingUsers[0];

  if (!targetUser) {
    return res.status(404).json({ error: 'Nenhum usuário cadastrado com este telefone.' });
  }

  if (targetUser.status === 'PENDENTE') {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo Super Administrador.' });
  }

  const lastSentAt = otpLastSentAt.get(cleanPhone);
  if (lastSentAt && Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'Um código já foi solicitado recentemente. Aguarde um minuto antes de pedir outro.' });
  }

  // Generate a cryptographically secure 6-digit code.
  const code = String(randomInt(100000, 1000000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const cleanUserPhone = normalizePhoneForLookup(targetUser.phone);
  activeOTPs.set(cleanPhone, { code, expiresAt, failedAttempts: 0 });
  if (cleanUserPhone !== cleanPhone) {
    activeOTPs.set(cleanUserPhone, { code, expiresAt, failedAttempts: 0 });
  }
  activeOTPs.set(targetUser.id, { code, expiresAt, failedAttempts: 0 });
  otpLastSentAt.set(cleanPhone, Date.now());
  if (otpLastSentAt.size > 10000) {
    const cutoff = Date.now() - OTP_RESEND_COOLDOWN_MS;
    for (const [key, timestamp] of otpLastSentAt) if (timestamp < cutoff) otpLastSentAt.delete(key);
  }

  const tenantId = targetUser.tenantId || 'tenant-translog-01';
  const config = resolveWhatsAppConfig(tenantId);
  const messageBody = renderLoginOtpMessage(code, 5, targetUser.tenantId);

  // Send via WhatsApp API Gateway
  const waResult = await sendToWhatsAppGateway(config, {
    number: cleanPhone,
    body: messageBody,
    externalKey: `otp-${Date.now()}`
  });

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'OTP_REQUEST',
    entity: 'User',
    entityId: targetUser.id,
    details: `Solicitação OTP via WhatsApp para o telefone ${phone} [${waResult.success ? 'ACEITA_PELO_GATEWAY' : 'FALHA'}]`
  });
  if (!waResult.success) {
    return res.status(502).json({
      error: 'Não foi possível enviar o código OTP pelo WhatsApp. Verifique a configuração ou a sessão do canal e tente novamente.'
    });
  }
  res.json({
    success: true,
    message: `Código de login aceito pelo gateway WhatsApp para ${phone}. Verifique suas mensagens.`
  });
});

// Verify WhatsApp OTP for Login
apiRouter.post('/auth/verify-otp', (req: AuthenticatedRequest, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
  }

  const cleanPhone = normalizePhoneForLookup(phone);
  if (!isValidBrazilianLoginPhone(cleanPhone)) {
    return res.status(400).json({ error: 'Número de telefone inválido.' });
  }
  const submittedCode = String(code).trim();
  if (!/^\d{6}$/.test(submittedCode)) {
    return res.status(400).json({ error: 'Código de verificação inválido.' });
  }

  const matchingUsers = db.users.filter(user => normalizePhoneForLookup(user.phone) === cleanPhone);
  if (matchingUsers.length > 1) {
    return res.status(409).json({ error: 'Este telefone está associado a mais de uma conta. Solicite suporte.' });
  }
  const targetUser = matchingUsers[0];

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuário não encontrado para este telefone.' });
  }

  const cleanUserPhone = normalizePhoneForLookup(targetUser.phone);
  const activeOtp = activeOTPs.get(cleanPhone) || activeOTPs.get(cleanUserPhone) || activeOTPs.get(targetUser.id);

  if (!activeOtp) {
    return res.status(400).json({ error: 'Nenhum código ativo encontrado para este telefone. Solicite um novo código.' });
  }

  if (Date.now() > activeOtp.expiresAt) {
    activeOTPs.delete(cleanPhone);
    activeOTPs.delete(cleanUserPhone);
    activeOTPs.delete(targetUser.id);
    return res.status(400).json({ error: 'Código de verificação expirou (validade de 5 minutos).' });
  }

  const expectedCode = Buffer.from(activeOtp.code, 'utf8');
  const providedCode = Buffer.from(submittedCode, 'utf8');
  const codesMatch = expectedCode.length === providedCode.length && timingSafeEqual(expectedCode, providedCode);
  if (!codesMatch) {
    activeOtp.failedAttempts = (activeOtp.failedAttempts || 0) + 1;
    if (activeOtp.failedAttempts >= 5) {
      activeOTPs.delete(cleanPhone);
      activeOTPs.delete(cleanUserPhone);
      activeOTPs.delete(targetUser.id);
      return res.status(429).json({ error: 'Muitas tentativas incorretas. Código bloqueado. Solicite um novo código.' });
    }
    return res.status(400).json({ error: `Código de verificação inválido. Tentativa ${activeOtp.failedAttempts}/5.` });
  }

  // Successful verification
  activeOTPs.delete(cleanPhone);
  activeOTPs.delete(cleanUserPhone);
  activeOTPs.delete(targetUser.id);

  targetUser.lastLoginAt = new Date().toISOString();
  const { token } = issueUserSession(targetUser);

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: targetUser.id,
    details: `Login realizado com sucesso via WhatsApp OTP`
  });

  res.json({
    user: sanitizeUser(targetUser),
    token: token
  });
});

interface AtendoProvisionResult {
  status: NonNullable<Tenant['atendoCrmProvisioningStatus']>;
  externalTenantId?: string;
  error?: string;
}

async function provisionAtendoCrmTenant(tenant: Tenant): Promise<AtendoProvisionResult> {
  await db.waitForPersistence();
  if (tenant.atendoCrmTenantId && tenant.atendoCrmProvisioningStatus === 'PROVISIONED') {
    return { status: 'PROVISIONED', externalTenantId: tenant.atendoCrmTenantId };
  }

  const config = db.atendoCrmAdminConfig;
  if (!config.baseUrl || !config.apiId || !config.bearerToken) {
    tenant.atendoCrmProvisioningStatus = 'NOT_CONFIGURED';
    tenant.atendoCrmProvisioningError = 'Configuração administrativa do Atendo CRM não está disponível.';
    await db.persistNow();
    return { status: 'NOT_CONFIGURED', error: tenant.atendoCrmProvisioningError };
  }

  tenant.atendoCrmProvisioningStatus = 'PENDING';
  tenant.atendoCrmProvisioningError = undefined;
  await db.persistNow();

  try {
    const generatedPassword = randomBytes(24).toString('base64url');
    const request = buildAtendoCrmCreateTenantRequest(config, tenant, generatedPassword);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    let response: globalThis.Response;
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

    const contentType = response.headers.get('content-type') || '';
    const responseData = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      tenant.atendoCrmProvisioningStatus = 'ERROR';
      tenant.atendoCrmProvisioningError = `Atendo CRM retornou HTTP ${response.status}.`;
      db.addErrorLog({ service: 'atendo-crm-admin', route: 'createtenant', method: 'POST', statusCode: response.status, event: 'ATENDO_CRM_PROVISIONING_REJECTED', message: 'O Atendo CRM rejeitou o provisionamento de uma empresa.' });
      await db.persistNow();
      return { status: 'ERROR', error: tenant.atendoCrmProvisioningError };
    }

    const externalTenantId = externalTenantIdFromResponse(responseData);
    if (!externalTenantId) {
      tenant.atendoCrmProvisioningStatus = 'ERROR';
      tenant.atendoCrmProvisioningError = 'Atendo CRM respondeu sem identificador externo reconhecível.';
      db.addErrorLog({ service: 'atendo-crm-admin', route: 'createtenant', method: 'POST', statusCode: response.status, event: 'ATENDO_CRM_PROVISIONING_INVALID_RESPONSE', message: 'O Atendo CRM respondeu sem identificador de tenant reconhecível.' });
      await db.persistNow();
      return { status: 'ERROR', error: tenant.atendoCrmProvisioningError };
    }

    tenant.atendoCrmTenantId = externalTenantId;
    tenant.atendoCrmProvisioningStatus = 'PROVISIONED';
    tenant.atendoCrmProvisionedAt = new Date().toISOString();
    tenant.atendoCrmProvisioningError = undefined;
    await db.persistNow();
    return { status: 'PROVISIONED', externalTenantId };
  } catch {
    tenant.atendoCrmProvisioningStatus = 'ERROR';
    tenant.atendoCrmProvisioningError = 'Falha de comunicação com o Atendo CRM durante o provisionamento.';
    db.addErrorLog({ service: 'atendo-crm-admin', route: 'createtenant', method: 'POST', event: 'ATENDO_CRM_PROVISIONING_ERROR', message: 'Falha de comunicação ao provisionar uma empresa no Atendo CRM.' });
    await db.persistNow();
    return { status: 'ERROR', error: tenant.atendoCrmProvisioningError };
  }
}

// Register Company (Tenant + Admin User in PENDENTE state)
apiRouter.post('/auth/register-company', async (req: AuthenticatedRequest, res: Response) => {
  const { companyName, cnpj, responsibleName, email, phone, password, termsAccepted, privacyAccepted } = req.body || {};
  const normalizedCompanyName = String(companyName || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
  const normalizedCnpj = normalizePublicIdentity(cnpj);
  const normalizedResponsibleName = String(responsibleName || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  const cleanRegistrationPhone = normalizePhoneForLookup(normalizedPhone);
  const passwordValue = typeof password === 'string' ? password : '';

  if (normalizedCompanyName.length < 3 || normalizedResponsibleName.length < 3 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedCnpj.length !== 14 || !isValidBrazilianLoginPhone(cleanRegistrationPhone) || passwordValue.length < 8 || termsAccepted !== true || privacyAccepted !== true) {
    return res.status(400).json({ error: 'Preencha os campos com formatos válidos e aceite os termos.' });
  }

  // Check if email already registered
  const emailExists = db.users.some(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
  if (emailExists) {
    return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
  }

  // Check if CNPJ already registered
  const cnpjExists = db.tenants.some(t => normalizePublicIdentity(t.cnpj) === normalizedCnpj);
  if (cnpjExists) {
    return res.status(400).json({ error: 'Este CNPJ já está cadastrado no sistema.' });
  }

  cleanupPendingRegistrations();
  const key = normalizedEmail;
  const previousPending = pendingRegistrations.get(key);
  const previousSentAt = registrationLastSentAt.get(key);
  if (previousPending && previousSentAt && Date.now() - previousSentAt < REGISTRATION_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'Aguarde um minuto antes de solicitar outro código.' });
  }

  // Generate a cryptographically secure verification code and hash the password before keeping it pending.
  const code = String(randomInt(100000, 1000000));
  const passwordHash = await bcrypt.hash(passwordValue, 12);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

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
    acceptedAt: new Date().toISOString()
  });
  registrationLastSentAt.set(key, Date.now());

  // Attempt real WhatsApp dispatch if gateway configured
  const cleanPhone = cleanRegistrationPhone;
  const config = db.globalWhatsAppConfig;
  if (config?.baseUrl && config?.token && config?.isActive) {
    sendToWhatsAppGateway(config, {
      number: cleanPhone,
      body: `🚚 [ELO LOG] Olá ${responsibleName}, seu código de verificação para o cadastro da empresa ${companyName} é: *${code}*.`,
      externalKey: `reg-wa-${Date.now()}`
    }).catch(err => console.error('WhatsApp reg err:', err));
  }

  res.json({
    success: true,
    message: 'Código de verificação enviado para o e-mail e WhatsApp do responsável!'
  });
});

// Verify Registration Code and complete creation in PENDENTE state
apiRouter.post('/auth/verify-registration', async (req: AuthenticatedRequest, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-mail e código de verificação são obrigatórios.' });
  }

  const key = String(email).trim().toLowerCase();
  const pending = pendingRegistrations.get(key);

  if (!pending) {
    return res.status(404).json({ error: 'Nenhum cadastro pendente encontrado para este e-mail.' });
  }

  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(key);
    registrationLastSentAt.delete(key);
    return res.status(400).json({ error: 'O código de verificação expirou. Faça o cadastro novamente.' });
  }

  const submittedCode = String(code).trim();
  const expectedCode = Buffer.from(pending.code, 'utf8');
  const providedCode = Buffer.from(submittedCode, 'utf8');
  const codesMatch = /^\d{6}$/.test(submittedCode) && expectedCode.length === providedCode.length && timingSafeEqual(expectedCode, providedCode);
  if (!codesMatch) {
    pending.failedAttempts += 1;
    if (pending.failedAttempts >= REGISTRATION_MAX_FAILED_ATTEMPTS) {
      pendingRegistrations.delete(key);
      return res.status(429).json({ error: 'Muitas tentativas incorretas. Faça o cadastro novamente.' });
    }
    return res.status(400).json({ error: 'Código de verificação incorreto.' });
  }

  // Success! Create actual database structures in PENDENTE state
  const tenantId = `tenant-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();

  const hashedPassword = pending.passwordHash;

  const newTenant: Tenant = {
    id: tenantId,
    name: pending.companyName,
    legalName: pending.companyName,
    cnpj: pending.cnpj,
    email: pending.email,
    phone: pending.phone,
    zipCode: '01000-000',
    address: 'Av. Industrial',
    number: '123',
    neighborhood: 'Distrito Industrial',
    city: 'São Paulo',
    state: 'SP',
    status: 'PENDENTE', // Crucial: Starts as PENDENTE
    notificationPlan: 'SAAS_FREE',
    notificationBillingStatus: 'NOT_REQUIRED',
    plan: 'BASICO',
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

  const newUser: User = {
    id: userId,
    tenantId: tenantId,
    name: pending.responsibleName,
    email: pending.email,
    phone: pending.phone,
    role: 'EMPRESA_SUPER_ADMIN', // Owner of the tenant
    status: 'PENDENTE',
    accountType: 'REAL',
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
    userAgent: req.get('user-agent') || ''
  });
  void dispatchConfiguredNotification('EMPRESA_CADASTRADA', [
    newUser,
    ...db.users.filter(user => user.role === 'SUPER_ADMIN')
  ], {
    nome: newUser.name,
    empresa: newTenant.name,
    email: newUser.email,
    telefone: newUser.phone,
    tenantId,
    link: process.env.APP_URL || ''
  });

  // Generate Super Admin Alert
  db.addNotification({
    tenantId: null,
    title: '🏢 Novo Cadastro de Empresa',
    message: `A empresa "${pending.companyName}" se cadastrou e aguarda sua aprovação no Painel Global.`,
    type: 'SISTEMA',
    userId: 'user-superadmin'
  });

  db.addAuditLog({
    tenantId,
    userId,
    userName: pending.responsibleName,
    userRole: 'EMPRESA_SUPER_ADMIN',
    action: 'REGISTRO_EMPRESA',
    entity: 'Tenant',
    entityId: tenantId,
    details: `Empresa ${pending.companyName} cadastrada e verificada por código. Aguardando aprovação do Super Admin.`
  });

  const provisioning = await provisionAtendoCrmTenant(newTenant);
  pendingRegistrations.delete(key);
  registrationLastSentAt.delete(key);

  res.json({
    success: true,
    provisioningStatus: provisioning.status,
    message: provisioning.status === 'PROVISIONED'
      ? 'Cadastro realizado e empresa criada no Atendo CRM. Aguarde a liberação do Super Administrador para acessar a plataforma.'
      : 'Cadastro realizado no Gestor. O provisionamento do Atendo CRM ficará pendente para nova tentativa pelo administrador.'
  });
});

// Legacy public driver route disabled: use the global quick-registration flow or the authenticated company route.
apiRouter.post('/auth/register-driver', (_req: AuthenticatedRequest, res: Response) => {
  return res.status(410).json({ error: 'Este endpoint legado foi desativado. Use o cadastro rápido da vitrine ou o cadastro autenticado da empresa.' });
});

/* =========================================================================
   2. TENANTS & SAAS MANAGEMENT (Super Admin & Company Admins)
   ========================================================================= */

// List tenants
apiRouter.get('/tenants', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.tenants);
  }
  // Company users only see their own tenant
  const tenant = db.tenants.find(t => t.id === req.user?.tenantId);
  res.json(tenant ? [tenant] : []);
});

// Create tenant (Super Admin only)
apiRouter.post('/tenants', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Admin pode criar empresas' });
  }
  await db.waitForPersistence();

  const {
    name, legalName, cnpj, email, phone, city, state, plan, allowedOperations,
    responsibleName, password, termsAccepted, privacyAccepted
  } = req.body || {};
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedCnpj = String(cnpj || '').replace(/\D/g, '');
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedName || normalizedName.length < 2 || normalizedCnpj.length !== 14 || !responsibleName || !normalizedEmail || !normalizedPhone || !password) {
    return res.status(400).json({ error: 'Preencha os mesmos campos obrigatórios do cadastro da home.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Informe um e-mail válido para o responsável.' });
  }
  if (normalizePhoneForLookup(normalizedPhone).length < 10) {
    return res.status(400).json({ error: 'Informe um celular válido para o responsável.' });
  }
  if (String(password).length < 6 || password !== req.body.confirmPassword) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres e coincidir com a confirmação.' });
  }
  if (termsAccepted !== true || privacyAccepted !== true) {
    return res.status(400).json({ error: 'O cadastro exige aceite dos Termos de Uso e da Política de Privacidade.' });
  }
  if (db.tenants.some(tenant => String(tenant.cnpj || '').replace(/\D/g, '') === normalizedCnpj)) {
    return res.status(400).json({ error: 'Este CNPJ já está cadastrado no sistema.' });
  }
  if (db.users.some(user => user.email?.trim().toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
  }

  const now = new Date().toISOString();
  const selectedPlan = plan === 'EMPRESARIAL' || plan === 'PROFISSIONAL' ? plan : 'BASICO';
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}-${randomUUID().slice(0, 8)}`,
    name: normalizedName,
    legalName: String(legalName || normalizedName).trim() || normalizedName,
    cnpj: String(cnpj).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    zipCode: String(req.body.zipCode || '').trim(),
    address: String(req.body.address || '').trim(),
    number: String(req.body.number || '').trim(),
    neighborhood: String(req.body.neighborhood || '').trim(),
    city: String(city || '').trim(),
    state: String(state || '').trim().toUpperCase(),
    status: 'ATIVA',
    notificationPlan: 'SAAS_FREE',
    notificationBillingStatus: 'NOT_REQUIRED',
    plan: selectedPlan,
    allowedOperations: Array.isArray(allowedOperations) && allowedOperations.length ? allowedOperations : ['CARGA_GERAL'],
    planLimits: {
      maxUsers: selectedPlan === 'EMPRESARIAL' ? 100 : selectedPlan === 'PROFISSIONAL' ? 25 : 5,
      maxDrivers: selectedPlan === 'EMPRESARIAL' ? 500 : selectedPlan === 'PROFISSIONAL' ? 100 : 20,
      maxFreightsMonthly: selectedPlan === 'EMPRESARIAL' ? 2000 : selectedPlan === 'PROFISSIONAL' ? 500 : 50,
      customForms: selectedPlan !== 'BASICO',
      exportReports: true,
      prioritySupport: selectedPlan === 'EMPRESARIAL'
    },
    atendoCrmProvisioningStatus: 'PENDING',
    createdAt: now,
    updatedAt: now
  };

  const newUser: User = {
    id: `user-${Date.now()}-${randomUUID().slice(0, 8)}`,
    tenantId: newTenant.id,
    name: String(responsibleName).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: 'EMPRESA_SUPER_ADMIN',
    status: 'ATIVO',
    accountType: 'REAL',
    readOnly: false,
    password: await bcrypt.hash(String(password), 10),
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
    termsVersion: CURRENT_LEGAL_VERSIONS.terms,
    privacyVersion: CURRENT_LEGAL_VERSIONS.privacy,
    createdAt: now
  };

  db.tenants.push(newTenant);
  db.users.push(newUser);
  await db.recordLegalConsent({ userId: newUser.id, tenantId: newTenant.id, termsVersion: CURRENT_LEGAL_VERSIONS.terms, privacyVersion: CURRENT_LEGAL_VERSIONS.privacy, acceptedAt: now, ipAddress: req.ip, userAgent: req.get('user-agent') || '' });

  db.addAuditLog({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CRIACAO_EMPRESA',
    entity: 'Tenant',
    entityId: newTenant.id,
    details: `Empresa ${newTenant.name} criada com administrador responsável e provisionamento Atendo CRM iniciado.`
  });

  const provisioning = await provisionAtendoCrmTenant(newTenant);
  await db.persistNow();
  void dispatchConfiguredNotification('EMPRESA_CADASTRADA', [newUser, ...db.users.filter(user => user.role === 'SUPER_ADMIN')], { nome: newUser.name, empresa: newTenant.name, email: newUser.email, telefone: newUser.phone, tenantId: newTenant.id, link: process.env.APP_URL || '' });

  res.status(201).json({ ...newTenant, atendoCrmProvisioningStatus: provisioning.status, atendoCrmTenantId: provisioning.externalTenantId });
});

// Retry external Atendo CRM provisioning without exposing admin credentials
apiRouter.post('/tenants/:id/provision-atendo', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas Super Admin pode reprocessar o provisionamento Atendo CRM.' });
  const tenant = db.tenants.find(item => item.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada.' });
  const result = await provisionAtendoCrmTenant(tenant);
  await db.persistNow();
  return res.json({ success: result.status === 'PROVISIONED', status: result.status, tenant: { ...tenant, atendoCrmProvisioningError: result.status === 'ERROR' ? tenant.atendoCrmProvisioningError : undefined } });
});

apiRouter.put('/tenants/:id', (req: AuthenticatedRequest, res: Response) => {
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isCompanyAdmin = (req.user?.role === 'EMPRESA_SUPER_ADMIN' || req.user?.role === 'ADMIN') && req.user?.tenantId === req.params.id;

  if (!isSuperAdmin && !isCompanyAdmin) {
    return res.status(403).json({ error: 'Sem permissão para editar esta empresa' });
  }

  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada' });

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

  // Security check: Only Super Admin can change plan limits, subscription status, and allowed operations
  if (allowedOperations && isSuperAdmin) {
    tenant.allowedOperations = allowedOperations;
  }

  if (plan && plan !== tenant.plan) {
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Apenas o Super Administrador pode alterar o plano contratado da empresa.' });
    }
    tenant.plan = plan;
    tenant.planLimits = {
      maxUsers: plan === 'EMPRESARIAL' ? 100 : plan === 'PROFISSIONAL' ? 25 : 5,
      maxDrivers: plan === 'EMPRESARIAL' ? 500 : plan === 'PROFISSIONAL' ? 100 : 20,
      maxFreightsMonthly: plan === 'EMPRESARIAL' ? 2000 : plan === 'PROFISSIONAL' ? 500 : 50,
      customForms: plan !== 'BASICO',
      exportReports: true,
      prioritySupport: plan === 'EMPRESARIAL'
    };
  }

  if (status && status !== tenant.status) {
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Apenas o Super Administrador pode aprovar ou alterar o status operacional da empresa.' });
    }
    tenant.status = status;
    // Auto-approve associated users when the tenant/company is approved
    if (status === 'ATIVA') {
      db.users.forEach(u => {
        if (u.tenantId === tenant.id && u.status === 'PENDENTE') {
          u.status = 'ATIVO';
        }
      });
      const approvedUsers = db.users.filter(user => user.tenantId === tenant.id);
      void dispatchConfiguredNotification('EMPRESA_APROVADA', approvedUsers, {
        nome: approvedUsers[0]?.name || tenant.name,
        empresa: tenant.name,
        tenantId: tenant.id,
        link: process.env.APP_URL || ''
      });
    }
  }
  tenant.updatedAt = new Date().toISOString();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ATUALIZAR_EMPRESA',
    entity: 'Tenant',
    entityId: tenant.id,
    details: `Empresa ${tenant.name} atualizada`
  });

  res.json(tenant);
});

apiRouter.delete('/tenants/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Admin pode excluir empresas' });
  }

  const index = db.tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Empresa não encontrada' });

  if (db.tenants.length <= 1) {
    return res.status(400).json({ error: 'Não é possível excluir a última empresa do sistema' });
  }

  const tenant = db.tenants[index];
  tenant.status = 'INATIVA';
  tenant.updatedAt = new Date().toISOString();

  db.addAuditLog({
    tenantId: tenant.id,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DESATIVAR_EMPRESA',
    entity: 'Tenant',
    entityId: tenant.id,
    details: `Empresa ${tenant.name} desativada sem apagar usuários, documentos ou histórico.`
  });
  await db.persistNow();

  res.json({ success: true, message: 'Empresa desativada; usuários, documentos e histórico preservados.' });
});

/* =========================================================================
   3. USERS MANAGEMENT
   ========================================================================= */

apiRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.users.map(sanitizeUser));
  }
  // Company scoped
  const tenantUsers = db.users.filter(u => u.tenantId === req.user?.tenantId);
  res.json(tenantUsers.map(sanitizeUser));
});

apiRouter.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas administradores reais podem cadastrar usuários.' });
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

  const requestedRole = role || (createAsDriver ? 'MOTORISTA' : 'USUARIO');
  if (!canAssignUserRole(req.user, requestedRole)) return res.status(403).json({ error: 'Você não pode atribuir este nível de acesso.' });
  const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? (requestedRole === 'SUPER_ADMIN' ? null : tenantId) : req.user?.tenantId;
  if (requestedRole !== 'SUPER_ADMIN' && (!targetTenantId || !db.tenants.some(tenant => tenant.id === targetTenantId))) return res.status(400).json({ error: 'Empresa válida é obrigatória para este perfil.' });

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  }

  // Check if email already registered
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
  }

  const hashedPassword = password && password.trim() ? await bcrypt.hash(password.trim(), 10) : undefined;
  const now = new Date().toISOString();

  const newUserId = `user-${Date.now()}`;
  const newDriverId = `driver-${Date.now()}`;
  const isDriver = requestedRole === 'MOTORISTA' || createAsDriver;

  const newUser: User = {
    id: newUserId,
    tenantId: targetTenantId || null,
    name,
    email,
    phone: phone || '',
    role: isDriver ? 'MOTORISTA' : requestedRole,
    status: 'ATIVO',
    accountType: 'REAL',
    readOnly: false,
    password: hashedPassword,
    driverId: isDriver ? newDriverId : undefined,
    createdAt: now
  };

  db.users.push(newUser);

  if (isDriver) {
    const newDriver: Driver = {
      id: newDriverId,
      userId: newUserId,
      tenantId: targetTenantId || null,
      name,
      cpf: cpf || '',
      rg: rg || '',
      birthDate: birthDate || '',
      phone: phone || '',
      email,
      zipCode: zipCode || '',
      address: address || '',
      city: city || '',
      state: state || '',
      cnh: cnh || '',
      cnhCategory: cnhCategory || '',
      cnhExpiresAt: cnhExpiresAt || '',
      status: 'DISPONIVEL',
      rating: 5.0,
      completedTrips: 0,
      rntrc: rntrc || '',
      notes: notes || '',
      bankName: bankName || '',
      bankAgency: bankAgency || '',
      bankAccount: bankAccount || '',
      pixKeyType: pixKeyType || '',
      pixKey: pixKey || '',
      createdAt: now
    };

    db.drivers.push(newDriver);

    // If vehicle plate or model was provided, create a vehicle too
    if (vehiclePlate || vehicleModel) {
      const newVehicleId = `vehicle-${Date.now()}`;
      const newVehicle: Vehicle = {
        id: newVehicleId,
        driverId: newDriverId,
        tenantId: targetTenantId || db.tenants[0].id,
        type: vehicleType || 'TRUCK',
        brand: vehicleBrand || 'Mercedes-Benz',
        model: vehicleModel || 'Atego',
        year: Number(vehicleYear) || 2022,
        plate: vehiclePlate || 'ABC1D23',
        renavam: vehicleRenavam || '00123456789',
        capacityKg: Number(capacityKg) || 12000,
        bodyType: bodyType || 'BAU',
        status: 'ATIVO',
        createdAt: now
      };
      db.vehicles.push(newVehicle);
    }
  }

  db.addAuditLog({
    tenantId: targetTenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CRIACAO_USUARIO',
    entity: 'User',
    entityId: newUser.id,
    details: isDriver
      ? `Criado usuário ${newUser.name} com perfil Motorista e registro completo de documentos, dados bancários e veículo`
      : `Criado usuário ${newUser.name} com perfil ${newUser.role}`
  });

  const tenantUsers = targetTenantId ? db.users.filter(user => user.tenantId === targetTenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(user.role)) : [];
  void dispatchConfiguredNotification('USUARIO_CADASTRADO', [newUser, ...tenantUsers], {
    nome: newUser.name,
    empresa: targetTenantId ? (db.tenants.find(tenant => tenant.id === targetTenantId)?.name || '') : 'Elo Log',
    email: newUser.email,
    telefone: newUser.phone,
    tenantId: targetTenantId || undefined,
    link: process.env.APP_URL || ''
  });
  res.status(201).json(sanitizeUser(newUser));
});

apiRouter.put('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Security check: only Super Admin or Admin of same tenant, or user editing their own profile
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isSelf = req.user?.id === user.id;
  const isSameTenantAdmin = Boolean(req.user && TENANT_ADMIN_ROLES.includes(req.user.role) && req.user.tenantId === user.tenantId);
  const canManageUserFields = Boolean(isSuperAdmin || (isSameTenantAdmin && !isSelf));

  if (!isSuperAdmin && !isSelf && !isSameTenantAdmin) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este usuário' });
  }

  const { name, email, phone, role, status, password } = req.body || {};
  const previousUserStatus = user.status;
  const normalizedName = name === undefined ? user.name : String(name).trim().slice(0, 160);
  const normalizedEmail = email === undefined ? user.email : String(email).trim().toLowerCase().slice(0, 254);
  const normalizedPhone = phone === undefined ? user.phone : String(phone).trim().slice(0, 30);
  if (normalizedName.length < 2 || !normalizedEmail.includes('@')) return res.status(400).json({ error: 'Nome e e-mail válidos são obrigatórios.' });
  if (db.users.some(item => item.id !== user.id && item.email.trim().toLowerCase() === normalizedEmail)) return res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
  if (normalizedPhone && db.users.some(item => item.id !== user.id && item.phone && normalizePhoneForLookup(item.phone) === normalizePhoneForLookup(normalizedPhone))) return res.status(409).json({ error: 'Este telefone já está associado a outra conta.' });
  if ((role !== undefined || status !== undefined) && !canManageUserFields) return res.status(403).json({ error: 'Somente administradores podem alterar papel ou status.' });
  if (role !== undefined && !canAssignUserRole(req.user, role)) return res.status(403).json({ error: 'Você não pode atribuir este nível de acesso.' });
  if (status !== undefined && !['ATIVO', 'PENDENTE', 'BLOQUEADO'].includes(status)) return res.status(400).json({ error: 'Status de usuário inválido.' });
  if (password !== undefined && String(password).trim() && String(password).trim().length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });

  user.name = normalizedName;
  user.email = normalizedEmail;
  user.phone = normalizedPhone;
  if (password && String(password).trim()) {
    user.password = await bcrypt.hash(String(password).trim(), 12);
  }

  if (canManageUserFields && role !== undefined) user.role = role;
  if (canManageUserFields && status !== undefined) user.status = status;

  user.updatedAt = new Date().toISOString();

  // If this user is also a driver, sync their name, email, and phone
  if (user.driverId) {
    const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
    if (driver) {
      if (name) driver.name = name;
      if (email) driver.email = email;
      if (phone) driver.phone = phone;
    }
  }

  db.addAuditLog({
    tenantId: user.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZAR_USUARIO',
    entity: 'User',
    entityId: user.id,
    details: `Usuário ${user.name} atualizado com sucesso`
  });

  if (status && status !== previousUserStatus) {
    const tenantAdmins = user.tenantId ? db.users.filter(item => item.tenantId === user.tenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(item.role)) : [];
    void dispatchConfiguredNotification('USUARIO_STATUS_ATUALIZADO', [user, ...tenantAdmins], {
      nome: user.name,
      empresa: user.tenantId ? (db.tenants.find(tenant => tenant.id === user.tenantId)?.name || '') : 'Elo Log',
      status: user.status,
      email: user.email,
      telefone: user.phone,
      tenantId: user.tenantId || undefined,
      link: process.env.APP_URL || ''
    });
  }
  res.json(sanitizeUser(user));
});

apiRouter.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Somente administradores reais podem desativar usuários.' });
  const targetUser = db.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (req.user?.id === targetUser.id) return res.status(400).json({ error: 'Não é possível desativar seu próprio usuário logado' });
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isSameTenantAdmin = (req.user?.role === 'ADMIN' || req.user?.role === 'EMPRESA_SUPER_ADMIN') && req.user?.tenantId === targetUser.tenantId;
  if (!isSuperAdmin && !isSameTenantAdmin) return res.status(403).json({ error: 'Você não tem permissão para desativar este usuário' });
  targetUser.status = 'BLOQUEADO';
  targetUser.readOnly = true;
  targetUser.updatedAt = new Date().toISOString();
  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'BLOQUEAR_USUARIO',
    entity: 'User',
    entityId: targetUser.id,
    details: `Usuário ${targetUser.name} (${targetUser.email}) bloqueado sem apagar cadastro ou auditoria.`
  });
  await db.persistNow();
  res.json({ success: true, message: 'Usuário bloqueado; cadastro e histórico preservados.' });
});

// Update own profile
apiRouter.put('/auth/profile', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const { name, email, phone, password } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (password && password.trim()) {
    user.password = await bcrypt.hash(password.trim(), 10);
  }

  user.updatedAt = new Date().toISOString();

  db.addAuditLog({
    tenantId: user.tenantId || undefined,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'UPDATE_PROFILE',
    entity: 'User',
    entityId: user.id,
    details: `Usuário atualizou o próprio perfil ${password && password.trim() ? '(incluindo alteração de senha)' : ''}`
  });

  // If driver, sync driver info
  let updatedDriver: Driver | undefined;
  if (user.driverId) {
    const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
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
    tenantId: user.tenantId || undefined,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'ATUALIZAR_PERFIL',
    entity: 'User',
    entityId: user.id,
    details: `Perfil de usuário atualizado pelo próprio titular`
  });

  res.json({
    success: true,
    user: sanitizeUser(user),
    driver: updatedDriver
  });
});

/* =========================================================================
   4. DRIVERS & VEHICLES MANAGEMENT
   ========================================================================= */

// Register a global driver from an authenticated company administration.
// The identity is global; only the company relationship is tenant-scoped.
apiRouter.post('/drivers/register', async (req: AuthenticatedRequest, res: Response) => {
  const allowedRoles = ['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'];
  if (!req.user || !allowedRoles.includes(req.user.role) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas administradores reais podem cadastrar motorista.' });
  const targetTenantId = req.user.role === 'SUPER_ADMIN' ? String(req.body?.tenantId || '') : String(req.user.tenantId || '');
  if (!targetTenantId || !db.tenants.some(tenant => tenant.id === targetTenantId)) return res.status(400).json({ error: 'Empresa de vínculo não identificada.' });
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const phone = String(req.body?.phone || '').trim();
  const cpf = String(req.body?.cpf || '').trim();
  const cnh = String(req.body?.cnh || '').trim();
  if (name.length < 5 || !email || normalizePhoneForLookup(phone).length < 10 || !cpf || !cnh) return res.status(400).json({ error: 'Preencha nome, e-mail, telefone, CPF e CNH.' });
  const cleanPhone = normalizePhoneForLookup(phone);
  const cleanEmail = email.toLowerCase();
  const cleanCpf = normalizePublicIdentity(cpf);
  const cleanCnh = normalizePublicIdentity(cnh);
  const duplicateUser = db.users.find(user => user.email?.trim().toLowerCase() === cleanEmail || normalizePhoneForLookup(user.phone) === cleanPhone);
  const duplicateDriver = db.drivers.find(driver => normalizePublicIdentity(driver.cpf) === cleanCpf || normalizePublicIdentity(driver.cnh) === cleanCnh);
  const plate = String(req.body?.vehiclePlate || '').trim().toUpperCase();
  const duplicatePlate = plate && db.vehicles.some(vehicle => normalizePublicPlate(vehicle.plate) === normalizePublicPlate(plate));
  if (duplicateUser) return res.status(409).json({ error: 'E-mail ou telefone já está associado a outro cadastro.' });
  if (duplicateDriver) return res.status(409).json({ error: 'CPF ou CNH já está associado a outro motorista.' });
  if (duplicatePlate) return res.status(409).json({ error: 'A placa já está associada a outro veículo.' });
  const now = new Date().toISOString();
  const userId = `user-driver-${Date.now()}`;
  const driverId = `driver-${Date.now()}`;
  const vehicleId = `vehicle-${Date.now()}`;
  const newUser: User = { id: userId, tenantId: null, name, email, phone, role: 'MOTORISTA', status: 'ATIVO', accountType: 'REAL', readOnly: false, driverId, lastLoginAt: null, createdAt: now };
  const newDriver: Driver = { id: driverId, userId, tenantId: null, name, cpf, rg: String(req.body?.rg || ''), birthDate: String(req.body?.birthDate || ''), phone, email, zipCode: String(req.body?.zipCode || ''), address: String(req.body?.address || ''), city: String(req.body?.city || ''), state: String(req.body?.state || '').toUpperCase(), cnh, cnhCategory: String(req.body?.cnhCategory || 'B') as Driver['cnhCategory'], cnhExpiresAt: String(req.body?.cnhExpiresAt || ''), status: 'DISPONIVEL', rating: 0, completedTrips: 0, vehiclesCount: 1, createdAt: now };
  const newVehicle: Vehicle = { id: vehicleId, driverId, tenantId: null, type: String(req.body?.vehicleType || 'TRUCK') as Vehicle['type'], brand: String(req.body?.vehicleBrand || ''), model: String(req.body?.vehicleModel || ''), year: Number(req.body?.vehicleYear || new Date().getFullYear()), plate, renavam: String(req.body?.vehicleRenavam || ''), capacityKg: Number(req.body?.capacityKg || 0), bodyType: String(req.body?.bodyType || 'BAU') as Vehicle['bodyType'], status: 'ATIVO', createdAt: now };
  db.users.push(newUser);
  db.drivers.push(newDriver);
  db.vehicles.push(newVehicle);
  db.upsertDriverCompanyLink({ driverId, tenantId: targetTenantId, status: 'APROVADO', scope: 'EMPRESA', source: 'COMPANY_ADMIN_REGISTRATION', approvedAt: now, approvedByUserId: req.user.id });
  db.addAuditLog({ tenantId: targetTenantId, userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'CADASTRO_MOTORISTA', entity: 'Driver', entityId: driverId, details: `Motorista global cadastrado e aprovado para a empresa ${targetTenantId}.` });
  void dispatchConfiguredNotification('MOTORISTA_CADASTRADO', [newUser, ...db.users.filter(user => user.tenantId === targetTenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(user.role))], { nome: name, empresa: db.tenants.find(tenant => tenant.id === targetTenantId)?.name || '', status: newUser.status, link: process.env.APP_URL || '' });
  await db.persistNow();
  return res.status(201).json({ user: sanitizeUser(newUser), driver: newDriver, vehicle: newVehicle });
});

apiRouter.get('/drivers', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.drivers.map(sanitizeDriver));
  }
  // Scoped by independent company link; a driver may belong to many companies.
  const drivers = db.drivers.filter(d => req.user?.tenantId ? db.hasDriverCompanyAccess(d.id, req.user.tenantId, true) : false);
  res.json(drivers.map(sanitizeDriver));
});

apiRouter.put('/drivers/:id', (req: AuthenticatedRequest, res: Response) => {
  const driver = db.drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Motorista não encontrado' });

  const isSelfDriver = req.user?.role === 'MOTORISTA' && (driver.userId === req.user.id || driver.id === req.user.driverId);
  const isCompanyAdmin = req.user?.role === 'SUPER_ADMIN' || (Boolean(req.user?.tenantId) && TENANT_ADMIN_ROLES.includes(req.user!.role) && db.hasDriverCompanyAccess(driver.id, req.user!.tenantId!, true));
  if (!isSelfDriver && !isCompanyAdmin) return res.status(403).json({ error: 'Apenas o próprio motorista ou um administrador da empresa pode editar este cadastro.' });

  const body = req.body || {};
  const text = (value: unknown, fallback: string, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
  if (body.name !== undefined) driver.name = text(body.name, driver.name, 160);
  if (body.phone !== undefined) driver.phone = text(body.phone, driver.phone, 30);
  if (body.zipCode !== undefined) driver.zipCode = text(body.zipCode, driver.zipCode, 20);
  if (body.address !== undefined) driver.address = text(body.address, driver.address, 300);
  if (body.city !== undefined) driver.city = text(body.city, driver.city, 120);
  if (body.state !== undefined) driver.state = text(body.state, driver.state, 2).toUpperCase();
  if (isCompanyAdmin) {
    if (body.cpf !== undefined) driver.cpf = text(body.cpf, driver.cpf, 30);
    if (body.rg !== undefined) driver.rg = text(body.rg, driver.rg, 30);
    if (body.birthDate !== undefined) driver.birthDate = text(body.birthDate, driver.birthDate, 32);
    if (body.cnh !== undefined) driver.cnh = text(body.cnh, driver.cnh, 30);
    if (body.cnhCategory !== undefined) driver.cnhCategory = text(body.cnhCategory, driver.cnhCategory, 2) as Driver['cnhCategory'];
    if (body.cnhExpiresAt !== undefined) driver.cnhExpiresAt = text(body.cnhExpiresAt, driver.cnhExpiresAt, 32);
    if (body.status !== undefined && ['DISPONIVEL', 'EM_VIAGEM', 'INATIVO', 'PENDENTE'].includes(body.status)) driver.status = body.status;
  }

  db.addAuditLog({
    tenantId: driver.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZAR_MOTORISTA',
    entity: 'Driver',
    entityId: driver.id,
    details: `Motorista ${driver.name} atualizado`
  });

  res.json(sanitizeDriver(driver));
});

apiRouter.get('/vehicles', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') return res.json(db.vehicles);
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.json([]);
  const vehicles = db.vehicles.filter(vehicle => vehicle.tenantId === tenantId || (vehicle.tenantId === null && db.hasDriverCompanyAccess(vehicle.driverId, tenantId, true)));
  res.json(vehicles);
});

apiRouter.get('/company-vehicles', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') return res.json(db.companyVehicles.map(vehicle => ({ ...vehicle, tenantName: db.tenants.find(t => t.id === vehicle.tenantId)?.name })));
  if (!req.user?.tenantId) return res.status(403).json({ error: 'Empresa não identificada.' });
  res.json(db.companyVehicles.filter(vehicle => vehicle.tenantId === req.user?.tenantId));
});
apiRouter.post('/company-vehicles', (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas administradores reais podem cadastrar veículos próprios.' });
  const tenantId = req.user?.role === 'SUPER_ADMIN' ? String(req.body?.tenantId || '') : req.user?.tenantId || '';
  if (!tenantId) return res.status(400).json({ error: 'Empresa obrigatória para cadastrar veículo próprio.' });
  const body = req.body || {};
  const plate = normalizePublicPlate(body.plate);
  const renavam = normalizePublicIdentity(body.renavam);
  if (!plate || !renavam || !body.brand || !body.model || !body.type || !body.bodyType) return res.status(400).json({ error: 'Placa, RENAVAM, tipo, carroceria, marca e modelo são obrigatórios.' });
  if (db.companyVehicles.some(vehicle => normalizePublicPlate(vehicle.plate) === plate || normalizePublicIdentity(vehicle.renavam) === renavam)) return res.status(409).json({ error: 'Já existe veículo próprio com esta placa ou RENAVAM.' });
  const now = new Date().toISOString();
  const vehicle: CompanyVehicle = { id: `company-vehicle-${Date.now()}`, tenantId, type: body.type, brand: String(body.brand).trim(), model: String(body.model).trim(), year: Number(body.year || new Date().getFullYear()), plate: String(body.plate).trim().toUpperCase(), renavam: String(body.renavam).trim(), capacityKg: Number(body.capacityKg || 0), bodyType: body.bodyType, ownerName: String(body.ownerName || '').trim(), ownerCnpj: String(body.ownerCnpj || '').trim(), registrationState: String(body.registrationState || '').trim().toUpperCase(), crlvNumber: String(body.crlvNumber || '').trim(), status: 'ATIVO', notes: String(body.notes || '').trim(), createdAt: now, updatedAt: now };
  db.companyVehicles.unshift(vehicle);
  db.addAuditLog({ tenantId, userId: req.user?.id || 'system', userName: req.user?.name || 'Sistema', userRole: req.user?.role || 'ADMIN', action: 'CRIAR_VEICULO_PROPRIO', entity: 'CompanyVehicle', entityId: vehicle.id, details: `Veículo próprio ${vehicle.plate} cadastrado para documentos e operações da empresa.` });
  res.status(201).json(vehicle);
});
apiRouter.put('/company-vehicles/:id', (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas administradores reais podem editar veículos próprios.' });
  const vehicle = db.companyVehicles.find(item => item.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Veículo próprio não encontrado.' });
  if (req.user?.role !== 'SUPER_ADMIN' && vehicle.tenantId !== req.user?.tenantId) return res.status(403).json({ error: 'Este veículo pertence a outra empresa.' });
  const body = req.body || {};
  const nextPlate = normalizePublicPlate(body.plate || vehicle.plate);
  const nextRenavam = normalizePublicIdentity(body.renavam || vehicle.renavam);
  if (db.companyVehicles.some(item => item.id !== vehicle.id && (normalizePublicPlate(item.plate) === nextPlate || normalizePublicIdentity(item.renavam) === nextRenavam))) return res.status(409).json({ error: 'Já existe outro veículo próprio com esta placa ou RENAVAM.' });
  const allowed = ['type', 'brand', 'model', 'year', 'plate', 'renavam', 'capacityKg', 'bodyType', 'ownerName', 'ownerCnpj', 'registrationState', 'crlvNumber', 'status', 'notes'];
  for (const key of allowed) if (body[key] !== undefined) (vehicle as any)[key] = key === 'plate' ? String(body[key]).trim().toUpperCase() : body[key];
  vehicle.updatedAt = new Date().toISOString();
  res.json(vehicle);
});
apiRouter.delete('/company-vehicles/:id', (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas administradores reais podem desativar veículos próprios.' });
  const vehicle = db.companyVehicles.find(item => item.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Veículo próprio não encontrado.' });
  if (req.user?.role !== 'SUPER_ADMIN' && vehicle.tenantId !== req.user?.tenantId) return res.status(403).json({ error: 'Este veículo pertence a outra empresa.' });
  vehicle.status = 'INATIVO'; vehicle.updatedAt = new Date().toISOString();
  db.addAuditLog({ tenantId: vehicle.tenantId, userId: req.user?.id || 'system', userName: req.user?.name || 'Sistema', userRole: req.user?.role || 'ADMIN', action: 'DESATIVAR_VEICULO_PROPRIO', entity: 'CompanyVehicle', entityId: vehicle.id, details: `Veículo próprio ${vehicle.plate} desativado sem apagar histórico.` });
  res.json({ success: true, message: 'Veículo próprio desativado; histórico preservado.' });
});
/* =========================================================================
   5. FREIGHTS MANAGEMENT (CRUD, Filter, Concurrency Acceptance, State Machine)
   ========================================================================= */

// List freights with tenant isolation & driver eligibility filters
apiRouter.get('/freights', (req: AuthenticatedRequest, res: Response) => {
  const { status, originCity, destinationCity, vehicleType, onlyMine } = req.query;

  let list = db.freights;

  // Tenant scoping:
  // - SUPER_ADMIN sees all
  // - MOTORISTA sees published/disponível freights within tenant network + freights assigned to them
  // - Company users (EMPRESA_SUPER_ADMIN, ADMIN, etc.) see their own tenant freights
  if (req.user?.role === 'SUPER_ADMIN') {
    // all
  } else if (req.user?.role === 'MOTORISTA') {
    const driverId = req.user.driverId;
    if (onlyMine === 'true') {
      list = list.filter(f => f.assignedDriverId === driverId);
    } else {
      // Driver sees:
      // 1. All DISPONIVEL or PUBLICADO freights for their tenant (or network)
      // 2. Freights assigned to them
      list = list.filter(f =>
        (db.hasDriverCompanyAccess(driverId || '', f.tenantId, false, f.id) && ['DISPONIVEL', 'PUBLICADO'].includes(f.status)) ||
        f.assignedDriverId === driverId
      );
    }
  } else {
    // Company staff
    list = list.filter(f => f.tenantId === req.user?.tenantId);
  }

  // Filters
  if (status) {
    list = list.filter(f => f.status === status);
  }
  if (originCity) {
    list = list.filter(f => f.origin.city.toLowerCase().includes((originCity as string).toLowerCase()));
  }
  if (destinationCity) {
    list = list.filter(f => f.destination.city.toLowerCase().includes((destinationCity as string).toLowerCase()));
  }
  if (vehicleType) {
    list = list.filter(f => f.requirements.vehicleType === vehicleType);
  }

  // Sort newest first
  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(req.user?.role === 'MOTORISTA' ? list.map(freight => redactDriverFreightPayment(freight, req.user?.driverId)) : list);
});

// Get Freight by ID
apiRouter.get('/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(f => f.id === req.params.id);
  if (!freight) {
    return res.status(404).json({ error: 'Frete não encontrado' });
  }

  // Security check: ensure tenant match
  if (req.user?.role !== 'SUPER_ADMIN' && (req.user?.role === 'MOTORISTA' ? (!req.user.driverId || !db.hasDriverCompanyAccess(req.user.driverId, freight.tenantId, false, freight.id)) : req.user?.tenantId !== freight.tenantId)) {
    return res.status(403).json({ error: 'Acesso não autorizado a este frete' });
  }

  // Motoristas podem consultar apenas as próprias respostas do frete; a empresa consulta o conjunto do próprio tenant.
  const formResponses = db.formResponses.filter(response =>
    response.freightId === freight.id &&
    (req.user?.role !== 'MOTORISTA' || response.filledByUserId === req.user.id || response.driverId === req.user.driverId)
  );
  const safeFreight = req.user?.role === 'MOTORISTA' ? redactDriverFreightPayment(freight, req.user.driverId) : freight;

  res.json({
    ...safeFreight,
    companyVehicle: freight.companyVehicleId ? db.companyVehicles.find(vehicle => vehicle.id === freight.companyVehicleId) : undefined,
    formResponses
  });
});

// Create new Freight
apiRouter.post('/freights', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'MOTORISTA') {
    return res.status(403).json({ error: 'Motoristas não possuem permissão para cadastrar fretes' });
  }

  const tenantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.tenantId || null) : req.user?.tenantId;
  const tenant = db.tenants.find(t => t.id === tenantId);

  if (tenant) {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const tenantFreightsThisMonth = db.freights.filter(f =>
      f.tenantId === tenant.id && f.createdAt.startsWith(currentMonth)
    ).length;

    const maxLimit = tenant.planLimits?.maxFreightsMonthly || 0;
    if (tenantFreightsThisMonth >= maxLimit) {
      return res.status(403).json({
        error: 'Limite de fretes mensais atingido para o plano atual (' + maxLimit + '). Faça o upgrade para continuar cadastrando.'
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

  if (!origin?.city || !origin?.state || !destination?.city || !destination?.state || !payment?.price) {
    return res.status(400).json({ error: 'Origem, destino e valor são obrigatórios' });
  }

  if (companyVehicleId && !db.companyVehicles.some(vehicle => vehicle.id === companyVehicleId && vehicle.tenantId === tenantId && vehicle.status === 'ATIVO')) return res.status(400).json({ error: 'Veículo próprio selecionado não pertence à empresa ou está inativo.' });
  if (req.body.operationType !== undefined && !['CARGA_GERAL', 'LOGISTICA_VEICULOS'].includes(req.body.operationType)) return res.status(400).json({ error: 'Tipo de operação inválido.' });
  const safeOperationType = req.body.operationType === 'LOGISTICA_VEICULOS' ? 'LOGISTICA_VEICULOS' : 'CARGA_GERAL';
  const safePublicListing = Boolean(publicListingEnabled) && safeOperationType === 'CARGA_GERAL';
  const initialStatus: FreightStatus = publishImmediately ? 'DISPONIVEL' : 'RASCUNHO';
  const now = new Date().toISOString();
  const nextSeq = db.freights.length + 1;
  const code = `FRT-2026-${String(nextSeq).padStart(4, '0')}`;

  const newFreight: Freight = {
    id: `freight-${Date.now()}`,
    code,
    tenantId: tenantId!,
    tenantName: tenant?.name || 'Transportadora',
    operationType: safeOperationType,
    origin: {
      zipCode: origin.zipCode || '15000-000',
      address: origin.address || 'Endereço de Coleta',
      number: origin.number || 'S/N',
      neighborhood: origin.neighborhood || 'Industrial',
      city: origin.city,
      state: origin.state,
      date: origin.date || new Date().toISOString().split('T')[0],
      timeWindow: origin.timeWindow || '08:00 às 17:00',
      contactName: origin.contactName,
      contactPhone: origin.contactPhone
    },
    destination: {
      zipCode: destination.zipCode || '01000-000',
      address: destination.address || 'Endereço de Entrega',
      number: destination.number || 'S/N',
      neighborhood: destination.neighborhood || 'Comercial',
      city: destination.city,
      state: destination.state,
      date: destination.date || new Date().toISOString().split('T')[0],
      timeWindow: destination.timeWindow || '08:00 às 18:00',
      contactName: destination.contactName,
      contactPhone: destination.contactPhone
    },
    distanceKm: Number(distanceKm) || 450,
    cargo: {
      description: cargo?.description || 'Carga geral',
      type: cargo?.type || 'GERAL',
      weightKg: Number(cargo?.weightKg) || 8000,
      volumeCount: Number(cargo?.volumeCount) || 10,
      dimensions: cargo?.dimensions,
      requiresInsurance: cargo?.requiresInsurance ?? true,
      notes: cargo?.notes
    },
    requirements: {
      vehicleType: requirements?.vehicleType || 'TRUCK',
      bodyTypeRequired: requirements?.bodyTypeRequired || 'BAU',
      minCapacityKg: Number(requirements?.minCapacityKg) || 8000,
      helperRequired: requirements?.helperRequired || false,
      trackerRequired: requirements?.trackerRequired ?? true,
      cnhMinCategory: requirements?.cnhMinCategory || 'C'
    },
    payment: {
      price: Number(payment.price),
      paymentMethod: payment.paymentMethod || 'PIX',
      tollIncluded: payment.tollIncluded ?? true,
      advancePercentage: payment.advancePercentage || 70,
      notes: payment.notes
    },
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        changedByUserId: req.user!.id,
        changedByName: req.user!.name,
        notes: publishImmediately ? 'Frete criado e publicado imediatamente' : 'Rascunho criado'
      }
    ],
    createdByUserId: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now,
    customData,
    companyVehicleId: companyVehicleId || undefined,
    publicListingEnabled: safePublicListing,
    publicPriceVisibleToRegistered: safePublicListing && publicPriceVisibleToRegistered !== false,
    publicInterestEnabled: safePublicListing && publicInterestEnabled !== false,
    publicPublishedAt: safePublicListing && publishImmediately ? now : undefined
  };

  db.freights.unshift(newFreight);

  db.addAuditLog({
    tenantId: tenantId || undefined,
    tenantName: tenant?.name,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: publishImmediately ? 'CRIACAO_E_PUBLICACAO_FRETE' : 'CRIACAO_RASCUNHO_FRETE',
    entity: 'Freight',
    entityId: newFreight.id,
    details: `Criou frete ${newFreight.code}: ${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} por R$ ${newFreight.payment.price.toFixed(2)}`
  });

  // If published, notify matching drivers in tenant
  if (publishImmediately) {
    const eligibleDrivers = db.drivers.filter(d => d.tenantId === tenantId);
    eligibleDrivers.forEach(d => {
      db.addNotification({
        tenantId,
        userId: d.userId,
        freightId: newFreight.id,
        type: 'FRETE_DISPONIVEL',
        title: '🚚 Novo frete disponível!',
        message: `${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    });

    const driverUsers = eligibleDrivers
      .map(driver => db.users.find(user => user.id === driver.userId))
      .filter((user): user is User => Boolean(user));
    void dispatchConfiguredNotification('FRETE_PUBLICADO', driverUsers, {
      codigoFrete: newFreight.code,
      origem: `${newFreight.origin.city}/${newFreight.origin.state}`,
      destino: `${newFreight.destination.city}/${newFreight.destination.state}`,
      valor: `R$ ${newFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      empresa: newFreight.tenantName,
      tenantId: newFreight.tenantId,
      freightId: newFreight.id,
      link: process.env.APP_URL || ''
    });
    sendPushNotificationToAll({
      title: '🚚 Novo Frete Disponível na Elo Log!',
      body: `${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      url: '/'
    }).catch(console.error);
  }

  res.status(201).json(newFreight);
});

// Update freight details (only while in draft or available)
apiRouter.put('/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(f => f.id === req.params.id);
  if (!freight) return res.status(404).json({ error: 'Frete não encontrado' });

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este frete pertence a outra empresa.' });
  }

  if (['RESERVADO', 'EM_COLETA', 'COLETADO', 'EM_TRANSITO', 'ENTREGUE', 'FINALIZADO'].includes(freight.status)) {
    return res.status(400).json({ error: 'Não é possível editar frete que já foi reservado ou iniciado' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};
  const nextCompanyVehicleId = body.companyVehicleId !== undefined ? (body.companyVehicleId ? String(body.companyVehicleId) : undefined) : freight.companyVehicleId;
  if (nextCompanyVehicleId && !db.companyVehicles.some(vehicle => vehicle.id === nextCompanyVehicleId && vehicle.tenantId === freight.tenantId && vehicle.status === 'ATIVO')) return res.status(400).json({ error: 'Veículo próprio selecionado não pertence à empresa ou está inativo.' });
  const nextOperationType = body.operationType !== undefined ? body.operationType : (freight.operationType || 'CARGA_GERAL');
  if (!['CARGA_GERAL', 'LOGISTICA_VEICULOS'].includes(nextOperationType)) return res.status(400).json({ error: 'Tipo de operação inválido.' });
  const requestedStatus = body.status !== undefined ? body.status : (body.publishImmediately === true && freight.status === 'RASCUNHO' ? 'DISPONIVEL' : freight.status);
  const nextStatus = requestedStatus as FreightStatus;
  if (nextStatus !== freight.status && !(VALID_STATUS_TRANSITIONS[freight.status] || []).includes(nextStatus)) return res.status(400).json({ error: 'Transição de status inválida. Use o endpoint específico de status para esta operação.' });

  const text = (value: unknown, fallback: string, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
  const finiteNumber = (value: unknown, fallback: number, min = 0, max = 1000000000) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const updateLocation = (current: Freight['origin'], incoming: any): Freight['origin'] => {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return current;
    return {
      ...current,
      zipCode: text(incoming.zipCode, current.zipCode, 20), address: text(incoming.address, current.address, 300),
      number: text(incoming.number, current.number, 30), neighborhood: text(incoming.neighborhood, current.neighborhood || '', 160),
      city: text(incoming.city, current.city, 120), state: text(incoming.state, current.state, 2).toUpperCase(),
      date: text(incoming.date, current.date, 32), timeWindow: text(incoming.timeWindow, current.timeWindow || '', 100),
      contactName: text(incoming.contactName, current.contactName || '', 160), contactPhone: text(incoming.contactPhone, current.contactPhone || '', 30)
    };
  };
  const updatedAt = new Date().toISOString();
  if (body.origin !== undefined) freight.origin = updateLocation(freight.origin, body.origin);
  if (body.destination !== undefined) freight.destination = updateLocation(freight.destination, body.destination);
  if (body.distanceKm !== undefined) freight.distanceKm = finiteNumber(body.distanceKm, freight.distanceKm, 0, 10000000);
  if (body.cargo && typeof body.cargo === 'object' && !Array.isArray(body.cargo)) freight.cargo = {
    ...freight.cargo,
    description: text(body.cargo.description, freight.cargo.description, 500), type: text(body.cargo.type, freight.cargo.type, 80) as Freight['cargo']['type'],
    weightKg: finiteNumber(body.cargo.weightKg, freight.cargo.weightKg), volumeCount: finiteNumber(body.cargo.volumeCount, freight.cargo.volumeCount),
    dimensions: text(body.cargo.dimensions, freight.cargo.dimensions || '', 200), requiresInsurance: body.cargo.requiresInsurance === undefined ? freight.cargo.requiresInsurance : Boolean(body.cargo.requiresInsurance),
    notes: text(body.cargo.notes, freight.cargo.notes || '', 1000), vehicleProduct: text(body.cargo.vehicleProduct, freight.cargo.vehicleProduct || '', 300),
    chassis: text(body.cargo.chassis, freight.cargo.chassis || '', 100), nfVehicleSale: text(body.cargo.nfVehicleSale, freight.cargo.nfVehicleSale || '', 100),
    nfFacchini: text(body.cargo.nfFacchini, freight.cargo.nfFacchini || '', 100), trackerStatus: text(body.cargo.trackerStatus, freight.cargo.trackerStatus || '', 100), platesStatus: text(body.cargo.platesStatus, freight.cargo.platesStatus || '', 100)
  };
  if (body.requirements && typeof body.requirements === 'object' && !Array.isArray(body.requirements)) freight.requirements = {
    ...freight.requirements,
    vehicleType: text(body.requirements.vehicleType, freight.requirements.vehicleType, 80) as Freight['requirements']['vehicleType'],
    vehicleBrand: text(body.requirements.vehicleBrand, freight.requirements.vehicleBrand || '', 120), bodyTypeRequired: text(body.requirements.bodyTypeRequired, freight.requirements.bodyTypeRequired || '', 80) as Freight['requirements']['bodyTypeRequired'],
    minCapacityKg: finiteNumber(body.requirements.minCapacityKg, freight.requirements.minCapacityKg), helperRequired: body.requirements.helperRequired === undefined ? freight.requirements.helperRequired : Boolean(body.requirements.helperRequired),
    trackerRequired: body.requirements.trackerRequired === undefined ? freight.requirements.trackerRequired : Boolean(body.requirements.trackerRequired), cnhMinCategory: text(body.requirements.cnhMinCategory, freight.requirements.cnhMinCategory || '', 1) as Freight['requirements']['cnhMinCategory']
  };
  if (body.payment && typeof body.payment === 'object' && !Array.isArray(body.payment)) freight.payment = {
    ...freight.payment,
    price: finiteNumber(body.payment.price, freight.payment.price), clientRevenue: body.payment.clientRevenue === undefined ? freight.payment.clientRevenue : finiteNumber(body.payment.clientRevenue, 0),
    driverCost: body.payment.driverCost === undefined ? freight.payment.driverCost : finiteNumber(body.payment.driverCost, 0), paymentMethod: text(body.payment.paymentMethod, freight.payment.paymentMethod, 50) as Freight['payment']['paymentMethod'],
    tollIncluded: body.payment.tollIncluded === undefined ? freight.payment.tollIncluded : Boolean(body.payment.tollIncluded), advancePercentage: body.payment.advancePercentage === undefined ? freight.payment.advancePercentage : finiteNumber(body.payment.advancePercentage, 0, 0, 100),
    notes: text(body.payment.notes, freight.payment.notes || '', 1000)
  };
  if (body.customData !== undefined && body.customData && typeof body.customData === 'object' && !Array.isArray(body.customData)) {
    const serializedCustomData = JSON.stringify(body.customData);
    if (serializedCustomData.length > 50000) return res.status(400).json({ error: 'Dados adicionais excedem o limite permitido.' });
    freight.customData = body.customData;
  }
  freight.operationType = nextOperationType;
  freight.companyVehicleId = nextCompanyVehicleId;
  freight.updatedAt = updatedAt;
  if (nextStatus !== freight.status) {
    const previousStatus = freight.status;
    freight.status = nextStatus;
    freight.statusHistory.push({ status: nextStatus, timestamp: updatedAt, changedByUserId: req.user!.id, changedByName: req.user!.name, notes: text(body.statusNotes, `Status atualizado de ${previousStatus} para ${nextStatus}`, 500) });
  }
  if (nextOperationType === 'LOGISTICA_VEICULOS' || !['DISPONIVEL', 'PUBLICADO'].includes(nextStatus)) {
    freight.publicListingEnabled = false;
    freight.publicInterestEnabled = false;
    freight.publicPriceVisibleToRegistered = false;
    freight.publicPublishedAt = undefined;
  } else {
    freight.publicListingEnabled = body.publicListingEnabled === undefined ? freight.publicListingEnabled : Boolean(body.publicListingEnabled);
    freight.publicInterestEnabled = freight.publicListingEnabled && (body.publicInterestEnabled === undefined ? freight.publicInterestEnabled !== false : Boolean(body.publicInterestEnabled));
    freight.publicPriceVisibleToRegistered = freight.publicListingEnabled && (body.publicPriceVisibleToRegistered === undefined ? freight.publicPriceVisibleToRegistered !== false : Boolean(body.publicPriceVisibleToRegistered));
    if (freight.publicListingEnabled && !freight.publicPublishedAt) freight.publicPublishedAt = updatedAt;
  }

  db.addAuditLog({
    tenantId: freight.tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'EDICAO_FRETE',
    entity: 'Freight',
    entityId: freight.id,
    details: `Editou dados do frete ${freight.code}`
  });

  res.json(freight);
});

/* =========================================================================
   6. ATOMIC FREIGHT ACCEPTANCE (CONCURRENCY LOCK & GUARANTEE)
   ========================================================================= */

apiRouter.post('/freights/:id/accept', async (req: AuthenticatedRequest, res: Response) => {
  const freightId = req.params.id;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (user.role !== 'MOTORISTA') {
    return res.status(403).json({ error: 'Apenas usuários com perfil Motorista podem aceitar fretes' });
  }

  const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
  if (!driver) {
    return res.status(400).json({ error: 'Perfil de motorista não configurado para este usuário' });
  }

  const vehicle = db.vehicles.find(v => v.driverId === driver.id);

  // Acquire atomic lock on freightId to guarantee transactional concurrency
  const result = await db.withLock(`freight-accept-${freightId}`, async () => {
    const freight = db.freights.find(f => f.id === freightId);

    if (!freight) {
      return { success: false, status: 404, error: 'Frete não encontrado' };
    }

    // Strict state check: Must be DISPONIVEL or PUBLICADO
    if (freight.status !== 'DISPONIVEL' && freight.status !== 'PUBLICADO') {
      return {
        success: false,
        status: 409,
        error: `Frete indisponível para aceite. Status atual: ${freight.status}. Outro motorista pode ter aceitado primeiro.`
      };
    }

    if (user.driverId && !db.hasDriverCompanyAccess(user.driverId, freight.tenantId, false, freight.id)) {
      return { success: false, status: 403, error: 'A empresa ainda não aprovou este motorista para seus fretes.' };
    }
    if (freight.assignedDriverId) {
      return {
        success: false,
        status: 409,
        error: 'Este frete já foi reservado por outro motorista.'
      };
    }

    const now = new Date().toISOString();

    // Assign driver and update status to RESERVADO
    freight.status = 'RESERVADO';
    freight.assignedDriverId = driver.id;
    freight.assignedDriverName = driver.name;
    freight.assignedDriverPhone = driver.phone;
    freight.assignedVehiclePlate = vehicle?.plate || 'Não inf.';
    freight.assignedVehicleModel = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo padrão';
    freight.assignedAt = now;
    freight.updatedAt = now;

    freight.statusHistory.push({
      status: 'RESERVADO',
      timestamp: now,
      changedByUserId: user.id,
      changedByName: driver.name,
      notes: `Frete aceito e reservado pelo motorista ${driver.name} (Veículo: ${freight.assignedVehiclePlate})`
    });

    const companyAdmins = db.users.filter(u => u.tenantId === freight.tenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(u.role));
    void dispatchConfiguredNotification('FRETE_ACEITO', [...companyAdmins, user], {
      codigoFrete: freight.code,
      nomeMotorista: driver.name,
      empresa: freight.tenantName,
      status: freight.status,
      tenantId: freight.tenantId,
      freightId: freight.id,
      link: process.env.APP_URL || ''
    });
    // Audit Log
    db.addAuditLog({
      tenantId: freight.tenantId,
      tenantName: freight.tenantName,
      userId: user.id,
      userName: driver.name,
      userRole: 'MOTORISTA',
      action: 'ACEITE_FRETE_TRANSACIONAL',
      entity: 'Freight',
      entityId: freight.id,
      details: `Motorista ${driver.name} (CPF: ${driver.cpf}) aceitou e reservou o frete ${freight.code}`
    });

    return { success: true, freight };
  });

  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({
    message: 'Frete aceito com sucesso.',
    freight: result.freight
  });
});

/* =========================================================================
   7. STATE MACHINE TRANSITION (EM_COLETA, COLETADO, EM_TRANSITO, ENTREGUE, etc.)
   ========================================================================= */

apiRouter.post('/freights/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { newStatus, notes, location } = req.body as { newStatus: FreightStatus; notes?: string; location?: string };
  const freight = db.freights.find(f => f.id === req.params.id);

  if (!freight) {
    return res.status(404).json({ error: 'Frete não encontrado' });
  }

  // Security check: ensure authorized to update status (driver assigned or same company tenant)
  if (req.user?.role !== 'SUPER_ADMIN') {
    if (req.user?.role === 'MOTORISTA') {
      if (freight.assignedDriverId !== req.user.driverId) {
        return res.status(403).json({ error: 'Acesso não autorizado. Este frete não está atribuído a você.' });
      }
    } else if (freight.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Acesso não autorizado a este frete.' });
    }
  }

  const currentStatus = freight.status;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return res.status(400).json({
      error: `Transição inválida: Não é permitido mudar de '${currentStatus}' para '${newStatus}'. Transições permitidas: ${allowedTransitions.join(', ')}`
    });
  }

  const now = new Date().toISOString();
  freight.status = newStatus;
  freight.updatedAt = now;
  if (!['DISPONIVEL', 'PUBLICADO'].includes(newStatus)) {
    freight.publicListingEnabled = false;
    freight.publicInterestEnabled = false;
    freight.publicPriceVisibleToRegistered = false;
    freight.publicPublishedAt = undefined;
  }

  if (newStatus === 'EM_COLETA') freight.startedAt = now;
  if (newStatus === 'COLETADO') freight.collectedAt = now;
  if (newStatus === 'EM_TRANSITO') freight.inTransitAt = now;
  if (newStatus === 'ENTREGUE') freight.deliveredAt = now;
  if (newStatus === 'FINALIZADO') freight.completedAt = now;
  if (newStatus === 'CANCELADO') {
    freight.cancelledAt = now;
    freight.cancelReason = notes || 'Cancelado pelo operador';
  }

  freight.statusHistory.push({
    status: newStatus,
    timestamp: now,
    changedByUserId: req.user!.id,
    changedByName: req.user!.name,
    notes: notes || `Status atualizado para ${newStatus}`,
    location
  });

  const relevantUsers = [
    ...db.users.filter(user => user.tenantId === freight.tenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(user.role)),
    ...db.users.filter(user => user.driverId === freight.assignedDriverId),
    req.user!
  ];
  void dispatchConfiguredNotification('STATUS_ATUALIZADO', relevantUsers, {
    codigoFrete: freight.code,
    nomeMotorista: freight.assignedDriverName || req.user?.name || '',
    empresa: freight.tenantName,
    status: newStatus,
    tenantId: freight.tenantId,
    freightId: freight.id,
    link: process.env.APP_URL || ''
  });
  if (newStatus === 'CANCELADO') {
    void dispatchConfiguredNotification('FRETE_CANCELADO', relevantUsers, {
      codigoFrete: freight.code,
      empresa: freight.tenantName,
      motivo: notes || 'Cancelado pelo operador',
      status: newStatus,
      tenantId: freight.tenantId,
      freightId: freight.id,
      link: process.env.APP_URL || ''
    });
  }
  db.addAuditLog({
    tenantId: freight.tenantId,
    tenantName: freight.tenantName,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: `STATUS_${newStatus}`,
    entity: 'Freight',
    entityId: freight.id,
    details: `Transição de ${currentStatus} para ${newStatus}${location ? ` (Local: ${location})` : ''}`
  });

  res.json(freight);
});

/* =========================================================================
   8. DYNAMIC FORM BUILDER & FORM RESPONSES
   ========================================================================= */

// List forms for tenant
apiRouter.get('/forms', (req: AuthenticatedRequest, res: Response) => {
  const { triggerEvent } = req.query;
  let forms = db.forms;

  if (req.user?.role !== 'SUPER_ADMIN') {
    forms = forms.filter(f => f.tenantId === req.user?.tenantId);
  }

  if (triggerEvent) {
    forms = forms.filter(f => f.triggerEvent === triggerEvent && f.active);
  }

  res.json(forms);
});

// Create new form definition
apiRouter.post('/forms', (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: 'Somente administradores reais podem criar formulários.' });
  }

  const { title, description, category, triggerEvent, fields, tenantId } = req.body;
  const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? (tenantId || db.tenants[0].id) : req.user?.tenantId;

  if (!title || !fields || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'Título e campos do formulário são obrigatórios' });
  }

  const newForm: FormDefinition = {
    id: `form-${Date.now()}`,
    tenantId: targetTenantId!,
    title,
    description: description || '',
    category: category || 'CHECKLIST_COLETA',
    triggerEvent: triggerEvent || 'MANUAL',
    fields,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.forms.push(newForm);

  db.addAuditLog({
    tenantId: targetTenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CRIACAO_FORMULARIO',
    entity: 'FormDefinition',
    entityId: newForm.id,
    details: `Formulário '${newForm.title}' criado com ${newForm.fields.length} campos`
  });

  res.status(201).json(newForm);
});

// Submit or Update Form Response (Supports Saving Partial / Retirada / Final Entrega)
apiRouter.post('/forms/responses', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  const { responseId, formId, freightId, answers, stage, isDraft } = req.body || {};
  const form = db.forms.find(f => f.id === formId);

  if (!form) {
    return res.status(404).json({ error: 'Formulário não encontrado' });
  }
  if (req.user.role !== 'SUPER_ADMIN' && form.tenantId !== req.user.tenantId) return res.status(403).json({ error: 'Este formulário pertence a outra empresa.' });
  if (stage !== undefined && !['RETIRADA_INICIADA', 'FINALIZADO_ENTREGA', 'COMPLETO'].includes(stage)) return res.status(400).json({ error: 'Etapa de formulário inválida.' });
  if (answers !== undefined && (!answers || typeof answers !== 'object' || Array.isArray(answers) || JSON.stringify(answers).length > 100000)) return res.status(400).json({ error: 'Respostas inválidas ou acima do limite permitido.' });

  // Security check: ensure associated freight belongs to user's tenant or assigned driver
  if (freightId) {
    const freight = db.freights.find(f => f.id === freightId);
    if (!freight) return res.status(404).json({ error: 'Frete não encontrado.' });
    if (freight) {
      if (req.user?.role !== 'SUPER_ADMIN') {
        if (req.user?.role === 'MOTORISTA') {
          if (freight.assignedDriverId !== req.user.driverId) {
            return res.status(403).json({ error: 'Acesso não autorizado. Este frete não está atribuído a você.' });
          }
        } else if (freight.tenantId !== req.user?.tenantId) {
          return res.status(403).json({ error: 'Acesso não autorizado a este frete.' });
        }
      }
    }
  }

  // Check if updating an existing response by ID or by freightId + formId
  let existingResponse: FormResponse | undefined;
  if (responseId) {
    existingResponse = db.formResponses.find(r => r.id === String(responseId) && r.tenantId === form.tenantId);
  } else if (freightId && formId) {
    existingResponse = db.formResponses.find(r => r.freightId === freightId && r.formId === formId && r.tenantId === form.tenantId && (req.user?.role !== 'MOTORISTA' || r.filledByUserId === req.user.id || r.driverId === req.user.driverId));
  }
  if (existingResponse && req.user.role === 'MOTORISTA' && existingResponse.filledByUserId !== req.user.id && existingResponse.driverId !== req.user.driverId) return res.status(403).json({ error: 'Você só pode alterar suas próprias respostas.' });

  const now = new Date().toISOString();

  if (existingResponse) {
    // IMMUTABILITY RULE: If origin was already signed and saved, preserve origin answers and signature
    const prevAnswers = existingResponse.answers || {};
    const originAlreadySigned = Boolean(prevAnswers.origem?.assinado && prevAnswers.origem?.signatureImage);

    let updatedAnswers = {
      ...prevAnswers,
      ...(answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {})
    };

    if (originAlreadySigned) {
      // Keep locked origin fields strictly untouched
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

    // Update existing response
    existingResponse.answers = updatedAnswers;
    if (stage) existingResponse.stage = stage;
    if (isDraft !== undefined) existingResponse.isDraft = isDraft;
    existingResponse.updatedAt = now;

    db.addAuditLog({
      tenantId: form.tenantId,
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: isDraft ? 'RASCUNHO_FORMULARIO' : 'ATUALIZACAO_FORMULARIO',
      entity: 'FormResponse',
      entityId: existingResponse.id,
      details: `${isDraft ? 'Salvo rascunho de progresso' : 'Atualizado formulário'} '${form.title}' (Etapa: ${stage || 'Andamento'})${freightId ? ` para o frete #${freightId}` : ''}`
    });

    return res.json(existingResponse);
  }

  const newResponse: FormResponse = {
    id: `resp-${Date.now()}`,
    formId,
    formTitle: form.title,
    tenantId: form.tenantId,
    freightId,
    driverId: req.user?.driverId,
    filledByUserId: req.user!.id,
    filledByName: req.user!.name,
    stage: stage || (isDraft ? 'RETIRADA_INICIADA' : 'COMPLETO'),
    isDraft: isDraft || false,
    answers: answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {},
    createdAt: now,
    updatedAt: now
  };

  db.formResponses.push(newResponse);

  // Update freight response counter
  if (freightId) {
    const freight = db.freights.find(f => f.id === freightId);
    if (freight) {
      freight.formResponsesCount = (freight.formResponsesCount || 0) + 1;
    }
  }

  db.addAuditLog({
    tenantId: form.tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: isDraft ? 'RASCUNHO_FORMULARIO' : 'RESPOSTA_FORMULARIO',
    entity: 'FormResponse',
    entityId: newResponse.id,
    details: `${isDraft ? 'Iniciou e salvou etapa de retirada' : 'Respondeu e finalizou formulário'} '${form.title}'${freightId ? ` para o frete #${freightId}` : ''}`
  });

  res.status(201).json(newResponse);
});

function resolveWhatsAppConfig(tenantId?: string): WhatsAppConfig {
  const tenant = tenantId ? db.tenants.find(item => item.id === tenantId) : undefined;
  if (tenant?.notificationPlan === 'SAAS_FREE') return db.globalWhatsAppConfig;
  if (tenant?.notificationPlan === 'OWN_NUMBER' && tenant.notificationBillingStatus !== 'ACTIVE') return db.globalWhatsAppConfig;
  const tenantConfig = tenantId ? db.whatsappConfigs.get(tenantId) : undefined;
  // Persisted tenant configs may have a redacted/empty token after hydration when
  // no matching encrypted tenant secret exists. Never let that shadow the valid
  // global SaaS gateway used by Super Admin and SaaS-free tenants.
  if (tenantConfig?.token && tenantConfig.baseUrl) return tenantConfig;
  return db.globalWhatsAppConfig;
}

function normalizeWhatsAppTenantId(rawTenantId: unknown): string | undefined {
  if (typeof rawTenantId !== 'string') return undefined;
  const value = rawTenantId.trim();
  return value || undefined;
}

function canManageWhatsAppTenant(req: AuthenticatedRequest, tenantId?: string): boolean {
  if (!req.user) return false;
  if (req.user.role === 'SUPER_ADMIN') {
    return Boolean(tenantId && db.tenants.some(tenant => tenant.id === tenantId));
  }
  return Boolean(
    tenantId &&
    req.user.tenantId === tenantId &&
    ['ADMIN', 'EMPRESA_SUPER_ADMIN'].includes(req.user.role)
  );
}

function getWhatsAppScope(req: AuthenticatedRequest, rawTenantId?: unknown): { tenantId?: string; isGlobal: boolean } | null {
  const requestedTenantId = normalizeWhatsAppTenantId(rawTenantId);
  if (req.user?.role === 'SUPER_ADMIN' && !requestedTenantId) {
    return { isGlobal: true };
  }
  const tenantId = requestedTenantId || normalizeWhatsAppTenantId(req.user?.tenantId);
  if (!tenantId || !canManageWhatsAppTenant(req, tenantId)) return null;
  return { tenantId, isGlobal: false };
}

function safeWhatsAppConfig(config: WhatsAppConfig, scope: { tenantId?: string; isGlobal: boolean }) {
  return {
    ...config,
    token: '',
    tokenMasked: config.token ? '********' : '',
    tenantId: scope.tenantId || null,
    scope: scope.isGlobal ? 'GLOBAL' : 'TENANT'
  };
}

function isPrivateOrLocalHostname(rawHostname: string): boolean {
  const hostname = String(rawHostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname || ['localhost', 'localhost.localdomain', 'metadata.google.internal'].includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || !hostname.includes('.')) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    const octets = hostname.split('.').map(Number);
    if (octets.some(octet => octet > 255)) return true;
    const [first, second] = octets;
    return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  }
  if (hostname.includes(':')) return hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80') || hostname.startsWith('::ffff:127.') || hostname.startsWith('::ffff:10.') || hostname.startsWith('::ffff:192.168.');
  return false;
}

function validateWhatsAppBaseUrl(rawValue: string): string {
  const value = String(rawValue || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('A URL da API WhatsApp é inválida.');
  }
  const localDevelopment = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if (!localDevelopment && isPrivateOrLocalHostname(parsed.hostname)) throw new Error('A URL da API WhatsApp não pode apontar para rede local.');
  if (parsed.protocol !== 'https:' && !localDevelopment) {
    throw new Error('A URL da API WhatsApp deve usar HTTPS.');
  }
  return value;
}

function extractWhatsAppProviderField(data: any, fieldNames: string[]): string | null {
  const wanted = new Set(fieldNames.map(name => name.toLowerCase()));
  const queue: Array<{ value: any; depth: number }> = [{ value: data, depth: 0 }];
  const visited = new Set<any>();
  let inspected = 0;
  while (queue.length > 0 && inspected < 1000) {
    const current = queue.shift()!;
    inspected += 1;
    if (!current.value || typeof current.value !== 'object' || current.depth > 6 || visited.has(current.value)) continue;
    visited.add(current.value);
    for (const [key, value] of Object.entries(current.value)) {
      if (wanted.has(key.toLowerCase()) && typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object') queue.push({ value, depth: current.depth + 1 });
    }
  }
  return null;
}

function extractWhatsAppQrCode(data: any): string | null {
  return extractWhatsAppProviderField(data, ['QRCode', 'qrcode', 'qrCode']);
}

function extractWhatsAppPairingCode(data: any): string | null {
  return extractWhatsAppProviderField(data, ['pairingCode', 'pairing_code', 'pairingcode']);
}

function mapWhatsAppConnectionStatus(data: any): WhatsAppConnectionStatus {
  const normalized = JSON.stringify(data || {}).toLowerCase();
  if (data?.connected === true || data?.Connected === true || data?.isConnected === true || data?.status === 'connected' || data?.status === 'online') return 'CONNECTED';
  if (data?.connected === false || data?.Connected === false || data?.isConnected === false || /disconnected|offline|desconectad/.test(normalized)) return 'DISCONNECTED';
  if (extractWhatsAppPairingCode(data)) return 'PAIRING_CODE_AVAILABLE';
  if (extractWhatsAppQrCode(data) || /qrcode|qr_code|qr code|aguardando.*qr/.test(normalized)) return 'QR_AVAILABLE';
  return 'UNKNOWN';
}

async function callWhatsAppGateway(config: WhatsAppConfig, pathName: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data?: any }> {
  if (!config.baseUrl || !config.token) return { ok: false, status: 0 };
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl}${pathName}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper to format phone number for the Omnichannel Gateway API
function formatPhoneForWhatsApp(rawPhone: string): string {
  let cleaned = (rawPhone || '').replace(/\D/g, '');
  if (!cleaned) return '';
  // If Brazilian number without country code (10 or 11 digits), prepend 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

// Function to call the external WhatsApp API Gateway matching the Postman specification
async function sendToWhatsAppGateway(config: WhatsAppConfig, payload: {
  number: string;
  body: string;
  externalKey?: string;
  mediaUrl?: string;
  useButtonApi?: boolean;
  buttons?: Array<{ id: string; text: string }>;
}): Promise<{ success: boolean; data?: any; message: string; rawResponse?: any }> {
  const cleanNumber = formatPhoneForWhatsApp(payload.number);
  const extKey = payload.externalKey || `ext-${Date.now()}`;

  if (config.isActive === false) {
    return { success: false, message: 'A integração WhatsApp está desativada para esta empresa.' };
  }

  if (!config.baseUrl || !config.token) {
    const simulated = process.env.NODE_ENV !== 'production';
    return {
      success: simulated,
      message: simulated
        ? 'Notificação simulada fora da produção. Configure a URL e o token da API para envio real.'
        : 'API WhatsApp não configurada para envio em produção.',
      data: simulated ? { simulated: true, recipient: cleanNumber, externalKey: extKey } : undefined
    };
  }

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');

  let endpointUrl = cleanBaseUrl;
  let requestBody: any;

  if (payload.useButtonApi && payload.buttons && payload.buttons.length > 0) {
    endpointUrl = `${cleanBaseUrl}/apiplus`;
    requestBody = {
      number: cleanNumber,
      contents: {
        type: 'button',
        body: {
          text: payload.body
        },
        action: {
          buttons: payload.buttons.map((b, idx) => ({
            type: 'reply',
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
    // Standard SendMessageAPIText (Postman collection item "SendMessageAPIText")
    requestBody = {
      body: payload.body,
      number: cleanNumber,
      externalKey: extKey
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      db.addErrorLog({
        correlationId: extKey,
        service: 'whatsapp-gateway',
        route: 'external-send-message',
        method: 'POST',
        statusCode: response.status,
        event: 'WHATSAPP_SEND_REJECTED',
        message: 'O gateway WhatsApp rejeitou o envio da mensagem.'
      });
      return {
        success: false,
        message: `Gateway WhatsApp retornou erro (HTTP ${response.status}).`,
        rawResponse: responseData
      };
    }

    return {
      success: true,
      message: 'Mensagem transmitida com sucesso para o canal WhatsApp.',
      data: responseData
    };
  } catch (error: any) {
    db.addErrorLog({
      correlationId: extKey,
      service: 'whatsapp-gateway',
      route: 'external-send-message',
      method: 'POST',
      event: 'WHATSAPP_SEND_ERROR',
      message: 'Falha de comunicação com o gateway WhatsApp.'
    });
    return {
      success: false,
      message: 'Erro na comunicação com o Gateway WhatsApp.'
    };
  }
}

// WhatsApp integration authorization and tenant resolution
function getOperationalWhatsAppTenantId(req: AuthenticatedRequest, rawTenantId?: unknown): string | undefined | null {
  const requestedTenantId = normalizeWhatsAppTenantId(rawTenantId);
  if (req.user?.role === 'SUPER_ADMIN') return requestedTenantId;
  if (requestedTenantId && requestedTenantId !== req.user?.tenantId) return null;
  return normalizeWhatsAppTenantId(req.user?.tenantId);
}

function updateWhatsAppConnectionState(tenantId: string | undefined, patch: Partial<WhatsAppConfig>): WhatsAppConfig {
  const current = tenantId ? (db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig) : db.globalWhatsAppConfig;
  const updated = { ...current, ...patch, provider: 'WHAZING' as const };
  if (tenantId) db.whatsappConfigs.set(tenantId, updated);
  else db.globalWhatsAppConfig = updated;
  return updated;
}

// 1. Get WhatsApp Gateway Configuration
apiRouter.get('/integrations/whatsapp/config', async (req: AuthenticatedRequest, res: Response) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.query.tenantId);
  if (!scope) {
    return res.status(403).json({ error: 'Você não tem permissão para consultar a configuração WhatsApp desta empresa.' });
  }

  const config = scope.isGlobal
    ? db.globalWhatsAppConfig
    : (db.whatsappConfigs.get(scope.tenantId!) || { ...db.globalWhatsAppConfig, token: '' });
  const tenantHasDedicatedConfig = Boolean(scope.tenantId && db.whatsappConfigs.has(scope.tenantId));

  res.json({
    ...safeWhatsAppConfig(config, scope),
    provider: 'WHAZING',
    tenantHasDedicatedConfig
  });
});

function isPublicDemoUser(user: any): boolean {
  return Boolean(
    user &&
    user.accountType === 'TEST' &&
    user.readOnly === true &&
    user.tenantId === PUBLIC_DEMO_TENANT_ID &&
    user.role !== 'SUPER_ADMIN'
  );
}

function isTestOrDemoUser(user: any): boolean {
  if (!user) return false;
  if (user.accountType === 'REAL' && user.readOnly !== true) return false;
  if (user.accountType === 'TEST' || user.readOnly === true) return true;
  const userId = String(user.id || '').toLowerCase();
  return userId === 'user-driver-test-17' || userId.includes('test') || userId.includes('demo');
}

// 2. Save / Update WhatsApp Gateway Configuration
apiRouter.post('/integrations/whatsapp/config', async (req: AuthenticatedRequest, res: Response) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.body?.tenantId);
  if (!scope) {
    return res.status(403).json({ error: 'Você não tem permissão para configurar o WhatsApp desta empresa.' });
  }
  if (isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: 'Perfis criados para teste não possuem permissão para editar ou alterar informações e configurações do sistema.' });
  }
  if (!scope.isGlobal && req.user?.role !== 'SUPER_ADMIN') {
    const tenant = db.tenants.find(item => item.id === scope.tenantId);
    if (tenant?.notificationPlan === 'SAAS_FREE') return res.status(402).json({ error: 'O plano gratuito usa o telefone SaaS. Contrate o módulo de número próprio para cadastrar outro canal.' });
    if (tenant?.notificationPlan === 'OWN_NUMBER' && tenant.notificationBillingStatus !== 'ACTIVE') return res.status(402).json({ error: 'A assinatura do número próprio ainda não está ativa no Asaas.' });
  }

  const { baseUrl, token, defaultChannelNumber, isActive, autoNotifyChecklist, autoNotifyFreightStatus } = req.body || {};
  const tenantId = scope.tenantId;
  const existingConfig: WhatsAppConfig = scope.isGlobal
    ? db.globalWhatsAppConfig
    : {
        ...db.globalWhatsAppConfig,
        ...(db.whatsappConfigs.get(tenantId!) || {}),
        baseUrl: db.whatsappConfigs.get(tenantId!)?.baseUrl || db.globalWhatsAppConfig.baseUrl,
        token: db.whatsappConfigs.get(tenantId!)?.token || ''
      };

  let normalizedBaseUrl: string;
  try {
    normalizedBaseUrl = baseUrl !== undefined ? validateWhatsAppBaseUrl(baseUrl) : existingConfig.baseUrl;
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'URL da API WhatsApp inválida.' });
  }

  const normalizedToken = token && String(token).trim() !== '********' ? String(token).trim() : existingConfig.token;
  const newConfig: WhatsAppConfig = {
    ...existingConfig,
    provider: 'WHAZING',
    baseUrl: normalizedBaseUrl,
    token: normalizedToken,
    defaultChannelNumber: defaultChannelNumber !== undefined ? String(defaultChannelNumber).trim() : existingConfig.defaultChannelNumber,
    isActive: isActive !== undefined ? Boolean(isActive) : existingConfig.isActive,
    autoNotifyChecklist: autoNotifyChecklist !== undefined ? Boolean(autoNotifyChecklist) : existingConfig.autoNotifyChecklist,
    autoNotifyFreightStatus: autoNotifyFreightStatus !== undefined ? Boolean(autoNotifyFreightStatus) : existingConfig.autoNotifyFreightStatus,
    lastConnectionError: undefined
  };

  if (!newConfig.baseUrl || !newConfig.token) {
    return res.status(400).json({ error: 'URL e token do Gateway WhatsApp são necessários. Deixe o token vazio para manter o token atual.' });
  }

  try {
    if (scope.isGlobal) {
      await db.persistWhatsAppSecret(newConfig.baseUrl, newConfig.token);
      db.globalWhatsAppConfig = newConfig;
    } else {
      await db.persistWhatsAppSecretForTenant(tenantId!, newConfig.baseUrl, newConfig.token);
      db.whatsappConfigs.set(tenantId!, newConfig);
    }
  } catch (error: any) {
    return res.status(503).json({ error: error?.message || 'Não foi possível persistir a configuração WhatsApp com segurança.' });
  }
  await db.persistNow();

  db.addAuditLog({
    tenantId: tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CONFIG_WHATSAPP',
    entity: 'WhatsAppGateway',
    entityId: `wa-config-${scope.isGlobal ? 'global' : tenantId}`,
    details: `Atualizou configuração Atendo CRM ${scope.isGlobal ? 'global' : 'da empresa'}; credenciais armazenadas de forma criptografada`
  });

  res.json({
    success: true,
    config: safeWhatsAppConfig(newConfig, scope)
  });
});

// 3. Read Atendo CRM channel status without exposing provider response or credentials
apiRouter.get('/integrations/whatsapp/status', async (req: AuthenticatedRequest, res: Response) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.query.tenantId);
  if (!scope) {
    return res.status(403).json({ error: 'Você não tem permissão para consultar o status WhatsApp desta empresa.' });
  }
  const config = scope.isGlobal ? db.globalWhatsAppConfig : resolveWhatsAppConfig(scope.tenantId);
  if (!config) {
    return res.json({ success: false, status: 'UNKNOWN', message: 'Esta empresa ainda não possui uma configuração Atendo CRM própria.', config: safeWhatsAppConfig({ ...db.globalWhatsAppConfig, token: '', baseUrl: '' }, scope) });
  }
  if (!config.baseUrl || !config.token) {
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: 'UNKNOWN',
      lastStatusCheckedAt: new Date().toISOString(),
      lastConnectionError: 'API WhatsApp não configurada.'
    });
    await db.persistNow();
    return res.json({ success: false, status: updated.connectionStatus, message: 'API WhatsApp não configurada.', config: safeWhatsAppConfig(updated, scope) });
  }
  if (config.isActive === false) {
    return res.json({ success: true, status: 'DISCONNECTED', message: 'Integração WhatsApp desativada.', config: safeWhatsAppConfig({ ...config, connectionStatus: 'DISCONNECTED' }, scope) });
  }

  try {
    const result = await callWhatsAppGateway(config, '/statuschannel', { method: 'GET' });
    const qrCode = result.ok ? extractWhatsAppQrCode(result.data) : null;
    const pairingCode = result.ok ? extractWhatsAppPairingCode(result.data) : null;
    const status: WhatsAppConnectionStatus = result.ok
      ? (pairingCode ? 'PAIRING_CODE_AVAILABLE' : qrCode ? 'QR_AVAILABLE' : mapWhatsAppConnectionStatus(result.data))
      : 'ERROR';
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: status,
      lastStatusCheckedAt: new Date().toISOString(),
      lastConnectionError: result.ok ? undefined : `Gateway retornou HTTP ${result.status}.`
    });
    await db.persistNow();
    if (!result.ok) {
      db.addErrorLog({ service: 'whatsapp-gateway', route: 'external-status-channel', method: 'GET', statusCode: result.status, event: 'WHATSAPP_STATUS_REJECTED', message: 'O gateway WhatsApp rejeitou a consulta de status.' });
    }
    return res.json({
      success: result.ok,
      status,
      message: result.ok
        ? (pairingCode ? 'Código de pareamento disponível.' : qrCode ? 'QR Code disponível.' : 'Status do canal consultado.')
        : 'Não foi possível consultar o status do canal.',
      ...(pairingCode ? { pairingCode } : {}),
      ...(qrCode ? { qrCode } : {}),
      config: safeWhatsAppConfig(updated, scope)
    });
  } catch {
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: 'ERROR',
      lastStatusCheckedAt: new Date().toISOString(),
      lastConnectionError: 'Falha de comunicação com o gateway WhatsApp.'
    });
    await db.persistNow();
    db.addErrorLog({ service: 'whatsapp-gateway', route: 'external-status-channel', method: 'GET', event: 'WHATSAPP_STATUS_ERROR', message: 'Falha de comunicação com o gateway WhatsApp.' });
    return res.status(502).json({ success: false, status: 'ERROR', message: 'Falha de comunicação com o gateway WhatsApp.', config: safeWhatsAppConfig(updated, scope) });
  }
});

// 4. Request a temporary QR Code or pairing code from Atendo CRM; neither is persisted
apiRouter.post('/integrations/whatsapp/qr', async (req: AuthenticatedRequest, res: Response) => {
  await db.waitForPersistence();
  const scope = getWhatsAppScope(req, req.body?.tenantId);
  if (!scope) {
    return res.status(403).json({ error: 'Você não tem permissão para conectar o WhatsApp desta empresa.' });
  }
  const config = scope.isGlobal ? db.globalWhatsAppConfig : resolveWhatsAppConfig(scope.tenantId);
  if (!config) {
    return res.status(400).json({ error: 'Configure uma URL e um token próprios do Atendo CRM para esta empresa antes de solicitar o QR Code.' });
  }
  if (!config.baseUrl || !config.token) {
    return res.status(400).json({ error: 'Configure a URL e o token da API Atendo CRM antes de solicitar o QR Code.' });
  }
  if (config.isActive === false) {
    return res.status(409).json({ error: 'A integração WhatsApp está desativada para esta empresa.' });
  }

  try {
    const requestedPhone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const requestedNumber = requestedPhone ? formatPhoneForWhatsApp(requestedPhone) : null;
    if (requestedPhone && !requestedNumber) {
      return res.status(400).json({ error: 'O número informado para o pareamento é inválido.' });
    }
    const result = await callWhatsAppGateway(config, '/qrcode', {
      method: 'POST',
      body: JSON.stringify({ number: requestedNumber })
    });
    if (!result.ok) {
      db.addErrorLog({ service: 'whatsapp-gateway', route: 'external-qrcode', method: 'POST', statusCode: result.status, event: 'WHATSAPP_QR_REJECTED', message: 'O gateway WhatsApp rejeitou a solicitação de QR Code.' });
      return res.status(502).json({ success: false, error: 'O gateway WhatsApp não gerou o QR Code.' });
    }
    let qrCode = extractWhatsAppQrCode(result.data);
    let pairingCode = extractWhatsAppPairingCode(result.data);
    // Atendo CRM acknowledges POST /qrcode asynchronously (often HTTP 202). The
    // temporary value is normally exposed by GET /statuschannel.
    if (!qrCode && !pairingCode) {
      await new Promise(resolve => setTimeout(resolve, 350));
      const statusResult = await callWhatsAppGateway(config, '/statuschannel', { method: 'GET' });
      if (statusResult.ok) {
        qrCode = extractWhatsAppQrCode(statusResult.data);
        pairingCode = extractWhatsAppPairingCode(statusResult.data);
      }
    }
    const status: WhatsAppConnectionStatus = pairingCode ? 'PAIRING_CODE_AVAILABLE' : qrCode ? 'QR_AVAILABLE' : 'PENDING';
    const updated = updateWhatsAppConnectionState(scope.tenantId, {
      connectionStatus: status,
      lastStatusCheckedAt: new Date().toISOString(),
      lastConnectionError: undefined
    });
    await db.persistNow();
    return res.json({
      success: true,
      status,
      message: pairingCode
        ? 'Código de pareamento temporário gerado.'
        : qrCode
          ? 'QR Code temporário gerado.'
          : (result.status === 202 ? 'Solicitação aceita. Aguardando o canal retornar o código.' : 'Solicitação aceita. Consulte o status do canal para obter o código.'),
      ...(pairingCode ? { pairingCode } : {}),
      ...(qrCode ? { qrCode, expiresInSeconds: 60 } : {}),
      config: safeWhatsAppConfig(updated, scope)
    });
  } catch {
    db.addErrorLog({ service: 'whatsapp-gateway', route: 'external-qrcode', method: 'POST', event: 'WHATSAPP_QR_ERROR', message: 'Falha de comunicação com o gateway WhatsApp ao solicitar QR Code.' });
    return res.status(502).json({ success: false, error: 'Falha de comunicação com o gateway WhatsApp ao solicitar QR Code.' });
  }
});

// 5. Test WhatsApp Gateway Connection. It remains an explicit real-message operation.
apiRouter.post('/integrations/whatsapp/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão exclusiva do Super Admin do Elo Log.' });
  }

  const tenantId = getOperationalWhatsAppTenantId(req, req.body?.tenantId);
  if (tenantId === null) return res.status(403).json({ error: 'Empresa WhatsApp inválida para este usuário.' });
  const { phone, message, baseUrl, token } = req.body || {};
  const savedConfig = tenantId ? (db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig) : db.globalWhatsAppConfig;

  const testConfig: WhatsAppConfig = {
    ...savedConfig,
    baseUrl: baseUrl ? validateWhatsAppBaseUrl(baseUrl) : savedConfig.baseUrl,
    token: token ? String(token).trim() : savedConfig.token
  };

  const targetPhone = phone || testConfig.defaultChannelNumber;
  if (!targetPhone) {
    return res.status(400).json({ error: 'Telefone de destino não configurado.' });
  }
  const testMessage = message || `Mensagem de teste de conexão do sistema Gestor. Horário: ${new Date().toLocaleTimeString('pt-BR')}`;

  const result = await sendToWhatsAppGateway(testConfig, {
    number: targetPhone,
    body: testMessage,
    externalKey: `test-${Date.now()}`
  });

  const updated = updateWhatsAppConnectionState(tenantId, {
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: result.success ? 'SUCCESS' : 'ERROR',
    lastTestMessage: result.message
  });
  await db.persistNow();

  db.addAuditLog({
    tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'TESTE_WHATSAPP',
    entity: 'WhatsAppGateway',
    entityId: `wa-test-${Date.now()}`,
    details: `Teste de envio WhatsApp para número informado: ${result.success ? 'SUCESSO' : 'FALHA'}`
  });

  res.json({
    success: result.success,
    message: result.message,
    recipient: formatPhoneForWhatsApp(targetPhone),
    details: result.data || result.rawResponse
  });
});

// 6. Send Freight / Checklist WhatsApp Notification using the requesting company's channel
apiRouter.post('/integrations/whatsapp/notify', async (req: AuthenticatedRequest, res: Response) => {
  const { phone, message, freightCode, templateType, externalKey, mediaUrl, useButtonApi, buttons, tenantId: requestedTenantId } = req.body || {};
  const tenantId = getOperationalWhatsAppTenantId(req, requestedTenantId);
  if (tenantId === null) return res.status(403).json({ error: 'Empresa WhatsApp inválida para este usuário.' });
  const config = resolveWhatsAppConfig(tenantId || undefined);

  if (!phone || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios para envio.' });
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
    tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DISPARO_WHATSAPP',
    entity: 'WhatsAppNotification',
    entityId: `wa-${Date.now()}`,
    details: `Notificação Atendo CRM (${templateType || 'Geral'}) para o número informado: ${result.success ? 'SUCESSO' : 'FALHA'}`
  });

  res.json({
    success: result.success,
    messageId: `wa-msg-${Date.now()}`,
    recipient: cleanPhone,
    status: result.success ? 'ENVIADO' : 'ERRO',
    sentAt: new Date().toISOString(),
    details: result.message,
    gatewayResponse: result.data || result.rawResponse
  });
});

// Get Form Responses
apiRouter.get('/forms/responses', (req: AuthenticatedRequest, res: Response) => {
  const { freightId, formId } = req.query;
  let responses = db.formResponses;

  if (req.user?.role !== 'SUPER_ADMIN') {
    responses = responses.filter(r => r.tenantId === req.user?.tenantId);
  }
  if (req.user?.role === 'MOTORISTA') {
    responses = responses.filter(r => r.filledByUserId === req.user?.id || r.driverId === req.user?.driverId);
  }
  if (freightId) {
    responses = responses.filter(r => r.freightId === freightId);
  }
  if (formId) {
    responses = responses.filter(r => r.formId === formId);
  }

  res.json(responses);
});

// Get next sequential talão number (e.g. 001, 002, 003...)
apiRouter.get('/forms/next-talao', (req: AuthenticatedRequest, res: Response) => {
  const nextNumber = db.getNextTalaoNumber();
  res.json({ nextNumber });
});

// Dispatch Digital Checklist Receipt via Email and/or WhatsApp with Masked Data
apiRouter.post('/forms/send-dispatch', async (req: AuthenticatedRequest, res: Response) => {
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

  const tenantId = req.user?.tenantId || 'tenant-translog-01';
  const cleanPhone = recipientPhone ? formatPhoneForWhatsApp(recipientPhone) : '';

  let emailStatus = 'NAO_INFORMADO';
  if (recipientEmail && recipientEmail.includes('@')) {
    emailStatus = 'ENVIADO';
    // Create system notification for email dispatch
    db.notifications.unshift({
      id: `notif-email-${Date.now()}`,
      tenantId,
      userId: req.user!.id,
      title: `📧 Comprovante de Checklist #${talaoNumber || '001'} Enviado por E-mail`,
      message: `Comprovante da etapa [${stage || 'VISTORIA'}] transmitido com sucesso para ${recipientEmail} (${recipientName || 'Responsável'}).`,
      read: false,
      createdAt: new Date().toISOString(),
      type: 'STATUS_ATUALIZADO'
    });
  }

  // Generate standard WhatsApp share link if phone exists
  let whatsappLink = '';
  if (cleanPhone && receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(receiptText)}`;
  } else if (receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
  }

  // Audit log
  db.addAuditLog({
    tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DISPARO_COMPROVANTE_CHECKLIST',
    entity: 'ChecklistReceipt',
    entityId: responseId || `talao-${talaoNumber}`,
    details: `Disparo de comprovante do Talão Nº ${talaoNumber || '001'} (${stage || 'VISTORIA'}) para ${recipientName || 'Responsável'}. E-mail: ${recipientEmail || 'N/A'} [${emailStatus}], WhatsApp: ${cleanPhone || 'N/A'}`
  });

  res.json({
    success: true,
    emailStatus,
    recipientEmail: recipientEmail || null,
    recipientPhone: cleanPhone || null,
    whatsappLink,
    sentAt: new Date().toISOString()
  });
});

/* =========================================================================
   9. NOTIFICATIONS
   ========================================================================= */

apiRouter.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

  const userNotifs = db.notifications.filter(n => n.userId === req.user?.id);
  res.json(userNotifs);
});

apiRouter.put('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user?.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

apiRouter.put('/notifications/mark-all-read', (req: AuthenticatedRequest, res: Response) => {
  db.notifications.forEach(n => {
    if (n.userId === req.user?.id) {
      n.read = true;
    }
  });
  res.json({ success: true });
});

/* =========================================================================
   10. AUDIT LOGS
   ========================================================================= */

apiRouter.get('/error-logs', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode consultar o log de erros.' });
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  const event = String(req.query.event || '').trim();
  const status = Number(req.query.status || 0);
  const filtered = db.errorLogs.filter(log => (!event || log.event === event) && (!status || log.statusCode === status));
  res.json({ items: filtered.slice(0, limit), total: filtered.length });
});
apiRouter.delete('/error-logs', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode limpar o log de erros.' });
  const days = Math.min(Math.max(Number(req.body?.olderThanDays || 90), 1), 3650);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const before = db.errorLogs.length;
  db.errorLogs = db.errorLogs.filter(log => new Date(log.createdAt).getTime() >= cutoff);
  res.json({ success: true, removed: before - db.errorLogs.length });
});

apiRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.auditLogs);
  }
  const logs = db.auditLogs.filter(l => l.tenantId === req.user?.tenantId);
  res.json(logs);
});

/* =========================================================================
   11. DASHBOARD STATS
   ========================================================================= */

apiRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  let freights = db.freights;
  let drivers = db.drivers;
  let vehicles = db.vehicles;
  let users = db.users;

  if (req.user?.role !== 'SUPER_ADMIN') {
    freights = freights.filter(f => f.tenantId === req.user?.tenantId);
    drivers = drivers.filter(d => d.tenantId === req.user?.tenantId);
    vehicles = vehicles.filter(v => v.tenantId === req.user?.tenantId);
    users = users.filter(u => u.tenantId === req.user?.tenantId);
  }

  const availableFreights = freights.filter(f => ['PUBLICADO', 'DISPONIVEL'].includes(f.status)).length;
  const reservedFreights = freights.filter(f => f.status === 'RESERVADO').length;
  const inProgressFreights = freights.filter(f => ['EM_COLETA', 'COLETADO', 'EM_TRANSITO'].includes(f.status)).length;
  const completedFreights = freights.filter(f => ['ENTREGUE', 'FINALIZADO'].includes(f.status)).length;
  const cancelledFreights = freights.filter(f => f.status === 'CANCELADO').length;
  const totalFreightValue = freights.reduce((acc, f) => acc + (f.payment?.price || 0), 0);

  const activeDrivers = drivers.filter(d => d.status === 'DISPONIVEL' || d.status === 'EM_VIAGEM').length;

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
    recentActivities: db.auditLogs.filter(l => req.user?.role === 'SUPER_ADMIN' || l.tenantId === req.user?.tenantId).slice(0, 8)
  });
});

/* =========================================================================
   12. DELETE ENDPOINTS
   ========================================================================= */

apiRouter.delete('/freights/:id', async (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(f => f.id === req.params.id);
  if (!freight) return res.status(404).json({ error: 'Frete não encontrado' });
  if (req.user?.role !== 'SUPER_ADMIN' && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este frete pertence a outra empresa.' });
  }
  const now = new Date().toISOString();
  freight.status = 'CANCELADO';
  freight.publicListingEnabled = false;
  freight.publicPublishedAt = undefined;
  freight.updatedAt = now;
  db.addAuditLog({
    tenantId: freight.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'CANCELAR_FRETE',
    entity: 'Freight',
    entityId: freight.id,
    details: `Frete ${freight.code} cancelado sem apagar documentos ou histórico.`
  });
  const relevantUsers = db.users.filter(user => user.tenantId === freight.tenantId);
  void dispatchConfiguredNotification('FRETE_CANCELADO', relevantUsers, { codigo: freight.code, empresa: db.tenants.find(item => item.id === freight.tenantId)?.name || '', link: process.env.APP_URL || '' });
  await db.persistNow();
  res.json({ success: true, message: 'Frete cancelado; documentos e histórico preservados.' });
});

apiRouter.delete('/drivers/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Somente administradores reais podem desativar motoristas.' });
  const driver = db.drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Motorista não encontrado' });
  if (req.user?.role !== 'SUPER_ADMIN' && (!req.user?.tenantId || !db.hasDriverCompanyAccess(driver.id, req.user.tenantId, true))) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este motorista não possui vínculo com a empresa.' });
  }
  const now = new Date().toISOString();
  driver.status = 'INATIVO';
  for (const link of db.driverCompanyLinks.filter(item => item.driverId === driver.id)) {
    if (req.user?.role === 'SUPER_ADMIN' || link.tenantId === req.user?.tenantId) {
      link.status = 'BLOQUEADO'; link.updatedAt = now;
    }
  }
  db.addAuditLog({
    tenantId: req.user?.role === 'SUPER_ADMIN' ? driver.tenantId : req.user?.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'DESATIVAR_MOTORISTA',
    entity: 'Driver',
    entityId: driver.id,
    details: `Motorista ${driver.name} desativado sem apagar a identidade global ou o histórico.`
  });
  await db.persistNow();
  res.json({ success: true, message: 'Motorista desativado; cadastro global e histórico preservados.' });
});

apiRouter.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Somente administradores reais podem desativar usuários.' });
  const targetUser = db.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (req.user?.role !== 'SUPER_ADMIN' && targetUser.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este usuário pertence a outra empresa.' });
  }
  if (targetUser.id === req.user?.id) return res.status(400).json({ error: 'Você não pode desativar seu próprio usuário' });
  targetUser.status = 'BLOQUEADO';
  targetUser.readOnly = true;
  targetUser.updatedAt = new Date().toISOString();
  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'BLOQUEAR_USUARIO',
    entity: 'User',
    entityId: targetUser.id,
    details: `Usuário ${targetUser.name} (${targetUser.email}) bloqueado sem apagar cadastro ou auditoria.`
  });
  await db.persistNow();
  res.json({ success: true, message: 'Usuário bloqueado; cadastro e histórico preservados.' });
});

apiRouter.delete('/forms/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!canManageTenantDirectory(req.user) || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Somente administradores reais podem desativar formulários.' });
  const form = db.forms.find(item => item.id === req.params.id);
  if (!form) return res.status(404).json({ error: 'Formulário não encontrado' });
  if (req.user?.role !== 'SUPER_ADMIN' && form.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este formulário pertence a outra empresa.' });
  }
  form.active = false;
  form.updatedAt = new Date().toISOString();
  db.addAuditLog({
    tenantId: form.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'DESATIVAR_FORMULARIO',
    entity: 'FormDefinition',
    entityId: form.id,
    details: `Formulário ${form.title} desativado sem apagar respostas ou histórico.`
  });
  await db.persistNow();
  res.json({ success: true, message: 'Formulário desativado; respostas e histórico preservados.' });
});

apiRouter.delete('/vehicles/:id', async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = db.vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  const isOwnDriverVehicle = req.user?.role === 'MOTORISTA' && req.user.driverId === vehicle.driverId;
  const isCompanyAdmin = canManageTenantDirectory(req.user) && (req.user?.role === 'SUPER_ADMIN' || vehicle.tenantId === req.user?.tenantId);
  if (!isCompanyAdmin && !isOwnDriverVehicle) {
    return res.status(403).json({ error: 'Acesso não autorizado. Veículos de parceiros só podem ser desativados pelo próprio motorista ou pelo Super Admin.' });
  }
  vehicle.status = 'INATIVO';
  db.addAuditLog({
    tenantId: vehicle.tenantId || req.user?.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'DESATIVAR_VEICULO',
    entity: 'Vehicle',
    entityId: vehicle.id,
    details: `Veículo placa ${vehicle.plate} desativado sem apagar histórico.`
  });
  await db.persistNow();
  res.json({ success: true, message: 'Veículo desativado; histórico preservado.' });
});

// Web Push Notifications endpoints
apiRouter.get('/push/vapid-key', (req: AuthenticatedRequest, res: Response) => {
  res.json({ publicKey: publicVapidKey });
});

apiRouter.post('/push/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Perfis de teste e demo não podem registrar notificações.' });
  const subscription = req.body;
  const endpoint = typeof subscription?.endpoint === 'string' ? subscription.endpoint.trim() : '';
  const keys = subscription?.keys;
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return res.status(400).json({ error: 'Endpoint de subscription inválido.' });
  }
  if (endpointUrl.protocol !== 'https:' || endpoint.length > 2048 || !keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string' || keys.p256dh.length > 512 || keys.auth.length > 256 || !/^[A-Za-z0-9_-]+$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]+$/.test(keys.auth)) {
    return res.status(400).json({ error: 'Subscription Web Push inválida.' });
  }

  if (!(db as any).pushSubscriptions) {
    (db as any).pushSubscriptions = [];
  }

  const subs = (db as any).pushSubscriptions;
  const existing = subs.find((item: any) => item.endpoint === endpoint);
  if (existing && existing.userId !== req.user.id) return res.status(409).json({ error: 'Este dispositivo já está vinculado a outra sessão.' });
  if (!existing) {
    subs.push({
      endpoint,
      expirationTime: subscription.expirationTime === null ? null : undefined,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userId: req.user.id,
      tenantId: req.user.tenantId,
      createdAt: new Date().toISOString()
    });
    await db.persistNow();
  }

  res.json({ success: true, message: 'Push subscription registrada com sucesso' });
});

apiRouter.post('/push/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN' || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Apenas o Super Admin real pode disparar o teste de broadcast.' });
  if (!publicVapidKey || !privateVapidKey) return res.status(503).json({ error: 'Notificações Push não estão configuradas.' });
  try {
    await sendPushNotificationToAll({
      title: 'Teste de Notificação Push',
      body: 'As notificações push estão ativas e funcionando.',
      url: '/'
    });
    res.json({ success: true, message: 'Notificação de teste disparada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao enviar notificação de teste' });
  }
});

// Delivery ledger is visible only to the platform Super Admin and stores no recipient contact.
apiRouter.get('/notification-deliveries', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode consultar as entregas.' });
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  res.json(db.notificationDeliveries.slice(0, limit));
});

// Editable notification templates. System/error templates remain locked.
apiRouter.get('/saas/notification-templates', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode consultar os modelos de mensagens.' });
  res.json((db.saasGlobalConfig.notificationTemplates || []).map(safeNotificationTemplate));
});
apiRouter.put('/saas/notification-templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Apenas o Super Admin pode editar os modelos de mensagens.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Contas de teste não podem alterar mensagens ou configurações.' });
  const templates = db.saasGlobalConfig.notificationTemplates || [];
  const template = templates.find(item => item.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Modelo de mensagem não encontrado.' });
  if (template.systemLocked || template.editable === false || template.eventKey === 'ERRO_SISTEMA') return res.status(403).json({ error: 'Mensagens de erro do sistema são protegidas e não podem ser editadas.' });
  const body = req.body || {};
  template.label = String(body.label ?? template.label).trim().slice(0, 140);
  template.description = String(body.description ?? template.description).trim().slice(0, 500);
  template.enabled = body.enabled === undefined ? template.enabled : Boolean(body.enabled);
  template.channels = {
    email: body.channels?.email === undefined ? template.channels.email : Boolean(body.channels.email),
    whatsapp: body.channels?.whatsapp === undefined ? template.channels.whatsapp : Boolean(body.channels.whatsapp),
    inApp: body.channels?.inApp === undefined ? template.channels.inApp : Boolean(body.channels.inApp)
  };
  template.emailSubject = String(body.emailSubject ?? template.emailSubject).replace(/[<>]/g, '').trim().slice(0, 240);
  template.emailBody = sanitizeServerHtml(String(body.emailBody ?? template.emailBody).slice(0, 5000));
  const nextWhatsappBody = String(body.whatsappBody ?? template.whatsappBody).replace(/[<>]/g, '').trim().slice(0, 1000);
  if (template.eventKey === LOGIN_OTP_EVENT_KEY) {
    const referencedVariables = Array.from(nextWhatsappBody.matchAll(/\{([a-zA-Z0-9_]+)\}/g), match => match[1]);
    const hasRequiredVariables = LOGIN_OTP_REQUIRED_VARIABLES.every(variable => referencedVariables.includes(variable));
    const hasOnlyAllowedVariables = referencedVariables.every(variable => LOGIN_OTP_ALLOWED_VARIABLES.has(variable));
    if (!nextWhatsappBody || nextWhatsappBody.length > 500 || !hasRequiredVariables || !hasOnlyAllowedVariables) {
      return res.status(400).json({ error: 'O modelo de OTP deve conter {codigo} e {validadeMinutos} e usar apenas variáveis permitidas.' });
    }
    template.enabled = true;
    template.channels = { email: false, whatsapp: true, inApp: false };
  }
  template.whatsappBody = nextWhatsappBody;
  template.updatedAt = new Date().toISOString();
  await db.persistNow();
  res.json(template);
});

const getTenantReportOwner = (req: AuthenticatedRequest): Tenant | undefined => {
  if (!req.user?.tenantId) return undefined;
  return db.tenants.find(item => item.id === req.user!.tenantId);
};

const getEditableTenantReportOwner = (req: AuthenticatedRequest): Tenant | undefined => {
  if (!req.user || !['EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return undefined;
  return getTenantReportOwner(req);
};

const reportTemplateText = (value: unknown, fallback: string, maxLength: number, allowEmpty = false): string => {
  const text = String(value ?? fallback).replace(/[<>]/g, '').replace(/[\r\n]+/g, ' ').trim();
  if (!text && allowEmpty) return '';
  return text.slice(0, maxLength);
};

const reportTemplateTypes = new Set<ReportTemplateType>(['EXPENSE', 'CHECKLIST']);

apiRouter.get('/tenant/report-templates', (req: AuthenticatedRequest, res: Response) => {
  const tenant = getTenantReportOwner(req);
  if (!tenant) return res.status(403).json({ error: 'A edição dos modelos exige perfil administrador da empresa.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Contas de teste não podem acessar a edição de modelos.' });
  return res.json(db.getTenantReportTemplates(tenant.id));
});

apiRouter.put('/tenant/report-templates/:type', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = getEditableTenantReportOwner(req);
  if (!tenant) return res.status(403).json({ error: 'A edição dos modelos exige perfil administrador da empresa.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Contas de teste não podem alterar modelos de relatório.' });

  const type = String(req.params.type || '').toUpperCase() as ReportTemplateType;
  if (!reportTemplateTypes.has(type)) return res.status(400).json({ error: 'Tipo de relatório inválido.' });
  const current = db.getTenantReportTemplates(tenant.id).find(template => template.type === type);
  if (!current) return res.status(404).json({ error: 'Modelo de relatório não encontrado.' });

  const body = req.body || {};
  const nextInput: Omit<TenantReportTemplate, 'tenantId' | 'updatedAt' | 'source'> = {
    type,
    title: reportTemplateText(body.title, current.title, 140),
    subtitle: reportTemplateText(body.subtitle, current.subtitle, 240),
    approvalLabel: reportTemplateText(body.approvalLabel, current.approvalLabel, 140),
    signatureLabel: reportTemplateText(body.signatureLabel, current.signatureLabel, 140),
    notes: reportTemplateText(body.notes, current.notes, 500, true)
  };
  if (!nextInput.title || !nextInput.subtitle || !nextInput.approvalLabel || !nextInput.signatureLabel) {
    return res.status(400).json({ error: 'Título, subtítulo, aprovação e assinatura são obrigatórios.' });
  }

  const saved = db.saveTenantReportTemplate(tenant.id, nextInput);
  const actor = safeTenantNotificationAuditActor(req);
  db.addAuditLog({
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
    action: 'TENANT_REPORT_TEMPLATE_UPDATED',
    entity: 'TenantReportTemplate',
    entityId: type,
    details: `Modelo ${type} personalizado pela empresa; identidade legal e rodapé do SaaS permanecem obrigatórios; sessão assistida ${req.supportSession ? 'sim' : 'não'}.`
  });
  await db.persistNow();
  return res.json(saved);
});

const getEditableTenantNotificationOwner = (req: AuthenticatedRequest): Tenant | undefined => {
  if (!req.user || !['EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user.role) || !req.user.tenantId) return undefined;
  const tenant = db.tenants.find(item => item.id === req.user!.tenantId);
  return tenant && tenantOwnNumberActive(tenant.id) ? tenant : undefined;
};

const safeTenantNotificationAuditActor = (req: AuthenticatedRequest): User => {
  if (req.supportSession) return db.users.find(user => user.id === req.supportSession!.actorUserId) || req.user!;
  return req.user!;
};

apiRouter.get('/tenant/notification-templates', (req: AuthenticatedRequest, res: Response) => {
  const tenant = getEditableTenantNotificationOwner(req);
  if (!tenant) return res.status(403).json({ error: 'A edição de mensagens exige o módulo ativo de WhatsApp com número próprio da empresa.' });
  return res.json(notificationTemplatesForTenant(tenant.id));
});

apiRouter.put('/tenant/notification-templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = getEditableTenantNotificationOwner(req);
  if (!tenant) return res.status(403).json({ error: 'A edição de mensagens exige o módulo ativo de WhatsApp com número próprio da empresa.' });
  if (isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Contas de teste não podem alterar mensagens ou configurações.' });

  const globalTemplate = (db.saasGlobalConfig.notificationTemplates || []).find(item => item.id === req.params.id);
  if (!globalTemplate) return res.status(404).json({ error: 'Modelo de mensagem não encontrado.' });
  if (globalTemplate.systemLocked || globalTemplate.editable === false || globalTemplate.eventKey === 'ERRO_SISTEMA') {
    return res.status(403).json({ error: 'Este modelo é protegido e não pode ser personalizado pela empresa.' });
  }

  const body = req.body || {};
  const emailSubject = String(body.emailSubject ?? globalTemplate.emailSubject).trim();
  const emailBody = String(body.emailBody ?? globalTemplate.emailBody);
  const whatsappBody = String(body.whatsappBody ?? globalTemplate.whatsappBody).trim();
  const allowedVariables = globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY
    ? Array.from(LOGIN_OTP_ALLOWED_VARIABLES)
    : [...globalTemplate.variables, 'nomePlataforma', 'nomeEmpresa', 'razaoSocial', 'cnpjEmpresa', 'emailEmpresa', 'telefoneEmpresa', 'cidadeEmpresa', 'estadoEmpresa'];
  const allTextSafe = notificationTemplateTextIsSafe(emailSubject, allowedVariables)
    && notificationTemplateTextIsSafe(emailBody, allowedVariables)
    && notificationTemplateTextIsSafe(whatsappBody, allowedVariables);
  const hasOtpVariables = globalTemplate.eventKey !== LOGIN_OTP_EVENT_KEY
    || LOGIN_OTP_REQUIRED_VARIABLES.every(variable => whatsappBody.includes(`{${variable}}`));
  if (!allTextSafe || !hasOtpVariables) {
    return res.status(400).json({ error: globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY
      ? 'O modelo de OTP deve conter {codigo} e {validadeMinutos} e usar apenas variáveis permitidas.'
      : 'O modelo contém texto vazio, variável não permitida ou excede o limite de segurança.' });
  }

  const currentOverrides = db.tenantNotificationTemplates.get(tenant.id) || [];
  const nextTemplate: NotificationTemplate = {
    ...globalTemplate,
    label: String(body.label ?? globalTemplate.label).trim().slice(0, 140),
    description: String(body.description ?? globalTemplate.description).trim().slice(0, 500),
    enabled: globalTemplate.enabled,
    editable: true,
    channels: globalTemplate.eventKey === LOGIN_OTP_EVENT_KEY
      ? { email: false, whatsapp: true, inApp: false }
      : { ...globalTemplate.channels },
    emailSubject,
    emailBody,
    whatsappBody,
    variables: [...globalTemplate.variables],
    updatedAt: new Date().toISOString(),
    source: 'TENANT'
  };
  const nextOverrides = [...currentOverrides.filter(item => item.id !== globalTemplate.id), nextTemplate];
  db.tenantNotificationTemplates.set(tenant.id, nextOverrides);
  const actor = safeTenantNotificationAuditActor(req);
  db.addAuditLog({
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
    action: 'TENANT_NOTIFICATION_TEMPLATE_UPDATED',
    entity: 'NotificationTemplate',
    entityId: globalTemplate.id,
    details: `Modelo ${globalTemplate.eventKey} personalizado pela empresa; sessão assistida ${req.supportSession ? 'sim' : 'não'}.`
  });
  await db.persistNow();
  return res.json(nextTemplate);
});

// SaaS Global Configuration Endpoints
const safeConfigText = (value: unknown, maxLength = 500): string => typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
const safeConfigNumber = (value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const safePublicUrl = (value: unknown): string => {
  const candidate = safeConfigText(value, 2048);
  if (!candidate) return '';
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

const safeSeoConfig = (seo: any) => seo ? {
  siteName: safeConfigText(seo.siteName),
  title: safeConfigText(seo.title),
  description: safeConfigText(seo.description, 2000),
  keywords: safeConfigText(seo.keywords, 1000),
  canonicalUrl: safePublicUrl(seo.canonicalUrl),
  ogImageUrl: safePublicUrl(seo.ogImageUrl) || undefined,
  locale: /^[a-z]{2}(?:-[A-Z]{2})?$/.test(String(seo.locale || '')) ? String(seo.locale) : 'pt-BR',
  allowIndexing: Boolean(seo.allowIndexing)
} : undefined;

const safeLayoutConfig = (layout: any) => layout ? {
  primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(layout.primaryColor || '')) ? layout.primaryColor : '#059669',
  borderRadius: ['none', 'sm', 'md', 'lg', 'xl', '2xl'].includes(layout.borderRadius) ? layout.borderRadius : 'xl',
  fontFamily: ['sans', 'serif', 'mono', 'display'].includes(layout.fontFamily) ? layout.fontFamily : 'sans',
  navbarStyle: ['dark', 'light', 'colored'].includes(layout.navbarStyle) ? layout.navbarStyle : 'dark',
  logoText: safeConfigText(layout.logoText),
  browserTabTitle: safeConfigText(layout.browserTabTitle),
  footerText: safeConfigText(layout.footerText, 1000),
  systemBackground: ['minimal', 'warm', 'slate'].includes(layout.systemBackground) ? layout.systemBackground : 'minimal',
  homeBadgeText: safeConfigText(layout.homeBadgeText),
  homeTitle: safeConfigText(layout.homeTitle),
  homeTitleAccent: safeConfigText(layout.homeTitleAccent),
  homeSubtitle: safeConfigText(layout.homeSubtitle, 2000)
} : undefined;

const safeFormField = (field: any) => field && typeof field.id === 'string' ? {
  id: safeConfigText(field.id, 80),
  originalLabel: safeConfigText(field.originalLabel, 200),
  label: safeConfigText(field.label, 200),
  placeholder: safeConfigText(field.placeholder, 500),
  enabled: Boolean(field.enabled),
  required: Boolean(field.required)
} : null;

const safeFormFieldsConfig = (fields: any) => fields ? {
  userForm: Array.isArray(fields.userForm) ? fields.userForm.map(safeFormField).filter(Boolean) : [],
  freightForm: Array.isArray(fields.freightForm) ? fields.freightForm.map(safeFormField).filter(Boolean) : [],
  driverForm: Array.isArray(fields.driverForm) ? fields.driverForm.map(safeFormField).filter(Boolean) : [],
  expenseForm: Array.isArray(fields.expenseForm) ? fields.expenseForm.map(safeFormField).filter(Boolean) : []
} : undefined;

const safeNotificationTemplate = (template: any) => template && typeof template.id === 'string' ? {
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
  emailSubject: safeConfigText(template.emailSubject, 240).replace(/[<>]/g, ''),
  emailBody: sanitizeServerHtml(String(template.emailBody || '').slice(0, 5000)),
  whatsappBody: safeConfigText(template.whatsappBody, 1000).replace(/[<>]/g, ''),
  variables: Array.isArray(template.variables) ? template.variables.filter((value: unknown) => /^[a-zA-Z0-9_]{1,80}$/.test(String(value))).slice(0, 50) : [],
  updatedAt: safeConfigText(template.updatedAt, 64),
  source: template.source === 'TENANT' ? 'TENANT' : 'GLOBAL'
} : null;

const safePlanConfig = (plan: any) => plan && typeof plan.id === 'string' ? {
  id: plan.id,
  name: safeConfigText(plan.name, 200),
  price: safeConfigNumber(plan.price, 0, 0, 100000000),
  maxFreightsMonthly: safeConfigNumber(plan.maxFreightsMonthly, 0, 0, 100000000),
  maxUsers: safeConfigNumber(plan.maxUsers, 0, 0, 1000000),
  maxDrivers: safeConfigNumber(plan.maxDrivers, 0, 0, 1000000),
  isActive: Boolean(plan.isActive)
} : null;

const safeNotificationModule = (module: any) => module ? {
  enabled: Boolean(module.enabled),
  freePlanName: safeConfigText(module.freePlanName, 200),
  freePlanDescription: safeConfigText(module.freePlanDescription, 1000),
  ownNumberPlanName: safeConfigText(module.ownNumberPlanName, 200),
  ownNumberPlanDescription: safeConfigText(module.ownNumberPlanDescription, 1000),
  ownNumberMonthlyPrice: safeConfigNumber(module.ownNumberMonthlyPrice, 0, 0, 100000000),
  assistedActivationPrice: safeConfigNumber(module.assistedActivationPrice, 0, 0, 100000000),
  extraNumberMonthlyPrice: safeConfigNumber(module.extraNumberMonthlyPrice, 0, 0, 100000000)
} : undefined;

const exposeSafeSaaSConfig = (config: any) => ({
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
    password: config.emailConfig.password ? '********' : '',
    senderEmail: safeConfigText(config.emailConfig.senderEmail, 254),
    testEmail: safeConfigText(config.emailConfig.testEmail, 254),
    isActive: Boolean(config.emailConfig.isActive)
  } : undefined,
  databaseConfig: config.databaseConfig ? {
    enabled: Boolean(config.databaseConfig.enabled),
    dbType: ['postgres', 'mysql', 'sqlite'].includes(config.databaseConfig.dbType) ? config.databaseConfig.dbType : 'postgres',
    host: safeConfigText(config.databaseConfig.host, 255),
    port: safeConfigNumber(config.databaseConfig.port, 5432, 1, 65535),
    database: safeConfigText(config.databaseConfig.database, 255),
    username: safeConfigText(config.databaseConfig.username, 255),
    password: config.databaseConfig.password ? '********' : '',
    ssl: Boolean(config.databaseConfig.ssl),
    poolMax: safeConfigNumber(config.databaseConfig.poolMax, 10, 1, 1000),
    autoMigrate: Boolean(config.databaseConfig.autoMigrate),
    connectionStatus: config.databaseConfig.connectionStatus,
    lastTestedAt: safeConfigText(config.databaseConfig.lastTestedAt, 64)
  } : undefined,
  imageCompression: config.imageCompression ? {
    enabled: Boolean(config.imageCompression.enabled),
    maxWidth: safeConfigNumber(config.imageCompression.maxWidth, 1920, 1, 10000),
    maxHeight: safeConfigNumber(config.imageCompression.maxHeight, 1080, 1, 10000),
    quality: safeConfigNumber(config.imageCompression.quality, 0.8, 0.1, 1),
    format: ['image/jpeg', 'image/webp', 'image/png'].includes(config.imageCompression.format) ? config.imageCompression.format : 'image/webp',
    autoCompressDocuments: Boolean(config.imageCompression.autoCompressDocuments),
    maxFileSizeKB: safeConfigNumber(config.imageCompression.maxFileSizeKB, 10240, 1, 102400)
  } : undefined,
  mapboxConfig: config.mapboxConfig ? {
    enabled: Boolean(config.mapboxConfig.enabled),
    apiKey: config.mapboxConfig.apiKey ? '********' : '',
    defaultZoom: safeConfigNumber(config.mapboxConfig.defaultZoom, 7, 0, 24),
    defaultStyle: config.mapboxConfig.defaultStyle,
    enableLiveTracking: Boolean(config.mapboxConfig.enableLiveTracking),
    updateIntervalSeconds: safeConfigNumber(config.mapboxConfig.updateIntervalSeconds, 15, 1, 3600)
  } : undefined,
  asaasConfig: config.asaasConfig ? {
    enabled: Boolean(config.asaasConfig.enabled),
    environment: config.asaasConfig.environment === 'production' ? 'production' : 'sandbox',
    apiKey: config.asaasConfig.apiKey ? '********' : '',
    webhookToken: config.asaasConfig.webhookToken ? '********' : '',
    webhookUrl: safePublicUrl(config.asaasConfig.webhookUrl) || undefined
  } : undefined,
  notificationModule: safeNotificationModule(config.notificationModule),
  backupNotifications: safeBackupNotifications(),
  seo: safeSeoConfig(config.seo),
  notificationTemplates: Array.isArray(config.notificationTemplates) ? config.notificationTemplates.map(safeNotificationTemplate).filter(Boolean) : []
});

// Visitors need only public branding, registration, SEO and published pricing.
// Operational integrations, form rules and editable notification bodies remain authenticated-only.
const exposePublicSaaSConfig = (config: any) => ({
  systemName: safeConfigText(config.systemName, 200),
  supportPhone: safeConfigText(config.supportPhone, 40),
  supportEmail: safeConfigText(config.supportEmail, 254),
  allowSelfRegistration: Boolean(config.allowSelfRegistration),
  showDemoSwitcher: Boolean(config.showDemoSwitcher),
  plans: Array.isArray(config.plans) ? config.plans.map(safePlanConfig).filter((plan: any) => plan?.isActive) : [],
  notificationModule: safeNotificationModule(config.notificationModule),
  layout: safeLayoutConfig(config.layout),
  formFields: safeFormFieldsConfig(config.formFields),
  seo: safeSeoConfig(config.seo)
});

apiRouter.get('/saas/config', (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Cache-Control', req.user?.role === 'SUPER_ADMIN' ? 'no-store' : 'public, max-age=300');
  res.json(req.user?.role === 'SUPER_ADMIN' ? exposeSafeSaaSConfig(db.saasGlobalConfig) : exposePublicSaaSConfig(db.saasGlobalConfig));
});
apiRouter.post('/saas/config', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão insuficiente para alterar configurações globais do SaaS.' });
  }
  if (isTestOrDemoUser(req.user)) {
    return res.status(403).json({ error: 'Perfis criados para teste não possuem permissão para editar ou salvar informações e configurações do sistema.' });
  }
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: 'Configuração inválida.' });
  }
  const existing = db.saasGlobalConfig;
  const keepSecret = (incoming: any, current: any, field: string) => {
    if (!incoming) return current;
    const value = incoming[field];
    return value === '********' || value === '' || value === undefined ? (current?.[field] || '') : value;
  };
  const emailConfig = newConfig.emailConfig
    ? { ...newConfig.emailConfig, password: keepSecret(newConfig.emailConfig, existing.emailConfig, 'password') }
    : existing.emailConfig;
  const databaseConfig = newConfig.databaseConfig
    ? { ...newConfig.databaseConfig, password: keepSecret(newConfig.databaseConfig, existing.databaseConfig, 'password') }
    : existing.databaseConfig;
  const mapboxConfig = newConfig.mapboxConfig
    ? { ...newConfig.mapboxConfig, apiKey: keepSecret(newConfig.mapboxConfig, existing.mapboxConfig, 'apiKey') }
    : existing.mapboxConfig;
  const asaasConfig = newConfig.asaasConfig
    ? {
        ...newConfig.asaasConfig,
        apiKey: keepSecret(newConfig.asaasConfig, existing.asaasConfig, 'apiKey'),
        webhookToken: keepSecret(newConfig.asaasConfig, existing.asaasConfig, 'webhookToken')
      }
    : existing.asaasConfig;
  let backupNotifications = existing.backupNotifications || defaultBackupNotificationConfig();
  if (newConfig.backupNotifications) {
    try {
      backupNotifications = backupNotificationConfigFromInput(newConfig.backupNotifications, backupNotifications);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Alertas de backup inválidos.' });
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
  if (emailConfig?.host && emailConfig?.user && emailConfig?.password) {
    try {
      await db.persistEmailSecret(emailConfig);
    } catch (error: any) {
      return res.status(500).json({ error: 'Não foi possível armazenar a configuração SMTP com segurança.' });
    }
  }
  if (asaasConfig?.apiKey || asaasConfig?.webhookToken) {
    try {
      await db.persistAsaasSecret(asaasConfig);
    } catch (error: any) {
      return res.status(500).json({ error: 'Não foi possível armazenar a configuração Asaas com segurança.' });
    }
  }
  db.addAuditLog({
    tenantId: undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CONFIG_SAAS',
    entity: 'SaaSConfig',
    entityId: 'global-saas-config',
    details: `Atualizou configurações globais do SaaS (Nome: ${db.saasGlobalConfig.systemName})`
  });
  void db.persistNow();
  res.json({ success: true, config: exposeSafeSaaSConfig(db.saasGlobalConfig) });
});
/* =========================================================================
   13.1. SQL DATABASE & INSTALLATION MANAGEMENT (SUPER_ADMIN ONLY)
   ========================================================================= */

// Get SQL database status, connection health, and table counts
apiRouter.get('/database/status', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  }

  try {
    const status = await sqlAdapter.getStatus();
    res.json({
      success: true,
      ...status,
      imageCompression: db.saasGlobalConfig.imageCompression
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test SQL connection with custom or stored credentials
apiRouter.post('/database/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  }

  const customConfig = req.body || {};
  const result = await sqlAdapter.testConnection(customConfig);
  res.json(result);
});

// Execute SQL migration (Create all tables, indexes, seeds)
apiRouter.post('/database/migrate', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  }

  const result = await sqlAdapter.runMigration();
  if (result.success) {
    db.addAuditLog({
      tenantId: undefined,
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'MIGRATE_SQL_DATABASE',
      entity: 'Database',
      entityId: 'postgres',
      details: 'Executou a migração completa do banco de dados SQL (todas as tabelas criadas/atualizadas).'
    });
  }

  res.json(result);
});

// Get raw SQL schema script
apiRouter.get('/database/schema', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Administrador.' });
  }

  const sql = sqlAdapter.getSchemaSql();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(sql);
});

// Generate dynamic SSH installer script
apiRouter.get('/installation/ssh-script', (req: AuthenticatedRequest, res: Response) => {
  const installScriptPath = path.join(process.cwd(), 'install.sh');

  if (fs.existsSync(installScriptPath)) {
    const script = fs.readFileSync(installScriptPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(script);
  } else {
    res.status(404).send('#!/bin/bash\necho "install.sh not found"\n');
  }
});

// Generate Portainer stack docker-compose YAML
apiRouter.get('/installation/portainer-stack', (req: AuthenticatedRequest, res: Response) => {
  const portainerPath = path.join(process.cwd(), 'docker-compose.portainer.yml');

  if (fs.existsSync(portainerPath)) {
    const composeYaml = fs.readFileSync(portainerPath, 'utf-8');
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.send(composeYaml);
  } else {
    res.status(404).send('# docker-compose.portainer.yml not found');
  }
});

/* =========================================================================
   14. TRIP EXPENSES & ACCOUNTABILITY (PRESTAÇÃO DE CONTAS ELO LOG)
   ========================================================================= */

// List trip expense reports
apiRouter.get('/expenses', (req: AuthenticatedRequest, res: Response) => {
  let list = db.tripExpenses || [];
  const { freightId, driverId, status } = req.query;
  const includeArchived = req.query.includeArchived === 'true' && ['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '');
  if (!includeArchived) list = list.filter(report => !report.archivedAt);

  if (req.user?.role === 'MOTORISTA') {
    // Drivers only see their own reports
    list = list.filter(e => e.driverId === req.user?.id || e.driverId === req.user?.driverId || (req.user?.name && e.driverName === req.user.name));
  } else if (req.user?.role !== 'SUPER_ADMIN') {
    // Tenant users see their company's reports
    list = list.filter(e => !e.tenantId || e.tenantId === req.user?.tenantId);
  }

  if (freightId) {
    list = list.filter(e => e.freightId === freightId);
  }

  if (driverId) {
    list = list.filter(e => e.driverId === driverId);
  }

  if (status) {
    list = list.filter(e => e.status === status);
  }

  res.json(list);
});

// Get single report
apiRouter.get('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const report = (db.tripExpenses || []).find(e => e.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Relatório de prestação de contas não encontrado' });
  }

  if (req.user?.role !== 'SUPER_ADMIN') {
    if (req.user?.role === 'MOTORISTA') {
      const isOwner = report.driverId === req.user?.id || report.driverId === req.user?.driverId || report.driverName === req.user?.name;
      if (!isOwner) {
        return res.status(403).json({ error: 'Acesso não autorizado a este relatório' });
      }
    } else if (report.tenantId && report.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Acesso não autorizado a relatórios de outra empresa' });
    }
  }

  res.json(report);
});

const normalizeExpenseText = (value: unknown, max = 500): string => typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '';
const normalizeExpenseItems = (raw: unknown, fallback: TripExpenseItem[] = []): TripExpenseItem[] => {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, 100).filter(item => item && typeof item === 'object' && !Array.isArray(item)).map((item: any, index) => ({
    id: normalizeExpenseText(item.id, 100) || `item-${Date.now()}-${randomUUID().slice(0, 8)}-${index}`,
    category: normalizeExpenseText(item.category, 60) as TripExpenseItem['category'],
    date: normalizeExpenseText(item.date, 32),
    description: normalizeExpenseText(item.description, 500),
    establishmentName: normalizeExpenseText(item.establishmentName, 200),
    documentNumber: normalizeExpenseText(item.documentNumber, 100),
    amount: Math.min(100000000, Math.max(0, Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0)),
    paymentMethod: normalizeExpenseText(item.paymentMethod, 50) as TripExpenseItem['paymentMethod'],
    liters: item.liters === undefined ? undefined : Math.max(0, Number(item.liters) || 0),
    pricePerLiter: item.pricePerLiter === undefined ? undefined : Math.max(0, Number(item.pricePerLiter) || 0),
    odometerKm: item.odometerKm === undefined ? undefined : Math.max(0, Number(item.odometerKm) || 0),
    fuelType: item.fuelType ? normalizeExpenseText(item.fuelType, 40) as TripExpenseItem['fuelType'] : undefined,
    arlaLiters: item.arlaLiters === undefined ? undefined : Math.max(0, Number(item.arlaLiters) || 0),
    arlaAmount: item.arlaAmount === undefined ? undefined : Math.max(0, Number(item.arlaAmount) || 0),
    nightsCount: item.nightsCount === undefined ? undefined : Math.max(0, Number(item.nightsCount) || 0),
    transportOrigin: normalizeExpenseText(item.transportOrigin, 160),
    transportDestination: normalizeExpenseText(item.transportDestination, 160),
    receiptPhotoUrl: typeof item.receiptPhotoUrl === 'string' && /^(?:https:\/\/|data:image\/)/i.test(item.receiptPhotoUrl) ? item.receiptPhotoUrl.slice(0, 200000) : undefined,
    receiptPhotoUrls: Array.isArray(item.receiptPhotoUrls) ? item.receiptPhotoUrls.filter((url: unknown) => typeof url === 'string' && /^(?:https:\/\/|data:image\/)/i.test(url)).slice(0, 6).map((url: string) => url.slice(0, 200000)) : undefined,
    notes: normalizeExpenseText(item.notes, 1000),
    createdAt: normalizeExpenseText(item.createdAt, 32) || new Date().toISOString()
  }));
};

// Create new report
apiRouter.post('/expenses', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : null;
  if (!req.user || !data) return res.status(400).json({ error: 'Dados da prestação de contas inválidos.' });
  const canSubmitExpense = req.user.role === 'SUPER_ADMIN' || ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'MOTORISTA'].includes(req.user.role);
  if (!canSubmitExpense || isTestOrDemoUser(req.user)) return res.status(403).json({ error: 'Este perfil não pode criar prestações de contas.' });

  const requestedTenantId = req.user.role === 'SUPER_ADMIN' ? String(data.tenantId || '') : String(req.user.tenantId || '');
  const assignedTenantId = requestedTenantId && db.tenants.some(tenant => tenant.id === requestedTenantId) ? requestedTenantId : '';
  if (!assignedTenantId) return res.status(400).json({ error: 'Empresa válida é obrigatória para a prestação de contas.' });
  const freight = data.freightId ? db.freights.find(item => item.id === String(data.freightId)) : undefined;
  if (data.freightId && (!freight || freight.tenantId !== assignedTenantId)) return res.status(403).json({ error: 'Frete não pertence à empresa informada.' });
  const requestedDriverId = req.user.role === 'MOTORISTA' ? (req.user.driverId || req.user.id) : String(data.driverId || '');
  const driver = requestedDriverId ? db.drivers.find(item => item.id === requestedDriverId || item.userId === requestedDriverId) : undefined;
  if (!driver || (req.user.role === 'MOTORISTA' && driver.userId !== req.user.id && driver.id !== req.user.driverId) || (!['SUPER_ADMIN', 'MOTORISTA'].includes(req.user.role) && !db.hasDriverCompanyAccess(driver.id, assignedTenantId, true))) return res.status(403).json({ error: 'Motorista não autorizado para esta prestação de contas.' });

  const items = normalizeExpenseItems(data.items);
  const totalExpenses = items.reduce((acc: number, it: any) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items
    .filter((it: any) => it.category === 'ABASTECIMENTO' && it.liters)
    .reduce((acc: number, it: any) => acc + (Number(it.liters) || 0), 0);

  const initialKm = Number(data.initialKm) || 0;
  const finalKm = Number(data.finalKm) || 0;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : (Number(data.totalKm) || 0);

  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;

  const advanceAmount = Number(data.advanceAmount) || 0;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus = balanceAmount >= 0 ? 'A_DEVOLVER' : 'REEMBOLSO_A_RECEBER';

  const newReport: TripExpenseReport = {
    id: `exp-${Date.now()}-${randomUUID().slice(0, 8)}`,
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
    startDate: normalizeExpenseText(data.startDate, 32) || new Date().toISOString().split('T')[0],
    endDate: normalizeExpenseText(data.endDate, 32) || new Date().toISOString().split('T')[0],
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
    status: data.status === 'RASCUNHO' ? 'RASCUNHO' : 'ENVIADO',
    items,
    generalNotes: normalizeExpenseText(data.generalNotes, 2000),
    reviewerNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.tripExpenses) {
    db.tripExpenses = [];
  }
  db.tripExpenses.unshift(newReport);

  db.addAuditLog({
    tenantId: newReport.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'MOTORISTA',
    action: 'CRIACAO_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: newReport.id,
    details: `Prestação de contas criada para a viagem/frete ${newReport.freightCode || newReport.id} (Total: R$ ${totalExpenses.toFixed(2)})`
  });

  res.status(201).json(newReport);
});

// Update report / change status / approve
apiRouter.put('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = (db.tripExpenses || []).findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Relatório de despesas não encontrado' });
  }

  const existing = db.tripExpenses[index];
  const updates = req.body && typeof req.body === 'object' ? req.body as Record<string, any> : {};

  // Tenant isolation & authorization check
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isCompanyStaff = (req.user?.role === 'ADMIN' || req.user?.role === 'EMPRESA_SUPER_ADMIN' || req.user?.role === 'SUPERVISOR') && (!existing.tenantId || existing.tenantId === req.user?.tenantId);
  const isDriverOwner = req.user?.role === 'MOTORISTA' && (existing.driverId === req.user?.id || existing.driverId === req.user?.driverId || existing.driverName === req.user?.name);

  if (!isSuperAdmin && !isCompanyStaff && !isDriverOwner) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este relatório' });
  }

  const requestedStatus = updates.status === undefined ? existing.status : String(updates.status);
  if (!['RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'QUITADO'].includes(requestedStatus)) return res.status(400).json({ error: 'Status de prestação de contas inválido.' });
  const canApproveExpense = isSuperAdmin || (req.user?.role === 'EMPRESA_SUPER_ADMIN' || req.user?.role === 'ADMIN') && existing.tenantId === req.user?.tenantId;
  if (['APROVADO', 'QUITADO'].includes(requestedStatus) && !canApproveExpense) return res.status(403).json({ error: 'Apenas administradores da empresa podem aprovar ou quitar despesas.' });
  // Drivers cannot approve their own expenses or modify reviewer fields.
  if (req.user?.role === 'MOTORISTA' && (existing.status === 'APROVADO' || existing.status === 'QUITADO')) return res.status(403).json({ error: 'Este relatório já foi aprovado/quitado e não pode mais ser alterado pelo motorista.' });

  const items = normalizeExpenseItems(updates.items, existing.items);
  const totalExpenses = items.reduce((acc: number, it: TripExpenseItem) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items
    .filter((it: TripExpenseItem) => it.category === 'ABASTECIMENTO' && it.liters)
    .reduce((acc: number, it: TripExpenseItem) => acc + (Number(it.liters) || 0), 0);
  const initialKm = updates.initialKm !== undefined ? Math.max(0, Number(updates.initialKm) || 0) : existing.initialKm;
  const finalKm = updates.finalKm !== undefined ? Math.max(0, Number(updates.finalKm) || 0) : existing.finalKm;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : (updates.totalKm !== undefined ? Math.max(0, Number(updates.totalKm) || 0) : existing.totalKm);
  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : existing.averageKmPerLiter;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : existing.costPerKm;
  const advanceAmount = updates.advanceAmount !== undefined ? Math.max(0, Number(updates.advanceAmount) || 0) : existing.advanceAmount;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus: TripExpenseReport['balanceStatus'] = balanceAmount >= 0 ? 'A_DEVOLVER' : 'REEMBOLSO_A_RECEBER';
  const updatedReport: TripExpenseReport = {
    id: existing.id,
    tenantId: existing.tenantId,
    freightId: existing.freightId,
    freightCode: existing.freightCode,
    driverId: existing.driverId,
    driverName: existing.driverName,
    driverPhone: existing.driverPhone,
    vehiclePlate: updates.vehiclePlate === undefined ? existing.vehiclePlate : normalizeExpenseText(updates.vehiclePlate, 20),
    chassis: updates.chassis === undefined ? existing.chassis : normalizeExpenseText(updates.chassis, 100),
    vehicleModel: updates.vehicleModel === undefined ? existing.vehicleModel : normalizeExpenseText(updates.vehicleModel, 120),
    clientName: updates.clientName === undefined ? existing.clientName : normalizeExpenseText(updates.clientName, 200),
    startDate: updates.startDate === undefined ? existing.startDate : normalizeExpenseText(updates.startDate, 32),
    endDate: updates.endDate === undefined ? existing.endDate : normalizeExpenseText(updates.endDate, 32),
    tripDays: updates.tripDays === undefined ? existing.tripDays : Math.min(366, Math.max(1, Number(updates.tripDays) || 1)),
    initialKm,
    finalKm,
    totalKm,
    totalLiters,
    averageKmPerLiter,
    costPerKm,
    advanceAmount,
    driverLaborAmount: updates.driverLaborAmount === undefined ? existing.driverLaborAmount : Math.max(0, Number(updates.driverLaborAmount) || 0),
    totalExpenses,
    balanceAmount,
    balanceStatus,
    status: requestedStatus as TripExpenseReport['status'],
    items,
    generalNotes: updates.generalNotes === undefined ? existing.generalNotes : normalizeExpenseText(updates.generalNotes, 2000),
    reviewerNotes: canApproveExpense && updates.reviewerNotes !== undefined ? normalizeExpenseText(updates.reviewerNotes, 2000) : existing.reviewerNotes,
    reviewedBy: existing.reviewedBy,
    reviewedAt: existing.reviewedAt,
    approvedAt: existing.approvedAt,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    archivedAt: existing.archivedAt
  };

  if (requestedStatus === 'APROVADO' && existing.status !== 'APROVADO') {
    updatedReport.approvedAt = new Date().toISOString();
    updatedReport.reviewedBy = req.user?.name || 'Administrador';
    updatedReport.reviewedAt = new Date().toISOString();
  }

  db.tripExpenses[index] = updatedReport;

  db.addAuditLog({
    tenantId: updatedReport.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZACAO_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: updatedReport.id,
    details: `Prestação de contas #${updatedReport.id.slice(0, 8)} atualizada (Status: ${updatedReport.status})`
  });

  res.json(updatedReport);
});

// Delete report
apiRouter.delete('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = (db.tripExpenses || []).findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Relatório não encontrado' });
  }

  const report = db.tripExpenses[index];

  // Authorization check
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isCompanyAdmin = (req.user?.role === 'ADMIN' || req.user?.role === 'EMPRESA_SUPER_ADMIN') && (!report.tenantId || report.tenantId === req.user?.tenantId);
  const isDriverOwner = req.user?.role === 'MOTORISTA' && (report.driverId === req.user?.id || report.driverId === req.user?.driverId) && (report.status === 'RASCUNHO' || report.status === 'ENVIADO');

  if (!isSuperAdmin && !isCompanyAdmin && !isDriverOwner) {
    return res.status(403).json({ error: 'Você não tem permissão para excluir este relatório' });
  }

  report.archivedAt = new Date().toISOString();
  report.updatedAt = report.archivedAt;

  db.addAuditLog({
    tenantId: report.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ARQUIVAR_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: report.id,
    details: `Prestação de contas #${report.id} arquivada sem apagar recibos ou histórico.`
  });

  db.persistNow();
  res.json({ success: true, message: 'Relatório arquivado; recibos e histórico preservados.' });
});

// Help Pages Endpoints
apiRouter.get('/help', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.helpPages.map(page => ({ ...page, content: sanitizeServerHtml(page.content) })));
});

apiRouter.post('/help', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Administradores podem editar a ajuda.' });
  }
  const role = String(req.body?.role || '').trim().toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPERVISOR', 'USER', 'DRIVER']);
  if (!allowedRoles.has(role)) return res.status(400).json({ error: 'Perfil de ajuda inválido.' });
  const content = sanitizeServerHtml(String(req.body?.content || '').slice(0, 20000));
  const index = db.helpPages.findIndex(h => h.role === role);
  if (index !== -1) {
    db.helpPages[index].content = content;
  } else {
    db.helpPages.push({ role, content });
  }
  await db.persistNow();
  res.json({ success: true });
});

// Email Test Endpoint (Strictly Super Admin only to prevent unauthorized relay / SSRF)
apiRouter.post('/integrations/email/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN' || isTestOrDemoUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Apenas o Super Administrador real pode realizar testes de conexão SMTP.' });
  }

  const host = String(req.body?.host || '').trim();
  const port = Number(req.body?.port);
  const user = String(req.body?.user || '').trim();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const senderEmail = String(req.body?.senderEmail || '').trim().slice(0, 254);
  const testEmail = String(req.body?.testEmail || '').trim().slice(0, 254);

  if (!host || !Number.isInteger(port) || ![25, 465, 587, 2525].includes(port) || !user || !senderEmail || !testEmail || isPrivateOrLocalHostname(host) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail)) {
    return res.status(400).json({ success: false, message: 'Host, porta ou e-mails inválidos para teste SMTP.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password }
    });
    await transporter.verify();
    await transporter.sendMail({
      from: senderEmail,
      to: testEmail,
      subject: 'Teste de conexão SMTP',
      text: 'A conexão SMTP foi configurada com sucesso.',
      html: '<p>A conexão SMTP foi configurada com sucesso.</p>'
    });
    res.json({ success: true, message: 'E-mail de teste enviado com sucesso!' });
  } catch (err: any) {
    console.error('SMTP test failed', { code: err?.code || 'UNKNOWN', name: err?.name || 'Error' });
    res.status(502).json({ success: false, message: 'Não foi possível concluir o teste SMTP.' });
  }
});



