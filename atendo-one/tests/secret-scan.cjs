const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['node_modules', 'dist', '.git', '.cache']);
const patterns = [
  ['jwt', /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/],
  ['live-key', /sk_live_[A-Za-z0-9]{12,}/],
  ['asaas-key', /aact_(?:prod|hmlg)_[A-Za-z0-9_:-]{24,}/],
  ['bearer-value', /Bearer\s+[A-Za-z0-9._-]{24,}/i],
  ['private-key', /-----BEGIN (?:RSA|OPENSSH|EC|PRIVATE) KEY-----/],
  ['literal-access-token', /access_token\s*[:=]\s*['"][^'"]{20,}['"]/i],
  ['literal-webhook-token', /webhookToken\s*[:=]\s*['"][^'"]{20,}['"]/i],
  ['literal-encryption-key', /CONFIG_ENCRYPTION_KEY\s*[:=]\s*['"][0-9a-f]{64}['"]/i]
];
const findings = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && fs.statSync(full).size < 5 * 1024 * 1024) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [label, regex] of patterns) if (regex.test(text)) findings.push(`${label}:${path.relative(root, full)}`);
    }
  }
}
walk(root);
if (findings.length) {
  console.error(`SECRET_SCAN_FAIL count=${findings.length}`);
  for (const finding of findings) console.error(finding);
  process.exit(1);
}
console.log('SECRET_SCAN_PASS');
