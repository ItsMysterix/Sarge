-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS uptime_logs CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS deployments CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS insights CASCADE;

-- Create deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  commit TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  summary TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  author TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create logs table
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('info', 'warn', 'error', 'alert')),
  message TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'system',
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create metrics table
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage FLOAT NOT NULL CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  memory_usage FLOAT NOT NULL CHECK (memory_usage >= 0 AND memory_usage <= 100),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  cost_daily DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  uptime_percent DECIMAL(5,2) DEFAULT 99.9,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'good' CHECK (status IN ('excellent', 'good', 'warning', 'critical')),
  grade CHAR(1) NOT NULL DEFAULT 'A' CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  tip TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 85 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  category TEXT DEFAULT 'performance' CHECK (category IN ('performance', 'security', 'cost', 'reliability')),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'up' CHECK (status IN ('up', 'down', 'degraded')),
  cost_per_hour DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  uptime_percent DECIMAL(5,2) NOT NULL DEFAULT 99.9,
  service_type TEXT DEFAULT 'api' CHECK (service_type IN ('api', 'database', 'worker', 'cache', 'storage')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create uptime_logs table for service monitoring
CREATE TABLE uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  uptime_value DECIMAL(5,2) NOT NULL CHECK (uptime_value >= 0 AND uptime_value <= 100),
  response_time_ms INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  slack_alerts BOOLEAN DEFAULT false,
  auto_rebuild BOOLEAN DEFAULT false,
  notification_threshold TEXT DEFAULT 'medium' CHECK (notification_threshold IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_deployments_created_at ON deployments(created_at DESC);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_service ON logs(service);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX idx_insights_date ON insights(date DESC);
CREATE INDEX idx_uptime_logs_service_timestamp ON uptime_logs(service_id, timestamp DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for settings table
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
