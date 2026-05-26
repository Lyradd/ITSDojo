import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, duelSubject } from "@/db/schema";
import { getDuelSession, setDuelSession } from "@/lib/duel-session-store";
import { eq } from "drizzle-orm";

type TopicChoiceBody = {
  playerId?: string;
  topicId?: string;
};

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const body = (await req.json()) as TopicChoiceBody;
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";

  if (!playerId || !topicId) {
    return NextResponse.json({ error: "Missing playerId or topicId" }, { status: 400 });
  }

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const session = getDuelSession(lobby.inviteCode);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "awaiting_topic_choice") {
    return NextResponse.json({ error: "Session is not waiting for topic choice", session }, { status: 409 });
  }

  if (session.chooserId !== playerId) {
    return NextResponse.json({ error: "Only lower-scored player can choose next topic" }, { status: 403 });
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

  const updatedSession = {
    ...session,
    currentRound: session.currentRound + 1,
    currentTopicId: topicId,
    status: "in_progress" as const,
    chooserId: null,
    pendingScores: {},
    updatedAt: new Date().toISOString(),
  };

  setDuelSession(lobby.inviteCode, updatedSession);

  return NextResponse.json({ session: updatedSession });
}
