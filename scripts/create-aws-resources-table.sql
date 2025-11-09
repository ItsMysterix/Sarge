-- AWS Resources Database Schema
-- Stores AWS-compatible service resources (S3, DynamoDB, Lambda, IAM, CloudWatch)

-- S3 Buckets
CREATE TABLE IF NOT EXISTS s3_buckets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(50) DEFAULT 'us-east-1',
    versioning_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255),
    size_bytes BIGINT DEFAULT 0,
    object_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- S3 Objects
CREATE TABLE IF NOT EXISTS s3_objects (
    id SERIAL PRIMARY KEY,
    bucket_id INTEGER REFERENCES s3_buckets(id) ON DELETE CASCADE,
    key VARCHAR(1024) NOT NULL,
    size_bytes BIGINT NOT NULL,
    content_type VARCHAR(255),
    etag VARCHAR(255),
    version_id VARCHAR(255),
    storage_class VARCHAR(50) DEFAULT 'STANDARD',
    last_modified TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(bucket_id, key, version_id)
);

-- DynamoDB Tables
CREATE TABLE IF NOT EXISTS dynamodb_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    partition_key VARCHAR(255) NOT NULL,
    partition_key_type VARCHAR(10) NOT NULL, -- S, N, B
    sort_key VARCHAR(255),
    sort_key_type VARCHAR(10), -- S, N, B
    item_count BIGINT DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    read_capacity_units INTEGER DEFAULT 5,
    write_capacity_units INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- DynamoDB Items (simplified storage)
CREATE TABLE IF NOT EXISTS dynamodb_items (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES dynamodb_tables(id) ON DELETE CASCADE,
    partition_key_value TEXT NOT NULL,
    sort_key_value TEXT,
    item_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(table_id, partition_key_value, sort_key_value)
);

-- Lambda Functions
CREATE TABLE IF NOT EXISTS lambda_functions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    runtime VARCHAR(50) NOT NULL,
    handler VARCHAR(255) NOT NULL,
    code_size BIGINT DEFAULT 0,
    memory_size INTEGER DEFAULT 128,
    timeout INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'Active',
    last_modified TIMESTAMP DEFAULT NOW(),
    invocation_count BIGINT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    environment JSONB DEFAULT '{}'::jsonb,
    role_arn VARCHAR(512),
    created_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255)
);

-- Lambda Invocations (logs)
CREATE TABLE IF NOT EXISTS lambda_invocations (
    id SERIAL PRIMARY KEY,
    function_id INTEGER REFERENCES lambda_functions(id) ON DELETE CASCADE,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- success, error
    duration_ms INTEGER,
    memory_used_mb INTEGER,
    billed_duration_ms INTEGER,
    invoked_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT,
    logs TEXT
);

-- IAM Roles
CREATE TABLE IF NOT EXISTS iam_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    arn VARCHAR(512) UNIQUE NOT NULL,
    assume_role_policy JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255)
);

-- IAM Policies
CREATE TABLE IF NOT EXISTS iam_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    arn VARCHAR(512) UNIQUE NOT NULL,
    policy_document JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255)
);

-- IAM Role Policy Attachments
CREATE TABLE IF NOT EXISTS iam_role_policies (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES iam_roles(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES iam_policies(id) ON DELETE CASCADE,
    attached_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, policy_id)
);

-- CloudWatch Metrics
CREATE TABLE IF NOT EXISTS cloudwatch_metrics (
    id SERIAL PRIMARY KEY,
    namespace VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    dimensions JSONB DEFAULT '{}'::jsonb,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CloudWatch Log Groups
CREATE TABLE IF NOT EXISTS cloudwatch_log_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(512) UNIQUE NOT NULL,
    retention_days INTEGER,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255)
);

-- CloudWatch Log Streams
CREATE TABLE IF NOT EXISTS cloudwatch_log_streams (
    id SERIAL PRIMARY KEY,
    log_group_id INTEGER REFERENCES cloudwatch_log_groups(id) ON DELETE CASCADE,
    name VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_event_time TIMESTAMP,
    UNIQUE(log_group_id, name)
);

-- CloudWatch Log Events
CREATE TABLE IF NOT EXISTS cloudwatch_log_events (
    id SERIAL PRIMARY KEY,
    log_stream_id INTEGER REFERENCES cloudwatch_log_streams(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    ingestion_time TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_s3_objects_bucket ON s3_objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_s3_objects_key ON s3_objects(key);
CREATE INDEX IF NOT EXISTS idx_dynamodb_items_table ON dynamodb_items(table_id);
CREATE INDEX IF NOT EXISTS idx_dynamodb_items_partition ON dynamodb_items(partition_key_value);
CREATE INDEX IF NOT EXISTS idx_lambda_invocations_function ON lambda_invocations(function_id);
CREATE INDEX IF NOT EXISTS idx_lambda_invocations_time ON lambda_invocations(invoked_at);
CREATE INDEX IF NOT EXISTS idx_cloudwatch_metrics_namespace ON cloudwatch_metrics(namespace);
CREATE INDEX IF NOT EXISTS idx_cloudwatch_metrics_time ON cloudwatch_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_cloudwatch_log_events_stream ON cloudwatch_log_events(log_stream_id);
CREATE INDEX IF NOT EXISTS idx_cloudwatch_log_events_time ON cloudwatch_log_events(timestamp);
