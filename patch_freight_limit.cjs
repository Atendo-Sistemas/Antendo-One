const fs = require('fs');

let content = fs.readFileSync('server/api.ts', 'utf-8');

const searchCode = `
  const tenantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.tenantId || db.tenants[0].id) : req.user?.tenantId;
  const tenant = db.tenants.find(t => t.id === tenantId);
`;

const replaceCode = `
  const tenantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.tenantId || null) : req.user?.tenantId;
  const tenant = db.tenants.find(t => t.id === tenantId);

  if (tenant) {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const tenantFreightsThisMonth = db.freights.filter(f => 
      f.tenantId === tenant.id && f.createdAt.startsWith(currentMonth)
    ).length;

    const maxLimit = tenant.planLimits?.maxFreightsMonthly || 0;
    if (tenantFreightsThisMonth >= maxLimit) {
      return res.status(403).json({ 
        error: 'Limite de fretes mensais atingido para o plano atual (' + maxLimit + '). Faça o upgrade para continuar cadastrando.'
      });
    }
  }
`;

content = content.replace(searchCode, replaceCode);
fs.writeFileSync('server/api.ts', content);
console.log('patched freight limits');
