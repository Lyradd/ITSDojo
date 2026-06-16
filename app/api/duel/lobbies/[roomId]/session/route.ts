import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, duelSubject, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  DuelSessionState,
  getDuelSession,
  setDuelSession,
  upsertDuelSession,
} from "@/lib/duel-session-store";
import { updateUserGameFinished } from "@/lib/gamification/streak";

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
    scores: {},
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
    scores: session.scores ?? {},
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

async function finalizeRoundSession(
  lobby: any,
  existing: DuelSessionState,
  pendingScores: Record<string, number>,
  roomKey: string
): Promise<DuelSessionState> {
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
      scores: {},
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

    // Calculate duel rewards and update user XP/profileXp/gems
    const hostId = lobby.hostId;
    const guestId = lobby.guestId;

    const totals = roundResults.reduce(
      (acc, round) => {
        return {
          host: acc.host + round.hostScore,
          guest: acc.guest + round.guestScore,
        };
      },
      { host: 0, guest: 0 }
    );

    const winnerId = finishedSession.winnerId;

    let hostXpAdded = totals.host;
    let guestXpAdded = totals.guest;
    let hostProfileXpAdded = totals.host;
    let guestProfileXpAdded = totals.guest;
    let hostGemsAdded = 0;
    let guestGemsAdded = 0;

    if (winnerId === hostId) {
      hostXpAdded += 50;
      hostProfileXpAdded += 50;
      hostGemsAdded += 10;

      guestXpAdded += 10;
      guestProfileXpAdded += 10;
      guestGemsAdded += 2;
    } else if (winnerId === guestId) {
      guestXpAdded += 50;
      guestProfileXpAdded += 50;
      guestGemsAdded += 10;

      hostXpAdded += 10;
      hostProfileXpAdded += 10;
      hostGemsAdded += 2;
    } else {
      // Draw
      hostXpAdded += 25;
      hostProfileXpAdded += 25;
      hostGemsAdded += 5;

      guestXpAdded += 25;
      guestProfileXpAdded += 25;
      guestGemsAdded += 5;
    }

    const streakEarnedPlayers: string[] = [];

    try {
      if (hostId) {
        const res = await updateUserGameFinished(hostId, hostXpAdded, hostProfileXpAdded, hostGemsAdded);
        if (res.success && res.streakEarnedNow) {
          streakEarnedPlayers.push(hostId);
        }
      }

      if (guestId) {
        const res = await updateUserGameFinished(guestId, guestXpAdded, guestProfileXpAdded, guestGemsAdded);
        if (res.success && res.streakEarnedNow) {
          streakEarnedPlayers.push(guestId);
        }
      }
    } catch (dbErr) {
      console.error("Failed to update user rewards on duel end:", dbErr);
    }

    // Trigger Gamification Goals (Safe async fire-and-forget)
    try {
      const { updateGoalProgressAction } = await import("@/actions/gamification");
      if (hostId) {
        updateGoalProgressAction('duel', 1, hostId).catch(console.error);
        if (winnerId === hostId) updateGoalProgressAction('duel_win', 1, hostId).catch(console.error);
      }
      if (guestId) {
        updateGoalProgressAction('duel', 1, guestId).catch(console.error);
        if (winnerId === guestId) updateGoalProgressAction('duel_win', 1, guestId).catch(console.error);
      }
    } catch (goalErr) {
      console.error("Failed to trigger duel goals:", goalErr);
    }

    // Broadcast updated leaderboard to all connected clients
    try {
      const io = (globalThis as any).__io;
      if (io) {
        const { getLeaderboardData } = await import("@/actions/leaderboard");
        const fresh = await getLeaderboardData();
        io.emit("leaderboard:update", fresh);
      }
    } catch (err) {
      console.warn("Leaderboard broadcast failed (non-fatal):", err);
    }

    finishedSession.streakEarnedPlayers = streakEarnedPlayers;
    setDuelSession(roomKey, finishedSession);
    return finishedSession;
  }

  const isBotChooser = chooserId && (chooserId.includes("bot") || chooserId.includes("local"));

  const chooseTopicSession: DuelSessionState = {
    ...existing,
    status: "awaiting_topic_choice",
    chooserId,
    pendingScores: {},
    currentQuestionIndex: 0,
    questionSubmissions: {},
    scores: {},
    roundResults,
    botChoiceScheduledAt: isBotChooser ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  setDuelSession(roomKey, chooseTopicSession);
  return chooseTopicSession;
}

