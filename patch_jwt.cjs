const fs = require('fs');

let content = fs.readFileSync('server/api.ts', 'utf-8');

const search = "const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';";
const replace = `
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'super_secret_key_change_me_in_production')) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing or insecure in production.');
  process.exit(1);
}
const SAFE_JWT_SECRET = JWT_SECRET || 'super_secret_key_change_me_in_production';
`;

content = content.replace(search, replace);
content = content.replace(/JWT_SECRET/g, 'SAFE_JWT_SECRET');
// Undo the replacements in the checking logic itself
content = content.replace("const SAFE_JWT_SECRET = process.env.SAFE_JWT_SECRET;", "const JWT_SECRET = process.env.JWT_SECRET;");
content = content.replace("if (process.env.NODE_ENV === 'production' && (!SAFE_JWT_SECRET || SAFE_JWT_SECRET === 'super_secret_key_change_me_in_production')) {", "if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'super_secret_key_change_me_in_production')) {");
content = content.replace("const SAFE_SAFE_JWT_SECRET = SAFE_JWT_SECRET || 'super_secret_key_change_me_in_production';", "const SAFE_JWT_SECRET = JWT_SECRET || 'super_secret_key_change_me_in_production';");

fs.writeFileSync('server/api.ts', content);
console.log('patched JWT');
