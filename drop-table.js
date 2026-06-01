require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  try {
    await sql`DROP TABLE IF EXISTS evaluation_progress CASCADE`;
    console.log("Table dropped");
  } catch (err) {
    console.error(err);
  }
}
run();
