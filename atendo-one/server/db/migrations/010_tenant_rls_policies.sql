-- Tenant isolation for PostgreSQL-backed deployments.
-- The application role must not own these tables and must set app.tenant_id
-- (and app.is_super_admin for audited global operations) per transaction.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'drivers', 'vehicles', 'freights', 'trip_expenses',
    'form_definitions', 'form_responses', 'audit_logs'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
      EXECUTE format($policy$
        CREATE POLICY tenant_isolation ON %I
        USING (
          current_setting('app.is_super_admin', true) = 'true'
          OR tenant_id::text = current_setting('app.tenant_id', true)
        )
        WITH CHECK (
          current_setting('app.is_super_admin', true) = 'true'
          OR tenant_id::text = current_setting('app.tenant_id', true)
        )
      $policy$, table_name);
    END IF;
  END LOOP;
END $$;

-- Cross-tenant relationships must be rejected at the database boundary.
DO $$
BEGIN
  IF to_regclass('public.vehicles') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS drivers_tenant_id_id_key ON drivers (tenant_id, id);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_driver_same_tenant') THEN
      ALTER TABLE vehicles ADD CONSTRAINT vehicles_driver_same_tenant
        FOREIGN KEY (tenant_id, assigned_driver_id) REFERENCES drivers (tenant_id, id) NOT VALID;
    END IF;
  END IF;
  IF to_regclass('public.freights') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'freights_driver_same_tenant') THEN
      ALTER TABLE freights ADD CONSTRAINT freights_driver_same_tenant
        FOREIGN KEY (tenant_id, assigned_driver_id) REFERENCES drivers (tenant_id, id) NOT VALID;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE tenants IS 'Tenant root. Access must be scoped by authenticated application context.';
