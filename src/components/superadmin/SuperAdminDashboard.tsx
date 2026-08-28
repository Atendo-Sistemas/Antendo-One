import React, { useState, useEffect } from 'react';
import { Tenant, OperationType } from '../../types';
import { api } from '../../services/api';
import { Building2, Shield, Plus, CheckCircle, TrendingUp, Users, Truck, DollarSign, Pencil, Trash2, X, Split, Lock, User as UserIcon, Mail, Phone, RefreshCw } from 'lucide-react';

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const list = await api.getTenants();
      setTenants(list);
    } catch (err) {
      console.error('Erro ao carregar tenants:', err);
    } finally {
      setLoading(false);
    }
  };

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
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
    setPrivacyAccepted(false);
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
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) {
      if (!responsibleName.trim() || !email.trim() || !phone.trim() || !password) {
        alert('Preencha os dados do responsável, e-mail, telefone e senha.');
        return;
      }
      if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }
      if (!termsAccepted || !privacyAccepted) {
        alert('O cadastro exige aceite dos Termos de Uso e da Política de Privacidade.');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await api.updateTenant(editingTenant.id, {
          name,
          legalName,
          cnpj,
          email,
          phone,
          city,
          state,
          plan,
          status,
          allowedOperations
        });
        alert('Empresa atualizada com sucesso!');
      } else {
        await api.createTenant({
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
          password,
          confirmPassword,
          termsAccepted,
          privacyAccepted
        });
        alert('Empresa cadastrada com sucesso!');
      }
      setIsModalOpen(false);
      loadTenants();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const executeDeleteTenant = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteTenant(confirmDelete.id);
      setTenants(prev => prev.filter(t => t.id !== confirmDelete.id));
      alert('Empresa excluída com sucesso');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir empresa');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRetryAtendoProvisioning = async (t: Tenant) => {
    try {
      setIsSubmitting(true);
      const result = await api.provisionTenantAtendo(t.id);
      alert(result.success ? `Empresa ${t.name} provisionada no Atendo CRM.` : `Provisionamento pendente: ${result.status}.`);
      await loadTenants();
    } catch (err: any) {
      alert(err.message || 'Não foi possível reprocessar o Atendo CRM.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTenant = async (t: Tenant) => {
    try {
      await api.updateTenant(t.id, {
        ...t,
        status: 'ATIVA'
      });
      alert(`Empresa "${t.name}" aprovada com sucesso! Todos os usuários associados receberam ativação automática e o isolamento de dados foi configurado.`);
      loadTenants();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar empresa');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
              SaaS Multi-Tenant Global Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Painel do Super Administrador
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Visão macro de todas as transportadoras contratantes, isolamento de dados e faturamento global.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-right">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 font-bold block">Tenants Ativos</span>
              <span className="text-xl font-black text-white">{tenants.length} empresas</span>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Empresa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tenants Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenants.map(t => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">CNPJ: {t.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {t.plan}
                    </span>
                    {t.status === 'PENDENTE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                        PENDENTE APROVAÇÃO
                      </span>
                    ) : t.status === 'BLOQUEADA' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                        BLOQUEADA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                        ATIVA
                      </span>
                    )}
                    {t.atendoCrmProvisioningStatus && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.atendoCrmProvisioningStatus === 'PROVISIONED' ? 'bg-emerald-100 text-emerald-800' : t.atendoCrmProvisioningStatus === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        CRM: {t.atendoCrmProvisioningStatus === 'PROVISIONED' ? 'ATENDO OK' : t.atendoCrmProvisioningStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">ID / Tenant Scope</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{t.id}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Isolamento DB</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo (Isolado)
                    </span>
                  </div>
                </div>

                {t.status === 'PENDENTE' && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-800 font-medium">
                      Esta empresa foi pré-registrada e aguarda liberação.
                    </div>
                    <button
                      onClick={() => handleApproveTenant(t)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Aprovar Empresa
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{t.city}/{t.state} • {t.phone || t.email}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Editar empresa"
                  >
                    <Pencil className="w-3.5 h-3.5" />
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
                  <button
                    onClick={() => handleDeleteTenant(t.id, t.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    title="Excluir empresa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Modal de Confirmação de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tem certeza que deseja excluir a empresa <strong>{confirmDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteTenant}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTenant ? 'Editar Empresa / Tenant' : 'Cadastrar Nova Empresa (Tenant)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome Fantasia da Empresa *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="Ex: TransLog Brasil"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Razão Social</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="Ex: TransLog Transportes Ltda"
                />
              </div>

              {!editingTenant && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome do Responsável *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={responsibleName}
                      onChange={e => setResponsibleName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder="Ex: Carlos Alberto Ferreira"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">CNPJ da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={e => setCnpj(formatCnpj(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Plano SaaS</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="BASICO">Básico</option>
                    <option value="PROFISSIONAL">Profissional</option>
                    <option value="EMPRESARIAL">Empresarial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Celular (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="(17) 99999-9999"
                  />
                </div>
              </div>

              {!editingTenant && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Senha de Acesso *</label>
                    <div className="relative">
                      <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Confirmação de Senha *</label>
                    <div className="relative">
                      <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium" placeholder="Repita sua senha" autoComplete="new-password" />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={e => setState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="SP"
                  />
                </div>
              </div>

              {!editingTenant && (
                <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                  <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-0.5 rounded text-purple-600" /><span>Responsável ciente e de acordo com os Termos de Uso.</span></label>
                  <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="mt-0.5 rounded text-purple-600" /><span>Responsável ciente e de acordo com a Política de Privacidade.</span></label>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status da Empresa</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="PENDENTE">Pendente (Aguardando Aprovação)</option>
                  <option value="ATIVA">Ativa</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Módulos Logísticos Permitidos</label>
                <div className="flex flex-col gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedOperations.includes('CARGA_GERAL')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedOperations([...allowedOperations, 'CARGA_GERAL']);
                        } else {
                          setAllowedOperations(allowedOperations.filter(op => op !== 'CARGA_GERAL'));
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Carga Geral (Tradicional)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedOperations.includes('LOGISTICA_VEICULOS')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedOperations([...allowedOperations, 'LOGISTICA_VEICULOS']);
                        } else {
                          setAllowedOperations(allowedOperations.filter(op => op !== 'LOGISTICA_VEICULOS'));
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Logística de Veículos (Cegonha/Guincho)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
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
