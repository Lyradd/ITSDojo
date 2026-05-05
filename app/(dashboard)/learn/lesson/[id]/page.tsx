"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserStore } from "@/lib/store";
import { triggerConfetti } from "@/lib/confetti";
import { playSuccessSound } from "@/lib/sounds";
import { COURSE_CONTENT, getLessonProblem } from "@/lib/lesson-data";
import {
  ArrowLeft,
  Settings,
  RotateCcw,
  MoreVertical,
  Upload,
  Play,
  CheckCircle,
  FileCode2,
  FileText,
  Code,
  Loader2,
  Terminal,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Editor from "@monaco-editor/react";

type LessonStep = 'video' | 'summary' | 'practice';

export default function LessonIDEPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;
  const problem = useMemo(() => getLessonProblem(lessonId), [lessonId]);

  const { completeLesson, completedLessonIds, activeCourseId, isLoggedIn } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [code, setCode] = useState<string>(problem?.starterCode || '');
  const [activeTab, setActiveTab] = useState('problem');
  const [step, setStep] = useState<LessonStep>('video');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [language, setLanguage] = useState(problem?.defaultLanguage || "c");


  // --- Route Protection: cek apakah lesson ini boleh diakses ---

  const isLessonAccessible = useMemo(() => {
    if (!lessonId) return false;

    // Cari kursus yang memiliki lesson ini
    const courseEntry = Object.entries(COURSE_CONTENT).find(([, content]) =>
      content.nodes.some(n => n.id === lessonId)
    );
    if (!courseEntry) return false; // Lesson ID tidak dikenal

    const [, courseContent] = courseEntry;
    const nodes = courseContent.nodes;
    const nodeIndex = nodes.findIndex(n => n.id === lessonId);
    if (nodeIndex === -1) return false;

    // Cek apakah lesson sudah completed
    if (completedLessonIds.includes(lessonId)) return true;

    // Cek apakah lesson ini adalah "active" (semua sebelumnya sudah selesai)
    const activeNodeIndex = nodes.findIndex((n, idx) => {
      const prevId = idx === 0 ? null : nodes[idx - 1].id;
      const isPrevCompleted = prevId ? completedLessonIds.includes(prevId) : true;
      const isCurrCompleted = completedLessonIds.includes(n.id);
      return isPrevCompleted && !isCurrCompleted;
    });

    return nodeIndex === activeNodeIndex;
  }, [lessonId, completedLessonIds]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect jika belum login
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isMounted, isLoggedIn, router]);

  // Redirect jika lesson terkunci (akses via URL langsung)
  useEffect(() => {
    if (isMounted && isLoggedIn && !isLessonAccessible) {
      router.push("/learn");
    }
  }, [isMounted, isLoggedIn, isLessonAccessible, router]);

  if (!isMounted || !isLoggedIn || !isLessonAccessible) return null;

  // Helper: eksekusi kode via Piston API
  const executeCode = async (stdin?: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: language,
        version: "*",
        files: [{ content: code }],
        stdin: stdin || "",
      })
    });
    return response.json();
  };

  // Run Code: jalankan tanpa validasi (untuk testing/debugging)
  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setIsError(false);

    try {
      const data = await executeCode();
      
      if (data.run && data.run.output !== undefined) {
        setExecutionResult(data.run.output || "Program finished with no output.");
        if (data.run.code !== 0 || data.run.stderr) {
          setIsError(true);
        }
      } else {
        setExecutionResult(data.message || "Unknown execution error");
        setIsError(true);
      }
    } catch (error: any) {
      setExecutionResult(error.message || "Failed to reach Execution API");
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit & Selesai: jalankan terhadap semua test case, validasi output
  const handleSubmit = async () => {
    if (!problem) return;

    setIsSubmitting(true);
    setExecutionResult(null);
    setIsError(false);

    let resultLog = `⏳ Menjalankan ${problem.testCases.length} test cases...\n\n`;
    setExecutionResult(resultLog);

    let allPassed = true;

    try {
      for (const tc of problem.testCases) {
        const data = await executeCode(tc.stdin);

        const actualOutput = (data.run?.output ?? "").replace(/\r\n/g, "\n").trimEnd();
        const expectedOutput = tc.expected.replace(/\r\n/g, "\n").trimEnd();

        // Cek error kompilasi / runtime
        if (!data.run || data.run.code !== 0 || data.run.stderr) {
          allPassed = false;
          const errorMsg = data.run?.stderr || data.run?.output || data.message || "Unknown error";
          resultLog += `❌ Test Case ${tc.id}: ERROR\n`;
          resultLog += `   Error: ${errorMsg.trim()}\n\n`;
          setExecutionResult(resultLog);
          setIsError(true);
          continue;
        }

        // Bandingkan output
        if (actualOutput === expectedOutput) {
          resultLog += `✅ Test Case ${tc.id}: PASSED\n`;
        } else {
          allPassed = false;
          resultLog += `❌ Test Case ${tc.id}: FAILED\n`;
          resultLog += `   Expected:\n${expectedOutput.split("\n").map((l: string) => `   │ ${l}`).join("\n")}\n`;
          resultLog += `   Got:\n${actualOutput.split("\n").map((l: string) => `   │ ${l}`).join("\n")}\n`;
        }
        resultLog += "\n";
        setExecutionResult(resultLog);
      }

      if (allPassed) {
        resultLog += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        resultLog += "🎉 Semua test case PASSED! Lesson selesai!\n";
        setExecutionResult(resultLog);
        setIsError(false);

        // Tandai lesson selesai setelah delay singkat agar user bisa lihat hasil
        setTimeout(() => {
          completeLesson(params?.id as string, true);
          triggerConfetti();
          playSuccessSound();
          setTimeout(() => {
            router.push("/learn");
          }, 1500);
        }, 800);
      } else {
        resultLog += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        resultLog += "⚠️ Beberapa test case gagal. Perbaiki kode dan coba lagi.\n";
        setExecutionResult(resultLog);
        setIsError(true);
      }
    } catch (error: any) {
      resultLog += `\n❌ Gagal menghubungi Execution API: ${error.message}\n`;
      setExecutionResult(resultLog);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lessonIdStr = params?.id as string || "unknown";
  const lastDashIndex = lessonIdStr.lastIndexOf("-");
  const stageNumber = lastDashIndex > -1 ? lessonIdStr.substring(lastDashIndex + 1) : "1";

  // ============================================
  // RENDER: VIDEO & SUMMARY LAYOUT (Langkah 1 & 2)
  // ============================================
  if (step === 'video' || step === 'summary') {
    const isVideo = step === 'video';

    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors font-bold mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Peta Pembelajaran
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              {/* VIDEO PLACEHOLDER - Hanya muncul di step Video */}
              {isVideo && (
                <div className="w-full aspect-video bg-zinc-800 flex flex-col items-center justify-center relative group cursor-pointer border-b-2 border-zinc-200 dark:border-zinc-800">
                  <PlayCircle className="w-20 h-20 text-white/50 group-hover:text-white/90 group-hover:scale-110 transition-all z-10" />
                  <p className="text-white/40 mt-4 font-medium z-10 uppercase tracking-widest text-sm">Preview Video Player</p>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {problem?.category || 'Materi Dasar'}
                  </span>
                  <span className="text-sm font-bold text-zinc-400">Stage {stageNumber}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white mb-4">
                  {problem?.title || 'Memahami Konsep Dasar'}
                </h1>

                {/* DUMMY DESCRIPTION UNTUK SUMMARY */}
                {!isVideo && (
                  <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    <h3 className="font-bold text-xl text-zinc-800 dark:text-zinc-200 mb-3">1. Pengantar</h3>
                    <p className="leading-relaxed mb-4">Secara umum, file C akan membutuhkan beberapa kerangka awal seperti header library, layaknya baris <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">#include &lt;stdio.h&gt;</code> untuk memanggil utilitas antarmuka *input-output* standar.</p>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 my-6 font-mono text-sm text-zinc-700 dark:text-zinc-300 shadow-inner">
                      <span className="text-blue-600 dark:text-blue-400">int</span> main() {'{\n'}
                      &nbsp;&nbsp;<span className="text-green-600 dark:text-green-500">{"// Tempat mengetik kode"}</span>{'\n'}
                      &nbsp;&nbsp;<span className="text-blue-600 dark:text-blue-400">printf</span>(<span className="text-green-600 dark:text-green-400">"Semangat Belajar!"</span>);{'\n'}
                      &nbsp;&nbsp;<span className="text-pink-600 dark:text-pink-400">return</span> <span className="text-orange-500">0</span>;{'\n'}
                      {'}'}
                    </div>
                    <p className="leading-relaxed mb-4">Fungsi utama dideklarasikan di dalam <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">int main()</code>. Sistem (*compiler*) akan otomatis mengeksekusi urutan baris di dalamnya langkah demi langkah ketika diaplikasikan.</p>
                  </div>
                )}
                {isVideo && (
                  <p className="text-zinc-500 mb-2 leading-relaxed">
                    Tonton video pembelajaran singkat ini untuk mengerti konsep fundamental mengenai tata bahasa pemrograman. Konsep input-output ini akan jadi modal dasar untuk tantangan berikutnya.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION & TASKS */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 shadow-sm top-8 sticky">
              <h3 className="font-bold text-xl text-zinc-800 dark:text-white mb-6">Tugas Sesi Ini</h3>

              <div className="space-y-6 mb-10">
                {/* 1. Tonton Video */}
                <div className={`flex items-start gap-4 transition-all duration-500 ${!isVideo ? 'opacity-70' : ''}`}>
                  {isVideo ? (
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mt-[-4px]">
                      <PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mt-[-4px]">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  <div>
                    <p className={`font-bold text-sm mb-1 ${isVideo ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 line-through decoration-2'}`}>Tonton Video Materi</p>
                    <p className="text-xs text-zinc-500 font-medium">{!isVideo ? 'Selesai ditonton' : 'Wajib disaksikan hingga habis'}</p>
                  </div>
                </div>

                {/* 2. Baca Rangkuman */}
                <div className={`flex items-start gap-4 transition-all duration-500 ${isVideo ? 'opacity-30 grayscale' : ''}`}>
                  {!isVideo ? (
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mt-[-4px]">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full mt-[-4px]">
                      <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                    </div>
                  )}
                  <div>
                    <p className={`font-bold text-sm mb-1 ${!isVideo ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Baca Rangkuman Modul</p>
                    <p className="text-xs text-zinc-500 font-medium">Pahami konsep dasar input-output</p>
                  </div>
                </div>

                {/* 3. Latihan */}
                <div className={`flex items-start gap-4 transition-all opacity-30 grayscale`}>
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full mt-[-4px]">
                    <Code className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-500 dark:text-zinc-400 mb-1">Latihan Praktik Dasar</p>
                    <p className="text-xs text-zinc-500 font-medium">Eksekusi kode pertama Anda</p>
                  </div>
                </div>
              </div>

              {isVideo ? (
                <Button
                  size="lg"
                  className="w-full font-bold text-md h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setStep('summary')}
                >
                  Lanjut ke Rangkuman <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full font-extrabold text-md h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                  onClick={() => setStep('practice')}
                >
                  Lanjut Latihan Coding <Code className="w-4 h-4 ml-2" />
                </Button>
              )}
            </Card>
          </div>

        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: IDE / HACKERRANK PRACTICE (Langkah 3)
  // ============================================
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* TOP HEADER BREADCRUMB */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-sm font-bold">
          <Button variant="secondary" size="sm" onClick={() => setStep('summary')} className="gap-2 font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <ArrowLeft className="w-4 h-4" /> Kembali Rangkuman
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span>{problem?.category || 'Lesson'}</span>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-100">{problem?.title || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Practice Phase
          </span>
        </div>
      </div>

      {/* MAIN SPLIT PANE */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full p-4 gap-4">

        {/* ================= LEFT PANE (Problem Description) ================= */}
        <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

          {/* Horizontal Tabs */}
          <div className="flex items-center p-4 gap-2 bg-zinc-50 dark:bg-zinc-800/50 border-b-2 border-zinc-200 dark:border-zinc-800 shrink-0">
            {['problem', 'submissions', 'leaderboard'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area — Dynamic dari problem data */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white mb-6">{problem?.title || 'Problem'}</h1>
            <p className="mb-6">{problem?.description}</p>

            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-3">Sample</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Sample Input</h2>
                <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre shadow-inner">
                  {problem?.sampleInput}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Sample Output</h2>
                <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre shadow-inner">
                  {problem?.sampleOutput}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 text-sm text-blue-800 dark:text-blue-300 rounded-r-xl">
              <strong className="font-bold flex items-center gap-2 mb-1"><FileCode2 className="w-4 h-4" /> Info:</strong>
              {problem?.testCases && (
                <span>Kode Anda akan diuji terhadap {problem.testCases.length} test case ({problem.testCases.filter(tc => !tc.hidden).length} terlihat, {problem.testCases.filter(tc => tc.hidden).length} tersembunyi).</span>
              )}
            </div>

          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent w-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center mx-1 cursor-col-resize" />

        {/* ================= RIGHT PANE (Code Editor) ================= */}
        <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 relative z-20">

          {/* Editor Top Bar */}
          <div className="h-14 border-b border-[#2d2d2d] flex items-center justify-between px-6 bg-[#252526] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>

            <div className="flex items-center gap-4 bg-[#1e1e1e] px-4 py-1.5 rounded-xl border border-[#333]">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Lang:</span>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-white border-none text-xs outline-none cursor-pointer p-0 font-bold"
              >
                <option className="bg-zinc-900" value="c">C</option>
                <option className="bg-zinc-900" value="cpp">C++</option>
                <option className="bg-zinc-900" value="javascript">Javascript (Node.js)</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <RotateCcw className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>

          {/* Monaco Editor Wrapper */}
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={executionResult !== null ? 70 : 100} minSize={30} className="flex flex-col relative">
              <div className="flex-1 w-full relative pt-4">
            <Editor
              height="100%"
              defaultLanguage={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 26,
                padding: { top: 8 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "blink",
                cursorStyle: "line",
                cursorWidth: 2,
                cursorSmoothCaretAnimation: "off",
                formatOnPaste: true,
              }}
            />
          </div>

          {/* Editor Bottom Info Bar */}
          <div className="h-8 border-t border-[#2d2d2d] flex items-center justify-end px-4 shrink-0 bg-[#007acc]/10 text-xs text-blue-400 font-mono">
            Ln {code.split("\n").length}, Col 1
          </div>
          </ResizablePanel>

          {executionResult !== null && (
            <>
              <ResizableHandle withHandle className="bg-[#2d2d2d] h-2 hover:bg-zinc-700 transition-colors cursor-row-resize" />
              <ResizablePanel defaultSize={30} minSize={15} className="flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333] shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <Terminal className="w-4 h-4" /> Output Console
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-zinc-500 hover:text-white" onClick={() => setExecutionResult(null)}>Clear</Button>
                </div>
                <div className={`flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap outline-none ${isError ? 'text-red-400' : 'text-green-400'}`}>
                  {executionResult}
                </div>
              </ResizablePanel>
            </>
          )}
          </ResizablePanelGroup>

          {/* Editor Bottom Actions Bar (Submit / Run) */}
          <div className="h-20 border-t border-[#2d2d2d] flex items-center justify-between px-6 bg-[#252526] shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer transition-colors px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">
                <Upload className="w-4 h-4" /> Upload File
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-blue-500" />
                Custom Input
              </label>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="secondary" disabled={isRunning || isSubmitting} className="bg-zinc-800 hover:bg-zinc-700 text-white h-11 px-8 font-bold text-sm shadow-lg border border-zinc-700" onClick={handleRunCode}>
                {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} 
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
              <Button
                disabled={isSubmitting || isRunning}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 font-extrabold text-sm border-none shadow-xl shadow-blue-900/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleSubmit}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {isSubmitting ? 'Menguji...' : 'Submit & Selesai'}
              </Button>
            </div>
          </div>

        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
