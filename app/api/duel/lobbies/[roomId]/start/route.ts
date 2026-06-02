import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { upsertDuelSession } from "@/lib/duel-session-store";
import { upsertLobbyState } from "@/lib/lobby-bus";

const MIN_DUEL_ROUNDS = 3;

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
    .update(duelRooms)
    .set({
      status: "started",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(duelRooms.id, lobby.id as any));

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  upsertLobbyState({
    ...lobby,
    status: "started",
    startedAt: new Date(),
    updatedAt: new Date(),
  });

  upsertDuelSession(lobby.inviteCode, () => ({
    roomKey: lobby.inviteCode,
    minRounds: MIN_DUEL_ROUNDS,
    currentRound: 1,
    currentTopicId: String(lobby.topicId),
    currentQuestionIndex: 0,
    status: "in_progress",
    chooserId: null,
    pendingScores: {},
    questionSubmissions: {},
    roundResults: [],
    winnerId: null,
    updatedAt: new Date().toISOString(),
  }));

  return NextResponse.json({ status: "started" });
}