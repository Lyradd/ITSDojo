// One-shot migration: tambah kolom student_id di evaluation_progress dan ganti unique constraint.
// Run: node scripts/migrate-progress.js
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // 1. Tambah kolom student_id (nullable) kalau belum ada
    await client.query(`
      ALTER TABLE evaluation_progress
      ADD COLUMN IF NOT EXISTS student_id text;
    `);
    console.log('✓ Added student_id column');

    // 2. Drop unique constraint lama (evaluation_id, student_name)
    // Constraint name auto-generated oleh Drizzle. Cek lewat pg_indexes.
    const idxRes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'evaluation_progress' AND indexdef LIKE '%student_name%';
    `);
    for (const row of idxRes.rows) {
      await client.query(`ALTER TABLE evaluation_progress DROP CONSTRAINT IF EXISTS "${row.indexname}";`);
      await client.query(`DROP INDEX IF EXISTS "${row.indexname}";`);
      console.log(`✓ Dropped old unique on student_name: ${row.indexname}`);
    }

    // 3. Buat unique baru di (evaluation_id, student_id) — partial: hanya saat student_id NOT NULL
    // (untuk backwards-compat dengan rows lama yang student_id-nya NULL)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS evaluation_progress_eval_student_unq
      ON evaluation_progress (evaluation_id, student_id)
      WHERE student_id IS NOT NULL;
    `);
    console.log('✓ Created new unique index on (evaluation_id, student_id)');

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
