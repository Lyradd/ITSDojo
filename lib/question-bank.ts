import { Question, generateQuestionId } from './evaluation-types';

export interface QuestionPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  questionCount: number;
  questions: Question[];
}

function q(data: Omit<Question, 'id'>): Question {
  return { id: generateQuestionId(), ...data };
}

export const QUESTION_PACKAGES: QuestionPackage[] = [
  {
    id: 'pkg-html-css-basic',
    name: 'HTML & CSS Dasar',
    description: 'Soal dasar tentang HTML tags, CSS selectors, dan properti styling.',
    category: 'Pemrograman Web',
    icon: '🌐',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Tag HTML mana yang digunakan untuk membuat heading terbesar?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: '<h1>', isCorrect: true }, { id: 'b', text: '<h6>', isCorrect: false }, { id: 'c', text: '<head>', isCorrect: false }, { id: 'd', text: '<header>', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'Properti CSS mana yang digunakan untuk mengubah warna teks?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'font-color', isCorrect: false }, { id: 'b', text: 'text-color', isCorrect: false }, { id: 'c', text: 'color', isCorrect: true }, { id: 'd', text: 'foreground', isCorrect: false }] }),
      q({ type: 'true_false', question: 'Tag <div> adalah elemen inline di HTML.', points: 10, bloomLevel: 'C2', difficulty: 'easy', correctAnswer: false }),
      q({ type: 'multiple_choice', question: 'Selector CSS ".container" memilih elemen berdasarkan?', points: 10, bloomLevel: 'C2', difficulty: 'medium', options: [{ id: 'a', text: 'ID', isCorrect: false }, { id: 'b', text: 'Class', isCorrect: true }, { id: 'c', text: 'Tag', isCorrect: false }, { id: 'd', text: 'Attribute', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Properti CSS apa yang digunakan untuk membuat layout flexbox?', points: 10, bloomLevel: 'C3', difficulty: 'medium', expectedAnswer: 'display: flex' }),
    ],
  },
  {
    id: 'pkg-javascript-basic',
    name: 'JavaScript Dasar',
    description: 'Variabel, tipe data, operator, dan kontrol alur di JavaScript.',
    category: 'Pemrograman Web',
    icon: '⚡',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Keyword mana yang digunakan untuk mendeklarasikan variabel yang tidak bisa di-reassign?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'var', isCorrect: false }, { id: 'b', text: 'let', isCorrect: false }, { id: 'c', text: 'const', isCorrect: true }, { id: 'd', text: 'static', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'Apa output dari typeof null di JavaScript?', points: 10, bloomLevel: 'C2', difficulty: 'medium', options: [{ id: 'a', text: '"null"', isCorrect: false }, { id: 'b', text: '"object"', isCorrect: true }, { id: 'c', text: '"undefined"', isCorrect: false }, { id: 'd', text: '"boolean"', isCorrect: false }] }),
      q({ type: 'true_false', question: 'Di JavaScript, "==" membandingkan nilai dan tipe data secara strict.', points: 10, bloomLevel: 'C2', difficulty: 'easy', correctAnswer: false }),
      q({ type: 'multiple_choice', question: 'Method array mana yang mengembalikan array baru tanpa mengubah array asli?', points: 10, bloomLevel: 'C3', difficulty: 'medium', options: [{ id: 'a', text: 'push()', isCorrect: false }, { id: 'b', text: 'splice()', isCorrect: false }, { id: 'c', text: 'map()', isCorrect: true }, { id: 'd', text: 'sort()', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Apa nama fitur ES6 yang memungkinkan penulisan string dengan backtick (`)?', points: 10, bloomLevel: 'C1', difficulty: 'easy', expectedAnswer: 'template literal' }),
    ],
  },
  {
    id: 'pkg-react-basic',
    name: 'React.js Dasar',
    description: 'Komponen, state, props, dan lifecycle di React.',
    category: 'Pemrograman Web',
    icon: '⚛️',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Hook React mana yang digunakan untuk mengelola state di functional component?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'useEffect', isCorrect: false }, { id: 'b', text: 'useState', isCorrect: true }, { id: 'c', text: 'useContext', isCorrect: false }, { id: 'd', text: 'useRef', isCorrect: false }] }),
      q({ type: 'true_false', question: 'Di React, props bersifat mutable dan bisa diubah oleh child component.', points: 10, bloomLevel: 'C2', difficulty: 'easy', correctAnswer: false }),
      q({ type: 'multiple_choice', question: 'Apa fungsi dari useEffect di React?', points: 10, bloomLevel: 'C2', difficulty: 'medium', options: [{ id: 'a', text: 'Mengelola state lokal', isCorrect: false }, { id: 'b', text: 'Menjalankan side effects', isCorrect: true }, { id: 'c', text: 'Membuat context baru', isCorrect: false }, { id: 'd', text: 'Mengoptimalkan rendering', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'Apa kegunaan dari React.memo()?', points: 10, bloomLevel: 'C4', difficulty: 'hard', options: [{ id: 'a', text: 'Menyimpan data ke localStorage', isCorrect: false }, { id: 'b', text: 'Mencegah re-render yang tidak perlu', isCorrect: true }, { id: 'c', text: 'Membuat state global', isCorrect: false }, { id: 'd', text: 'Menangani error boundary', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Apa nama atribut khusus yang harus diberikan pada setiap item dalam list di React?', points: 10, bloomLevel: 'C1', difficulty: 'easy', expectedAnswer: 'key' }),
    ],
  },
  {
    id: 'pkg-dasar-pemrograman',
    name: 'Dasar Pemrograman',
    description: 'Konsep dasar algoritma, flowchart, dan pseudocode.',
    category: 'Dasar Pemrograman',
    icon: '🧮',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Apa struktur kontrol yang digunakan untuk mengulang eksekusi blok kode?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'if-else', isCorrect: false }, { id: 'b', text: 'loop/perulangan', isCorrect: true }, { id: 'c', text: 'switch-case', isCorrect: false }, { id: 'd', text: 'try-catch', isCorrect: false }] }),
      q({ type: 'true_false', question: 'Algoritma adalah urutan langkah-langkah logis untuk menyelesaikan masalah.', points: 10, bloomLevel: 'C1', difficulty: 'easy', correctAnswer: true }),
      q({ type: 'multiple_choice', question: 'Notasi Big-O mana yang paling efisien?', points: 10, bloomLevel: 'C4', difficulty: 'medium', options: [{ id: 'a', text: 'O(n²)', isCorrect: false }, { id: 'b', text: 'O(n log n)', isCorrect: false }, { id: 'c', text: 'O(1)', isCorrect: true }, { id: 'd', text: 'O(n)', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'Tipe data yang hanya menyimpan nilai true atau false disebut?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'Integer', isCorrect: false }, { id: 'b', text: 'String', isCorrect: false }, { id: 'c', text: 'Boolean', isCorrect: true }, { id: 'd', text: 'Float', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Apa nama proses menemukan dan memperbaiki kesalahan dalam kode program?', points: 10, bloomLevel: 'C1', difficulty: 'easy', expectedAnswer: 'debugging' }),
    ],
  },
  {
    id: 'pkg-struktur-data',
    name: 'Struktur Data',
    description: 'Array, linked list, stack, queue, dan tree.',
    category: 'Struktur Data',
    icon: '🏗️',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Struktur data mana yang menggunakan prinsip LIFO (Last In First Out)?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'Queue', isCorrect: false }, { id: 'b', text: 'Stack', isCorrect: true }, { id: 'c', text: 'Array', isCorrect: false }, { id: 'd', text: 'Linked List', isCorrect: false }] }),
      q({ type: 'true_false', question: 'Queue menggunakan prinsip FIFO (First In First Out).', points: 10, bloomLevel: 'C1', difficulty: 'easy', correctAnswer: true }),
      q({ type: 'multiple_choice', question: 'Operasi apa yang digunakan untuk menambahkan elemen di Stack?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'enqueue', isCorrect: false }, { id: 'b', text: 'push', isCorrect: true }, { id: 'c', text: 'insert', isCorrect: false }, { id: 'd', text: 'add', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'Berapa kompleksitas waktu pencarian pada Binary Search Tree yang seimbang?', points: 10, bloomLevel: 'C4', difficulty: 'hard', options: [{ id: 'a', text: 'O(n)', isCorrect: false }, { id: 'b', text: 'O(log n)', isCorrect: true }, { id: 'c', text: 'O(1)', isCorrect: false }, { id: 'd', text: 'O(n²)', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Apa nama node paling atas dalam struktur data Tree?', points: 10, bloomLevel: 'C1', difficulty: 'easy', expectedAnswer: 'root' }),
    ],
  },
  {
    id: 'pkg-basis-data',
    name: 'Sistem Basis Data',
    description: 'SQL query, normalisasi, dan konsep relasional.',
    category: 'Sistem Basis Data',
    icon: '🗄️',
    questionCount: 5,
    questions: [
      q({ type: 'multiple_choice', question: 'Perintah SQL mana yang digunakan untuk mengambil data dari tabel?', points: 10, bloomLevel: 'C1', difficulty: 'easy', options: [{ id: 'a', text: 'INSERT', isCorrect: false }, { id: 'b', text: 'SELECT', isCorrect: true }, { id: 'c', text: 'UPDATE', isCorrect: false }, { id: 'd', text: 'DELETE', isCorrect: false }] }),
      q({ type: 'true_false', question: 'PRIMARY KEY boleh memiliki nilai NULL.', points: 10, bloomLevel: 'C2', difficulty: 'easy', correctAnswer: false }),
      q({ type: 'multiple_choice', question: 'Normalisasi bentuk ke-3 (3NF) menghilangkan?', points: 10, bloomLevel: 'C4', difficulty: 'hard', options: [{ id: 'a', text: 'Repeating groups', isCorrect: false }, { id: 'b', text: 'Partial dependency', isCorrect: false }, { id: 'c', text: 'Transitive dependency', isCorrect: true }, { id: 'd', text: 'Multi-valued dependency', isCorrect: false }] }),
      q({ type: 'multiple_choice', question: 'JOIN yang mengembalikan semua baris dari tabel kiri meskipun tidak ada kecocokan disebut?', points: 10, bloomLevel: 'C2', difficulty: 'medium', options: [{ id: 'a', text: 'INNER JOIN', isCorrect: false }, { id: 'b', text: 'LEFT JOIN', isCorrect: true }, { id: 'c', text: 'CROSS JOIN', isCorrect: false }, { id: 'd', text: 'SELF JOIN', isCorrect: false }] }),
      q({ type: 'short_answer', question: 'Apa klausa SQL yang digunakan untuk memfilter hasil setelah GROUP BY?', points: 10, bloomLevel: 'C3', difficulty: 'medium', expectedAnswer: 'HAVING' }),
    ],
  },
];

export function getPackagesByCategory(): Record<string, QuestionPackage[]> {
  const grouped: Record<string, QuestionPackage[]> = {};
  QUESTION_PACKAGES.forEach(pkg => {
    if (!grouped[pkg.category]) grouped[pkg.category] = [];
    grouped[pkg.category].push(pkg);
  });
  return grouped;
}
