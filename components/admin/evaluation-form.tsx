"use client";

import { useEffect, useState } from "react";
import { EvaluationMetadata, DifficultyLevel } from "@/lib/evaluation-types";
import { getAllCourses } from "@/actions/courses";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EvaluationFormProps {
  metadata: EvaluationMetadata;
  onChange: (metadata: EvaluationMetadata) => void;
  totalPointsFromQuestions: number;
}

export function EvaluationForm({ metadata, onChange, totalPointsFromQuestions }: EvaluationFormProps) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    getAllCourses().then((data) => setCourses(data));
  }, []);

  const updateField = <K extends keyof EvaluationMetadata>(
    field: K,
    value: EvaluationMetadata[K]
  ) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Judul Evaluasi *
        </label>
        <Input
          type="text"
          value={metadata.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Contoh: Quiz: HTML & CSS Fundamentals"
          className="text-lg"
        />
      </div>

      {/* Course */}
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Mata Kuliah *
        </label>
        <select
          value={metadata.courseId || ''}
          onChange={(e) => updateField('courseId', e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="">— Pilih Kursus —</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">Evaluasi akan tampil di mahasiswa yang enrolled di kursus ini.</p>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Deskripsi
        </label>
        <Textarea
          value={metadata.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Jelaskan apa yang dievaluasi..."
          rows={3}
        />
      </div>

      {/* Duration and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Duration */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Durasi (menit) *
          </label>
          <Input
            type="number"
            value={metadata.duration}
            onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
            min={1}
            placeholder="60"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Tingkat Kesulitan
          </label>
          <select
            value={metadata.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value as DifficultyLevel)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </select>
        </div>

        {/* Total Points (Read-only, calculated from questions) */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Total Poin
          </label>
          <div className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold text-center">
            {totalPointsFromQuestions} pts
          </div>
          <p className="text-xs text-zinc-500 mt-1">Otomatis dari soal</p>
        </div>
      </div>
    </div>
  );
}
