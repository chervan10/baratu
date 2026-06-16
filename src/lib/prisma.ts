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
      const tempDbPath = '/tmp/dev.db';
      try {
        if (!fs.existsSync(tempDbPath)) {
          if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, tempDbPath);
            console.log('Successfully copied dev.db to /tmp/dev.db');
          } else {
            console.warn('dev.db not found at', dbPath);
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
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
