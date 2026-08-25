const fs = require('fs');

let content = fs.readFileSync('server/api.ts', 'utf-8');

// Fix register-driver
content = content.replace(
  'const assignedTenantId = tenantId || db.tenants[0].id;',
  'const assignedTenantId = tenantId || null;'
);

content = content.replace(
  /birthDate: birthDate \|\| '1990-01-01'/g,
  "birthDate: birthDate || ''"
);

content = content.replace(
  /zipCode: zipCode \|\| '15000-000'/g,
  "zipCode: zipCode || ''"
);

content = content.replace(
  /city: city \|\| 'São José do Rio Preto'/g,
  "city: city || ''"
);

content = content.replace(
  /state: state \|\| 'SP'/g,
  "state: state || ''"
);

content = content.replace(
  /cnhCategory: cnhCategory \|\| 'C'/g,
  "cnhCategory: cnhCategory || ''"
);

content = content.replace(
  /cnhExpiresAt: cnhExpiresAt \|\| '2028-12-31'/g,
  "cnhExpiresAt: cnhExpiresAt || ''"
);

// Vehicle defaults in register-driver
content = content.replace(
  "type: vehicleType || 'TRUCK',",
  "type: vehicleType || '',"
);
content = content.replace(
  "brand: vehicleBrand || 'Mercedes-Benz',",
  "brand: vehicleBrand || '',"
);
content = content.replace(
  "model: vehicleModel || 'Atego',",
  "model: vehicleModel || '',"
);
content = content.replace(
  "year: Number(vehicleYear) || 2022,",
  "year: vehicleYear ? Number(vehicleYear) : new Date().getFullYear(),"
);
content = content.replace(
  "plate: vehiclePlate || 'ABC1D23',",
  "plate: vehiclePlate || '',"
);
content = content.replace(
  "renavam: vehicleRenavam || '00123456789',",
  "renavam: vehicleRenavam || '',"
);
content = content.replace(
  "capacityKg: Number(capacityKg) || 12000,",
  "capacityKg: capacityKg ? Number(capacityKg) : 0,"
);
content = content.replace(
  "bodyType: bodyType || 'BAU',",
  "bodyType: bodyType || '',"
);

// Fix POST /users
content = content.replace(
  "const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? (tenantId || db.tenants[0].id) : req.user?.tenantId;",
  "const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? tenantId : req.user?.tenantId;"
);
content = content.replace(
  "tenantId: targetTenantId || db.tenants[0].id,",
  "tenantId: targetTenantId || null,"
);

fs.writeFileSync('server/api.ts', content);
console.log('patched 2');
