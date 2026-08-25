import fs from 'fs';

let content = fs.readFileSync('server/api.ts', 'utf-8');

// 1. Add middleware
const middlewareCode = `
// Read-only / Test account Middleware
apiRouter.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const excludePaths = [
      '/auth/login',
      '/auth/request-otp',
      '/auth/verify-otp',
      '/auth/register-company',
      '/auth/verify-registration',
      '/auth/register-driver'
    ];
    if (excludePaths.includes(req.path)) {
      return next();
    }

    if (isTestOrDemoUser(req.user)) {
      return res.status(403).json({ 
        code: 'READ_ONLY_TEST_ACCOUNT',
        error: 'Esta conta de teste é somente leitura. Perfis criados para teste ou demonstração não possuem permissão para realizar operações de gravação ou alteração no sistema.'
      });
    }
  }
  next();
});
`;

content = content.replace('apiRouter.use(authMiddleware);', 'apiRouter.use(authMiddleware);\n' + middlewareCode);

// 2. Fix register-company (newUser)
content = content.replace(
  "status: 'PENDENTE', // Crucial: Starts as PENDENTE\n    password: hashedPassword,",
  "status: 'PENDENTE',\n    accountType: 'REAL',\n    readOnly: false,\n    password: hashedPassword,"
);

// 3. Fix register-driver (newUser)
content = content.replace(
  "role: 'MOTORISTA',\n    status: 'ATIVO',\n    password: hashedPassword,",
  "role: 'MOTORISTA',\n    status: 'ATIVO',\n    accountType: 'REAL',\n    readOnly: false,\n    password: hashedPassword,"
);

// 4. Fix POST /users (newUser)
content = content.replace(
  "status: 'ATIVO',\n    password: hashedPassword,",
  "status: 'ATIVO',\n    accountType: 'REAL',\n    readOnly: false,\n    password: hashedPassword,"
);

fs.writeFileSync('server/api.ts', content);
console.log('patched');
