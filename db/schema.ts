import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Tabel Courses (Mata Pelajaran)
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageSrc: text('image_src'), // URL gambar 
});

// Tabel Units (Bab dalam Course)
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').notNull(),
});

// Tabel Lessons 
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => units.id).notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  type: text('type').default('lesson'),
});

// Tabel Questions (Soal Kuis) - sesi dosen
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id).notNull(),
  questionText: text('question_text').notNull(),
  options: text('options').array(),
  correctAnswer: text('correct_answer').notNull(),
  xpReward: integer('xp_reward').default(10),
});