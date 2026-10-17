const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');

const databaseUrl = process.env.RLS_TEST_DATABASE_URL;
if (!databaseUrl) {
  console.log('RLS_INTEGRATION_SKIPPED: RLS_TEST_DATABASE_URL não configurada');
  process.exit(process.env.CI === 'true' ? 1 : 0);
}

const root = path.resolve(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'server/db/schema.sql'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'server/db/migrations/010_tenant_rls_policies.sql'), 'utf8');
const suffix = crypto.randomBytes(5).toString('hex');
const role = `rls_ci_${suffix}`;
const password = `ci-only-password-${suffix}`;
const quoteIdent = value => `"${value.replaceAll('"', '""')}"`;
const admin = new Client({ connectionString: databaseUrl });

async function inContext(client, tenantId, isSuperAdmin, callback) {
  await client.query('BEGIN');
  await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId || '']);
  await client.query('SELECT set_config($1, $2, true)', ['app.is_super_admin', isSuperAdmin ? 'true' : 'false']);
  try {
    const result = await callback();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

(async () => {
  const tenantA = `rls-tenant-a-${suffix}`;
  const tenantB = `rls-tenant-b-${suffix}`;
  const userA = `rls-user-a-${suffix}`;
  const userB = `rls-user-b-${suffix}`;
  try {
    await admin.connect();
    await admin.query(schema);
    await admin.query(migration);
    await admin.query(migration); // idempotence
    await admin.query(`CREATE ROLE ${quoteIdent(role)} LOGIN PASSWORD '${password}' NOSUPERUSER NOBYPASSRLS`);
    await admin.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdent(role)}`);
    await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON users, tenants, drivers, vehicles, freights TO ${quoteIdent(role)}`);
    await admin.query('INSERT INTO tenants (id, name, cnpj, email, city, state) VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING', [tenantA, 'RLS A', `a-${suffix}`, `a-${suffix}@test.invalid`, 'São Paulo', 'SP', tenantB, 'RLS B', `b-${suffix}`, `b-${suffix}@test.invalid`, 'Rio', 'RJ']);
    await admin.query('INSERT INTO users (id, tenant_id, name, email) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) ON CONFLICT DO NOTHING', [userA, tenantA, 'User A', `${userA}@test.invalid`, userB, tenantB, 'User B', `${userB}@test.invalid`]);
    const driverB = `rls-driver-b-${suffix}`;
    await admin.query('INSERT INTO drivers (id, tenant_id, name, cpf, phone, cnh, cnh_category) VALUES ($1, $2, $3, $4, $5, $6, $7)', [driverB, tenantB, 'Driver B', `cpf-${suffix}`, '11999999999', `cnh-${suffix}`, 'E']);

    const parsed = new URL(databaseUrl);
    parsed.username = role;
    parsed.password = password;
    // Connect using the same host/database but the non-owner role.
    const app = new Client({ connectionString: parsed.toString() });
    await app.connect();
    const tenantARead = await inContext(app, tenantA, false, async () => {
      const visible = await app.query('SELECT id FROM users ORDER BY id');
      const crossUpdate = await app.query('UPDATE users SET name = $1 WHERE id = $2', ['blocked', userB]);
      const crossDelete = await app.query('DELETE FROM users WHERE id = $1', [userB]);
      return { visible: visible.rows.map(row => row.id), crossUpdate: crossUpdate.rowCount, crossDelete: crossDelete.rowCount };
    });
    assert.deepEqual(tenantARead.visible, [userA]);
    assert.equal(tenantARead.crossUpdate, 0);
    assert.equal(tenantARead.crossDelete, 0);

    const globalRead = await inContext(app, null, true, async () => (await app.query('SELECT id FROM users WHERE id IN ($1, $2) ORDER BY id', [userA, userB])).rows.map(row => row.id));
    assert.deepEqual(globalRead, [userA, userB]);

    await assert.rejects(() => app.query('INSERT INTO vehicles (id, tenant_id, plate, model, type, body_type, capacity_kg, assigned_driver_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [`vehicle-${suffix}`, tenantA, `ABC-${suffix}`, 'Test', 'VUC', 'BAU', 1000, driverB]), /violates|permission|policy/i);
    await app.end();
    await admin.query(`DROP ROLE ${quoteIdent(role)}`);
    console.log('RLS_INTEGRATION_PASS');
  } catch (error) {
    console.error('RLS_INTEGRATION_FAIL', error.message);
    try { await admin.query(`DROP ROLE IF EXISTS ${quoteIdent(role)}`); } catch {}
    process.exitCode = 1;
  } finally {
    await admin.end().catch(() => undefined);
  }
})();
