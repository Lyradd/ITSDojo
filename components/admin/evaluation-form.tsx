"use client";

import { EvaluationMetadata, DifficultyLevel } from "@/lib/evaluation-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EvaluationFormProps {
  metadata: EvaluationMetadata;
  onChange: (metadata: EvaluationMetadata) => void;
  totalPointsFromQuestions: number;
}

export function EvaluationForm({ metadata, onChange, totalPointsFromQuestions }: EvaluationFormProps) {
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
          Evaluation Title *
        </label>
        <Input
          type="text"
          value={metadata.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="e.g., Quiz: HTML & CSS Fundamentals"
          className="text-lg"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Description
        </label>
        <Textarea
          value={metadata.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe what this evaluation covers..."
          rows={3}
        />
      </div>

      {/* Duration and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Duration */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Duration (minutes) *
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
            Difficulty Level
          </label>
          <select
            value={metadata.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value as DifficultyLevel)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Total Points (Read-only, calculated from questions) */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
            Total Points
          </label>
          <div className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold text-center">
            {totalPointsFromQuestions} pts
          </div>
          <p className="text-xs text-zinc-500 mt-1">Auto-calculated from questions</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
          Tags (comma-separated)
        </label>
        <Input
          type="text"
          value={metadata.tags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0);
            updateField('tags', tags);
          }}
          placeholder="e.g., HTML, CSS, Web Development"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {metadata.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
