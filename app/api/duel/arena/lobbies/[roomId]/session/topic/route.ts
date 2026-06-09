import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms, duelSubject } from "@/db/schema";
import { getArenaSession, setArenaSession } from "@/lib/arena-session-store";
import { eq } from "drizzle-orm";

type TopicChoiceBody = {
  playerId?: string;
  topicId?: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const body = (await req.json()) as TopicChoiceBody;
    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";

    if (!playerId || !topicId) {
      return NextResponse.json({ error: "Missing playerId or topicId" }, { status: 400 });
    }

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    const session = getArenaSession(lobby.inviteCode);

    if (!session) {
      return NextResponse.json({ error: "Arena session not found" }, { status: 404 });
    }

    if (session.status !== "awaiting_topic_choice") {
      return NextResponse.json({ error: "Arena session is not waiting for topic choice", session }, { status: 409 });
    }

    if (session.chooserId !== playerId) {
      return NextResponse.json({ error: "Only the player with the lowest score can choose the next topic" }, { status: 403 });
    }

    const topicIdNumber = Number(topicId);

    if (Number.isNaN(topicIdNumber)) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    const [topic] = await db
      .select({ id: duelSubject.id })
      .from(duelSubject)
      .where(eq(duelSubject.id, topicIdNumber))
      .limit(1);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update in database
    await db
      .update(arenaRooms)
      .set({
        topicId: topicIdNumber,
        updatedAt: new Date(),
      })
      .where(eq(arenaRooms.id, lobby.id));

    // Update in-memory session for the next round
    const updatedSession = {
      ...session,
      currentRound: session.currentRound + 1,
      currentTopicId: topicId,
      currentQuestionIndex: 0,
      status: "in_progress" as const,
      chooserId: null,
      pendingScores: {},
      questionSubmissions: {},
      scores: {},
      updatedAt: new Date().toISOString(),
    };

    setArenaSession(lobby.inviteCode, updatedSession);

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/session/topic] POST failed:", error);
    return NextResponse.json({ error: "Failed to update next round topic" }, { status: 500 });
  }
}
