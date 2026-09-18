import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'address', 'article', 'aside', 'blockquote', 'br', 'code', 'del', 'details', 'div',
  'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'li', 'main', 'ol', 'p', 'pre', 'section', 'small', 'span', 'strong', 'summary',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
];

const allowedAttributes: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': ['class'],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height']
};

/**
 * Sanitiza HTML armazenado ou fornecido por usuário antes de persistir ou renderizar.
 * Não permite scripts, eventos, style/data attributes, formulários ou conteúdo embutido.
 */
export const sanitizeServerHtml = (value: unknown): string => sanitizeHtml(String(value || ''), {
  allowedTags,
  allowedAttributes,
  allowedSchemes: ['https', 'mailto'],
  allowedSchemesByTag: {
    a: ['https', 'mailto'],
    img: ['https']
  },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true
});

export const sanitizeServerText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
