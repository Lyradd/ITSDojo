import "dotenv/config";
import { db } from "./db/index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding gamification_data column...");
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN "gamification_data" jsonb;`);
    console.log("Success!");
  } catch (error) {
    console.error("Failed:", error);
  }
  process.exit(0);
}

main();
