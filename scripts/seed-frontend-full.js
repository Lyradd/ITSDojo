require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Starting seed script...");
  
  try {
    // 1. Pastikan Kursus 'fe-basic' ada
    console.log("Ensuring 'fe-basic' course exists...");
    await sql`
      INSERT INTO courses (id, title, description, color, difficulty, xp_reward, required_semester)
      VALUES (
        'fe-basic', 
        'Front-End Web Development', 
        'Kuasai dasar-dasar HTML5, CSS3 modern, responsivitas website, serta interaktivitas JavaScript ES6.', 
        'bg-gradient-to-r from-blue-500 to-indigo-600', 
        'Beginner', 
        500, 
        1
      )
      ON CONFLICT (id) DO UPDATE 
      SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;
    `;

    // 2. Dapatkan atau bersihkan unit lama dari course 'fe-basic' agar bersih untuk testing
    console.log("Cleaning old units and lessons for clean test environment...");
    await sql`DELETE FROM units WHERE course_id = 'fe-basic';`;

    // Data 5 Unit dengan masing-masing 5 Lessons
    const unitsData = [
      {
        title: "Unit 1: Dasar-Dasar HTML5 & Semantik",
        description: "Kuasai markup dasar, struktur elemen HTML, serta penulisan kode semantik yang SEO-friendly.",
        lessons: [
          {
            title: "Pengenalan Tag HTML & Struktur Dasar",
            description: "Belajar membuat kerangka dokumen HTML lengkap dengan elemen head dan body.",
            duration: "10 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>HTML Dasar</h3><p>HTML (HyperText Markup Language) adalah bahasa standar untuk membuat website. Setiap dokumen diawali dengan <code>&lt;!DOCTYPE html&gt;</code> dan dibungkus di dalam tag <code>&lt;html&gt;</code>.</p>",
            problemTitle: "Hello World HTML",
            problemDescription: "Buat kode HTML dasar yang mencetak tulisan 'Hello World!' menggunakan tag h1.",
            problemCategory: "HTML Basics",
            starterCode: "<!-- Buat tag h1 di sini -->",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "<h1>Hello World!</h1>",
            testCases: [
              { stdin: "", expected: "<h1>Hello World!</h1>", hidden: false }
            ]
          },
          {
            title: "Elemen Teks, Heading, & List",
            description: "Mengatur tata letak teks menggunakan heading (h1-h6), paragraf, dan daftar berurutan.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Elemen Teks</h3><p>Gunakan tag <code>&lt;h1&gt;</code> sampai <code>&lt;h6&gt;</code> untuk judul penting, tag <code>&lt;p&gt;</code> untuk paragraf, dan tag <code>&lt;ol&gt;</code>/<code>&lt;ul&gt;</code> untuk daftar list.</p>",
            problemTitle: "Membuat List Belanja",
            problemDescription: "Buat daftar belanja tidak terurut (ul) berisi 3 item: Apel, Mangga, Pisang.",
            problemCategory: "HTML Basics",
            starterCode: "<ul>\n  <!-- tambahkan list item (li) di sini -->\n</ul>",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "<ul>\n  <li>Apel</li>\n  <li>Mangga</li>\n  <li>Pisang</li>\n</ul>",
            testCases: [
              { stdin: "", expected: "<ul>\n  <li>Apel</li>\n  <li>Mangga</li>\n  <li>Pisang</li>\n</ul>", hidden: false }
            ]
          },
          {
            title: "Bekerja dengan Media & Gambar",
            description: "Belajar menyisipkan gambar dengan atribut src dan alt, serta video interaktif.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Tag Gambar</h3><p>Gunakan tag <code>&lt;img&gt;</code> dengan atribut wajib <code>src</code> untuk path gambar dan <code>alt</code> untuk deskripsi alternatif jika gambar gagal dimuat.</p>",
            problemTitle: "Atribut Alt Gambar",
            problemDescription: "Buat elemen gambar (img) yang memuat gambar 'logo.png' dengan alt 'Logo ITS'.",
            problemCategory: "HTML Media",
            starterCode: "<img src=\"logo.png\" />",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "<img src=\"logo.png\" alt=\"Logo ITS\" />",
            testCases: [
              { stdin: "", expected: "<img src=\"logo.png\" alt=\"Logo ITS\" />", hidden: false }
            ]
          },
          {
            title: "Link, Anchor, & Navigasi",
            description: "Menghubungkan halaman web satu sama lain menggunakan anchor tag (a) dan link eksternal.",
            duration: "10 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Anchor Tag</h3><p>Tag <code>&lt;a href=\"url\"&gt;</code> digunakan untuk membuat hyperlink. Tambahkan <code>target=\"_blank\"</code> jika ingin membuka link di tab baru.</p>",
            problemTitle: "Hyperlink Dasar",
            problemDescription: "Buat link (anchor) menuju 'https://its.ac.id' dengan teks 'Website ITS'.",
            problemCategory: "HTML Navigation",
            starterCode: "<a href=\"\"></a>",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "<a href=\"https://its.ac.id\">Website ITS</a>",
            testCases: [
              { stdin: "", expected: "<a href=\"https://its.ac.id\">Website ITS</a>", hidden: false }
            ]
          },
          {
            title: "Struktur Semantik HTML5 Modern",
            description: "Membedakan tag non-semantik (div, span) dengan tag semantik seperti header, main, section, dan footer.",
            duration: "15 menit",
            xpReward: 60,
            gemReward: 15,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>HTML5 Semantik</h3><p>Tag semantik memberikan makna langsung pada struktur halaman web Anda bagi browser maupun mesin pencari (SEO). Elemen penting meliputi <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, dan <code>&lt;footer&gt;</code>.</p>",
            problemTitle: "Kerangka Semantik",
            problemDescription: "Buatlah kerangka artikel semantik yang memuat tag <article> dan berisi tag <header> di dalamnya.",
            problemCategory: "HTML Semantics",
            starterCode: "<!-- Tulis di sini -->",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "<article>\n  <header>Judul Artikel</header>\n</article>",
            testCases: [
              { stdin: "", expected: "<article>\n  <header>Judul Artikel</header>\n</article>", hidden: false }
            ]
          }
        ]
      },
      {
        title: "Unit 2: Styling Modern dengan CSS3",
        description: "Menghias halaman web Anda menggunakan warna, margin, selektor canggih, dan konsep box model.",
        lessons: [
          {
            title: "Selektor CSS & Styling Dasar",
            description: "Cara menghubungkan CSS ke HTML dan mengaplikasikan selektor class, id, serta tag.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>CSS Selektor</h3><p>Selektor digunakan untuk mencari elemen HTML yang ingin dihias. <code>.class-name</code> untuk class, <code>#id-name</code> untuk id, dan langsung nama tag untuk menghias seluruh elemen sejenis.</p>",
            problemTitle: "Styling Warna Teks",
            problemDescription: "Buat aturan CSS sederhana untuk mengubah warna teks kelas '.title' menjadi biru (blue).",
            problemCategory: "CSS Selectors",
            starterCode: ".title {\n  /* Tulis properti di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".title {\n  color: blue;\n}",
            testCases: [
              { stdin: "", expected: ".title {\n  color: blue;\n}", hidden: false }
            ]
          },
          {
            title: "Memahami Konsep CSS Box Model",
            description: "Belajar mengatur margin, border, padding, dan lebar/tinggi elemen agar tidak bertabrakan.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Box Model</h3><p>Setiap elemen HTML dianggap sebagai kotak. Lapisan terdalam adalah <b>content</b>, diikuti oleh <b>padding</b> (jarak dalam), <b>border</b> (bingkai), dan <b>margin</b> (jarak luar).</p>",
            problemTitle: "Reset Margin & Padding",
            problemDescription: "Buat aturan CSS universal (*) yang mengatur margin dan padding menjadi 0.",
            problemCategory: "CSS Box Model",
            starterCode: "* {\n  /* Tulis di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "* {\n  margin: 0;\n  padding: 0;\n}",
            testCases: [
              { stdin: "", expected: "* {\n  margin: 0;\n  padding: 0;\n}", hidden: false }
            ]
          },
          {
            title: "Layouting dengan Flexbox Dasar",
            description: "Mengatur posisi item secara horizontal maupun vertikal dengan sangat mudah menggunakan display flex.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Flexbox</h3><p>Display flex mengubah elemen menjadi kontainer fleksibel. Gunakan <code>justify-content</code> untuk mengatur posisi sumbu utama (main axis) dan <code>align-items</code> untuk sumbu silang (cross axis).</p>",
            problemTitle: "Tengah Sempurna",
            problemDescription: "Gunakan flexbox pada kontainer '.container' untuk membuat isi di dalamnya tepat berada di tengah secara horizontal.",
            problemCategory: "CSS Layout",
            starterCode: ".container {\n  display: flex;\n  /* tambahkan properti di bawah */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".container {\n  display: flex;\n  justify-content: center;\n}",
            testCases: [
              { stdin: "", expected: ".container {\n  display: flex;\n  justify-content: center;\n}", hidden: false }
            ]
          },
          {
            title: "Sistem Grid Tata Letak 2 Dimensi",
            description: "Membuat tata letak baris dan kolom yang kompleks dengan CSS Grid.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>CSS Grid</h3><p>Berbeda dengan Flexbox yang fokus 1 dimensi, CSS Grid didesain untuk tata letak 2 dimensi (baris dan kolom sekaligus). Gunakan properti <code>grid-template-columns</code>.</p>",
            problemTitle: "Membuat 3 Kolom",
            problemDescription: "Buat layout grid dengan 3 kolom berukuran sama (1fr) pada kelas '.grid-container'.",
            problemCategory: "CSS Layout",
            starterCode: ".grid-container {\n  display: grid;\n  /* tulis di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}",
            testCases: [
              { stdin: "", expected: ".grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}", hidden: false }
            ]
          },
          {
            title: "Pseudo-Classes & Hover Effect",
            description: "Menambahkan interaktivitas CSS sederhana saat elemen dilewati kursor atau diklik.",
            duration: "12 menit",
            xpReward: 60,
            gemReward: 15,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Pseudo-class</h3><p>Pseudo-class digunakan untuk mendefinisikan keadaan khusus suatu elemen. Contoh populer adalah <code>:hover</code> (saat kursor di atas elemen) dan <code>:active</code> (saat elemen diklik).</p>",
            problemTitle: "Hover Button",
            problemDescription: "Ubah warna latar belakang '.btn:hover' menjadi merah (red).",
            problemCategory: "CSS Interactive",
            starterCode: ".btn:hover {\n  /* tulis di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".btn:hover {\n  background-color: red;\n}",
            testCases: [
              { stdin: "", expected: ".btn:hover {\n  background-color: red;\n}", hidden: false }
            ]
          }
        ]
      },
      {
        title: "Unit 3: Animasi & Responsivitas CSS",
        description: "Membuat website Anda tampil sempurna di HP/Tablet dengan animasi transisi yang memukau.",
        lessons: [
          {
            title: "Media Queries & Responsive Web",
            description: "Dasar membuat layout adaptif menggunakan batas lebar layar (breakpoints).",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Media Queries</h3><p>Gunakan <code>@media (max-width: 768px)</code> untuk menerapkan gaya khusus hanya pada layar ukuran tablet ke bawah.</p>",
            problemTitle: "Mobile Styling",
            problemDescription: "Buat media query untuk layar maksimal lebar 600px yang mengubah warna body menjadi hitam.",
            problemCategory: "CSS Responsive",
            starterCode: "/* Tulis media query di bawah */",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "@media (max-width: 600px) {\n  body {\n    background-color: black;\n  }\n}",
            testCases: [
              { stdin: "", expected: "@media (max-width: 600px) {\n  body {\n    background-color: black;\n  }\n}", hidden: false }
            ]
          },
          {
            title: "Transisi CSS yang Halus",
            description: "Membuat perubahan warna dan ukuran terasa lembut menggunakan properti transition.",
            duration: "10 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Transitions</h3><p>Gunakan properti <code>transition: all 0.3s ease;</code> agar perubahan state (seperti hover) tidak patah-patah.</p>",
            problemTitle: "Transisi Warna",
            problemDescription: "Tambahkan efek transisi pada kelas '.box' untuk seluruh properti selama 0.5 detik.",
            problemCategory: "CSS Animation",
            starterCode: ".box {\n  /* tulis di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".box {\n  transition: all 0.5s;\n}",
            testCases: [
              { stdin: "", expected: ".box {\n  transition: all 0.5s;\n}", hidden: false }
            ]
          },
          {
            title: "Transformasi 2D & 3D",
            description: "Memutar (rotate), menggeser (translate), dan memperbesar (scale) elemen HTML.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>CSS Transform</h3><p>Properti <code>transform</code> memungkinkan Anda mengubah bentuk elemen. Contoh: <code>transform: rotate(45deg);</code>.</p>",
            problemTitle: "Membesarkan Elemen",
            problemDescription: "Gunakan transform untuk memperbesar kelas '.zoom' menjadi 2 kali lipat.",
            problemCategory: "CSS Transform",
            starterCode: ".zoom {\n  /* tulis di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: ".zoom {\n  transform: scale(2);\n}",
            testCases: [
              { stdin: "", expected: ".zoom {\n  transform: scale(2);\n}", hidden: false }
            ]
          },
          {
            title: "Keyframes & Custom Animations",
            description: "Membuat siklus animasi berulang secara otomatis tanpa interaksi kursor.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>@keyframes</h3><p>Keyframes mendefinisikan langkah-langkah animasi dari 0% (mulai) hingga 100% (selesai). Jalankan menggunakan properti <code>animation</code>.</p>",
            problemTitle: "Animasi Fade In",
            problemDescription: "Buat aturan keyframes bernama 'fade' yang mengubah opacity dari 0 ke 1.",
            problemCategory: "CSS Animation",
            starterCode: "@keyframes fade {\n  /* tulis langkah di sini */\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "@keyframes fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}",
            testCases: [
              { stdin: "", expected: "@keyframes fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}", hidden: false }
            ]
          },
          {
            title: "Variabel CSS & Dark Mode",
            description: "Menyimpan token warna dalam variabel CSS agar mudah mengganti tema malam/siang.",
            duration: "15 menit",
            xpReward: 60,
            gemReward: 15,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>CSS Variables</h3><p>Deklarasikan variabel dengan tanda strip ganda <code>--primary-color: #3b82f6;</code> dan panggil menggunakan fungsi <code>var(--primary-color)</code>.</p>",
            problemTitle: "Memanggil Variabel",
            problemDescription: "Gunakan variabel '--bg-color' sebagai warna latar belakang pada body.",
            problemCategory: "CSS Variables",
            starterCode: "body {\n  background-color: /* panggil variabel di sini */;\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "body {\n  background-color: var(--bg-color);\n}",
            testCases: [
              { stdin: "", expected: "body {\n  background-color: var(--bg-color);\n}", hidden: false }
            ]
          }
        ]
      },
      {
        title: "Unit 4: Dasar Logika JavaScript (ES6)",
        description: "Mulai belajar memprogram dengan memahami variabel, tipe data, kondisi logic, dan perulangan.",
        lessons: [
          {
            title: "Variabel & Tipe Data",
            description: "Menggunakan let dan const untuk menampung data angka, teks, maupun boolean.",
            duration: "10 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>JavaScript Variables</h3><p><code>const</code> digunakan untuk variabel konstan yang nilainya tidak akan berubah, sedangkan <code>let</code> digunakan jika nilainya dapat diubah di kemudian waktu.</p>",
            problemTitle: "Membuat Variabel",
            problemDescription: "Buat variabel const bernama 'ipk' yang berisi nilai angka desimal 4.0.",
            problemCategory: "JS Basics",
            starterCode: "// Tulis variabel di sini",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const ipk = 4.0;",
            testCases: [
              { stdin: "", expected: "const ipk = 4.0;", hidden: false }
            ]
          },
          {
            title: "Percabangan Logic (If / Else)",
            description: "Membuat alur keputusan program berdasarkan evaluasi kondisi benar atau salah.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Logic Condition</h3><p>Gunakan struktur <code>if (kondisi) { ... } else { ... }</code> untuk menjalankan blok kode tertentu ketika suatu kondisi terpenuhi.</p>",
            problemTitle: "Cek Kelulusan",
            problemDescription: "Buat fungsi logic sederhana dalam JavaScript yang mengembalikan string 'LULUS' jika nilai >= 75.",
            problemCategory: "JS Conditionals",
            starterCode: "function cekNilai(skor) {\n  // tulis di sini\n}",
            defaultLanguage: "javascript",
            sampleInput: "75",
            sampleOutput: "LULUS",
            testCases: [
              { stdin: "75", expected: "function cekNilai(skor) {\n  if (skor >= 75) return 'LULUS';\n}", hidden: false }
            ]
          },
          {
            title: "Array & Looping",
            description: "Menyimpan kumpulan data di dalam Array dan memprosesnya secara otomatis menggunakan for-loop.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Array & Loops</h3><p>Array dibungkus menggunakan tanda kurung siku <code>[item1, item2]</code>. Untuk memutar data di dalamnya, kita bisa memakai method bawaan <code>forEach</code> atau standard <code>for</code> loop.</p>",
            problemTitle: "Array Angka",
            problemDescription: "Deklarasikan array bernama 'nomor' yang menampung angka 1, 2, 3.",
            problemCategory: "JS Arrays",
            starterCode: "// deklarasikan array di sini",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const nomor = [1, 2, 3];",
            testCases: [
              { stdin: "", expected: "const nomor = [1, 2, 3];", hidden: false }
            ]
          },
          {
            title: "Fungsi & Arrow Functions Modern",
            description: "Membuat kumpulan instruksi yang dapat digunakan berulang kali dengan parameter input.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>JavaScript Functions</h3><p>ES6 memperkenalkan sintaks fungsi yang lebih ringkas menggunakan simbol panah (arrow function): <code>const namaFungsi = () => { ... }</code>.</p>",
            problemTitle: "Fungsi Tambah Satu",
            problemDescription: "Buat arrow function bernama 'tambahSatu' yang menerima parameter x dan mengembalikan x + 1.",
            problemCategory: "JS Functions",
            starterCode: "const tambahSatu = (x) => {\n  // tulis di sini\n}",
            defaultLanguage: "javascript",
            sampleInput: "5",
            sampleOutput: "6",
            testCases: [
              { stdin: "5", expected: "const tambahSatu = (x) => x + 1;", hidden: false }
            ]
          },
          {
            title: "Manipulasi Array Tingkat Lanjut (Map & Filter)",
            description: "Mentransformasi dan menyaring data di dalam array secara elegan tanpa loop manual.",
            duration: "15 menit",
            xpReward: 60,
            gemReward: 15,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Map & Filter</h3><p><code>map()</code> menghasilkan array baru dengan memodifikasi setiap item, sedangkan <code>filter()</code> menyaring item berdasarkan kondisi boolean.</p>",
            problemTitle: "Menyaring Angka Genap",
            problemDescription: "Gunakan filter() untuk menyaring angka genap saja dari array nomor.",
            problemCategory: "JS Arrays",
            starterCode: "const genap = angka.filter(n => /* tulis kondisi */);",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const genap = angka.filter(n => n % 2 === 0);",
            testCases: [
              { stdin: "", expected: "const genap = angka.filter(n => n % 2 === 0);", hidden: false }
            ]
          }
        ]
      },
      {
        title: "Unit 5: Manipulasi DOM & Event Handling",
        description: "Menghubungkan logika JavaScript ke HTML agar website Anda interaktif, dinamis, dan hidup.",
        lessons: [
          {
            title: "Memilih Elemen HTML (DOM Selectors)",
            description: "Belajar cara mencari dan memegang elemen HTML dari file JS menggunakan querySelector.",
            duration: "10 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>DOM Selectors</h3><p>DOM (Document Object Model) menghubungkan halaman web ke skrip pemrograman. Gunakan <code>document.querySelector('#id')</code> untuk mengambil elemen tunggal.</p>",
            problemTitle: "Mengambil Judul",
            problemDescription: "Gunakan querySelector untuk mengambil elemen h1 dengan kelas '.header' dan simpan ke konstanta bernama 'judul'.",
            problemCategory: "JS DOM",
            starterCode: "const judul = /* tulis selector di sini */;",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const judul = document.querySelector('.header');",
            testCases: [
              { stdin: "", expected: "const judul = document.querySelector('.header');", hidden: false }
            ]
          },
          {
            title: "Mengubah Isi Konten & Atribut HTML",
            description: "Mengganti teks, HTML bagian dalam (innerHTML), serta mengganti class style dinamis.",
            duration: "12 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Ubah Konten DOM</h3><p>Gunakan properti <code>textContent</code> untuk mengubah teks biasa, atau <code>innerHTML</code> jika ingin menyisipkan elemen tag HTML baru ke dalam elemen tujuan.</p>",
            problemTitle: "Ubah Teks Paragraf",
            problemDescription: "Ubah properti textContent elemen 'p' menjadi string 'Berhasil!'.",
            problemCategory: "JS DOM",
            starterCode: "const p = document.querySelector('p');\n// tulis di bawah",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const p = document.querySelector('p');\np.textContent = 'Berhasil!';",
            testCases: [
              { stdin: "", expected: "p.textContent = 'Berhasil!';", hidden: false }
            ]
          },
          {
            title: "Menangkap Klik dengan Event Listeners",
            description: "Membuat tombol bereaksi saat diklik atau keyboard ditekan menggunakan addEventListener.",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Event Listeners</h3><p>Sintaks penulisan Event Listener adalah <code>element.addEventListener('click', () => { ... })</code> untuk menangani interaksi pengguna secara real-time.</p>",
            problemTitle: "Klik Alert",
            problemDescription: "Tambahkan event listener 'click' pada tombol 'btn' yang memanggil fungsi log.",
            problemCategory: "JS Events",
            starterCode: "btn.addEventListener('click', () => {\n  /* tulis di sini */\n});",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "btn.addEventListener('click', () => {\n  console.log('clicked');\n});",
            testCases: [
              { stdin: "", expected: "console.log('clicked');", hidden: false }
            ]
          },
          {
            title: "Mengambil Data Luar dengan Fetch API",
            description: "Dasar mengambil data dari server Backend (REST API) secara asynchronous (async/await).",
            duration: "15 menit",
            xpReward: 50,
            gemReward: 10,
            videoUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
            summaryContent: "<h3>Fetch API</h3><p>Fetch digunakan untuk request HTTP. Gunakan <code>async/await</code> agar kode asinkronus terlihat rapi seperti kode sinkronus.</p>",
            problemTitle: "Fungsi Fetch Sederhana",
            problemDescription: "Lakukan request fetch() ke endpoint '/api/data' dan konversi hasilnya ke JSON.",
            problemCategory: "JS Fetch",
            starterCode: "async function getData() {\n  const res = await fetch('/api/data');\n  // tulis di bawah\n}",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "async function getData() {\n  const res = await fetch('/api/data');\n  return await res.json();\n}",
            testCases: [
              { stdin: "", expected: "return await res.json();", hidden: false }
            ]
          },
          {
            title: "Membuat Aplikasi Todo List Sederhana",
            description: "Menggabungkan DOM selectors, event listeners, dan modifikasi array untuk membuat web app interaktif utuh.",
            duration: "20 menit",
            xpReward: 80,
            gemReward: 25,
            videoUrl: "https://www.youtube.com/embed/okpCxGp2tBI",
            summaryContent: "<h3>Mini Proyek DOM</h3><p>Dengan menggabungkan seluruh konsep manipulasi DOM, Anda dapat membangun aplikasi web modern yang kaya akan interaksi pengguna tanpa bantuan framework!</p>",
            problemTitle: "Menambah Item List",
            problemDescription: "Buat kode yang membuat elemen list baru 'li' menggunakan createElement dan menambahkannya ke list utama.",
            problemCategory: "JS Project",
            starterCode: "const li = /* buat element */;",
            defaultLanguage: "javascript",
            sampleInput: "",
            sampleOutput: "const li = document.createElement('li');",
            testCases: [
              { stdin: "", expected: "const li = document.createElement('li');", hidden: false }
            ]
          }
        ]
      }
    ];

    // 3. Masukkan unit dan lesson secara berurutan
    for (let uIdx = 0; uIdx < unitsData.length; uIdx++) {
      const u = unitsData[uIdx];
      console.log(`Inserting ${u.title}...`);
      
      const [insertedUnit] = await sql`
        INSERT INTO units (course_id, title, description, "order")
        VALUES ('fe-basic', ${u.title}, ${u.description}, ${uIdx + 1})
        RETURNING id;
      `;
      
      const unitId = insertedUnit.id;
      
      for (let lIdx = 0; lIdx < u.lessons.length; lIdx++) {
        const l = u.lessons[lIdx];
        
        const [insertedLesson] = await sql`
          INSERT INTO lessons (
            unit_id, title, "order", description, duration, xp_reward, gem_reward,
            video_url, summary_content, problem_title, problem_description, problem_category,
            starter_code, default_language, sample_input, sample_output
          )
          VALUES (
            ${unitId}, ${l.title}, ${lIdx + 1}, ${l.description}, ${l.duration}, ${l.xpReward}, ${l.gemReward},
            ${l.videoUrl}, ${l.summaryContent}, ${l.problemTitle}, ${l.problemDescription}, ${l.problemCategory},
            ${l.starterCode}, ${l.defaultLanguage}, ${l.sampleInput}, ${l.sampleOutput}
          )
          RETURNING id;
        `;
        
        const lessonId = insertedLesson.id;
        
        // Tambahkan test cases untuk lesson tersebut
        for (let tcIdx = 0; tcIdx < l.testCases.length; tcIdx++) {
          const tc = l.testCases[tcIdx];
          await sql`
            INSERT INTO test_cases (lesson_id, stdin, expected, hidden, "order")
            VALUES (${lessonId}, ${tc.stdin}, ${tc.expected}, ${tc.hidden}, ${tcIdx + 1});
          `;
        }
      }
    }

    console.log("SUCCESS: Database fully seeded with 5 Units and 25 Lessons!");
    
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

main();