async function checkAndProcessBotTopicChoice(
  session: DuelSessionState,
  lobby: any
): Promise<DuelSessionState> {
  if (session.status !== "awaiting_topic_choice" || !session.chooserId) {
    return session;
  }

  const isBotChooser = session.chooserId && (session.chooserId.includes("bot") || session.chooserId.includes("local"));
  if (!isBotChooser) {
    return session;
  }

  if (session.botChoiceScheduledAt) {
    const scheduledAt = new Date(session.botChoiceScheduledAt).getTime();
    const now = Date.now();
    if (now - scheduledAt >= 5000) {
      const topics = await db
        .select({ id: duelSubject.id })
        .from(duelSubject);
      const topicIds = topics.map((topic) => String(topic.id));
      const nextTopic = pickNextTopic(session.currentTopicId, topicIds);

      const nextRoundSession: DuelSessionState = {
        ...session,
        currentRound: session.currentRound + 1,
        currentTopicId: nextTopic,
        status: "in_progress",
        chooserId: null,
        botChoiceScheduledAt: undefined,
        pendingScores: {},
        currentQuestionIndex: 0,
        questionSubmissions: {},
        scores: {},
        updatedAt: new Date().toISOString(),
      };

      setDuelSession(session.roomKey, nextRoundSession);
      return nextRoundSession;
    }
  }

  return session;
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
    const session = getDuelSession(requestedRoomId);
    if (session) {
      return NextResponse.json({
        session,
        hostId: session.roomKey,
        guestId: "",
      });
    }
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (lobby.status !== "started") {
    if (lobby.endedAt) {
      const session = getDuelSession(lobby.inviteCode);
      if (session) {
        return NextResponse.json({
          session,
          hostId: lobby.hostId,
          guestId: lobby.guestId,
        });
      }
    }
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

  const processedSession = await checkAndProcessBotTopicChoice(session, lobby);

  return NextResponse.json({
    session: processedSession,
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
    const session = getDuelSession(requestedRoomId);
    if (session) {
      return NextResponse.json({ session });
    }
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (!lobby.guestId) {
    return NextResponse.json({ error: "Guest has not joined" }, { status: 409 });
  }

  if (playerId !== lobby.hostId && playerId !== lobby.guestId) {
    return NextResponse.json({ error: "Player is not in this duel" }, { status: 403 });
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
      scores: {},
      roundResults: [],
      winnerId: null,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ session });
  }

  const topics = await db
    .select({ id: duelSubject.id })
    .from(duelSubject);
  const topicIds = topics.map((topic) => String(topic.id));

  let existing = normalizeSession(getDuelSession(roomKey) ?? createInitialSession(roomKey, String(lobby.topicId)));
  existing = await checkAndProcessBotTopicChoice(existing, lobby);

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

    const isBotOpponent = lobby.guestId && (lobby.guestId.includes("bot") || lobby.guestId.includes("local"));

    const questionSubmissions = {
      ...existing.questionSubmissions,
      [playerId]: questionIndex,
    };

    const scores = {
      ...existing.scores,
      [playerId]: score,
    };

    if (isBotOpponent) {
      questionSubmissions[lobby.guestId] = questionIndex;
      const botHasSubmittedThis = (existing.questionSubmissions[lobby.guestId] ?? -1) >= questionIndex;
      if (!botHasSubmittedThis) {
        const botPrevScore = existing.scores[lobby.guestId] ?? 0;
        const botNewPoints = Math.random() > 0.4 ? 10 : 0;
        scores[lobby.guestId] = botPrevScore + botNewPoints;
      } else {
        scores[lobby.guestId] = existing.scores[lobby.guestId] ?? 0;
      }
    }

    const questionSession: DuelSessionState = {
      ...existing,
      questionSubmissions,
      scores,
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
      scores,
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

  const isBotOpponent = lobby.guestId && (lobby.guestId.includes("bot") || lobby.guestId.includes("local"));

  const pendingScores = {
    ...existing.pendingScores,
    [playerId]: score,
  };

  if (isBotOpponent) {
    pendingScores[lobby.guestId] = existing.scores[lobby.guestId] ?? 0;
  }

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

  const finalized = await finalizeRoundSession(lobby, existing, pendingScores, roomKey);
  return NextResponse.json({ session: finalized });
}
