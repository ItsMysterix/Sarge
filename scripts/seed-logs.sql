-- Seed logs table with realistic data
INSERT INTO logs (type, message, service, timestamp) VALUES
-- Recent errors
('error', 'Database connection timeout after 30s', 'api-gateway', NOW() - INTERVAL '5 minutes'),
('error', 'Failed to authenticate user: invalid token', 'auth-service', NOW() - INTERVAL '10 minutes'),
('error', 'Memory allocation failed: out of heap space', 'worker-queue', NOW() - INTERVAL '15 minutes'),
('error', 'HTTP 500: Internal server error in /api/deploy', 'api-gateway', NOW() - INTERVAL '20 minutes'),

-- Warnings
('warn', 'High CPU usage detected: 87% average over last 5 minutes', 'monitoring', NOW() - INTERVAL '2 minutes'),
('warn', 'Slow query detected: SELECT took 3.2s', 'database', NOW() - INTERVAL '8 minutes'),
('warn', 'Disk space low: 15% remaining on /data partition', 'storage', NOW() - INTERVAL '12 minutes'),
('warn', 'Rate limit approaching: 450/500 requests', 'api-gateway', NOW() - INTERVAL '18 minutes'),
('warn', 'Memory usage at 78% capacity', 'worker-queue', NOW() - INTERVAL '25 minutes'),

-- Info logs
('info', 'Deployment completed successfully: build #127', 'deployment', NOW() - INTERVAL '1 minute'),
('info', 'Health check passed for all services', 'monitoring', NOW() - INTERVAL '3 minutes'),
('info', 'Cache cleared: 2.4GB freed', 'cache-service', NOW() - INTERVAL '6 minutes'),
('info', 'User logged in: user@example.com', 'auth-service', NOW() - INTERVAL '9 minutes'),
('info', 'Backup completed: 15GB archived to S3', 'backup-service', NOW() - INTERVAL '30 minutes'),
('info', 'API request: GET /api/metrics - 200 OK (23ms)', 'api-gateway', NOW() - INTERVAL '35 minutes'),
('info', 'New service registered: lambda-function-1', 'registry', NOW() - INTERVAL '40 minutes'),
('info', 'Configuration updated: max_connections=150', 'database', NOW() - INTERVAL '45 minutes'),

-- Alerts
('alert', 'CRITICAL: Service down - api-gateway unreachable', 'monitoring', NOW() - INTERVAL '4 minutes'),
('alert', 'Security alert: Multiple failed login attempts detected', 'security', NOW() - INTERVAL '22 minutes'),

-- More recent activity
('info', 'Metrics collected: 1,247 data points', 'monitoring', NOW() - INTERVAL '30 seconds'),
('info', 'WebSocket connection established: client-abc123', 'websocket', NOW() - INTERVAL '45 seconds'),
('warn', 'API latency spike: 850ms average (threshold: 500ms)', 'api-gateway', NOW() - INTERVAL '90 seconds'),
('info', 'Session created for user: mysterix@example.com', 'auth-service', NOW() - INTERVAL '2 minutes'),
('info', 'GitHub webhook received: push event', 'webhook-handler', NOW() - INTERVAL '3 minutes'),
('error', 'Failed to send notification: Slack API timeout', 'notification', NOW() - INTERVAL '7 minutes'),
('info', 'Database migration completed: v1.2.3', 'database', NOW() - INTERVAL '50 minutes'),
('warn', 'Retry attempt 3/5 for failed request', 'retry-service', NOW() - INTERVAL '11 minutes'),
('info', 'Service health check: all systems operational', 'monitoring', NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;
