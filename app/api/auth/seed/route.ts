import { NextResponse } from "next/server";
import { seedMockUsers } from "@/actions/auth";

// One-time setup endpoint: seed MOCK_STUDENTS ke tabel users.
// Aman dipanggil berkali-kali (idempotent — skip user yang sudah ada).
// Cara pakai: buka http://localhost:3000/api/auth/seed di browser, atau curl POST.
export async function POST() {
  const res = await seedMockUsers();
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}

// Boleh GET juga untuk kemudahan trigger via browser tanpa tools curl/postman.
export async function GET() {
  return POST();
}
