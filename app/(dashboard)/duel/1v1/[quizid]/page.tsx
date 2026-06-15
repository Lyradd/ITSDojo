"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import type { Question } from "@/lib/quiz-mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, LogOut, Swords, Zap, Gem, Flame } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { triggerConfetti } from "@/lib/confetti";
import { motion, AnimatePresence } from "framer-motion";

type LobbyRoom = {
  id: number;
  inviteCode: string;
  topicId: number;
  status: "waiting" | "joined" | "started" | "cancelled";
  host: { id: string; name: string; email: string; role: string } | null;
  guest: { id: string; name: string; email: string; role: string } | null;
};

type TopicOption = {
  id: string;
  subjectName: string;
};

type RoundSummary = {
  roundNumber: number;
  topicId: string;
  hostScore: number;
  guestScore: number;
  chooserId: string | null;
};

type DuelSession = {
  roomKey: string;
  minRounds: number;
  currentRound: number;
  currentTopicId: string;
  currentQuestionIndex: number;
  status: "in_progress" | "awaiting_topic_choice" | "finished";
  chooserId: string | null;
  pendingScores: Record<string, number>;
  questionSubmissions: Record<string, number>;
  scores?: Record<string, number>;
  roundResults: RoundSummary[];
  winnerId: string | null;
  streakEarnedPlayers?: string[];
  updatedAt: string;
};

const QUESTIONS_PER_ROUND = 3;
const MIN_DUEL_ROUNDS = 3;

function getRoundQuestions(pool: Question[], roundNumber: number) {

  if (pool.length <= QUESTIONS_PER_ROUND) {
    return pool.slice(0, QUESTIONS_PER_ROUND);
  }

  const startIndex = ((roundNumber - 1) * QUESTIONS_PER_ROUND) % pool.length;
  const selected = [];

  for (let i = 0; i < QUESTIONS_PER_ROUND; i += 1) {
    selected.push(pool[(startIndex + i) % pool.length]);
  }

  return selected;
}

