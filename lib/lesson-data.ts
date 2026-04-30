// ============================================================
// Data konten & test case per lesson
// File ini menjadi "single source of truth" untuk:
//   - Daftar node per kursus (dipakai learn page & route guard)
//   - Soal, starter code, dan test case per lesson (dipakai lesson page)
// ============================================================

export type TestCase = {
  id: number;
  stdin: string;
  expected: string;
  hidden?: boolean; // Test case tersembunyi (tidak ditampilkan di soal)
};

export type LessonProblem = {
  title: string;
  category: string;
  description: string;       // HTML-safe description teks biasa
  starterCode: string;
  defaultLanguage: string;
  testCases: TestCase[];
  sampleInput: string;
  sampleOutput: string;
};

export type LessonNode = {
  id: string;
  title: string;
  desc: string;
};

export type CourseUnit = {
  unitTitle: string;
  unitDesc: string;
  nodes: LessonNode[];
};

// --- Daftar kursus & node ---
export const COURSE_CONTENT: Record<string, CourseUnit> = {
  "fe-basic": {
    unitTitle: "Unit 1: HTML & CSS Basics",
    unitDesc: "Fondasi halaman web modern",
    nodes: [
      { id: "fe-basic-1", title: "HTML Structure", desc: "Tag & Element Dasar" },
      { id: "fe-basic-2", title: "CSS Styling", desc: "Warna & Layout" },
      { id: "fe-basic-3", title: "Flexbox", desc: "Layout Responsif" },
      { id: "fe-basic-4", title: "Grid System", desc: "Layout 2 Dimensi" },
    ]
  },
  "react-mastery": {
    unitTitle: "Unit 1: React Components",
    unitDesc: "Membuat UI interaktif",
    nodes: [
      { id: "react-mastery-1", title: "JSX Syntax", desc: "Javascript + XML" },
      { id: "react-mastery-2", title: "Props & State", desc: "Data Flow" },
    ]
  },
  "backend-ninja": {
    unitTitle: "Unit 1: Intro to API",
    unitDesc: "Dasar komunikasi server",
    nodes: [
      { id: "backend-ninja-1", title: "HTTP Methods", desc: "GET, POST, PUT" },
      { id: "backend-ninja-2", title: "Express JS", desc: "Routing Dasar" },
      { id: "backend-ninja-3", title: "Database", desc: "SQL Basics" },
    ]
  }
};

