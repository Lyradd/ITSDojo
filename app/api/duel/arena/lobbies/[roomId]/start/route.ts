import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { upsertArenaSession } from "@/lib/arena-session-store";

const MIN_ARENA_ROUNDS = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    await db
      .update(arenaRooms)
      .set({
        status: "started",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(arenaRooms.id, lobby.id));

    // Initialize session state
    const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
    const initialScores: Record<string, number> = {};
    players.forEach((p) => {
      initialScores[p.id] = 0;
    });

    const session = upsertArenaSession(lobby.inviteCode, () => ({
      roomKey: lobby.inviteCode,
      minRounds: MIN_ARENA_ROUNDS,
      currentRound: 1,
      currentTopicId: String(lobby.topicId),
      currentQuestionIndex: 0,
      status: "in_progress",
      chooserId: null,
      pendingScores: {},
      questionSubmissions: {},
      scores: initialScores,
      roundResults: [],
      winnerId: null,
      updatedAt: new Date().toISOString(),
    }));

    return NextResponse.json({ status: "started", session });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/start] POST failed:", error);
    return NextResponse.json({ error: "Failed to start arena game" }, { status: 500 });
  }
}
