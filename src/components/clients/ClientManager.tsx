import React, { useEffect, useState } from 'react';
import { clientApi } from '../../services/api';
import { Client } from '../../types';
import { AddressAutocomplete } from '../common/AddressAutocomplete';

const empty = { cnpj: '', legalName: '', tradeName: '', email: '', phone: '', address: '', number: '', complement: '', neighborhood: '', zipCode: '', city: '', state: '' };

export const ClientManager: React.FC = () => {
  const [items, setItems] = useState<Client[]>([]);
  const [draft, setDraft] = useState<any>(empty);
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const refresh = async (term = search) => { 
    setLoading(true); 
    try { setItems(await clientApi.list(term)); } 
    catch (e: any) { setError(e.message); } 
    finally { setLoading(false); } 
  };
  
  useEffect(() => { void refresh(''); }, []);
  
  const lookup = async () => { 
    try { 
      setLookupLoading(true); 
      setError(''); 
      const result = await clientApi.lookupCnpj(draft.cnpj); 
      const data = result.data; 
      const e = data.estabelecimento || data; 
      setDraft({ 
        ...draft, 
        cnpj: result.cnpj, 
        legalName: data.razao_social || '', 
        tradeName: e.nome_fantasia || '', 
        email: e.email || '', 
        phone: e.telefone1 || '', 
        address: e.logradouro || '', 
        number: e.numero || '', 
        complement: e.complemento || '', 
        neighborhood: e.bairro || '', 
        zipCode: e.cep || '', 
        city: e.cidade?.nome || '', 
        state: e.estado?.sigla || '', 
        source: 'CNPJ_WS', 
        cnpjData: data 
      }); 
    } 
    catch (e: any) { setError(e.message); } 
    finally { setLookupLoading(false); } 
  };
  
  const save = async () => { 
    try { 
      setError(''); 
      const item = selected ? await clientApi.update(selected.id, draft) : await clientApi.create(draft); 
      setSelected(item); 
      setDraft(item); 
      await refresh(); 
    } 
    catch (e: any) { setError(e.message); } 
  };
  
  const archive = async () => { 
    if (!selected) return; 
    try { 
      await clientApi.remove(selected.id); 
      setSelected(null); 
      setDraft(empty); 
      await refresh(); 
    } 
    catch (e: any) { setError(e.message); } 
  };
  
  const field = (key: string, label: string) => (
    <label className="text-sm font-semibold">{label}
      <input value={draft[key] || ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
    </label>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Cadastro de Clientes</p>
          <h1 className="text-2xl font-black">Clientes e empresas</h1>
        </div>
        <button onClick={() => { setSelected(null); setDraft(empty); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-indigo-700">Novo cliente</button>
      </div>
      
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void refresh(); }} placeholder="Buscar CNPJ ou razão social" className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm" />
            <button onClick={() => void refresh()} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold cursor-pointer hover:bg-slate-50">Buscar</button>
          </div>
          {loading ? (
            <p>Carregando...</p>
          ) : items.map(item => (
            <button key={item.id} onClick={() => { setSelected(item); setDraft(item); }} className={`w-full rounded-xl border p-3 text-left cursor-pointer transition-colors ${selected?.id === item.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:bg-slate-50'}`}>
              <div className="font-bold">{item.legalName}</div>
              <div className="text-xs text-slate-500">{item.cnpj} · {item.city || 'Sem cidade'}</div>
            </button>
          ))}
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex gap-2">
            <input value={draft.cnpj || ''} onChange={e => setDraft({ ...draft, cnpj: e.target.value })} placeholder="CNPJ" className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            <button onClick={() => void lookup()} disabled={lookupLoading} className="rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white disabled:opacity-50 cursor-pointer hover:bg-emerald-700">{lookupLoading ? 'Consultando…' : 'Consultar CNPJ.ws'}</button>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            {field('legalName', 'Razão social')}
            {field('tradeName', 'Nome fantasia')}
            {field('email', 'E-mail')}
            {field('phone', 'Telefone')}
            
            <label className="text-sm font-semibold">
              Logradouro (Endereço)
              <AddressAutocomplete 
                value={draft.address || ''} 
                className="mt-1"
                placeholder="Buscar rua, avenida..."
                onSelect={(data) => setDraft((prev: any) => ({ 
                  ...prev, 
                  address: data.address,
                  number: data.number || prev.number,
                  neighborhood: data.neighborhood || prev.neighborhood,
                  zipCode: data.zipCode || prev.zipCode,
                  city: data.city || prev.city,
                  state: data.state || prev.state
                }))} 
              />
            </label>
            
            {field('number', 'Número')}
            {field('complement', 'Complemento')}
            {field('neighborhood', 'Bairro')}
            {field('zipCode', 'CEP')}
            {field('city', 'Cidade')}
            {field('state', 'UF')}
          </div>
          
          <div className="mt-5 flex gap-2">
            <button onClick={() => void save()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-indigo-700">Salvar cliente</button>
            {selected && <button onClick={() => void archive()} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 cursor-pointer hover:bg-red-50">Arquivar</button>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientManager;
