"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserStore } from "@/lib/store";
import { triggerConfetti } from "@/lib/confetti";
import { playSuccessSound } from "@/lib/sounds";
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
  PlayCircle,
  Maximize2,
  Minimize2,
  Paperclip,
  MessageSquare,
  Send,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import 'react-quill-new/dist/quill.snow.css';
import { completeLessonAction } from "@/actions/gamification";
import { toast } from "react-hot-toast";

type LessonStep = 'video' | 'summary' | 'practice';

const LANGUAGE_TEMPLATES: Record<string, string> = {
  c: `#include <stdio.h>\n\nint main() {\n    // Tulis kode C Anda di sini\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Tulis kode C++ Anda di sini\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  javascript: `// Tulis kode JavaScript Anda di sini\nconsole.log("Hello, World!");`,
  python: `# Tulis kode Python Anda di sini\nprint("Hello, World!")`
};

export default function LessonIDEPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;

  const { level, completeLesson, completedLessonIds, activeCourseId, isLoggedIn, name, email, unlockAchievement, updateProfile } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [failCount, setFailCount] = useState(0); // State untuk melacak kegagalan submit beruntun
  const [code, setCode] = useState<string>('');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('problem');
  const [step, setStep] = useState<LessonStep>('video');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [language, setLanguage] = useState("c");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const chatInputRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // NAVIGATION LOCKING: Mencegah keluar IDE tidak sengaja
  useEffect(() => {
    if (step !== 'practice') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (
        target && 
        target.href && 
        !target.href.includes(window.location.pathname) && 
        target.target !== '_blank'
      ) {
        e.preventDefault();
        e.stopPropagation();
        setTargetHref(target.href);
        setShowExitPrompt(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Use capture phase to intercept clicks before they reach Next.js router
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [step]);

  // Fetch diskusi dari Database berdasarkan lessonId
  const fetchDiscussions = useCallback(async () => {
    if (!lessonId) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((d: any) => ({
          id: d.id,
          sender: d.userName,
          content: d.content,
          timestamp: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch discussions", e);
    }
  }, [lessonId]);

  useEffect(() => {
    if (isMounted) fetchDiscussions();
  }, [isMounted, fetchDiscussions]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    // Optimistic Update
    const optimisticMsg = {
      id: Date.now(),
      sender: name || "You",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setChatInput("");
    chatInputRef.current = "";

    // POST to Database
    try {
      // Catatan: Karena kita tidak punya userStore.id di komponen ini, 
      // kita mock userId "current_user_1" atau ambil dari store jika ada
      const res = await fetch(`/api/lessons/${lessonId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: chatInput,
          userId: email || "1",
          userName: name || "User"
        })
      });
      if (res.ok) {
        fetchDiscussions(); // Refresh untuk mendapatkan ID asli
      }
    } catch (e) {
      console.error("Failed to post discussion", e);
    }
  };

  const [chatInput, setChatInput] = useState("");
  useEffect(() => {
    chatInputRef.current = chatInput;
  }, [chatInput]);

  const renderDiscussionSheet = () => (
    <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
      <SheetHeader className="p-6 border-b shrink-0">
        <SheetTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="w-5 h-5 text-blue-500" /> Diskusi Modul
        </SheetTitle>
        <SheetDescription>
          Tanyakan materi yang membingungkan atau diskusikan solusi Anda.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
             <MessageSquare className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
             <h4 className="font-bold text-lg text-zinc-600 dark:text-zinc-400">Belum Ada Diskusi</h4>
             <p className="text-sm text-zinc-500 max-w-sm mt-2">Jadilah yang pertama memulai diskusi mengenai materi ini!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-end">
              <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{msg.sender}</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm text-sm text-left">
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 bg-white dark:bg-zinc-900 border-t shrink-0">
         <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              placeholder="Ketik pesan Anda di sini..." 
              className="flex-1" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
            />
            <Button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Send className="w-4 h-4" />
            </Button>
         </form>
      </div>
    </SheetContent>
  );

  const handleLanguageChange = (newLang: string) => {
    // Save current code to codes map
    setCodes(prev => ({
      ...prev,
      [language]: code
    }));

    setLanguage(newLang);
    setExecutionResult(null);
    setIsError(false);

    // Get code for new language, or fall back to template
    const savedCodeForNewLang = codes[newLang];
    if (savedCodeForNewLang !== undefined) {
      setCode(savedCodeForNewLang);
    } else {
      // If it's the lesson's default language, use its starter code
      if (newLang === lesson?.defaultLanguage) {
        setCode(lesson.starterCode || '');
      } else {
        // Use a generic template for the language
        const template = LANGUAGE_TEMPLATES[newLang] || '';
        setCode(template);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string || "";
      setCode(fileContent);

      // Auto-detect language by file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let detectedLang = language;
      if (extension === 'c') detectedLang = 'c';
      else if (extension === 'cpp' || extension === 'cc' || extension === 'cxx') detectedLang = 'cpp';
      else if (extension === 'js' || extension === 'jsx') detectedLang = 'javascript';

      setLanguage(detectedLang);
      setCodes(prev => ({
        ...prev,
        [detectedLang]: fileContent
      }));
    };
    reader.readAsText(file);
  };

  // Fetch lesson data from API
  const fetchLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      if (!res.ok) {
        setLesson(null);
        return;
      }
      const data = await res.json();
      setLesson(data);
      const defaultLang = data.defaultLanguage || 'c';
      setCode(data.starterCode || '');
      setLanguage(defaultLang);
      setCodes({
        [defaultLang]: data.starterCode || ''
      });
    } catch (err) {
      console.error('Failed to fetch lesson:', err);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isLoggedIn) fetchLesson();
  }, [isMounted, isLoggedIn, fetchLesson]);

  // Redirect jika belum login
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isMounted, isLoggedIn, router]);

  if (!isMounted || !isLoggedIn) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-zinc-500">Lesson tidak ditemukan.</p>
        <Link href="/learn">
          <Button>Kembali ke Learn</Button>
        </Link>
      </div>
    );
  }

  // Helper: eksekusi kode via Backend API (diteruskan ke OnlineCompiler.io)
  const executeCode = async (stdin?: string) => {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: language,
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
      const inputToUse = showCustomInput ? customInput : (lesson?.sampleInput || "");
      const data = await executeCode(inputToUse);
      
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

  // Submit & Selesai: kirim kode ke backend untuk divalidasi terhadap SEMUA test case (termasuk hidden)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setExecutionResult(null);
    setIsError(false);

    try {
      setExecutionResult("⏳ Mengirim kode ke server untuk validasi...\n");

      const response = await fetch(`/api/lessons/${lessonId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          language: language,
        })
      });

      const data = await response.json();

      // Tampilkan log hasil validasi dari server
      setExecutionResult(data.log || "Tidak ada hasil dari server.");

      if (data.allPassed) {
        setIsError(false);
        
        // Cek Achievement "O(1) Perfection" (Zero Exceptions)
        if (failCount === 0) {
          unlockAchievement("flawless");
        }

        // Jalankan Server Action untuk memvalidasi dan menyimpan progres ke Database
        const res = await completeLessonAction(
          lessonId, 
          failCount === 0, 
          data.xpReward || lesson?.xpReward || 50, 
          data.gemReward || lesson?.gemReward || 10
        );

        if (res.success) {
          // Trigger Level Up Modal if leveled up
          const didLevelUp = (res.newLevel || level) > level;
          const levelUpPayload = didLevelUp ? {
            isLevelUpModalOpen: true,
            levelUpData: { oldLevel: level, newLevel: res.newLevel as number, gemsGained: ((res.newLevel as number) - level) * 50 }
          } : {};

          // Sinkronisasi Store dengan Drizzle
          updateProfile({
            xp: res.newXp,
            weeklyXp: res.newLeaderboardXp,
            gems: res.newGems,
            level: res.newLevel,
            streak: res.newStreak,
            completedLessonIds: res.isNew ? [...completedLessonIds, lessonId] : completedLessonIds,
            activityHistory: res.gamificationData.activityHistory,
            lastActiveDate: res.gamificationData.lastActiveDate,
            dailyGoals: res.gamificationData.dailyGoals,
            ...levelUpPayload
          });

          // Fallback trigger lokal untuk daily goals increment & notifikasi internal
          completeLesson(lessonId, failCount === 0);

          setTimeout(() => {
            triggerConfetti();
            playSuccessSound();
            toast.success(`Materi Selesai! +${res.earnedXp} XP, +${res.earnedGems} Gems`);
            setTimeout(() => {
              router.push("/learn");
            }, 1500);
          }, 800);
        } else {
          setIsError(true);
          toast.error(res.error || "Gagal menyimpan progres ke server.");
        }
      } else {
        setIsError(true);
        // Track fail count untuk achievement "Brute Force"
        setFailCount((prev) => {
          const newCount = prev + 1;
          if (newCount === 5) {
            unlockAchievement("brute-force");
          }
          return newCount;
        });
      }
    } catch (error: any) {
      setExecutionResult(`\n❌ Gagal menghubungi server: ${error.message}\n`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageNumber = lesson?.order || lessonId;

  // ============================================
  // RENDER: VIDEO & SUMMARY LAYOUT (Langkah 1 & 2)
  // ============================================
  if (step === 'video' || step === 'summary') {
    const isVideo = step === 'video';

    return (
      <>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors font-bold">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Peta Pembelajaran
          </Link>
          <Button variant="outline" size="sm" className="font-bold border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 shadow-sm" onClick={() => setIsDiscussionOpen(true)}>
             <MessageSquare className="w-4 h-4 mr-2" /> Diskusi Modul
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              {/* VIDEO PLAYER - Hanya muncul di step Video */}
              {isVideo && (
                <div className="w-full aspect-video bg-zinc-800 relative group border-b-2 border-zinc-200 dark:border-zinc-800">
                  {lesson.videoUrl ? (
                    <iframe 
                      className="w-full h-full"
                      src={lesson.videoUrl} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <PlayCircle className="w-20 h-20 text-white/50 group-hover:text-white/90 group-hover:scale-110 transition-all z-10" />
                      <p className="text-white/40 mt-4 font-medium z-10 uppercase tracking-widest text-sm">No Video Available</p>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {lesson.problemCategory || 'Materi Dasar'}
                  </span>
                  <span className="text-sm font-bold text-zinc-400">Stage {stageNumber}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white mb-4">
                  {lesson.title || 'Memahami Konsep Dasar'}
                </h1>

                {/* DYNAMIC SUMMARY CONTENT */}
                {!isVideo && (
                  <div className="ql-snow mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    {lesson.summaryContent ? (
                      <div className="ql-editor p-0 text-zinc-600 dark:text-zinc-400" dangerouslySetInnerHTML={{ __html: lesson.summaryContent }} />
                    ) : (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center">
                        <p>Rangkuman belum tersedia untuk materi ini.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ATTACHMENTS (PDF/DOCX) */}
                {!isVideo && lesson.materialFiles && (() => {
                  try {
                    const files = JSON.parse(lesson.materialFiles);
                    if (files.length === 0) return null;
                    return (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          <Paperclip className="w-4 h-4" /> Lampiran Materi Tambahan
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {files.map((file: any, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all shadow-sm"
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <span className="truncate max-w-[250px]">{file.fileName}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  } catch { return null; }
                })()}
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
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full font-extrabold text-md h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                    onClick={() => setStep('practice')}
                  >
                    Lanjut Latihan Coding <Code className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-bold text-md h-14 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setStep('video')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Video
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {/* DISCUSSION SHEET */}
      <Sheet open={isDiscussionOpen} onOpenChange={setIsDiscussionOpen}>
        {renderDiscussionSheet()}
      </Sheet>
      </>
    );
  }

  // ============================================
  // RENDER: IDE / HACKERRANK PRACTICE (Langkah 3)
  // ============================================
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {isMobile && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/50 px-6 py-3 text-xs md:text-sm text-amber-850 dark:text-amber-300 flex items-center gap-2 font-semibold shrink-0 z-10">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Tahap Praktik lebih optimal dikerjakan di Desktop/Tablet.</span>
        </div>
      )}
      {/* TOP HEADER BREADCRUMB */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-sm font-bold">
          <Button variant="secondary" size="sm" onClick={() => setStep('summary')} className="gap-2 font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <ArrowLeft className="w-4 h-4" /> Kembali Rangkuman
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span>{lesson.problemCategory || 'Lesson'}</span>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-100">{lesson.problemTitle || lesson.title || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="font-bold border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 shadow-sm" onClick={() => setIsDiscussionOpen(true)}>
             <MessageSquare className="w-4 h-4 mr-2" /> Diskusi
          </Button>
          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Practice Phase
          </span>
        </div>
      </div>

      {/* MAIN SPLIT PANE */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full p-4 gap-4">

        {/* ================= LEFT PANE (Problem Description) ================= */}
        {!isFullScreen && (
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
            <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white mb-6">{lesson.problemTitle || lesson.title || 'Problem'}</h1>
            <p className="mb-6">{lesson.problemDescription}</p>

            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-3">Sample</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Sample Input</h2>
                <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre shadow-inner">
                  {lesson.sampleInput}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Sample Output</h2>
                <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre shadow-inner">
                  {lesson.sampleOutput}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 text-sm text-blue-800 dark:text-blue-300 rounded-r-xl">
              <strong className="font-bold flex items-center gap-2 mb-1"><FileCode2 className="w-4 h-4" /> Info:</strong>
              {lesson.testCases && (
                <span>Kode Anda akan diuji terhadap {lesson.testCases.length} test case ({lesson.testCases.filter((tc: any) => !tc.hidden).length} terlihat, {lesson.testCases.filter((tc: any) => tc.hidden).length} tersembunyi).</span>
              )}
            </div>

          </div>
        </ResizablePanel>
        )}

        {!isFullScreen && (
          <ResizableHandle withHandle className="bg-transparent w-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center mx-1 cursor-col-resize" />
        )}

        {/* ================= RIGHT PANE (Code Editor) ================= */}
        <ResizablePanel defaultSize={isFullScreen ? 100 : 60} minSize={isFullScreen ? 100 : 30} className="flex flex-col bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 relative z-20">

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
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-white border-none text-xs outline-none cursor-pointer p-0 font-bold"
              >
                <option className="bg-zinc-900" value="c">C</option>
                <option className="bg-zinc-900" value="cpp">C++</option>
                <option className="bg-zinc-900" value="javascript">Javascript (Node.js)</option>
                <option className="bg-zinc-900" value="python">Python</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <button
                onClick={() => setIsConfirmResetOpen(true)}
                className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded hover:bg-white/5"
                title="Reset Kode"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded hover:bg-white/5"
                title={isFullScreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Wrapper */}
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={executionResult !== null ? 70 : 100} minSize={30} className="flex flex-col relative">
              <div className="flex-1 w-full relative pt-4">
            <Editor
              height="100%"
              language={language}
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

          {showCustomInput && (
            <>
              <ResizableHandle withHandle className="bg-[#2d2d2d] h-2 hover:bg-zinc-700 transition-colors cursor-row-resize" />
              <ResizablePanel defaultSize={20} minSize={10} className="flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333] shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <FileText className="w-4 h-4" /> Custom Input (stdin)
                  </div>
                </div>
                <textarea
                  className="flex-1 w-full p-4 bg-[#1e1e1e] text-zinc-200 font-mono text-sm resize-none outline-none border-none focus:ring-0 placeholder:text-zinc-650"
                  placeholder="Masukkan data input (stdin) untuk program Anda di sini..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </ResizablePanel>
            </>
          )}

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
              <div 
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer transition-colors px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> Upload File
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".c,.cpp,.cc,.cxx,.js,.jsx" 
                  className="hidden" 
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-blue-500"
                  checked={showCustomInput}
                  onChange={(e) => setShowCustomInput(e.target.checked)}
                />
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

        <ConfirmModal
          isOpen={isConfirmResetOpen}
          onClose={() => setIsConfirmResetOpen(false)}
          onConfirm={() => {
            setCode(lesson?.starterCode || '');
            setExecutionResult(null);
            setIsError(false);
            setIsConfirmResetOpen(false);
          }}
          title="Reset Kode?"
          message="Kode yang sudah Anda tulis akan dihapus dan dikembalikan ke kondisi awal (template). Aksi ini tidak dapat dibatalkan."
          confirmText="Ya, Reset"
          cancelText="Batal"
          variant="danger"
        />

        {/* DISCUSSION SHEET (IDE Context) */}
        <Sheet open={isDiscussionOpen} onOpenChange={setIsDiscussionOpen}>
          {renderDiscussionSheet()}
        </Sheet>

        <ConfirmModal
          isOpen={showExitPrompt}
          onClose={() => {
            setShowExitPrompt(false);
            setTargetHref(null);
          }}
          onConfirm={() => {
            if (targetHref) window.location.href = targetHref;
          }}
          title="Yakin Ingin Keluar?"
          message="Anda sedang berada di tengah sesi praktik. Progres kode Anda mungkin tidak tersimpan. Lanjutkan keluar?"
          confirmText="Ya, Keluar"
          cancelText="Tetap di Sini"
          variant="danger"
        />
      </div>
  );
}
