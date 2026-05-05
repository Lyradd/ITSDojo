"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { MOCK_QUESTIONS, MOCK_QUIZ, Question } from "@/lib/quiz-mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, CheckCircle2 } from "lucide-react";

const TOPIC_QUESTION_MAP: Record<string, string[]> = {
  database: ["q1", "q5", "q8"],
  programming: ["q2", "q3", "q4", "q7", "q10"],
  operatingsystem: ["q6", "q9"],
  trivia: ["q1", "q2", "q9"],
};

function getQuestionsForTopic(topicId: string | undefined) {
  if (!topicId) return MOCK_QUESTIONS;
  const ids = TOPIC_QUESTION_MAP[topicId] ?? MOCK_QUESTIONS.map((q) => q.id);
  return MOCK_QUESTIONS.filter((question) => ids.includes(question.id));
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.quizid;
  const questions = useMemo(() => getQuestionsForTopic(topicId), [topicId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | number; correct: boolean; points: number }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(questions[0]?.timeLimit ?? 30);
  const [finished, setFinished] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

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
    if (finished || questions.length === 0) return;

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
  }, [finished, currentIndex, questions.length]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {MOCK_QUIZ.title}
                {topicId ? ` — ${topicId}` : ""}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">{MOCK_QUIZ.description}</p>
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