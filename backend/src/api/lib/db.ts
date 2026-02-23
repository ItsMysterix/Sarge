import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './drizzle-schema';
import logger from '../../lib/logger';

// Note: Using a different global key to avoid conflicts if both run in same process
declare global {
    // eslint-disable-next-line no-var
    var __db_pool_backend: Pool | undefined;
    // eslint-disable-next-line no-var
    var __drizzle_db_backend: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

// Provide a resilient mock when DATABASE_URL is not configured
const createMockPool = () => {
    logger.warn('[db] DATABASE_URL not set; using in-memory mock pool');
    const mock: any = {
        async query(sql: string, params?: any[]) {
            logger.warn({ sql: sql.substring(0, 100), params }, '[db/mock] Query called with no DB');
            return { rows: [] };
        },
        async end() { /* noop */ },
    };
    return mock as unknown as Pool;
};

let pool: Pool;

// In standalone backend, we might use a custom env loader
// But we fallback to process.env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    pool = createMockPool();
} else if (process.env.NODE_ENV === 'production') {
    // [CTO T2] Explicit pool limits to prevent exhausting Neon's connection limit
    pool = new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.DB_POOL_MAX ?? 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
    });
} else {
    if (!global.__db_pool_backend) {
        global.__db_pool_backend = new Pool({
            connectionString: databaseUrl,
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
    }
    pool = global.__db_pool_backend;
}

// Initialize Drizzle
let drizzleDb: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === 'production') {
    drizzleDb = drizzle(pool, { schema });
} else {
    if (!global.__drizzle_db_backend) {
        global.__drizzle_db_backend = drizzle(pool, { schema });
    }
    drizzleDb = global.__drizzle_db_backend;
}

export { pool as db, drizzleDb };

// For backward compatibility
export function getDbPool(): Pool {
    return pool;
}
