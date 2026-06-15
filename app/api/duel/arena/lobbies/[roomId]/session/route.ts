import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms, duelSubject, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ArenaSessionState,
  getArenaSession,
  setArenaSession,
  upsertArenaSession,
} from "@/lib/arena-session-store";
import { recordHeartbeat, cleanupInactivePlayers } from "@/lib/arena-heartbeat";
import { updateUserGameFinished } from "@/lib/gamification/streak";

const MIN_ARENA_ROUNDS = 3;

type SessionSubmitBody = {
  playerId?: string;
  score?: number;
  questionIndex?: number;
  isFinalQuestion?: boolean;
};

function createInitialSession(roomKey: string, topicId: string, playerIds: string[]): ArenaSessionState {
  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => {
    initialScores[id] = 0;
  });
  return {
    roomKey,
    minRounds: MIN_ARENA_ROUNDS,
    currentRound: 1,
    currentTopicId: topicId,
    currentQuestionIndex: 0,
    status: "in_progress",
    chooserId: null,
    pendingScores: {},
    questionSubmissions: {},
    scores: initialScores,
    roundResults: [],
    winnerId: null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSession(session: ArenaSessionState): ArenaSessionState {
  return {
    ...session,
    currentQuestionIndex: session.currentQuestionIndex ?? 0,
    pendingScores: session.pendingScores ?? {},
    questionSubmissions: session.questionSubmissions ?? {},
    scores: session.scores ?? {},
    roundResults: session.roundResults ?? [],
  };
}

async function finalizeRoundSession(
  lobby: any,
  existing: ArenaSessionState,
  pendingScores: Record<string, number>,
  roomKey: string,
  playerIds: string[]
): Promise<ArenaSessionState> {
  // Find player(s) with the lowest score in the current round to choose next topic
  let lowestScore = Infinity;
  let lowestPlayers: string[] = [];
  playerIds.forEach((id) => {
    const s = pendingScores[id] ?? 0;
    if (s < lowestScore) {
      lowestScore = s;
      lowestPlayers = [id];
    } else if (s === lowestScore) {
      lowestPlayers.push(id);
    }
  });

  const chooserId = lowestPlayers.length > 0
    ? lowestPlayers[Math.floor(Math.random() * lowestPlayers.length)]
    : playerIds[0];

  const roundResult = {
    roundNumber: existing.currentRound,
    topicId: existing.currentTopicId,
    scores: { ...pendingScores },
    chooserId,
  };

  const roundResults = [...existing.roundResults, roundResult];

  if (roundResults.length >= MIN_ARENA_ROUNDS) {
    // Game Over - Calculate total cumulative scores
    const cumulativeTotals: Record<string, number> = {};
    playerIds.forEach((id) => {
      cumulativeTotals[id] = 0;
    });

    roundResults.forEach((round) => {
      playerIds.forEach((id) => {
        cumulativeTotals[id] += round.scores[id] ?? 0;
      });
    });

    // Find the winner (highest cumulative score)
    let highestScore = -1;
    let winnerId: string | null = null;
    playerIds.forEach((id) => {
      if (cumulativeTotals[id] > highestScore) {
        highestScore = cumulativeTotals[id];
        winnerId = id;
      }
    });

    const finishedSession: ArenaSessionState = {
      ...existing,
      status: "finished",
      chooserId: null,
      pendingScores: {},
      currentQuestionIndex: 0,
      questionSubmissions: {},
      scores: {},
      roundResults,
      winnerId,
      updatedAt: new Date().toISOString(),
    };

    // Update database status
    await db
      .update(arenaRooms)
      .set({
        status: "ended",
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(arenaRooms.id, lobby.id));

    // Award rewards to players based on their ranks
    const uniqueScores = Array.from(new Set(Object.values(cumulativeTotals))).sort((a, b) => b - a);

    const streakEarnedPlayers: string[] = [];

    for (const playerId of playerIds) {
      const total = cumulativeTotals[playerId] || 0;
      const rankIndex = uniqueScores.indexOf(total); // 0 = 1st, 1 = 2nd, 2 = 3rd, etc.

      let xpAdded = 10;
      let gemsAdded = 2;

      if (rankIndex === 0) {
        xpAdded = 50;
        gemsAdded = 10;
      } else if (rankIndex === 1) {
        xpAdded = 30;
        gemsAdded = 5;
      } else if (rankIndex === 2) {
        xpAdded = 20;
        gemsAdded = 3;
      }

      try {
        const res = await updateUserGameFinished(playerId, xpAdded, 0, gemsAdded);
        if (res.success && res.streakEarnedNow) {
          streakEarnedPlayers.push(playerId);
        }
      } catch (dbErr) {
        console.error(`Failed to update arena reward for user ${playerId}:`, dbErr);
      }
      
      // Trigger Gamification Goals
      try {
        const { updateGoalProgressAction } = await import("@/actions/gamification");
        updateGoalProgressAction('duel', 1, playerId).catch(console.error);
        if (winnerId === playerId) {
          updateGoalProgressAction('duel_win', 1, playerId).catch(console.error);
        }
      } catch (goalErr) {
        console.error("Failed to trigger duel goals:", goalErr);
      }
    }

    // Broadcast update if websocket is active
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
    setArenaSession(roomKey, finishedSession);
    return finishedSession;
  }

  // Next round
  const chooseTopicSession: ArenaSessionState = {
    ...existing,
    status: "awaiting_topic_choice",
    chooserId,
    pendingScores: {},
    currentQuestionIndex: 0,
    questionSubmissions: {},
    scores: {},
    roundResults,
    updatedAt: new Date().toISOString(),
  };

  setArenaSession(roomKey, chooseTopicSession);
  return chooseTopicSession;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      const session = getArenaSession(requestedRoomId);
      if (session && session.status === "finished") {
        return NextResponse.json({
          session,
          players: [],
        });
      }
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    if (lobby.status !== "started" && lobby.status !== "ended") {
      return NextResponse.json({ error: "Arena has not started" }, { status: 409 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (playerId) {
      recordHeartbeat(lobby.id, playerId);
    }

    // Cleanup players who have disconnected
    const activePlayers = await cleanupInactivePlayers(lobby);
    const playerIds = activePlayers.map((p) => p.id);

    const roomKey = lobby.inviteCode;

    if (lobby.endedAt || lobby.status === "ended") {
      const session = getArenaSession(roomKey) ?? {
        roomKey,
        minRounds: MIN_ARENA_ROUNDS,
        currentRound: MIN_ARENA_ROUNDS,
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

      return NextResponse.json({
        session,
        players: activePlayers,
      });
    }

    const session = normalizeSession(
      upsertArenaSession(roomKey, () => createInitialSession(roomKey, String(lobby.topicId), playerIds))
    );

    return NextResponse.json({
      session,
      players: activePlayers,
    });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/session] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch arena session" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const body = (await req.json()) as SessionSubmitBody;
    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    const score = typeof body.score === "number" ? body.score : Number.NaN;
    const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : Number.NaN;

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      const session = getArenaSession(requestedRoomId);
      if (session && session.status === "finished") {
        return NextResponse.json({ session });
      }
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
    const playerIds = players.map((p) => p.id);

    if (!playerIds.includes(playerId)) {
      return NextResponse.json({ error: "Player is not in this arena room" }, { status: 403 });
    }

    const roomKey = lobby.inviteCode;

    if (lobby.status === "ended" || lobby.endedAt) {
      const session = getArenaSession(roomKey) ?? {
        roomKey,
        minRounds: MIN_ARENA_ROUNDS,
        currentRound: MIN_ARENA_ROUNDS,
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
    const existing = normalizeSession(
      getArenaSession(roomKey) ?? createInitialSession(roomKey, String(lobby.topicId), playerIds)
    );

    // If submit question progress
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

      const scores = {
        ...existing.scores,
        [playerId]: score,
      };

      const questionSession: ArenaSessionState = {
        ...existing,
        questionSubmissions,
        scores,
        updatedAt: new Date().toISOString(),
      };

      // Check if all players in the lobby submitted
      const allSubmitted = playerIds.every(
        (id) =>
          Object.prototype.hasOwnProperty.call(questionSubmissions, id) &&
          questionSubmissions[id] === questionIndex
      );

      if (!allSubmitted) {
        setArenaSession(roomKey, questionSession);
        return NextResponse.json({ session: questionSession });
      }

      // If it's the final question of the round, don't advance the questionIndex automatically
      if (body.isFinalQuestion) {
        setArenaSession(roomKey, questionSession);
        return NextResponse.json({ session: questionSession });
      }

      // All submitted, and not final question, advance to next question
      const advancedSession: ArenaSessionState = {
        ...existing,
        currentQuestionIndex: existing.currentQuestionIndex + 1,
        questionSubmissions: {},
        scores,
        updatedAt: new Date().toISOString(),
      };

      setArenaSession(roomKey, advancedSession);
      return NextResponse.json({ session: advancedSession });
    }

    // Submit final round scores (finalizing round)
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

    // Check if all players submitted their final round score
    const allFinalized = playerIds.every((id) => Object.prototype.hasOwnProperty.call(pendingScores, id));

    if (!allFinalized) {
      const waitingSession: ArenaSessionState = {
        ...existing,
        pendingScores,
        updatedAt: new Date().toISOString(),
      };

      setArenaSession(roomKey, waitingSession);
      return NextResponse.json({ session: waitingSession });
    }

    const finalized = await finalizeRoundSession(lobby, existing, pendingScores, roomKey, playerIds);
    return NextResponse.json({ session: finalized });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/session] POST failed:", error);
    return NextResponse.json({ error: "Failed to process session step" }, { status: 500 });
  }
}
