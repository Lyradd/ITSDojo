export type DuelSessionStatus = "in_progress" | "awaiting_topic_choice" | "finished";

export type DuelRoundResult = {
  roundNumber: number;
  topicId: string;
  hostScore: number;
  guestScore: number;
  chooserId: string | null;
};

export type DuelSessionState = {
  roomKey: string;
  minRounds: number;
  currentRound: number;
  currentTopicId: string;
  currentQuestionIndex: number;
  status: DuelSessionStatus;
  chooserId: string | null;
  pendingScores: Record<string, number>;
  questionSubmissions: Record<string, number>;
  scores: Record<string, number>;
  roundResults: DuelRoundResult[];
  winnerId: string | null;
  streakEarnedPlayers?: string[];
  botChoiceScheduledAt?: string;
  updatedAt: string;
};

type DuelSessionStore = Map<string, DuelSessionState>;

const globalStore = globalThis as typeof globalThis & {
  __itsdojoDuelSessions?: DuelSessionStore;
};

const duelSessionStore: DuelSessionStore = globalStore.__itsdojoDuelSessions ?? new Map<string, DuelSessionState>();

globalStore.__itsdojoDuelSessions = duelSessionStore;

export function getDuelSession(roomKey: string) {
  return duelSessionStore.get(roomKey);
}

export function setDuelSession(roomKey: string, session: DuelSessionState) {
  duelSessionStore.set(roomKey, session);
  return session;
}

export function recordQuestionSubmission(roomKey: string, playerId: string, questionIndex: number) {
  const existing = duelSessionStore.get(roomKey);

  if (!existing) {
    return null;
  }

  const updated: DuelSessionState = {
    ...existing,
    questionSubmissions: {
      ...existing.questionSubmissions,
      [playerId]: questionIndex,
    },
    updatedAt: new Date().toISOString(),
  };

  duelSessionStore.set(roomKey, updated);
  return updated;
}

export function upsertDuelSession(roomKey: string, create: () => DuelSessionState) {
  const existing = duelSessionStore.get(roomKey);
  if (existing) {
    return existing;
  }

  const created = create();
  duelSessionStore.set(roomKey, created);
  return created;
}

export function deleteDuelSession(roomKey: string) {
  duelSessionStore.delete(roomKey);
}
