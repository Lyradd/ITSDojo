import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Middleware helper untuk mengecek apakah request berasal dari admin/dosen.
 * 
 * Menggunakan signed HTTP-only session cookie untuk validasi identitas.
 * Cookie di-set saat login (validateLogin) dan dihapus saat logout (logoutSession).
 * 
 * Contoh penggunaan di route.ts:
 *   const authError = await requireAdmin(req);
 *   if (authError) return authError;
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const session = await getSession();

  if (!session || !["admin", "dosen"].includes(session.role)) {
    return NextResponse.json(
      { error: "Unauthorized. Hanya admin atau dosen yang dapat mengakses endpoint ini." },
      { status: 403 }
    );
  }

  return null; // Akses diizinkan
}

/**
 * Helper untuk mendapatkan userId dari session cookie.
 * Mengembalikan null jika tidak ada sesi aktif.
 * 
 * Contoh penggunaan di route.ts:
 *   const userId = await getAuthUserId();
 *   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}
