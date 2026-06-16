import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || '';

  if (url.startsWith('postgresql:') || url.startsWith('postgres:')) {
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } else {
    let dbPath = path.join(process.cwd(), 'dev.db');

    // On Vercel, the runtime workspace is read-only, so we copy dev.db to /tmp
    if (process.env.VERCEL) {
      // Robust path search for dev.db in Next.js standalone execution
      if (!fs.existsSync(dbPath)) {
        const altPaths = [
          path.join(process.cwd(), '..', 'dev.db'),
          path.join(process.cwd(), '.next', 'server', 'dev.db'),
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(__dirname, 'dev.db'),
          path.join(__dirname, '..', 'dev.db'),
          path.join(__dirname, '..', '..', 'dev.db'),
          path.join(__dirname, '..', '..', '..', 'dev.db'),
        ];
        for (const p of altPaths) {
          if (fs.existsSync(p)) {
            dbPath = p;
            break;
          }
        }
      }

      const tempDbPath = '/tmp/dev.db';
      try {
        if (!fs.existsSync(tempDbPath)) {
          if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, tempDbPath);
            console.log(`Successfully copied dev.db from ${dbPath} to /tmp/dev.db`);
          } else {
            console.warn('dev.db not found in any path');
          }
        }
        
        // Ensure write permissions are explicitly set
        if (fs.existsSync(tempDbPath)) {
          fs.chmodSync(tempDbPath, 0o666);
        }
      } catch (e) {
        console.error('Failed to copy/chmod dev.db to /tmp:', e);
      }
      dbPath = tempDbPath;
    }

    const sqliteUrl = `file:${dbPath}`;
    return new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: sqliteUrl }),
    });
  }
}

declare const globalThis: {
  prismaGlobal: any;
} & typeof global;

let prisma: PrismaClient;
try {
  prisma = (globalThis.prismaGlobal ?? prismaClientSingleton()) as PrismaClient;
} catch (err: any) {
  console.error("Prisma client failed to initialize:", err);
  prisma = new Proxy({}, {
    get(target, prop) {
      // Support deep property access and method calls by recursively returning the proxy,
      // then throwing the custom error when any method/function is called.
      const handler: ProxyHandler<any> = {
        get(t: any, p: any): any {
          if (p === 'then' || p === 'catch' || p === 'finally') return undefined;
          return new Proxy(() => {}, handler);
        },
        apply() {
          throw new Error(`Prisma client failed to initialize. If in production, make sure DATABASE_URL environment variable is set to a valid PostgreSQL/Supabase database. (Error: ${err.message || err})`);
        }
      };
      return new Proxy(() => {}, handler);
    }
  }) as unknown as PrismaClient;
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

