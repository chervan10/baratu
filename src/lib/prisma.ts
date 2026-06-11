import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || 'file:./dev.db';

  if (url.startsWith('postgresql:') || url.startsWith('postgres:')) {
    return new PrismaClient({
      adapter: new PrismaPg(url),
    });
  } else {
    return new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url }),
    });
  }
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
