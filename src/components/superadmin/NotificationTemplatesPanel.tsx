import React, { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle, Lock, Mail, MessageCircle, Save, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { NotificationTemplate } from '../../types';

interface NotificationTemplatesPanelProps {
  scope?: 'global' | 'tenant';
}

const renderPreview = (template: string): string => String(template || '')
  .replace(/\{nomePlataforma\}/g, 'Atendo One')
  .replace(/\{nomeEmpresa\}/g, 'Transportadora Exemplo')
  .replace(/\{razaoSocial\}/g, 'Transportadora Exemplo Ltda.')
  .replace(/\{cnpjEmpresa\}/g, '00.000.000/0001-00')
  .replace(/\{emailEmpresa\}/g, 'contato@empresa.exemplo')
  .replace(/\{telefoneEmpresa\}/g, '(11) 99999-0000')
  .replace(/\{cidadeEmpresa\}/g, 'São Paulo')
  .replace(/\{estadoEmpresa\}/g, 'SP')
  .replace(/\{empresa\}/g, 'Transportadora Exemplo')
  .replace(/\{nome\}/g, 'Pessoa destinatária')
  .replace(/\{codigo\}/g, '123456')
  .replace(/\{validadeMinutos\}/g, '5')
  .replace(/\{codigoFrete\}/g, 'FRT-0001')
  .replace(/\{origem\}/g, 'São Paulo/SP')
  .replace(/\{destino\}/g, 'Campinas/SP')
  .replace(/\{valor\}/g, 'R$ 1.850,00')
  .replace(/\{plano\}/g, 'Profissional')
  .replace(/\{status\}/g, 'Atualizado')
  .replace(/\{nomeMotorista\}/g, 'Motorista Exemplo')
  .replace(/\{motivo\}/g, 'Exemplo de motivo')
  .replace(/\{email\}/g, 'destinatario@exemplo.com')
  .replace(/\{telefone\}/g, '(11) 98888-0000')
  .replace(/\{link\}/g, 'https://gestor.atendo.log.br');

export const NotificationTemplatesPanel: React.FC<NotificationTemplatesPanelProps> = ({ scope = 'global' }) => {
  const { tenant } = useAuth();
  const isTenantScope = scope === 'tenant';
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [moduleStatus, setModuleStatus] = useState<{ plan: string; billingStatus: string; canUseOwnNumber: boolean } | null>(null);
  const selected = templates.find(template => template.id === selectedId) || templates[0];
  const isOtpTemplate = selected?.eventKey === 'LOGIN_OTP';
  const otpPreview = isOtpTemplate ? renderPreview(selected?.whatsappBody || '') : '';
  const previewBody = selected ? renderPreview(selected.whatsappBody) : '';
  const channelsReadOnly = isTenantScope || isOtpTemplate;

  useEffect(() => {
    void load();
  }, [isTenantScope, tenant?.id]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const load = async () => {
    setLoading(true);
    setNotice(null);
    try {
      let data: NotificationTemplate[];
      if (isTenantScope) {
        if (!tenant?.id) throw new Error('Empresa não identificada.');
        const status = await api.getNotificationModuleStatus(tenant.id);
        setModuleStatus(status);
        if (!status.canUseOwnNumber) {
          setTemplates([]);
          setSelectedId('');
          return;
        }
        data = await api.getTenantNotificationTemplates();
      } else {
        setModuleStatus(null);
        data = await api.getNotificationTemplates();
      }
      setTemplates(data);
      if (data[0]) setSelectedId(current => data.some(item => item.id === current) ? current : data[0].id);
    } catch (error: any) {
      setNotice({ text: error.message || 'Não foi possível carregar os modelos.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const updateSelected = (patch: Partial<NotificationTemplate>) => {
    if (!selected) return;
    setTemplates(items => items.map(item => item.id === selected.id ? { ...item, ...patch } : item));
  };

  const save = async () => {
    if (!selected || selected.systemLocked || selected.editable === false) return;
    setSaving(true);
    setNotice(null);
    try {
      const saved = isTenantScope
        ? await api.updateTenantNotificationTemplate(selected.id, selected)
        : await api.updateNotificationTemplate(selected.id, selected);
      setTemplates(items => items.map(item => item.id === saved.id ? saved : item));
      setNotice({ text: isTenantScope ? 'Modelo da empresa salvo e aplicado aos próximos envios.' : 'Modelo salvo e aplicado aos próximos envios.' });
    } catch (error: any) {
      setNotice({ text: error.message || 'Não foi possível salvar o modelo.', error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-xs text-slate-500">Carregando modelos de mensagens...</div>;

  if (isTenantScope && moduleStatus && !moduleStatus.canUseOwnNumber) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100"><h3 className="font-black">Personalização por empresa indisponível</h3><p className="mt-2 text-xs leading-relaxed">A edição de mensagens de e-mail e WhatsApp fica disponível quando o módulo de WhatsApp com número próprio estiver contratado e com pagamento ativo. O telefone SaaS continua usando os modelos globais definidos pelo Super Admin.</p></div>;
  }

  return <>
    {notice && <div role="alert" className={`fixed bottom-5 right-5 z-[70] w-[min(92vw,420px)] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${notice.error ? 'border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/95 dark:text-rose-100' : 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/95 dark:text-emerald-100'}`}>
      <div className="flex items-start gap-3">{notice.error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />}<p className="flex-1 text-sm font-bold leading-snug">{notice.text}</p><button type="button" onClick={() => setNotice(null)} aria-label="Fechar confirmação" className="rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100"><X className="h-4 w-4" /></button></div>
    </div>}
    <div className="space-y-6">
    <div className="border-b border-slate-100 dark:border-slate-800 pb-3"><h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-500" /> {isTenantScope ? 'Mensagens da empresa' : 'Mensagens e notificações'}</h3><p className="text-[11px] text-slate-400 mt-1">{isTenantScope ? 'Personalize os textos enviados pelo e-mail corporativo e pelo número WhatsApp da sua empresa. O conteúdo fica isolado neste tenant.' : 'Edite as mensagens operacionais que podem ser enviadas por e-mail, WhatsApp e dentro da plataforma. Mensagens técnicas de erro são protegidas.'}</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-5">
      <aside className="space-y-1 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-800/30">{templates.map(template => <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 ${selected?.id === template.id ? 'bg-emerald-600 text-white' : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}><span>{template.label}</span>{template.systemLocked ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <span className={`w-2 h-2 rounded-full ${template.source === 'TENANT' || template.enabled ? 'bg-emerald-400' : 'bg-slate-300'}`} />}</button>)}</aside>
      {selected ? <div className="space-y-4">
        <div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-black text-slate-800 dark:text-white">{selected.label}</h4><p className="text-xs text-slate-500 mt-1">{selected.description}</p></div><div className="flex items-center gap-2">{isTenantScope && <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${selected.source === 'TENANT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{selected.source === 'TENANT' ? 'Personalizado pela empresa' : 'Herdado do SaaS'}</span>}{isOtpTemplate && <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">Autenticação essencial</span>}{selected.systemLocked && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-500"><Lock className="w-3 h-3" /> Protegida</span>}</div></div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
          <div><p className="text-xs font-black text-slate-800 dark:text-white">Canais desta mensagem</p><p className="text-[10px] text-slate-500 mt-1">{isTenantScope ? 'Os canais seguem o plano global e o consentimento do destinatário; a empresa edita apenas o conteúdo.' : 'Ative cada canal para que os próximos envios sejam registrados separadamente no ledger de entregas.'}</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" disabled={selected.systemLocked || channelsReadOnly} checked={selected.enabled} onChange={e => updateSelected({ enabled: e.target.checked })} className="rounded text-emerald-600" />Notificação ativa</label>
            <button type="button" disabled={selected.systemLocked || channelsReadOnly} aria-pressed={selected.channels.email} onClick={() => updateSelected({ channels: { ...selected.channels, email: !selected.channels.email } })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-colors disabled:opacity-50 ${selected.channels.email ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><Mail className="w-4 h-4 shrink-0" /><span><span className="block">Rastrear por e-mail</span><span className="block text-[10px] font-medium opacity-75">{selected.channels.email ? 'Ativo nos próximos envios' : 'Desativado'}</span></span></button>
            <button type="button" disabled={selected.systemLocked || channelsReadOnly} aria-pressed={selected.channels.whatsapp} onClick={() => updateSelected({ channels: { ...selected.channels, whatsapp: !selected.channels.whatsapp } })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-colors disabled:opacity-50 ${selected.channels.whatsapp ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><MessageCircle className="w-4 h-4 shrink-0" /><span><span className="block">Rastrear por WhatsApp</span><span className="block text-[10px] font-medium opacity-75">{selected.channels.whatsapp ? 'Ativo nos próximos envios' : 'Desativado'}</span></span></button>
          </div>
          <p className="text-[10px] text-slate-500">{isOtpTemplate ? 'O código de acesso é uma mensagem essencial do login: o WhatsApp permanece ativo e o modelo precisa manter {codigo} e {validadeMinutos}.' : isTenantScope ? 'A identidade da empresa pode ser inserida com as variáveis permitidas abaixo. O sistema mantém o isolamento por tenant.' : 'O rastreamento registra status, tentativas e erro técnico sanitizado; não armazena número, e-mail nem o conteúdo da mensagem.'}</p>
        </div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Assunto do e-mail<input disabled={selected.systemLocked} value={selected.emailSubject} onChange={e => updateSelected({ emailSubject: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm disabled:opacity-60" /></label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Mensagem do e-mail<textarea disabled={selected.systemLocked} rows={5} value={selected.emailBody} onChange={e => updateSelected({ emailBody: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm disabled:opacity-60" /></label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Mensagem do WhatsApp<textarea disabled={selected.systemLocked} rows={4} value={selected.whatsappBody} onChange={e => updateSelected({ whatsappBody: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm disabled:opacity-60" /></label>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-[10px] text-slate-500"><strong>Variáveis disponíveis:</strong> {selected.variables.map(variable => `{${variable}}`).join(', ')}{isTenantScope && <><br /><strong>Dados da empresa:</strong> {['nomeEmpresa', 'razaoSocial', 'cnpjEmpresa', 'emailEmpresa', 'telefoneEmpresa', 'cidadeEmpresa', 'estadoEmpresa'].map(variable => `{${variable}}`).join(', ')}</>}</div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3 space-y-2"><p className="text-xs font-black text-slate-800 dark:text-white">Prévia segura da mensagem WhatsApp</p><p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{isOtpTemplate ? otpPreview : previewBody}</p><p className="text-[10px] text-slate-500">A prévia usa dados fictícios e não envia WhatsApp. O conteúdo real só será enviado pelo canal contratado, com consentimento e regras do sistema.</p></div>
        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4"><button type="button" disabled={saving || selected.systemLocked || selected.editable === false} onClick={save} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar modelo'}</button></div>
      </div> : <div className="py-12 text-center text-xs text-slate-500"><CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />Nenhum modelo disponível.</div>}
    </div>
    </div>
  </>;
};
