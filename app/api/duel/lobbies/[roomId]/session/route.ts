import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, duelSubject } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  questionIndex?: number;
  isFinalQuestion?: boolean;
};

function createInitialSession(roomKey: string, topicId: string): DuelSessionState {
  return {
    roomKey,
    minRounds: MIN_DUEL_ROUNDS,
    currentRound: 1,
    currentTopicId: topicId,
    currentQuestionIndex: 0,
    status: "in_progress",
    chooserId: null,
    pendingScores: {},
    questionSubmissions: {},
    roundResults: [],
    winnerId: null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSession(session: DuelSessionState): DuelSessionState {
  return {
    ...session,
    currentQuestionIndex: session.currentQuestionIndex ?? 0,
    pendingScores: session.pendingScores ?? {},
    questionSubmissions: session.questionSubmissions ?? {},
  };
}

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
  { params }: { params: Promise<{ roomId: string }> }
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
  if (lobby.endedAt) {
    const session = getDuelSession(roomKey) ?? {
      roomKey,
      minRounds: MIN_DUEL_ROUNDS,
      currentRound: MIN_DUEL_ROUNDS,
      currentTopicId: String(lobby.topicId),
      currentQuestionIndex: 0,
      status: "finished" as const,
      chooserId: null,
      pendingScores: {},
      questionSubmissions: {},
      roundResults: [],
      winnerId: null,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      session,
      hostId: lobby.hostId,
      guestId: lobby.guestId,
    });
  }

  const session = normalizeSession(upsertDuelSession(roomKey, () => createInitialSession(roomKey, String(lobby.topicId))));

  return NextResponse.json({
    session,
    hostId: lobby.hostId,
    guestId: lobby.guestId,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const body = (await req.json()) as SessionSubmitBody;
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const score = typeof body.score === "number" ? body.score : Number.NaN;
  const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : Number.NaN;

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (Number.isNaN(questionIndex) && (Number.isNaN(score) || score < 0)) {
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
  const existing = normalizeSession(getDuelSession(roomKey) ?? createInitialSession(roomKey, String(lobby.topicId)));

  if (!Number.isNaN(questionIndex)) {
    if (questionIndex < 0) {
      return NextResponse.json({ error: "Invalid questionIndex" }, { status: 400 });
    }

    if (existing.status === "finished") {
      return NextResponse.json({ session: existing });
    }

    if (existing.status === "awaiting_topic_choice") {
      return NextResponse.json({
        error: "Round already completed. Waiting for topic choice.",
        session: existing,
      }, { status: 409 });
    }

    if (questionIndex !== existing.currentQuestionIndex) {
      return NextResponse.json({
        error: "Question already advanced.",
        session: existing,
      }, { status: 409 });
    }

    const questionSubmissions = {
      ...existing.questionSubmissions,
      [playerId]: questionIndex,
    };

    const questionSession: DuelSessionState = {
      ...existing,
      questionSubmissions,
      updatedAt: new Date().toISOString(),
    };

    const hostSubmitted = Object.prototype.hasOwnProperty.call(questionSubmissions, lobby.hostId)
      && questionSubmissions[lobby.hostId] === questionIndex;
    const guestSubmitted = Object.prototype.hasOwnProperty.call(questionSubmissions, lobby.guestId)
      && questionSubmissions[lobby.guestId] === questionIndex;

    if (!hostSubmitted || !guestSubmitted) {
      setDuelSession(roomKey, questionSession);
      return NextResponse.json({ session: questionSession });
    }

    if (body.isFinalQuestion) {
      setDuelSession(roomKey, questionSession);
      return NextResponse.json({ session: questionSession });
    }

    const advancedSession: DuelSessionState = {
      ...existing,
      currentQuestionIndex: existing.currentQuestionIndex + 1,
      questionSubmissions: {},
      updatedAt: new Date().toISOString(),
    };

    setDuelSession(roomKey, advancedSession);
    return NextResponse.json({ session: advancedSession });
  }

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
      : Math.random() < 0.5
        ? lobby.hostId
        : lobby.guestId;

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
      currentQuestionIndex: 0,
      questionSubmissions: {},
      roundResults,
      winnerId: calculateWinnerId({ ...existing, roundResults }, lobby.hostId, lobby.guestId),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(duelRooms)
      .set({
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(duelRooms.id, lobby.id as any));

    setDuelSession(roomKey, finishedSession);
    return NextResponse.json({ session: finishedSession });
  }



  const chooseTopicSession: DuelSessionState = {
    ...existing,
    status: "awaiting_topic_choice",
    chooserId,
    pendingScores: {},
    currentQuestionIndex: 0,
    questionSubmissions: {},
    roundResults,
    updatedAt: new Date().toISOString(),
  };

  setDuelSession(roomKey, chooseTopicSession);
  return NextResponse.json({ session: chooseTopicSession });
}
