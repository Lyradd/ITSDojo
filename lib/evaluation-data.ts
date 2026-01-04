import { Evaluation, Question, LeaderboardEntry } from './evaluation-store';

// ============================================
// SAMPLE QUESTIONS
// ============================================

export const SAMPLE_QUESTIONS: Question[] = [
  // Multiple Choice Questions
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'Apa kepanjangan dari HTML?',
    options: [
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyperlinks and Text Markup Language',
    ],
    correctAnswer: 0,
    points: 10,
    explanation: 'HTML adalah singkatan dari HyperText Markup Language, bahasa markup standar untuk membuat halaman web.',
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    question: 'Manakah yang BUKAN merupakan JavaScript framework?',
    options: ['React', 'Vue', 'Angular', 'Django'],
    correctAnswer: 3,
    points: 10,
    explanation: 'Django adalah web framework untuk Python, bukan JavaScript.',
  },
  {
    id: 'q3',
    type: 'multiple-choice',
    question: 'CSS property mana yang digunakan untuk mengubah warna teks?',
    options: ['text-color', 'font-color', 'color', 'text-style'],
    correctAnswer: 2,
    points: 10,
    explanation: 'Property CSS "color" digunakan untuk mengatur warna teks.',
  },
  
  // True/False Questions
  {
    id: 'q4',
    type: 'true-false',
    question: 'JavaScript adalah bahasa pemrograman yang sama dengan Java.',
    options: ['Benar', 'Salah'],
    correctAnswer: 1, // False
    points: 10,
    explanation: 'JavaScript dan Java adalah dua bahasa pemrograman yang berbeda dengan tujuan dan sintaks yang berbeda.',
  },
  {
    id: 'q5',
    type: 'true-false',
    question: 'React menggunakan Virtual DOM untuk meningkatkan performa.',
    options: ['Benar', 'Salah'],
    correctAnswer: 0, // True
    points: 10,
    explanation: 'React menggunakan Virtual DOM untuk meminimalkan manipulasi DOM yang mahal.',
  },
  
  // Short Answer Questions
  {
    id: 'q6',
    type: 'short-answer',
    question: 'Sebutkan tag HTML yang digunakan untuk membuat hyperlink (satu kata, huruf kecil).',
    correctAnswer: 'a',
    points: 15,
    explanation: 'Tag <a> (anchor) digunakan untuk membuat hyperlink di HTML.',
  },
  {
    id: 'q7',
    type: 'short-answer',
    question: 'Apa nama hook React yang digunakan untuk mengelola state? (format: useState)',
    correctAnswer: 'useState',
    points: 15,
    explanation: 'useState adalah React Hook yang memungkinkan komponen function memiliki state.',
  },
  
  // More Multiple Choice
  {
    id: 'q8',
    type: 'multiple-choice',
    question: 'Apa fungsi dari "npm install"?',
    options: [
      'Menjalankan aplikasi Node.js',
      'Menginstall dependencies dari package.json',
      'Membuat file package.json baru',
      'Menghapus node_modules',
    ],
    correctAnswer: 1,
    points: 10,
    explanation: 'npm install menginstall semua dependencies yang terdaftar di package.json.',
  },
  {
    id: 'q9',
    type: 'multiple-choice',
    question: 'Manakah yang merupakan CSS preprocessor?',
    options: ['Bootstrap', 'Sass', 'jQuery', 'Webpack'],
    correctAnswer: 1,
    points: 10,
    explanation: 'Sass adalah CSS preprocessor yang menambahkan fitur seperti variabel dan nesting.',
  },
  {
    id: 'q10',
    type: 'multiple-choice',
    question: 'HTTP status code 404 berarti?',
    options: [
      'Server Error',
      'Not Found',
      'Unauthorized',
      'Bad Request',
    ],
    correctAnswer: 1,
    points: 10,
    explanation: 'Status code 404 menunjukkan bahwa resource yang diminta tidak ditemukan.',
  },
];

// ============================================
// SAMPLE EVALUATIONS
// ============================================

export const SAMPLE_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-fe-basic-1',
    title: 'Quiz: HTML & CSS Fundamentals',
    description: 'Uji pemahaman dasar HTML dan CSS',
    courseId: 'fe-basic',
    questions: SAMPLE_QUESTIONS.slice(0, 5),
    duration: 15,
    totalPoints: 50,
    isActive: true,
  },
  {
    id: 'eval-react-1',
    title: 'Quiz: React Basics',
    description: 'Evaluasi pemahaman konsep dasar React',
    courseId: 'react-mastery',
    questions: SAMPLE_QUESTIONS.slice(5, 10),
    duration: 20,
    totalPoints: 50,
    isActive: true,
  },
  {
    id: 'eval-fullstack-1',
    title: 'Comprehensive Web Development Quiz',
    description: 'Evaluasi menyeluruh tentang web development',
    courseId: 'fe-basic',
    questions: SAMPLE_QUESTIONS,
    duration: 30,
    totalPoints: 110,
    isActive: false,
  },
];

