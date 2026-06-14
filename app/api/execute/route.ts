import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// ============================================
// KONFIGURASI KEAMANAN & BATASAN
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

// ============================================
// REDIS-READY ABSTRACTION: RATE LIMITER
// ============================================

class RateLimiter {
  private map = new Map<string, { count: number; resetTime: number }>();
  private maxRequests = 10;
  private windowMs = 60_000; // 1 menit

  // Didesain asinkron agar mudah diganti dengan Upstash Redis
  async check(userId: string): Promise<boolean> {
    const now = Date.now();
    const entry = this.map.get(userId);
    
    // Lazy Evaluation: Hapus/Timpa jika kedaluwarsa saat diakses
    if (!entry || now > entry.resetTime) {
      this.map.set(userId, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// REDIS-READY ABSTRACTION: LAZY TTL CACHE
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

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ExecutionCache {
  private cache = new Map<string, CacheEntry<ExecuteResponse>>();
  private maxSize = 500;
  private ttlMs = 15 * 60_000; // True TTL: 15 menit

  // Didesain asinkron agar siap diganti ke eksekusi Redis (Upstash)
  async get(key: string): Promise<ExecuteResponse | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Lazy Evaluation: Evaluasi kedaluwarsa hanya saat diakses (mencegah setInterval & Cache Stampede)
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: ExecuteResponse): Promise<void> {
    // FIFO Displacement: Cegah memory leak di serverless Vercel jika map membengkak
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

const executionCache = new ExecutionCache();

// ============================================
// UTILS
// ============================================

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
    // ━━━ 1. AUTENTIKASI & RATE LIMIT (Abstraksi Redis-Ready) ━━━
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await rateLimiter.check(session.userId);
    if (!isAllowed) {
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

    // ━━━ 4. DEDUPLICATION CACHE (Lazy TTL) ━━━
    const codeHash = Buffer.from(code).toString('base64');
    const stdinHash = Buffer.from(stdin).toString('base64');
    const cacheKey = `${compilerId}:${codeHash}:${stdinHash}`;
    
    const cachedResult = await executionCache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
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

    // ━━━ 7. PEMROSESAN RESPONSE METRICS ━━━
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

    await executionCache.set(cacheKey, responsePayload);

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
