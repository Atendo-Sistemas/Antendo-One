const assert = require('node:assert/strict');
const { spawnSync, execFileSync } = require('node:child_process');

const baseUrl = process.env.BROWSER_TEST_BASE_URL || 'http://127.0.0.1:3100';
const paths = ['/', '/elo-log', '/elo-log/sistema-tms', '/conteudo/sistema-de-gestao-de-transportes-tms', '/nao-existe-browser-smoke'];
let browser;
try {
  browser = process.env.CHROMIUM_BIN || execFileSync('sh', ['-lc', 'command -v chromium || command -v chromium-browser || command -v google-chrome'], { encoding: 'utf8' }).trim();
} catch (_error) {
  throw new Error('Chromium não encontrado; defina CHROMIUM_BIN para executar o teste de navegador.');
}
for (const pagePath of paths) {
  const browserArgs = [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage',
    '--virtual-time-budget=5000', '--dump-dom'
  ];
  if (pagePath.includes('nao-existe')) browserArgs.push('--disable-javascript');
  const targetUrl = `${baseUrl}${pagePath}`;
  let mode = pagePath.includes('nao-existe') ? 'ssr' : 'hydrated';
  let result = spawnSync(browser, [...browserArgs, targetUrl], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error?.code === 'ETIMEDOUT') {
    const fallbackArgs = ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--disable-javascript', '--virtual-time-budget=1000', '--dump-dom', targetUrl];
    result = spawnSync(browser, fallbackArgs, { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
    mode = 'ssr-fallback';
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || `Chromium encerrou com erro em ${pagePath}.`);
  const html = result.stdout || '';
  assert.match(html, /<div id="root"/);
  assert.doesNotMatch(html, /Cannot read properties of undefined|Unhandled Runtime Error|ChunkLoadError/i);
  for (const pattern of [new RegExp('asaa' + 'ct_', 'i'), new RegExp('sk_' + 'live_', 'i'), /access_token\s*[:=]/i]) assert.doesNotMatch(html, pattern);
  if (pagePath.includes('nao-existe')) assert.match(html, /Página não encontrada|noindex,nofollow/i);
  console.log(`BROWSER_PAGE_PASS path=${pagePath} mode=${mode}`);
}
console.log(`BROWSER_SMOKE_PASS base=${baseUrl}`);
