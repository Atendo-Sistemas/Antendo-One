import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { sanitizeRichHtml } from '../../utils/sanitizeHtml';
import 'react-quill-new/dist/quill.snow.css';

const helpRoleForUser = (role: string) => {
  if (['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(role)) return 'ADMIN';
  if (role === 'SUPERVISOR') return 'SUPERVISOR';
  if (role === 'MOTORISTA') return 'DRIVER';
  if (role === 'USUARIO') return 'USER';
  return role;
};

export const HelpPanel: React.FC<{ role: string }> = ({ role }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const helpRole = helpRoleForUser(role);
  const fallbackContent = '<h1>Manual do Atendo One</h1><p>Consulte os módulos liberados para o seu perfil e procure o administrador da empresa quando precisar de acesso ou orientação.</p><h2>Segurança</h2><p>Mantenha seus dados atualizados, não compartilhe códigos de acesso e altere suas preferências de notificações quando necessário.</p>';

  useEffect(() => {
    loadContent();
  }, [helpRole]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await api.getHelp();
      const manual = data.find((h: { role: string, content: string }) => h.role === helpRole);
      setContent(manual?.content?.trim() || fallbackContent);
    } catch (err) {
      console.error('Erro ao carregar ajuda:', err);
      setContent(fallbackContent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-4xl mx-auto">
      <h2 className="text-xl font-black flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-emerald-500" /> Manual do Sistema
      </h2>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Carregando...</div>
      ) : (
        <div className="ql-snow">
          <div 
            className="ql-editor text-sm text-slate-600 dark:text-slate-300 max-w-none px-0"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }} 
          />
        </div>
      )}
    </div>
  );
};
