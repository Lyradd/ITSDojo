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
  { userId: 'user-1', name: 'Sarah Kusuma', avatar: 'bg-pink-200 text-pink-700', score: 50, totalQuestions: 5, answeredQuestions: 5, accuracy: 100, rank: 1, lastUpdate: Date.now(), batch: '2023' },
  { userId: 'user-2', name: 'Ahmad Rizki', avatar: 'bg-blue-200 text-blue-700', score: 40, totalQuestions: 5, answeredQuestions: 5, accuracy: 80, rank: 2, lastUpdate: Date.now(), batch: '2022' },
  { userId: 'user-3', name: 'Dinda Pratiwi', avatar: 'bg-purple-200 text-purple-700', score: 40, totalQuestions: 5, answeredQuestions: 4, accuracy: 100, rank: 3, lastUpdate: Date.now(), batch: '2023' },
  { userId: 'user-4', name: 'Budi Santoso', avatar: 'bg-green-200 text-green-700', score: 30, totalQuestions: 5, answeredQuestions: 4, accuracy: 75, rank: 4, lastUpdate: Date.now(), batch: '2021' },
  { userId: 'user-5', name: 'Citra Dewi', avatar: 'bg-yellow-200 text-yellow-700', score: 30, totalQuestions: 5, answeredQuestions: 5, accuracy: 60, rank: 5, lastUpdate: Date.now(), batch: '2023' },
  { userId: 'user-6', name: 'Eko Prasetyo', avatar: 'bg-indigo-200 text-indigo-700', score: 20, totalQuestions: 5, answeredQuestions: 2, accuracy: 100, rank: 6, lastUpdate: Date.now(), batch: '2022' },
  { userId: 'user-7', name: 'Fitri Handayani', avatar: 'bg-red-200 text-red-700', score: 20, totalQuestions: 5, answeredQuestions: 3, accuracy: 66, rank: 7, lastUpdate: Date.now(), batch: '2021' },
  { userId: 'user-8', name: 'Gilang Ramadhan', avatar: 'bg-teal-200 text-teal-700', score: 10, totalQuestions: 5, answeredQuestions: 4, accuracy: 25, rank: 8, lastUpdate: Date.now(), batch: '2023' },
  { userId: 'user-9', name: 'Hana Safitri', avatar: 'bg-orange-200 text-orange-700', score: 10, totalQuestions: 5, answeredQuestions: 1, accuracy: 100, rank: 9, lastUpdate: Date.now(), batch: '2022' },
  { userId: 'user-10', name: 'Irfan Maulana', avatar: 'bg-cyan-200 text-cyan-700', score: 0, totalQuestions: 5, answeredQuestions: 2, accuracy: 0, rank: 10, lastUpdate: Date.now(), batch: '2023' },
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
      if (entry.answeredQuestions >= entry.totalQuestions) return entry; // Already completed

      // Simulasikan menjawab 1 soal: 60% chance benar
      const isCorrect = Math.random() > 0.4;
      const scoreChange = isCorrect ? 10 : 0;
      
      const newScore = entry.score + scoreChange;
      const newAnswered = entry.answeredQuestions + 1;
      
      // Asumsi 1 pertanyaan = 10 poin untuk kalkulasi akurasi sederhana
      const correctAnswersCount = newScore / 10;
      const newAccuracy = Math.round((correctAnswersCount / newAnswered) * 100);
      
      return {
        ...entry,
        score: newScore,
        answeredQuestions: newAnswered,
        accuracy: newAccuracy > 100 ? 100 : newAccuracy,
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
  const correctAnswersCount = userScore / 10;
  const accuracyText = answeredQuestions > 0 ? Math.round((correctAnswersCount / answeredQuestions) * 100) : 0;

  const currentUserEntry: LeaderboardEntry = {
    userId: 'current-user',
    name: `${userName} (You)`,
    avatar: 'bg-blue-200 text-blue-700',
    score: userScore,
    totalQuestions,
    answeredQuestions,
    accuracy: accuracyText > 100 ? 100 : accuracyText,
    rank: 0, // Will be calculated
    lastUpdate: Date.now(),
    isCurrentUser: true,
  };
  
  // Remove old current user entry if exists
  const filteredLeaderboard = leaderboard.filter(e => e.userId !== 'current-user');
  
  return [...filteredLeaderboard, currentUserEntry];
}

/**
 * Add simulated bots if participant threshold is not met
 */
export function addBotsIfNeeded(
  currentLeaderboard: LeaderboardEntry[],
  threshold: number = 20,
  totalQuestions: number = 5
): LeaderboardEntry[] {
  // If threshold is met, return as is
  if (currentLeaderboard.length >= threshold) return currentLeaderboard;

  const botsToAdd = threshold - currentLeaderboard.length;
  const newBots: LeaderboardEntry[] = [];
  
  const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon', 'Bot Zeta', 'Bot Eta', 'Bot Theta', 'Bot Iota', 'Bot Kappa'];
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange', 'cyan'];

  for (let i = 0; i < botsToAdd; i++) {
    const botIndex = currentLeaderboard.length + i;
    const name = botNames[botIndex % botNames.length];
    const color = colors[botIndex % colors.length];
    
    // Simulate bots with partial progress
    const simulatedAnswers = Math.floor(Math.random() * (totalQuestions + 1));
    // Each question is worth 10 points on average in our mock data
    const simulatedScore = simulatedAnswers > 0 ? (Math.floor(Math.random() * simulatedAnswers) + 1) * 10 : 0;
    const simulatedAccuracy = simulatedAnswers > 0 ? Math.round((simulatedScore / (simulatedAnswers * 10)) * 100) : 0;

    newBots.push({
      userId: `bot-${Date.now()}-${i}`,
      name: `${name} 🤖`,
      avatar: `bg-${color}-200 text-${color}-700`,
      score: simulatedScore,
      totalQuestions,
      answeredQuestions: simulatedAnswers,
      accuracy: simulatedAccuracy,
      rank: 0,
      lastUpdate: Date.now() - Math.floor(Math.random() * 10000), // Randomize slightly older last updates
    });
  }

  return [...currentLeaderboard, ...newBots];
}
