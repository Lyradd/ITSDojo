"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import type { Question } from "@/lib/quiz-mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, LogOut, Swords, Zap, Gem, Trophy, Award, Timer, Users, HelpCircle, Loader2 } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { triggerConfetti } from "@/lib/confetti";
import { motion, AnimatePresence } from "framer-motion";

type TopicOption = {
  id: string;
  subjectName: string;
};

type Player = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type ArenaRoundResult = {
  roundNumber: number;
  topicId: string;
  scores: Record<string, number>;
  chooserId: string | null;
};

type ArenaSession = {
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
  roundResults: ArenaRoundResult[];
  winnerId: string | null;
  updatedAt: string;
};

const QUESTIONS_PER_ROUND = 3;

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
    // Ignore
  }
  return fallback;
}

function ArenaQuizContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id, email, name, isLoggedIn, syncFromServer } = useUserStore();

  const roomId = searchParams.get("room");
  const routeTopicId = typeof params.quizid === "string" ? params.quizid : undefined;

  const [isMounted, setIsMounted] = useState(false);
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [arenaSession, setArenaSession] = useState<ArenaSession | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [submittingRoundScore, setSubmittingRoundScore] = useState(false);
  const [choosingTopic, setChoosingTopic] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | number; correct: boolean; points: number }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showChooseTopicModal, setShowChooseTopicModal] = useState(false);
  const [delayedSessionStatus, setDelayedSessionStatus] = useState<ArenaSession["status"] | null>(null);
  const [countdownShown, setCountdownShown] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch topics list
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

  const currentTopicId = arenaSession?.currentTopicId ?? routeTopicId;
  const currentRound = arenaSession?.currentRound ?? 1;
  const roundSummaries = arenaSession?.roundResults ?? [];

  // Fetch questions for active topic
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
            setQuestionError(await readJsonError(response, "Gagal memuat soal Arena."));
          }
          return;
        }

        const payload = (await response.json()) as { questions: Question[] };
        if (!active) return;

        setTopicQuestions(payload.questions);
        setQuestionError(null);
      } catch {
        if (active) {
          setQuestionError("Gagal memuat soal Arena.");
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

  const questions = useMemo(() => getRoundQuestions(topicQuestions, currentRound), [topicQuestions, currentRound]);
  const isFinalQuestion = questions.length > 0 && currentIndex === questions.length - 1;

  const currentPlayerId = id ?? "";

  // Poll arena session state
  useEffect(() => {
    if (!roomId) {
      setArenaSession(null);
      setSessionError(null);
      return;
    }

    if (delayedSessionStatus === "finished") return;

    let active = true;
    const encodedRoomId = encodeURIComponent(roomId);

    const syncSession = async () => {
      try {
        const response = await fetch(`/api/duel/arena/lobbies/${encodedRoomId}/session?playerId=${encodeURIComponent(currentPlayerId)}`);
        if (!response.ok) {
          if (active) {
            setSessionError(await readJsonError(response, "Gagal memuat sesi Arena."));
          }
          return;
        }

        const payload = (await response.json()) as { session: ArenaSession; players: Player[] };
        if (!active) return;

        setArenaSession(payload.session);
        setPlayers(payload.players);
        setSessionError(null);
      } catch {
        if (active) {
          setSessionError("Gagal memuat sesi Arena.");
        }
      }
    };

    void syncSession();
    const interval = window.setInterval(syncSession, isSubmitted ? 1000 : 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isSubmitted, roomId, delayedSessionStatus, currentPlayerId]);

  // Redirect on new round topic selection
  useEffect(() => {
    if (roomId && arenaSession?.currentTopicId && arenaSession.currentTopicId !== routeTopicId) {
      router.push(`/duel/arena/${arenaSession.currentTopicId}?room=${roomId}`);
    }
  }, [arenaSession?.currentTopicId, routeTopicId, roomId, router]);

  // Sync questions index
  useEffect(() => {
    const nextQuestionIndex = arenaSession?.currentQuestionIndex;

    if (typeof nextQuestionIndex !== "number" || nextQuestionIndex <= currentIndex) {
      return;
    }

    const nextQuestion = questions[nextQuestionIndex];
    if (!nextQuestion) return;

    const timer = setTimeout(() => {
      setCurrentIndex(nextQuestionIndex);
      setIsSubmitted(false);
      setTimeRemaining(nextQuestion.timeLimit ?? 30);
    }, 3000); // 3 seconds delay for answer feedback

    return () => clearTimeout(timer);
  }, [currentIndex, arenaSession?.currentQuestionIndex, questions]);

  // Final question delay before transition
  useEffect(() => {
    if (!arenaSession) {
      setDelayedSessionStatus(null);
      return;
    }

    if (
      (arenaSession.status === "awaiting_topic_choice" || arenaSession.status === "finished") &&
      isFinalQuestion &&
      isSubmitted
    ) {
      const timer = setTimeout(() => {
        setDelayedSessionStatus(arenaSession.status);
      }, 3000); // 3 seconds delay before showing round results
      return () => clearTimeout(timer);
    } else {
      setDelayedSessionStatus(arenaSession.status);
    }
  }, [arenaSession?.status, isFinalQuestion, isSubmitted]);

  // Trigger confetti if game finished and player is in top rank
  const isWinner = useMemo(() => {
    if (delayedSessionStatus !== "finished" || !arenaSession || !currentPlayerId) return false;
    return arenaSession.winnerId === currentPlayerId;
  }, [delayedSessionStatus, arenaSession, currentPlayerId]);

  useEffect(() => {
    if (isWinner) {
      triggerConfetti();
    }
  }, [isWinner]);

  // Sync user profile stats after game finished
  useEffect(() => {
    if (delayedSessionStatus === "finished" && id) {
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
          console.error("Failed to sync profile after arena end:", e);
        }
      };
      const timer = setTimeout(syncProfile, 1000);
      return () => clearTimeout(timer);
    }
  }, [delayedSessionStatus, id, syncFromServer]);

  // Start countdown
  useEffect(() => {
    if (arenaSession && !countdownShown && delayedSessionStatus !== "finished") {
      setStartCountdown(3);
      setCountdownShown(true);
    }
  }, [arenaSession, countdownShown, delayedSessionStatus]);

  useEffect(() => {
    if (startCountdown <= 0) return;
    const timer = setTimeout(() => {
      setStartCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [startCountdown]);

  // Question progress submit
  const syncQuestionSubmission = useCallback(
    async (questionIndex: number, currentScore: number) => {
      if (!roomId || !currentPlayerId) return;

      try {
        const encodedRoomId = encodeURIComponent(roomId);
        const response = await fetch(`/api/duel/arena/lobbies/${encodedRoomId}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

        const payload = (await response.json()) as { session: ArenaSession };
        setArenaSession(payload.session);
        setSessionError(null);
      } catch {
        setSessionError("Gagal sinkronisasi jawaban.");
      }
    },
    [roomId, currentPlayerId, questions]
  );

  const handleSubmit = useCallback(
    (answer: string | number) => {
      const currentQuestion = questions[currentIndex];
      if (!currentQuestion || isSubmitted) return;

      const qType = currentQuestion.questionType;
      let isCorrect = false;

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
    },
    [questions, currentIndex, isSubmitted, answers, syncQuestionSubmission]
  );

  // Question timer ticking
  useEffect(() => {
    if (
      delayedSessionStatus === "finished" ||
      questions.length === 0 ||
      delayedSessionStatus === "awaiting_topic_choice" ||
      isSubmitted ||
      startCountdown > 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [delayedSessionStatus, currentIndex, isSubmitted, questions.length, startCountdown]);

  // Handle timeout
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted && questions[currentIndex]) {
      handleSubmit("");
    }
  }, [timeRemaining, isSubmitted, currentIndex, questions, handleSubmit]);

  // Finalize round scoring
  const finalizeRound = useCallback(async () => {
    if (!roomId || !currentPlayerId || submittingRoundScore) return;

    const playerRoundScore = questions.reduce(
      (sum, question) => sum + (answers[question.id]?.points ?? 0),
      0
    );

    setSubmittingRoundScore(true);
    try {
      const encodedRoomId = encodeURIComponent(roomId);
      const response = await fetch(`/api/duel/arena/lobbies/${encodedRoomId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayerId,
          score: playerRoundScore,
        }),
      });

      if (!response.ok) {
        setSessionError(await readJsonError(response, "Gagal submit skor ronde."));
        return;
      }

      const payload = (await response.json()) as { session: ArenaSession };
      setArenaSession(payload.session);
      setSessionError(null);
    } catch {
      setSessionError("Gagal submit skor ronde.");
    } finally {
      setSubmittingRoundScore(false);
    }
  }, [roomId, currentPlayerId, submittingRoundScore, questions, answers]);

  // Auto-finalize round on last question when everyone submitted last question progress
  const hasCurrentPlayerSubmitted = arenaSession?.pendingScores && Object.prototype.hasOwnProperty.call(arenaSession.pendingScores, currentPlayerId);
  const activeQuestionSubmissions = arenaSession?.questionSubmissions || {};
  const bothQuestionSubmitted = useMemo(() => {
    if (players.length === 0) return false;
    return players.every((p) => activeQuestionSubmissions[p.id] === currentIndex);
  }, [players, activeQuestionSubmissions, currentIndex]);

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
  }, [isFinalQuestion, bothQuestionSubmitted, hasCurrentPlayerSubmitted, submittingRoundScore, finalizeRound]);

  // Topic choosing action
  const chooseNextTopic = async (topicId: string) => {
    if (!roomId || !currentPlayerId || choosingTopic) return;

    setChoosingTopic(true);
    try {
      const encodedRoomId = encodeURIComponent(roomId);
      const response = await fetch(`/api/duel/arena/lobbies/${encodedRoomId}/session/topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayerId,
          topicId,
        }),
      });

      if (!response.ok) {
        setSessionError(await readJsonError(response, "Gagal memilih topik ronde berikutnya."));
        return;
      }

      const payload = (await response.json()) as { session: ArenaSession };
      setArenaSession(payload.session);
      setSessionError(null);
      setShowChooseTopicModal(false);

      // Reset state for next round
      setCurrentIndex(0);
      setAnswers({});
      setIsSubmitted(false);
    } catch {
      setSessionError("Gagal memilih topik ronde berikutnya.");
    } finally {
      setChoosingTopic(false);
    }
  };

  useEffect(() => {
    if (delayedSessionStatus === "awaiting_topic_choice" && arenaSession?.chooserId === currentPlayerId) {
      setShowChooseTopicModal(true);
    } else {
      setShowChooseTopicModal(false);
    }
  }, [delayedSessionStatus, arenaSession?.chooserId, currentPlayerId]);

  // Exit game room
  const handleExitQuiz = async () => {
    if (roomId && currentPlayerId) {
      try {
        await fetch(`/api/duel/arena/lobbies/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: currentPlayerId }),
        });
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    }
    router.push("/duel");
  };

  // Calculations for score presentation
  const topicName = useMemo(() => {
    return topicOptions.find((topic) => topic.id === currentTopicId)?.subjectName ?? `Topik ${currentTopicId}`;
  }, [topicOptions, currentTopicId]);

  const liveRoundScore = useMemo(() => {
    return Object.values(answers).reduce((sum, item) => sum + item.points, 0);
  }, [answers]);

  // Compute total scores across round results
  const cumulativeScores = useMemo(() => {
    const scores: Record<string, number> = {};
    players.forEach((p) => {
      scores[p.id] = 0;
    });

    roundSummaries.forEach((round) => {
      players.forEach((p) => {
        scores[p.id] += round.scores[p.id] ?? 0;
      });
    });

    return scores;
  }, [players, roundSummaries]);

  // Calculate live cumulative score (including current round live scores)
  const currentLiveScores = useMemo(() => {
    const scores: Record<string, number> = {};
    players.forEach((p) => {
      const base = cumulativeScores[p.id] || 0;
      let roundScore = 0;

      if (delayedSessionStatus === "in_progress") {
        if (p.id === currentPlayerId) {
          roundScore = liveRoundScore;
        } else {
          // Read from session scores
          roundScore = arenaSession?.scores?.[p.id] ?? 0;
        }
      } else if (delayedSessionStatus === "awaiting_topic_choice" || delayedSessionStatus === "finished") {
        // Round finalized already, base already includes it
        roundScore = 0;
      }
      scores[p.id] = base + roundScore;
    });
    return scores;
  }, [players, cumulativeScores, liveRoundScore, delayedSessionStatus, arenaSession, currentPlayerId]);

  // List of players sorted by live scores descending
  const sortedPlayersByScore = useMemo(() => {
    return [...players].sort((a, b) => (currentLiveScores[b.id] ?? 0) - (currentLiveScores[a.id] ?? 0));
  }, [players, currentLiveScores]);

  if (!isMounted) return null;

  // Countdown Overlay
  if (startCountdown > 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 bg-opacity-95 text-white">
        <motion.div
          key={startCountdown}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="text-9xl font-extrabold text-blue-500 font-mono"
        >
          {startCountdown}
        </motion.div>
        <span className="text-xl font-bold mt-8 tracking-wider text-zinc-400 uppercase">
          Arena Ronde {currentRound} Dimulai!
        </span>
        <span className="text-sm text-zinc-500 mt-2 font-medium">Topik: {topicName}</span>
      </div>
    );
  }

  // --- 1. Finished/End Game Screen ---
  if (delayedSessionStatus === "finished" && arenaSession) {
    // Determine winner rewards listing
    const uniqueCumulative = Array.from(new Set(Object.values(cumulativeScores))).sort((a, b) => b - a);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex flex-col items-center justify-center">
        <Card className="p-8 border border-zinc-200 dark:border-blue-900 bg-card/70 backdrop-blur-md shadow-2xl rounded-3xl w-full text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mb-2">Arena Selesai!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">
            Semua ronde telah berakhir. Berikut adalah hasil final dari para pemain.
          </p>

          <div className="space-y-4 mb-8">
            {sortedPlayersByScore.map((p, index) => {
              const total = cumulativeScores[p.id] || 0;
              const rankIndex = uniqueCumulative.indexOf(total); // 0 = 1st, 1 = 2nd, 2 = 3rd, etc.

              let xpReward = 10;
              let gemReward = 2;
              if (rankIndex === 0) {
                xpReward = 50;
                gemReward = 10;
              } else if (rankIndex === 1) {
                xpReward = 30;
                gemReward = 5;
              } else if (rankIndex === 2) {
                xpReward = 20;
                gemReward = 3;
              }

              const isUser = p.id === currentPlayerId;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isUser
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? '' : p.avatar}`}>
                      {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs uppercase">
                          {p.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {p.name} {isUser && "(Anda)"}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] flex items-center text-blue-600 dark:text-blue-400 font-bold">
                          <Zap className="w-3 h-3 mr-0.5 fill-current" />+{xpReward} XP
                        </span>
                        <span className="text-[10px] flex items-center text-purple-600 dark:text-purple-400 font-bold">
                          <Gem className="w-3 h-3 mr-0.5 fill-current" />+{gemReward} Gems
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                    {total} Pts
                  </span>
                </div>
              );
            })}
          </div>

          <Button onClick={handleExitQuiz} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-8 font-semibold cursor-pointer">
            Kembali ke Menu
          </Button>
        </Card>
      </div>
    );
  }

  // --- 2. Awaiting Topic Choice Screen ---
  if (delayedSessionStatus === "awaiting_topic_choice" && arenaSession) {
    const chooserName = players.find((p) => p.id === arenaSession.chooserId)?.name ?? "Pemain Lain";
    const playedTopicIds = roundSummaries.map((r) => String(r.topicId));
    const availableChoices = topicOptions.filter((topic) => !playedTopicIds.includes(topic.id));

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex flex-col items-center justify-center">
        <Card className="p-8 border border-zinc-200 dark:border-blue-900 bg-card/70 backdrop-blur-md shadow-2xl rounded-3xl w-full text-center">
          <Award className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 mb-2">Ronde {currentRound} Selesai!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
            Mari kita lihat papan peringkat ronde ini.
          </p>

          {/* Round Score Board */}
          <div className="space-y-3 mb-8 text-left">
            <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-2">Papan Skor Sementara</h3>
            {sortedPlayersByScore.map((p, index) => {
              const isUser = p.id === currentPlayerId;
              const total = cumulativeScores[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    isUser
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-400 dark:text-zinc-500 w-5">#{index + 1}</span>
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? '' : p.avatar}`}>
                      {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-[10px] uppercase">
                          {p.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {p.name} {isUser && "(Anda)"}
                    </span>
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">{total} Pts</span>
                </div>
              );
            })}
          </div>

          {/* Topic selection actions */}
          {showChooseTopicModal ? (
            <div className="p-6 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-2">Pilih Topik Berikutnya</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-4">
                Sebagai pemain dengan skor terendah ronde ini, silakan pilih topik ronde berikutnya!
              </p>

              <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                {availableChoices.map((topic) => (
                  <Button
                    key={topic.id}
                    disabled={choosingTopic}
                    onClick={() => chooseNextTopic(topic.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 cursor-pointer font-medium"
                  >
                    {choosingTopic ? "Memproses..." : topic.subjectName}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Menunggu <span className="font-bold text-zinc-800 dark:text-zinc-200">{chooserName}</span> memilih topik ronde berikutnya...
              </span>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --- 3. Waiting for other players to finalize round score ---
  if (delayedSessionStatus === "in_progress" && hasCurrentPlayerSubmitted && isFinalQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen flex flex-col items-center justify-center">
        <Card className="p-8 border border-zinc-200 dark:border-zinc-800 bg-card/80 backdrop-blur-md shadow-2xl rounded-3xl w-full text-center">
          <Timer className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin-slow" />
          <h2 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-100">
            Menunggu Lawan Lainnya
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
            Ronde telah berakhir untuk Anda. Mohon tunggu semua pemain menyelesaikan ronde ini untuk melihat papan skor ronde.
          </p>

          {/* Show the last question details and user's answer (Requirements 3 & 4) */}
          {questions[currentIndex] && (
            <div className="mb-6 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-left border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full mb-2 inline-block">
                Soal Terakhir ({currentIndex + 1}/{questions.length})
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                {questions[currentIndex].questionText}
              </p>
              {answers[questions[currentIndex].id] && (
                <div className="mt-3 text-xs flex flex-col gap-1">
                  <p className="text-zinc-500">
                    Jawaban Anda: <span className={`font-bold ${answers[questions[currentIndex].id].correct ? "text-emerald-600" : "text-red-600"}`}>
                      {answers[questions[currentIndex].id].answer || "(Kosong)"}
                    </span>
                  </p>
                  <p className="text-zinc-500">
                    Kunci Jawaban: <span className="font-bold text-emerald-600">
                      {questions[currentIndex].correctAnswer}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-left mb-6">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status Pemain</p>
            {players.map((p) => {
              const submitted = activeQuestionSubmissions[p.id] === currentIndex;
              return (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">{p.name}</span>
                  <span className={submitted ? "text-emerald-600 font-bold" : "text-zinc-400 animate-pulse"}>
                    {submitted ? "Selesai" : "Mengerjakan..."}
                  </span>
                </div>
              );
            })}
          </div>

          <Button variant="outline" onClick={handleExitQuiz} className="w-full rounded-xl cursor-pointer">
            Keluar Game
          </Button>
        </Card>
      </div>
    );
  }

  // --- 4. Main Quiz Gameplay Screen ---
  const currentQuestion = questions[currentIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen">
      {/* Header HUD */}
      <div className="mb-6 grid grid-cols-3 items-center p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg">
        <div className="text-left">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ronde</span>
          <p className="text-lg font-black text-zinc-700 dark:text-zinc-200">{currentRound} / 3</p>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Waktu Tersisa</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-mono font-bold rounded-full text-sm">
            <Timer className="w-4 h-4" />
            {timeRemaining}s
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Skor Anda</span>
          <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
            {currentLiveScores[currentPlayerId] ?? 0}
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        {/* Left side: Question display */}
        <section>
          {questionLoading ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-sm text-zinc-500 font-medium">Memuat soal...</span>
            </Card>
          ) : questionError ? (
            <Card className="p-12 text-center text-red-500 font-medium">{questionError}</Card>
          ) : currentQuestion ? (
            <div className="space-y-4">
              <QuizQuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                timeRemaining={timeRemaining}
                onSubmit={handleSubmit}
                isSubmitted={isSubmitted}
              />

              {/* Real-time synchronization message */}
              {isSubmitted && (
                <Card className="p-4 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    Jawaban terkirim. Menunggu pemain lain menyelesaikan soal...
                  </span>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center text-zinc-500">Soal tidak tersedia.</Card>
          )}

          {sessionError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {sessionError}
            </div>
          )}
        </section>

        {/* Right side: Live rankings list */}
        <aside>
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Peringkat Live ({players.length})
            </h3>

            <div className="space-y-3">
              {sortedPlayersByScore.map((p, index) => {
                const isUser = p.id === currentPlayerId;
                const score = currentLiveScores[p.id] ?? 0;
                const answered = activeQuestionSubmissions[p.id] === currentIndex;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isUser
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-zinc-400 w-4 text-xs">#{index + 1}</span>
                      <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? '' : p.avatar}`}>
                        {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-[9px] uppercase">
                            {p.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </span>
                        )}
                      </div>
                      <div className="text-left leading-none">
                        <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 block">
                          {p.name} {isUser && "(Anda)"}
                        </span>
                        <span className={`text-[9px] ${answered ? "text-emerald-600 font-semibold" : "text-zinc-400"}`}>
                          {answered ? "Sudah jawab" : "Berpikir..."}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{score}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>

      {/* Exit Prompt Modal */}
      <AnimatePresence>
        {showExitPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-center shadow-2xl"
            >
              <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">Keluar dari Game?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Apakah Anda yakin ingin keluar? Anda akan kehilangan progress Anda di Arena ini.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl cursor-pointer" onClick={() => setShowExitPrompt(false)}>
                  Batal
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer font-bold" onClick={handleExitQuiz}>
                  Keluar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowExitPrompt(true)}
        className="mt-6 flex items-center gap-1.5 text-zinc-500 hover:text-red-500 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs">Keluar Game</span>
      </Button>
    </div>
  );
}

export default function ArenaQuizPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen text-center py-20 text-zinc-500">Memuat permainan...</div>}>
      <ArenaQuizContent />
    </Suspense>
  );
}
