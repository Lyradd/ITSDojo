// Add password column to users.
// Run: node scripts/migrate-password.js
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding password to users...');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password text NOT NULL DEFAULT '123456';
    `);
    console.log('✓ Added password column (default 123456)');

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