async function readJsonError(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // Ignore parsing failures and use fallback.
  }

  return fallback;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id, email, name, role, isLoggedIn, streak, syncFromServer } = useUserStore();
  const roomId = searchParams.get("room");
  const routeTopicId = typeof params.quizid === "string" ? params.quizid : undefined;
  const [isMounted, setIsMounted] = useState(false);
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [duelSession, setDuelSession] = useState<DuelSession | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [submittingRoundScore, setSubmittingRoundScore] = useState(false);
  const [choosingTopic, setChoosingTopic] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((topics: Array<{ id: number; subjectName: string }>) => {
        setTopicOptions(
          topics.map((topic) => ({
            id: String(topic.id),
            subjectName: topic.subjectName,
          }))
        );
      })
      .catch(() => {
        setTopicOptions([]);
      });
  }, []);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setRoomError(null);
      setSessionError(null);
      setDuelSession(null);
      setJoinAttempted(false);
      return;
    }

    if (!email) {
      return;
    }

    // Stop polling room details if it has already started
    if (room?.status === "started") {
      return;
    }

    let active = true;
    let retryCount = 0;
    const encodedRoomId = encodeURIComponent(roomId);

    const syncRoom = async () => {
      try {
        const response = await fetch(`/api/duel/lobbies/${encodedRoomId}`);

        if (!response.ok) {
          if (response.status === 404 && retryCount < 3) {
            retryCount += 1;
            window.setTimeout(() => {
              if (active) {
                void syncRoom();
              }
            }, 400);
            return;
          }

          if (active) {
            setRoomError("Lobby tidak ditemukan.");
          }
          return;
        }

        const data = (await response.json()) as LobbyRoom;

        if (!active) {
          return;
        }

        // Debug: log full lobby payload to help diagnose host/guest name issues
        // Remove or disable in production
        console.debug('[duel] fetched lobby', data);
        setRoom(data);
        setRoomError(null);

        const shouldJoin =
          data.status === "waiting" &&
          data.host?.id !== email &&
          data.guest?.id !== email;

        if (shouldJoin && !joinAttempted) {
          setJoinAttempted(true);
          const joinResponse = await fetch(`/api/duel/lobbies/${encodedRoomId}/join`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              guestId: email,
              guestEmail: email,
              guestName: name,
              guestRole: role,
            }),
          });

          if (!joinResponse.ok && active) {
            setRoomError("Gagal bergabung ke lobby.");
            setJoinAttempted(false);
          }
        }
      } catch {
        if (active) {
          setRoomError("Gagal memuat lobby.");
          setSessionError(null);
          setDuelSession(null);
          setJoinAttempted(false);
        }
      }
    };

    void syncRoom();
    const interval = window.setInterval(syncRoom, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [roomId, email, name, role, joinAttempted, room?.status]);

  const currentTopicId = duelSession?.currentTopicId ?? routeTopicId;
  const currentRound = duelSession?.currentRound ?? 1;
  const roundSummaries = duelSession?.roundResults ?? [];
  const playedTopicIds = useMemo(() => {
    return roundSummaries.map((r) => String(r.topicId));
  }, [roundSummaries]);

  useEffect(() => {
    if (!currentTopicId) {
      setTopicQuestions([]);
      setQuestionError(null);
      setQuestionLoading(false);
      return;
    }

    let active = true;

    const syncQuestions = async () => {
      setQuestionLoading(true);
      try {
        const response = await fetch(`/api/duel/topics/${encodeURIComponent(currentTopicId)}/questions`);

        if (!response.ok) {
          if (active) {
            setQuestionError(await readJsonError(response, "Gagal memuat soal duel."));
          }
          return;
        }

        const payload = (await response.json()) as { questions: Question[] };

        if (!active) {
          return;
        }

        setTopicQuestions(payload.questions);
        setQuestionError(null);
      } catch {
        if (active) {
          setQuestionError("Gagal memuat soal duel.");
          setTopicQuestions([]);
        }
      } finally {
        if (active) {
          setQuestionLoading(false);
        }
      }
    };

    void syncQuestions();

    return () => {
      active = false;
    };
  }, [currentTopicId]);

  const isHostUser =
    Boolean(email) &&
    Boolean(room?.host) &&
    (room?.host?.id === email || room?.host?.email === email);
  const isGuestUser =
    Boolean(email) &&
    Boolean(room?.guest) &&
    (room?.guest?.id === email || room?.guest?.email === email);
  const currentPlayerId =
    isHostUser ? room?.host?.id : isGuestUser ? room?.guest?.id : email ?? "";
  const opponentPlayerId =
    currentPlayerId === room?.host?.id ? room?.guest?.id : room?.host?.id;

  const questions = useMemo(() => getRoundQuestions(topicQuestions, currentRound), [topicQuestions, currentRound]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFinalQuestion = questions.length > 0 && currentIndex === questions.length - 1;
  const [answers, setAnswers] = useState<Record<string, { answer: string | number; correct: boolean; points: number }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(questions[0]?.timeLimit ?? 30);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showChooseTopicModal, setShowChooseTopicModal] = useState(false);
  const [delayedSessionStatus, setDelayedSessionStatus] = useState<"in_progress" | "awaiting_topic_choice" | "finished" | null>(null);
  const [countdownShown, setCountdownShown] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number>(0);

  const isHost = room?.host?.id === id;
  const opponentKey = isHost ? "guest" : "host";
  const opponentName =
    room?.[opponentKey]?.name ?? searchParams.get("opponentName") ?? "Lawan";
  const waitingForLobby = Boolean(roomId) && (!room || room.status !== "started");

  const activeStatus = delayedSessionStatus ?? duelSession?.status;
  const finished = activeStatus === "finished";
  const isPlayerChoosingTopic =
    activeStatus === "awaiting_topic_choice" && duelSession?.chooserId === currentPlayerId;
  const waitingForOpponentTopicChoice =
    activeStatus === "awaiting_topic_choice" && duelSession?.chooserId !== currentPlayerId;
  const hasCurrentPlayerSubmitted =
    typeof currentPlayerId === "string" && currentPlayerId.length > 0
      ? Object.prototype.hasOwnProperty.call(duelSession?.pendingScores ?? {}, currentPlayerId)
      : false;
  const hasOpponentSubmitted =
    typeof opponentPlayerId === "string" && opponentPlayerId.length > 0
      ? Object.prototype.hasOwnProperty.call(duelSession?.pendingScores ?? {}, opponentPlayerId)
      : false;
  const waitingForOpponentScore =
    activeStatus === "in_progress" && hasCurrentPlayerSubmitted && !hasOpponentSubmitted;
  const hasCurrentQuestionSubmitted =
    typeof currentPlayerId === "string" && currentPlayerId.length > 0
      ? (duelSession?.questionSubmissions?.[currentPlayerId] ?? -1) === currentIndex
      : false;
  const hasOpponentQuestionSubmitted =
    typeof opponentPlayerId === "string" && opponentPlayerId.length > 0
      ? (duelSession?.questionSubmissions?.[opponentPlayerId] ?? -1) === currentIndex
      : false;
  const bothQuestionSubmitted = hasCurrentQuestionSubmitted && hasOpponentQuestionSubmitted;
  const waitingForOpponentQuestion = isSubmitted && hasCurrentQuestionSubmitted && !hasOpponentQuestionSubmitted;
  const topicName =
    topicOptions.find((topic) => topic.id === currentTopicId)?.subjectName ??
    `Topik ${currentTopicId ?? "Umum"}`;
  const liveRoundScore = Object.values(answers).reduce((sum, item) => sum + item.points, 0);
  const totalPlayerScore = roundSummaries.reduce((sum, round) => {
    if (!currentPlayerId) return sum;
    return sum + (currentPlayerId === room?.host?.id ? round.hostScore : round.guestScore);
  }, 0);
  const totalOpponentScoreBase = roundSummaries.reduce((sum, round) => {
    if (!currentPlayerId) return sum;
    return sum + (currentPlayerId === room?.host?.id ? round.guestScore : round.hostScore);
  }, 0);

  const cPlayerId = currentPlayerId || "";
  const oPlayerId = opponentPlayerId || "";

  const currentRoundPlayerScore = (activeStatus === "awaiting_topic_choice" || finished)
    ? 0
    : (cPlayerId && duelSession?.pendingScores?.[cPlayerId] !== undefined)
      ? (duelSession?.pendingScores?.[cPlayerId] ?? 0)
      : Object.keys(answers).length > 0
        ? liveRoundScore
        : (cPlayerId && duelSession?.scores?.[cPlayerId] !== undefined)
          ? (duelSession?.scores?.[cPlayerId] ?? 0)
          : 0;

  const currentRoundOpponentScore = (activeStatus === "awaiting_topic_choice" || finished)
    ? 0
    : (oPlayerId && duelSession?.pendingScores?.[oPlayerId] !== undefined)
      ? (duelSession?.pendingScores?.[oPlayerId] ?? 0)
      : (oPlayerId && duelSession?.scores?.[oPlayerId] !== undefined)
        ? (duelSession?.scores?.[oPlayerId] ?? 0)
        : 0;

  const inProgressPlayerScore = totalPlayerScore + currentRoundPlayerScore;
  const totalOpponentScore = totalOpponentScoreBase + currentRoundOpponentScore;

  const resetQuizState = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setTimeRemaining(questions[0]?.timeLimit ?? 30);
  };

  const finalizeRound = useCallback(async () => {
    if (!roomId || !currentPlayerId) {
      setSessionError("Identitas pemain tidak valid.");
      return;
    }

    if (submittingRoundScore) {
      return;
    }

    const playerRoundScore = questions.reduce(
      (sum, question) => sum + (answers[question.id]?.points ?? 0),
      0
    );

    setSubmittingRoundScore(true);
    try {
      const encodedRoomId = encodeURIComponent(roomId);
      const response = await fetch(`/api/duel/lobbies/${encodedRoomId}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
          score: playerRoundScore,
        }),
      });

      if (!response.ok) {
        setSessionError(await readJsonError(response, "Gagal submit skor round."));
        return;
      }

      const payload = (await response.json()) as { session: DuelSession };
      setDuelSession(payload.session);
      setSessionError(null);
    } catch {
      setSessionError("Gagal submit skor round.");
    } finally {
      setSubmittingRoundScore(false);
    }
  }, [roomId, currentPlayerId, submittingRoundScore, questions, answers]);

  useEffect(() => {
    if (!roomId || !room || room.status !== "started") {
      setDuelSession(null);
      setSessionError(null);
      return;
    }

    if (finished) {
      return;
    }

    let active = true;
    const encodedRoomId = encodeURIComponent(roomId);

    const syncSession = async () => {
      try {
        const response = await fetch(`/api/duel/lobbies/${encodedRoomId}/session`);

        if (!response.ok) {
          if (active) {
            // Fetch room status once to check if cancelled
            try {
              const roomResponse = await fetch(`/api/duel/lobbies/${encodedRoomId}`);
              if (roomResponse.ok) {
                const roomData = await roomResponse.json();
                setRoom(roomData);
              }
            } catch {
              // Ignore room fetch error
            }

            setSessionError(await readJsonError(response, "Gagal memuat sesi duel."));
          }
          return;
        }

        const payload = (await response.json()) as { session: DuelSession };

        if (!active) {
          return;
        }

        setDuelSession(payload.session);
        setSessionError(null);
      } catch {
        if (active) {
          setSessionError("Gagal memuat sesi duel.");
        }
      }
    };

    void syncSession();
    const interval = window.setInterval(syncSession, isSubmitted ? 750 : 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isSubmitted, roomId, room, finished]);

  useEffect(() => {
    const nextQuestionIndex = duelSession?.currentQuestionIndex;

    if (typeof nextQuestionIndex !== "number" || nextQuestionIndex <= currentIndex) {
      return;
    }

    const nextQuestion = questions[nextQuestionIndex];

    if (!nextQuestion) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(nextQuestionIndex);
      setIsSubmitted(false);
      setTimeRemaining(nextQuestion.timeLimit ?? 30);
    }, 3000); // 3-second delay to show intermediate question feedback

    return () => clearTimeout(timer);
  }, [currentIndex, duelSession?.currentQuestionIndex, questions]);

  useEffect(() => {
    if (!duelSession) {
      setDelayedSessionStatus(null);
      return;
    }

    if (
      (duelSession.status === "awaiting_topic_choice" || duelSession.status === "finished") &&
      isFinalQuestion &&
      isSubmitted
    ) {
      const timer = setTimeout(() => {
        setDelayedSessionStatus(duelSession.status);
      }, 3000); // 3-second delay to show final question feedback before screen transition
      return () => clearTimeout(timer);
    } else {
      setDelayedSessionStatus(duelSession.status);
    }
  }, [duelSession?.status, isFinalQuestion, isSubmitted]);

  const leaveLobby = async () => {
    if (!roomId || !currentPlayerId || !room) {
      return;
    }

    const roleForLeave = currentPlayerId === room.host?.id ? "host" : "guest";

    try {
      await fetch(`/api/duel/lobbies/${encodeURIComponent(roomId)}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
          role: roleForLeave,
        }),
      });
    } catch {
      // Best effort leave; navigation should still continue.
    }
  };

  const handleExitQuiz = async () => {
    await leaveLobby();

    resetQuizState();
    setShowExitPrompt(false);
    router.push("/duel/1v1");
  };

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setTimeRemaining(questions[0]?.timeLimit ?? 30);
  }, [roomId]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setTimeRemaining(questions[0]?.timeLimit ?? 30);
  }, [questions]);

  useEffect(() => {
    if (finished) {
      // Trigger Misi Main 1x Brain Duel (Apapun hasilnya)
      useUserStore.getState().incrementProgress('comp-1', 1);

      if (duelSession?.winnerId === currentPlayerId) {
        triggerConfetti();
        // Trigger Misi Menang 1v1 Brain Duel
        useUserStore.getState().incrementProgress('comp-2', 1);
      }
    }
  }, [finished, duelSession?.winnerId, currentPlayerId]);

  useEffect(() => {
    if (finished && id) {
      const syncProfile = async () => {
        try {
          const { getUserProfile } = await import("@/actions/auth");
          const res = await getUserProfile(id);
          if (res.success && res.user) {
            syncFromServer({
              level: res.user.level,
              profileXp: res.user.profileXp,
              xp: res.user.xp,
              gems: res.user.gems,
              streak: res.user.streak,
              accuracy: res.user.accuracy,
              completedLessonIds: res.user.completedLessonIds,
              gamificationData: res.user.gamificationData,
              enrolledCourseIds: res.user.enrolledCourseIds,
            });
          }
        } catch (e) {
          console.error("Failed to sync profile after duel end:", e);
        }
      };
      const timer = setTimeout(syncProfile, 500);
      return () => clearTimeout(timer);
    }
  }, [finished, id, syncFromServer]);

  useEffect(() => {
    if (room?.status === "started" && !countdownShown && !finished) {
      setStartCountdown(3);
      setCountdownShown(true);
    }
  }, [room?.status, countdownShown, finished]);

  useEffect(() => {
    if (startCountdown <= 0) return;

    const timer = setTimeout(() => {
      setStartCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [startCountdown]);

  const syncQuestionSubmission = useCallback(async (questionIndex: number, currentScore: number) => {
    if (!roomId || !currentPlayerId || !room) {
      return;
    }

    try {
      const encodedRoomId = encodeURIComponent(roomId);
      const response = await fetch(`/api/duel/lobbies/${encodedRoomId}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
          questionIndex,
          score: currentScore,
          isFinalQuestion: questionIndex >= questions.length - 1,
        }),
      });

      if (!response.ok) {
        setSessionError(await readJsonError(response, "Gagal sinkronisasi jawaban."));
        return;
      }

      const payload = (await response.json()) as { session: DuelSession };
      setDuelSession(payload.session);
      setSessionError(null);
    } catch {
      setSessionError("Gagal sinkronisasi jawaban.");
    }
  }, [roomId, currentPlayerId, room, questions]);

  const currentQuestion = questions[currentIndex];
  const totalScore = inProgressPlayerScore;

  const handleSubmit = useCallback((answer: string | number) => {
    if (!currentQuestion || isSubmitted) return;

    let isCorrect = false;
    const qType = currentQuestion.questionType;

    if (qType === "multiple_choice" || qType === "true_false") {
      isCorrect = answer !== "" && String(answer).toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
    } else if (qType === "short_answer") {
      isCorrect = answer !== "" && String(answer).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();
    } else if (qType === "slider") {
      isCorrect = answer !== "" && Number(answer) === Number(currentQuestion.correctAnswer);
    } else {
      isCorrect = String(answer).toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
    }

    const points = isCorrect ? (currentQuestion as any).points || 10 : 0;
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        answer,
        correct: isCorrect,
        points,
      },
    };

    setAnswers(newAnswers);
    setIsSubmitted(true);

    const currentScore = Object.values(newAnswers).reduce((sum, item) => sum + item.points, 0);
    void syncQuestionSubmission(currentIndex, currentScore);
  }, [currentQuestion, isSubmitted, answers, currentIndex, syncQuestionSubmission]);

  useEffect(() => {
    if (
      finished ||
      questions.length === 0 ||
      waitingForLobby ||
      isPlayerChoosingTopic ||
      waitingForOpponentTopicChoice ||
      waitingForOpponentScore ||
      isSubmitted ||
      startCountdown > 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, currentIndex, isSubmitted, questions.length, waitingForLobby, isPlayerChoosingTopic, waitingForOpponentTopicChoice, waitingForOpponentScore, startCountdown]);

  // Auto-submit empty answer when timer runs out
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted && currentQuestion) {
      handleSubmit("");
    }
  }, [timeRemaining, isSubmitted, currentQuestion, handleSubmit]);

  useEffect(() => {
    if (
      isFinalQuestion &&
      bothQuestionSubmitted &&
      !hasCurrentPlayerSubmitted &&
      !submittingRoundScore
    ) {
      const timer = setTimeout(() => {
        void finalizeRound();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    isFinalQuestion,
    bothQuestionSubmitted,
    hasCurrentPlayerSubmitted,
    submittingRoundScore,
    finalizeRound,
  ]);

  const chooseNextTopic = async (topicId: string) => {
    if (!roomId || !currentPlayerId || choosingTopic) {
      return;
    }

    setChoosingTopic(true);
    try {
      const encodedRoomId = encodeURIComponent(roomId);
      const response = await fetch(`/api/duel/lobbies/${encodedRoomId}/session/topic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
          topicId,
        }),
      });

      if (!response.ok) {
        setSessionError(await readJsonError(response, "Gagal memilih topik round berikutnya."));
        return;
      }

      const payload = (await response.json()) as { session: DuelSession };
      setDuelSession(payload.session);
      setSessionError(null);
      // hide modal when choice was successful
      setShowChooseTopicModal(false);
    } catch {
      setSessionError("Gagal memilih topik round berikutnya.");
    } finally {
      setChoosingTopic(false);
    }
  };

  useEffect(() => {
    if (activeStatus === "awaiting_topic_choice" && duelSession?.chooserId === currentPlayerId) {
      setShowChooseTopicModal(true);
    } else {
      setShowChooseTopicModal(false);
    }
  }, [activeStatus, duelSession?.chooserId, currentPlayerId]);

  const handleNext = () => {
    void finalizeRound();
  };

  if (!isMounted) {
    return null;
  }

  if (!isLoggedIn) {
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="w-full p-8 text-center max-w-md shadow-2xl border-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
          <Swords className="mx-auto mb-4 h-12 w-12 text-blue-600 dark:text-blue-400 animate-bounce" />
          <h1 className="text-2xl font-bold mb-2">Belum Masuk Akun</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Kamu mendapatkan undangan untuk duel 1v1 ini. Silakan masuk akun terlebih dahulu untuk bertanding!
          </p>
          <Button onClick={() => router.push(loginUrl)} className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700">
            Masuk Akun
          </Button>
        </Card>
      </div>
    );
  }

  if (roomId && roomError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-xl">
          <h1 className="text-2xl font-bold mb-3">Lobby tidak tersedia</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{roomError}</p>
          <Button onClick={() => router.push("/duel/1v1")}>Kembali ke duel</Button>
        </Card>
      </div>
    );
  }

  if (roomId && !room && !roomError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="w-full p-8 text-center">
          <Swords className="mx-auto mb-4 h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Menghubungkan ke lobby</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Kami sedang mengambil status room dari Neon dan menyiapkan duelmu.
          </p>
        </Card>
      </div>
    );
  }

  if (roomId && room && room.status !== "started" && !finished) {
    if (room.status === "cancelled") {
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
          <Card className="w-full p-8 text-center">
            <Swords className="mx-auto mb-4 h-10 w-10 text-red-600" />
            <h1 className="text-2xl font-bold mb-2">Duel dihentikan</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Salah satu pemain keluar dari duel, sehingga sesi ini diterminasi.
            </p>
            <Button onClick={() => router.push("/duel/1v1")}>Kembali ke duel</Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="w-full p-8">
          <div className="mb-4 flex items-center gap-3">
            <Swords className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Lobby Duel 1v1</h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {room.status === "joined"
                  ? "Pemain kedua sudah masuk. Menunggu host memulai duel."
                  : "Menunggu pemain lain bergabung."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Host</p>
              <p className="text-lg font-semibold">{room.host?.name ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
            {room.status === "waiting"
              ? "Room sudah aktif di Neon dan akan update otomatis saat lawan bergabung."
              : "Lobby siap. Host bisa memulai duel kapan saja."}
          </div>

          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              void (async () => {
                await leaveLobby();
                router.push("/duel/1v1");
              })();
            }}
          >
            Keluar
          </Button>
        </Card>
      </div>
    );
  }

  if (startCountdown > 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-black/90 backdrop-blur-md transition-all duration-300">
        <motion.div
          key={startCountdown}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Swords className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-bounce mb-2" />
          <h1 className="text-3xl font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Duel Dimulai Dalam
          </h1>
          <span className="text-[120px] font-black leading-none text-blue-600 dark:text-blue-400 drop-shadow-[0_10px_10px_rgba(37,99,235,0.2)]">
            {startCountdown}
          </span>
          <span className="text-sm font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
            Bersiaplah!
          </span>
        </motion.div>
      </div>
    );
  }

  if (roomId && room && room.status === "started" && !duelSession && !sessionError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="w-full p-8 text-center">
          <Swords className="mx-auto mb-4 h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Menyiapkan sesi duel</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Menyinkronkan ronde aktif dan skor antar pemain.
          </p>
        </Card>
      </div>
    );
  }

  if (roomId && sessionError && !finished) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-xl">
          <h1 className="text-2xl font-bold mb-3">Sesi duel bermasalah</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{sessionError}</p>
          <Button onClick={() => router.push("/duel/1v1")}>Kembali ke duel</Button>
        </Card>
      </div>
    );
  }

  if (questionError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-xl">
          <h1 className="text-2xl font-bold mb-3">Soal duel bermasalah</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{questionError}</p>
          <Button onClick={() => router.refresh()}>Coba lagi</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-16 pb-8 pt-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-md -mx-16 px-16 pt-8 pb-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 transition-all duration-200">
        <div>
          <h1 className="text-3xl font-bold">
            {topicName}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ronde {Math.min(currentRound, duelSession?.minRounds ?? MIN_DUEL_ROUNDS)} dari {duelSession?.minRounds ?? MIN_DUEL_ROUNDS} ronde • {QUESTIONS_PER_ROUND} soal per round
          </p>
        </div>

        {/* Live Score Display */}
        {!finished && room && (
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-full px-5 py-2 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Kamu</span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400">{totalScore}</span>
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-rose-600 dark:text-rose-400">{totalOpponentScore}</span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{opponentName}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExitPrompt(true)}
          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        <section>
          {finished ? (
            <Card className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-semibold">Duel Selesai</h2>
              </div>
              <p className="mb-4 font-bold text-2xl uppercase tracking-wider">
                {duelSession?.winnerId === currentPlayerId ? (
                  <span className="text-emerald-600 dark:text-emerald-400">YOU WIN! 🎉</span>
                ) : duelSession?.winnerId ? (
                  <span className="text-rose-600 dark:text-rose-400">YOU LOSE! 😢</span>
                ) : (
                  <span className="text-zinc-600 dark:text-zinc-400">DRAW! 🤝</span>
                )}
              </p>

              {/* XP and Gems Gained display */}
              {(() => {
                const winnerId = duelSession?.winnerId;
                const isWinner = winnerId === currentPlayerId;
                const isDraw = winnerId === null;
                const bonusXp = isWinner ? 50 : isDraw ? 25 : 10;
                const gemsGained = isWinner ? 10 : isDraw ? 5 : 2;
                const showStreakCard = Boolean(currentPlayerId && duelSession?.streakEarnedPlayers?.includes(currentPlayerId));

                return (
                  <div className={`grid gap-4 mb-6 ${showStreakCard ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50 shadow-sm transition-all duration-200 hover:scale-[1.02]">
                      <Zap className="w-8 h-8 text-yellow-500 mb-1" fill="currentColor" />
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">XP Diperoleh</span>
                      <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">+{totalPlayerScore + bonusXp} XP</span>
                      <span className="text-[10px] text-zinc-400">({totalPlayerScore} skor + {bonusXp} bonus)</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 shadow-sm transition-all duration-200 hover:scale-[1.02]">
                      <Gem className="w-8 h-8 text-blue-500 mb-1" fill="currentColor" />
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Gems Diperoleh</span>
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">+{gemsGained} Gems</span>
                      <span className="text-[10px] text-zinc-400">({isWinner ? "Bonus Menang" : isDraw ? "Bonus Seri" : "Bonus Kalah"})</span>
                    </div>
                    {showStreakCard && (
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 shadow-sm transition-all duration-200 hover:scale-[1.02]">
                        <Flame className="w-8 h-8 text-orange-500 mb-1 animate-pulse" fill="currentColor" />
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Streak Kamu</span>
                        <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{streak} Hari</span>
                        <span className="text-[10px] text-zinc-400">Kobarkan terus apimu! 🔥</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-4">
                {roundSummaries.map((round) => {
                  const playerRoundScore = currentPlayerId === room?.host?.id ? round.hostScore : round.guestScore;
                  const opponentRoundScore = currentPlayerId === room?.host?.id ? round.guestScore : round.hostScore;

                  return (
                    <div key={round.roundNumber} className="rounded-2xl border border-zinc-200 p-4">
                      <div className="font-semibold">
                        Round {round.roundNumber} - {topicOptions.find((topic) => topic.id === round.topicId)?.subjectName ?? `Topik ${round.topicId}`}
                      </div>
                      <div className="mt-2 text-sm text-zinc-600">
                        Kamu: {playerRoundScore} | {opponentName}: {opponentRoundScore}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button onClick={() => router.push("/duel/1v1")} variant="outline" className="w-full sm:w-auto">
                  Pilih Topik Lain
                </Button>
                <Button onClick={async () => {
                  await leaveLobby();
                  router.push("/duel/1v1");
                }} className="w-full sm:w-auto">
                  Selesai
                </Button>
              </div>
            </Card>
          ) : isPlayerChoosingTopic ? (
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-3">Kamu skor lebih rendah di round ini</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Sesuai aturan duel, pemain dengan skor lebih rendah memilih topik round berikutnya.
              </p>

              {/* Scoreboard display */}
              {(() => {
                const latestRound = roundSummaries[roundSummaries.length - 1];
                const latestPlayerScore = latestRound
                  ? (currentPlayerId === room?.host?.id ? latestRound.hostScore : latestRound.guestScore)
                  : 0;
                const latestOpponentScore = latestRound
                  ? (currentPlayerId === room?.host?.id ? latestRound.guestScore : latestRound.hostScore)
                  : 0;

                return (
                  <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">Hasil Duel Sementara</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-500 block">Kamu</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-400">Ronde ini: <strong className="text-blue-600 dark:text-blue-400">{latestPlayerScore}</strong></span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Total: {totalPlayerScore}</span>
                        </div>
                      </div>
                      <div className="space-y-1 border-l border-zinc-200 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 block">{opponentName}</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-400">Ronde ini: <strong className="text-zinc-600 dark:text-zinc-400">{latestOpponentScore}</strong></span>
                          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total: {totalOpponentScoreBase}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-3">
                {topicOptions
                  .filter((topic) => !playedTopicIds.includes(topic.id))
                  .map((topic) => (
                    <Button
                      key={topic.id}
                      variant="outline"
                      onClick={() => void chooseNextTopic(topic.id)}
                      disabled={choosingTopic}
                    >
                      {choosingTopic ? "Menyimpan pilihan..." : topic.subjectName}
                    </Button>
                  ))}
              </div>

              {topicOptions.filter((topic) => !playedTopicIds.includes(topic.id)).length === 0 ? (
                <Button className="mt-6" disabled={choosingTopic} onClick={() => void chooseNextTopic(currentTopicId ?? routeTopicId ?? "")}>
                  Lanjutkan dengan topik saat ini
                </Button>
              ) : null}
            </Card>
          ) : waitingForOpponentTopicChoice ? (
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-3">Menunggu lawan memilih topik</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Round berikutnya akan dimulai setelah {opponentName} memilih topik.
              </p>
            </Card>
          ) : waitingForOpponentScore ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] border-zinc-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950 rounded-3xl">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl animate-pulse scale-150" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                    <Swords className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Menunggu Lawan Lainnya</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                  Semua soal di ronde ini telah kamu jawab. Menunggu <strong className="text-zinc-700 dark:text-zinc-300">{opponentName}</strong> menyelesaikan ronde.
                </p>
              </Card>
            </motion.div>
          ) : questionLoading && questions.length === 0 ? (
            <Card className="p-8 text-center">
              <Swords className="mx-auto mb-4 h-10 w-10 text-blue-600" />
              <h2 className="text-2xl font-semibold mb-2">Memuat bank soal</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Mengambil soal dan jawaban untuk topik ini dari Neon.
              </p>
            </Card>
          ) : currentQuestion ? (
            <>
              <QuizQuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                timeRemaining={timeRemaining}
                onSubmit={handleSubmit}
                isSubmitted={isSubmitted}
              />

              {isSubmitted && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {currentIndex < questions.length - 1 ? (
                    <div className="flex w-full items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 sm:w-auto">
                      {waitingForOpponentQuestion
                        ? `Menunggu ${opponentName} menjawab...`
                        : bothQuestionSubmitted
                          ? "Jawaban lengkap, memuat soal berikutnya..."
                          : "Jawaban terkirim, menunggu lawan..."}
                    </div>
                  ) : (
                    <Button onClick={handleNext} className="w-full sm:w-auto" disabled={submittingRoundScore || !bothQuestionSubmitted}>
                      {submittingRoundScore
                        ? "Mengirim skor..."
                        : bothQuestionSubmitted
                          ? `Selesaikan Round ${currentRound}`
                          : `Menunggu ${opponentName} menjawab...`}
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="p-8">
              <p>Topik tidak tersedia. Silakan kembali dan pilih topik lain.</p>
            </Card>
          )}
        </section>

        <aside className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Progres</h3>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {currentIndex + 1} / {questions.length} selesai
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Riwayat Round</h3>
            {roundSummaries.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada round yang selesai.</p>
            ) : (
              <div className="space-y-3">
                {roundSummaries.map((round) => (
                  <div key={round.roundNumber} className="rounded-xl border border-zinc-200 p-3 text-sm">
                    <p className="font-semibold">
                      Round {round.roundNumber} - {topicOptions.find((topic) => topic.id === round.topicId)?.subjectName ?? `Topik ${round.topicId}`}
                    </p>
                    <p>
                      Kamu: {currentPlayerId === room?.host?.id ? round.hostScore : round.guestScore} | {opponentName}: {currentPlayerId === room?.host?.id ? round.guestScore : round.hostScore}
                    </p>
                    <p className="text-zinc-500">
                      {round.chooserId === currentPlayerId
                        ? "Kamu berhak memilih topik berikutnya."
                        : round.chooserId
                          ? `${opponentName} berhak memilih topik berikutnya.`
                          : "Skor seri, topik berikutnya dipilih otomatis."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {showExitPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExitPrompt(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <LogOut className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Keluar Quiz?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Percobaan kamu akan dianggap gugur dan tidak akan disimpan. Apakah kamu yakin ingin keluar?
              </p>
              <div className="mt-4 flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setShowExitPrompt(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-2xl"
                  onClick={handleExitQuiz}
                >
                  Ya, Keluar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showChooseTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex flex-col items-center text-center gap-3 w-full">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Pilih Topik Berikutnya</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Kamu memiliki skor lebih rendah pada ronde ini. Pilih topik untuk ronde berikutnya.</p>

              {/* Scoreboard display */}
              {(() => {
                const latestRound = roundSummaries[roundSummaries.length - 1];
                const latestPlayerScore = latestRound
                  ? (currentPlayerId === room?.host?.id ? latestRound.hostScore : latestRound.guestScore)
                  : 0;
                const latestOpponentScore = latestRound
                  ? (currentPlayerId === room?.host?.id ? latestRound.guestScore : latestRound.hostScore)
                  : 0;

                return (
                  <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">Hasil Duel Sementara</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-500 block">Kamu</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-400">Ronde ini: <strong className="text-blue-600 dark:text-blue-400">{latestPlayerScore}</strong></span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Total: {totalPlayerScore}</span>
                        </div>
                      </div>
                      <div className="space-y-1 border-l border-zinc-200 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 block">{opponentName}</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-400">Ronde ini: <strong className="text-zinc-600 dark:text-zinc-400">{latestOpponentScore}</strong></span>
                          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total: {totalOpponentScoreBase}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="w-full mt-4 grid gap-3">
                {topicOptions
                  .filter((topic) => !playedTopicIds.includes(topic.id))
                  .map((topic) => (
                    <Button
                      key={topic.id}
                      variant="outline"
                      onClick={() => void chooseNextTopic(topic.id)}
                      disabled={choosingTopic}
                      className="w-full"
                    >
                      {choosingTopic ? "Menyimpan pilihan..." : topic.subjectName}
                    </Button>
                  ))}

                {topicOptions.filter((topic) => !playedTopicIds.includes(topic.id)).length === 0 ? (
                  <Button className="mt-2" disabled={choosingTopic} onClick={() => void chooseNextTopic(currentTopicId ?? routeTopicId ?? "")}>
                    Lanjutkan dengan topik saat ini
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 flex gap-3 w-full">
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowChooseTopicModal(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}