\pset tuples_only on
\pset format unaligned
SELECT 'APP_STATE|' || COALESCE(updated_at::text, '') || '|' || md5(state::text) || '|' || (SELECT count(*) FROM jsonb_object_keys(state))
FROM app_state WHERE id = 'default';
SELECT 'COUNTS|' ||
  jsonb_array_length(COALESCE(state->'tenants', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'users', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'drivers', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'vehicles', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'freights', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'tripExpenses', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'notifications', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'pushSubscriptions', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'forms', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'formResponses', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'auditLogs', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'pages', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'posts', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'asaasPayments', '[]'::jsonb)) || '|' ||
  jsonb_array_length(COALESCE(state->'helpPages', '[]'::jsonb))
FROM app_state WHERE id = 'default';
CREATE TEMP TABLE preservation_table_counts (table_name text, row_count bigint);
DO $$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'INSERT INTO preservation_table_counts(table_name, row_count) SELECT %L, count(*) FROM %I.%I',
      item.table_name, 'public', item.table_name
    );
  END LOOP;
END $$;
SELECT 'TABLE_COUNT|' || table_name || '|' || row_count
FROM preservation_table_counts
ORDER BY table_name;
