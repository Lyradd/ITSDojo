"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Loader2, Save, FileText, Video, Code, ChevronUp, ChevronDown, Paperclip, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import VideoUrlInput from '@/components/admin/video-url-input';
import MaterialUpload from '@/components/admin/material-upload';
import { QuestionBankImporter } from '@/components/admin/question-bank-importer';
import { useParams } from 'next/navigation';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor'), { ssr: false });

export const MaterialFileSchema = z.object({
  url: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
});

export const TestCaseSchema = z.object({
  stdin: z.string(),
  expected: z.string().min(1, "Expected output tidak boleh kosong"),
  hidden: z.boolean(),
});

export const LessonSchema = z.object({
  title: z.string().min(3, "Judul materi minimal 3 karakter"),
  order: z.number().min(1, "Urutan harus minimal 1"),
  description: z.string().optional(),
  duration: z.string().min(1, "Durasi harus diisi"),
  xpReward: z.number().min(0, "XP tidak boleh negatif"),
  gemReward: z.number().min(0, "Gem tidak boleh negatif"),
  videoUrl: z.string().optional(),
  summaryContent: z.string().optional(),
  materialFiles: z.array(MaterialFileSchema),
  problemTitle: z.string().optional(),
  problemDescription: z.string().optional(),
  problemCategory: z.string().optional(),
  starterCode: z.string().optional(),
  defaultLanguage: z.string(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  testCases: z.array(TestCaseSchema),
});

export type LessonForm = z.infer<typeof LessonSchema>;
export type TestCaseForm = z.infer<typeof TestCaseSchema>;
export type MaterialFile = z.infer<typeof MaterialFileSchema>;

export const EMPTY_LESSON: LessonForm = {
  title: '', order: 1, description: '', duration: '',
  xpReward: 50, gemReward: 10, videoUrl: '', summaryContent: '',
  materialFiles: [],
  problemTitle: '', problemDescription: '', problemCategory: '',
  starterCode: '', defaultLanguage: 'c', sampleInput: '', sampleOutput: '',
  testCases: [{ stdin: '', expected: '', hidden: false }],
};

interface LessonEditorProps {
  unitId: number;
  initialData: LessonForm;
  saving: boolean;
  onSubmit: (data: LessonForm, unitId: number) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function LessonEditor({
  unitId,
  initialData,
  saving,
  onSubmit,
  onCancel,
  isEditing
}: LessonEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string>('basic');
  const [showImporter, setShowImporter] = useState(false);
  const params = useParams();
  const courseId = params?.courseId as string;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LessonForm>({
    resolver: zodResolver(LessonSchema),
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "testCases",
  });

  const CODE_TEMPLATES: Record<string, string> = {
    c: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    return 0;\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}',
    javascript: '// Write your JavaScript (Node.js) code here\n',
    python: 'def main():\n    # Write your Python code here\n    pass\n\nif __name__ == "__main__":\n    main()'
  };

  const defaultLanguageReg = register("defaultLanguage");

  useEffect(() => {
    const currentCode = getValues("starterCode")?.trim() || "";
    if (!isEditing && !currentCode) {
      const lang = getValues("defaultLanguage");
      if (CODE_TEMPLATES[lang]) {
        setValue("starterCode", CODE_TEMPLATES[lang]);
      }
    }
  }, [isEditing, getValues, setValue]);

  const SectionToggle = ({ id, label, icon: Icon, hasError }: { id: string, label: string, icon: any, hasError?: boolean }) => (
    <button
      type="button"
      onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
      className={`flex items-center justify-between w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
        hasError 
        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800' 
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
        {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
      </span>
      {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  const hasBasicError = !!(errors.title || errors.order || errors.duration || errors.xpReward || errors.gemReward);
  const hasCodingError = !!(errors.testCases);

  const handleImportQuestion = (items: any[]) => {
    if (items.length === 0) return;
    const item = items[0]; // For lesson, we only take the first one
    
    setValue('problemTitle', item.questionText, { shouldValidate: true, shouldDirty: true });
    
    if (item.questionType === 'coding') {
      setValue('problemDescription', item.options?.description || '', { shouldValidate: true, shouldDirty: true });
      setValue('starterCode', item.options?.starterCode || '', { shouldValidate: true, shouldDirty: true });
      if (item.options?.testCases) {
        setValue('testCases', item.options.testCases, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      // If importing multiple choice into coding
      const desc = `Soal: ${item.questionText}\n\nOpsi:\n` + 
        (item.options || []).map((o: any, i: number) => `${i+1}. ${o.text}`).join('\n');
      setValue('problemDescription', desc, { shouldValidate: true, shouldDirty: true });
    }
    
    setShowImporter(false);
  };

  return (
    <Card className="p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 my-4 relative">
      {showImporter && courseId && (
        <QuestionBankImporter
          courseId={courseId}
          usageType="lesson"
          singleSelection={true}
          onSelectItems={handleImportQuestion}
          onClose={() => setShowImporter(false)}
        />
      )}
      <h4 className="text-lg font-bold mb-4">
        {isEditing ? '✏️ Edit Materi' : '➕ Tambah Materi Baru'}
      </h4>
      <form onSubmit={handleSubmit((data) => onSubmit(data as LessonForm, unitId))} className="space-y-4">
        {/* Section: Basic Info */}
        <SectionToggle id="basic" label="Informasi Dasar" icon={FileText} hasError={hasBasicError} />
        <AnimatePresence initial={false}>
          {expandedSection === 'basic' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-4 pl-2 border-l-4 border-blue-200 dark:border-blue-800 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Materi *</Label>
                  <Input {...register("title")} className={`h-11 ${errors.title ? 'border-red-500' : ''}`} placeholder="Playing With Characters" />
                  {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Singkat</Label>
                  <Input {...register("description")} className="h-11" placeholder="Tag & Element Dasar" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Durasi (menit) *</Label>
                  <div className="relative">
                    <Input
                      {...register("duration")}
                      className={`h-11 ${errors.duration ? 'border-red-500' : ''}`}
                      placeholder="15"
                      type="number"
                      min="1"
                    />
                  </div>
                  {errors.duration && <span className="text-xs text-red-500">{errors.duration.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input type="number" {...register("order", { valueAsNumber: true })} className={`h-11 ${errors.order ? 'border-red-500' : ''}`} min="1" />
                  {errors.order && <span className="text-xs text-red-500">{errors.order.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Input type="number" {...register("xpReward", { valueAsNumber: true })} className={`h-11 ${errors.xpReward ? 'border-red-500' : ''}`} min="0" />
                  {errors.xpReward && <span className="text-xs text-red-500">{errors.xpReward.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Gem Reward</Label>
                  <Input type="number" {...register("gemReward", { valueAsNumber: true })} className={`h-11 ${errors.gemReward ? 'border-red-500' : ''}`} min="0" />
                  {errors.gemReward && <span className="text-xs text-red-500">{errors.gemReward.message}</span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Video & Rangkuman */}
        <SectionToggle id="content" label="Video & Rangkuman" icon={Video} />
        <AnimatePresence initial={false}>
          {expandedSection === 'content' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-6 pl-2 border-l-4 border-green-200 dark:border-green-800 pt-2"
            >
              <Controller
                name="videoUrl"
                control={control}
                render={({ field }) => (
                  <VideoUrlInput value={field.value || ''} onChange={field.onChange} />
                )}
              />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Rangkuman Materi
                </Label>
                <Controller
                  name="summaryContent"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Tulis rangkuman materi di sini..."
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Lampiran Materi (PDF/DOCX)
                </Label>
                <Controller
                  name="materialFiles"
                  control={control}
                  render={({ field }) => (
                    <MaterialUpload
                      materials={field.value || []}
                      onMaterialsChange={field.onChange}
                    />
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Coding Problem */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SectionToggle id="coding" label="Soal Coding (Practice)" icon={Code} hasError={hasCodingError} />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowImporter(true)}
            className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 transition-colors"
          >
            <Database className="w-4 h-4 mr-2" />
            Bank Soal
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {expandedSection === 'coding' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-4 pl-2 border-l-4 border-purple-200 dark:border-purple-800 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Soal</Label>
                  <Input {...register("problemTitle")} className="h-11" placeholder="Playing With Characters" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Input {...register("problemCategory")} className="h-11" placeholder="Materi Dasar" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Soal</Label>
                <Textarea {...register("problemDescription")} rows={4} placeholder="This challenge will help you..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bahasa Default</Label>
                  <select 
                    {...defaultLanguageReg} 
                    onChange={(e) => {
                      defaultLanguageReg.onChange(e);
                      const newLang = e.target.value;
                      const currentCode = getValues("starterCode")?.trim() || "";
                      const isKnownTemplate = !currentCode || Object.values(CODE_TEMPLATES).map(t => t.trim()).includes(currentCode);
                      
                      if (isKnownTemplate && CODE_TEMPLATES[newLang]) {
                        setValue("starterCode", CODE_TEMPLATES[newLang], { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  >
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Starter Code</Label>
                <Textarea {...register("starterCode")} rows={8} className="font-mono text-sm" placeholder="// Tulis starter code di sini..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sample Input</Label>
                  <Textarea {...register("sampleInput")} rows={3} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Sample Output</Label>
                  <Textarea {...register("sampleOutput")} rows={3} className="font-mono text-sm" />
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Test Cases</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => append({ stdin: '', expected: '', hidden: false })}>
                    <Plus className="w-3 h-3 mr-1" /> Tambah
                  </Button>
                </div>
                {errors.testCases?.root && <span className="text-xs text-red-500">{errors.testCases.root.message}</span>}
                {fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-start p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-xs">Input (stdin)</Label>
                      <Textarea {...register(`testCases.${idx}.stdin` as const)} rows={2} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Expected Output *</Label>
                      <Textarea {...register(`testCases.${idx}.expected` as const)} rows={2} className={`font-mono text-xs ${errors.testCases?.[idx]?.expected ? 'border-red-500' : ''}`} />
                      {errors.testCases?.[idx]?.expected && <span className="text-xs text-red-500">{errors.testCases[idx]?.expected?.message}</span>}
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-5">
                      <Label className="text-xs">Hidden</Label>
                      <input type="checkbox" {...register(`testCases.${idx}.hidden` as const)} className="w-4 h-4 accent-blue-600" />
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="mt-5" onClick={() => remove(idx)} disabled={fields.length <= 1}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? 'Perbarui Materi' : 'Simpan Materi'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
          {(Object.keys(errors).length > 0) && (
            <div className="text-sm text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Mohon periksa kembali: {errors.title ? "Judul materi belum diisi/sesuai. " : ""}{errors.duration ? "Durasi belum diisi. " : ""}{!errors.title && !errors.duration ? "Ada isian form yang belum sesuai." : ""}
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}
