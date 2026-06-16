const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Run prepare to check database url and rewrite provider
console.log('[BUILD SCRIPT] Running prepare.js...');
require('./prepare.js');

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgresql:') || databaseUrl.startsWith('postgres:');

console.log(`[BUILD SCRIPT] Running db push to sync database (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('[BUILD SCRIPT] Database schema pushed and synchronized successfully.');
} catch (err) {
  console.error('[BUILD SCRIPT] Failed to push database schema:', err);
}

console.log('[BUILD SCRIPT] Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('[BUILD SCRIPT] Running Next.js build...');
execSync('npx next build', { stdio: 'inherit' });