// --- Soal & test case per lesson ---
export const LESSON_PROBLEMS: Record<string, LessonProblem> = {
  // ==================== FE-BASIC ====================
  "fe-basic-1": {
    title: "Playing With Characters",
    category: "Materi Dasar",
    description: "This challenge will help you to learn how to take a character, a string and a sentence as input in C.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>

int main() 
{
    /* Enter your code here. Read input from STDIN. Print output to STDOUT */    
    return 0;
}`,
    sampleInput: "C\nLanguage\nWelcome To C!!",
    sampleOutput: "C\nLanguage\nWelcome To C!!",
    testCases: [
      { id: 1, stdin: "C\nLanguage\nWelcome To C!!", expected: "C\nLanguage\nWelcome To C!!" },
      { id: 2, stdin: "A\nHello\nThis is a test", expected: "A\nHello\nThis is a test" },
      { id: 3, stdin: "Z\nProgramming\nI love coding!", expected: "Z\nProgramming\nI love coding!", hidden: true },
    ],
  },

  "fe-basic-2": {
    title: "Sum and Difference",
    category: "Aritmatika Dasar",
    description: "Given two integers, compute and print their sum and difference.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>

int main() 
{
    /* Read two integers and print their sum and difference */
    return 0;
}`,
    sampleInput: "10 5",
    sampleOutput: "15\n5",
    testCases: [
      { id: 1, stdin: "10 5", expected: "15\n5" },
      { id: 2, stdin: "100 37", expected: "137\n63" },
      { id: 3, stdin: "0 0", expected: "0\n0", hidden: true },
      { id: 4, stdin: "-3 7", expected: "4\n-10", hidden: true },
    ],
  },

  "fe-basic-3": {
    title: "Functions in C",
    category: "Fungsi",
    description: "Write a function that finds the maximum of four integers. The function should return the largest value among the four.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>

int max_of_four(int a, int b, int c, int d) {
    /* Write your implementation here */
}

int main() {
    int a, b, c, d;
    scanf("%d %d %d %d", &a, &b, &c, &d);
    int ans = max_of_four(a, b, c, d);
    printf("%d", ans);
    return 0;
}`,
    sampleInput: "3 4 6 5",
    sampleOutput: "6",
    testCases: [
      { id: 1, stdin: "3 4 6 5", expected: "6" },
      { id: 2, stdin: "12 8 2 10", expected: "12" },
      { id: 3, stdin: "-1 -5 -3 -2", expected: "-1", hidden: true },
      { id: 4, stdin: "7 7 7 7", expected: "7", hidden: true },
    ],
  },

  "fe-basic-4": {
    title: "Pointers in C",
    category: "Pointer",
    description: "Given two integers a and b, use pointers to update their values such that a contains (a + b) and b contains |a - b|.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>
#include <stdlib.h>

void update(int *a, int *b) {
    /* Write your implementation here */
}

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    update(&a, &b);
    printf("%d\\n%d", a, b);
    return 0;
}`,
    sampleInput: "4 5",
    sampleOutput: "9\n1",
    testCases: [
      { id: 1, stdin: "4 5", expected: "9\n1" },
      { id: 2, stdin: "10 3", expected: "13\n7" },
      { id: 3, stdin: "0 0", expected: "0\n0", hidden: true },
      { id: 4, stdin: "5 10", expected: "15\n5", hidden: true },
    ],
  },

  // ==================== REACT-MASTERY ====================
  "react-mastery-1": {
    title: "Hello World in JS",
    category: "Dasar JavaScript",
    description: "Print 'Hello, World!' to the console. This is your first step into JavaScript!",
    defaultLanguage: "javascript",
    starterCode: `// Print Hello, World! to stdout
`,
    sampleInput: "",
    sampleOutput: "Hello, World!",
    testCases: [
      { id: 1, stdin: "", expected: "Hello, World!" },
    ],
  },

  "react-mastery-2": {
    title: "Data Types in JS",
    category: "Tipe Data",
    description: "Read an integer, a float (to 1 decimal), and a string from input. Print each on a new line.",
    defaultLanguage: "javascript",
    starterCode: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    // lines[0] = integer, lines[1] = float, lines[2] = string
    // Print each on a new line
});
`,
    sampleInput: "42\n3.14\nHello",
    sampleOutput: "42\n3.14\nHello",
    testCases: [
      { id: 1, stdin: "42\n3.14\nHello", expected: "42\n3.14\nHello" },
      { id: 2, stdin: "0\n1.5\nWorld", expected: "0\n1.5\nWorld" },
    ],
  },

  // ==================== BACKEND-NINJA ====================
  "backend-ninja-1": {
    title: "HTTP Status Codes",
    category: "HTTP Basics",
    description: "Given an HTTP status code as input, print its meaning: 200 → OK, 404 → Not Found, 500 → Internal Server Error, otherwise → Unknown.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>

int main() {
    int code;
    scanf("%d", &code);
    /* Print the meaning of the HTTP status code */
    return 0;
}`,
    sampleInput: "200",
    sampleOutput: "OK",
    testCases: [
      { id: 1, stdin: "200", expected: "OK" },
      { id: 2, stdin: "404", expected: "Not Found" },
      { id: 3, stdin: "500", expected: "Internal Server Error" },
      { id: 4, stdin: "302", expected: "Unknown", hidden: true },
    ],
  },

  "backend-ninja-2": {
    title: "Parse Query String",
    category: "Routing",
    description: "Given a query string in the format 'key=value', print the key and value on separate lines.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>
#include <string.h>

int main() {
    char input[200];
    scanf("%s", input);
    /* Parse and print key and value separated by newline */
    return 0;
}`,
    sampleInput: "name=Daryl",
    sampleOutput: "name\nDaryl",
    testCases: [
      { id: 1, stdin: "name=Daryl", expected: "name\nDaryl" },
      { id: 2, stdin: "lang=C", expected: "lang\nC" },
      { id: 3, stdin: "status=active", expected: "status\nactive", hidden: true },
    ],
  },

  "backend-ninja-3": {
    title: "Simple Calculator",
    category: "SQL Basics",
    description: "Read two integers and an operator (+, -, *). Print the result of the operation.",
    defaultLanguage: "c",
    starterCode: `#include <stdio.h>

int main() {
    int a, b;
    char op;
    scanf("%d %c %d", &a, &op, &b);
    /* Compute and print the result */
    return 0;
}`,
    sampleInput: "3 + 5",
    sampleOutput: "8",
    testCases: [
      { id: 1, stdin: "3 + 5", expected: "8" },
      { id: 2, stdin: "10 - 4", expected: "6" },
      { id: 3, stdin: "6 * 7", expected: "42" },
      { id: 4, stdin: "0 + 0", expected: "0", hidden: true },
    ],
  },
};

// --- Helper: ambil data soal untuk lesson tertentu ---
export function getLessonProblem(lessonId: string): LessonProblem | null {
  return LESSON_PROBLEMS[lessonId] || null;
}

// --- Helper: ambil daftar node untuk route guard ---
export function getCourseNodes(): Record<string, { nodes: { id: string }[] }> {
  const result: Record<string, { nodes: { id: string }[] }> = {};
  for (const [courseId, course] of Object.entries(COURSE_CONTENT)) {
    result[courseId] = { nodes: course.nodes.map(n => ({ id: n.id })) };
  }
  return result;
}
