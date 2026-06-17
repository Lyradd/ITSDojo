"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, RefreshCw, Search, BookOpen, ListChecks, Save, Trash2, Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type TopicOption = {
  id: number;
  subjectName: string;
  description: string;
};

type DuelQuestionRow = {
  id: number;
  topicId: number;
  topicName: string | null;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer" | "slider";
  options: string[] | null;
  correctAnswer: string;
  sliderMin: number | null;
  sliderMax: number | null;
  answerMargin: number | null;
  points: number;
  timeLimit: number;
  order: number;
};

type QuestionFormState = {
  topicId: string;
  questionText: string;
  questionType: DuelQuestionRow["questionType"];
  options: string[];
  correctAnswer: string;
  sliderMin: string;
  sliderMax: string;
  answerMargin: string;

  points: string;
  timeLimit: string;
  order: string;
};

const DEFAULT_FORM: QuestionFormState = {
  topicId: "",
  questionText: "",
  questionType: "multiple_choice",
  options: ["", "", "", ""],
  correctAnswer: "",
  sliderMin: "1",
  sliderMax: "10",
  answerMargin: "1",

  points: "10",
  timeLimit: "30",
  order: "1",
};

export default function DuelQuestionsDosenPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [questions, setQuestions] = useState<DuelQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [form, setForm] = useState<QuestionFormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<QuestionFormState>(DEFAULT_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, topicFilter]);

  useEffect(() => {
    setIsMounted(true);
    if (role !== "dosen" && (role as string) !== "") {
      if (role === "admin") router.push("/admin");
      else router.push("/learn");
    }
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicResponse, questionResponse] = await Promise.all([
        fetch("/api/topics", { headers: { "x-user-role": "dosen" } }),
        fetch("/api/admin/duel-questions", { headers: { "x-user-role": "dosen" } }),
      ]);

      const topicData = (await topicResponse.json()) as Array<{ id: number; subjectName: string; description: string }>;
      const questionData = (await questionResponse.json()) as DuelQuestionRow[] | { error?: string };

      setTopics(Array.isArray(topicData) ? topicData : []);
      setQuestions(Array.isArray(questionData) ? questionData : []);

      if (!form.topicId && Array.isArray(topicData) && topicData.length > 0) {
        setForm((current) => ({
          ...current,
          topicId: String(topicData[0].id),
        }));
      }
    } catch (error) {
      console.error(error);
      setTopics([]);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && role === "dosen") {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, role]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesTopic = topicFilter === "all" || String(question.topicId) === topicFilter;
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        question.questionText.toLowerCase().includes(search) ||
        (question.topicName ?? "").toLowerCase().includes(search) ||
        question.questionType.toLowerCase().includes(search);

      return matchesTopic && matchesSearch;
    });
  }, [questions, searchQuery, topicFilter]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const selectedTopicId = Number(form.topicId);
  const questionCountForSelectedTopic = questions.filter((question) => question.topicId === selectedTopicId).length;

  useEffect(() => {
    if (!form.topicId) {
      return;
    }

    const nextOrder = questionCountForSelectedTopic + 1;
    setForm((current) => (current.order === DEFAULT_FORM.order || current.order === "" ? { ...current, order: String(nextOrder) } : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.topicId, questionCountForSelectedTopic]);

  if (!isMounted || role !== "dosen" || loading) return null;

  const handleQuestionTypeChange = (questionType: QuestionFormState["questionType"]) => {
    const nextState: QuestionFormState = {
      ...form,
      questionType,
      correctAnswer: questionType === "true_false" ? "True" : (questionType === "slider" ? "5" : ""),
      options: questionType === "true_false"
        ? ["True", "False"]
        : questionType === "multiple_choice"
          ? form.options.length === 4
            ? form.options
            : ["", "", "", ""]
          : ["", "", "", ""],
    };

    setForm(nextState);
  };

  const handleOptionChange = (index: number, value: string) => {
    setForm((current) => {
      const nextOptions = [...current.options];
      const oldValue = nextOptions[index];
      nextOptions[index] = value;
      const isCorrect = current.correctAnswer !== "" && current.correctAnswer === oldValue;
      return {
        ...current,
        options: nextOptions,
        correctAnswer: isCorrect ? value : current.correctAnswer,
      };
    });
  };

  const handleEditQuestionTypeChange = (questionType: QuestionFormState["questionType"]) => {
    const nextState: QuestionFormState = {
      ...editForm,
      questionType,
      correctAnswer: questionType === "true_false" ? "True" : (questionType === "slider" ? "5" : ""),
      options: questionType === "true_false"
        ? ["True", "False"]
        : questionType === "multiple_choice"
          ? editForm.options.length === 4
            ? editForm.options
            : ["", "", "", ""]
          : ["", "", "", ""],
    };

    setEditForm(nextState);
  };

  const handleEditOptionChange = (index: number, value: string) => {
    setEditForm((current) => {
      const nextOptions = [...current.options];
      const oldValue = nextOptions[index];
      nextOptions[index] = value;
      const isCorrect = current.correctAnswer !== "" && current.correctAnswer === oldValue;
      return {
        ...current,
        options: nextOptions,
        correctAnswer: isCorrect ? value : current.correctAnswer,
      };
    });
  };

  const resetForm = () => {
    setEditingId(null);
    const firstTopicId = topics[0]?.id ? String(topics[0].id) : "";
    setForm({
      ...DEFAULT_FORM,
      topicId: firstTopicId,
      order: String(questions.filter((question) => String(question.topicId) === firstTopicId).length + 1 || 1),
    });
  };

  const handleStartEdit = (question: DuelQuestionRow) => {
    setEditingId(question.id);
    setEditForm({
      topicId: String(question.topicId),
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options && question.options.length > 0
        ? [...question.options, ...Array(Math.max(0, 4 - question.options.length)).fill("")]
        : ["", "", "", ""],
      correctAnswer: question.correctAnswer,
      sliderMin: question.sliderMin !== null ? String(question.sliderMin) : "1",
      sliderMax: question.sliderMax !== null ? String(question.sliderMax) : "10",
      answerMargin: question.answerMargin !== null ? String(question.answerMargin) : "1",
      points: String(question.points ?? 10),
      timeLimit: String(question.timeLimit ?? 30),
      order: String(question.order ?? 1),
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    if (!editForm.topicId) {
      toast.error("Pilih topik terlebih dahulu.");
      return;
    }

    if (!editForm.questionText.trim()) {
      toast.error("Teks soal wajib diisi.");
      return;
    }

    if (editForm.questionType === "multiple_choice") {
      const trimmedOptions = editForm.options.map((option) => option.trim()).filter(Boolean);
      if (trimmedOptions.length < 2) {
        toast.error("Minimal dua opsi jawaban diperlukan.");
        return;
      }
      if (!editForm.correctAnswer || !trimmedOptions.includes(editForm.correctAnswer.trim())) {
        toast.error("Pilih salah satu opsi sebagai jawaban benar.");
        return;
      }
    }

    if (editForm.questionType === "true_false") {
      if (editForm.correctAnswer !== "True" && editForm.correctAnswer !== "False") {
        toast.error("Pilih True atau False sebagai jawaban benar.");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/duel-questions/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role || "dosen",
        },
        body: JSON.stringify({
          topicId: Number(editForm.topicId),
          questionText: editForm.questionText,
          questionType: editForm.questionType,
          options: editForm.questionType === "multiple_choice" || editForm.questionType === "true_false"
            ? editForm.options.filter((option) => option.trim())
            : undefined,
          correctAnswer: editForm.correctAnswer,
          points: Number(editForm.points),
          timeLimit: Number(editForm.timeLimit),
          order: Number(editForm.order),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyimpan soal");
      }

      toast.success("Soal duel berhasil diperbarui.");
      setQuestions((current) =>
        current.map((q) => (q.id === editingId ? {
          ...(payload as DuelQuestionRow),
          topicName: topics.find(t => String(t.id) === String(payload.topicId))?.subjectName || null,
        } : q))
      );
      setIsEditOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan soal");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;

    try {
      const response = await fetch(`/api/admin/duel-questions/${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          "x-user-role": role || "dosen",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menghapus soal");
      }

      toast.success("Soal berhasil dihapus.");
      setQuestions((current) => current.filter((q) => q.id !== deleteConfirmId));

      if (editingId === deleteConfirmId) {
        setEditingId(null);
        resetForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus soal");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.topicId) {
      toast.error("Pilih topik terlebih dahulu.");
      return;
    }

    if (!form.questionText.trim()) {
      toast.error("Teks soal wajib diisi.");
      return;
    }

    if (form.questionType === "multiple_choice") {
      const trimmedOptions = form.options.map((option) => option.trim()).filter(Boolean);
      if (trimmedOptions.length < 2) {
        toast.error("Minimal dua opsi jawaban diperlukan.");
        return;
      }
      if (!form.correctAnswer || !trimmedOptions.includes(form.correctAnswer.trim())) {
        toast.error("Pilih salah satu opsi sebagai jawaban benar.");
        return;
      }
    }

    if (form.questionType === "true_false") {
      if (form.correctAnswer !== "True" && form.correctAnswer !== "False") {
        toast.error("Pilih True atau False sebagai jawaban benar.");
        return;
      }
    }

    if (form.questionType === "short_answer" && !form.correctAnswer.trim()) {
      toast.error("Jawaban benar wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/duel-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role || "dosen",
        },
        body: JSON.stringify({
          topicId: Number(form.topicId),
          questionText: form.questionText,
          questionType: form.questionType,
          options: form.questionType === "multiple_choice" || form.questionType === "true_false"
            ? form.options.filter((option) => option.trim())
            : undefined,
          correctAnswer: form.correctAnswer,
          points: Number(form.points),
          timeLimit: Number(form.timeLimit),
          order: Number(form.order),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyimpan soal");
      }

      toast.success("Soal duel berhasil ditambahkan.");
      const enrichedPayload = {
        ...payload,
        topicName: topics.find(t => String(t.id) === String(payload.topicId))?.subjectName || null,
      };
      setQuestions((current) => [enrichedPayload as DuelQuestionRow, ...current]);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan soal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <BookOpen className="h-4 w-4" />
              Dosen Duel
            </div>
            <h1 className="text-4xl font-bold text-blue-700 dark:text-white">Kelola Soal Duel</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Tambahkan soal dan jawaban untuk duel.
            </p>
          </div>

          <Button variant="outline" onClick={loadData} className="shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat Ulang
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-3xl border-2 bg-white/90 p-6 shadow-lg dark:bg-zinc-900/90">
            <div className="mb-4 border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Tambah Soal Duel
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topik</Label>
                  <select
                    id="topic"
                    value={form.topicId}
                    onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value, order: String(questions.filter((question) => String(question.topicId) === event.target.value).length + 1) }))}
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="">Pilih topik</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionType">Tipe Soal</Label>
                  <select
                    id="questionType"
                    value={form.questionType}
                    onChange={(event) => handleQuestionTypeChange(event.target.value as QuestionFormState["questionType"])}
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="true_false">Benar / Salah</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionText">Pertanyaan</Label>
                <Textarea
                  id="questionText"
                  value={form.questionText}
                  onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value }))}
                  rows={4}
                  placeholder="Tulis pertanyaan di sini..."
                />
              </div>

              {form.questionType === "multiple_choice" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Opsi Jawaban</Label>
                    <span className="text-xs text-zinc-500">Pilih salah satu sebagai jawaban benar</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {form.options.map((option, index) => {
                      const isCorrect = form.correctAnswer !== "" && form.correctAnswer === option;
                      return (
                        <div key={`mc-${index}`} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(event) => handleOptionChange(index, event.target.value)}
                            placeholder={`Opsi ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant={isCorrect ? "default" : "outline"}
                            size="icon"
                            onClick={() => {
                              if (option.trim()) {
                                setForm((current) => ({ ...current, correctAnswer: option }));
                              } else {
                                toast.error("Opsi harus diisi sebelum menjadikannya jawaban benar.");
                              }
                            }}
                            className={cn(
                              "h-11 w-11 shrink-0 transition-all duration-200",
                              isCorrect
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                            )}
                            title="Tandai sebagai jawaban benar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.questionType === "true_false" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Opsi Jawaban</Label>
                    <span className="text-xs text-zinc-500">Pilih salah satu sebagai jawaban benar</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {["True", "False"].map((option) => {
                      const isCorrect = form.correctAnswer === option;
                      return (
                        <div key={`tf-${option}`} className="flex items-center gap-2">
                          <div className="flex h-11 w-full items-center rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900/50">
                            {option === "True" ? "True / Benar" : "False / Salah"}
                          </div>
                          <Button
                            type="button"
                            variant={isCorrect ? "default" : "outline"}
                            size="icon"
                            onClick={() => {
                              setForm((current) => ({ ...current, correctAnswer: option }));
                            }}
                            className={cn(
                              "h-11 w-11 shrink-0 transition-all duration-200",
                              isCorrect
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                            )}
                            title="Tandai sebagai jawaban benar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.questionType === "short_answer" && (
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Jawaban Benar</Label>
                  <Input
                    id="correctAnswer"
                    value={form.correctAnswer}
                    onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
                    placeholder="Jawaban benar"
                  />
                </div>
              )}

              {form.questionType === "slider" && (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="sliderMin">Min</Label>
                    <Input id="sliderMin" type="number" value={form.sliderMin} onChange={(event) => setForm((current) => ({ ...current, sliderMin: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sliderMax">Max</Label>
                    <Input id="sliderMax" type="number" value={form.sliderMax} onChange={(event) => setForm((current) => ({ ...current, sliderMax: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswerSlider">Jawaban</Label>
                    <Input id="correctAnswerSlider" type="number" value={form.correctAnswer} onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answerMargin">Margin</Label>
                    <Input id="answerMargin" type="number" value={form.answerMargin} onChange={(event) => setForm((current) => ({ ...current, answerMargin: event.target.value }))} />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="points">Poin</Label>
                  <Input id="points" type="number" value={form.points} onChange={(event) => setForm((current) => ({ ...current, points: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Waktu (detik)</Label>
                  <Input id="timeLimit" type="number" value={form.timeLimit} onChange={(event) => setForm((current) => ({ ...current, timeLimit: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Urutan</Label>
                  <Input id="order" type="number" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Soal"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-2 bg-white/90 p-6 shadow-lg dark:bg-zinc-900/90">
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold">Daftar Soal</h2>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari soal..." className="pl-10" />
                </div>

                <select
                  value={topicFilter}
                  onChange={(event) => setTopicFilter(event.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="all">Semua topik</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {filteredQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                    Belum ada soal yang cocok dengan filter ini.
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedQuestions.map((question) => (
                        <div key={question.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {question.topicName ?? `Topik ${question.topicId}`} • Order {question.order}
                              </p>
                              <p className="mt-1 text-base font-medium text-zinc-900 dark:text-white">
                                {question.questionText}
                              </p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {question.questionType}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-3">
                            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>{question.timeLimit}s</span>
                              <span>•</span>
                              <span>{question.points} pts</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                type="button"
                                variant="ghost"
                                onClick={() => handleStartEdit(question)}
                                className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg cursor-pointer"
                                title="Edit Soal"
                              >
                                <Pencil className="h-4.5 w-4.5" />
                              </Button>
                              <Button
                                size="icon"
                                type="button"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(question.id)}
                                className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                                title="Hapus Soal"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 text-sm">
                        <div className="text-zinc-500 dark:text-zinc-400">
                          Menampilkan <span className="font-semibold text-zinc-700 dark:text-zinc-200">{Math.min(filteredQuestions.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span>-
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{Math.min(filteredQuestions.length, currentPage * ITEMS_PER_PAGE)}</span> dari{" "}
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{filteredQuestions.length}</span> soal
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const isNear = Math.abs(page - currentPage) <= 1;
                            const isFirstOrLast = page === 1 || page === totalPages;
                            if (!isNear && !isFirstOrLast) {
                              if (page === 2 || page === totalPages - 1) {
                                return <span key={`ellipsis-${page}`} className="px-2 text-zinc-400">...</span>;
                              }
                              return null;
                            }
                            return (
                              <Button
                                key={page}
                                type="button"
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  "h-8 w-8 p-0",
                                  currentPage === page
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                )}
                              >
                                {page}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingId(null);
                }}
                className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-zinc-500"
                title="Tutup"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 border-b pb-3 border-zinc-100 dark:border-zinc-800">
                <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-tight">Edit Soal Duel</h3>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editTopic">Topik</Label>
                    <select
                      id="editTopic"
                      value={editForm.topicId}
                      onChange={(event) => setEditForm((current) => ({ ...current, topicId: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">Pilih topik</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editQuestionType">Tipe Soal</Label>
                    <select
                      id="editQuestionType"
                      value={editForm.questionType}
                      onChange={(event) => handleEditQuestionTypeChange(event.target.value as QuestionFormState["questionType"])}
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editQuestionText">Pertanyaan</Label>
                  <Textarea
                    id="editQuestionText"
                    value={editForm.questionText}
                    onChange={(event) => setEditForm((current) => ({ ...current, questionText: event.target.value }))}
                    rows={4}
                    placeholder="Tulis pertanyaan di sini..."
                  />
                </div>

                {editForm.questionType === "multiple_choice" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Opsi Jawaban</Label>
                      <span className="text-xs text-zinc-500">Pilih salah satu sebagai jawaban benar</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {editForm.options.map((option, index) => {
                        const isCorrect = editForm.correctAnswer !== "" && editForm.correctAnswer === option;
                        return (
                          <div key={`edit-mc-${index}`} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(event) => handleEditOptionChange(index, event.target.value)}
                              placeholder={`Opsi ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant={isCorrect ? "default" : "outline"}
                              size="icon"
                              onClick={() => {
                                if (option.trim()) {
                                  setEditForm((current) => ({ ...current, correctAnswer: option }));
                                } else {
                                  toast.error("Opsi harus diisi sebelum menjadikannya jawaban benar.");
                                }
                              }}
                              className={cn(
                                "h-11 w-11 shrink-0 transition-all duration-200",
                                isCorrect
                                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                              )}
                              title="Tandai sebagai jawaban benar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editForm.questionType === "true_false" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Opsi Jawaban</Label>
                      <span className="text-xs text-zinc-500">Pilih salah satu sebagai jawaban benar</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {["True", "False"].map((option) => {
                        const isCorrect = editForm.correctAnswer === option;
                        return (
                          <div key={`edit-tf-${option}`} className="flex items-center gap-2">
                            <div className="flex h-11 w-full items-center rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900/50">
                              {option === "True" ? "True / Benar" : "False / Salah"}
                            </div>
                            <Button
                              type="button"
                              variant={isCorrect ? "default" : "outline"}
                              size="icon"
                              onClick={() => {
                                setEditForm((current) => ({ ...current, correctAnswer: option }));
                              }}
                              className={cn(
                                "h-11 w-11 shrink-0 transition-all duration-200",
                                isCorrect
                                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                              )}
                              title="Tandai sebagai jawaban benar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="editPoints">Poin</Label>
                    <Input id="editPoints" type="number" value={editForm.points} onChange={(event) => setEditForm((current) => ({ ...current, points: event.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTimeLimit">Waktu (detik)</Label>
                    <Input id="editTimeLimit" type="number" value={editForm.timeLimit} onChange={(event) => setEditForm((current) => ({ ...current, timeLimit: event.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editOrder">Urutan</Label>
                    <Input id="editOrder" type="number" value={editForm.order} onChange={(event) => setEditForm((current) => ({ ...current, order: event.target.value }))} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Menyimpan..." : "Perbarui Soal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingId(null);
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100"
            >
              <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Hapus Soal Duel?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-755 text-white"
                >
                  Hapus
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
