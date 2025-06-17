-- Insert sample services
INSERT INTO services (name, status, cost_per_hour, uptime_percent, service_type) VALUES 
('API Gateway', 'up', 1.0200, 99.9, 'api'),
('PostgreSQL DB', 'up', 1.8800, 99.8, 'database'),
('Worker Queue', 'up', 0.7500, 99.5, 'worker'),
('Redis Cache', 'up', 0.4500, 99.9, 'cache'),
('File Storage', 'degraded', 0.3200, 98.2, 'storage');

-- Insert sample metrics (last 24 hours)
INSERT INTO metrics (cpu_usage, memory_usage, latency_ms, cost_daily, uptime_percent, timestamp) VALUES 
(68.5, 83.2, 45, 91.40, 99.8, NOW() - INTERVAL '1 hour'),
(72.1, 85.7, 52, 92.15, 99.7, NOW() - INTERVAL '2 hours'),
(65.3, 81.9, 38, 90.85, 99.9, NOW() - INTERVAL '3 hours'),
(70.8, 84.1, 47, 91.75, 99.8, NOW() - INTERVAL '4 hours'),
(69.2, 82.6, 43, 91.20, 99.8, NOW() - INTERVAL '5 hours');

-- Insert sample deployments
INSERT INTO deployments (branch, commit, status, summary, duration_seconds, author) VALUES 
('main', 'a7f3c2d', 'success', 'Deployment completed successfully - API performance improvements', 135, 'Alex Chen'),
('feature/auth', 'b8e4d3f', 'failed', 'Failed due to database migration timeout', 92, 'Sarah Kim'),
('main', 'c9f5e4a', 'success', 'Hotfix for memory leak in worker queue', 156, 'Mike Johnson'),
('feature/ui-update', 'd1a2b3c', 'pending', 'UI redesign deployment in progress', 0, 'Alex Chen'),
('main', 'e4f5g6h', 'success', 'Security patches and dependency updates', 142, 'Sarah Kim');

-- Insert sample logs
INSERT INTO logs (type, message, service, severity) VALUES 
('error', 'Authentication failed for user ID 12345 - invalid token', 'api-gateway', 'high'),
('warn', 'High memory usage detected: 85% of allocated memory in use', 'worker-queue', 'medium'),
('error', 'Database connection timeout after 30s - retrying connection', 'database', 'medium'),
('info', 'Deployment #a7f3c2d completed successfully in 2m 15s', 'deployment-service', 'low'),
('alert', 'Critical: API response time exceeded 5000ms threshold', 'api-gateway', 'high'),
('warn', 'Cache hit ratio dropped below 90% - current: 87%', 'redis-cache', 'medium'),
('info', 'Scheduled backup completed successfully - 2.3GB archived', 'file-storage', 'low'),
('error', 'Failed to process webhook from GitHub - connection refused', 'api-gateway', 'medium');

-- Insert sample insights
INSERT INTO insights (status, grade, tip, confidence_score, category) VALUES 
('good', 'A', 'Consider scaling database instance - memory usage consistently above 80%', 94, 'performance'),
('warning', 'B', 'Update Node.js dependencies - 3 security vulnerabilities detected', 87, 'security'),
('good', 'A', 'Enable compression on API responses - could reduce bandwidth by 30%', 92, 'cost'),
('warning', 'B', 'Database query performance degrading - consider adding indexes', 89, 'performance'),
('excellent', 'A', 'Uptime targets exceeded - current 99.8% vs target 99.5%', 96, 'reliability');

-- Insert uptime logs for services (last 24 hours)
DO $$
DECLARE
    service_record RECORD;
    hour_offset INTEGER;
BEGIN
    FOR service_record IN SELECT id FROM services LOOP
        FOR hour_offset IN 0..23 LOOP
            INSERT INTO uptime_logs (service_id, uptime_value, response_time_ms, timestamp) VALUES (
                service_record.id,
                95 + (RANDOM() * 5), -- Random uptime between 95-100%
                20 + (RANDOM() * 100)::INTEGER, -- Random response time 20-120ms
                NOW() - (hour_offset || ' hours')::INTERVAL
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert default settings
INSERT INTO settings (user_id, slack_alerts, auto_rebuild, notification_threshold) VALUES 
('dev-mode', true, false, 'medium'),
('admin', true, true, 'low');
