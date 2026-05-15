import { NextResponse } from "next/server";
import { db } from "@/db";
import { units } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-guard";

// POST /api/admin/units — Buat unit baru untuk sebuah kursus
export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const [newUnit] = await db.insert(units).values({
      courseId: body.courseId,
      title: body.title,
      description: body.description,
      order: body.order,
    }).returning();
    return NextResponse.json(newUnit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
