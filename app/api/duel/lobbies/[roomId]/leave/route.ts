import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteDuelSession } from "@/lib/duel-session-store";
import { upsertLobbyState } from "@/lib/lobby-bus";

type LeaveBody = {
  playerId?: string;
  role?: "host" | "guest";
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const body = (await req.json().catch(() => ({}))) as LeaveBody;
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const role = body.role;

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const isHost = role === "host" || playerId === lobby.hostId;
  const isGuest = role === "guest" || playerId === lobby.guestId;

  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Player is not in this lobby" }, { status: 403 });
  }

  const nextStatus = isHost || lobby.status === "started" ? "cancelled" : "waiting";
  const now = new Date();

  const result = await db
    .update(duelRooms)
    .set({
      guestId: isGuest ? null : lobby.guestId,
      status: nextStatus,
      endedAt: nextStatus === "cancelled" ? now : null,
      updatedAt: now,
    })
    .where(eq(duelRooms.id, lobby.id as any));

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  upsertLobbyState({
    ...lobby,
    guestId: isGuest ? null : lobby.guestId,
    status: nextStatus,
    endedAt: nextStatus === "cancelled" ? now : null,
    updatedAt: now,
  });

  if (nextStatus === "cancelled") {
    deleteDuelSession(lobby.inviteCode);
  }

  return NextResponse.json({
    status: nextStatus,
    guestId: isGuest ? null : lobby.guestId,
  });
}