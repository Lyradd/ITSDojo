"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SAMPLE_EVALUATIONS } from "@/lib/evaluation-data";
import { MOCK_EVALUATION_RESULTS } from "@/lib/admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  Target,
  Activity,
  Trophy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock live data (in real app, this would come from WebSocket/polling)
const MOCK_LIVE_STUDENTS = [
  {
    id: "s1",
    name: "Ahmad Zaky",
    avatar: "AZ",
    currentQuestion: 8,
    totalQuestions: 10,
    score: 85,
    timeElapsed: 420, // seconds
    status: "active" as const,
  },
  {
    id: "s2",
    name: "Siti Nurhaliza",
    avatar: "SN",
    currentQuestion: 10,
    totalQuestions: 10,
    score: 95,
    timeElapsed: 380,
    status: "completed" as const,
  },
  {
    id: "s3",
    name: "Budi Santoso",
    avatar: "BS",
    currentQuestion: 6,
    totalQuestions: 10,
    score: 70,
    timeElapsed: 450,
    status: "active" as const,
  },
  {
    id: "s4",
    name: "Dewi Lestari",
    avatar: "DL",
    currentQuestion: 5,
    totalQuestions: 10,
    score: 60,
    timeElapsed: 500,
    status: "stuck" as const,
  },
  {
    id: "s5",
    name: "Rizky Pratama",
    avatar: "RP",
    currentQuestion: 10,
    totalQuestions: 10,
    score: 90,
    timeElapsed: 400,
    status: "completed" as const,
  },
];

export default function MonitorEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;
  
  const [liveStudents, setLiveStudents] = useState(MOCK_LIVE_STUDENTS);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Find evaluation
  const evaluation = SAMPLE_EVALUATIONS.find((e) => e.id === evaluationId);

  // Simulate live updates (in real app, use WebSocket or polling)
  useEffect(() => {
    // Only auto-refresh if evaluation is active AND toggle is on
    if (!autoRefresh || !evaluation?.isActive) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In real app: fetch updated data from server
      // For now, just update timestamp
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, evaluation?.isActive]);

  if (!evaluation) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Evaluation not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const activeStudents = liveStudents.filter((s) => s.status === "active").length;
  const completedStudents = liveStudents.filter((s) => s.status === "completed").length;
  const avgScore = Math.round(
    liveStudents.reduce((sum, s) => sum + s.score, 0) / liveStudents.length
  );
  const avgProgress = Math.round(
    liveStudents.reduce((sum, s) => sum + (s.currentQuestion / s.totalQuestions) * 100, 0) /
      liveStudents.length
  );

  // Sorted leaderboard
  const leaderboard = [...liveStudents].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Evaluations
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {evaluation.isActive ? "Live Monitoring" : "Final Results"}: {evaluation.title}
                </h1>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  evaluation.isActive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}>
                  {evaluation.isActive ? '🟢 ACTIVE' : '⚫ CLOSED'}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                {evaluation.isActive 
                  ? "Real-time student progress and analytics"
                  : "View final results and performance summary"
                }
              </p>
            </div>

            <div className="flex items-center gap-3">
              {evaluation.isActive && (
                <>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={cn(
                      autoRefresh && "bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:text-green-400"
                    )}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
                    {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {liveStudents.length}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {evaluation.isActive ? "Total Students" : "Total Submissions"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                {evaluation.isActive ? (
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {evaluation.isActive ? activeStudents : completedStudents}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {evaluation.isActive ? "Active Now" : "Completed"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                {evaluation.isActive ? (
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {evaluation.isActive ? completedStudents : `${evaluation.totalPoints}`}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {evaluation.isActive ? "Completed" : "Total Points"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {avgScore}%
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {evaluation.isActive ? "Current Avg" : "Final Avg Score"}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Progress List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
                {evaluation.isActive ? "Live Student Progress" : "Student Results"}
              </h2>

              <div className="space-y-4">
                {liveStudents.map((student) => (
                  <StudentProgressCard key={student.id} student={student} />
                ))}
              </div>
            </Card>
          </div>

          {/* Live Leaderboard */}
          <div>
            <Card className="p-6 bg-white dark:bg-zinc-800 border-2">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {evaluation.isActive ? "Live Leaderboard" : "Final Rankings"}
                </h2>
              </div>

              <div className="space-y-3">
                {leaderboard.map((student, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      index === 0 && "bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-800",
                      index === 1 && "bg-zinc-100 dark:bg-zinc-900",
                      index === 2 && "bg-orange-50 dark:bg-orange-950/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 && "bg-yellow-500 text-white",
                        index === 1 && "bg-zinc-400 text-white",
                        index === 2 && "bg-orange-500 text-white",
                        index > 2 && "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {student.currentQuestion}/{student.totalQuestions} questions
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-zinc-900 dark:text-white">
                        {student.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Analytics Summary */}
            <Card className="p-6 bg-white dark:bg-zinc-800 border-2 mt-6">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
                Analytics
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Avg Progress
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {avgProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Completion Rate
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {Math.round((completedStudents / liveStudents.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${(completedStudents / liveStudents.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentProgressCard({ student }: { student: typeof MOCK_LIVE_STUDENTS[0] }) {
  const progressPercentage = (student.currentQuestion / student.totalQuestions) * 100;
  const timeMinutes = Math.floor(student.timeElapsed / 60);
  const timeSeconds = student.timeElapsed % 60;

  const statusConfig = {
    active: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950",
      label: "Active",
      icon: Activity,
    },
    completed: {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950",
      label: "Completed",
      icon: CheckCircle,
    },
    stuck: {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950",
      label: "Stuck",
      icon: XCircle,
    },
  };

  const status = statusConfig[student.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all">
      <div className="flex items-center gap-4 mb-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {student.avatar}
        </div>

        {/* Name & Status */}
        <div className="flex-1">
          <div className="font-semibold text-zinc-900 dark:text-white">
            {student.name}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={cn("flex items-center gap-1", status.color)}>
              <StatusIcon className="w-3 h-3" />
              <span className="font-medium">{status.label}</span>
            </div>
            <span className="text-zinc-400">•</span>
            <div className="text-zinc-600 dark:text-zinc-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {timeMinutes}:{timeSeconds.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {student.score}%
          </div>
          <div className="text-xs text-zinc-500">Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Question {student.currentQuestion} of {student.totalQuestions}
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              student.status === "completed" && "bg-green-600",
              student.status === "active" && "bg-blue-600",
              student.status === "stuck" && "bg-orange-600"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
