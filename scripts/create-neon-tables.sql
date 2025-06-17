-- Create tables for Neon database
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    grade VARCHAR(1) NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
    tips TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    cpu INTEGER NOT NULL,
    memory INTEGER NOT NULL,
    latency INTEGER NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    branch VARCHAR(255) NOT NULL,
    commit VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'error', 'alert', 'warn')),
    message TEXT NOT NULL,
    service VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
    cost_hr DECIMAL(10,2) NOT NULL,
    uptime_percent DECIMAL(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS uptime_logs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    value DECIMAL(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    slack_alerts BOOLEAN DEFAULT false,
    auto_rebuild BOOLEAN DEFAULT false
);

-- Insert sample data
INSERT INTO insights (date, grade, tips) VALUES 
(CURRENT_DATE, 'A', ARRAY[
    'Consider scaling database instance - memory usage at 83%',
    'Update Node.js dependencies - 3 security vulnerabilities detected',
    'Enable compression on API responses - could reduce bandwidth by 30%'
]) ON CONFLICT DO NOTHING;

INSERT INTO services (name, status, cost_hr, uptime_percent) VALUES 
('API Gateway', 'up', 1.02, 99.9),
('PostgreSQL DB', 'up', 1.88, 99.8),
('Worker Queue', 'up', 0.75, 99.5),
('Redis Cache', 'up', 0.45, 99.9)
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (user_id, slack_alerts, auto_rebuild) VALUES 
('dev-mode', true, false)
ON CONFLICT (user_id) DO NOTHING;
