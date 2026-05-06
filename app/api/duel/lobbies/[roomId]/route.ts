import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const room = await db
    .select()
    .from(duelRooms)
    .where(eq(duelRooms.inviteCode, params.roomId))
    .limit(1);

  if (room.length === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  return NextResponse.json(room[0]);
}