import { Pool } from '@neondatabase/serverless';

// Note: Using a different global key to avoid conflicts if both run in same process
declare global {
    // eslint-disable-next-line no-var
    var __db_pool_backend: Pool | undefined;
}

// Provide a resilient mock when DATABASE_URL is not configured
const createMockPool = () => {
    console.warn('[db] DATABASE_URL not set; using in-memory mock pool');
    const mock: any = {
        async query(sql: string, params?: any[]) {
            console.warn('[db/mock] Query called with no DB:', { sql: sql.substring(0, 100), params });
            return { rows: [] };
        },
        async end() { /* noop */ },
    };
    return mock as unknown as Pool;
};

let db: Pool;

// In standalone backend, we might use a custom env loader
// But we fallback to process.env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    db = createMockPool();
} else if (process.env.NODE_ENV === 'production') {
    db = new Pool({ connectionString: databaseUrl });
} else {
    if (!global.__db_pool_backend) {
        global.__db_pool_backend = new Pool({ connectionString: databaseUrl });
    }
    db = global.__db_pool_backend;
}

export { db };

// For backward compatibility
export function getDbPool(): Pool {
    return db;
}
