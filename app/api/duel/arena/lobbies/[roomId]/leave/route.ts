import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const body = await req.json();
    const playerId = body.playerId;

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
    const updatedPlayers = players.filter((p) => p.id !== playerId);

    const isHost = playerId === lobby.hostId;
    const isEnded = lobby.status === "ended";

    if (isHost || isEnded || updatedPlayers.length === 0) {
      await db.delete(arenaRooms).where(eq(arenaRooms.id, lobby.id));
      return NextResponse.json({ status: "deleted", players: [] });
    } else {
      await db
        .update(arenaRooms)
        .set({
          players: updatedPlayers,
          updatedAt: new Date(),
        })
        .where(eq(arenaRooms.id, lobby.id));

      return NextResponse.json({ status: "left", players: updatedPlayers });
    }
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/leave] POST failed:", error);
    return NextResponse.json({ error: "Failed to leave arena lobby" }, { status: 500 });
  }
}
