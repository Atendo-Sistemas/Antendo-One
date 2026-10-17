import React, { useEffect, useState } from 'react';
import { api, clientApi } from '../../services/api';
import { Driver, DriverCompanyLink } from '../../types';
import { Camera, MapPin, Search, ShieldAlert, Truck, UploadCloud, X, Send, Lock, RotateCcw } from 'lucide-react';
import { AddressAutocomplete } from '../common/AddressAutocomplete';
import { useAuth } from '../../context/AuthContext';

export const DriverManager: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companyLinks, setCompanyLinks] = useState<DriverCompanyLink[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [linkingDriver, setLinkingDriver] = useState<Driver | null>(null);
  const [linkTenantId, setLinkTenantId] = useState('');
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'lookup' | 'edit' | null>(null);
  const [name, setName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cnh, setCnh] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [companyFiles, setCompanyFiles] = useState<any[]>([]);
  const [companyFileError, setCompanyFileError] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupCnh, setLookupCnh] = useState('');

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const phoneValue = lookupPhone.trim();
    const cnhValue = phoneValue ? '' : lookupCnh.trim();
    if (!phoneValue && !cnhValue) {
      setError('Informe o telefone ou a CNH para consultar o cadastro global.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await api.lookupDriver(phoneValue, cnhValue);
      setLookupResult(result.driver);
      setModal(null);
      if (isSuperAdmin) {
        setError('Cadastro global encontrado. Selecione “Vincular empresa” na lista para associá-lo a uma empresa.');
      } else if (result.companyLink?.status === 'APROVADO') {
        setError('Este motorista já está aprovado nesta empresa.');
      } else {
        await api.linkDriverToCompany(result.driver.id);
        await load();
        setError('Motorista encontrado e vínculo pendente criado para esta empresa.');
      }
    } catch (e: any) {
      setError(e.message || 'Não foi possível consultar o motorista.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setLookupResult(null);
    setCreateEmail(''); setName(''); setPhone(''); setCpf(''); setCnh(''); setCity(''); setState('SP');
    setModal('create');
  };

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newName = name.trim();
    const newEmail = createEmail.trim();
    const newPhone = phone.trim();
    const newCpf = cpf.trim();
    const newCnh = cnh.trim();
    if (!newName || !newEmail || !newPhone || !newCpf || !newCnh) {
      setError('Nome, e-mail, telefone, CPF e CNH são obrigatórios para incluir um motorista.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.registerDriver({ name: newName, email: newEmail, phone: newPhone, cpf: newCpf, cnh: newCnh, city: city.trim(), state: state.trim().toUpperCase() });
      await load();
      setModal(null);
    } catch (e: any) {
      setError(e.message || 'Não foi possível incluir o motorista.');
    } finally {
      setSaving(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.getDrivers();
      setDrivers(d);
      if (isSuperAdmin) {
        const [links, tenantList] = await Promise.all([api.getDriverCompanyLinks(), api.getTenants()]);
        setCompanyLinks(links);
        setTenants(tenantList);
      } else setCompanyLinks(await api.getDriverCompanyLinks());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [isSuperAdmin]);

  const openManualLink = (driver: Driver) => {
    setLinkingDriver(driver);
    setLinkTenantId('');
    setError('');
  };

  const saveManualLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkingDriver || !linkTenantId) { setError('Selecione uma empresa para criar o vínculo.'); return; }
    setSaving(true);
    try {
      const result = await api.linkDriverToCompany(linkingDriver.id, linkTenantId);
      if (result.companyLink?.id) await api.updateDriverCompanyLinkStatus(result.companyLink.id, 'APROVADO', undefined, 'EMPRESA');
      setLinkingDriver(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Não foi possível criar o vínculo com a empresa.');
    } finally { setSaving(false); }
  };

  const removeCompanyLink = async (driver: Driver, link: DriverCompanyLink) => {
    if (!window.confirm(`Excluir ${driver.name} desta empresa? O cadastro global e os vínculos com outras empresas serão preservados.`)) return;
    setRemovingLinkId(link.id);
    setError('');
    try {
      await api.unlinkDriverFromCompany(link.id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Não foi possível excluir o motorista desta empresa.');
    } finally {
      setRemovingLinkId(null);
    }
  };

  const handleEdit = (driver: Driver) => {
    setModal('edit');
    setEditingId(driver.id);
    setName(driver.name);
    setPhone(driver.phone);
    setCpf(driver.cpf || '');
    setRg(driver.rg || '');
    setCity(driver.city || '');
    setState(driver.state || 'SP');
    setCnh(driver.cnh || '');
    setCompanyNotes('');
    setCompanyFiles([]);
    setCompanyFileError('');
    void api.getDriverCompanyProfile(driver.id).then(profile => {
      setCompanyNotes(profile.notes || '');
      setCompanyFiles(Array.isArray(profile.files) ? profile.files : []);
    }).catch(() => {});
    setError('');
  };

  const cancelEdit = () => {
    setModal(null);
    setEditingId(null);
    setName('');
    setCreateEmail('');
    setPhone('');
    setCpf('');
    setRg('');
    setCity('');
    setState('SP');
    setCnh('');
    setCompanyNotes('');
    setCompanyFiles([]);
    setCompanyFileError('');
    setError('');
  };

  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    setError('');
    try {
      await api.updateDriver(editingId, { name, phone, cpf, rg, city, state, cnh });
      await api.updateDriverCompanyProfile(editingId, { notes: companyNotes, files: companyFiles });
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fCity = { label: 'Cidade', placeholder: 'São Paulo', enabled: true, required: true };
  const fCnh = { label: 'CNH', placeholder: 'Apenas números', enabled: true, required: false };

  const handleCompanyFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setCompanyFileError('O arquivo deve ter no máximo 5 MB.');
      return;
    }
    setCompanyFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCompanyFiles(prev => [...prev, { name: file.name, mimeType: file.type, dataUrl: reader.result }].slice(-20));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const filtered = drivers.filter(d => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(term) || 
      (d.cpf || '').includes(term) || 
      (d.cnh || '').includes(term) || 
      (d.city || '').toLowerCase().includes(term);
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Gestão Logística</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6" /> Cadastro de Motoristas
          </h1>
        </div>
        <button type="button" onClick={handleCreate} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
          Incluir motorista
        </button>
        <button type="button" onClick={() => { setLookupPhone(''); setLookupCnh(''); setError(''); setModal('lookup'); }} disabled={saving} className="rounded-xl border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer">
          Consultar por telefone/CNH
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300 shadow-sm flex items-start gap-2"><ShieldAlert className="w-5 h-5 shrink-0" /> {error}</div>}
      {lookupResult && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20 p-4 text-sm text-blue-900 dark:text-blue-100 shadow-sm"><div className="font-bold">Cadastro global encontrado</div><div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><span>Nome: <strong>{lookupResult.name}</strong></span><span>Telefone: <strong>{lookupResult.phone || '--'}</strong></span><span>CPF: <strong>{lookupResult.cpf || '--'}</strong></span><span>CNH: <strong>{lookupResult.cnh || '--'}</strong></span><span>E-mail: <strong>{lookupResult.email || '--'}</strong></span><span>Endereço: <strong>{lookupResult.address || '--'}</strong></span><span>Cidade/UF: <strong>{lookupResult.city || '--'}/{lookupResult.state || '--'}</strong></span><span>Validade CNH: <strong>{lookupResult.cnhExpiresAt || '--'}</strong></span></div><div className="mt-2 text-[11px] text-blue-700 dark:text-blue-300">Esses são dados cadastrais globais. Anotações e arquivos permanecem exclusivos desta empresa.</div></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column: List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[75vh]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF, CNH ou cidade do motorista..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Carregando motoristas...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum motorista encontrado.</div>
            ) : (
              <div className="grid gap-2 p-2">
                {filtered.map(driver => (
                  (() => {
                    const companyLink = companyLinks.find(link => link.driverId === driver.id && link.tenantId === user?.tenantId && link.scope === 'EMPRESA' && link.status !== 'REMOVIDO');
                    return (
                  <article key={driver.id} className={`p-4 rounded-xl border transition-all ${editingId === driver.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 dark:text-white truncate">{driver.name}</h3>
                          {driver.systemLocked && <Lock className="w-3.5 h-3.5 text-slate-400" title="Cadastro bloqueado pelo sistema (Demo)" />}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 shrink-0"><MapPin className="w-3 h-3" /> {driver.city}/{driver.state}</span>
                          <span className="shrink-0">{driver.phone}</span>
                          {driver.cpf && <span className="shrink-0 font-medium font-mono text-slate-600 dark:text-slate-400">CPF: {driver.cpf}</span>}
                        </div>
                        {isSuperAdmin && <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600 dark:bg-slate-950/50 dark:text-slate-300"><strong>Empresas vinculadas:</strong> {companyLinks.filter(link => link.driverId === driver.id && link.scope === 'EMPRESA').map(link => `${link.tenantName || link.tenantId} (${link.status})`).join(', ') || 'Nenhuma'}</div>}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handleEdit(driver)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800/40 cursor-pointer transition-colors">Editar Perfil</button>
                        {isSuperAdmin && <button onClick={() => openManualLink(driver)} className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-800/40 cursor-pointer transition-colors">Vincular empresa</button>}
                        {!isSuperAdmin && companyLink && <button type="button" disabled={removingLinkId === companyLink.id} onClick={() => void removeCompanyLink(driver, companyLink)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50">{removingLinkId === companyLink.id ? 'Excluindo...' : 'Excluir da empresa'}</button>}
                      </div>
                    </div>
                  </article>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        {editingId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={cancelEdit}>
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 p-5 shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={event => event.stopPropagation()}>
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            <h2 className="text-lg font-black text-slate-900 dark:text-white pr-8">Editar Motorista</h2>
            <p className="text-xs text-slate-500 mb-5">Atualize os dados, valide documentos e anexe fotos.</p>

            {/* Smart Document Analysis Area */}
            <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Nome Completo <span className="text-red-500">*</span></span>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Telefone <span className="text-red-500">*</span></span>
                    <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">CPF</span>
                    <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium font-mono" />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fCity.enabled && (
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        {fCity.label} {fCity.required && <span className="text-red-500">*</span>}
                      </span>
                      <AddressAutocomplete
                        required={fCity.required}
                        value={city}
                        onSelect={(data) => {
                          setCity(data.city || data.address);
                          if (data.state) setState(data.state);
                        }}
                        placeholder="Buscar cidade..."
                        className="bg-slate-50 dark:bg-slate-800"
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Estado (UF)</span>
                    <input maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase" />
                  </label>
                  {fCnh.enabled && (
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">{fCnh.label} {fCnh.required && <span className="text-red-500">*</span>}</span>
                      <input required={fCnh.required} value={cnh} onChange={e => setCnh(e.target.value)} placeholder={fCnh.placeholder} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium font-mono" />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">RG</span>
                    <input value={rg} onChange={e => setRg(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium font-mono" />
                  </label>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Anotações internas desta empresa</span>
                    <textarea value={companyNotes} onChange={e => setCompanyNotes(e.target.value)} rows={4} placeholder="Registre observações que não serão compartilhadas com outras empresas." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                  </label>
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Arquivos desta empresa (até 5 MB cada)</span>
                    <input id="driver-company-file-input" type="file" onChange={handleCompanyFile} className="sr-only" />
                    <label htmlFor="driver-company-file-input" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/60">
                      <UploadCloud className="h-4 w-4" /> Selecionar arquivo
                    </label>
                    <p className="text-[11px] text-slate-500">Máximo de 5 MB por arquivo.</p>
                    {companyFileError && <p role="alert" className="text-[11px] font-semibold text-red-700 dark:text-red-300">{companyFileError}</p>}
                  </div>
                  {companyFiles.length > 0 && <ul className="space-y-1 text-[11px] text-slate-500">{companyFiles.map((file, index) => <li key={file.id || `${file.name}-${index}`} className="flex items-center justify-between gap-2"><span className="truncate">{file.name}</span><button type="button" onClick={() => setCompanyFiles(prev => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600 hover:underline">Remover</button></li>)}</ul>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 cursor-pointer">
                  {saving ? 'Salvando...' : <><Send className="w-4 h-4" /> Salvar Edições</>}
                </button>
              </div>
            </form>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-10 text-center h-[75vh]">
            <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Selecione um motorista</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">Clique em "Editar Perfil" na lista ao lado para alterar os dados ou validar documentos com IA.</p>
          </div>
        )}
      </div>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Cadastro operacional</p><h2 className="text-xl font-black">Novo motorista</h2><p className="mt-1 text-xs text-emerald-100">Preencha os dados para criar o cadastro global e o vínculo com a empresa.</p></div>
              <button type="button" onClick={() => setModal(null)} className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-5 p-6">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="field-label">Nome completo <b>*</b></span><input required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: João da Silva" className="form-control" /></label>
                <label><span className="field-label">E-mail <b>*</b></span><input required type="email" value={createEmail} onChange={event => setCreateEmail(event.target.value)} placeholder="motorista@empresa.com.br" className="form-control" /></label>
                <label><span className="field-label">Telefone / WhatsApp <b>*</b></span><input required value={phone} onChange={event => setPhone(event.target.value)} placeholder="(11) 99999-9999" className="form-control" /></label>
                <label><span className="field-label">CPF <b>*</b></span><input required value={cpf} onChange={event => setCpf(event.target.value)} placeholder="000.000.000-00" className="form-control font-mono" /></label>
                <label><span className="field-label">CNH <b>*</b></span><input required value={cnh} onChange={event => setCnh(event.target.value)} placeholder="Número da CNH" className="form-control font-mono" /></label>
                <label><span className="field-label">Cidade</span><input value={city} onChange={event => setCity(event.target.value)} placeholder="Cidade" className="form-control" /></label>
                <label><span className="field-label">UF</span><input maxLength={2} value={state} onChange={event => setState(event.target.value.toUpperCase())} placeholder="SP" className="form-control uppercase" /></label>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800"><button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{saving ? 'Salvando...' : 'Salvar motorista'}</button></div>
            </form>
          </div>
        </div>
      )}

      {modal === 'lookup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cadastro compartilhado</p><h2 className="text-xl font-black">Consultar motorista</h2><p className="mt-1 text-xs text-slate-300">Use telefone ou CNH para localizar um cadastro existente.</p></div><button type="button" onClick={() => setModal(null)} className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleLookup} className="space-y-5 p-6">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
              <label><span className="field-label">Telefone / WhatsApp</span><input value={lookupPhone} onChange={event => setLookupPhone(event.target.value)} placeholder="(11) 99999-9999" className="form-control" /></label>
              <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">ou</div>
              <label><span className="field-label">CNH</span><input value={lookupCnh} onChange={event => setLookupCnh(event.target.value)} placeholder="Número da CNH" className="form-control font-mono" /></label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800"><button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{saving ? 'Consultando...' : 'Consultar cadastro'}</button></div>
            </form>
          </div>
        </div>
      )}

      {linkingDriver && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={() => setLinkingDriver(null)}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Super Admin</p><h2 className="text-xl font-black">Vincular motorista a empresa</h2><p className="mt-1 text-xs text-blue-100">{linkingDriver.name} permanecerá como um único cadastro global.</p></div><button type="button" onClick={() => setLinkingDriver(null)} className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button></div>
            <form onSubmit={saveManualLink} className="space-y-5 p-6">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">O vínculo e as decisões dessa empresa serão armazenados separadamente. Outras empresas não terão seus dados internos alterados.</div>
              <label><span className="field-label">Empresa de destino <b>*</b></span><select required value={linkTenantId} onChange={event => setLinkTenantId(event.target.value)} className="form-control"><option value="">Selecione uma empresa</option>{tenants.filter(tenant => companyLinks.find(link => link.driverId === linkingDriver.id && link.tenantId === tenant.id && link.scope === 'EMPRESA')?.status !== 'APROVADO').map(tenant => { const existingLink = companyLinks.find(link => link.driverId === linkingDriver.id && link.tenantId === tenant.id && link.scope === 'EMPRESA'); return <option key={tenant.id} value={tenant.id}>{tenant.name} — {tenant.cnpj || tenant.id}{existingLink?.status ? ` (${existingLink.status})` : ''}</option>; })}</select><span className="mt-1 block text-[11px] text-slate-500">Empresas com vínculo pendente ou bloqueado permanecem disponíveis para reanálise e reativação.</span></label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800"><button type="button" onClick={() => setLinkingDriver(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{saving ? 'Vinculando...' : 'Criar ou reativar vínculo aprovado'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Removed missing DriverCnhModal and DriverRiskModal temporarily */}
    </section>
  );
};
