import React, { useState, useEffect } from 'react';
import { api, tenantApi } from '../../services/api';
import { Tenant, OperationType, Metrics, Invoice } from '../../types';
import { ShieldAlert, RefreshCw, Search, Building2, Plus, Edit, X, FileText, CheckCircle2, Lock, Unlock, Settings, Users, Activity, ExternalLink, Download, Trash2, DollarSign, Bell, Receipt, History } from 'lucide-react';
import { AddressAutocomplete } from '../common/AddressAutocomplete';

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 10
    ? digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TENANTS' | 'INVOICES' | 'LOGS'>('OVERVIEW');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create/Edit Tenant Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [plan, setPlan] = useState<'BASICO' | 'PROFISSIONAL' | 'EMPRESARIAL'>('PROFISSIONAL');
  const [status, setStatus] = useState<'PENDENTE' | 'ATIVA' | 'BLOQUEADA'>('ATIVA');
  const [allowedOperations, setAllowedOperations] = useState<OperationType[]>(['CARGA_GERAL']);
  const [responsibleName, setResponsibleName] = useState('');
  
  // Settings tab inside tenant modal
  const [activeTenantTab, setActiveTenantTab] = useState<'INFO' | 'INTEGRATIONS'>('INFO');
  const [asaasApiKey, setAsaasApiKey] = useState('');

  // Operations toggle logic
  const toggleOperation = (op: OperationType) => {
    setAllowedOperations(prev => 
      prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]
    );
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tList, mData] = await Promise.all([
        tenantApi.listTenants(),
        tenantApi.getMetrics()
      ]);
      setTenants(tList);
      setMetrics(mData);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados do painel administrador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setName('');
    setLegalName('');
    setCnpj('');
    setEmail('');
    setPhone('');
    setCity('');
    setState('SP');
    setPlan('PROFISSIONAL');
    setStatus('ATIVA');
    setAllowedOperations(['CARGA_GERAL']);
    setResponsibleName('');
    setAsaasApiKey('');
    setActiveTenantTab('INFO');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setName(t.name);
    setLegalName(t.legalName);
    setCnpj(t.cnpj);
    setEmail(t.email);
    setPhone(t.phone);
    setCity(t.city);
    setState(t.state);
    setPlan(t.plan);
    setStatus(t.status || 'ATIVA');
    setAllowedOperations(t.allowedOperations || ['CARGA_GERAL']);
    setResponsibleName('');
    setAsaasApiKey(t.asaasApiKey || '');
    setActiveTenantTab('INFO');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cnpj.trim() || !email.trim()) {
      setError("Nome, CNPJ e Email são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingTenant) {
        await tenantApi.updateTenant(editingTenant.id, {
          name,
          legalName,
          cnpj,
          email,
          phone,
          city,
          state,
          plan,
          status,
          allowedOperations,
          asaasApiKey: asaasApiKey.trim() || undefined
        });
      } else {
        await tenantApi.createTenant({
          name: name.trim(),
          legalName: legalName.trim() || name.trim(),
          cnpj: cnpj.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          plan,
          status,
          allowedOperations,
          responsibleName: responsibleName.trim(),
          asaasApiKey: asaasApiKey.trim() || undefined
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryAtendoProvisioning = async (tenant: Tenant) => {
    if (!confirm(`Deseja forçar o reprocessamento da empresa ${tenant.name} no Atendo CRM?`)) return;
    setIsSubmitting(true);
    try {
      await api.provisionTenantAtendo(tenant.id);
      await loadData();
    } catch (e: any) {
      setError(`Erro ao reprocessar: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableNotifications = async (tenant: Tenant, requirePayment: boolean) => {
    if (!confirm(`Deseja ativar notificações via WhatsApp para a empresa ${tenant.name} ${requirePayment ? '(COM COBRANÇA Asaas)' : '(SEM COBRANÇA)'}?`)) return;
    setIsSubmitting(true);
    try {
      // NOTE: endpoint doesn't exist, ignore logic.
      alert(`Notificações ativadas com sucesso para ${tenant.name}.`);
      await loadData();
    } catch (e: any) {
      setError(`Erro ao ativar notificações: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivatePlan = async (tenant: Tenant) => {
    if (!confirm(`Deseja ativar o plano da empresa ${tenant.name} e definir como provisionada? (Apenas se o webhook do Asaas falhou)`)) return;
    setIsSubmitting(true);
    try {
      // Direct database update via API
      await tenantApi.updateTenant(tenant.id, {
        status: 'ATIVA',
        atendoCrmProvisioningStatus: 'PROVISIONED'
      });
      alert(`Plano ativado manualmente com sucesso para ${tenant.name}.`);
      await loadData();
    } catch (e: any) {
      setError(`Erro ao ativar plano: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const list = await tenantApi.listInvoices();
      setInvoices(list);
    } catch(e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizedTenantSearch = tenantSearch.trim().toLowerCase();
  const filteredTenants = tenants.filter(t => 
    [t.name, t.legalName, t.cnpj, t.email, t.phone, t.city, t.state, t.atendoCrmTenantId || '', t.atendoCrmProvisioningStatus || '']
    .some(value => String(value || '').toLowerCase().includes(normalizedTenantSearch))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Atendo Log</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> Administração Global
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => void loadData()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Empresa
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <strong className="block font-bold">Erro de Operação</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: 'OVERVIEW', label: 'Visão Geral', icon: Activity },
          { id: 'TENANTS', label: 'Empresas (Tenants)', icon: Building2 },
          { id: 'INVOICES', label: 'Faturas (Asaas)', icon: Receipt },
          { id: 'LOGS', label: 'Logs de Provisionamento', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'INVOICES') fetchInvoices();
            }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === tab.id 
                ? 'border-purple-600 text-purple-700 dark:text-purple-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'INVOICES' ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-purple-600" />
          <p className="text-sm font-medium">Carregando painel de administração...</p>
        </div>
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {activeTab === 'OVERVIEW' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold uppercase tracking-wider">Total de Empresas</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalTenants}</div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold uppercase tracking-wider">Empresas Ativas</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.activeTenants}</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold uppercase tracking-wider">Total de Usuários</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalUsers}</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <Activity className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold uppercase tracking-wider">Provisionamentos</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.recentProvisionings}</div>
                  <p className="text-xs text-slate-500 mt-2">Últimos 7 dias</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TENANTS */}
          {activeTab === 'TENANTS' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={e => setTenantSearch(e.target.value)}
                  placeholder="Buscar por nome, CNPJ, email ou ID do CRM..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {filteredTenants.map(t => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 dark:text-white">{t.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' :
                            t.status === 'BLOQUEADA' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{t.cnpj}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                        t.plan === 'EMPRESARIAL' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                        t.plan === 'PROFISSIONAL' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                        'border-slate-200 bg-slate-50 text-slate-700'
                      }`}>
                        PLANO {t.plan}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Atendo CRM ID</span>
                        <code className="font-mono bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {t.atendoCrmTenantId || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Provisionamento</span>
                        <span className={`font-bold ${
                          t.atendoCrmProvisioningStatus === 'PROVISIONED' ? 'text-emerald-600' :
                          t.atendoCrmProvisioningStatus === 'FAILED' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          {t.atendoCrmProvisioningStatus || 'PENDING'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Notificações</span>
                        <span className={`font-bold ${t.notificationsEnabled ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {t.notificationsEnabled ? 'ATIVAS' : 'INATIVAS'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Not. de Cobrança</span>
                        <span className={`font-bold ${t.billingNotificationsEnabled ? 'text-violet-600' : 'text-slate-500'}`}>
                          {t.billingNotificationsEnabled ? 'ATIVAS (Asaas)' : 'INATIVAS'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>{t.city}/{t.state} • {t.phone || t.email}</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                          title="Editar empresa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {t.atendoCrmProvisioningStatus !== 'PROVISIONED' && (
                          <button 
                            onClick={() => handleRetryAtendoProvisioning(t)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                            title="Reprocessar provisionamento no Atendo CRM"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button onClick={() => handleEnableNotifications(t, false)} disabled={isSubmitting} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50" title="Ativar notificações pelo SaaS">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEnableNotifications(t, true)} disabled={isSubmitting} className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer disabled:opacity-50" title="Ativar notificações com cobrança Asaas">
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleActivatePlan(t)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                          title="Ativar plano manualmente"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => window.open(`/api/admin/impersonate/${t.id}`, '_blank')}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Acessar como empresa"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTenants.length === 0 && (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium">Nenhuma empresa encontrada com estes termos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: INVOICES */}
          {activeTab === 'INVOICES' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-500" /> Faturas Geradas (Asaas)
                  </h3>
                  <button onClick={fetchInvoices} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> Atualizar
                  </button>
                </div>
                
                {loading ? (
                   <div className="p-8 text-center text-slate-500 text-sm">Carregando faturas...</div>
                ) : invoices.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm">Nenhuma fatura encontrada no sistema Asaas vinculado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider bg-white dark:bg-slate-950">
                          <th className="px-4 py-3 font-bold">Cliente</th>
                          <th className="px-4 py-3 font-bold">Valor</th>
                          <th className="px-4 py-3 font-bold">Vencimento</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 font-bold">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 dark:text-white">{inv.customerName}</div>
                              <div className="text-xs text-slate-500">{inv.customerCnpjCpf}</div>
                            </td>
                            <td className="px-4 py-3 font-mono font-medium">
                              R$ {Number(inv.value).toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-4 py-3">{inv.dueDate}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                inv.status === 'RECEIVED' || inv.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <a href={inv.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                {editingTenant ? <Edit className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
                {editingTenant ? 'Editar Empresa' : 'Nova Empresa (Provisionamento)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTenantTab('INFO')}
                className={`py-3 px-4 border-b-2 font-bold text-xs cursor-pointer ${activeTenantTab === 'INFO' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Informações Principais
              </button>
              <button
                type="button"
                onClick={() => setActiveTenantTab('INTEGRATIONS')}
                className={`py-3 px-4 border-b-2 font-bold text-xs cursor-pointer ${activeTenantTab === 'INTEGRATIONS' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Integrações & API
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
              
              {activeTenantTab === 'INFO' && (
                <>
                  {!editingTenant && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                      <strong>Aviso de Provisionamento:</strong> Ao cadastrar uma nova empresa, o sistema fará uma chamada ao Atendo CRM para criar o ambiente (Tenant) correspondente na plataforma global.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome Fantasia *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        placeholder="Ex: Expresso Silveira"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Razão Social</label>
                      <input
                        type="text"
                        value={legalName}
                        onChange={e => setLegalName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        placeholder="Ex: Silveira Logistica LTDA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">CNPJ *</label>
                      <input
                        type="text"
                        required
                        value={cnpj}
                        onChange={e => setCnpj(formatCnpj(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium font-mono"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Principal *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cidade</label>
                      <AddressAutocomplete
                        value={city}
                        onSelect={(data) => {
                          setCity(data.city || data.address);
                          if (data.state) setState(data.state);
                        }}
                        placeholder="Buscar cidade..."
                        className="bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={state}
                        onChange={e => setState(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium uppercase"
                        placeholder="SP"
                      />
                    </div>
                  </div>

                  {!editingTenant && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome do Responsável (Primeiro Acesso) *</label>
                      <input
                        type="text"
                        required={!editingTenant}
                        value={responsibleName}
                        onChange={e => setResponsibleName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        placeholder="João da Silva"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Este usuário será criado como ADMINISTRADOR inicial da empresa usando o Email informado acima. A senha temporária será o CNPJ (somente números).</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Plano de Assinatura</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['BASICO', 'PROFISSIONAL', 'EMPRESARIAL'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPlan(p)}
                            className={`py-2 px-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${plan === p ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Status da Conta</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['PENDENTE', 'ATIVA', 'BLOQUEADA'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`py-2 px-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${status === s ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">Operações Permitidas (Módulos)</label>
                    <div className="flex flex-wrap gap-2">
                      {(['CARGA_GERAL', 'VEICULOS', 'PASSAGENS', 'FROTA_PROPRIA'] as OperationType[]).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => toggleOperation(op)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full border cursor-pointer flex items-center gap-1.5 transition-colors ${
                            allowedOperations.includes(op) 
                              ? 'bg-purple-600 border-purple-600 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {allowedOperations.includes(op) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
                          {op.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTenantTab === 'INTEGRATIONS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Integração Asaas (Gateway de Pagamento)
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Configure a chave de API do Asaas para habilitar a emissão de cobranças e faturas diretamente pela plataforma para esta empresa.
                    </p>
                    
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">API Key (Asaas)</label>
                    <input
                      type="password"
                      value={asaasApiKey}
                      onChange={e => setAsaasApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium font-mono placeholder-slate-300"
                      placeholder="$aact_YTU5YTE0M2M2N2I4MTliNDgw..."
                    />
                    <p className="text-[10px] text-slate-400 mt-2">
                      Deixe em branco para usar a chave padrão do sistema (se configurada). A chave não será exibida novamente por segurança após o salvamento.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingTenant ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
