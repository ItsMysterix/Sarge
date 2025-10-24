-- Optional composite index to optimize cursor pagination over (created_at, id)
CREATE INDEX IF NOT EXISTS idx_logs_created_at_id_desc ON logs (created_at DESC, id DESC);
