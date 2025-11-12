import { Pool } from '@neondatabase/serverless';
import { ENV } from '../../env';

declare global {
  // eslint-disable-next-line no-var
  var __db: Pool | undefined;
}

let db: Pool;

// Provide a resilient mock when DATABASE_URL is not configured
const createMockPool = () => {
  console.warn('[backend/db] DATABASE_URL not set; using in-memory mock pool');
  const mock: any = {
    async query(_sql: string, _params?: any[]) {
      return { rows: [] };
    },
    async end() { /* noop */ },
  };
  return mock as unknown as Pool;
};

if (!ENV.DATABASE_URL) {
  // No database configured – use mock pool in all environments
  db = createMockPool();
} else if (process.env.NODE_ENV === 'production') {
  db = new Pool({ connectionString: ENV.DATABASE_URL });
} else {
  if (!global.__db) {
    global.__db = new Pool({ connectionString: ENV.DATABASE_URL });
  }
  db = global.__db;
}

export { db };

