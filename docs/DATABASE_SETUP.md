# Database Setup Guide

## Quick Start

If you're experiencing "Failed to save repository" errors, you need to set up the database tables.

### Option 1: Run the SQL scripts (Recommended)

1. **Connect to your Neon database** using your preferred SQL client or the Neon console
2. **Run the following scripts in order:**

```bash
# Core tables (metrics, logs, deployments, services)
psql $DATABASE_URL -f scripts/create-neon-tables.sql

# Users and repositories tables (for GitHub integration)
psql $DATABASE_URL -f scripts/create-users-repositories.sql
```

### Option 2: Manual Setup via Neon Console

1. Go to your Neon project dashboard
2. Click "SQL Editor"
3. Copy and paste the contents of `scripts/create-users-repositories.sql`
4. Click "Run"

### Option 3: Development Mode (No Database)

The app will work with fallback/mock data if the database is unavailable. Repository connections will use in-memory storage.

## Required Environment Variables

Make sure you have the following in your `.env.local`:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

## Verifying the Setup

After running the scripts, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'repositories');

-- Check table structure
\d users
\d repositories
```

## Troubleshooting

### "Failed to save repository" Error

- **Cause**: Database tables don't exist or DATABASE_URL is not set
- **Solution**: Run the SQL scripts above or check your environment variables

### "User not found" Error

- **Cause**: User doesn't exist in the database yet
- **Solution**: The app now auto-creates users on first repository connection

### Database Connection Errors

- **Check DATABASE_URL**: Ensure it's properly formatted and accessible
- **Check Neon Status**: Verify your Neon project is active
- **Development Mode**: The app will fall back to mock data if DB is unavailable

## Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique user email (from GitHub OAuth)
- `name`: User's display name
- `created_at`, `updated_at`: Timestamps

### Repositories Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `owner`: GitHub username or organization
- `repo`: Repository name
- `full_name`: Full repo name (owner/repo)
- `description`: Repository description
- `is_primary`: Boolean flag for active repo
- `created_at`, `updated_at`: Timestamps

## Need Help?

Check the logs for detailed error messages:
- Browser console: Shows client-side errors
- Server logs: Run `npm run dev` and check terminal output
