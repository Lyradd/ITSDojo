import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Middleware/Server Helper untuk memvalidasi Role (Otorisasi).
 * Mengembalikan objek error jika tidak memiliki izin, 
 * atau null jika lolos (diizinkan).
 */
export async function requireRole(allowedRoles: string[]): Promise<{ error: string, status: number } | null> {
  const session = await getSession();
  
  if (!session || !session.userId) {
    return { error: "Unauthorized", status: 401 };
  }
  
  if (!allowedRoles.includes(session.role)) {
    return { error: "Forbidden - Tidak ada hak akses ke area ini.", status: 403 };
  }
  
  return null; // Lolos
}

/**
 * Helper spesifik untuk mengecek admin di route handler.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const result = await requireRole(['admin']);
  if (result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return null;
}

/**
 * Helper untuk mendapatkan userId dari session cookie.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}
