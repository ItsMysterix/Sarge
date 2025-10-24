-- 0007_rate_limit_hits.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rate_limit_hits'
  ) THEN
    CREATE TABLE rate_limit_hits (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      route TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_key_route_ts
      ON rate_limit_hits (key, route, ts DESC);
  END IF;
END $$;
