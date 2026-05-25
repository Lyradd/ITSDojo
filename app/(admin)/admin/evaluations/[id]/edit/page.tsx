"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getEvaluationById, updateEvaluation } from "@/actions/evaluations";
import { EvaluationMetadata, Question, DifficultyLevel, calculateTotalPoints } from "@/lib/evaluation-types";
import { EvaluationForm } from "@/components/admin/evaluation-form";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function EditEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [metadata, setMetadata] = useState<EvaluationMetadata>({
    title: "",
    description: "",
    duration: 60,
    totalPoints: 0,
    difficulty: 'medium' as DifficultyLevel,
    tags: [],
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [originalCourseId, setOriginalCourseId] = useState<string | undefined>(undefined);

  // Fetch evaluasi dari DB saat mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getEvaluationById(evaluationId);
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setMetadata({
        title: data.title || "",
        description: data.description || "",
        duration: data.duration || 60,
        totalPoints: data.totalPoints || 0,
        difficulty: 'medium' as DifficultyLevel,
        tags: [],
      });
      setQuestions(Array.isArray(data.questions) ? (data.questions as Question[]) : []);
      setOriginalCourseId(data.courseId);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  const totalPoints = calculateTotalPoints(questions);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateEvaluation(evaluationId, {
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      totalPoints,
      questions,
      courseId: originalCourseId,
    });
    setIsSaving(false);

    if (res.success) {
      toast.success("Perubahan berhasil disimpan");
      router.push("/admin/evaluations");
    } else {
      toast.error("Gagal menyimpan perubahan");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-500">Memuat evaluasi...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Evaluasi tidak ditemukan
          </h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={handleCancel} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-2">
            Edit Evaluasi
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ubah konten kuis. Klik Simpan setelah selesai.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: 'Detail' },
            { num: 2, label: 'Soal' },
            { num: 3, label: 'Pratinjau' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-3 transition-all ${
                  currentStep >= step.num ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep === step.num
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                      : currentStep > step.num
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {step.num}
                </div>
                <span
                  className={`font-semibold ${
                    currentStep === step.num
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {index < 2 && (
                <div
                  className={`h-1 w-24 mx-4 rounded-full transition-all ${
                    currentStep > step.num ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-8 mb-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Detail Evaluasi
              </h2>
              <EvaluationForm
                metadata={metadata}
                onChange={setMetadata}
                totalPointsFromQuestions={totalPoints}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Bangun Soal
              </h2>
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Pratinjau & Simpan
              </h2>
              <PreviewSection
                metadata={metadata}
                questions={questions}
                totalPoints={totalPoints}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div />

          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Sebelumnya
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Lanjut
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  metadata,
  questions,
  totalPoints,
}: {
  metadata: EvaluationMetadata;
  questions: Question[];
  totalPoints: number;
}) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
          {metadata.title || "Tanpa Judul"}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {metadata.description || "Tidak ada deskripsi"}
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Durasi:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{metadata.duration} menit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Soal:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total Poin:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{totalPoints}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-zinc-900 dark:text-white">Daftar Soal:</h4>
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {q.question || "Tanpa teks soal"}
                </p>
                <div className="mt-2 text-xs text-zinc-500 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {q.points} poin
                  </span>
                  {q.bloomLevel && (
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {q.bloomLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
