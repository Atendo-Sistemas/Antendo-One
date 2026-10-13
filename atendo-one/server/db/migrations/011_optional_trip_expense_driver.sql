-- Prestações de contas podem ser criadas antes de vincular motorista ou frete.
ALTER TABLE IF EXISTS trip_expenses
  ALTER COLUMN driver_id DROP NOT NULL;

ALTER TABLE IF EXISTS trip_expenses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
