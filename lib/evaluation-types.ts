// Extended types for Evaluation and Question with Bloom taxonomy

export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'short_answer' | 'puzzle';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface BloomTaxonomy {
  level: BloomLevel;
  label: string;
  description: string;
  color: string;
  examples: string[];
}

export const BLOOM_TAXONOMIES: Record<BloomLevel, BloomTaxonomy> = {
  C1: {
    level: 'C1',
    label: 'Remember',
    description: 'Recall facts and basic concepts',
    color: 'purple',
    examples: ['Define', 'List', 'Recall', 'Name', 'Identify']
  },
  C2: {
    level: 'C2',
    label: 'Understand',
    description: 'Explain ideas or concepts',
    color: 'blue',
    examples: ['Explain', 'Describe', 'Summarize', 'Interpret', 'Compare']
  },
  C3: {
    level: 'C3',
    label: 'Apply',
    description: 'Use information in new situations',
    color: 'green',
    examples: ['Apply', 'Solve', 'Use', 'Demonstrate', 'Implement']
  },
  C4: {
    level: 'C4',
    label: 'Analyze',
    description: 'Draw connections among ideas',
    color: 'yellow',
    examples: ['Analyze', 'Compare', 'Contrast', 'Examine', 'Categorize']
  },
  C5: {
    level: 'C5',
    label: 'Evaluate',
    description: 'Justify a decision or course of action',
    color: 'orange',
    examples: ['Evaluate', 'Justify', 'Critique', 'Assess', 'Defend']
  },
  C6: {
    level: 'C6',
    label: 'Create',
    description: 'Produce new or original work',
    color: 'red',
    examples: ['Create', 'Design', 'Construct', 'Plan', 'Produce']
  }
};

export interface QuestionMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface PuzzlePair {
  id: string;
  text: string;  // Item text that students need to order
}

export type BloomDistribution = {
  C1: number;
  C2: number;
  C3: number;
  C4: number;
  C5: number;
  C6: number;
};

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  timeLimit?: number; // seconds
  media?: QuestionMedia;
  
  // For multiple choice
  options?: QuestionOption[];
  
  // For true/false
  correctAnswer?: boolean;
  
  // For essay/short answer
  wordLimit?: number;
  rubric?: string;
  expectedAnswer?: string;
  
  // For puzzle (matching)
  puzzlePairs?: PuzzlePair[];
}

export interface BloomDistribution {
  C1: number;
  C2: number;
  C3: number;
  C4: number;
  C5: number;
  C6: number;
}

export interface EvaluationMetadata {
  title: string;
  description: string;
  duration: number; // minutes
  totalPoints: number;
  difficulty: DifficultyLevel;
  tags: string[];
}

export interface Evaluation extends EvaluationMetadata {
  id: string;
  questions: Question[];
  isActive: boolean;
  createdBy: string; // dosen id
  createdAt: Date;
  updatedAt: Date;
  
  // Analytics (computed)
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  bloomDistribution: BloomDistribution;
}

// Helper functions
export function calculateBloomDistribution(questions: Question[]): BloomDistribution {
  const distribution: BloomDistribution = {
    C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0
  };
  
  questions.forEach(q => {
    distribution[q.bloomLevel]++;
  });
  
  return distribution;
}

export function calculateTotalPoints(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
