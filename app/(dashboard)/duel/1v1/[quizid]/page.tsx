"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { MOCK_WEB_DEV_QUESTIONS } from "@/lib/quiz-mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, LogOut, Swords } from "lucide-react";
import { useUserStore } from "@/lib/store";

type LobbyRoom = {
  id: number;
  inviteCode: string;
  topicId: number;
  status: "waiting" | "joined" | "started" | "cancelled";
  host: { id: string; name: string; email: string; role: string } | null;
  guest: { id: string; name: string; email: string; role: string } | null;
};

const TOPIC_QUESTION_MAP: Record<string, string[]> = {
  1: ["q1", "q5", "q8"],
  2: ["q2", "q3", "q4", "q7", "q10"],
  3: ["q6", "q9"],
  4: ["wd1", "wd2", "wd9", "wd8", "wd5"],
};

function getQuestionsForTopic(topicId: string | undefined) {
  if (!topicId) return MOCK_WEB_DEV_QUESTIONS;
  const ids = TOPIC_QUESTION_MAP[topicId] ?? MOCK_WEB_DEV_QUESTIONS.map((q) => q.id);
  return MOCK_WEB_DEV_QUESTIONS.filter((question) => ids.includes(question.id));
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email, name, role } = useUserStore();
  const roomId = searchParams.get("room");
  const topicId = typeof params.quizid === "string" ? params.quizid : undefined;
  const [topicName, setTopicName] = useState<string | null>(null);
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);

  useEffect(() => {
    if (!topicId) {
      setTopicName(null);
      return;
    }

    fetch("/api/topics")
      .then((res) => res.json())
      .then((topics: Array<{ id: number; subjectName: string }>) => {
        const topic = topics.find((item) => String(item.id) === topicId);
        setTopicName(topic?.subjectName ?? null);
      })
      .catch(() => {
        setTopicName(null);
      });
  }, [topicId]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setRoomError(null);
      setJoinAttempted(false);
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
  }, [roomId, email, name, role, joinAttempted]);

  const questions = useMemo(() => getQuestionsForTopic(topicId), [topicId]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | number; correct: boolean; points: number }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(questions[0]?.timeLimit ?? 30);
  const [finished, setFinished] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const isHost = room?.host?.id === email;
  const opponentName = room
    ? (isHost ? room.guest?.name : room.host?.name)
    : searchParams.get("opponentName");
  const waitingForLobby = Boolean(roomId) && (!room || room.status !== "started");

  const resetQuizState = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setFinished(false);
    setTimeRemaining(questions[0]?.timeLimit ?? 30);
  };

  const handleExitQuiz = () => {
    resetQuizState();
    setShowExitPrompt(false);
    router.push("/duel/1v1");
  };

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setFinished(false);
    setTimeRemaining(questions[0]?.timeLimit ?? 30);
  }, [questions]);

  useEffect(() => {
    if (finished || questions.length === 0 || waitingForLobby) return;

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, currentIndex, questions.length, waitingForLobby]);

  const currentQuestion = questions[currentIndex];
  const totalScore = Object.values(answers).reduce((sum, item) => sum + item.points, 0);

  const handleSubmit = (answer: string | number) => {
    if (!currentQuestion || isSubmitted) return;

    const isCorrect =
      String(answer).toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase();

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        answer,
        correct: isCorrect,
        points: isCorrect ? currentQuestion.bloomWeight : 0,
      },
    }));

    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsSubmitted(false);
      setTimeRemaining(questions[currentIndex + 1].timeLimit);
    } else {
      setFinished(true);
    }
  };

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

  if (roomId && room && room.status !== "started") {
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Host</p>
              <p className="text-lg font-semibold">{room.host?.name ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Lawan</p>
              <p className="text-lg font-semibold">{opponentName ?? "Menunggu..."}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
            {room.status === "waiting"
              ? "Room sudah aktif di Neon dan akan update otomatis saat lawan bergabung."
              : "Lobby siap. Host bisa memulai duel kapan saja."}
          </div>

          <Button className="mt-6" variant="outline" onClick={() => router.push("/duel/1v1")}>Keluar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-16 py-8">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {topicName}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">Your Opponent is <b>{opponentName}</b></p>
            </div>

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

          {finished ? (
            <Card className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-semibold">Quiz Selesai</h2>
              </div>
              <p className="mb-4 text-lg">Skor total: {totalScore}</p>

              <div className="space-y-4">
                {questions.map((question) => {
                  const answer = answers[question.id];
                  return (
                    <div key={question.id} className="rounded-2xl border border-zinc-200 p-4">
                      <div className="font-semibold">{question.questionText}</div>
                      <div className="mt-2 text-sm text-zinc-600">
                        Jawaban: {answer?.answer ?? "Tidak dijawab"} —{" "}
                        {answer?.correct ? "Benar" : "Salah"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={() => router.push("/duel/1v1")} className="mt-6">
                Pilih Topik Lain
              </Button>
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
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Skor saat ini</p>
                    <p className="text-3xl font-bold">{totalScore}</p>
                  </div>
                  <Button onClick={handleNext} className="w-full sm:w-auto">
                    {currentIndex < questions.length - 1
                      ? "Soal Selanjutnya"
                      : "Selesaikan Quiz"}
                  </Button>
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
            <h3 className="text-lg font-semibold mb-3">Ringkasan Quiz</h3>
            <p>Jumlah soal: {questions.length}</p>
            <p>Topik: {topicId ?? "Umum"}</p>
            <p>Waktu tiap soal: {currentQuestion?.timeLimit ?? 0}s</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Progres</h3>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {currentIndex + 1} / {questions.length} selesai
            </p>
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
    </div>
  );
}