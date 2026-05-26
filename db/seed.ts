import { config } from 'dotenv';
config({ path: '.env' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

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

  // Include users seeding logic here
  console.log("Seeding admin/users...");
  const dummyUsers = [
    { name: 'Admin', email: 'admin@itsdojo.com', bio: 'Super Administrator ITSDojo', role: 'admin' },
    { name: 'Dr. Dosen', email: 'dosen@itsdojo.com', bio: 'Dosen Pembina Mata Kuliah', role: 'dosen' },
    { name: 'Kak Asdos', email: 'asdos@itsdojo.com', bio: 'Asisten Dosen ITSDojo', role: 'asdos' },
    { name: 'Mahasiswa', email: 'student@itsdojo.com', bio: 'Mahasiswa Rajin ITSDojo', role: 'mahasiswa' }
  ];
  for (const u of dummyUsers) {
    try {
      await db.insert(schema.users).values({ id: u.role + '-1', ...u, gems: 0, level: 1 }).onConflictDoNothing();
    } catch(e) {}
  }

  console.log("Semua data berhasil di-seed dari file terpisah yang rapi!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
