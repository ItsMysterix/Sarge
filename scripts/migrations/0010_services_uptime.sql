-- 0010_services_uptime.sql
-- Services and uptime logs to support /api/services and /api/services/[id]/uptime

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uptime_logs (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  value DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uptime_logs_service_ts ON uptime_logs(service_id, timestamp DESC);
