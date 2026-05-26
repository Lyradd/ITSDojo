import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, duelSubject } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  DuelSessionState,
  getDuelSession,
  setDuelSession,
  upsertDuelSession,
} from "@/lib/duel-session-store";

const MIN_DUEL_ROUNDS = 3;

type SessionSubmitBody = {
  playerId?: string;
  score?: number;
};

function pickNextTopic(currentTopicId: string, topicIds: string[]) {
  const alternatives = topicIds.filter((topicId) => topicId !== currentTopicId);
  return alternatives[0] ?? currentTopicId;
}

function calculateWinnerId(session: DuelSessionState, hostId: string, guestId: string) {
  const totals = session.roundResults.reduce(
    (acc, round) => {
      return {
        host: acc.host + round.hostScore,
        guest: acc.guest + round.guestScore,
      };
    },
    { host: 0, guest: 0 }
  );

  if (totals.host > totals.guest) {
    return hostId;
  }

  if (totals.guest > totals.host) {
    return guestId;
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (lobby.status !== "started") {
    return NextResponse.json({ error: "Duel has not started" }, { status: 409 });
  }

  if (!lobby.guestId) {
    return NextResponse.json({ error: "Guest has not joined" }, { status: 409 });
  }

  const roomKey = lobby.inviteCode;
  const session = upsertDuelSession(roomKey, () => ({
    roomKey,
    minRounds: MIN_DUEL_ROUNDS,
    currentRound: 1,
    currentTopicId: String(lobby.topicId),
    status: "in_progress",
    chooserId: null,
    pendingScores: {},
    roundResults: [],
    winnerId: null,
    updatedAt: new Date().toISOString(),
  }));

  return NextResponse.json({
    session,
    hostId: lobby.hostId,
    guestId: lobby.guestId,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const body = (await req.json()) as SessionSubmitBody;
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const score = typeof body.score === "number" ? body.score : Number.NaN;

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (Number.isNaN(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (!lobby.guestId) {
    return NextResponse.json({ error: "Guest has not joined" }, { status: 409 });
  }

  if (playerId !== lobby.hostId && playerId !== lobby.guestId) {
    return NextResponse.json({ error: "Player is not in this duel" }, { status: 403 });
  }

  const topics = await db
    .select({ id: duelSubject.id })
    .from(duelSubject);
  const topicIds = topics.map((topic) => String(topic.id));

  const roomKey = lobby.inviteCode;
  const existing = getDuelSession(roomKey) ?? {
    roomKey,
    minRounds: MIN_DUEL_ROUNDS,
    currentRound: 1,
    currentTopicId: String(lobby.topicId),
    status: "in_progress" as const,
    chooserId: null,
    pendingScores: {},
    roundResults: [],
    winnerId: null,
    updatedAt: new Date().toISOString(),
  };

  if (existing.status === "finished") {
    return NextResponse.json({ session: existing });
  }

  if (existing.status === "awaiting_topic_choice") {
    return NextResponse.json({
      error: "Round already completed. Waiting for topic choice.",
      session: existing,
    }, { status: 409 });
  }

  const pendingScores = {
    ...existing.pendingScores,
    [playerId]: score,
  };

  const hostSubmitted = Object.prototype.hasOwnProperty.call(pendingScores, lobby.hostId);
  const guestSubmitted = Object.prototype.hasOwnProperty.call(pendingScores, lobby.guestId);

  if (!hostSubmitted || !guestSubmitted) {
    const waitingSession: DuelSessionState = {
      ...existing,
      pendingScores,
      updatedAt: new Date().toISOString(),
    };

    setDuelSession(roomKey, waitingSession);
    return NextResponse.json({ session: waitingSession });
  }

  const hostScore = pendingScores[lobby.hostId] ?? 0;
  const guestScore = pendingScores[lobby.guestId] ?? 0;

  const chooserId = hostScore < guestScore
    ? lobby.hostId
    : guestScore < hostScore
      ? lobby.guestId
      : null;

  const roundResult = {
    roundNumber: existing.currentRound,
    topicId: existing.currentTopicId,
    hostScore,
    guestScore,
    chooserId,
  };

  const roundResults = [...existing.roundResults, roundResult];

  if (roundResults.length >= MIN_DUEL_ROUNDS) {
    const finishedSession: DuelSessionState = {
      ...existing,
      status: "finished",
      chooserId: null,
      pendingScores: {},
      roundResults,
      winnerId: calculateWinnerId({ ...existing, roundResults }, lobby.hostId, lobby.guestId),
      updatedAt: new Date().toISOString(),
    };

    setDuelSession(roomKey, finishedSession);
    return NextResponse.json({ session: finishedSession });
  }

  if (!chooserId) {
    const autoNextTopic = pickNextTopic(existing.currentTopicId, topicIds);

    const advancedSession: DuelSessionState = {
      ...existing,
      currentRound: existing.currentRound + 1,
      currentTopicId: autoNextTopic,
      status: "in_progress",
      chooserId: null,
      pendingScores: {},
      roundResults,
      updatedAt: new Date().toISOString(),
    };

    setDuelSession(roomKey, advancedSession);
    return NextResponse.json({ session: advancedSession });
  }

  const chooseTopicSession: DuelSessionState = {
    ...existing,
    status: "awaiting_topic_choice",
    chooserId,
    pendingScores: {},
    roundResults,
    updatedAt: new Date().toISOString(),
  };

  setDuelSession(roomKey, chooseTopicSession);
  return NextResponse.json({ session: chooseTopicSession });
}
