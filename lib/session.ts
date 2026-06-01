import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================
// SESSION MANAGEMENT — Signed HTTP-Only Cookies
// ============================================
// Modul ini menyediakan mekanisme sesi server-side yang sederhana dan aman.
// Menggunakan HMAC-SHA256 untuk menandatangani payload sesi sehingga
// tidak bisa dipalsukan oleh klien.
//
// Cookie bersifat HTTP-only, SameSite=Lax, dan tidak bisa diakses
// oleh JavaScript di browser — mencegah pencurian via XSS.

const SESSION_COOKIE_NAME = "itsdojo_session";

// Secret key untuk signing — gunakan env variable di production.
// Fallback ke string hardcoded hanya untuk development.
const SECRET = process.env.SESSION_SECRET || "itsdojo-dev-secret-key-change-in-production";

/**
 * Membuat signature HMAC-SHA256 dari sebuah payload string.
 */
function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Memverifikasi bahwa signature cocok dengan payload.
 * Menggunakan timingSafeEqual untuk mencegah timing attacks.
 */
function verify(payload: string, signature: string): boolean {
  const expected = sign(payload);
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

// --- Public API ---

export interface SessionData {
  userId: string;
  role: string;
}

/**
 * Membuat sesi baru: set HTTP-only signed cookie.
 * Dipanggil setelah login berhasil (dari Server Action).
 */
export async function createSession(data: SessionData): Promise<void> {
  const payload = JSON.stringify(data);
  const signature = sign(payload);
  const cookieValue = `${Buffer.from(payload).toString("base64")}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

/**
 * Membaca dan memverifikasi sesi dari cookie.
 * Mengembalikan SessionData jika valid, null jika tidak ada atau signature tidak cocok.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie?.value) return null;

  const dotIndex = cookie.value.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encodedPayload = cookie.value.substring(0, dotIndex);
  const signature = cookie.value.substring(dotIndex + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64").toString("utf-8");
  } catch {
    return null;
  }

  if (!verify(payload, signature)) return null;

  try {
    const data = JSON.parse(payload) as SessionData;
    if (!data.userId || !data.role) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Menghancurkan sesi: hapus cookie.
 * Dipanggil saat logout (dari Server Action).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
