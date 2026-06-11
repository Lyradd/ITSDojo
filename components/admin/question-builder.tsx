"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Question, QuestionType, DifficultyLevel, generateQuestionId } from "@/lib/evaluation-types";
import { QuestionBankImporter } from "./question-bank-importer";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Trash2,
  GripVertical,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionBuilderProps {
  courseId?: string;
  importUsageType?: "lesson" | "evaluation" | "duel";
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionBuilder({ questions, onChange, courseId, importUsageType }: QuestionBuilderProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions[0]?.id || null
  );
  const [currentType, setCurrentType] = useState<QuestionType>('multiple_choice');
  const [showImporter, setShowImporter] = useState(false);

  const addQuestion = (type: QuestionType) => {
    setCurrentType(type);
    const newQuestion: Question = {
      id: generateQuestionId(),
      type,
      question: "",
      points: 10,
      timeLimit: 30,
      difficulty: 'medium',
      ...(type === 'multiple_choice' && {
        options: [
          { id: 'opt1', text: '', isCorrect: false },
          { id: 'opt2', text: '', isCorrect: false },
          { id: 'opt3', text: '', isCorrect: false },
          { id: 'opt4', text: '', isCorrect: false },
        ]
      }),
      ...(type === 'true_false' && { correctAnswer: true }),
      ...(type === 'short_answer' && { expectedAnswer: '' }),
      ...(type === 'essay' && { wordLimit: 500, expectedAnswer: '' }),
      ...(type === 'puzzle' && {
        puzzlePairs: [
          { id: 'pair1', text: '' },
          { id: 'pair2', text: '' },
          { id: 'pair3', text: '' },
          { id: 'pair4', text: '' },
        ]
      }),
    };

    onChange([...questions, newQuestion]);
    setExpandedQuestionId(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
    if (expandedQuestionId === id) {
      setExpandedQuestionId(questions[0]?.id || null);
    }
  };

  const duplicateQuestion = (question: Question) => {
    const duplicated = {
      ...question,
      id: generateQuestionId(),
      question: `${question.question} (Copy)`,
    };
    onChange([...questions, duplicated]);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
    onChange(newQuestions);
  };

  const handleImport = (importedItems: any[]) => {
    if (!importedItems || importedItems.length === 0) return;
    
    const newQuestions = importedItems.map(item => {
      const qType = item.questionType as QuestionType;
      const parsedOptions = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
      const parsedPuzzlePairs = typeof item.puzzlePairs === 'string' ? JSON.parse(item.puzzlePairs) : item.puzzlePairs;
      
      return {
        id: generateQuestionId(), // Generate fresh IDs to avoid react key collisions
        type: qType,
        question: item.questionText,
        points: item.points || 10,
        difficulty: (item.difficulty || 'medium') as DifficultyLevel,
        timeLimit: item.timeLimit || 30,
        
        // Conditional mapping based on type
        ...(qType === 'multiple_choice' && {
          options: Array.isArray(parsedOptions) && parsedOptions.length > 0 
            ? parsedOptions 
            : [
              { id: 'opt1', text: '', isCorrect: false },
              { id: 'opt2', text: '', isCorrect: false }
            ]
        }),
        
        ...(qType === 'true_false' && {
          correctAnswer: item.correctAnswer === 'true' || item.correctAnswer === true
        }),
        
        ...(qType === 'short_answer' && {
          expectedAnswer: item.correctAnswer || ''
        }),
        
        ...(qType === 'puzzle' && {
          puzzlePairs: Array.isArray(parsedPuzzlePairs) && parsedPuzzlePairs.length > 0
            ? parsedPuzzlePairs
            : [
              { id: 'pair1', text: '' },
              { id: 'pair2', text: '' }
            ]
        }),
        
        ...(qType === 'essay' && {
          wordLimit: 500,
          expectedAnswer: ''
        }),
      } as Question;
    });

    onChange([...questions, ...newQuestions]);
    setShowImporter(false);
  };

  return (
    <div className="space-y-6 relative">
      {showImporter && courseId && (
        <QuestionBankImporter
          courseId={courseId}
          usageType={importUsageType}
          onSelectItems={handleImport}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Add Question Buttons */}
      <div className="flex flex-wrap gap-3">
        {courseId && (
          <Button
            type="button"
            onClick={() => setShowImporter(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold border-2 border-purple-600"
          >
            <Database className="w-4 h-4 mr-2" />
            Impor Bank Soal
          </Button>
        )}
        
        <div className="w-[1px] h-10 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

        <Button
          type="button"
          onClick={() => addQuestion('multiple_choice')}
          variant="ghost"
          className={cn(
            "border-2",
            currentType === 'multiple_choice'
              ? "bg-blue-600 hover:bg-blue-700 text-white! border-blue-600"
              : "bg-white dark:bg-zinc-800 text-zinc-900! dark:text-white! border-zinc-300 dark:border-zinc-600 hover:border-blue-500"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          Multiple Choice
        </Button>
        <Button
          type="button"
          onClick={() => addQuestion('true_false')}
          variant="ghost"
          className={cn(
            "border-2",
            currentType === 'true_false'
              ? "bg-blue-600 hover:bg-blue-700 text-white! border-blue-600"
              : "bg-white dark:bg-zinc-800 text-zinc-900! dark:text-white! border-zinc-300 dark:border-zinc-600 hover:border-blue-500"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          True/False
        </Button>
        <Button
          type="button"
          onClick={() => addQuestion('short_answer')}
          variant="ghost"
          className={cn(
            "border-2",
            currentType === 'short_answer'
              ? "bg-blue-600 hover:bg-blue-700 text-white! border-blue-600"
              : "bg-white dark:bg-zinc-800 text-zinc-900! dark:text-white! border-zinc-300 dark:border-zinc-600 hover:border-blue-500"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          Short Answer
        </Button>
        <Button
          type="button"
          onClick={() => addQuestion('puzzle')}
          variant="ghost"
          className={cn(
            "border-2",
            currentType === 'puzzle'
              ? "bg-blue-600 hover:bg-blue-700 text-white! border-blue-600"
              : "bg-white dark:bg-zinc-800 text-zinc-900! dark:text-white! border-zinc-300 dark:border-zinc-600 hover:border-blue-500"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          🧩 Puzzle
        </Button>
      </div>

      {/* Questions List */}
      <Reorder.Group axis="y" values={questions} onReorder={onChange} className="space-y-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            totalQuestions={questions.length}
            isExpanded={expandedQuestionId === question.id}
            onToggleExpand={() =>
              setExpandedQuestionId(
                expandedQuestionId === question.id ? null : question.id
              )
            }
            onUpdate={(updates) => updateQuestion(question.id, updates)}
            onDelete={() => deleteQuestion(question.id)}
            onDuplicate={() => duplicateQuestion(question)}
          />
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              No questions yet. Click a button above to add your first question!
            </p>
          </div>
        )}
      </Reorder.Group>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function QuestionCard({
  question,
  index,
  totalQuestions,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDuplicate,
}: QuestionCardProps) {
  const dragControls = useDragControls();

  const questionTypeLabels = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    short_answer: 'Short Answer',
    essay: 'Essay',
    puzzle: '🧩 Puzzle',
  } as const;

  const hasCorrectAnswer = question.type === 'multiple_choice'
    ? (question.options?.some(opt => opt.isCorrect) ?? false)
    : question.type === 'true_false'
    ? question.correctAnswer !== undefined
    : question.type === 'puzzle'
    ? (question.puzzlePairs?.every(pair => pair.text.trim()) ?? false)
    : true; // essay and short answer don't need validation

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={dragControls}
      className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
    >
      {/* Header - Always Visible */}
      <div
        className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        {/* Drag Handle */}
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Drag untuk mengatur urutan"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Clickable area to toggle expand */}
        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={onToggleExpand}>
        {/* Question Number */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
          {index + 1}
        </div>

        {/* Question Preview */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {question.question || `Untitled ${questionTypeLabels[question.type]}`}
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>{questionTypeLabels[question.type]}</span>
            <span>•</span>
            <span>{question.points} pts</span>
            <span>•</span>
            
          </div>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 pt-0 space-y-6 border-t border-zinc-200 dark:border-zinc-700">
          {/* Question Text */}
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              Question Text *
            </label>
            <textarea
              value={question.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter your question here..."
            />
          </div>

          {/* Question Image */}
          <ImageUpload
            label="Question Image (Optional)"
            value={question.media?.url}
            onChange={(url) => 
              onUpdate({ 
                media: url ? { type: 'image', url, alt: 'Question image' } : undefined 
              })
            }
          />

          {/* Question Type Specific Fields */}
          {question.type === 'multiple_choice' && (
            <MultipleChoiceOptions
              options={question.options || []}
              onChange={(options: { id: string; text: string; isCorrect: boolean }[]) => onUpdate({ options })}
            />
          )}

          {question.type === 'true_false' && (
            <TrueFalseOptions
              correctAnswer={question.correctAnswer ?? true}
              onChange={(correctAnswer: boolean) => onUpdate({ correctAnswer })}
            />
          )}

          {question.type === 'puzzle' && (
            <PuzzleOptions
              pairs={question.puzzlePairs || []}
              onChange={(puzzlePairs) => onUpdate({ puzzlePairs })}
            />
          )}

          {(question.type === 'short_answer' || question.type === 'essay') && (
            <ShortAnswerField
              question={question}
              onUpdate={onUpdate}
            />
          )}

          {/* Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Points */}
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Points: <span className="text-blue-600 font-bold">{question.points}</span>
              </label>
              <input
                type="range"
                value={question.points}
                onChange={(e) => onUpdate({ points: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min={1}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Difficulty
              </label>
              <select
                value={question.difficulty}
                onChange={(e) => onUpdate({ difficulty: e.target.value as DifficultyLevel })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Time Limit */}
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Time Limit (sec) *
              </label>
              <input
                type="number"
                value={question.timeLimit || 30}
                onChange={(e) => onUpdate({ timeLimit: parseInt(e.target.value) || 30 })}
                placeholder="30"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                min={10}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDuplicate}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

// Helper components for different question types
function MultipleChoiceOptions({ options, onChange }: any) {
  const updateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };

  const addOption = () => {
    onChange([...options, { id: `opt${options.length + 1}`, text: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      onChange(options.filter((_: any, i: number) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Options * (Select the correct answer)
      </label>
      {options.map((option: any, index: number) => (
        <div key={option.id} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const newOptions = options.map((opt: any, i: number) => ({
                ...opt,
                isCorrect: i === index,
              }));
              onChange(newOptions);
            }}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              option.isCorrect
                ? "bg-green-600 border-green-600"
                : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
            )}
          >
            {option.isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>
          <input
            type="text"
            value={option.text}
            onChange={(e) => updateOption(index, { text: e.target.value })}
            placeholder={`Option ${index + 1}`}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
          />
          {options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="w-4 h-4 mr-2" />
          Add Option
        </Button>
      )}
    </div>
  );
}

function TrueFalseOptions({ correctAnswer, onChange }: any) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Correct Answer *
      </label>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 px-6 py-3 rounded-lg border-2 font-semibold transition-all",
            correctAnswer
              ? "bg-green-600 border-green-600 text-white"
              : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
          )}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 px-6 py-3 rounded-lg border-2 font-semibold transition-all",
            !correctAnswer
              ? "bg-green-600 border-green-600 text-white"
              : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
          )}
        >
          False
        </button>
      </div>
    </div>
  );
}




// Puzzle Options Component - For ordering/sequencing questions
interface PuzzleOptionsProps {
  pairs: { id: string; text: string }[];
  onChange: (pairs: { id: string; text: string }[]) => void;
}

function PuzzleOptions({ pairs, onChange }: PuzzleOptionsProps) {
  const addItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      text: '',
    };
    onChange([...pairs, newItem]);
  };

  const updateItem = (id: string, value: string) => {
    onChange(
      pairs.map(item =>
        item.id === id ? { ...item, text: value } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    onChange(pairs.filter(item => item.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newPairs = [...pairs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pairs.length) return;
    
    [newPairs[index], newPairs[targetIndex]] = [newPairs[targetIndex], newPairs[index]];
    onChange(newPairs);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          🧩 Items to Order * (Students drag to arrange in correct sequence)
        </label>
        <Button
          type="button"
          onClick={addItem}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        {pairs.map((item, index) => (
          <div key={item.id} className="flex items-start gap-2">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                onClick={() => moveItem(index, 'up')}
                variant="ghost"
                size="sm"
                disabled={index === 0}
                className="p-1 h-5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-bold">
                {index + 1}
              </div>
              <Button
                type="button"
                onClick={() => moveItem(index, 'down')}
                variant="ghost"
                size="sm"
                disabled={index === pairs.length - 1}
                className="p-1 h-5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder={`Step ${index + 1} (e.g., "First, prepare the ingredients")`}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <Button
              type="button"
              onClick={() => deleteItem(item.id)}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400 mt-1">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {pairs.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
          No items yet. Click "Add Item" to create sequence items.
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        <span>💡</span>
        <span>The order you create is the CORRECT order. Students will drag to arrange randomly shuffled items.</span>
      </p>
    </div>
  );
}

// ShortAnswerField — input untuk dosen memasukkan jawaban benar (untuk validasi otomatis di mahasiswa)
function ShortAnswerField({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Jawaban Benar *
        </label>
        <input
          type="text"
          value={question.expectedAnswer ?? ''}
          onChange={(e) => onUpdate({ expectedAnswer: e.target.value })}
          placeholder="Contoh: useState"
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Tidak case-sensitive. Spasi di awal/akhir akan diabaikan saat dicocokkan.
        </p>
      </div>

      {question.type === 'short_answer' && (
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Batas Karakter (opsional)
          </label>
          <input
            type="number"
            value={question.wordLimit ?? ''}
            onChange={(e) => onUpdate({ wordLimit: parseInt(e.target.value) || undefined })}
            placeholder="Kosongkan jika tidak dibatasi"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            min={1}
          />
        </div>
      )}
    </div>
  );
}
