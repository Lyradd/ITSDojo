export type ArenaSessionStatus = "in_progress" | "awaiting_topic_choice" | "finished";

export type ArenaRoundResult = {
  roundNumber: number;
  topicId: string;
  scores: Record<string, number>; // Player ID -> Round Score
  chooserId: string | null; // Who chose the topic or gets to choose next
};

export type ArenaSessionState = {
  roomKey: string;
  minRounds: number;
  currentRound: number;
  currentTopicId: string;
  currentQuestionIndex: number;
  status: ArenaSessionStatus;
  chooserId: string | null;
  pendingScores: Record<string, number>; // Player ID -> Pending score for current round
  questionSubmissions: Record<string, number>; // Player ID -> Completed question index
  scores: Record<string, number>; // Player ID -> Cumulative score
  roundResults: ArenaRoundResult[];
  winnerId: string | null;
  updatedAt: string;
};

type ArenaSessionStore = Map<string, ArenaSessionState>;

const globalStore = globalThis as typeof globalThis & {
  __itsdojoArenaSessions?: ArenaSessionStore;
};

const arenaSessionStore: ArenaSessionStore =
  globalStore.__itsdojoArenaSessions ?? new Map<string, ArenaSessionState>();

globalStore.__itsdojoArenaSessions = arenaSessionStore;

export function getArenaSession(roomKey: string) {
  const session = arenaSessionStore.get(roomKey);
  if (session) {
    return normalizeSession(session);
  }
  return undefined;
}

export function setArenaSession(roomKey: string, session: ArenaSessionState) {
  arenaSessionStore.set(roomKey, session);
  return session;
}

export function recordArenaQuestionSubmission(roomKey: string, playerId: string, questionIndex: number) {
  const existing = arenaSessionStore.get(roomKey);
  if (!existing) {
    return null;
  }

  const updated: ArenaSessionState = {
    ...existing,
    questionSubmissions: {
      ...existing.questionSubmissions,
      [playerId]: questionIndex,
    },
    updatedAt: new Date().toISOString(),
  };

  arenaSessionStore.set(roomKey, updated);
  return updated;
}

export function upsertArenaSession(roomKey: string, create: () => ArenaSessionState) {
  const existing = arenaSessionStore.get(roomKey);
  if (existing) {
    return normalizeSession(existing);
  }

  const created = create();
  arenaSessionStore.set(roomKey, created);
  return created;
}

export function deleteArenaSession(roomKey: string) {
  arenaSessionStore.delete(roomKey);
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
