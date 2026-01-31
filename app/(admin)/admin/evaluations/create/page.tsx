"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EvaluationMetadata, Question, calculateTotalPoints, calculateBloomDistribution, BloomDistribution } from "@/lib/evaluation-types";
import { EvaluationForm } from "@/components/admin/evaluation-form";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'draft_evaluation';

export default function CreateEvaluationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  const [metadata, setMetadata] = useState<EvaluationMetadata>({
    title: '',
    description: '',
    duration: 60,
    totalPoints: 0,
    difficulty: 'medium',
    tags: [],
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);

  // Auto-save to localStorage
  useEffect(() => {
    const draft = { metadata, questions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [metadata, questions]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const { metadata: savedMetadata, questions: savedQuestions } = JSON.parse(savedDraft);
        if (savedMetadata) setMetadata(savedMetadata);
        if (savedQuestions) setQuestions(savedQuestions);
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
  }, []);

  const totalPoints = calculateTotalPoints(questions);
  const bloomDistribution = calculateBloomDistribution(questions);

  const canProceedToStep2 = metadata.title.trim().length > 0 && metadata.duration > 0;
  const canProceedToStep3 = questions.length > 0;
  const canPublish = canProceedToStep2 && canProceedToStep3;

  const handlePublish = () => {
    // TODO: API call to save evaluation
    const evaluation = {
      ...metadata,
      totalPoints,
      questions,
      bloomDistribution,
      isActive: true,
      createdBy: 'current-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Publishing evaluation:', evaluation);
    
    // Clear draft
    localStorage.removeItem(STORAGE_KEY);
    
    // Redirect to manage page
    alert('Evaluation published successfully! (API not connected yet)');
    router.push('/admin/evaluations');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Create New Evaluation
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Build your quiz step by step. Changes are auto-saved locally.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { step: 1, label: 'Details' },
              { step: 2, label: 'Questions' },
              { step: 3, label: 'Preview' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (step === 1 || (step === 2 && canProceedToStep2) || (step === 3 && canProceedToStep3)) {
                      setCurrentStep(step as 1 | 2 | 3);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all",
                    currentStep === step
                      ? "bg-blue-600 text-white scale-110"
                      : currentStep > step
                      ? "bg-green-600 text-white"
                      : "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {step}
                </button>
                <div className="ml-3 text-left">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      currentStep === step
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {label}
                  </div>
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-4",
                      currentStep > step ? "bg-green-600" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 mb-6">
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Evaluation Details
              </h2>
              <EvaluationForm
                metadata={metadata}
                onChange={setMetadata}
                totalPointsFromQuestions={totalPoints}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Build Questions
              </h2>
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Preview & Publish
              </h2>
              <PreviewSection
                metadata={metadata}
                questions={questions}
                bloomDistribution={bloomDistribution}
                totalPoints={totalPoints}
              />
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => console.log('Auto-saved')}>
              <Save className="w-4 h-4 mr-2" />
              Auto-saved
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}
                disabled={currentStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={!canPublish}
                className="bg-green-600 hover:bg-green-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Publish Evaluation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PreviewSectionProps {
  metadata: EvaluationMetadata;
  questions: Question[];
  bloomDistribution: BloomDistribution;
  totalPoints: number;
}

function PreviewSection({ metadata, questions, bloomDistribution, totalPoints }: PreviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Metadata Summary */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">{metadata.title}</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">{metadata.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Questions</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Points</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{metadata.duration}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Minutes</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 capitalize">{metadata.difficulty}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Difficulty</div>
          </div>
        </div>

        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bloom Distribution */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Bloom Taxonomy Distribution</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(bloomDistribution).map(([level, count]) => (
            <div key={level} className="text-center p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Preview */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Questions ({questions.length})</h3>
        <div className="space-y-3">
          {questions.map((q: Question, index: number) => (
            <div key={q.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-white mb-2">{q.question || 'Untitled Question'}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      {q.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      {q.bloomLevel}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      {q.points} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
