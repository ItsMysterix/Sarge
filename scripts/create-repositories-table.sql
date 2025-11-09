-- Add repositories table to store connected GitHub repos (SQL Server / T-SQL)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'repositories' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
CREATE TABLE dbo.repositories (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() CONSTRAINT pk_repositories PRIMARY KEY,
  user_id UNIQUEIDENTIFIER NOT NULL,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL,
  description VARCHAR(MAX) NULL,
  is_primary BIT NOT NULL DEFAULT 0,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
-- add foreign key to users table (assumes dbo.users(id) exists)
ALTER TABLE dbo.repositories
  ADD CONSTRAINT fk_repositories_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE;

-- Unique constraint for (user_id, owner, repo)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_repositories_user_owner_repo' AND object_id = OBJECT_ID('dbo.repositories'))
BEGIN
  CREATE UNIQUE INDEX ux_repositories_user_owner_repo ON dbo.repositories (user_id, owner, repo);
END;

-- Index for faster lookups by user_id
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_repositories_user_id' AND object_id = OBJECT_ID('dbo.repositories'))
BEGIN
  CREATE NONCLUSTERED INDEX idx_repositories_user_id ON dbo.repositories (user_id);
END;

-- Index for primary flag lookups (filtered index)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_repositories_primary' AND object_id = OBJECT_ID('dbo.repositories'))
BEGIN
  CREATE NONCLUSTERED INDEX idx_repositories_primary ON dbo.repositories (user_id, is_primary) WHERE is_primary = 1;
END;

-- Only one primary repo per user (filtered unique index)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_one_primary_per_user' AND object_id = OBJECT_ID('dbo.repositories'))
BEGIN
  CREATE UNIQUE INDEX idx_one_primary_per_user ON dbo.repositories (user_id) WHERE is_primary = 1;
END;
END;
