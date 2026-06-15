"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getEvaluationById, getLiveEvaluationProgress, startEvaluationSession, pauseEvaluationSession, deleteStudentProgress, updateEvaluation, nextQuestion, pauseQuestion, resumeQuestion, getEvaluationSessionStatus, restartQuestions } from "@/actions/evaluations";
import { Evaluation, Question } from "@/lib/evaluation-types";
import { QuestionBuilder } from "@/components/admin/question-builder";
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
  Square,
  Zap,
  Trash2,
  Download,
  Edit,
  Save
} from "lucide-react";
import { useEvaluationStore } from "@/lib/evaluation-store";

import { cn } from "@/lib/utils";

export default function MonitorEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;
  
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState<Date | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('waiting');

  const { isWaitingRoomActive, initiateStartSequence, countdownEndTime, startWaitingRoomSession, resetEvaluation } = useEvaluationStore();
  const isStarting = countdownEndTime !== null;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editorQuestions, setEditorQuestions] = useState<Question[]>([]);

  const handleStartSession = async () => {
    const res = await startEvaluationSession(evaluationId);
    if (res.success) {
      initiateStartSequence();
      toast.success("Sesi evaluasi dimulai");
    } else {
      toast.error("Gagal memulai sesi");
    }
  };

  const handleStopSession = async () => {
    setIsStopping(true);
    const res = await pauseEvaluationSession(evaluationId);
    setIsStopping(false);
    setShowStopConfirm(false);
    if (res.success) {
      toast.success("Sesi dihentikan, kembali ke waiting room");
      // Reset local store agar tombol balik ke "Mulai Sesi"
      resetEvaluation();
      // Reload evaluation data
      const fresh = await getEvaluationById(evaluationId);
      setEvaluation(fresh as unknown as Evaluation);
    } else {
      toast.error("Gagal menghentikan sesi");
    }
  };

  useEffect(() => {
    async function loadEval() {
      try {
        const data = await getEvaluationById(evaluationId);
        setEvaluation(data as unknown as Evaluation);

        const status = (data as any)?.sessionStatus;
        setSessionStatus(status || 'waiting');
        if (status === 'waiting') {
          useEvaluationStore.setState({ isWaitingRoomActive: true, countdownEndTime: null });
        } else if (status === 'active') {
          useEvaluationStore.setState({ isWaitingRoomActive: false });
        }
        
        setCurrentQuestionIndex((data as any)?.currentQuestionIndex || 0);
        setIsPaused((data as any)?.isPaused || false);
        setQuestionStartedAt((data as any)?.questionStartedAt ? new Date((data as any)?.questionStartedAt) : null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEval();
  }, [evaluationId]);

  useEffect(() => {
    if (countdownEndTime !== null) {
      const remaining = countdownEndTime - Date.now();
      if (remaining > 0) {
        const timer = setTimeout(() => {
          startWaitingRoomSession();
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        startWaitingRoomSession();
      }
    }
  }, [countdownEndTime, startWaitingRoomSession]);

  // Simulate live updates (in real app, use WebSocket or polling)
  useEffect(() => {
    // Only auto-refresh if evaluation is active AND toggle is on
    if (!autoRefresh || !evaluation?.isActive) return;

    const fetchLiveData = async () => {
      try {
        const [liveData, sessionState] = await Promise.all([
          getLiveEvaluationProgress(evaluationId),
          getEvaluationSessionStatus(evaluationId)
        ]);
        
        if (sessionState) {
          setSessionStatus(sessionState.sessionStatus);
          setCurrentQuestionIndex(sessionState.currentQuestionIndex);
          setIsPaused(sessionState.isPaused);
          setQuestionStartedAt(sessionState.questionStartedAt ? new Date(sessionState.questionStartedAt) : null);
        }
        const mappedData = liveData.map((d: any) => ({
          id: d.studentName,
          studentId: d.studentId,
          name: d.studentName,
          avatar: d.studentName.substring(0, 2).toUpperCase(),
          currentQuestion: d.currentQuestion,
          totalQuestions: d.totalQuestions,
          score: d.score,
          timeElapsed: d.timeElapsed,
          updatedAt: d.updatedAt,
          status: d.status as 'active' | 'completed' | 'stuck' | 'waiting',
        }));
        setLiveStudents(mappedData);
        setLastUpdate(new Date());
      } catch (err) {
        console.error(err);
      }
    };

    fetchLiveData(); // Initial fetch
    const interval = setInterval(fetchLiveData, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, evaluation?.isActive, evaluationId]);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete progress for ${studentName}?`)) return;
    const res = await deleteStudentProgress(evaluationId, studentId);
    if (res.success) {
      toast.success(`Progress for ${studentName} deleted`);
      setLiveStudents(prev => prev.filter(s => s.studentId !== studentId));
    } else {
      toast.error(`Failed to delete progress`);
    }
  };

  const handleEditSoalClick = () => {
    if (!evaluation) return;
    if ((evaluation as any).sessionStatus === 'active') {
      toast.error("Wajib pause (Hentikan Sesi) kuis dulu sebelum ngedit soal!");
      return;
    }
    setEditorQuestions(evaluation.questions as Question[]);
    setShowEditor(true);
  };

  const handleSaveSoal = async () => {
    if (!evaluation) return;
    const totalPoints = editorQuestions.reduce((acc, q) => acc + (q.points || 10), 0);
    const res = await updateEvaluation(evaluation.id, {
      title: evaluation.title,
      description: evaluation.description,
      duration: evaluation.duration,
      totalPoints,
      questions: editorQuestions,
      courseId: evaluation.courseId,
    });
    if (res.success) {
      toast.success("Soal berhasil diperbarui!");
      setShowEditor(false);
      setEvaluation(prev => prev ? { ...prev, questions: editorQuestions as any, totalPoints } : null);
    } else {
      toast.error("Gagal menyimpan soal");
    }
  };

  const handleDownloadCSV = () => {
    const headers = ["Rank,Name,Status,Questions Answered,Total Questions,Accuracy (%),Points (XP),Time Elapsed (Sec),Completed At"];
    
    const rows = leaderboard.map((s, index) => {
      const accuracy = s.totalQuestions > 0 ? Math.round((s.score / (s.totalQuestions * 10)) * 100) : 0;
      const completedAt = s.status === 'completed' && s.updatedAt 
        ? `${new Date(s.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(s.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
        : '-';
      
      return `${index + 1},"${s.name}",${s.status},${s.currentQuestion},${s.totalQuestions},${accuracy},${s.score},${s.timeElapsed},"${completedAt}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join("\n"), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hasil_Evaluasi_${evaluation?.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh data CSV");
  };

  // Add countdown timer display for the current question
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [autoNext, setAutoNext] = useState<boolean>(false);
  const [autoRepeat, setAutoRepeat] = useState<boolean>(false);
  const isCallingNext = useRef<boolean>(false);

  useEffect(() => {
    if (!evaluation || !questionStartedAt || isPaused || sessionStatus !== 'active') return;
    const currentQ = evaluation.questions?.[currentQuestionIndex];
    if (!currentQ) return;
    
    const limit = currentQ.timeLimit || 30; // Default 30s
    
    const tick = async () => {
      const elapsed = (Date.now() - questionStartedAt.getTime()) / 1000;
      const rem = Math.max(0, limit - elapsed);
      setTimeLeft(Math.floor(rem));

      if (rem === 0 && !isCallingNext.current) {
        if (autoNext && currentQuestionIndex < (evaluation.questions?.length || 0) - 1) {
          isCallingNext.current = true;
          const res = await nextQuestion(evaluation.id);
          if (res.success) {
            toast.success("Otomatis pindah ke soal berikutnya!");
          }
          setTimeout(() => {
            isCallingNext.current = false;
          }, 2000);
        } else if (autoRepeat && currentQuestionIndex >= (evaluation.questions?.length || 0) - 1) {
          isCallingNext.current = true;
          const res = await restartQuestions(evaluation.id);
          if (res.success) {
            toast.success("Otomatis mengulang dari soal pertama!");
          }
          setTimeout(() => {
            isCallingNext.current = false;
          }, 2000);
        }
      }
    };
    
    tick();
    const intv = setInterval(tick, 1000);
    return () => clearInterval(intv);
  }, [evaluation, currentQuestionIndex, questionStartedAt, isPaused, sessionStatus, autoNext, autoRepeat]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading evaluation data...</div>;
  }

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
  const avgAccuracy = Math.round(
    liveStudents.reduce((sum, s) => {
      const acc = s.totalQuestions > 0 ? (s.score / (s.totalQuestions * 10)) * 100 : 0;
      return sum + acc;
    }, 0) / (liveStudents.length || 1)
  );
  const avgProgress = Math.round(
    liveStudents.reduce((sum, s) => sum + (s.currentQuestion / s.totalQuestions) * 100, 0) /
      (liveStudents.length || 1)
  );
  // Sorted leaderboard by score
  const leaderboard = [...liveStudents].sort((a, b) => b.score - a.score);

  const handleNextQuestion = async () => {
    const res = await nextQuestion(evaluationId);
    if (res.success) {
      toast.success("Berhasil pindah ke soal berikutnya!");
    } else {
      if (res.reason === 'already_at_end') {
        toast.error("Sudah berada di soal terakhir!");
      } else {
        toast.error("Gagal pindah soal");
      }
    }
  };

  const handlePauseQuestion = async () => {
    const res = await pauseQuestion(evaluationId);
    if (res.success) toast.success("Soal dipause");
  };

  const handleResumeQuestion = async () => {
    const res = await resumeQuestion(evaluationId);
    if (res.success) toast.success("Soal dilanjutkan");
  };


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
                <h1 className="text-3xl font-bold text-blue-700 dark:text-white">
                  {evaluation.isActive ? "Live Monitoring" : "Final Results"}: {evaluation.title}
                </h1>
                {!evaluation.isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    ⚫ CLOSED
                  </span>
                )}
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
                  {isWaitingRoomActive ? (
                    // Sesi belum dimulai → tampilkan tombol "Mulai Sesi"
                    <Button
                      onClick={handleStartSession}
                      disabled={isStarting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isStarting ? "Memulai Sesi..." : "Mulai Sesi Sekarang"}
                    </Button>
                  ) : (
                    // Sesi sudah berlangsung → tombol Hentikan (pause — kembali ke waiting room)
                    <Button
                      onClick={() => setShowStopConfirm(true)}
                      disabled={isStopping}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-500/20"
                    >
                      <Square className="w-4 h-4 mr-2" fill="currentColor" />
                      {isStopping ? "Menghentikan..." : "Hentikan Sesi"}
                    </Button>
                  )}
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={sessionStatus === 'active' || isStarting}
                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2 text-zinc-600 dark:text-zinc-400" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSoalClick}
                disabled={sessionStatus === 'active' || isStarting}
                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Soal
              </Button>
            </div>
          </div>
        </div>

        {/* Timer & Controls (When Active) */}
        {sessionStatus === 'active' && evaluation && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border-2 border-indigo-200 dark:border-indigo-900 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                  Soal {currentQuestionIndex + 1} dari {evaluation.questions?.length || 0}
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center font-black text-2xl text-indigo-700 dark:text-indigo-400">
                  {timeLeft}s
                </div>
              </div>
              
              <div className="flex items-center gap-3 border-l-2 border-zinc-200 dark:border-zinc-800 pl-6">
                {isPaused ? (
                  <Button onClick={handleResumeQuestion} className="bg-emerald-600 hover:bg-emerald-700 font-bold h-12 px-6">
                    Resume Timer
                  </Button>
                ) : (
                  <Button onClick={handlePauseQuestion} variant="outline" className="font-bold h-12 px-6 border-amber-500 text-amber-600 hover:bg-amber-50">
                    Pause Timer
                  </Button>
                )}
                
                <Button 
                  onClick={handleNextQuestion} 
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-600/20 h-12 px-6" 
                  disabled={currentQuestionIndex >= (evaluation.questions?.length || 0) - 1}
                >
                  Next Soal
                </Button>
                <div className="flex items-center gap-2 ml-2">
                  <div 
                    className={cn(
                      "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300", 
                      autoNext ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    onClick={() => setAutoNext(!autoNext)}
                  >
                    <div 
                      className={cn(
                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out", 
                        autoNext ? "translate-x-6" : ""
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Next</span>
                </div>
                <div className="flex items-center gap-2 ml-2 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                  <div 
                    className={cn(
                      "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300", 
                      autoRepeat ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    onClick={() => setAutoRepeat(!autoRepeat)}
                  >
                    <div 
                      className={cn(
                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out", 
                        autoRepeat ? "translate-x-6" : ""
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Repeat</span>
                </div>
              </div>
            </div>
            
            <div className="text-right hidden md:block">
              <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Status Kuis</div>
              <div className="text-indigo-600 font-bold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPaused ? "bg-amber-400" : "bg-indigo-400")}></span>
                  <span className={cn("relative inline-flex rounded-full h-3 w-3", isPaused ? "bg-amber-500" : "bg-indigo-500")}></span>
                </span>
                {isPaused ? "DIPAUSE" : "BERJALAN"}
              </div>
            </div>
          </div>
        )}

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
                  {avgAccuracy}%
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {evaluation.isActive ? "Current Avg Accuracy" : "Final Avg Accuracy"}
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
                  <StudentProgressCard key={student.id} student={student} onDelete={handleDeleteStudent} />
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
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-800" :
                      index === 1 ? "bg-zinc-100 dark:bg-zinc-900" :
                      index === 2 ? "bg-orange-50 dark:bg-orange-950/20" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-500 text-white" :
                        index === 1 ? "bg-zinc-400 text-white" :
                        index === 2 ? "bg-orange-500 text-white" :
                        "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
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
                        {student.totalQuestions > 0 ? Math.round((student.score / (student.totalQuestions * 10)) * 100) : 0}%
                      </div>
                      <div className="text-xs text-zinc-500">
                        {student.score} Pts
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

      {/* Modal Konfirmasi Hentikan Sesi (pause — bukan tutup arena) */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-500">
                <Square className="w-6 h-6" fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Hentikan Sesi?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                Sesi akan dihentikan dan kembali ke waiting room. Kamu bisa memulai ulang kapan saja. Untuk menutup arena permanen, gunakan tombol "Tutup Arena" di halaman daftar evaluasi.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 font-bold rounded-xl"
                  onClick={() => setShowStopConfirm(false)}
                  disabled={isStopping}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handleStopSession}
                  disabled={isStopping}
                >
                  {isStopping ? "Menghentikan..." : "Ya, Hentikan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-50 dark:bg-zinc-950 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Soal Evaluasi
              </h2>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setShowEditor(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveSoal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <QuestionBuilder
                questions={editorQuestions}
                onChange={setEditorQuestions}
                courseId={evaluation.courseId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type LiveStudent = {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  timeElapsed: number;
  updatedAt: string | Date;
  status: 'active' | 'completed' | 'stuck' | 'waiting';
};

function StudentProgressCard({ student, onDelete }: { student: LiveStudent, onDelete: (studentId: string, studentName: string) => void }) {
  const progressPercentage = student.totalQuestions > 0 ? (student.currentQuestion / student.totalQuestions) * 100 : 0;
  const accuracyPercentage = student.totalQuestions > 0 ? (student.score / (student.totalQuestions * 10)) * 100 : 0;
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
    waiting: {
      color: "text-zinc-500 dark:text-zinc-400",
      bg: "bg-zinc-100 dark:bg-zinc-900",
      label: "Menunggu",
      icon: Clock,
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
            <div className="text-zinc-600 dark:text-zinc-400" title="Waktu pengerjaan">
              <Clock className="w-3 h-3 inline mr-1" />
              {timeMinutes}:{timeSeconds.toString().padStart(2, "0")}
            </div>
            {student.status === 'completed' && student.updatedAt && (
              <>
                <span className="text-zinc-400">•</span>
                <div className="text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-medium" title="Selesai pada">
                  {new Date(student.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(student.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Score / Accuracy */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            {/* Accuracy percentage removed */}
            <button
              onClick={() => onDelete(student.studentId, student.name)}
              className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              title="Delete student progress"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-zinc-500">{student.score} Pts</div>
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
