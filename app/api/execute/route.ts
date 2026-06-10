import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// ============================================
// KONFIGURASI KEAMANAN & CACHE
// ============================================

/** Batas ukuran sumber kode: 64KB */
const MAX_CODE_SIZE = 64 * 1024;
const MAX_STDIN_SIZE = 16 * 1024;

/** OnlineCompiler.io Credentials */
// KEAMANAN: API Key HARUS diset di file .env.local, TIDAK boleh hardcoded di source code.
const ONLINE_COMPILER_KEY = process.env.ONLINE_COMPILER_KEY;
const ONLINE_COMPILER_SYNC_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

/** Timeout untuk request ke API eksternal (dalam milidetik) */
const API_TIMEOUT_MS = 15_000; // 15 detik

/** Batas maksimal entri di execution cache untuk mencegah memory leak */
const MAX_CACHE_SIZE = 500;

// ============================================
// RATE LIMITER & DEDUPLICATION CACHE
// ============================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
// Limit kita naikkan menjadi 10 karena kuota kita sekarang raksasa (1.000.000/bulan)
const RATE_LIMIT_MAX = 10; 
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

// Simple LRU Cache (In-Memory) untuk deduplikasi request jika kode tidak diubah
const executionCache = new Map<string, any>();

if (typeof globalThis !== 'undefined') {
  const cleanupKey = '__compilerCleanupInterval';
  if (!(globalThis as any)[cleanupKey]) {
    (globalThis as any)[cleanupKey] = setInterval(() => {
      const now = Date.now();
      for (const [key, val] of rateLimitMap) {
        if (now > val.resetTime) rateLimitMap.delete(key);
      }
      executionCache.clear();
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
    time?: number;     // 🏆 Metrik baru: Untuk gamifikasi "The Big-O Master"
    memory?: number;   // 🏆 Metrik baru: Untuk gamifikasi "The Big-O Master"
  };
}

function errorResponse(language: string, message: string): NextResponse {
  return NextResponse.json({
    language,
    version: "OnlineCompiler.io",
    run: {
      stdout: "",
      stderr: message,
      output: message,
      code: 1,
      signal: null
    }
  } satisfies ExecuteResponse);
}

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
      return errorResponse(language, "Terlalu banyak permintaan (Spam Filter). Tunggu 1 menit.");
    }

    // ━━━ 2. PARSING INPUT ━━━
    const body = await req.json();
    language = body.language || "unknown";
    const code = body.files?.[0]?.content || "";
    const stdin = body.stdin || "";

    if (code.length > MAX_CODE_SIZE || stdin.length > MAX_STDIN_SIZE) {
      return errorResponse(language, "Ukuran kode atau input melebihi batas maksimum.");
    }

    // ━━━ 2.5 BLACKLIST POLA KODE BERBAHAYA (Defense-in-Depth) ━━━
    // Catatan: OnlineCompiler.io sudah menjalankan kode di Docker sandbox tanpa
    // akses jaringan dengan batas 30 detik & 512MB RAM. Filter ini adalah lapisan
    // pertahanan tambahan untuk memblokir pola yang jelas-jelas berbahaya sebelum
    // request dikirim ke API (menghemat kuota & waktu).
    const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
      { pattern: /\bsystem\s*\(/i,      message: "Pemanggilan system() tidak diizinkan." },
      { pattern: /\bexec\s*[vlp]*\s*\(/i, message: "Pemanggilan exec() tidak diizinkan." },
      { pattern: /\bfork\s*\(/i,         message: "Pemanggilan fork() tidak diizinkan." },
      { pattern: /\bpopen\s*\(/i,        message: "Pemanggilan popen() tidak diizinkan." },
      { pattern: /\b__import__\s*\(\s*['"]os['"]\s*\)/i, message: "Import modul os tidak diizinkan." },
      { pattern: /\bsubprocess\b/i,      message: "Modul subprocess tidak diizinkan." },
      { pattern: /\beval\s*\(\s*input/i, message: "Pola eval(input()) tidak diizinkan." },
    ];

    for (const { pattern, message } of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return errorResponse(language, `⛔ Kode Ditolak: ${message}`);
      }
    }

    // ━━━ 3. LANGUAGE IDENTIFIER MAPPING ━━━
    let compilerId = language;
    if (language === 'cpp') compilerId = 'g++-15';
    else if (language === 'javascript') compilerId = 'typescript-deno';
    else if (language === 'python') compilerId = 'python-3.14';
    else if (language === 'c') compilerId = 'gcc-15';
    else if (language === 'java') compilerId = 'openjdk-25';

    // ━━━ 4. DEDUPLICATION CACHE ━━━
    const codeHash = Buffer.from(code).toString('base64');
    const stdinHash = Buffer.from(stdin).toString('base64');
    const cacheKey = `${compilerId}:${codeHash}:${stdinHash}`;
    
    if (executionCache.has(cacheKey)) {
      return NextResponse.json(executionCache.get(cacheKey));
    }

    // ━━━ 5. VALIDASI KREDENSIAL ━━━
    if (!ONLINE_COMPILER_KEY) {
      return errorResponse(language, "Server Error: ONLINE_COMPILER_KEY belum dikonfigurasi di .env.local");
    }

    // ━━━ 6. EKSEKUSI SINKRON INSTAN (DENGAN TIMEOUT PROTECTION) ━━━
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const submissionResponse = await fetch(ONLINE_COMPILER_SYNC_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": ONLINE_COMPILER_KEY
      },
      body: JSON.stringify({
        compiler: compilerId,
        code: code,
        input: stdin
      })
    });

    clearTimeout(timeoutId);

    if (!submissionResponse.ok) {
      let errTxt = await submissionResponse.text();
      try {
        const errJson = JSON.parse(errTxt);
        errTxt = errJson.error || errJson.message || errTxt;
      } catch (e) {}
      
      console.error("OnlineCompiler.io API Error:", errTxt);
      return errorResponse(language, `Compiler API Error: ${errTxt}`);
    }

    // ━━━ 6. PEMROSESAN RESPONSE METRICS ━━━
    const resultData = await submissionResponse.json();

    const stdoutText = resultData.output || resultData.stdout || "";
    const stderrText = resultData.stderr || resultData.error || "";
    const exitCode = resultData.exit_code !== undefined ? resultData.exit_code : (resultData.code || 0);
    const isError = exitCode !== 0;

    const combinedOutput = [stdoutText, stderrText].filter(Boolean).join("\n\n");

    const responsePayload: ExecuteResponse = {
      language,
      version: "OnlineCompiler.io",
      run: {
        stdout: stdoutText,
        stderr: stderrText,
        output: combinedOutput || "Program selesai dijalankan (Tidak ada output).",
        code: isError ? 1 : 0,
        signal: null,
        // Metrik krusial yang bisa Anda pakai di Frontend untuk Gamifikasi
        time: resultData.execution_time || resultData.time || 0,
        memory: resultData.memory || 0
      }
    };

    // KEAMANAN: Batasi ukuran cache untuk mencegah memory leak
    if (executionCache.size >= MAX_CACHE_SIZE) {
      const firstKey = executionCache.keys().next().value;
      if (firstKey) executionCache.delete(firstKey);
    }
    executionCache.set(cacheKey, responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error("Execute API Error:", error.message);
    // Tangkap error khusus timeout (AbortController)
    if (error?.name === 'AbortError') {
      return errorResponse(language, "Waktu tunggu habis (15 detik). Server compiler sedang sibuk, coba lagi.");
    }
    return errorResponse(language, "Terjadi kesalahan internal pada backend eksekusi.");
  }
}
