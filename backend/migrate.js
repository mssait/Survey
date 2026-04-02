// migrate.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { execSync } = require('child_process');

const DB_USER = process.env.DB_USER;
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';

// Fix path — migrate.js is already inside backend/
const sqlFile = path.join(__dirname, 'migrations/init.sql');

try {
  execSync(
    `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${sqlFile}"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Migration ran successfully');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}