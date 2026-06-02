require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS evaluation_progress (
        id SERIAL PRIMARY KEY,
        evaluation_id TEXT NOT NULL,
        student_id TEXT,
        student_name TEXT NOT NULL,
        current_question INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        time_elapsed INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (evaluation_id, student_id)
      );
    `;
    console.log("Table created successfully");
  } catch (err) {
    console.error(err);
  }
}
run();
