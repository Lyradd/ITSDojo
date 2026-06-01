require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  try {
    const res = await sql`SELECT * FROM evaluation_progress`;
    console.log("ROWS:", res);
    const errCheck = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    console.log("TABLES:", errCheck.map(t => t.tablename));
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
