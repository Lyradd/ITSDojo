'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/lib/quiz-mock-data';
import { BloomBadge } from './bloom-badge';
import { Timer, CheckCircle2 } from 'lucide-react';

interface QuizQuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onSubmit: (answer: string | number) => void;
  isSubmitted: boolean;
}

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onSubmit,
  isSubmitted,
}: QuizQuestionCardProps) {
  const [answer, setAnswer] = useState<string>('');

  // Reset answer when question changes
  useEffect(() => {
    setAnswer('');
  }, [question.id]);

  const handleSubmit = () => {
    if (!answer) return;
    onSubmit(answer);
  };

  const renderQuestionInput = () => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup value={answer} onValueChange={setAnswer} disabled={isSubmitted}>
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer font-medium text-base"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup value={answer} onValueChange={setAnswer} disabled={isSubmitted}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-center space-x-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer font-bold text-lg text-green-600">
                  Benar
                </Label>
              </div>
              <div className="flex items-center justify-center space-x-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer font-bold text-lg text-red-600">
                  Salah
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Ketik jawaban Anda di sini..."
            className="min-h-[120px] text-base"
            disabled={isSubmitted}
          />
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.sliderMin || 0}
              max={question.sliderMax || 100}
              value={answer || question.sliderMin || 0}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              disabled={isSubmitted}
            />
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{answer || question.sliderMin || 0}</div>
              <div className="text-sm text-zinc-500 mt-1">
                Range: {question.sliderMin} - {question.sliderMax}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Question type not supported</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Soal {questionNumber} dari {totalQuestions}
          </div>
          <BloomBadge level={question.bloomLevel} category={question.bloomCategory} />
        </div>

        <div className="flex items-center gap-2 text-lg font-bold">
          <Timer className={`w-5 h-5 ${timeRemaining < 10 ? 'text-red-500' : 'text-blue-600'}`} />
          <span className={timeRemaining < 10 ? 'text-red-500' : 'text-blue-600'}>
            {timeRemaining}s
          </span>
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        {question.questionText}
      </h3>

      {/* Answer Input */}
      <div className="mb-6">{renderQuestionInput()}</div>

      {/* Submit Button */}
      {!isSubmitted ? (
        <Button
          onClick={handleSubmit}
          disabled={!answer}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 rounded-xl"
        >
          Submit Jawaban
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="font-bold text-green-600">Jawaban Terkirim!</span>
        </div>
      )}
    </div>
  );
}
