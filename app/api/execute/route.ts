import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// ============================================
// KONFIGURASI KEAMANAN & CACHE
// ============================================

/** Batas ukuran sumber kode: 64KB */
const MAX_CODE_SIZE = 64 * 1024;
const MAX_STDIN_SIZE = 16 * 1024;

/** Judge0 RapidAPI Credentials */
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "YOUR_RAPIDAPI_KEY_HERE";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
const JUDGE0_BASE_URL = `https://${RAPIDAPI_HOST}`;

// ============================================
// RATE LIMITER & DEDUPLICATION CACHE
// ============================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // 5 eksekusi per menit untuk menghemat kuota berbayar
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Simple LRU Cache (In-Memory) untuk menghindari pemanggilan berulang kode identik
const executionCache = new Map<string, any>();

// Bersihkan cache dan rate limit setiap 10 menit
if (typeof globalThis !== 'undefined') {
  const cleanupKey = '__judge0CleanupInterval';
  if (!(globalThis as any)[cleanupKey]) {
    (globalThis as any)[cleanupKey] = setInterval(() => {
      const now = Date.now();
      for (const [key, val] of rateLimitMap) {
        if (now > val.resetTime) rateLimitMap.delete(key);
      }
      executionCache.clear(); // Hapus cache secara berkala
    }, 10 * 60_000);
  }
}

// ============================================
// UTILS
// ============================================

interface ExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
}

function errorResponse(language: string, message: string): NextResponse {
  return NextResponse.json({
    language,
    version: "Judge0",
    run: {
      stdout: "",
      stderr: message,
      output: message,
      code: 1,
      signal: null
    }
  } satisfies ExecuteResponse);
}

// Helper untuk Base64
const encodeBase64 = (str: string) => Buffer.from(str, 'utf-8').toString('base64');
const decodeBase64 = (str: string | null) => str ? Buffer.from(str, 'base64').toString('utf-8') : "";

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(req: Request) {
  let language = "unknown";

  try {
    // ━━━ 1. AUTENTIKASI & RATE LIMIT ━━━
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(session.userId)) {
      return errorResponse(language, "Rate limit terlampaui. Tunggu 1 menit sebelum mencoba lagi.");
    }

    // ━━━ 2. VALIDASI CREDENTIALS ━━━
    if (RAPIDAPI_KEY === "YOUR_RAPIDAPI_KEY_HERE" || !process.env.RAPIDAPI_KEY) {
      return errorResponse(language, "Server Error: Kredensial Judge0 RapidAPI belum dikonfigurasi di file .env.");
    }

    // ━━━ 3. PARSING INPUT ━━━
    const body = await req.json();
    language = body.language || "unknown";
    const code = body.files?.[0]?.content || "";
    const stdin = body.stdin || "";

    if (code.length > MAX_CODE_SIZE || stdin.length > MAX_STDIN_SIZE) {
      return errorResponse(language, "Ukuran kode atau input melebihi batas maksimum.");
    }

    // ━━━ 4. LANGUAGE MAPPING (JUDGE0) ━━━
    let languageId = 0;
    if (language === 'python') languageId = 71; // Python 3.8.1
    else if (language === 'javascript') languageId = 63; // Node.js 12.14.0
    else if (language === 'c') languageId = 50; // GCC 9.2.0
    else if (language === 'cpp') languageId = 54; // GCC 9.2.0
    else if (language === 'sql') languageId = 82; // SQLite 3.27.2

    if (languageId === 0) {
      return errorResponse(language, `Bahasa "${language}" tidak didukung oleh arsitektur Judge0 kami.`);
    }

    // ━━━ 5. DEDUPLICATION CACHE ━━━
    // Jika mahasiswa menekan "Run" berkali-kali tanpa mengubah kode
    const cacheKey = `${languageId}:${encodeBase64(code)}:${encodeBase64(stdin)}`;
    if (executionCache.has(cacheKey)) {
      return NextResponse.json(executionCache.get(cacheKey));
    }

    // ━━━ 6. TAHAP 1: KIRIM KODE KE JUDGE0 (POST) ━━━
    const submissionResponse = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: encodeBase64(code),
        stdin: encodeBase64(stdin)
      })
    });

    if (!submissionResponse.ok) {
      const errTxt = await submissionResponse.text();
      console.error("Judge0 Submission Error:", errTxt);
      return errorResponse(language, `Gagal menghubungi compiler API (HTTP ${submissionResponse.status})`);
    }

    const { token } = await submissionResponse.json();
    if (!token) {
      return errorResponse(language, "Gagal mendapatkan token eksekusi dari Judge0.");
    }

    // ━━━ 7. TAHAP 2: ASYNCHRONOUS POLLING (GET) ━━━
    let attempt = 0;
    const MAX_ATTEMPTS = 15; // Maksimal 15 detik menunggu
    let finalResult = null;

    while (attempt < MAX_ATTEMPTS) {
      // Jeda 1 detik setiap iterasi polling
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempt++;

      const checkResponse = await fetch(`${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true`, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST
        }
      });

      if (!checkResponse.ok) continue; // Coba lagi jika ada gangguan koneksi sesaat

      const data = await checkResponse.json();
      
      // Status ID Judge0:
      // 1 = In Queue, 2 = Processing
      // 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error, dll
      if (data.status?.id === 1 || data.status?.id === 2) {
        continue; // Masih diproses, loop lagi
      }

      // Selesai diproses (bisa sukses atau error)
      finalResult = data;
      break;
    }

    if (!finalResult) {
      return errorResponse(language, "Waktu tunggu habis. Server eksekusi terlalu sibuk.");
    }

    // ━━━ 8. PEMROSESAN RESPONSE & BASE64 DECODING ━━━
    const stdoutRaw = decodeBase64(finalResult.stdout);
    const stderrRaw = decodeBase64(finalResult.stderr);
    const compileOutputRaw = decodeBase64(finalResult.compile_output);

    // Deteksi jika terjadi Error Logika atau Kompilasi
    const statusId = finalResult.status?.id;
    let isError = statusId !== 3; // 3 adalah Accepted (Sukses)
    
    // Rangkai pesan error dari berbagai sumber
    let finalStderr = stderrRaw;
    if (statusId === 5) finalStderr = "Waktu Eksekusi Melebihi Batas (Time Limit Exceeded). Pastikan tidak ada infinite loop.";
    else if (statusId === 6) finalStderr = compileOutputRaw || "Kompilasi Gagal.";
    else if (statusId >= 7 && statusId <= 12) finalStderr = `Runtime Error (Status: ${finalResult.status?.description || statusId})\n${stderrRaw}`;

    // Gabungkan stdout dan stderr untuk kemudahan display di IDE mahasiswa
    const combinedOutput = [stdoutRaw, finalStderr].filter(Boolean).join("\n\n");

    const responsePayload: ExecuteResponse = {
      language,
      version: "Judge0",
      run: {
        stdout: stdoutRaw,
        stderr: finalStderr,
        output: combinedOutput || "Program selesai dijalankan (Tidak ada output).",
        code: isError ? 1 : 0,
        signal: null
      }
    };

    // Simpan ke Cache jika sukses atau error sintaks (bukan error internal server)
    executionCache.set(cacheKey, responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error("Execute API Error:", error.message);
    return errorResponse(language, "Terjadi kesalahan internal pada server eksekusi.");
  }
}
