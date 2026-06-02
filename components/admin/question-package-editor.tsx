"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Database } from "lucide-react";
import toast from "react-hot-toast";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { Question, QuestionType, generateQuestionId } from "@/lib/evaluation-types";
import { syncQuestionBankItems } from "@/actions/question-bank";

interface QuestionPackageEditorProps {
  pkg: any;
  initialItems: any[];
}

export default function QuestionPackageEditor({ pkg, initialItems }: QuestionPackageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Transform initialItems into Question[]
  const initialQuestions: Question[] = initialItems.map(item => ({
    id: `q_${item.id}`,
    type: item.questionType as QuestionType,
    question: item.questionText,
    points: item.points,
    bloomLevel: item.bloomLevel || 'C1',
    difficulty: item.difficulty || 'medium',
    timeLimit: item.timeLimit,
    options: item.questionType === 'multiple_choice' ? item.options : undefined,
    correctAnswer: item.questionType === 'true_false' ? item.correctAnswer === 'true' : undefined,
    puzzlePairs: item.questionType === 'puzzle' ? item.options?.pairs : undefined,
    expectedAnswer: item.questionType === 'short_answer' ? item.correctAnswer : undefined,
    
    // For coding items, we might store starterCode and testCases in options
    ...(item.questionType === 'coding' && {
      options: [
        { id: 'desc', text: item.options?.description || '' },
        { id: 'code', text: item.options?.starterCode || '' },
      ]
    })
  }));

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Transform Question[] back to insert data
      const itemsToSync = questions.map((q, idx) => {
        let options = null;
        let correctAnswer = null;
        
        if (q.type === 'multiple_choice') {
          options = q.options;
        } else if (q.type === 'true_false') {
          correctAnswer = q.correctAnswer ? 'true' : 'false';
        } else if (q.type === 'puzzle') {
          options = { pairs: q.puzzlePairs };
        } else if (q.type === 'short_answer') {
          correctAnswer = q.expectedAnswer;
        } else if ((q.type as string) === 'coding') {
          // If edited as coding via a custom path or essay fallback
          options = {
            description: q.options?.[0]?.text || '',
            starterCode: q.options?.[1]?.text || '',
            testCases: []
          };
        }

        return {
          questionText: q.question,
          questionType: q.type,
          options,
          correctAnswer,
          bloomLevel: q.bloomLevel,
          difficulty: q.difficulty,
          points: q.points,
          timeLimit: q.timeLimit,
          order: idx + 1,
        };
      });

      // 2. Langsung Panggil Server Action (tanpa HTTP Round Trip API Route)
      const res = await syncQuestionBankItems(pkg.id, itemsToSync as any);
      
      if (!res.success) {
        throw new Error(res.error || "Failed to save items");
      }
      
      toast.success("Isi paket berhasil disimpan!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan paket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            Paket Soal {pkg.usageType}
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{pkg.name}</h1>
        </div>
      </div>

      {/* Package Info Card */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-zinc-500">Deskripsi Paket</label>
            <p className="text-zinc-800 dark:text-zinc-200 mt-1">{pkg.description || 'Tidak ada deskripsi.'}</p>
          </div>
        </div>
      </Card>

      {/* Question Builder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Daftar Pertanyaan ({questions.length})</h2>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
        
        <QuestionBuilder questions={questions} onChange={setQuestions} />
      </div>
    </div>
  );
}
