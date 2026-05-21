require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const coursesData = [
  {
    id: 'dasar-pemrograman',
    title: 'Dasar Pemrograman',
    description: 'Pelajari logika dasar pemrograman dan algoritma menggunakan bahasa C/C++.',
    color: 'bg-gradient-to-r from-teal-500 to-emerald-600',
    difficulty: 'Beginner',
    xpReward: 300,
    requiredSemester: 1,
    units: [
      {
        title: 'Unit 1: Pengenalan Algoritma',
        description: 'Pahami apa itu algoritma dan cara menulis pseudocode.',
        lessons: [
          { 
            title: 'Apa itu Algoritma?', 
            duration: '10 menit',
            problemTitle: 'Program Pertama C: Hello ITSDojo!',
            problemCategory: 'Basic I/O',
            problemDescription: 'Tuliskan sebuah program C sederhana yang mencetak kalimat "Hello ITSDojo!" ke layar (standard output). Pastikan ejaan dan tanda serunya tepat.',
            starterCode: '#include <stdio.h>\n\nint main() {\n    // Tulis kode cetak Anda di sini\n    printf("Hello ITSDojo!\\n");\n    return 0;\n}',
            defaultLanguage: 'c',
            sampleInput: '',
            sampleOutput: 'Hello ITSDojo!',
            testCases: [
              { stdin: '', expected: 'Hello ITSDojo!', hidden: false }
            ]
          },
          { 
            title: 'Pseudocode dan Flowchart', 
            duration: '15 menit',
            problemTitle: 'Penjumlahan Dua Bilangan',
            problemCategory: 'Variables & Arithmetic',
            problemDescription: 'Buatlah program C yang membaca dua bilangan bulat (integer) dari input pengguna (standard input), menjumlahkan keduanya, dan mencetak hasil penjumlahannya ke layar.',
            starterCode: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    // Baca dua bilangan bulat dan cetak hasil penjumlahan\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}',
            defaultLanguage: 'c',
            sampleInput: '5 7',
            sampleOutput: '12',
            testCases: [
              { stdin: '5 7', expected: '12', hidden: false },
              { stdin: '-3 8', expected: '5', hidden: false },
              { stdin: '100 250', expected: '350', hidden: true }
            ]
          },
          { title: 'Instalasi Compiler C/C++', duration: '12 menit' }
        ]
      },
      {
        title: 'Unit 2: Variabel dan Tipe Data',
        description: 'Mengenal tipe data dasar seperti integer, float, dan char.',
        lessons: [
          { title: 'Deklarasi Variabel', duration: '10 menit' },
          { title: 'Tipe Data Primitif', duration: '10 menit' },
          { title: 'Operator Aritmatika', duration: '15 menit' }
        ]
      },
      {
        title: 'Unit 3: Percabangan dan Perulangan',
        description: 'Mengontrol alur program menggunakan if-else dan for/while loops.',
        lessons: [
          { title: 'Kondisional If-Else', duration: '15 menit' },
          { title: 'Perulangan For', duration: '12 menit' },
          { title: 'Perulangan While', duration: '12 menit' }
        ]
      }
    ]
  },
  {
    id: 'sistem-digital',
    title: 'Sistem Digital',
    description: 'Pahami dasar rangkaian logika, gerbang logika, dan sistem bilangan digital.',
    color: 'bg-gradient-to-r from-purple-500 to-fuchsia-600',
    difficulty: 'Beginner',
    xpReward: 300,
    requiredSemester: 1,
    units: [
      {
        title: 'Unit 1: Sistem Bilangan',
        description: 'Konversi bilangan biner, oktal, desimal, dan heksadesimal.',
        lessons: [
          { title: 'Bilangan Biner', duration: '10 menit' },
          { title: 'Konversi Bilangan', duration: '20 menit' }
        ]
      },
      {
        title: 'Unit 2: Gerbang Logika',
        description: 'Mengenal AND, OR, NOT, NAND, NOR, XOR.',
        lessons: [
          { title: 'Gerbang Dasar', duration: '15 menit' },
          { title: 'Gerbang Turunan', duration: '15 menit' },
          { title: 'Aljabar Boolean', duration: '20 menit' }
        ]
      }
    ]
  },
  {
    id: 'struktur-data',
    title: 'Struktur Data',
    description: 'Pelajari cara penyimpanan dan pengaturan data secara efisien di memori.',
    color: 'bg-gradient-to-r from-orange-500 to-red-600',
    difficulty: 'Intermediate',
    xpReward: 400,
    requiredSemester: 2,
    units: [
      {
        title: 'Unit 1: Array dan Linked List',
        description: 'Struktur data linear dasar.',
        lessons: [
          { title: 'Array 1D dan 2D', duration: '15 menit' },
          { title: 'Singly Linked List', duration: '20 menit' },
          { title: 'Doubly Linked List', duration: '20 menit' }
        ]
      },
      {
        title: 'Unit 2: Stack dan Queue',
        description: 'Struktur data LIFO dan FIFO.',
        lessons: [
          { title: 'Konsep Stack (LIFO)', duration: '15 menit' },
          { title: 'Konsep Queue (FIFO)', duration: '15 menit' },
          { title: 'Implementasi Stack/Queue', duration: '20 menit' }
        ]
      },
      {
        title: 'Unit 3: Tree dan Graph',
        description: 'Struktur data non-linear.',
        lessons: [
          { title: 'Binary Tree', duration: '20 menit' },
          { title: 'Binary Search Tree (BST)', duration: '20 menit' },
          { title: 'Pengenalan Graph', duration: '15 menit' }
        ]
      }
    ]
  },
  {
    id: 'sistem-basis-data',
    title: 'Sistem Basis Data',
    description: 'Desain skema database relasional dan kuasai bahasa query SQL.',
    color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    difficulty: 'Intermediate',
    xpReward: 400,
    requiredSemester: 3,
    units: [
      {
        title: 'Unit 1: Konsep Basis Data Relasional',
        description: 'Memahami tabel, primary key, dan foreign key.',
        lessons: [
          { title: 'Apa itu Basis Data?', duration: '10 menit' },
          { title: 'Model Relasional', duration: '15 menit' },
          { title: 'ERD (Entity Relationship Diagram)', duration: '20 menit' }
        ]
      },
      {
        title: 'Unit 2: SQL Dasar (DQL & DML)',
        description: 'Query data dasar menggunakan SELECT, INSERT, UPDATE, DELETE.',
        lessons: [
          { title: 'SELECT dan WHERE', duration: '15 menit' },
          { title: 'INSERT, UPDATE, DELETE', duration: '15 menit' },
          { title: 'ORDER BY dan LIMIT', duration: '10 menit' }
        ]
      },
      {
        title: 'Unit 3: Relasi dan JOIN',
        description: 'Menggabungkan beberapa tabel.',
        lessons: [
          { title: 'INNER JOIN', duration: '15 menit' },
          { title: 'LEFT/RIGHT JOIN', duration: '15 menit' }
        ]
      }
    ]
  },
  {
    id: 'sistem-operasi',
    title: 'Sistem Operasi',
    description: 'Pelajari manajemen memori, penjadwalan proses, dan sistem file.',
    color: 'bg-gradient-to-r from-slate-600 to-zinc-800',
    difficulty: 'Intermediate',
    xpReward: 400,
    requiredSemester: 3,
    units: [
      {
        title: 'Unit 1: Pengenalan OS',
        description: 'Fungsi utama dan arsitektur sistem operasi.',
        lessons: [
          { title: 'Peran Sistem Operasi', duration: '10 menit' },
          { title: 'Kernel dan User Space', duration: '15 menit' }
        ]
      },
      {
        title: 'Unit 2: Manajemen Proses',
        description: 'Bagaimana OS mengatur banyak program secara bersamaan.',
        lessons: [
          { title: 'Status Proses', duration: '15 menit' },
          { title: 'Algoritma Penjadwalan (FCFS, SJF, RR)', duration: '20 menit' },
          { title: 'Konkurensi dan Deadlock', duration: '20 menit' }
        ]
      },
      {
        title: 'Unit 3: Manajemen Memori',
        description: 'Paging, segmentasi, dan virtual memory.',
        lessons: [
          { title: 'Alokasi Memori', duration: '15 menit' },
          { title: 'Virtual Memory & Paging', duration: '20 menit' }
        ]
      }
    ]
  }
];

