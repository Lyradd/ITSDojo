"use client";

import { useState, useMemo } from "react";
import { Question, generateQuestionId } from "@/lib/evaluation-types";
import { QUESTION_PACKAGES, getPackagesByCategory, QuestionPackage } from "@/lib/question-bank";
import { Button } from "@/components/ui/button";
import {
  X,
  Search,
  Package,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Plus,
  BookOpen,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}

export function QuestionBankModal({ isOpen, onClose, onImport }: QuestionBankModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => getPackagesByCategory(), []);

  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return QUESTION_PACKAGES;
    const q = searchQuery.toLowerCase();
    return QUESTION_PACKAGES.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredGrouped = useMemo(() => {
    const result: Record<string, QuestionPackage[]> = {};
    filteredPackages.forEach((pkg) => {
      if (!result[pkg.category]) result[pkg.category] = [];
      result[pkg.category].push(pkg);
    });
    return result;
  }, [filteredPackages]);

  const selectedPackage = useMemo(
    () => QUESTION_PACKAGES.find((p) => p.id === selectedPackageId) || null,
    [selectedPackageId]
  );

  const toggleQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const selectAllInPackage = () => {
    if (!selectedPackage) return;
    const allIds = selectedPackage.questions.map((q) => q.id);
    const allSelected = allIds.every((id) => selectedQuestionIds.has(id));
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleImport = () => {
    // Collect selected questions from all packages, assign fresh IDs
    const questionsToImport: Question[] = [];
    QUESTION_PACKAGES.forEach((pkg) => {
      pkg.questions.forEach((q) => {
        if (selectedQuestionIds.has(q.id)) {
          questionsToImport.push({ ...q, id: generateQuestionId() });
        }
      });
    });
    onImport(questionsToImport);
    // Reset state
    setSelectedQuestionIds(new Set());
    setSelectedPackageId(null);
    setSearchQuery("");
    onClose();
  };

  const questionTypeLabels: Record<string, string> = {
    multiple_choice: "Pilihan Ganda",
    true_false: "Benar/Salah",
    short_answer: "Jawaban Singkat",
    essay: "Esai",
    puzzle: "Puzzle",
  };

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-3">
            {selectedPackage && (
              <button
                onClick={() => setSelectedPackageId(null)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-500" />
              </button>
            )}
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {selectedPackage ? selectedPackage.name : "Bank Soal"}
              </h2>
              <p className="text-xs text-zinc-500">
                {selectedPackage
                  ? `${selectedPackage.questionCount} soal tersedia`
                  : "Pilih paket soal siap pakai untuk evaluasi Anda"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedQuestionIds.size > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                {selectedQuestionIds.size} dipilih
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Search (only on package list view) */}
        {!selectedPackage && (
          <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari paket soal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPackage ? (
            /* === Package List View === */
            <div className="space-y-6">
              {Object.keys(filteredGrouped).length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Tidak ada paket yang cocok</p>
                  <p className="text-sm">Coba kata kunci lain</p>
                </div>
              )}
              {Object.entries(filteredGrouped).map(([category, pkgs]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pkgs.map((pkg) => {
                      const selectedCount = pkg.questions.filter((q) =>
                        selectedQuestionIds.has(q.id)
                      ).length;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all hover:shadow-md group",
                            selectedCount > 0
                              ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-700"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{pkg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                  {pkg.name}
                                </h4>
                                {selectedCount > 0 && (
                                  <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                                    {selectedCount}/{pkg.questionCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                {pkg.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                                <span>{pkg.questionCount} soal</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* === Package Detail / Question List View === */
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={selectAllInPackage}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {selectedPackage.questions.every((q) =>
                    selectedQuestionIds.has(q.id)
                  )
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </button>
                <span className="text-xs text-zinc-400">
                  {
                    selectedPackage.questions.filter((q) =>
                      selectedQuestionIds.has(q.id)
                    ).length
                  }
                  /{selectedPackage.questionCount} dipilih
                </span>
              </div>

              {selectedPackage.questions.map((q, idx) => {
                const isSelected = selectedQuestionIds.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection indicator */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-zinc-300 dark:border-zinc-600"
                        )}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-900 dark:text-white leading-snug">
                          {idx + 1}. {q.question}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {questionTypeLabels[q.type] || q.type}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 uppercase">
                            {q.bloomLevel}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-bold rounded-full capitalize",
                              difficultyColors[q.difficulty]
                            )}
                          >
                            {q.difficulty}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {q.points} pts
                          </span>
                        </div>

                        {/* Options preview for MC */}
                        {q.type === "multiple_choice" && q.options && (
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={cn(
                                  "text-[11px] px-2 py-1 rounded",
                                  opt.isCorrect
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold"
                                    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                              >
                                {opt.isCorrect && "✓ "}
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* True/False preview */}
                        {q.type === "true_false" && (
                          <p className="mt-1 text-[11px] text-green-600 dark:text-green-400 font-bold">
                            Jawaban: {q.correctAnswer ? "Benar" : "Salah"}
                          </p>
                        )}

                        {/* Short answer preview */}
                        {q.type === "short_answer" && q.expectedAnswer && (
                          <p className="mt-1 text-[11px] text-green-600 dark:text-green-400 font-bold">
                            Jawaban: {q.expectedAnswer}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedQuestionIds.size === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
          >
            <Plus className="w-4 h-4" />
            Impor {selectedQuestionIds.size} Soal
          </Button>
        </div>
      </div>
    </div>
  );
}
