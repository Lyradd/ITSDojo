import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteDuelSession } from "@/lib/duel-session-store";
import { upsertLobbyState } from "@/lib/lobby-bus";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const result = await db
    .delete(duelRooms)
    .where(eq(duelRooms.id, lobby.id as any));

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  upsertLobbyState({
    ...lobby,
    guestId: null,
    status: "cancelled",
    endedAt: new Date(),
    updatedAt: new Date(),
  });

  deleteDuelSession(lobby.inviteCode);

  return NextResponse.json({ status: "cancelled" });
}