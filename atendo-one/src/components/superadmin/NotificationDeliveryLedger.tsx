import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { NotificationDelivery } from '../../types';

const statusClass: Record<string, string> = {
  ENVIADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  FALHOU: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  PENDENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  IGNORADO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
};

export const NotificationDeliveryLedger: React.FC = () => {
  const [items, setItems] = useState<NotificationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api.getNotificationDeliveries(100));
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar o histórico de entregas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return <section className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> Histórico de entregas</h3>
        <p className="text-[11px] text-slate-500 mt-1">Auditoria por canal sem exibir telefone, e-mail, conteúdo ou identificador externo do destinatário.</p>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
    </div>
    {error && <div className="mx-4 mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-2.5">Evento</th><th className="px-4 py-2.5">Canal</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Tentativas</th><th className="px-4 py-2.5">Atualizado</th></tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => <tr key={item.id} className="text-slate-700 dark:text-slate-200"><td className="px-4 py-3 font-semibold">{item.eventKey}</td><td className="px-4 py-3">{item.channel}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${statusClass[item.status] || statusClass.IGNORADO}`}>{item.status}</span></td><td className="px-4 py-3">{item.attempts}</td><td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleString('pt-BR')}</td></tr>)}
          {!loading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhuma entrega registrada ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
};
