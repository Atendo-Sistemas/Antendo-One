import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Search, ShieldCheck, UserRoundSearch } from 'lucide-react';
import { api } from '../../services/api';

type DirectoryDriver = {
  id: string;
  name: string;
  city: string;
  state: string;
  cnhCategory: string;
  companyLinkStatus: 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'BLOQUEADO' | null;
};

export const DriverDirectoryPanel: React.FC<{ onOpenApprovals: () => void }> = ({ onOpenApprovals }) => {
  const [drivers, setDrivers] = useState<DirectoryDriver[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setDrivers(await api.getDriverDirectory(search.trim(), category));
    } catch (err: any) {
      setError(err.message || 'Não foi possível consultar o catálogo de motoristas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const requestEvaluation = async (driverId: string) => {
    try {
      setBusyId(driverId);
      setError('');
      await api.requestDriverEvaluation(driverId);
      setDrivers(current => current.map(driver => driver.id === driverId ? { ...driver, companyLinkStatus: 'PENDENTE' } : driver));
    } catch (err: any) {
      setError(err.message || 'Não foi possível solicitar a avaliação deste motorista.');
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (status: DirectoryDriver['companyLinkStatus']) => status === 'APROVADO'
    ? 'Apto nesta empresa'
    : status === 'RECUSADO'
      ? 'Não apto nesta empresa'
      : status === 'BLOQUEADO'
        ? 'Bloqueado nesta empresa'
        : status === 'PENDENTE'
          ? 'Avaliação pendente'
          : '';

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Gestão de motoristas</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white"><UserRoundSearch className="h-6 w-6" /> Banco de motoristas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">Consulte perfis que autorizaram sua exibição. Para acessar os dados de contato e documentos, solicite a avaliação; a decisão de aptidão vale apenas para sua empresa.</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); void load(); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_180px_auto]">
        <label className="relative"><span className="sr-only">Buscar motorista</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, cidade ou UF" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
        <label><span className="sr-only">Categoria da CNH</span><select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Todas as categorias</option>{['B', 'C', 'D', 'E'].map(value => <option key={value} value={value}>CNH {value}</option>)}</select></label>
        <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Search className="h-4 w-4" /> Buscar</button>
      </form>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
      <div className="space-y-3">
        {loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Carregando motoristas...</p> : drivers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><ShieldCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Nenhum perfil disponível</p><p className="mt-1 text-xs text-slate-500">Novos motoristas poderão aparecer quando autorizarem a exibição no catálogo.</p></div>
        ) : drivers.map(driver => (
          <article key={driver.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-extrabold text-slate-900 dark:text-white">{driver.name}</h2><p className="mt-1 text-xs text-slate-500">{driver.city || 'Cidade não informada'}/{driver.state || '--'} · CNH {driver.cnhCategory || '--'}</p>{driver.companyLinkStatus && <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${driver.companyLinkStatus === 'APROVADO' ? 'text-emerald-700 dark:text-emerald-300' : driver.companyLinkStatus === 'RECUSADO' || driver.companyLinkStatus === 'BLOQUEADO' ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>{driver.companyLinkStatus === 'PENDENTE' ? <Clock3 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}{statusLabel(driver.companyLinkStatus)}</p>}</div>
            {driver.companyLinkStatus === 'PENDENTE' ? <button type="button" onClick={onOpenApprovals} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:text-amber-300">Ver avaliação</button> : driver.companyLinkStatus === 'APROVADO' || driver.companyLinkStatus === 'BLOQUEADO' ? null : <button type="button" disabled={busyId === driver.id} onClick={() => void requestEvaluation(driver.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{busyId === driver.id ? 'Enviando...' : driver.companyLinkStatus === 'RECUSADO' ? 'Solicitar nova avaliação' : 'Solicitar avaliação'}</button>}
          </article>
        ))}
      </div>
      <p className="flex items-start gap-2 text-[11px] text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />O catálogo mostra apenas nome, cidade, UF e categoria da CNH. Dados pessoais e documentos só são apresentados durante a análise do vínculo solicitado pela empresa.</p>
    </section>
  );
};
