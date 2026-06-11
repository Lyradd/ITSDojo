// Extended types for Evaluation and Question with Bloom taxonomy

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'short_answer' | 'puzzle';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';



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


// Group Leaderboard Types
export interface QuizGroup {
  id: string;
  name: string;        // "Kelompok A", "Kelompok B"
  color: string;       // For UI differentiation (hex or tailwind color)
  memberIds: string[]; // User IDs assigned to this group
}

export interface GroupScore {
  groupId: string;
  groupName: string;
  color: string;
  totalScore: number;      // Sum of all members' scores
  averageScore: number;    // Average score per member
  memberCount: number;
  rank: number;
}

export interface QuizSessionConfig {
  enableGroups: boolean;
  groups: QuizGroup[];
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
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

export interface EvaluationMetadata {
  title: string;
  description: string;
  duration: number; // minutes
  totalPoints: number;
  difficulty: DifficultyLevel;
  courseId?: string; // course tempat evaluasi ini ditampilkan ke mahasiswa
  botQuota?: number; // Target participants quota
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
}

// Helper functions

export function calculateTotalPoints(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
