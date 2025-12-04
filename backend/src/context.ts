import type { IncomingMessage } from 'http';
import type { db } from './api/lib/db';
import type { ee } from './api/lib/events';
import { getToken } from 'next-auth/jwt';

export type RequestMeta = {
  ip?: string;
  ua?: string;
  origin?: string;
  apiToken?: string;
};

export type Session = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
};

export type Context = {
  db: typeof db;
  ee: typeof ee;
  requestMeta: RequestMeta;
  session?: Session | null;
};

export async function createContext(opts?: {
  req?: IncomingMessage | Request;
}): Promise<Context> {
  const { db } = await import('./api/lib/db');
  const { ee } = await import('./api/lib/events');

  const requestMeta: RequestMeta = {};
  let session: Session | null = null;

  if (opts?.req) {
    if (opts.req instanceof Request) {
      requestMeta.ip = opts.req.headers.get('x-forwarded-for')?.split(',')[0];
      const ua = opts.req.headers.get('user-agent');
      requestMeta.ua = ua === null ? undefined : ua;
      const origin = opts.req.headers.get('origin');
      requestMeta.origin = origin === null ? undefined : origin;
      const tok = opts.req.headers.get('x-sarge-token');
      requestMeta.apiToken = tok === null ? undefined : tok;
      
      // Check NextAuth session for authentication
      try {
        const token = await getToken({ req: opts.req as any, secret: process.env.NEXTAUTH_SECRET });
        if (token) {
          session = {
            user: {
              id: token.sub,
              email: token.email as string | undefined,
              name: token.name as string | undefined,
              image: token.picture as string | undefined,
            },
          };
        }
      } catch (e) {
        console.warn('[context] Failed to get NextAuth token:', e);
      }
    } else {
      // http.IncomingMessage
      const ipHeader = opts.req.headers['x-forwarded-for'];
      requestMeta.ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader?.split(',')[0];
      requestMeta.ua = opts.req.headers['user-agent'];
      requestMeta.origin = opts.req.headers['origin'];
      const tokHeader = opts.req.headers['x-sarge-token'];
      requestMeta.apiToken = Array.isArray(tokHeader) ? tokHeader[0] : tokHeader;
    }
  }

  return { db, ee, requestMeta, session };
}
