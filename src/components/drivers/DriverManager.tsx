import React, { useEffect, useState } from 'react';
import { api, clientApi } from '../../services/api';
import { Driver } from '../../types';
import { Camera, MapPin, Search, ShieldAlert, Truck, UploadCloud, X, Send, Lock, RotateCcw } from 'lucide-react';
import { AddressAutocomplete } from '../common/AddressAutocomplete';

export const DriverManager: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cnh, setCnh] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [companyFiles, setCompanyFiles] = useState<any[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);

  const handleLookup = async () => {
    const phoneLookup = window.prompt('Telefone do motorista (deixe vazio para consultar por CNH):')?.trim() || '';
    const cnhLookup = phoneLookup ? '' : (window.prompt('Número da CNH:')?.trim() || '');
    if (!phoneLookup && !cnhLookup) return;
    setSaving(true);
    setError('');
    try {
      const result = await api.lookupDriver(phoneLookup, cnhLookup);
      setLookupResult(result.driver);
      if (result.companyLink?.status === 'APROVADO') {
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

  const handleCreate = async () => {
    setLookupResult(null);
    const newName = window.prompt('Nome completo do motorista:')?.trim() || '';
    if (!newName) return;
    const newEmail = window.prompt('E-mail do motorista:')?.trim() || '';
    const newPhone = window.prompt('Telefone/WhatsApp do motorista:')?.trim() || '';
    const newCpf = window.prompt('CPF do motorista:')?.trim() || '';
    const newCnh = window.prompt('CNH do motorista:')?.trim() || '';
    if (!newEmail || !newPhone || !newCpf || !newCnh) {
      setError('Nome, e-mail, telefone, CPF e CNH são obrigatórios para incluir um motorista.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.registerDriver({ name: newName, email: newEmail, phone: newPhone, cpf: newCpf, cnh: newCnh, city: '', state: 'SP' });
      await load();
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleEdit = (driver: Driver) => {
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
    void api.getDriverCompanyProfile(driver.id).then(profile => {
      setCompanyNotes(profile.notes || '');
      setCompanyFiles(Array.isArray(profile.files) ? profile.files : []);
    }).catch(() => {});
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setCpf('');
    setRg('');
    setCity('');
    setState('SP');
    setCnh('');
    setCompanyNotes('');
    setCompanyFiles([]);
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
      setError('O arquivo deve ter no máximo 5 MB.');
      return;
    }
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
        <button type="button" onClick={() => void handleCreate()} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
          Incluir motorista
        </button>
        <button type="button" onClick={() => void handleLookup()} disabled={saving} className="rounded-xl border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer">
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
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handleEdit(driver)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800/40 cursor-pointer transition-colors">Editar Perfil</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        {editingId ? (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 p-5 shadow-lg relative h-fit sticky top-6">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Arquivos desta empresa (até 5 MB cada)
                    <input type="file" onChange={handleCompanyFile} className="mt-1 block w-full text-xs" />
                  </label>
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
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-10 text-center h-[75vh]">
            <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Selecione um motorista</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">Clique em "Editar Perfil" na lista ao lado para alterar os dados ou validar documentos com IA.</p>
          </div>
        )}
      </div>

      {/* Removed missing DriverCnhModal and DriverRiskModal temporarily */}
    </section>
  );
};
