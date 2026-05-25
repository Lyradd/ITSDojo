const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'seed-data.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const dmIndex = data.findIndex(c => c.id === 'data-mining');
if (dmIndex !== -1) {
  data[dmIndex].units = [
    {
      title: 'Unit 1: Preprocessing Data',
      description: 'Pemrosesan data dasar sebelum diolah oleh mesin pembelajaran.',
      lessons: [
        {
          title: 'Mengubah Nilai Negatif',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Imputasi Sederhana</h3><p>Terkadang data memiliki nilai negatif yang tidak masuk akal (misalnya umur -5). Kita harus mengubahnya menjadi 0.</p>',
          problemTitle: 'Ubah Negatif Jadi Nol',
          problemDescription: 'Diberikan satu buah angka. Jika angka tersebut kurang dari 0, cetak 0. Jika tidak, cetak angka tersebut apa adanya.',
          defaultLanguage: 'python',
          starterCode: 'angka = int(input())\n\n# Tambahkan if-else di bawah ini',
          sampleInput: '-5',
          sampleOutput: '0',
          testCases: [
            { stdin: '-5', expected: '0', hidden: false },
            { stdin: '20', expected: '20', hidden: false }
          ]
        },
        {
          title: 'Mencari Nilai Terbesar',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/9ast9_4Nglw',
          summaryContent: '<h3>Max Value</h3><p>Dalam Min-Max Scaling, kita harus bisa mencari nilai terbesar dalam sekumpulan data.</p>',
          problemTitle: 'Nilai Maksimum',
          problemDescription: 'Diberikan 3 buah angka di baris yang berbeda. Cetak angka mana yang paling besar.',
          defaultLanguage: 'python',
          starterCode: 'a = int(input())\nb = int(input())\nc = int(input())\n\n# Cetak nilai terbesarnya',
          sampleInput: '10\n50\n20',
          sampleOutput: '50',
          testCases: [
            { stdin: '10\n50\n20', expected: '50', hidden: false },
            { stdin: '5\n2\n9', expected: '9', hidden: false }
          ]
        },
        {
          title: 'Pengkodean Kategori',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Label Encoding</h3><p>Merubah nilai huruf menjadi nilai angka agar bisa diolah mesin.</p>',
          problemTitle: 'Konversi Kategori',
          problemDescription: 'Diberikan satu karakter. Jika karakter tersebut adalah "A", cetak 1. Jika "B", cetak 2. Selain itu cetak 0.',
          defaultLanguage: 'python',
          starterCode: 'kat = input()\n\n# Cek apakah A, B, atau lainnya',
          sampleInput: 'A',
          sampleOutput: '1',
          testCases: [
            { stdin: 'A', expected: '1', hidden: false },
            { stdin: 'B', expected: '2', hidden: false },
            { stdin: 'X', expected: '0', hidden: true }
          ]
        }
      ]
    },
    {
      title: 'Unit 2: Klasifikasi K-NN Dasar',
      description: 'Mengenal konsep kedekatan jarak untuk mengklasifikasi data.',
      lessons: [
        {
          title: 'Menghitung Jarak 1D',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/4HKqjENq9OU',
          summaryContent: '<h3>Jarak Mutlak (Absolute)</h3><p>Jarak antar dua titik pada garis lurus tidak pernah negatif, sehingga menggunakan nilai mutlak (Absolute).</p>',
          problemTitle: 'Jarak Absolut',
          problemDescription: 'Diberikan titik A dan titik B. Hitung jaraknya dengan rumus nilai mutlak |A - B| (bisa menggunakan fungsi abs()).',
          defaultLanguage: 'python',
          starterCode: 'a = int(input())\nb = int(input())\n\nprint(abs(a - b))',
          sampleInput: '10\n4',
          sampleOutput: '6',
          testCases: [
            { stdin: '10\n4', expected: '6', hidden: false },
            { stdin: '2\n10', expected: '8', hidden: false }
          ]
        },
        {
          title: 'Titik Terdekat',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/UqYde-LJWls',
          summaryContent: '<h3>Nearest Neighbor</h3><p>Menentukan titik mana yang memiliki jarak terkecil ke sebuah titik tujuan.</p>',
          problemTitle: 'Siapa Lebih Dekat?',
          problemDescription: 'Diberikan titik Tujuan (T), lalu titik A dan B. Cetak "A" jika A lebih dekat ke T. Cetak "B" jika B lebih dekat ke T.',
          defaultLanguage: 'python',
          starterCode: 't = int(input())\na = int(input())\nb = int(input())\n\n# Hitung jarak dan bandingkan',
          sampleInput: '10\n8\n15',
          sampleOutput: 'A',
          testCases: [
            { stdin: '10\n8\n15', expected: 'A', hidden: false },
            { stdin: '0\n-5\n2', expected: 'B', hidden: false }
          ]
        },
        {
          title: 'Voting Kelas Mayoritas',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Voting</h3><p>Algoritma akan memilih label dengan jumlah terbanyak (mayoritas).</p>',
          problemTitle: 'Mayoritas 3 Pemilih',
          problemDescription: 'Diberikan 3 buah suara di baris berbeda, masing-masing bernilai "A" atau "B". Cetak huruf apa yang menang (paling banyak muncul).',
          defaultLanguage: 'python',
          starterCode: 'v1 = input()\nv2 = input()\nv3 = input()\n\n# Hitung siapa yang mayoritas',
          sampleInput: 'A\nA\nB',
          sampleOutput: 'A',
          testCases: [
            { stdin: 'A\nA\nB', expected: 'A', hidden: false },
            { stdin: 'B\nA\nB', expected: 'B', hidden: false }
          ]
        }
      ]
    },
    {
      title: 'Unit 3: Clustering K-Means Dasar',
      description: 'Pengelompokan data ke titik pusat (centroid).',
      lessons: [
        {
          title: 'Menentukan Titik Tengah',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/4b5d3muPQmA',
          summaryContent: '<h3>Centroid</h3><p>Titik pusat sebuah kelompok didapat dengan mencari nilai rata-rata dari seluruh anggotanya.</p>',
          problemTitle: 'Rata-Rata Dua Titik',
          problemDescription: 'Diberikan titik A dan titik B. Cetak titik tengahnya (rata-ratanya), lakukan pembagian bulat (menggunakan //).',
          defaultLanguage: 'python',
          starterCode: 'a = int(input())\nb = int(input())\n\nprint((a + b) // 2)',
          sampleInput: '10\n20',
          sampleOutput: '15',
          testCases: [
            { stdin: '10\n20', expected: '15', hidden: false },
            { stdin: '0\n100', expected: '50', hidden: false }
          ]
        },
        {
          title: 'Pengelompokan Data',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Assignment</h3><p>Tugas kita adalah memasukkan sebuah data ke kelompok dengan Centroid terdekat.</p>',
          problemTitle: 'Pilih Kelompok',
          problemDescription: 'Kelompok 1 (C1) selalu ada di titik 0. Kelompok 2 (C2) selalu ada di titik 100. Diberikan titik data X, cetak "1" jika X lebih dekat ke 0, cetak "2" jika lebih dekat ke 100.',
          defaultLanguage: 'python',
          starterCode: 'x = int(input())\n\n# Apakah X lebih dekat ke 0 atau 100?',
          sampleInput: '30',
          sampleOutput: '1',
          testCases: [
            { stdin: '30', expected: '1', hidden: false },
            { stdin: '80', expected: '2', hidden: false },
            { stdin: '40', expected: '1', hidden: true }
          ]
        },
        {
          title: 'Evaluasi Jarak',
          duration: '10 menit',
          videoUrl: 'https://www.youtube.com/embed/AWbM-kS3bC4',
          summaryContent: '<h3>Total Error</h3><p>Kita mengevaluasi bagus tidaknya cluster dengan menjumlahkan seluruh jarak titik ke pusatnya.</p>',
          problemTitle: 'Total Jarak Absolute',
          problemDescription: 'Diberikan titik pusat C, dan dua titik data X serta Y. Hitung total jarak absolutnya: |X-C| + |Y-C|.',
          defaultLanguage: 'python',
          starterCode: 'c = int(input())\nx = int(input())\ny = int(input())\n\ntotal = abs(x - c) + abs(y - c)\nprint(total)',
          sampleInput: '10\n8\n15',
          sampleOutput: '7',
          testCases: [
            { stdin: '10\n8\n15', expected: '7', hidden: false },
            { stdin: '0\n10\n-5', expected: '15', hidden: false }
          ]
        }
      ]
    }
  ];
  
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Data Mining course completely simplified in db/seed-data.json');
} else {
  console.log('Error: data-mining course not found!');
}
