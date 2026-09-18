import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { VisitAnalyticsResponse, VisitAnalyticsRow } from '../../types';

const rowLabel = (row: VisitAnalyticsRow) => row.label || 'Não informado';

const Ranking: React.FC<{ title: string; rows: VisitAnalyticsRow[]; empty: string }> = ({ title, rows, empty }) => {
  const max = Math.max(...rows.map(row => row.visits), 1);
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
      <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
    </div>
    {rows.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">{empty}</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.slice(0, 8).map(row => <div key={`${row.label}-${row.visits}`} className="px-5 py-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{rowLabel(row)}</span>
          <strong className="shrink-0 text-slate-900 dark:text-white">{row.visits}</strong>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max((row.visits / max) * 100, 4)}%` }} /></div>
      </div>)}
    </div>}
  </section>;
};

export const VisitAnalyticsPanel: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<VisitAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getVisitAnalytics(days));
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar as métricas de visitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const topSource = useMemo(() => data?.bySource?.[0]?.label || '—', [data]);
  const topPage = useMemo(() => data?.byPath?.[0]?.label || '—', [data]);
  const totalDays = data?.daily?.length || 0;

  return <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider"><BarChart3 className="w-4 h-4" /> Analytics próprio</div>
        <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">Visitas e origem dos acessos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">Entenda quais páginas e canais despertam interesse para melhorar conteúdo, campanhas, navegação e conversões. A coleta é agregada e este painel é exclusivo do Super Admin.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"><CalendarDays className="w-4 h-4" /><span>Período</span><select value={days} onChange={event => setDays(Number(event.target.value))} className="bg-transparent font-black outline-none"><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option><option value={180}>180 dias</option></select></label>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
      </div>
    </div>

    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-5 text-white"><p className="text-[10px] font-black uppercase tracking-wider text-slate-300">Visitas no período</p><p className="mt-2 text-2xl font-black">{loading ? '—' : data?.totalVisits || 0}</p><p className="mt-1 text-xs text-slate-300">Acessos às páginas públicas.</p></div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dias com registros</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : totalDays}</p><p className="mt-1 text-xs text-slate-500">Dias no intervalo escolhido.</p></div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Principal origem</p><p className="mt-2 truncate text-lg font-black text-emerald-700 dark:text-emerald-400">{loading ? '—' : topSource}</p><p className="mt-1 text-xs text-slate-500">Fonte agregada com mais acessos.</p></div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Página mais acessada</p><p className="mt-2 truncate text-lg font-black text-slate-900 dark:text-white">{loading ? '—' : topPage}</p><p className="mt-1 text-xs text-slate-500">Rota pública com maior volume.</p></div>
    </div>

    {loading ? <div className="rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-12 text-center text-sm text-slate-500">Carregando métricas…</div> : <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Ranking title="De onde vêm os visitantes" rows={data?.bySource || []} empty="Ainda não há visitas registradas." />
        <Ranking title="Páginas de entrada/acesso" rows={data?.byPath || []} empty="Ainda não há páginas registradas." />
        <Ranking title="Campanhas UTM" rows={data?.byCampaign || []} empty="Nenhuma campanha UTM foi identificada." />
        <Ranking title="Referenciadores" rows={data?.byReferrer || []} empty="Nenhum referenciador foi identificado." />
        <Ranking title="Dispositivos" rows={data?.byDevice || []} empty="Ainda não há dados de dispositivo." />
        <Ranking title="Países informados pelo proxy" rows={data?.byCountry || []} empty="Nenhum país foi informado." />
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800"><h3 className="font-black text-slate-900 dark:text-white">Evolução diária</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Data</th><th className="px-5 py-3 text-right">Visitas</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(data?.daily || []).slice().reverse().slice(0, 31).map(row => <tr key={row.label}><td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.label}</td><td className="px-5 py-3 text-right font-black text-slate-900 dark:text-white">{row.visits}</td></tr>)}</tbody></table></div>
      </section>
    </>}

    <div className="flex gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200"><ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /><p><strong>Privacidade:</strong> o rastreador não armazena IP completo, não cria fingerprint, não registra formulários, não usa cookies próprios e não mostra dados individuais. Os agrupamentos técnicos são mantidos por no máximo 366 dias para entender a origem e melhorar o serviço.</p></div>
  </div>;
};
