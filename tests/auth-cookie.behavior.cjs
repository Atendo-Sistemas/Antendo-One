const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 38000 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'test', PORT: String(port), DISABLE_HMR: 'true' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', chunk => { output += chunk.toString(); });
child.stderr.on('data', chunk => { output += chunk.toString(); });

const waitForServer = async () => {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Servidor não iniciou: ${output.slice(-1000)}`);
};

const cookieValue = (setCookies, name) => setCookies.map(value => value.split(';', 1)[0]).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);

(async () => {
  try {
    await waitForServer();
    const demo = await fetch(`http://127.0.0.2:${port}/api/auth/demo-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const demoBody = await demo.text();
    assert.equal(demo.status, 200, demoBody);
    const setCookies = demo.headers.getSetCookie();
    const access = cookieValue(setCookies, 'atendo_access');
    const csrf = cookieValue(setCookies, 'atendo_csrf');
    assert.ok(access && csrf);
    assert.match(setCookies.find(cookie => cookie.startsWith('atendo_access=')), /HttpOnly/);
    assert.match(setCookies.find(cookie => cookie.startsWith('atendo_access=')), /SameSite=Lax/);
    assert.ok(!demoBody.includes('atendo_access'));

    const cookieHeader = `atendo_access=${access}`;
    const rejected = await fetch(`http://127.0.0.2:${port}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookieHeader, 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.10' } });
    assert.equal(rejected.status, 403);

    const accepted = await fetch(`http://127.0.0.2:${port}/api/auth/logout`, { method: 'POST', headers: { Cookie: `${cookieHeader}; atendo_csrf=${csrf}`, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.11' } });
    assert.equal(accepted.status, 200);
    console.log('AUTH_COOKIE_BEHAVIOR_PASS');
  } finally {
    child.kill('SIGTERM');
  }
})().catch(error => {
  console.error('AUTH_COOKIE_BEHAVIOR_FAIL', error.message);
  child.kill('SIGTERM');
  process.exitCode = 1;
});
