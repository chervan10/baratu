const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgresql:') || databaseUrl.startsWith('postgres:');

// Regex to match the entire datasource db { ... } block
const dbBlockRegex = /datasource db \{[\s\S]*?\}/;

const newDbBlock = isPostgres
  ? `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  : `datasource db {
  provider = "sqlite"
}`;

schema = schema.replace(dbBlockRegex, newDbBlock);
fs.writeFileSync(schemaPath, schema, 'utf8');

console.log(`[PRISMA PREPARE] Set database provider to ${isPostgres ? 'postgresql' : 'sqlite'}`);
