"use client";

import { BloomLevel, BLOOM_TAXONOMIES } from "@/lib/evaluation-types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BloomSelectorProps {
  value: BloomLevel;
  onChange: (level: BloomLevel) => void;
  className?: string;
}

const colorClasses: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  green: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  orange: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  red: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

export function BloomSelector({ value, onChange, className }: BloomSelectorProps) {
  // Default to 'C1' if value is not a valid BloomLevel
  const safeValue = value && BLOOM_TAXONOMIES[value] ? value : 'C1';
  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Bloom Taxonomy Level
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(Object.keys(BLOOM_TAXONOMIES) as BloomLevel[]).map((level) => {
          const taxonomy = BLOOM_TAXONOMIES[level];
          const isSelected = value === level;
          
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:scale-105 active:scale-95",
                colorClasses[taxonomy.color],
                isSelected && "ring-2 ring-offset-2 ring-blue-500 scale-105"
              )}
              title={taxonomy.description}
            >
              {/* Check icon for selected */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Level badge */}
              <div className="text-2xl font-bold mb-1">{level}</div>
              
              {/* Label */}
              <div className="text-sm font-semibold mb-1">{taxonomy.label}</div>
              
              {/* Description */}
              <div className="text-xs opacity-75 line-clamp-2">
                {taxonomy.description}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Selected info */}
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
          Example Verbs for {BLOOM_TAXONOMIES[safeValue].label}:
        </div>
        <div className="flex flex-wrap gap-1">
          {BLOOM_TAXONOMIES[safeValue].examples.map((verb) => (
            <span
              key={verb}
              className="px-2 py-1 text-xs font-medium bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700"
            >
              {verb}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
