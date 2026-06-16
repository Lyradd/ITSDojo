import { db } from "../db";
import { evaluations } from "../db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const junkTitles = ["a", "z", "d", "c", "test", "Quiz Koordinasi", "Quiz Untuk Testing"];
  await db.delete(evaluations).where(inArray(evaluations.title, junkTitles));
  console.log("Deleted junk evaluations");
  process.exit(0);
}

main();
