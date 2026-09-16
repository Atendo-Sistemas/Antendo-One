import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SaaSProvider, useSaaS } from './context/SaaSContext';
import { Navbar } from './components/layout/Navbar';
const DriverDashboard = lazy(() => import('./components/driver/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const DriverProfileView = lazy(() => import('./components/driver/DriverProfileView').then(m => ({ default: m.DriverProfileView })));
const CompanyDashboard = lazy(() => import('./components/company/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));
const DriverManager = lazy(() => import('./components/drivers/DriverManager').then(m => ({ default: m.DriverManager })));
const FormBuilder = lazy(() => import('./components/forms/FormBuilder').then(m => ({ default: m.FormBuilder })));
const FormFillModal = lazy(() => import('./components/forms/FormFillModal').then(m => ({ default: m.FormFillModal })));
const FreightFormModal = lazy(() => import('./components/freight/FreightFormModal').then(m => ({ default: m.FreightFormModal })));
const UserManager = lazy(() => import('./components/users/UserManager').then(m => ({ default: m.UserManager })));
const AuditLogViewer = lazy(() => import('./components/audit/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const HelpPanel = lazy(() => import('./components/common/HelpPanel').then(m => ({ default: m.HelpPanel })));
const SuperAdminDashboard = lazy(() => import('./components/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const SaaSConfigPanel = lazy(() => import('./components/superadmin/SaaSConfigPanel').then(m => ({ default: m.SaaSConfigPanel })));
const ContentManagementPanel = lazy(() => import('./components/superadmin/ContentManagementPanel').then(m => ({ default: m.ContentManagementPanel })));
const ExpenseManager = lazy(() => import('./components/expenses/ExpenseManager').then(m => ({ default: m.ExpenseManager })));
import { GuestInstitutionalPage } from './components/common/GuestInstitutionalPage';
import { TermsOfUse } from './components/common/TermsOfUse';
import { PrivacyPolicy } from './components/common/PrivacyPolicy';
import { PublicContentPage } from './components/common/PublicContentPage';
import { PublicContentIndexPage } from './components/common/PublicContentIndexPage';
import { FreightShowcasePage } from './components/common/FreightShowcasePage';
const CompanyVehicleManager = lazy(() => import('./components/company/CompanyVehicleManager').then(m => ({ default: m.CompanyVehicleManager })));
const CompanyBillingPanel = lazy(() => import('./components/company/CompanyBillingPanel').then(m => ({ default: m.CompanyBillingPanel })));
const NotificationConsentPanel = lazy(() => import('./components/common/NotificationConsentPanel').then(m => ({ default: m.NotificationConsentPanel })));
const NotificationTemplatesPanel = lazy(() => import('./components/superadmin/NotificationTemplatesPanel').then(m => ({ default: m.NotificationTemplatesPanel })));
const ReportTemplatesPanel = lazy(() => import('./components/company/ReportTemplatesPanel').then(m => ({ default: m.ReportTemplatesPanel })));
const CompanyStopsPanel = lazy(() => import('./components/company/CompanyStopsPanel').then(m => ({ default: m.CompanyStopsPanel })));
const BudgetManager = lazy(() => import('./components/budgets/BudgetManager').then(m => ({ default: m.BudgetManager })));
const ClientManager = lazy(() => import('./components/clients/ClientManager').then(m => ({ default: m.ClientManager })));
const OperationsCenter = lazy(() => import('./components/operations/OperationsCenter').then(m => ({ default: m.OperationsCenter })));
import { PermissionsRequestModal } from './components/common/PermissionsRequestModal';
const LiveRouteTrackingModal = lazy(() => import('./components/tracking/LiveRouteTrackingModal').then(m => ({ default: m.LiveRouteTrackingModal })));
import { FormDefinition, Freight } from './types';
import { api } from './services/api';

const DemoRestrictedNotice: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="max-w-2xl mx-auto rounded-2xl border border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/30 p-6">
    <p className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Ambiente de demonstração</p>
    <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{title}</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
  </div>
);

const AppContent: React.FC = () => {
  const { user, tenant, supportSession, startDemoSession } = useAuth();
  const { config } = useSaaS();
  const [activeTab, setActiveTab] = useState<string>('freights');
  const [publicTrackingFreight, setPublicTrackingFreight] = useState<Freight | null>(null);
  const [notificationContext, setNotificationContext] = useState<{ type: string; freightId?: string; message: string; title: string } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const referrer = document.referrer;
    const refHost = referrer ? (() => { try { return new URL(referrer).hostname.toLowerCase(); } catch { return ''; } })() : '';
    const source = url.searchParams.get('utm_source') || (refHost.includes('google.') ? 'Google' : refHost.includes('bing.') ? 'Bing' : /facebook|instagram|linkedin|tiktok|youtube/.test(refHost) ? 'Rede social' : refHost ? refHost : 'Acesso direto');
    void api.recordPublicVisit({ path: window.location.pathname, referrer, source, medium: url.searchParams.get('utm_medium') || (refHost ? 'referência web' : 'direto'), campaign: url.searchParams.get('utm_campaign') || '', device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop' }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackingCode = params.get('rastreio')?.trim();
    if (!trackingCode || trackingCode.length > 100) return;
    let cancelled = false;
    const loadTracking = () => api.getPublicTracking(trackingCode)
      .then(freight => { if (!cancelled) setPublicTrackingFreight(freight); })
      .catch(() => { if (!cancelled) setPublicTrackingFreight(null); });
    void loadTracking();
    const intervalId = window.setInterval(loadTracking, 15000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, []);
  
  // State for filling form dynamically
  const [activeFormModal, setActiveFormModal] = useState<{ form: FormDefinition; freightId?: string } | null>(null);
  
  // State for creating new freight modal directly from Navbar quick-action
  const [isCreateFreightOpen, setIsCreateFreightOpen] = useState(false);

  const isDriver = user?.role === 'MOTORISTA';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDemo = user?.accountType === 'TEST' && tenant?.isDemo === true;

  // Automatically adjust active tab when switching demo roles
  useEffect(() => {
    if (isDemo) {
      const validDemoTabs = ['freights', 'budgets', 'clients', 'operations', 'drivers', 'company-vehicles', 'expenses', 'forms', 'users', 'audit', 'notification-preferences', 'help'];
      if (!validDemoTabs.includes(activeTab)) setActiveTab('freights');
      return;
    }
    if (supportSession && user?.id === supportSession.targetUser.id) {
      setActiveTab(user?.role === 'MOTORISTA' ? 'driver-portal' : 'freights');
      return;
    }
    if (user?.role === 'MOTORISTA') {
      if (activeTab !== 'driver-portal' && activeTab !== 'driver-profile' && activeTab !== 'expenses' && activeTab !== 'notification-preferences') {
        setActiveTab('driver-portal');
      }
    } else if (user?.role === 'SUPER_ADMIN') {
      const validSuperAdminTabs = ['saas-tenants', 'freights', 'budgets', 'clients', 'operations', 'drivers', 'company-vehicles', 'expenses', 'forms', 'users', 'audit', 'saas-config', 'content-management', 'notification-preferences'];
      if (!validSuperAdminTabs.includes(activeTab)) {
        setActiveTab('saas-tenants');
      }
    } else {
      // Company roles (ADMIN, SUPERVISOR, USUARIO)
      if (activeTab === 'driver-portal' || activeTab === 'driver-profile' || activeTab === 'saas-tenants') {
        setActiveTab('freights');
      }
    }
  }, [user?.role, user?.id, tenant?.isDemo, isDemo, activeTab, supportSession?.id, supportSession?.targetUser.id]);

  const handleOpenFormModal = async (formId: string, freightId?: string) => {
    try {
      const forms = await api.getForms();
      const target = forms.find(f => f.id === formId)
        || forms.find(f => f.category === 'CHECKLIST_ENTREGA' && f.active)
        || forms.find(f => f.active)
        || forms[0];
      if (target) {
        setActiveFormModal({ form: target, freightId });
      }
    } catch (err) {
      console.error('Erro ao abrir formulário:', err);
    }
  };

  const publicPath = typeof window !== 'undefined' ? window.location.pathname : '';
  if (publicPath === '/termos-de-uso' || publicPath === '/conteudo/termos-de-uso') return <main className="min-h-screen bg-slate-100 p-4 sm:p-8"><TermsOfUse /></main>;
  if (publicPath === '/politica-de-privacidade' || publicPath === '/conteudo/politica-de-privacidade') return <main className="min-h-screen bg-slate-100 p-4 sm:p-8"><PrivacyPolicy /></main>;
  const publicSlug = publicPath.startsWith('/conteudo/') || publicPath.startsWith('/elo-log/')
    ? decodeURIComponent(publicPath.replace(/^\/(?:conteudo|elo-log)\//, '').split('/')[0])
    : '';
  if (publicSlug) return <PublicContentPage slug={publicSlug} />;
  if (publicPath === '/elo-log' || (typeof window !== 'undefined' && window.location.pathname === '/elo-log')) return <PublicContentIndexPage section="elo-log" />;
  if (publicPath === '/conteudo') return <PublicContentIndexPage section="conteudo" />;
  if (publicPath === '/vitrine-fretes') return <FreightShowcasePage />;

  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <PermissionsRequestModal />
        <GuestInstitutionalPage initialTab={typeof window !== 'undefined' && window.location.pathname === '/login' ? 'login' : undefined} onLoginSuccess={() => setActiveTab('freights')} onDemoStart={startDemoSession} />
        {publicTrackingFreight && (
          <Suspense fallback={null}>
            <LiveRouteTrackingModal
              freight={publicTrackingFreight}
              onClose={() => {
                setPublicTrackingFreight(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PermissionsRequestModal />

      {/* Universal Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenCreateFreight={!isDemo ? () => setIsCreateFreightOpen(true) : undefined}
        onOpenNotification={setNotificationContext}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full pb-16">
        {isDriver ? (
          activeTab === 'driver-profile' ? (
            <DriverProfileView />
          ) : activeTab === 'expenses' ? (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
              <ExpenseManager currentUser={user} />
            </div>
          ) : activeTab === 'notification-preferences' ? (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
              <NotificationConsentPanel />
            </div>
          ) : activeTab === 'help' ? (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
              <HelpPanel role={user.role} />
            </div>
          ) : (
            <DriverDashboard onOpenFormModal={handleOpenFormModal} />
          )
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
            {activeTab === 'freights' && <CompanyDashboard />}
            {activeTab === 'budgets' && <BudgetManager />}
            {activeTab === 'clients' && <ClientManager />}
            {activeTab === 'operations' && <OperationsCenter />}
            {activeTab === 'company-stops' && <CompanyStopsPanel />}
            {activeTab === 'billing' && (isDemo ? <DemoRestrictedNotice title="Assinatura e pagamentos indisponíveis" description="A demonstração não acessa cobrança, Asaas, faturas ou dados financeiros. Essas operações pertencem à empresa contratante e ficam protegidas no ambiente SaaS." /> : <CompanyBillingPanel onOpenNotificationTemplates={() => setActiveTab('company-notification-templates')} />)}
            {activeTab === 'company-notification-templates' && (isDemo ? <DemoRestrictedNotice title="Mensagens protegidas no modo demo" description="A demonstração utiliza a operação SaaS configurada, mas não permite consultar ou alterar tokens, URLs ou modelos de comunicação." /> : <NotificationTemplatesPanel scope="tenant" />)}
            {activeTab === 'company-report-templates' && (isDemo ? <DemoRestrictedNotice title="Modelos protegidos no modo demo" description="A demonstração permite visualizar relatórios fictícios, mas não permite editar ou salvar modelos de relatório." /> : <ReportTemplatesPanel />)}
            {activeTab === 'drivers' && <DriverManager />}
            {activeTab === 'company-vehicles' && <CompanyVehicleManager />}
            {activeTab === 'expenses' && <ExpenseManager currentUser={user} />}
            {activeTab === 'forms' && <FormBuilder />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'audit' && <AuditLogViewer />}
            {activeTab === 'help' && <HelpPanel role={user.role} />}
            {activeTab === 'saas-tenants' && <SuperAdminDashboard />}
            {activeTab === 'saas-config' && <SaaSConfigPanel onOpenContentManagement={() => setActiveTab('content-management')} />}
            {activeTab === 'content-management' && <ContentManagementPanel />}
            {activeTab === 'notification-preferences' && <NotificationConsentPanel />}
          </div>
        )}
      </main>

      {/* Global Quick Create Freight Modal */}
      {!isDemo && <FreightFormModal
        isOpen={isCreateFreightOpen}
        onClose={() => setIsCreateFreightOpen(false)}
        onSuccess={() => {
          setIsCreateFreightOpen(false);
          // If on another tab, go to freights
          setActiveTab('freights');
        }}
      />}

      {/* Dynamic Form Fill Modal */}
      {activeFormModal && (
        <FormFillModal
          form={activeFormModal.form}
          freightId={activeFormModal.freightId}
          onClose={() => setActiveFormModal(null)}
          onSuccess={() => {
            alert('Formulário enviado com sucesso!');
            setActiveFormModal(null);
          }}
        />
      )}

      {publicTrackingFreight && (
        <Suspense fallback={null}>
          <LiveRouteTrackingModal
            freight={publicTrackingFreight}
            onClose={() => {
              setPublicTrackingFreight(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        </Suspense>
      )}

      {notificationContext && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Detalhes da notificação</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{notificationContext.title}</h2></div><button onClick={() => setNotificationContext(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">×</button></div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">{notificationContext.message}</p>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setNotificationContext(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">Fechar</button><button onClick={() => { setActiveTab(notificationContext.type.includes('USUARIO') ? (isSuperAdmin ? 'saas-tenants' : 'users') : notificationContext.type.includes('FRETE') ? 'freights' : 'saas-tenants'); setNotificationContext(null); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Abrir área para modificar</button></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{config?.layout?.footerText || `${config?.systemName || 'Atendo One'} • Gestão Logística Integrada © 2026`}</span>
          <span className="font-mono text-[11px] text-slate-400">Arquitetura Multi-tenant • Controle de Concorrência Atômico</span>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <SaaSProvider>
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950" role="status" aria-label="Carregando aplicação">
            <span className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" aria-hidden="true" />
            <span className="sr-only">Carregando aplicação</span>
          </div>
        }>
          <AppContent />
        </Suspense>
      </AuthProvider>
    </SaaSProvider>
  );
}
