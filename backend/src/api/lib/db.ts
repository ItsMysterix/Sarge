import { Pool } from '@neondatabase/serverless';
import { ENV } from '../../env';

declare global {
  // eslint-disable-next-line no-var
  var __db: Pool | undefined;
}

let db: Pool;

if (process.env.NODE_ENV === 'production') {
  db = new Pool({ connectionString: ENV.DATABASE_URL });
} else {
  if (!global.__db) {
    global.__db = new Pool({ connectionString: ENV.DATABASE_URL });
  }
  db = global.__db;
}

export { db };

