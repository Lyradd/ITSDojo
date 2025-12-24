// Mock data untuk admin dashboard

export interface Student {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  accuracy: number;
  coursesEnrolled: number;
  evaluationsCompleted: number;
  lastActive: string;
  avatar: string;
  streak: number;
}

export interface EvaluationResult {
  id: string;
  evaluationId: string;
  studentId: string;
  score: number;
  accuracy: number;
  completedAt: number;
  timeSpent: number; // seconds
}

export interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  action: string;
  details: string;
  timestamp: number;
}

// ============================================
// MOCK STUDENTS (20 students)
// ============================================

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: 'Ahmad Rizki',
    email: 'ahmad.rizki@student.its.ac.id',
    xp: 1250,
    level: 5,
    accuracy: 88,
    coursesEnrolled: 3,
    evaluationsCompleted: 8,
    lastActive: '2 hours ago',
    avatar: 'bg-blue-200 text-blue-700',
    streak: 5
  },
  {
    id: 'student-2',
    name: 'Sarah Kusuma',
    email: 'sarah.k@student.its.ac.id',
    xp: 1450,
    level: 6,
    accuracy: 95,
    coursesEnrolled: 3,
    evaluationsCompleted: 10,
    lastActive: '1 hour ago',
    avatar: 'bg-pink-200 text-pink-700',
    streak: 7
  },
  {
    id: 'student-3',
    name: 'Budi Santoso',
    email: 'budi.s@student.its.ac.id',
    xp: 980,
    level: 4,
    accuracy: 82,
    coursesEnrolled: 2,
    evaluationsCompleted: 6,
    lastActive: '3 hours ago',
    avatar: 'bg-green-200 text-green-700',
    streak: 3
  },
  {
    id: 'student-4',
    name: 'Dinda Pratiwi',
    email: 'dinda.p@student.its.ac.id',
    xp: 1180,
    level: 5,
    accuracy: 90,
    coursesEnrolled: 3,
    evaluationsCompleted: 9,
    lastActive: '30 minutes ago',
    avatar: 'bg-purple-200 text-purple-700',
    streak: 6
  },
  {
    id: 'student-5',
    name: 'Eko Prasetyo',
    email: 'eko.p@student.its.ac.id',
    xp: 850,
    level: 3,
    accuracy: 75,
    coursesEnrolled: 2,
    evaluationsCompleted: 5,
    lastActive: '5 hours ago',
    avatar: 'bg-indigo-200 text-indigo-700',
    streak: 2
  },
  {
    id: 'student-6',
    name: 'Fitri Handayani',
    email: 'fitri.h@student.its.ac.id',
    xp: 1320,
    level: 5,
    accuracy: 87,
    coursesEnrolled: 3,
    evaluationsCompleted: 9,
    lastActive: '1 hour ago',
    avatar: 'bg-red-200 text-red-700',
    streak: 4
  },
  {
    id: 'student-7',
    name: 'Gilang Ramadhan',
    email: 'gilang.r@student.its.ac.id',
    xp: 720,
    level: 3,
    accuracy: 78,
    coursesEnrolled: 2,
    evaluationsCompleted: 4,
    lastActive: '1 day ago',
    avatar: 'bg-teal-200 text-teal-700',
    streak: 1
  },
  {
    id: 'student-8',
    name: 'Hana Safitri',
    email: 'hana.s@student.its.ac.id',
    xp: 1090,
    level: 4,
    accuracy: 85,
    coursesEnrolled: 3,
    evaluationsCompleted: 7,
    lastActive: '4 hours ago',
    avatar: 'bg-orange-200 text-orange-700',
    streak: 3
  },
  {
    id: 'student-9',
    name: 'Irfan Maulana',
    email: 'irfan.m@student.its.ac.id',
    xp: 950,
    level: 4,
    accuracy: 80,
    coursesEnrolled: 2,
    evaluationsCompleted: 6,
    lastActive: '2 hours ago',
    avatar: 'bg-cyan-200 text-cyan-700',
    streak: 4
  },
  {
    id: 'student-10',
    name: 'Joko Widodo',
    email: 'joko.w@student.its.ac.id',
    xp: 1560,
    level: 6,
    accuracy: 92,
    coursesEnrolled: 3,
    evaluationsCompleted: 11,
    lastActive: '30 minutes ago',
    avatar: 'bg-yellow-200 text-yellow-700',
    streak: 8
  },
  {
    id: 'student-11',
    name: 'Kartika Sari',
    email: 'kartika.s@student.its.ac.id',
    xp: 680,
    level: 3,
    accuracy: 72,
    coursesEnrolled: 2,
    evaluationsCompleted: 4,
    lastActive: '6 hours ago',
    avatar: 'bg-lime-200 text-lime-700',
    streak: 2
  },
  {
    id: 'student-12',
    name: 'Lestari Putri',
    email: 'lestari.p@student.its.ac.id',
    xp: 1280,
    level: 5,
    accuracy: 89,
    coursesEnrolled: 3,
    evaluationsCompleted: 8,
    lastActive: '1 hour ago',
    avatar: 'bg-emerald-200 text-emerald-700',
    streak: 5
  },
  {
    id: 'student-13',
    name: 'Muhammad Fajar',
    email: 'fajar.m@student.its.ac.id',
    xp: 890,
    level: 4,
    accuracy: 76,
    coursesEnrolled: 2,
    evaluationsCompleted: 5,
    lastActive: '3 hours ago',
    avatar: 'bg-sky-200 text-sky-700',
    streak: 3
  },
  {
    id: 'student-14',
    name: 'Nadia Rahma',
    email: 'nadia.r@student.its.ac.id',
    xp: 1420,
    level: 6,
    accuracy: 93,
    coursesEnrolled: 3,
    evaluationsCompleted: 10,
    lastActive: '45 minutes ago',
    avatar: 'bg-violet-200 text-violet-700',
    streak: 7
  },
  {
    id: 'student-15',
    name: 'Omar Abdullah',
    email: 'omar.a@student.its.ac.id',
    xp: 760,
    level: 3,
    accuracy: 74,
    coursesEnrolled: 2,
    evaluationsCompleted: 4,
    lastActive: '8 hours ago',
    avatar: 'bg-fuchsia-200 text-fuchsia-700',
    streak: 2
  },
  {
    id: 'student-16',
    name: 'Putri Ayu',
    email: 'putri.a@student.its.ac.id',
    xp: 1150,
    level: 5,
    accuracy: 86,
    coursesEnrolled: 3,
    evaluationsCompleted: 7,
    lastActive: '2 hours ago',
    avatar: 'bg-rose-200 text-rose-700',
    streak: 4
  },
  {
    id: 'student-17',
    name: 'Qori Syahputra',
    email: 'qori.s@student.its.ac.id',
    xp: 620,
    level: 2,
    accuracy: 70,
    coursesEnrolled: 1,
    evaluationsCompleted: 3,
    lastActive: '1 day ago',
    avatar: 'bg-amber-200 text-amber-700',
    streak: 1
  },
  {
    id: 'student-18',
    name: 'Rina Wati',
    email: 'rina.w@student.its.ac.id',
    xp: 1380,
    level: 5,
    accuracy: 91,
    coursesEnrolled: 3,
    evaluationsCompleted: 9,
    lastActive: '1 hour ago',
    avatar: 'bg-slate-200 text-slate-700',
    streak: 6
  },
  {
    id: 'student-19',
    name: 'Siti Nurhaliza',
    email: 'siti.n@student.its.ac.id',
    xp: 920,
    level: 4,
    accuracy: 79,
    coursesEnrolled: 2,
    evaluationsCompleted: 6,
    lastActive: '4 hours ago',
    avatar: 'bg-zinc-200 text-zinc-700',
    streak: 3
  },
  {
    id: 'student-20',
    name: 'Taufik Hidayat',
    email: 'taufik.h@student.its.ac.id',
    xp: 1510,
    level: 6,
    accuracy: 94,
    coursesEnrolled: 3,
    evaluationsCompleted: 11,
    lastActive: '20 minutes ago',
    avatar: 'bg-neutral-200 text-neutral-700',
    streak: 9
  },
];

