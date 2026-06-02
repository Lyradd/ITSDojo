import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, jsonb, unique } from 'drizzle-orm/pg-core';
import { desc, relations } from 'drizzle-orm';

// ==========================================
// ENUMS (Tipe Data Khusus)
// ==========================================
export const roleEnum = pgEnum('role', ['mahasiswa', 'dosen', 'asdos', 'admin']);
export const enrollStatusEnum = pgEnum('enroll_status', ['pending', 'accepted', 'rejected']);
export const difficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
export const usageTypeEnum = pgEnum('usage_type', ['lesson', 'evaluation', 'duel']);

// ==========================================
// 1. TABEL USERS & ROLES
// ==========================================
export const users = pgTable('users', {
  id: text('id').primaryKey(), // ID string (bisa disinkronkan dengan Clerk/Auth)
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').default('123456').notNull(), // Plain text, default 123456 — bisa diubah via super admin
  role: roleEnum('role').default('mahasiswa').notNull(),
  
  // Academic Data
  semester: integer('semester').default(1).notNull(),
  
  // Gamification Data
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(), // Leaderboard XP (kompetitif — dari evaluasi)
  profileXp: integer('profile_xp').default(0).notNull(), // Profile/Level XP (pertumbuhan personal — dari lesson + reward evaluasi)
  gems: integer('gems').default(0).notNull(), // Currency untuk shop
  accuracy: integer('accuracy').default(0), // Persentase akurasi
  streak: integer('streak').default(0).notNull(),
  avatar: text('avatar').default('bg-blue-200 text-blue-700'),
  gamificationData: jsonb('gamification_data'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. TABEL COURSES & STRUCTURE
// ==========================================
export const courses = pgTable('courses', {
  id: text('id').primaryKey(), // Contoh: 'fe-basic', 'react-mastery'
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageSrc: text('image_src'),
  color: text('color').default('bg-blue-500').notNull(),
  
  // Metadata & Prasyarat
  difficulty: difficultyEnum('difficulty').default('Beginner').notNull(),
  xpReward: integer('xp_reward').default(100).notNull(),
  requiredSemester: integer('required_semester').default(1).notNull(),
});

export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').notNull(),
});

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),

  // Metadata (ditampilkan di roadmap node)
  description: text('description'),              // Deskripsi singkat
  duration: text('duration'),                     // Estimasi waktu (~15 menit)
  xpReward: integer('xp_reward').default(50).notNull(),
  gemReward: integer('gem_reward').default(10).notNull(),

  // Konten Pembelajaran
  videoUrl: text('video_url'),                    // YouTube/Google Drive embed URL
  summaryContent: text('summary_content'),        // HTML content untuk rangkuman materi
  materialFiles: text('material_files'),          // JSON array of uploaded files [{url, fileName, fileSize, fileType}]

  // Soal Coding (Practice)
  problemTitle: text('problem_title'),
  problemDescription: text('problem_description'),
  problemCategory: text('problem_category'),
  starterCode: text('starter_code'),
  defaultLanguage: text('default_language').default('c'),
  sampleInput: text('sample_input'),
  sampleOutput: text('sample_output'),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  options: text('options').array().notNull(),
  correctAnswer: text('correct_answer').notNull(),
  xpReward: integer('xp_reward').default(10).notNull(),
});

export const testCases = pgTable('test_cases', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  stdin: text('stdin').notNull().default(''),
  expected: text('expected').notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  order: integer('order').default(1).notNull(),
});

export const lessonDiscussions = pgTable('lesson_discussions', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. TABEL ENROLLMENTS & PROGRESS
// ==========================================
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: text('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  status: enrollStatusEnum('status').default('pending').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.studentId, t.courseId),
}));

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.lessonId),
}));

// Junction table: Menghubungkan Dosen ke kelas yang diampunya
export const courseInstructors = pgTable('course_instructors', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  dosenId: text('dosen_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.courseId, t.dosenId),
}));

// Junction table: Menghubungkan Asdos ke kelas yang didampinginya
export const courseAssistants = pgTable('course_assistants', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  asdosId: text('asdos_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.courseId, t.asdosId),
}));

