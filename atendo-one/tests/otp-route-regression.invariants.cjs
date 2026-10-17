const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const client = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');

assert.match(client, /async verifyOtp\(phone: string, code: string\)/);
assert.match(client, /verifyOtp[\s\S]*?request<\{ token: string; refreshToken: string; user: User \}>\('\/auth\/verify-otp'/);
assert.doesNotMatch(client, /request<\{ token: string; refreshToken: string; user: User \}>\('\/auth\/verify'/);
assert.match(server, /apiRouter\.post\('\/auth\/verify-otp'/);

console.log('OTP_ROUTE_REGRESSION_PASS');
