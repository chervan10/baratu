const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Run prepare to check database url and rewrite provider
console.log('[BUILD SCRIPT] Running prepare.js...');
require('./prepare.js');

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgresql:') || databaseUrl.startsWith('postgres:');

if (!isPostgres) {
  console.log('[BUILD SCRIPT] SQLite mode: running db push to create/sync local dev.db...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('[BUILD SCRIPT] Database schema pushed successfully.');
  } catch (err) {
    console.error('[BUILD SCRIPT] Failed to push database schema:', err);
  }
}

console.log('[BUILD SCRIPT] Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('[BUILD SCRIPT] Running Next.js build...');
execSync('npx next build', { stdio: 'inherit' });
