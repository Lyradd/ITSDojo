require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

// Inisialisasi koneksi Neon SQL (mirip dengan seed-frontend-full.js)
const sql = neon(process.env.DATABASE_URL);

async function seedUsers() {
  try {
    console.log('Starting users seed script...');

    // 1. Buat Users (Pre-seeded Accounts)
    console.log('Inserting pre-seeded users...');
    
    // Admin
    await sql`
      INSERT INTO users (id, name, email, role)
      VALUES ('admin-1', 'Super Admin', 'admin@itsdojo.id', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `;

    // Dosen
    await sql`
      INSERT INTO users (id, name, email, role)
      VALUES ('dosen-1', 'Dr. Budi Santoso', 'dosen@itsdojo.id', 'dosen')
      ON CONFLICT (email) DO NOTHING;
    `;

    // Asdos
    await sql`
      INSERT INTO users (id, name, email, role, semester)
      VALUES ('asdos-1', 'Kak Siti (Asdos)', 'asdos@itsdojo.id', 'asdos', 7)
      ON CONFLICT (email) DO NOTHING;
    `;

    // Mahasiswa
    await sql`
      INSERT INTO users (id, name, email, role, semester)
      VALUES ('mahasiswa-1', 'Mahasiswa Teladan', 'siswa@itsdojo.id', 'mahasiswa', 3)
      ON CONFLICT (email) DO NOTHING;
    `;
    
    console.log('Users inserted successfully!');

    // Ambil ID dosen & asdos (berjaga-jaga jika ID tergenerate beda kalau pakai UUID, tapi kita hardcode di atas)
    const dosenId = 'dosen-1';
    const asdosId = 'asdos-1';
    const studentId = 'mahasiswa-1';
    const courseId = 'fe-basic'; // Course yang sudah ada dari seed sebelumnya

    // 2. Hubungkan Dosen ke Course (course_instructors)
    console.log('Assigning Dosen to fe-basic...');
    await sql`
      INSERT INTO course_instructors (course_id, dosen_id)
      VALUES (${courseId}, ${dosenId})
      ON CONFLICT DO NOTHING;
    `.catch(e => {
        // Abaikan error jika tabel belum ada (karena user belum db:push) atau duplikat
        console.log('Note: course_instructors push might be pending.');
    });

    // 3. Hubungkan Asdos ke Course (course_assistants)
    console.log('Assigning Asdos to fe-basic...');
    await sql`
      INSERT INTO course_assistants (course_id, asdos_id)
      VALUES (${courseId}, ${asdosId})
      ON CONFLICT DO NOTHING;
    `.catch(e => {
        console.log('Note: course_assistants push might be pending.');
    });

    // 4. Enroll Mahasiswa ke Course (enrollments)
    console.log('Enrolling Mahasiswa to fe-basic...');
    await sql`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES (${studentId}, ${courseId}, 'accepted')
      ON CONFLICT DO NOTHING;
    `;

    console.log('SUCCESS: Pre-seeded users and assignments completed!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