// ============================================
// MOCK EVALUATION RESULTS
// ============================================

export const MOCK_EVALUATION_RESULTS: EvaluationResult[] = [
  // Eval 1 results
  { id: 'result-1', evaluationId: 'eval-fe-basic-1', studentId: 'student-1', score: 85, accuracy: 85, completedAt: Date.now() - 3600000, timeSpent: 720 },
  { id: 'result-2', evaluationId: 'eval-fe-basic-1', studentId: 'student-2', score: 95, accuracy: 95, completedAt: Date.now() - 7200000, timeSpent: 680 },
  { id: 'result-3', evaluationId: 'eval-fe-basic-1', studentId: 'student-3', score: 75, accuracy: 75, completedAt: Date.now() - 10800000, timeSpent: 850 },
  { id: 'result-4', evaluationId: 'eval-fe-basic-1', studentId: 'student-4', score: 90, accuracy: 90, completedAt: Date.now() - 1800000, timeSpent: 700 },
  { id: 'result-5', evaluationId: 'eval-fe-basic-1', studentId: 'student-5', score: 70, accuracy: 70, completedAt: Date.now() - 14400000, timeSpent: 920 },
  
  // Eval 2 results
  { id: 'result-6', evaluationId: 'eval-react-1', studentId: 'student-1', score: 88, accuracy: 88, completedAt: Date.now() - 86400000, timeSpent: 1100 },
  { id: 'result-7', evaluationId: 'eval-react-1', studentId: 'student-2', score: 92, accuracy: 92, completedAt: Date.now() - 90000000, timeSpent: 1050 },
  { id: 'result-8', evaluationId: 'eval-react-1', studentId: 'student-6', score: 85, accuracy: 85, completedAt: Date.now() - 93600000, timeSpent: 1150 },
];

