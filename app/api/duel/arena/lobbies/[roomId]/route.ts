import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms, duelSubject } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { recordHeartbeat, cleanupInactivePlayers } from "@/lib/arena-heartbeat";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const parsedId = Number(requestedRoomId);
    const isNumeric = Number.isInteger(parsedId) && parsedId > 0;
    const [lobby] = await db
      .select()
      .from(arenaRooms)
      .where(
        isNumeric
          ? or(eq(arenaRooms.id, parsedId), eq(arenaRooms.inviteCode, requestedRoomId))
          : eq(arenaRooms.inviteCode, requestedRoomId)
      )
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (playerId) {
      recordHeartbeat(lobby.id, playerId);
    }

    // Cleanup players who have disconnected
    await cleanupInactivePlayers(lobby);

    const [subject] = await db
      .select()
      .from(duelSubject)
      .where(eq(duelSubject.id, lobby.topicId))
      .limit(1);

    return NextResponse.json({
      ...lobby,
      subject: subject || null,
    });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch arena lobby" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;
    const parsedId = Number(requestedRoomId);
    const isNumeric = Number.isInteger(parsedId) && parsedId > 0;

    const body = await req.json();
    const topicId = Number(body.topicId);

    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topicId" }, { status: 400 });
    }

    const [lobby] = await db
      .select()
      .from(arenaRooms)
      .where(
        isNumeric
          ? or(eq(arenaRooms.id, parsedId), eq(arenaRooms.inviteCode, requestedRoomId))
          : eq(arenaRooms.inviteCode, requestedRoomId)
      )
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    const [updatedRoom] = await db
      .update(arenaRooms)
      .set({ topicId, updatedAt: new Date() })
      .where(eq(arenaRooms.id, lobby.id))
      .returning();

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("[arena/lobbies/[roomId]] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update arena lobby topic" }, { status: 500 });
  }
}