async function main() {
  console.log("Starting seed script for 5 new courses...");
  
  try {
    for (const course of coursesData) {
      console.log(`Ensuring '${course.id}' course exists...`);
      await sql`
        INSERT INTO courses (id, title, description, color, difficulty, xp_reward, required_semester)
        VALUES (
          ${course.id}, 
          ${course.title}, 
          ${course.description}, 
          ${course.color}, 
          ${course.difficulty}, 
          ${course.xpReward}, 
          ${course.requiredSemester}
        )
        ON CONFLICT (id) DO UPDATE 
        SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;
      `;

      console.log(`Cleaning old units and lessons for ${course.id}...`);
      await sql`DELETE FROM units WHERE course_id = ${course.id};`;

      // Insert units and lessons
      for (let uIdx = 0; uIdx < course.units.length; uIdx++) {
        const u = course.units[uIdx];
        console.log(`  Inserting Unit: ${u.title}...`);
        
        const [insertedUnit] = await sql`
          INSERT INTO units (course_id, title, description, "order")
          VALUES (${course.id}, ${u.title}, ${u.description}, ${uIdx + 1})
          RETURNING id;
        `;
        
        const unitId = insertedUnit.id;
        
        for (let lIdx = 0; lIdx < u.lessons.length; lIdx++) {
          const l = u.lessons[lIdx];
          
          const [insertedLesson] = await sql`
            INSERT INTO lessons (
              unit_id, title, "order", description, duration, xp_reward, gem_reward,
              summary_content, problem_title, problem_description, problem_category,
              starter_code, default_language, sample_input, sample_output
            )
            VALUES (
              ${unitId}, 
              ${l.title}, 
              ${lIdx + 1}, 
              ${l.problemDescription || 'Materi pembelajaran untuk topik ' + l.title}, 
              ${l.duration}, 
              50, 
              10,
              ${l.summaryContent || '<h3>' + l.title + '</h3><p>Ini adalah ringkasan materi untuk ' + l.title + '.</p>'},
              ${l.problemTitle || null},
              ${l.problemDescription || null},
              ${l.problemCategory || null},
              ${l.starterCode || null},
              ${l.defaultLanguage || 'c'},
              ${l.sampleInput || null},
              ${l.sampleOutput || null}
            )
            RETURNING id;
          `;

          if (l.testCases && l.testCases.length > 0) {
            for (let tcIdx = 0; tcIdx < l.testCases.length; tcIdx++) {
              const tc = l.testCases[tcIdx];
              await sql`
                INSERT INTO test_cases (lesson_id, stdin, expected, hidden, "order")
                VALUES (${insertedLesson.id}, ${tc.stdin}, ${tc.expected}, ${tc.hidden}, ${tcIdx + 1})
              `;
            }
          }
        }
      }
    }

    console.log("SUCCESS: Database fully seeded with 5 new courses!");
    
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

main();
