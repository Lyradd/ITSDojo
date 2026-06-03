import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0 NOT NULL`);
    await db.execute(sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS question_started_at timestamp`);
    await db.execute(sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false NOT NULL`);
    await db.execute(sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS paused_at timestamp`);
    console.log("Success adding columns to evaluations");
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
}
main();
