import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'u', 'ul'
];

const ALLOWED_ATTR = ['alt', 'height', 'href', 'rel', 'src', 'target', 'title', 'width'];

export function sanitizeRichHtml(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https):|(?:\/(?!\/)|#))/i,
    USE_PROFILES: { html: true }
  });
}

export function stripLeadingHeading(value: unknown): string {
  return sanitizeRichHtml(value).replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '');
}
