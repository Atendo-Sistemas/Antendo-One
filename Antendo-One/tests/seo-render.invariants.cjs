const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const rootBody = index.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
assert.match(rootBody, /<div id="root"><\/div>/, 'index.html deve iniciar com um root vazio.');
assert.doesNotMatch(rootBody, /Elo Log — Gestão e publicação de fretes|Plataforma de gestão logística para transportadoras|Fretes de mercadorias disponíveis/, 'index.html não deve conter o fallback SEO como texto no body.');
assert.match(index, /<meta name="description"/, 'A descrição SEO deve permanecer no head.');
assert.match(server, /const initialBody = req\.path === '\/' \? '' : seoBody;/, 'A home deve receber root vazio no SSR.');
assert.match(server, /Páginas públicas de conteúdo continuam com SSR real/, 'Conteúdo público deve continuar com SSR.');
assert.match(server, /<title>\$\{escapeHtml\(title\)\}<\/title>/, 'O título deve continuar sendo gerado no head.');
assert.doesNotMatch(server, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/, 'A correção não pode usar ocultação por CSS.');
console.log('SEO_RENDER_INVARIANTS_OK');
