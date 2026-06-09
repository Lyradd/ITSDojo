require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS arena_rooms (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES duelsubject(id) ON DELETE CASCADE,
        host_id TEXT NOT NULL,
        players JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'waiting',
        invite_code TEXT NOT NULL UNIQUE,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Table 'arena_rooms' created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}
run();
