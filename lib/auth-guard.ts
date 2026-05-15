import { NextResponse } from "next/server";

/**
 * Middleware helper untuk mengecek apakah request berasal dari admin/dosen.
 * 
 * CATATAN: Saat ini menggunakan custom header "x-user-role" sebagai placeholder.
 * Ketika sistem autentikasi asli (Supabase Auth, Clerk, dll.) sudah diimplementasi,
 * ganti logika di bawah ini dengan validasi token JWT / session cookie.
 * 
 * Contoh penggunaan di route.ts:
 *   const authError = requireAdmin(req);
 *   if (authError) return authError;
 */
export function requireAdmin(req: Request): NextResponse | null {
  // TODO: Ganti dengan validasi session/token asli saat auth sudah ada
  const role = req.headers.get("x-user-role");

  if (!role || !["admin", "dosen"].includes(role)) {
    return NextResponse.json(
      { error: "Unauthorized. Hanya admin atau dosen yang dapat mengakses endpoint ini." },
      { status: 403 }
    );
  }

  return null; // Akses diizinkan
}
