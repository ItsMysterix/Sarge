-- Extend settings table with new fields
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS enable_animations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(20) DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"deploySuccess": true, "deployFailure": true, "serviceDown": true, "highCpu": true, "highMemory": false, "securityAlerts": true, "emailNotifications": false, "slackNotifications": true}'::jsonb;

-- Create user preferences table for additional settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Create keyboard shortcuts table
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    shortcut VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, action)
);

-- Insert default keyboard shortcuts
INSERT INTO keyboard_shortcuts (user_id, action, shortcut) VALUES
('dev-mode', 'Quick Deploy', 'Ctrl+D'),
('dev-mode', 'Open Metrics', 'Ctrl+M'),
('dev-mode', 'View Logs', 'Ctrl+L'),
('dev-mode', 'Settings', 'Ctrl+,'),
('dev-mode', 'Search', 'Ctrl+K')
ON CONFLICT (user_id, action) DO NOTHING;
