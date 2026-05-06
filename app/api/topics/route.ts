import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelSubject } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select()
    .from(duelSubject)
    .orderBy(duelSubject.subjectName);

  return NextResponse.json(rows, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}