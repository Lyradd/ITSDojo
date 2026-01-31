import type { BloomLevel } from '@/lib/quiz-mock-data';

interface BloomBadgeProps {
  level: BloomLevel;
  category: string;
  size?: 'sm' | 'md' | 'lg';
}

const BLOOM_COLORS = {
  C1: 'bg-blue-100 text-blue-700 border-blue-300',
  C2: 'bg-green-100 text-green-700 border-green-300',
  C3: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  C4: 'bg-orange-100 text-orange-700 border-orange-300',
  C5: 'bg-red-100 text-red-700 border-red-300',
  C6: 'bg-purple-100 text-purple-700 border-purple-300',
};

const BLOOM_LABELS = {
  C1: 'Mengingat',
  C2: 'Memahami',
  C3: 'Menerapkan',
  C4: 'Menganalisis',
  C5: 'Mengevaluasi',
  C6: 'Mencipta',
};

export function BloomBadge({ level, category, size = 'md' }: BloomBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border-2 font-bold ${BLOOM_COLORS[level]} ${sizeClasses[size]}`}
    >
      <span className="font-extrabold">{level}</span>
      <span className="opacity-75">•</span>
      <span>{BLOOM_LABELS[level]}</span>
    </div>
  );
}
