import { config } from 'dotenv';
config({ path: '.env' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { MOCK_QUESTIONS, MOCK_WEB_DEV_QUESTIONS } from '@/lib/quiz-mock-data';

const TEST_DUEL_QUESTIONS = [
  {
    id: 'tq1',
    questionText: 'Apa fungsi utama dari indeks database?',
    questionType: 'multiple_choice',
    options: ['Menyimpan file statis', 'Mempercepat pencarian data', 'Mengenkripsi koneksi', 'Menghapus duplikat tabel'],
    correctAnswer: 'Mempercepat pencarian data',
    bloomLevel: 'C1',
    bloomCategory: 'Remember',
    bloomWeight: 10,
    timeLimit: 25,
    order: 1,
  },
  {
    id: 'tq2',
    questionText: 'True or false: foreign key digunakan untuk menjaga hubungan antar tabel.',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'True',
    bloomLevel: 'C2',
    bloomCategory: 'Understand',
    bloomWeight: 10,
    timeLimit: 20,
    order: 2,
  },
  {
    id: 'tq3',
    questionText: 'Sebutkan dua alasan menggunakan transaction saat menulis ke database.',
    questionType: 'short_answer',
    correctAnswer: 'atomic consistency rollback',
    bloomLevel: 'C2',
    bloomCategory: 'Understand',
    bloomWeight: 10,
    timeLimit: 40,
    order: 3,
  },
  {
    id: 'tq4',
    questionText: 'Estimasi tingkat beban query join kompleks pada skala 1 sampai 10.',
    questionType: 'slider',
    sliderMin: 1,
    sliderMax: 10,
    correctAnswer: 7,
    answerMargin: 1,
    bloomLevel: 'C4',
    bloomCategory: 'Analyze',
    bloomWeight: 15,
    timeLimit: 30,
    order: 4,
  },
  {
    id: 'tq5',
    questionText: 'Pilihan terbaik untuk menghindari penulisan berulang pada schema shared adalah?',
    questionType: 'multiple_choice',
    options: ['Copy paste query', 'Extract shared schema', 'Hardcode response', 'Disable relations'],
    correctAnswer: 'Extract shared schema',
    bloomLevel: 'C5',
    bloomCategory: 'Evaluate',
    bloomWeight: 20,
    timeLimit: 35,
    order: 5,
  },
] as const;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Memulai penanaman data (Seeding) dari seed-data.json...");
  
  const dataPath = path.join(process.cwd(), 'db', 'seed-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const coursesData = JSON.parse(rawData);

  for (const c of coursesData) {
    console.log(`Memproses kursus: ${c.title}...`);
    await db.insert(schema.courses).values({
      id: c.id,
      title: c.title,
      description: c.description,
      requiredSemester: c.requiredSemester,
      color: c.color,
      difficulty: c.difficulty,
    }).onConflictDoUpdate({
      target: schema.courses.id,
      set: {
        title: c.title,
        description: c.description,
        requiredSemester: c.requiredSemester,
        color: c.color,
        difficulty: c.difficulty,
      }
    });

    console.log(`Membersihkan unit lama untuk ${c.id}...`);
    await db.delete(schema.units).where(eq(schema.units.courseId, c.id));

    for (let uIdx = 0; uIdx < c.units.length; uIdx++) {
      const u = c.units[uIdx];
      const insertedUnit = await db.insert(schema.units).values({
        courseId: c.id,
        title: u.title,
        description: u.description || `Materi Unit ${uIdx + 1}`,
        order: uIdx + 1,
      }).returning();

      for (let lIdx = 0; lIdx < u.lessons.length; lIdx++) {
        const l = u.lessons[lIdx];
        const insertedLesson = await db.insert(schema.lessons).values({
          unitId: insertedUnit[0].id,
          title: l.title,
          order: lIdx + 1,
          duration: l.duration || '15 menit',
          videoUrl: l.videoUrl || null,
          summaryContent: l.summaryContent || '<h3>' + l.title + '</h3><p>Ini adalah ringkasan materi untuk ' + l.title + '.</p>',
          problemTitle: l.problemTitle || null,
          problemDescription: l.problemDescription || null,
          problemCategory: l.problemCategory || null,
          defaultLanguage: l.defaultLanguage || 'c',
          starterCode: l.starterCode || null,
          sampleInput: l.sampleInput || null,
          sampleOutput: l.sampleOutput || null,
        }).returning();

        if (l.testCases && l.testCases.length > 0) {
          for (let tIdx = 0; tIdx < l.testCases.length; tIdx++) {
            const tc = l.testCases[tIdx];
            await db.insert(schema.testCases).values({
              lessonId: insertedLesson[0].id,
              stdin: tc.stdin || '',
              expected: tc.expected || '',
              hidden: tc.hidden || false,
              order: tIdx + 1,
            });
          }
        }
      }
    }
  }

  console.log("Menanam topik duel dan bank soal...");
  const duelTopics = [
    { id: 1, subjectName: 'Python Dasar', description: 'Topik dasar Python untuk duel cepat.' },
    { id: 2, subjectName: 'Web Development', description: 'Soal HTML, CSS, dan JavaScript.' },
    { id: 3, subjectName: 'Algoritma Dasar', description: 'Soal logika dan analisis algoritma.' },
    { id: 4, subjectName: 'Frontend Dasar', description: 'Soal pengembangan antarmuka web.' },
    { id: 5, subjectName: 'Database Testing', description: 'Topik khusus untuk menguji fetch soal dari Neon.' },
  ];

  for (const topic of duelTopics) {
    await db.insert(schema.duelSubject).values(topic).onConflictDoNothing();
  }

  const buildQuestions = (
    topicId: number,
    questions: typeof MOCK_QUESTIONS
  ) => questions.map((question, index) => ({
    id: topicId * 100 + index + 1,
    topicId,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options ?? null,
    correctAnswer: String(question.correctAnswer),
    sliderMin: question.sliderMin ?? null,
    sliderMax: question.sliderMax ?? null,
    answerMargin: question.answerMargin ?? null,
    bloomLevel: question.bloomLevel,
    bloomCategory: question.bloomCategory,
    bloomWeight: question.bloomWeight,
    timeLimit: question.timeLimit,
    order: question.order,
  }));

  const duelQuestionRows = [
    ...buildQuestions(1, MOCK_QUESTIONS),
    ...buildQuestions(2, MOCK_WEB_DEV_QUESTIONS),
    ...buildQuestions(3, MOCK_QUESTIONS),
    ...buildQuestions(4, MOCK_WEB_DEV_QUESTIONS),
    ...buildQuestions(5, TEST_DUEL_QUESTIONS as unknown as typeof MOCK_QUESTIONS),
  ];

  for (const question of duelQuestionRows) {
    await db.insert(schema.duelQuestions).values(question).onConflictDoNothing();
  }

  // Include users seeding logic here
  console.log("Seeding admin/users...");
  const dummyUsers = [
    { name: 'Admin', email: 'admin@itsdojo.com', role: 'admin' as const },
    { name: 'Dr. Dosen', email: 'dosen@itsdojo.com', role: 'dosen' as const },
    { name: 'Kak Asdos', email: 'asdos@itsdojo.com', role: 'asdos' as const },
    { name: 'Mahasiswa', email: 'student@itsdojo.com', role: 'mahasiswa' as const }
  ];
  for (const u of dummyUsers) {
    try {
      await db.insert(schema.users).values({ id: u.role + '-1', ...u, level: 1 }).onConflictDoNothing();
    } catch(e) {}
  }

  console.log("Semua data berhasil di-seed dari file terpisah yang rapi!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
