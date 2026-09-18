import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { stripLeadingHeading } from '../../utils/sanitizeHtml';

export const PrivacyPolicy: React.FC = () => {
  const [content, setContent] = useState<any | null>(null);
  useEffect(() => { api.getRegistrationLegalContent('politica-de-privacidade').then(setContent).catch(() => undefined); }, []);
  return <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 max-h-[65vh] overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">Política de Privacidade</h2>
    {content?.metaDescription && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{content.metaDescription}</p>}
    {content ? <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: stripLeadingHeading(content.content) }} /> : <p className="text-sm text-slate-500">Carregando conteúdo atualizado…</p>}
  </div>;
};
