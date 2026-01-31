// Type definitions
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'slider' | 'puzzle';

export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string | number;
  sliderMin?: number;
  sliderMax?: number;
  answerMargin?: number;
  bloomLevel: BloomLevel;
  bloomCategory: string;
  bloomWeight: number;
  timeLimit: number;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  mode: 'individual' | 'group';
  duration: number;
  totalQuestions: number;
  isActive: boolean;
  createdBy: string;
}

// Mock data for quiz with Bloom taxonomy
export const MOCK_QUIZ: Quiz = {
  id: 'quiz-1',
  title: 'Pemrograman Dasar - Evaluasi Tengah Semester',
  description: 'Kuis multi-user dengan Bloom taxonomy integration',
  mode: 'individual',
  duration: 30,
  totalQuestions: 10,
  isActive: true,
  createdBy: 'Dosen Budi',
};

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    questionText: 'Apa fungsi dari operator % (modulo) dalam Python?',
    questionType: 'multiple_choice',
    options: [
      'Pembagian biasa',
      'Sisa hasil bagi',
      'Perpangkatan',
      'Perkalian',
    ],
    correctAnswer: 'Sisa hasil bagi',
    bloomLevel: 'C1',
    bloomCategory: 'Remember',
    bloomWeight: 10,
    timeLimit: 30,
    order: 1,
  },
  {
    id: 'q2',
    questionText: 'Python adalah bahasa pemrograman yang dikompilasi.',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'False',
    bloomLevel: 'C2',
    bloomCategory: 'Understand',
    bloomWeight: 10,
    timeLimit: 20,
    order: 2,
  },
  {
    id: 'q3',
    questionText: 'Jelaskan perbedaan antara list dan tuple dalam Python.',
    questionType: 'short_answer',
    correctAnswer: 'list mutable tuple immutable',
    bloomLevel: 'C2',
    bloomCategory: 'Understand',
    bloomWeight: 10,
    timeLimit: 45,
    order: 3,
  },
  {
    id: 'q4',
    questionText: 'Implementasikan fungsi untuk menghitung faktorial menggunakan rekursi.',
    questionType: 'short_answer',
    correctAnswer: 'def factorial recursion return',
    bloomLevel: 'C3',
    bloomCategory: 'Apply',
    bloomWeight: 15,
    timeLimit: 60,
    order: 4,
  },
  {
    id: 'q5',
    questionText: 'Apa output dari: print([i**2 for i in range(5)])?',
    questionType: 'multiple_choice',
    options: [
      '[0, 1, 2, 3, 4]',
      '[0, 1, 4, 9, 16]',
      '[1, 4, 9, 16, 25]',
      '[0, 2, 4, 6, 8]',
    ],
    correctAnswer: '[0, 1, 4, 9, 16]',
    bloomLevel: 'C3',
    bloomCategory: 'Apply',
    bloomWeight: 15,
    timeLimit: 40,
    order: 5,
  },
  {
    id: 'q6',
    questionText: 'Berapa kompleksitas waktu dari binary search?',
    questionType: 'slider',
    sliderMin: 1,
    sliderMax: 10,
    correctAnswer: 2,
    answerMargin: 1,
    bloomLevel: 'C4',
    bloomCategory: 'Analyze',
    bloomWeight: 15,
    timeLimit: 30,
    order: 6,
  },
  {
    id: 'q7',
    questionText: 'Analisis kode berikut dan identifikasi bug: def sum(a,b): return a+b+1',
    questionType: 'short_answer',
    correctAnswer: '+1 surplus tambahan',
    bloomLevel: 'C4',
    bloomCategory: 'Analyze',
    bloomWeight: 15,
    timeLimit: 50,
    order: 7,
  },
  {
    id: 'q8',
    questionText: 'Manakah struktur data terbaik untuk implementasi LRU Cache?',
    questionType: 'multiple_choice',
    options: [
      'Array + Stack',
      'HashMap + Doubly Linked List',
      'Binary Tree',
      'Queue',
    ],
    correctAnswer: 'HashMap + Doubly Linked List',
    bloomLevel: 'C5',
    bloomCategory: 'Evaluate',
    bloomWeight: 20,
    timeLimit: 45,
    order: 8,
  },
  {
    id: 'q9',
    questionText: 'Evaluasi performa: Apakah menggunakan set() lebih efisien daripada list untuk membership testing?',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'True',
    bloomLevel: 'C5',
    bloomCategory: 'Evaluate',
    bloomWeight: 20,
    timeLimit: 25,
    order: 9,
  },
  {
    id: 'q10',
    questionText: 'Desain algoritma untuk mendeteksi cycle dalam linked list.',
    questionType: 'short_answer',
    correctAnswer: 'floyd cycle detection slow fast pointer',
    bloomLevel: 'C6',
    bloomCategory: 'Create',
    bloomWeight: 20,
    timeLimit: 90,
    order: 10,
  },
];

export const MOCK_PARTICIPANTS = [
  { userId: 'user-1', name: 'Sarah Kusuma', avatar: 'bg-pink-200 text-pink-700', score: 0, rank: 1 },
  { userId: 'user-2', name: 'Ahmad Rizki', avatar: 'bg-blue-200 text-blue-700', score: 0, rank: 2 },
  { userId: 'user-3', name: 'Dinda Pratiwi', avatar: 'bg-purple-200 text-purple-700', score: 0, rank: 3 },
  { userId: 'user-4', name: 'Budi Santoso', avatar: 'bg-green-200 text-green-700', score: 0, rank: 4 },
  { userId: 'user-5', name: 'Citra Dewi', avatar: 'bg-yellow-200 text-yellow-700', score: 0, rank: 5 },
];
