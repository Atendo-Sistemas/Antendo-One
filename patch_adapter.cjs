const fs = require('fs');

let content = fs.readFileSync('server/db/sqlAdapter.ts', 'utf-8');

const search = `      if (fs.existsSync(schemaPath)) {
        sql = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        return {
          success: false,
          message: \`Arquivo de schema não encontrado em: \${schemaPath}\`
        };
      }`;

const replace = `      if (fs.existsSync(schemaPath)) {
        sql = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        return {
          success: false,
          message: \`Arquivo de schema não encontrado em: \${schemaPath}\`
        };
      }
      
      const migrationsDir = path.join(process.cwd(), 'server', 'db', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          sql += '\\n\\n' + fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        }
      }
`;

content = content.replace(search, replace);
fs.writeFileSync('server/db/sqlAdapter.ts', content);
console.log('patched adapter');
