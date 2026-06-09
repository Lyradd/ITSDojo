import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLobbyState, upsertLobbyState } from "@/lib/lobby-bus";

export async function GET(
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

  const [host] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, lobby.hostId))
    .limit(1);

  const hostFallback = {
    id: lobby.hostId,
    name: lobby.hostId,
    email: lobby.hostId,
    role: "mahasiswa" as const,
  };

  const guest = lobby.guestId
    ? await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, lobby.guestId))
        .limit(1)
    : [];

  const guestFallback = lobby.guestId
    ? {
        id: lobby.guestId,
        name: lobby.guestId,
        email: lobby.guestId,
        role: "mahasiswa" as const,
        avatar: null,
      }
    : null;

  return NextResponse.json({
    ...lobby,
    host: host ?? hostFallback,
    guest: guest[0] ?? guestFallback,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const body = await req.json();
    const topicId = Number(body.topicId);

    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topicId" }, { status: 400 });
    }

    const rooms = await db.select().from(duelRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // Update in database
    await db
      .update(duelRooms)
      .set({ topicId, updatedAt: new Date() })
      .where(eq(duelRooms.id, lobby.id));

    // Update in lobby bus cache
    const cacheKey = lobby.inviteCode;
    const currentCache = getLobbyState(cacheKey);
    if (currentCache) {
      upsertLobbyState({
        ...currentCache,
        topicId,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, topicId });
  } catch (error) {
    console.error("[duel/lobbies] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}