'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/lib/quiz-mock-data';
import { BloomBadge } from './bloom-badge';
import { Timer, CheckCircle2, XCircle } from 'lucide-react';

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
              {question.options?.map((option, index) => {
                const isSelected = answer === option;
                const isCorrectOption = String(option).toLowerCase() === String(question.correctAnswer).toLowerCase();
                
                let optionStyle = "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800";
                if (isSubmitted) {
                  if (isCorrectOption) {
                    optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300";
                  } else if (isSelected) {
                    optionStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300";
                  } else {
                    optionStyle = "border-zinc-200 dark:border-zinc-800 opacity-60";
                  }
                }

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 transition-all duration-200 ${optionStyle}`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer font-medium text-base"
                    >
                      {option}
                      {isSubmitted && isCorrectOption && (
                        <span className="ml-2 inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          (Jawaban Benar)
                        </span>
                      )}
                      {isSubmitted && isSelected && !isCorrectOption && (
                        <span className="ml-2 inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                          (Jawaban Kamu)
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup value={answer} onValueChange={setAnswer} disabled={isSubmitted}>
            <div className="grid grid-cols-2 gap-4">
              {['True', 'False'].map((val) => {
                const labelText = val === 'True' ? 'Benar' : 'Salah';
                const isSelected = answer === val;
                const isCorrectOption = String(val).toLowerCase() === String(question.correctAnswer).toLowerCase();
                
                let optionStyle = "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800";
                if (isSubmitted) {
                  if (isCorrectOption) {
                    optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
                  } else if (isSelected) {
                    optionStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20";
                  } else {
                    optionStyle = "border-zinc-200 dark:border-zinc-800 opacity-60";
                  }
                }

                return (
                  <div
                    key={val}
                    className={`flex items-center justify-center space-x-3 rounded-lg border-2 p-6 transition-all duration-200 ${optionStyle}`}
                  >
                    <RadioGroupItem value={val} id={val.toLowerCase()} />
                    <Label
                      htmlFor={val.toLowerCase()}
                      className={`cursor-pointer font-bold text-lg flex flex-col items-center ${
                        isSubmitted
                          ? isCorrectOption
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isSelected
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-zinc-400'
                          : val === 'True'
                            ? 'text-green-600'
                            : 'text-red-600'
                      }`}
                    >
                      <span>{labelText}</span>
                      {isSubmitted && isCorrectOption && (
                        <span className="text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                          (Jawaban Benar)
                        </span>
                      )}
                      {isSubmitted && isSelected && !isCorrectOption && (
                        <span className="text-xs font-bold mt-1 text-rose-600 dark:text-rose-400">
                          (Jawaban Kamu)
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        );

      case 'short_answer':
        const isCorrectText = answer !== '' && String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
        return (
          <div className="space-y-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Ketik jawaban Anda di sini..."
              className={`min-h-[120px] text-base border-2 transition-all duration-200 ${
                isSubmitted
                  ? isCorrectText
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                    : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
              disabled={isSubmitted}
            />
            {isSubmitted && !isCorrectText && (
              <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-2">
                Jawaban yang benar: <span className="underline">{String(question.correctAnswer)}</span>
              </div>
            )}
          </div>
        );

      case 'slider':
        const isCorrectSlider = answer !== '' && Number(answer) === Number(question.correctAnswer);
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
              <div className={`text-4xl font-bold transition-all duration-200 ${
                isSubmitted
                  ? isCorrectSlider
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                  : 'text-blue-600'
              }`}>{answer || question.sliderMin || 0}</div>
              {isSubmitted && !isCorrectSlider && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-2">
                  Jawaban yang benar: <span className="underline">{String(question.correctAnswer)}</span>
                </div>
              )}
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
          <Timer className={`w-5 h-5 transition-transform duration-200 ${timeRemaining < 10 ? 'text-red-500 animate-alarm-shake' : 'text-blue-600'}`} />
          <span className={`transition-all duration-200 ${timeRemaining < 10 ? 'text-red-500 animate-alarm-pulse' : 'text-blue-600'}`}>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Submit Jawaban
        </Button>
      ) : (
        (() => {
          let isCorrect = false;
          if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
            isCorrect = answer !== '' && String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
          } else if (question.questionType === 'short_answer') {
            isCorrect = answer !== '' && String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
          } else if (question.questionType === 'slider') {
            isCorrect = answer !== '' && Number(answer) === Number(question.correctAnswer);
          }

          return (
            <div className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all duration-200 animate-fade-in ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400'
            }`}>
              {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-bold">
                {isCorrect ? `Jawaban Benar! (+${question.bloomWeight} Poin)` : 'Jawaban Salah!'}
              </span>
            </div>
          );
        })()
      )}
    </div>
  );
}