// ============================================
// MOCK ACTIVITY LOGS
// ============================================

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'activity-1',
    studentId: 'student-2',
    studentName: 'Sarah Kusuma',
    action: 'completed_evaluation',
    details: 'Menyelesaikan Quiz: HTML & CSS Fundamentals dengan score 95%',
    timestamp: Date.now() - 3600000
  },
  {
    id: 'activity-2',
    studentId: 'student-4',
    studentName: 'Dinda Pratiwi',
    action: 'started_course',
    details: 'Memulai kursus React JS Mastery',
    timestamp: Date.now() - 1800000
  },
  {
    id: 'activity-3',
    studentId: 'student-10',
    studentName: 'Joko Widodo',
    action: 'completed_evaluation',
    details: 'Menyelesaikan Quiz: React Basics dengan score 92%',
    timestamp: Date.now() - 1200000
  },
  {
    id: 'activity-4',
    studentId: 'student-14',
    studentName: 'Nadia Rahma',
    action: 'level_up',
    details: 'Naik ke Level 6',
    timestamp: Date.now() - 2700000
  },
  {
    id: 'activity-5',
    studentId: 'student-1',
    studentName: 'Ahmad Rizki',
    action: 'completed_lesson',
    details: 'Menyelesaikan pelajaran: CSS Flexbox',
    timestamp: Date.now() - 7200000
  },
];

// ============================================
// ANALYTICS DATA
// ============================================

export const MOCK_ANALYTICS = {
  totalStudents: 20,
  activeToday: 12,
  averageScore: 84,
  completionRate: 78,
  totalEvaluations: 3,
  activeEvaluations: 2,
  totalSubmissions: 45,
  
  // Score distribution
  scoreDistribution: [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 1 },
    { range: '41-60', count: 3 },
    { range: '61-80', count: 8 },
    { range: '81-100', count: 12 },
  ],
  
  // Activity over time (last 7 days)
  activityTrend: [
    { day: 'Mon', students: 8, evaluations: 3 },
    { day: 'Tue', students: 12, evaluations: 5 },
    { day: 'Wed', students: 10, evaluations: 4 },
    { day: 'Thu', students: 15, evaluations: 7 },
    { day: 'Fri', students: 14, evaluations: 6 },
    { day: 'Sat', students: 9, evaluations: 2 },
    { day: 'Sun', students: 12, evaluations: 4 },
  ],
  
  // Course popularity
  coursePopularity: [
    { course: 'Frontend Warrior', students: 18, completion: 75 },
    { course: 'React Mastery', students: 14, completion: 65 },
    { course: 'Backend Ninja', students: 10, completion: 55 },
  ],
};
