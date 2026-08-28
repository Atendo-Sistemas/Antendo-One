import React, { useEffect, useState } from 'react';
import { Archive, Car, CheckCircle2, FileText, Pencil, Plus, ShieldCheck, X } from 'lucide-react';
import { api } from '../../services/api';
import { BodyType, CompanyVehicle, VehicleStatus, VehicleType } from '../../types';
import { useAuth } from '../../context/AuthContext';

const vehicleTypes: Array<{ value: VehicleType; label: string }> = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'TOCO', label: 'Toco' },
  { value: 'CARRETA', label: 'Carreta' },
  { value: 'BITREM', label: 'Bitrem' },
  { value: 'RODOTREM', label: 'Rodotrem' },
  { value: 'VUC', label: 'VUC' },
  { value: 'FIORINO', label: 'Fiorino' },
  { value: 'UTILITARIO', label: 'Utilitário' },
  { value: 'VAN', label: 'Van' }
];
const bodyTypes: Array<{ value: BodyType; label: string }> = [
  { value: 'BAU', label: 'Baú' },
  { value: 'SIDER', label: 'Sider' },
  { value: 'GRADE_BAIXA', label: 'Grade baixa' },
  { value: 'GRANELEIRO', label: 'Graneleiro' },
  { value: 'REFRIGERADO', label: 'Refrigerado' },
  { value: 'CACAMBA', label: 'Caçamba' },
  { value: 'PLATAFORMA', label: 'Plataforma' },
  { value: 'TANQUE', label: 'Tanque' }
];
const emptyForm = {
  plate: '',
  renavam: '',
  type: 'TRUCK' as VehicleType,
  bodyType: 'BAU' as BodyType,
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
  capacityKg: '',
  ownerName: '',
  ownerCnpj: '',
  registrationState: '',
  crlvNumber: '',
  notes: ''
};
const inputClass = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

