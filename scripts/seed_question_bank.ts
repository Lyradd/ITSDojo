import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    console.log("Fetching all courses...");
    const courses = await db.select().from(schema.courses);
    
    console.log(`Found ${courses.length} courses. Seeding massive packages...`);

    // Hapus semua data packages sebelumnya (karena on cascade, items juga terhapus)
    await db.delete(schema.questionPackages);
    console.log("Deleted old packages.");

    for (const course of courses) {
      // ==========================================
      // 1. Paket Lesson (Khusus Tipe Coding)
      // ==========================================
      const [lessonPkg] = await db.insert(schema.questionPackages).values({
        courseId: course.id,
        usageType: 'lesson',
        name: `Latihan Pemrograman - ${course.title}`,
        description: `Paket soal praktek coding interaktif untuk mata kuliah ${course.title}.`,
      }).returning();

      const lessonQuestions = Array.from({ length: 9 }).map((_, i) => ({
        packageId: lessonPkg.id,
        questionText: `Soal Praktikum ${i + 1}: Implementasi Konsep ${i + 1} (${course.title})`,
        questionType: "coding",
        options: {
          description: `Buatlah sebuah fungsi/program untuk menyelesaikan masalah terkait studi kasus ke-${i + 1} pada mata kuliah ${course.title}. Pastikan kode yang Anda buat efisien dan bersih sesuai kaidah *Clean Code*.`,
          starterCode: `// Mulai kode Anda untuk studi kasus ke-${i + 1} di sini...\nfunction solveCase${i + 1}() {\n  // Tulis solusi...\n}`,
          testCases: [
            { stdin: "input1", expected: "output1", hidden: false },
            { stdin: "input2", expected: "output2", hidden: true },
            { stdin: "input3", expected: "output3", hidden: true }
          ]
        },
        order: i + 1,
        points: 10 + (i * 5),
        timeLimit: 0,
        bloomLevel: "C4",
        difficulty: i < 3 ? "easy" : i < 6 ? "medium" : "hard"
      }));
      await db.insert(schema.questionBankItems).values(lessonQuestions);

      // ==========================================
      // 2. Paket Evaluasi (10 Soal: 3 MC, 3 TF, 2 SA, 2 Puzzle)
      // ==========================================
      const [evalPkg] = await db.insert(schema.questionPackages).values({
        courseId: course.id,
        usageType: 'evaluation',
        name: `Evaluasi Tengah Semester - ${course.title}`,
        description: `Ujian formatif campuran untuk menguji pemahaman teori ${course.title}. Berisi 10 butir soal bervariasi.`,
      }).returning();

      const evalQuestions = [];
      // 3 Multiple Choice
      for (let i = 0; i < 3; i++) {
        evalQuestions.push({
          packageId: evalPkg.id,
          questionText: `Teori dasar ke-${i + 1} tentang ${course.title}: Manakah pernyataan yang secara akademis paling akurat?`,
          questionType: "multiple_choice",
          options: [
            { id: "1", text: "Definisi yang benar dan komprehensif", isCorrect: true },
            { id: "2", text: "Pernyataan salah yang mengecoh 1", isCorrect: false },
            { id: "3", text: "Pernyataan salah yang mengecoh 2", isCorrect: false },
            { id: "4", text: "Sama sekali tidak berhubungan", isCorrect: false }
          ],
          order: evalQuestions.length + 1,
          points: 10,
          timeLimit: 0,
          bloomLevel: "C2",
          difficulty: "easy"
        });
      }
      // 3 True False
      for (let i = 0; i < 3; i++) {
        evalQuestions.push({
          packageId: evalPkg.id,
          questionText: `Hukum ke-${i + 1} dalam ${course.title} secara eksplisit menyatakan bahwa variabel X berbanding lurus dengan Y.`,
          questionType: "true_false",
          correctAnswer: i % 2 === 0 ? "true" : "false",
          order: evalQuestions.length + 1,
          points: 5,
          timeLimit: 0,
          bloomLevel: "C1",
          difficulty: "easy"
        });
      }
      // 2 Short Answer
      for (let i = 0; i < 2; i++) {
        evalQuestions.push({
          packageId: evalPkg.id,
          questionText: `Sebutkan istilah tunggal yang digunakan untuk menggambarkan fenomena transisi data di modul ${i + 4} mata kuliah ${course.title}:`,
          questionType: "short_answer",
          correctAnswer: `Istilah ${i + 1}`,
          order: evalQuestions.length + 1,
          points: 15,
          timeLimit: 0,
          bloomLevel: "C3",
          difficulty: "medium"
        });
      }
      // 2 Puzzle
      for (let i = 0; i < 2; i++) {
        evalQuestions.push({
          packageId: evalPkg.id,
          questionText: `Susunlah hierarki tahapan eksekusi ${course.title} dari awal hingga akhir dengan benar:`,
          questionType: "puzzle",
          puzzlePairs: [
            { id: "p1", text: "Tahap 1: Inisialisasi Sistem" },
            { id: "p2", text: "Tahap 2: Validasi Parameter" },
            { id: "p3", text: "Tahap 3: Eksekusi Inti" },
            { id: "p4", text: "Tahap 4: Terminasi & Log" }
          ],
          order: evalQuestions.length + 1,
          points: 20,
          timeLimit: 0,
          bloomLevel: "C5",
          difficulty: "hard"
        });
      }
      await db.insert(schema.questionBankItems).values(evalQuestions);

      // ==========================================
      // 3. Paket Brain Duel (10 Soal Cepat & Interaktif)
      // ==========================================
      const [duelPkg] = await db.insert(schema.questionPackages).values({
        courseId: course.id,
        usageType: 'duel',
        name: `Duel Otak Kilat - ${course.title}`,
        description: `Paket duel dengan batas waktu ketat untuk menguji insting dan kecepatan memori mahasiswa (10 Soal).`,
      }).returning();

      const duelQuestions = [];
      // 5 True False Kilat
      for (let i = 0; i < 5; i++) {
        duelQuestions.push({
          packageId: duelPkg.id,
          questionText: `[KILAT] Konsep A selalu lebih optimal daripada B di ${course.title}. Mitos atau Fakta?`,
          questionType: "true_false",
          correctAnswer: i % 2 === 0 ? "true" : "false",
          order: duelQuestions.length + 1,
          points: 20,
          timeLimit: 10, // 10 detik!
          bloomLevel: "C2",
          difficulty: "medium"
        });
      }
      // 5 Multiple Choice Kilat
      for (let i = 0; i < 5; i++) {
        duelQuestions.push({
          packageId: duelPkg.id,
          questionText: `[KILAT] Mana yang merupakan pengecualian paling anomali dari hukum dasar ${course.title}?`,
          questionType: "multiple_choice",
          options: [
            { id: "1", text: "Anomali X (Benar)", isCorrect: true },
            { id: "2", text: "Norma Y (Salah)", isCorrect: false },
            { id: "3", text: "Standar Z (Salah)", isCorrect: false }
          ],
          order: duelQuestions.length + 1,
          points: 30,
          timeLimit: 15, // 15 detik!
          bloomLevel: "C3",
          difficulty: "hard"
        });
      }
      await db.insert(schema.questionBankItems).values(duelQuestions);
    }

    console.log("🎉 Berhasil menyuntikkan Paket Lesson (Coding), Evaluasi (Campuran), dan Duel untuk SELURUH mata kuliah!");
  } catch (error) {
    console.error("Error seeding DB:", error);
  }
}

main();
