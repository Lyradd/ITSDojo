import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { desc, relations } from 'drizzle-orm';

// ==========================================
// ENUMS (Tipe Data Khusus)
// ==========================================
export const roleEnum = pgEnum('role', ['mahasiswa', 'dosen', 'asdos', 'admin']);
export const enrollStatusEnum = pgEnum('enroll_status', ['pending', 'accepted', 'rejected']);
export const difficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);

// ==========================================
// 1. TABEL USERS & ROLES
// ==========================================
export const users = pgTable('users', {
  id: text('id').primaryKey(), // ID string (bisa disinkronkan dengan Clerk/Auth)
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: roleEnum('role').default('mahasiswa').notNull(),
  
  // Academic Data
  semester: integer('semester').default(1).notNull(),
  
  // Gamification Data
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  accuracy: integer('accuracy').default(0), // Persentase akurasi
  streak: integer('streak').default(0).notNull(),
  avatar: text('avatar').default('bg-blue-200 text-blue-700'),
  
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
  videoUrl: text('video_url'),                    // YouTube embed URL
  summaryContent: text('summary_content'),        // HTML content untuk rangkuman materi

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
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

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