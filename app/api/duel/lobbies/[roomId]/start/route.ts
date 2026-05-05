import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const result = await db
    .update(duelRooms)
    .set({
      status: "started",
      updatedAt: new Date(),
    })
    .where(eq(duelRooms.inviteCode, params.roomId));

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "started" });
}