// ============================================
// MOCK LEADERBOARD DATA
// ============================================

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    userId: 'user-1',
    name: 'Sarah Kusuma',
    avatar: 'bg-pink-200 text-pink-700',
    score: 280,
    totalQuestions: 50,
    answeredQuestions: 35,
    accuracy: 95,
    rank: 1,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-2',
    name: 'Ahmad Rizki',
    avatar: 'bg-blue-200 text-blue-700',
    score: 265,
    totalQuestions: 50,
    answeredQuestions: 35,
    accuracy: 88,
    rank: 2,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-3',
    name: 'Dinda Pratiwi',
    avatar: 'bg-purple-200 text-purple-700',
    score: 245,
    totalQuestions: 50,
    answeredQuestions: 30,
    accuracy: 94,
    rank: 3,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-4',
    name: 'Budi Santoso',
    avatar: 'bg-green-200 text-green-700',
    score: 230,
    totalQuestions: 50,
    answeredQuestions: 32,
    accuracy: 82,
    rank: 4,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-5',
    name: 'Citra Dewi',
    avatar: 'bg-yellow-200 text-yellow-700',
    score: 215,
    totalQuestions: 50,
    answeredQuestions: 28,
    accuracy: 87,
    rank: 5,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-6',
    name: 'Eko Prasetyo',
    avatar: 'bg-indigo-200 text-indigo-700',
    score: 195,
    totalQuestions: 50,
    answeredQuestions: 25,
    accuracy: 94,
    rank: 6,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-7',
    name: 'Fitri Handayani',
    avatar: 'bg-red-200 text-red-700',
    score: 180,
    totalQuestions: 50,
    answeredQuestions: 27,
    accuracy: 80,
    rank: 7,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-8',
    name: 'Gilang Ramadhan',
    avatar: 'bg-teal-200 text-teal-700',
    score: 160,
    totalQuestions: 50,
    answeredQuestions: 22,
    accuracy: 85,
    rank: 8,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-9',
    name: 'Hana Safitri',
    avatar: 'bg-orange-200 text-orange-700',
    score: 145,
    totalQuestions: 50,
    answeredQuestions: 20,
    accuracy: 93,
    rank: 9,
    lastUpdate: Date.now(),
  },
  {
    userId: 'user-10',
    name: 'Irfan Maulana',
    avatar: 'bg-cyan-200 text-cyan-700',
    score: 120,
    totalQuestions: 50,
    answeredQuestions: 18,
    accuracy: 78,
    rank: 10,
    lastUpdate: Date.now(),
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate random score updates for simulation
 */
export function generateMockLeaderboardUpdate(
  currentLeaderboard: LeaderboardEntry[]
): LeaderboardEntry[] {
  return currentLeaderboard.map(entry => {
    // Random chance to update (30%)
    if (Math.random() > 0.7) {
      // Random score change (-5 to +10)
      const scoreChange = Math.floor(Math.random() * 16) - 5;
      const newScore = Math.max(0, Math.min(100, entry.score + scoreChange));
      
      // Update answered questions if score increased
      const newAnswered = scoreChange > 0 
        ? Math.min(entry.totalQuestions, entry.answeredQuestions + 1)
        : entry.answeredQuestions;
      
      return {
        ...entry,
        score: newScore,
        answeredQuestions: newAnswered,
        accuracy: newAnswered > 0 ? Math.round((newScore / newAnswered) * 100 / 10) : 0,
        lastUpdate: Date.now(),
      };
    }
    return entry;
  });
}

/**
 * Add current user to leaderboard
 */
export function addCurrentUserToLeaderboard(
  leaderboard: LeaderboardEntry[],
  userName: string,
  userScore: number,
  totalQuestions: number,
  answeredQuestions: number
): LeaderboardEntry[] {
  const currentUserEntry: LeaderboardEntry = {
    userId: 'current-user',
    name: `${userName} (You)`,
    avatar: 'bg-blue-200 text-blue-700',
    score: userScore,
    totalQuestions,
    answeredQuestions,
    accuracy: answeredQuestions > 0 ? Math.round((userScore / (totalQuestions * 10)) * 100) : 0,
    rank: 0, // Will be calculated
    lastUpdate: Date.now(),
    isCurrentUser: true,
  };
  
  // Remove old current user entry if exists
  const filteredLeaderboard = leaderboard.filter(e => e.userId !== 'current-user');
  
  return [...filteredLeaderboard, currentUserEntry];
}
