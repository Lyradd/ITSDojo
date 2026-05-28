// Add profile_xp & gems columns to users table.
// Run: node scripts/migrate-profile-xp.js
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding profile_xp & gems to users...');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_xp integer NOT NULL DEFAULT 0;
    `);
    console.log('✓ Added profile_xp');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS gems integer NOT NULL DEFAULT 0;
    `);
    console.log('✓ Added gems');

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
