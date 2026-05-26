const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'seed-data.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const dmIndex = data.findIndex(c => c.id === 'data-mining');
if (dmIndex !== -1) {
  data[dmIndex].units = [
    {
      title: 'Unit 1: Preprocessing & Data Cleaning',
      description: 'Langkah awal untuk membersihkan dataset dari noise dan missing values sebelum masuk ke model.',
      lessons: [
        {
          title: 'Konsep Missing Values',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0', // Placeholder video
          summaryContent: '<h3>Missing Values</h3><p>Dalam dataset dunia nyata, data seringkali tidak lengkap. Kita bisa menghapusnya (drop) atau mengisi nilainya (imputation).</p>',
          problemTitle: 'Imputasi Rata-Rata',
          problemDescription: 'Diberikan serangkaian angka. Ada satu angka yang hilang direpresentasikan dengan -1. Ganti nilai -1 tersebut dengan rata-rata (dibulatkan ke bawah) dari angka-angka lainnya.',
          defaultLanguage: 'python',
          starterCode: 'n = int(input())\nnums = []\nfor i in range(n):\n    nums.append(int(input()))\n\n# Kerjakan dari sini',
          sampleInput: '4\n10\n-1\n20\n30',
          sampleOutput: '20',
          testCases: [{ stdin: '4\n10\n-1\n20\n30', expected: '20', hidden: false }]
        },
        {
          title: 'Normalisasi Min-Max',
          duration: '20 menit',
          videoUrl: 'https://www.youtube.com/embed/9ast9_4Nglw', 
          summaryContent: '<h3>Min-Max Scaling</h3><p>Mengubah skala fitur numerik agar berada pada rentang 0 hingga 1. Rumusnya adalah (x - min) / (max - min).</p>',
          problemTitle: 'Skala ke 0-1',
          problemDescription: 'Diberikan list N bilangan bulat. Normalisasi array tersebut menggunakan Min-Max scaling, dan cetak nilai minimum serta maksimum aslinya di baris pertama.',
          defaultLanguage: 'python',
          starterCode: 'n = int(input())\nnums = [int(input()) for _ in range(n)]\n\n# Temukan min dan max lalu cetak',
          sampleInput: '3\n10\n20\n30',
          sampleOutput: 'Min: 10, Max: 30',
          testCases: [{ stdin: '3\n10\n20\n30', expected: 'Min: 10, Max: 30', hidden: false }]
        },
        {
          title: 'Encoding Variabel Kategorikal',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0', 
          summaryContent: '<h3>Label Encoding</h3><p>Algoritma Machine Learning membutuhkan input berupa angka. Label Encoding merubah string kategori menjadi angka (0, 1, 2, dst).</p>',
          problemTitle: 'Label Encoder Sederhana',
          problemDescription: 'Diberikan 3 kata kategori (misal: "Merah", "Hijau", "Merah"). Outputkan bentuk angkanya jika Merah=0, Hijau=1, Biru=2.',
          defaultLanguage: 'python',
          starterCode: 'a = input()\nb = input()\nc = input()\n# Cetak angka yang sesuai',
          sampleInput: 'Merah\nHijau\nMerah',
          sampleOutput: '0\n1\n0',
          testCases: [{ stdin: 'Merah\nHijau\nMerah', expected: '0\n1\n0', hidden: false }]
        }
      ]
    },
    {
      title: 'Unit 2: Algoritma Klasifikasi (K-NN)',
      description: 'Klasifikasi berbasis kedekatan jarak untuk memprediksi kelas data baru.',
      lessons: [
        {
          title: 'Hitung Jarak Euclidean',
          duration: '20 menit',
          videoUrl: 'https://www.youtube.com/embed/4HKqjENq9OU',
          summaryContent: '<h3>K-Nearest Neighbors (KNN)</h3><p>Inti dari K-NN adalah jarak Euclidean: sqrt((x2-x1)^2 + (y2-y1)^2).</p>',
          problemTitle: 'Jarak 2D',
          problemDescription: 'Hitung jarak kuadrat antara A(x1, y1) dan B(x2, y2).',
          defaultLanguage: 'python',
          starterCode: 'x1 = int(input())\ny1 = int(input())\nx2 = int(input())\ny2 = int(input())\nprint((x2 - x1)**2 + (y2 - y1)**2)',
          sampleInput: '0\n0\n3\n4',
          sampleOutput: '25',
          testCases: [{ stdin: '0\n0\n3\n4', expected: '25', hidden: false }, { stdin: '1\n1\n4\n5', expected: '25', hidden: false }]
        },
        {
          title: 'Mencari Tetangga Terdekat (1D)',
          duration: '20 menit',
          videoUrl: 'https://www.youtube.com/embed/UqYde-LJWls',
          summaryContent: '<h3>1D K-NN</h3><p>Mencari titik terdekat di sumbu 1D.</p>',
          problemTitle: 'Titik Terdekat',
          problemDescription: 'Cari jarak terkecil dari titik referensi R ke titik-titik data.',
          defaultLanguage: 'python',
          starterCode: 'r = int(input())\nn = int(input())\nmin_dist = 999999\nfor i in range(n):\n    x = int(input())\n    dist = abs(r - x)\n    if dist < min_dist:\n        min_dist = dist\nprint(min_dist)',
          sampleInput: '10\n3\n5\n12\n20',
          sampleOutput: '2',
          testCases: [{ stdin: '10\n3\n5\n12\n20', expected: '2', hidden: false }]
        },
        {
          title: 'Voting Kelas (Mayoritas)',
          duration: '25 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Voting pada K-NN</h3><p>Setelah mendapatkan K tetangga, kita melakukan voting. Kelas dengan vote terbanyak yang menang.</p>',
          problemTitle: 'Menghitung Mayoritas',
          problemDescription: 'Diberikan K kelas tetangga terdekat (A atau B). Tentukan kelas mayoritasnya.',
          defaultLanguage: 'python',
          starterCode: 'k = int(input())\nvotes_A = 0\nvotes_B = 0\nfor i in range(k):\n    v = input()\n    if v == "A":\n        votes_A += 1\n    else:\n        votes_B += 1\n# Cetak A jika A lebih besar, sebaliknya B',
          sampleInput: '3\nA\nB\nA',
          sampleOutput: 'A',
          testCases: [{ stdin: '3\nA\nB\nA', expected: 'A', hidden: false }, { stdin: '5\nB\nB\nA\nB\nA', expected: 'B', hidden: false }]
        }
      ]
    },
    {
      title: 'Unit 3: Algoritma Clustering (K-Means)',
      description: 'Pengelompokan data tanpa label (Unsupervised Learning) berdasarkan kesamaan fitur.',
      lessons: [
        {
          title: 'Konsep Centroid',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/4b5d3muPQmA',
          summaryContent: '<h3>Centroid (Titik Pusat)</h3><p>Titik pusat sebuah cluster dihitung dengan merata-ratakan semua titik di dalam cluster tersebut.</p>',
          problemTitle: 'Menghitung Centroid 1D',
          problemDescription: 'Diberikan N titik data. Hitung centroid-nya (rata-ratanya, dibulatkan ke bawah).',
          defaultLanguage: 'python',
          starterCode: 'n = int(input())\nsum = 0\nfor i in range(n):\n    sum += int(input())\nprint(sum // n)',
          sampleInput: '4\n10\n20\n30\n40',
          sampleOutput: '25',
          testCases: [{ stdin: '4\n10\n20\n30\n40', expected: '25', hidden: false }]
        },
        {
          title: 'Assignment Cluster',
          duration: '20 menit',
          videoUrl: 'https://www.youtube.com/embed/KJgsSFOSQv0',
          summaryContent: '<h3>Assignment</h3><p>Setiap data point akan dimasukkan ke cluster yang jarak Centroid-nya paling dekat dengannya.</p>',
          problemTitle: 'Assign ke Centroid',
          problemDescription: 'Ada 2 Centroid: C1 dan C2. Diberikan satu titik data P, cetak "C1" jika P lebih dekat ke C1, atau "C2" jika P lebih dekat ke C2.',
          defaultLanguage: 'python',
          starterCode: 'c1 = int(input())\nc2 = int(input())\np = int(input())\ndist1 = abs(p - c1)\ndist2 = abs(p - c2)\nif dist1 < dist2:\n    print("C1")\nelse:\n    print("C2")',
          sampleInput: '10\n50\n15',
          sampleOutput: 'C1',
          testCases: [{ stdin: '10\n50\n15', expected: 'C1', hidden: false }, { stdin: '10\n50\n45', expected: 'C2', hidden: false }]
        },
        {
          title: 'Evaluasi Clustering',
          duration: '15 menit',
          videoUrl: 'https://www.youtube.com/embed/AWbM-kS3bC4',
          summaryContent: '<h3>Inertia (SSE)</h3><p>Semakin kecil jumlah kuadrat jarak titik ke centroidnya, semakin rapat clusternya.</p>',
          problemTitle: 'Hitung SSE (Sum of Squared Errors)',
          problemDescription: 'Diberikan Centroid C dan N titik. Hitung total kuadrat jarak semua titik ke C.',
          defaultLanguage: 'python',
          starterCode: 'c = int(input())\nn = int(input())\nsse = 0\nfor i in range(n):\n    p = int(input())\n    sse += (p - c)**2\nprint(sse)',
          sampleInput: '10\n2\n8\n12',
          sampleOutput: '8',
          testCases: [{ stdin: '10\n2\n8\n12', expected: '8', hidden: false }]
        }
      ]
    }
  ];
  
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Data Mining successfully updated in db/seed-data.json');
} else {
  console.log('Error: data-mining course not found!');
}
