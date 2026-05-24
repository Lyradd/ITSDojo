"use client";

import { useState, useEffect } from 'react';
import { Question, QuestionType } from '@/lib/evaluation-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string | number | boolean | string[]) => void;
  isSubmitted?: boolean;
  userAnswer?: string | number | boolean | string[];
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  isSubmitted = false,
  userAnswer,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | string[] | null>(null);
  const [puzzleItems, setPuzzleItems] = useState<{id: string, text: string}[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelectedAnswer(userAnswer);
      setShowFeedback(true);
      checkAnswer(userAnswer);
    } else {
      // Reset to initial state when moving to a new question
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
      
      if (question.type === 'puzzle' && question.puzzlePairs) {
        // Create a copy to shuffle
        const shuffled = [...question.puzzlePairs].sort(() => Math.random() - 0.5);
        setPuzzleItems(shuffled);
        setSelectedAnswer(shuffled.map(p => p.id));
      }
    }
  }, [question.id, userAnswer]); // Reset when question ID changes

  const checkAnswer = (answer: string | number | boolean | string[]) => {
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      setIsCorrect(answer === question.correctAnswer);
    } else if (question.type === 'short-answer') {
      const userAns = String(answer).toLowerCase().trim();
      const correctAns = String(question.correctAnswer).toLowerCase().trim();
      setIsCorrect(userAns === correctAns);
    } else if (question.type === 'puzzle') {
      const userSequence = Array.isArray(answer) ? answer : [];
      const correctSequence = question.puzzlePairs?.map(p => p.id) || [];
      setIsCorrect(userSequence.length === correctSequence.length && 
                  userSequence.every((val, index) => val === correctSequence[index]));
    }
  };

  const handleReorder = (newItems: {id: string, text: string}[]) => {
    if (showFeedback) return;
    setPuzzleItems(newItems);
    setSelectedAnswer(newItems.map(item => item.id));
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    checkAnswer(selectedAnswer);
    setShowFeedback(true);
    onSubmit(selectedAnswer);
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrectOption = index === question.correctAnswer;
        // Only show correct/wrong indicators AFTER feedback is shown
        const showCorrect = showFeedback && isCorrectOption;
        const showWrong = showFeedback && isSelected && !isCorrectOption;

        return (
          <button
            key={index}
            onClick={() => !showFeedback && setSelectedAnswer(index)}
            disabled={showFeedback}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
              !showFeedback && "hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
              isSelected && !showFeedback && "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
              showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
              showWrong && "border-red-500 bg-red-50 dark:bg-red-950/30",
              !isSelected && !showCorrect && "border-zinc-200 dark:border-zinc-800",
              showFeedback && "cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                  isSelected && !showFeedback && "border-blue-500 bg-blue-500 text-white",
                  showCorrect && "border-green-500 bg-green-500 text-white",
                  showWrong && "border-red-500 bg-red-500 text-white",
                  !isSelected && !showCorrect && !showWrong && "border-zinc-300"
                )}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="font-medium">{option}</span>
              </div>
              {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
              {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="grid grid-cols-2 gap-4">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrectOption = index === question.correctAnswer;
        // Only show correct/wrong indicators AFTER feedback is shown
        const showCorrect = showFeedback && isCorrectOption;
        const showWrong = showFeedback && isSelected && !isCorrectOption;

        return (
          <button
            key={index}
            onClick={() => !showFeedback && setSelectedAnswer(index)}
            disabled={showFeedback}
            className={cn(
              "p-6 rounded-xl border-2 font-bold text-lg transition-all duration-300",
              !showFeedback && "hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
              isSelected && !showFeedback && "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
              showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
              showWrong && "border-red-500 bg-red-50 dark:bg-red-950/30",
              !isSelected && !showCorrect && "border-zinc-200 dark:border-zinc-800",
              showFeedback && "cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {option}
              {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
              {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderShortAnswer = () => (
    <div className="space-y-3">
      <Label htmlFor="short-answer" className="text-sm font-medium">
        Jawaban Anda:
      </Label>
      <Input
        id="short-answer"
        type="text"
        placeholder="Ketik jawaban di sini..."
        value={selectedAnswer as string || ''}
        onChange={(e) => !showFeedback && setSelectedAnswer(e.target.value)}
        disabled={showFeedback}
        className={cn(
          "text-lg p-4",
          showFeedback && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
          showFeedback && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/30"
        )}
      />
      {showFeedback && !isCorrect && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Jawaban yang benar: <span className="font-bold text-green-600">{question.correctAnswer}</span>
        </p>
      )}
    </div>
  );

  const renderPuzzle = () => {
    const correctSequence = question.puzzlePairs?.map(p => p.id) || [];
    
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-500 mb-4 font-medium">💡 Urutkan item di bawah ini dengan menggeser (drag & drop) ke posisi yang benar.</p>
        <Reorder.Group axis="y" values={puzzleItems} onReorder={handleReorder} className="space-y-2">
          {puzzleItems.map((item, index) => {
            const isCorrectPosition = item.id === correctSequence[index];
            const showPositionFeedback = showFeedback;
            
            return (
              <Reorder.Item 
                key={item.id} 
                value={item}
                dragListener={!showFeedback}
                className={cn(
                  "p-4 rounded-xl border-2 flex items-center gap-4 transition-colors",
                  !showFeedback && "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 cursor-grab active:cursor-grabbing shadow-sm",
                  showPositionFeedback && isCorrectPosition && "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default",
                  showPositionFeedback && !isCorrectPosition && "border-red-500 bg-red-50 dark:bg-red-950/30 cursor-default"
                )}
              >
                {!showFeedback && (
                  <div className="flex flex-col gap-1 items-center justify-center w-6 text-zinc-400 hover:text-zinc-600">
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                  </div>
                )}
                
                <div className="flex-1 font-semibold text-zinc-800 dark:text-zinc-200">{item.text}</div>
                
                {showPositionFeedback && isCorrectPosition && <CheckCircle className="w-5 h-5 text-green-600" />}
                {showPositionFeedback && !isCorrectPosition && <XCircle className="w-5 h-5 text-red-600" />}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        
        {showFeedback && !isCorrect && (
          <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-900/50">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Urutan yang Benar:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {question.puzzlePairs?.map((item) => (
                <li key={`correct-${item.id}`} className="pl-2">{item.text}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={false}
      animate={showFeedback && !isCorrect ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 rounded-2xl border-2 relative">
        {/* Floating Points Animation */}
        <AnimatePresence>
          {showFeedback && isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 right-6 text-2xl font-black text-green-500 drop-shadow-md z-10 pointer-events-none"
            >
              +{question.points} Poin!
            </motion.div>
          )}
        </AnimatePresence>
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            Soal {questionNumber} dari {totalQuestions}
          </span>
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
            {question.points} poin
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          {question.question}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <HelpCircle className="w-4 h-4" />
          <span>
            {question.type === 'multiple-choice' && 'Pilihan Ganda'}
            {question.type === 'true-false' && 'Benar / Salah'}
            {question.type === 'short-answer' && 'Isian Singkat'}
            {question.type === 'puzzle' && 'Puzzle Urutan (Drag & Drop)'}
          </span>
        </div>
      </div>

      {/* Question Content */}
        {question.type === 'multiple-choice' && renderMultipleChoice()}
        {question.type === 'true-false' && renderTrueFalse()}
        {question.type === 'short-answer' && renderShortAnswer()}
        {question.type === 'puzzle' && renderPuzzle()}
      {/* Feedback */}
      {showFeedback && (
        <div className={cn(
          "p-4 rounded-xl border-2 mb-4 animate-slide-in",
          isCorrect 
            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
            : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
        )}>
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={cn(
                "font-bold mb-1",
                isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
              )}>
                {isCorrect ? '✓ Jawaban Benar!' : '✗ Jawaban Salah'}
              </p>
              {question.explanation && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {question.explanation}
                </p>
              )}
              {isCorrect && (
                <p className="text-sm font-bold mt-2 text-zinc-700 dark:text-zinc-300">
                  Poin yang didapat: {question.points}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!showFeedback && (
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-lg py-6"
        >
          Submit Jawaban
        </Button>
      )}
      </Card>
    </motion.div>
  );
}
