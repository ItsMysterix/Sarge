-- Delete logs older than N days (default 7)
-- Usage: parameter $1 is the retention in days (int)
DELETE FROM logs
WHERE created_at < NOW() - (INTERVAL '1 day' * COALESCE($1::int, 7));
