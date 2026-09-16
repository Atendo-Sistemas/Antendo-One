import React, { useEffect, useState } from 'react';
import { api, clientApi } from '../../services/api';
import { Driver, CustomFormConfig, DocumentAnalysisRequest } from '../../types';
import { Camera, MapPin, Search, ShieldAlert, Truck, UploadCloud, X, Send, Lock, RotateCcw } from 'lucide-react';
import { DriverCnhModal } from './DriverCnhModal';
import { DriverRiskModal } from './DriverRiskModal';
import { DriverUploadArea } from './DriverUploadArea';
import { AddressAutocomplete } from '../common/AddressAutocomplete';

export const DriverManager: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [formConfig, setFormConfig] = useState<CustomFormConfig | null>(null);
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
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);

  // Modals
  const [cnhModalDriver, setCnhModalDriver] = useState<Driver | null>(null);
  const [riskModalDriver, setRiskModalDriver] = useState<Driver | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, conf] = await Promise.all([api.getDrivers(), api.getCustomFormConfig()]);
      setDrivers(d);
      setFormConfig(conf);
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
    setError('');
    setDocumentAnalysis(null);
  };

  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    setError('');
    try {
      await api.updateDriver(editingId, { name, phone, cpf, rg, city, state, cnh });
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const analyzeDocument = async (base64String: string, type: string) => {
    if (!editingId) return;
    setAnalyzingDoc(true);
    try {
      const payload: DocumentAnalysisRequest = { imageBase64: base64String, documentType: type, driverId: editingId };
      const analysis = await api.analyzeDriverDocument(payload);
      setDocumentAnalysis({ ...analysis, type });
      
      // Auto-fill fields if they match high confidence extraction
      if (analysis.extractedFields) {
        if (analysis.extractedFields.cpf && !cpf) setCpf(analysis.extractedFields.cpf);
        if (analysis.extractedFields.rg && !rg) setRg(analysis.extractedFields.rg);
        if (analysis.extractedFields.name && !name) setName(analysis.extractedFields.name);
        if (analysis.extractedFields.cnh && !cnh && type === 'CNH') setCnh(analysis.extractedFields.cnh);
      }
    } catch (e: any) {
      setError(`Erro ao analisar documento: ${e.message}`);
    } finally {
      setAnalyzingDoc(false);
    }
  };

  const getField = (formName: string, fieldKey: string) => formConfig?.forms?.[formName]?.fields?.find(f => f.key === fieldKey);

  const fCity = getField('driverForm', 'city') || { label: 'Cidade', placeholder: 'São Paulo', enabled: true, required: true };
  const fCnh = getField('driverForm', 'cnh') || { label: 'CNH', placeholder: 'Apenas números', enabled: true, required: false };

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
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300 shadow-sm flex items-start gap-2"><ShieldAlert className="w-5 h-5 shrink-0" /> {error}</div>}

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
                        <button onClick={() => setRiskModalDriver(driver)} className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 cursor-pointer transition-colors text-center">Risco / Pamcary</button>
                        <button onClick={() => setCnhModalDriver(driver)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors text-center">Consultar CNH</button>
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
            <div className="mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5"><Camera className="w-4 h-4 text-emerald-600" /> IA Documental (Opcional)</h3>
              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Faça upload de uma foto da CNH ou RG do motorista. A inteligência artificial irá extrair os dados e preencher o formulário automaticamente se a qualidade permitir.</p>
              
              <DriverUploadArea onUpload={(base64) => analyzeDocument(base64, 'CNH')} accept="image/*" label="Upload CNH/RG para extração inteligente" icon={<UploadCloud className="w-5 h-5" />} />
              
              {analyzingDoc && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Analisando documento e validando autenticidade com IA...</p>
                </div>
              )}

              {documentAnalysis && !analyzingDoc && (
                <div className="mt-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-emerald-600">Extração concluída</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${documentAnalysis.authenticityScore > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Confiança: {documentAnalysis.authenticityScore}%</span>
                  </div>
                  {documentAnalysis.warnings?.length > 0 && (
                    <ul className="mb-2 pl-4 list-disc text-amber-600 space-y-1">
                      {documentAnalysis.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                  <p className="text-[10px] text-slate-500">Os campos extraídos foram aplicados no formulário abaixo.</p>
                </div>
              )}
            </div>

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

      {cnhModalDriver && <DriverCnhModal driver={cnhModalDriver} onClose={() => setCnhModalDriver(null)} onUpdated={load} />}
      {riskModalDriver && <DriverRiskModal driver={riskModalDriver} onClose={() => setRiskModalDriver(null)} />}
    </section>
  );
};
