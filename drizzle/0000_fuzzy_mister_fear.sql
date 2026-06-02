CREATE TYPE "public"."difficulty" AS ENUM('Beginner', 'Intermediate', 'Advanced');--> statement-breakpoint
CREATE TYPE "public"."duel_room_status" AS ENUM('waiting', 'joined', 'started', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."enroll_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('mahasiswa', 'dosen', 'asdos', 'admin');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('lesson', 'evaluation', 'duel');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_assistants" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"asdos_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_assistants_course_id_asdos_id_unique" UNIQUE("course_id","asdos_id")
);
--> statement-breakpoint
CREATE TABLE "course_instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"dosen_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_instructors_course_id_dosen_id_unique" UNIQUE("course_id","dosen_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_src" text,
	"color" text DEFAULT 'bg-blue-500' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'Beginner' NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"required_semester" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duel_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"host_id" text NOT NULL,
	"guest_id" text,
	"status" "duel_room_status" DEFAULT 'waiting' NOT NULL,
	"invite_code" text NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "duel_rooms_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "duelsubject" (
	"id" serial PRIMARY KEY NOT NULL,
	"subjectname" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"course_id" text NOT NULL,
	"status" "enroll_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_student_id_course_id_unique" UNIQUE("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "evaluation_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"student_id" text,
	"student_name" text NOT NULL,
	"current_question" integer DEFAULT 0 NOT NULL,
	"total_questions" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"time_elapsed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "evaluation_progress_evaluation_id_student_id_unique" UNIQUE("evaluation_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "evaluation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"student_id" text NOT NULL,
	"score" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"time_spent" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_points" integer DEFAULT 100 NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"session_status" text DEFAULT 'waiting' NOT NULL,
	"session_started_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"description" text,
	"duration" text,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"gem_reward" integer DEFAULT 10 NOT NULL,
	"video_url" text,
	"summary_content" text,
	"material_files" text,
	"problem_title" text,
	"problem_description" text,
	"problem_category" text,
	"starter_code" text,
	"default_language" text DEFAULT 'c',
	"sample_input" text,
	"sample_output" text
);
--> statement-breakpoint
CREATE TABLE "question_bank_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"package_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" text,
	"puzzle_pairs" jsonb DEFAULT '[]'::jsonb,
	"bloom_level" text DEFAULT 'C1' NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"time_limit" integer,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"usage_type" "usage_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_answer" text NOT NULL,
	"xp_reward" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"stdin" text DEFAULT '' NOT NULL,
	"expected" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_progress_user_id_lesson_id_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text DEFAULT '123456' NOT NULL,
	"role" "role" DEFAULT 'mahasiswa' NOT NULL,
	"semester" integer DEFAULT 1 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"profile_xp" integer DEFAULT 0 NOT NULL,
	"gems" integer DEFAULT 0 NOT NULL,
	"accuracy" integer DEFAULT 0,
	"streak" integer DEFAULT 0 NOT NULL,
	"avatar" text DEFAULT 'bg-blue-200 text-blue-700',
	"gamification_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assistants" ADD CONSTRAINT "course_assistants_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assistants" ADD CONSTRAINT "course_assistants_asdos_id_users_id_fk" FOREIGN KEY ("asdos_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_topic_id_duelsubject_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."duelsubject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_discussions" ADD CONSTRAINT "lesson_discussions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_discussions" ADD CONSTRAINT "lesson_discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_package_id_question_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."question_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_packages" ADD CONSTRAINT "question_packages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;