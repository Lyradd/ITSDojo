import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { deleteDuelSession, getDuelSession } from "@/lib/duel-session-store";
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

  const parsedId = Number(requestedRoomId);
  const isNumeric = Number.isInteger(parsedId) && parsedId > 0;
  const [lobby] = await db
    .select()
    .from(duelRooms)
    .where(
      isNumeric
        ? or(eq(duelRooms.id, parsedId), eq(duelRooms.inviteCode, requestedRoomId))
        : eq(duelRooms.inviteCode, requestedRoomId)
    )
    .limit(1);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const isHost = role === "host" || playerId === lobby.hostId;
  const isGuest = role === "guest" || playerId === lobby.guestId;

  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Player is not in this lobby" }, { status: 403 });
  }

  const session = getDuelSession(lobby.inviteCode);
  const isFinished = session?.status === "finished" || lobby.endedAt !== null;

  const nextStatus = isFinished ? lobby.status : (isHost || lobby.status === "started" ? "cancelled" : "waiting");
  const now = new Date();

  let result;
  if (nextStatus === "cancelled" || isFinished) {
    result = await db
      .delete(duelRooms)
      .where(eq(duelRooms.id, lobby.id as any));
  } else {
    result = await db
      .update(duelRooms)
      .set({
        guestId: isGuest ? null : lobby.guestId,
        status: nextStatus,
        endedAt: null,
        updatedAt: now,
      })
      .where(eq(duelRooms.id, lobby.id as any));
  }

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (nextStatus === "cancelled" || isFinished) {
    upsertLobbyState({
      ...lobby,
      guestId: isGuest ? null : lobby.guestId,
      status: "cancelled",
      endedAt: now,
      updatedAt: now,
    });
  } else {
    upsertLobbyState({
      ...lobby,
      guestId: isGuest ? null : lobby.guestId,
      status: nextStatus,
      endedAt: null,
      updatedAt: now,
    });
  }

  if (nextStatus === "cancelled" || isFinished) {
    deleteDuelSession(lobby.inviteCode);
  }

  return NextResponse.json({
    status: nextStatus,
    guestId: isGuest ? null : lobby.guestId,
  });
}