// ==========================================
// 4. TABEL EVALUATIONS (Kuis Real-time)
// ==========================================
export const evaluations = pgTable('evaluations', {
  id: text('id').primaryKey(), // Contoh: 'eval-fe-basic-1'
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  duration: integer('duration').notNull(), // dalam menit
  isActive: boolean('is_active').default(true).notNull(),
  totalPoints: integer('total_points').default(100).notNull(),
  questions: jsonb('questions').default([]).notNull(),
  // Session lifecycle: 'waiting' (default, menunggu dosen mulai) | 'active' (sedang berjalan) | 'finished'
  sessionStatus: text('session_status').default('waiting').notNull(),
  sessionStartedAt: timestamp('session_started_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const evaluationResults = pgTable('evaluation_results', {
  id: serial('id').primaryKey(),
  evaluationId: text('evaluation_id').references(() => evaluations.id, { onDelete: 'cascade' }).notNull(),
  studentId: text('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  accuracy: integer('accuracy').notNull(), // Persentase
  timeSpent: integer('time_spent').notNull(), // dalam detik
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

export const evaluationProgress = pgTable('evaluation_progress', {
  id: serial('id').primaryKey(),
  evaluationId: text('evaluation_id').notNull(),
  studentId: text('student_id'), // FK ke users.id (nullable untuk backwards-compat)
  studentName: text('student_name').notNull(),
  currentQuestion: integer('current_question').default(0).notNull(),
  totalQuestions: integer('total_questions').notNull(),
  score: integer('score').default(0).notNull(),
  status: text('status').default('active').notNull(), // 'active', 'completed', 'stuck'
  timeElapsed: integer('time_elapsed').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.evaluationId, t.studentId),
}));

// ==========================================
// 5. TABEL ACTIVITY & LOGS
// ==========================================
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  studentId: text('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // Contoh: 'started_course', 'completed_evaluation'
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Duel Quiz Getting the topics
export const duelSubject = pgTable('duelsubject', {
  id: serial('id').primaryKey(),
  subjectName: text('subjectname').notNull(),
  description: text('description').notNull(),
});

export const duelQuestions = pgTable('duel_questions', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id')
    .references(() => duelSubject.id, { onDelete: 'cascade' })
    .notNull(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(),
  options: text('options').array(),
  correctAnswer: text('correct_answer').notNull(),
  sliderMin: integer('slider_min'),
  sliderMax: integer('slider_max'),
  answerMargin: integer('answer_margin'),
  bloomLevel: text('bloom_level').notNull(),
  bloomCategory: text('bloom_category').notNull(),
  bloomWeight: integer('bloom_weight').default(10).notNull(),
  timeLimit: integer('time_limit').default(30).notNull(),
  order: integer('order').notNull(),
});

export const duelRoomStatusEnum = pgEnum('duel_room_status', [
  'waiting',
  'joined',
  'started',
  'cancelled',
]);

export const duelRooms = pgTable('duel_rooms', {
  id: serial('id').primaryKey(), // UUID or invite token
  topicId: integer('topic_id')
    .references(() => duelSubject.id, { onDelete: 'cascade' })
    .notNull(),
  hostId: text('host_id').notNull(),
  guestId: text('guest_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  status: duelRoomStatusEnum('status').default('waiting').notNull(),
  inviteCode: text('invite_code').unique().notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 8. TABEL QUESTION BANK (Bank Soal Paket)
// ==========================================
export const questionPackages = pgTable('question_packages', {
  id: serial('id').primaryKey(),
  courseId: text('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  usageType: usageTypeEnum('usage_type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questionBankItems = pgTable('question_bank_items', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id')
    .references(() => questionPackages.id, { onDelete: 'cascade' })
    .notNull(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(),
  options: jsonb('options').default([]),
  correctAnswer: text('correct_answer'),
  puzzlePairs: jsonb('puzzle_pairs').default([]),
  bloomLevel: text('bloom_level').default('C1').notNull(),
  difficulty: text('difficulty').default('medium').notNull(),
  points: integer('points').default(10).notNull(),
  timeLimit: integer('time_limit'),
  order: integer('order').default(0).notNull(),
});

// ==========================================
// RELATIONS (Opsional: Membantu Drizzle Query)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  progress: many(userProgress),
  evaluationResults: many(evaluationResults),
  activities: many(activityLogs),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  units: many(units),
  enrollments: many(enrollments),
  evaluations: many(evaluations),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, { fields: [units.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, { fields: [lessons.unitId], references: [units.id] }),
  testCases: many(testCases),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  lesson: one(lessons, { fields: [testCases.lessonId], references: [lessons.id] }),
}));