export const CompanyVehicleManager: React.FC = () => {
  const { user, tenant } = useAuth();
  const isDemo = user?.accountType === 'TEST' && tenant?.isDemo === true;
  const [vehicles, setVehicles] = useState<CompanyVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CompanyVehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      setVehicles(await api.getCompanyVehicles());
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os veículos próprios.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void loadVehicles(); }, []);

  const setField = (field: keyof typeof emptyForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); setError(null); };
  const openEdit = (vehicle: CompanyVehicle) => {
    setEditing(vehicle);
    setFormOpen(true);
    setForm({
      plate: vehicle.plate || '',
      renavam: vehicle.renavam || '',
      type: vehicle.type,
      bodyType: vehicle.bodyType,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: String(vehicle.year || ''),
      capacityKg: String(vehicle.capacityKg || ''),
      ownerName: vehicle.ownerName || '',
      ownerCnpj: vehicle.ownerCnpj || '',
      registrationState: vehicle.registrationState || '',
      crlvNumber: vehicle.crlvNumber || '',
      notes: vehicle.notes || ''
    });
    setError(null);
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...form,
        year: Number(form.year),
        capacityKg: Number(form.capacityKg || 0)
      };
      if (isDemo) {
        const now = new Date().toISOString();
        const simulatedVehicle = {
          ...payload,
          id: editing?.id || `demo-simulation-vehicle-${Date.now()}`,
          tenantId: tenant?.id || 'tenant-demo-public',
          status: editing?.status || 'ATIVO',
          createdAt: editing?.createdAt || now,
          updatedAt: now
        } as CompanyVehicle;
        setVehicles(current => editing ? current.map(item => item.id === editing.id ? simulatedVehicle : item) : [simulatedVehicle, ...current]);
      } else if (editing) {
        await api.updateCompanyVehicle(editing.id, payload);
        await loadVehicles();
      } else {
        await api.createCompanyVehicle(payload);
        await loadVehicles();
      }
      setEditing(null);
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar o veículo.');
    } finally {
      setSaving(false);
    }
  };
  const handleDeactivate = async (vehicle: CompanyVehicle) => {
    if (isDemo) {
      setVehicles(current => current.map(item => item.id === vehicle.id ? { ...item, status: 'INATIVO', updatedAt: new Date().toISOString() } : item));
      return;
    }
    if (!window.confirm(`Desativar o veículo ${vehicle.plate}? O registro será preservado para fins operacionais e fiscais.`)) return;
    try {
      await api.deleteCompanyVehicle(vehicle.id);
      await loadVehicles();
    } catch (err: any) {
      setError(err.message || 'Não foi possível desativar o veículo.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Car className="w-6 h-6 text-emerald-600" /> Veículos próprios</h1>
          <p className="text-sm text-slate-500 mt-1">{isDemo ? 'Simule o cadastro e a edição de veículos. Nada será salvo no sistema.' : 'Cadastre os veículos da empresa para selecionar a unidade correta em fretes e documentos fiscais.'}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 cursor-pointer"><Plus className="w-4 h-4" /> {isDemo ? 'Simular veículo' : 'Novo veículo próprio'}</button>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 text-xs text-blue-900 dark:text-blue-200 flex gap-3"><ShieldCheck className="w-5 h-5 shrink-0" /><p>Este cadastro é separado dos veículos pertencentes a motoristas parceiros. A desativação não apaga o histórico do veículo.</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">{error}</div>}
      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{isDemo ? 'Simular veículo próprio' : editing ? 'Editar veículo próprio' : 'Cadastrar veículo próprio'}</h2>{<button type="button" onClick={() => { setEditing(null); setFormOpen(false); setForm(emptyForm); }} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs font-semibold">Placa *<input required value={form.plate} onChange={e => setField('plate', e.target.value.toUpperCase())} className={inputClass} placeholder="ABC1D23" /></label>
            <label className="text-xs font-semibold">RENAVAM *<input required value={form.renavam} onChange={e => setField('renavam', e.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Tipo *<select value={form.type} onChange={e => setField('type', e.target.value)} className={inputClass}>{vehicleTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-xs font-semibold">Carroceria *<select value={form.bodyType} onChange={e => setField('bodyType', e.target.value)} className={inputClass}>{bodyTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-xs font-semibold">Marca *<input required value={form.brand} onChange={e => setField('brand', e.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Modelo *<input required value={form.model} onChange={e => setField('model', e.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Ano *<input required type="number" min="1950" max="2100" value={form.year} onChange={e => setField('year', e.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Capacidade (kg) *<input required type="number" min="0" value={form.capacityKg} onChange={e => setField('capacityKg', e.target.value)} className={inputClass} /></label>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4"><p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Dados para documentos fiscais</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><label className="text-xs font-semibold">Proprietário/razão social<input value={form.ownerName} onChange={e => setField('ownerName', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">CNPJ/CPF do proprietário<input value={form.ownerCnpj} onChange={e => setField('ownerCnpj', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">UF de registro<input maxLength={2} value={form.registrationState} onChange={e => setField('registrationState', e.target.value.toUpperCase())} className={inputClass} placeholder="SP" /></label><label className="text-xs font-semibold">Número do CRLV<input value={form.crlvNumber} onChange={e => setField('crlvNumber', e.target.value)} className={inputClass} /></label></div></div>
          <label className="text-xs font-semibold block">Observações internas<textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} className={inputClass} /></label>
          <div className="flex justify-end gap-2"><button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{saving ? 'Preparando...' : isDemo ? 'Visualizar simulação' : editing ? 'Salvar alterações' : 'Cadastrar veículo'}</button></div>
        </form>
      )}
      {loading ? <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">Carregando veículos próprios...</div> : vehicles.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">Nenhum veículo próprio cadastrado.</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{vehicles.map(vehicle => <article key={vehicle.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900 dark:text-white">{vehicle.plate}</h3><p className="text-xs text-slate-500">{vehicle.brand} {vehicle.model} • {vehicle.year}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${vehicle.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{vehicle.status}</span></div><div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300"><span>Tipo: <strong>{vehicle.type}</strong></span><span>Carroceria: <strong>{vehicle.bodyType}</strong></span><span>Capacidade: <strong>{vehicle.capacityKg.toLocaleString('pt-BR')} kg</strong></span><span>RENAVAM: <strong>{vehicle.renavam}</strong></span></div><div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500"><p>Proprietário: {vehicle.ownerName || 'Não informado'}</p><p>UF/CRLV: {vehicle.registrationState || '--'} / {vehicle.crlvNumber || '--'}</p></div><div className="flex justify-end gap-2"><button onClick={() => openEdit(vehicle)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 cursor-pointer"><Pencil className="w-3 h-3" /> Editar</button>{vehicle.status === 'ATIVO' && <button onClick={() => handleDeactivate(vehicle)} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 cursor-pointer"><Archive className="w-3 h-3" /> Desativar</button>}</div></article>)}</div>}
    </section>
  );
};
