import { NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, testCases } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";

// ============================================
// KONFIGURASI
// ============================================

const ONLINE_COMPILER_KEY = process.env.ONLINE_COMPILER_KEY;
const ONLINE_COMPILER_SYNC_URL = "https://api.onlinecompiler.io/api/run-code-sync/";
const API_TIMEOUT_MS = 15_000;

// Mapping bahasa internal ITSDojo → identifier OnlineCompiler.io
function getCompilerId(language: string): string {
  switch (language) {
    case 'cpp': return 'g++-15';
    case 'javascript': return 'typescript-deno';
    case 'python': return 'python-3.14';
    case 'c': return 'gcc-15';
    case 'java': return 'openjdk-25';
    default: return language;
  }
}

// ============================================
// POST /api/lessons/[id]/submit
// Server-side test runner: menjalankan kode mahasiswa terhadap SEMUA test cases
// (termasuk hidden) secara eksklusif di backend. Frontend tidak pernah melihat
// input/output dari hidden test cases.
// ============================================

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ━━━ 1. AUTENTIKASI ━━━
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ━━━ 2. VALIDASI KREDENSIAL ━━━
    if (!ONLINE_COMPILER_KEY) {
      return NextResponse.json({
        allPassed: false,
        log: "Server Error: ONLINE_COMPILER_KEY belum dikonfigurasi.",
        results: []
      });
    }

    // ━━━ 3. PARSING INPUT ━━━
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    const body = await req.json();
    const code: string = body.code || "";
    const language: string = body.language || "c";

    if (!code.trim()) {
      return NextResponse.json({
        allPassed: false,
        log: "Kode tidak boleh kosong.",
        results: []
      });
    }

    // ━━━ 4. AMBIL LESSON & SEMUA TEST CASES (TERMASUK HIDDEN) DARI DATABASE ━━━
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const allTestCases = await db
      .select()
      .from(testCases)
      .where(eq(testCases.lessonId, lessonId))
      .orderBy(asc(testCases.order));

    if (allTestCases.length === 0) {
      return NextResponse.json({
        allPassed: false,
        log: "Lesson ini belum memiliki test case.",
        results: []
      });
    }

    // ━━━ 5. EKSEKUSI KODE TERHADAP SETIAP TEST CASE DI SERVER ━━━
    const compilerId = getCompilerId(language);
    const results: Array<{
      order: number;
      passed: boolean;
      hidden: boolean;
      error?: string;
      expected?: string;
      actual?: string;
    }> = [];

    let allPassed = true;
    let log = `⏳ Menjalankan ${allTestCases.length} test cases (termasuk hidden)...\n\n`;

    for (const tc of allTestCases) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        const response = await fetch(ONLINE_COMPILER_SYNC_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": ONLINE_COMPILER_KEY
          },
          body: JSON.stringify({
            compiler: compilerId,
            code: code,
            input: tc.stdin || ""
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          allPassed = false;
          const errText = await response.text();
          results.push({
            order: tc.order,
            passed: false,
            hidden: tc.hidden,
            error: `API Error (HTTP ${response.status})`
          });
          log += `❌ Test Case ${tc.order}${tc.hidden ? ' (Hidden)' : ''}: API ERROR\n`;
          log += `   ${errText.substring(0, 200)}\n\n`;
          continue;
        }

        const resultData = await response.json();
        const actualOutput = (resultData.output || resultData.stdout || "").replace(/\r\n/g, "\n").trimEnd();
        const expectedOutput = (tc.expected || "").replace(/\r\n/g, "\n").trimEnd();
        const exitCode = resultData.exit_code !== undefined ? resultData.exit_code : 0;
        const stderrText = resultData.stderr || resultData.error || "";

        // Cek runtime/compilation error
        if (exitCode !== 0 || stderrText) {
          allPassed = false;
          results.push({
            order: tc.order,
            passed: false,
            hidden: tc.hidden,
            error: stderrText || `Exit code: ${exitCode}`
          });

          if (tc.hidden) {
            // Untuk hidden test case: jangan bocorkan detail error spesifik
            log += `❌ Test Case ${tc.order} (Hidden): ERROR\n`;
            log += `   Kode menghasilkan error pada test case tersembunyi.\n\n`;
          } else {
            log += `❌ Test Case ${tc.order}: ERROR\n`;
            log += `   Error: ${stderrText.trim().substring(0, 300)}\n\n`;
          }
          continue;
        }

        // Bandingkan output
        const passed = actualOutput === expectedOutput;
        if (!passed) allPassed = false;

        results.push({
          order: tc.order,
          passed,
          hidden: tc.hidden,
          expected: tc.hidden ? undefined : expectedOutput,  // Jangan kirim expected untuk hidden
          actual: tc.hidden ? undefined : actualOutput         // Jangan kirim actual untuk hidden
        });

        if (passed) {
          log += `✅ Test Case ${tc.order}${tc.hidden ? ' (Hidden)' : ''}: PASSED\n`;
        } else {
          if (tc.hidden) {
            // KEAMANAN: Untuk hidden test case, jangan bocorkan expected/actual
            log += `❌ Test Case ${tc.order} (Hidden): FAILED\n`;
            log += `   Output tidak sesuai pada test case tersembunyi.\n`;
          } else {
            log += `❌ Test Case ${tc.order}: FAILED\n`;
            log += `   Expected:\n${expectedOutput.split("\n").map((l: string) => `   │ ${l}`).join("\n")}\n`;
            log += `   Got:\n${actualOutput.split("\n").map((l: string) => `   │ ${l}`).join("\n")}\n`;
          }
        }
        log += "\n";

      } catch (tcError: any) {
        allPassed = false;
        const isTimeout = tcError?.name === 'AbortError';
        results.push({
          order: tc.order,
          passed: false,
          hidden: tc.hidden,
          error: isTimeout ? "Timeout" : tcError.message
        });
        log += `❌ Test Case ${tc.order}${tc.hidden ? ' (Hidden)' : ''}: ${isTimeout ? 'TIMEOUT' : 'ERROR'}\n\n`;
      }
    }

    // ━━━ 6. VERDICT FINAL ━━━
    if (allPassed) {
      log += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      log += "🎉 Semua test case PASSED! Lesson selesai!\n";
    } else {
      log += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      log += "⚠️ Beberapa test case gagal. Perbaiki kode dan coba lagi.\n";
    }

    return NextResponse.json({
      allPassed,
      log,
      results,
      totalTests: allTestCases.length,
      passedTests: results.filter(r => r.passed).length,
      // Metrik tambahan untuk gamifikasi
      xpReward: lesson.xpReward,
      gemReward: lesson.gemReward,
    });

  } catch (error: any) {
    console.error("Submit API Error:", error.message);
    return NextResponse.json({
      allPassed: false,
      log: `Terjadi kesalahan internal: ${error.message}`,
      results: []
    });
  }
}
