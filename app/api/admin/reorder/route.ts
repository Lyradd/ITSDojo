import { NextResponse } from "next/server";
import { db } from "@/db";
import { units, lessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrDosen } from "@/lib/auth-guard";

export async function PUT(req: Request) {
  const authError = await requireAdminOrDosen(req);
  if (authError) return authError;

  try {

    const { type, items } = await req.json();

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Eksekusi semua update order secara paralel
    const promises = items.map((item: { id: number; order: number }) => {
      if (type === "units") {
        return db.update(units).set({ order: item.order }).where(eq(units.id, item.id));
      } else if (type === "lessons") {
        return db.update(lessons).set({ order: item.order }).where(eq(lessons.id, item.id));
      }
      return null;
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
