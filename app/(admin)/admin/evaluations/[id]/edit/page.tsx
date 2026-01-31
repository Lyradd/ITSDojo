"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SAMPLE_EVALUATIONS } from "@/lib/evaluation-data";
import { Evaluation, Question } from "@/lib/evaluation-types";
import { EvaluationForm } from "@/components/admin/evaluation-form";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface EvaluationMetadata {
  title: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export default function EditEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  // Find the evaluation to edit
  const existingEvaluation = SAMPLE_EVALUATIONS.find((e) => e.id === evaluationId);

  const [currentStep, setCurrentStep] = useState(1);
  const [metadata, setMetadata] = useState<EvaluationMetadata>({
    title: existingEvaluation?.title || "",
    description: existingEvaluation?.description || "",
    duration: existingEvaluation?.duration || 60,
    difficulty: existingEvaluation?.difficulty || 'medium',
    tags: existingEvaluation?.tags || [],
  });

  const [questions, setQuestions] = useState<Question[]>(
    existingEvaluation?.questions || []
  );

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = {
      metadata,
      questions,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`evaluation-edit-${evaluationId}`, JSON.stringify(saveData));
  }, [metadata, questions, evaluationId]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`evaluation-edit-${evaluationId}`);
    if (saved) {
      const data = JSON.parse(saved);
      toast.success("Loaded auto-saved changes!", { duration: 2000 });
    }
  }, [evaluationId]);

  if (!existingEvaluation) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Evaluation Not Found
          </h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // In real app: PUT /api/evaluations/:id
    toast.success("Changes saved successfully!");
    console.log("Saving evaluation:", { metadata, questions });
    // Navigate back after save
    setTimeout(() => {
      router.push("/admin/evaluations");
    }, 1000);
  };

  const handleCancel = () => {
    if (confirm("Discard changes and go back?")) {
      localStorage.removeItem(`evaluation-edit-${evaluationId}`);
      router.back();
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={handleCancel} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Edit Evaluation
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Update your quiz. Changes are auto-saved locally.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Questions' },
            { num: 3, label: 'Preview' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-3 transition-all ${
                  currentStep >= step.num
                    ? 'opacity-100'
                    : 'opacity-50'
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
                    currentStep > step.num
                      ? 'bg-green-600'
                      : 'bg-zinc-200 dark:bg-zinc-700'
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
                Evaluation Details
              </h2>
              <EvaluationForm
                metadata={metadata}
                onChange={setMetadata}
                totalPoints={totalPoints}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Build Questions
              </h2>
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Preview & Save
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
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Save className="w-4 h-4" />
            <span>Auto-saved</span>
          </div>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
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
      {/* Metadata Preview */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
          {metadata.title || "Untitled Evaluation"}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {metadata.description || "No description"}
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Duration:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{metadata.duration} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Questions:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total Points:</span>
            <span className="text-zinc-600 dark:text-zinc-400">{totalPoints}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Difficulty:</span>
            <span className="text-zinc-600 dark:text-zinc-400 capitalize">{metadata.difficulty}</span>
          </div>
        </div>

        {metadata.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {metadata.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Questions Preview */}
      <div className="space-y-3">
        <h4 className="font-semibold text-zinc-900 dark:text-white">Questions:</h4>
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
                  {q.question || "No question text"}
                </p>
                <div className="mt-2 text-xs text-zinc-500 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {q.points} pts
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {q.bloomLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
