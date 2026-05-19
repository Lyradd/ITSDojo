import { NextResponse } from "next/server";
import { db } from "@/db";
import { courseInstructors, courseAssistants, enrollments, courses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/admin/assignments — Ambil semua assignment (dosen->kelas, asdos->kelas, mhs->kelas)
export async function GET() {
  try {
    // Ambil semua instructor assignments
    const instructors = await db
      .select({
        id: courseInstructors.id,
        userId: courseInstructors.dosenId,
        courseId: courseInstructors.courseId,
        courseTitle: courses.title,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userSemester: users.semester,
        assignedAt: courseInstructors.assignedAt,
      })
      .from(courseInstructors)
      .innerJoin(courses, eq(courseInstructors.courseId, courses.id))
      .innerJoin(users, eq(courseInstructors.dosenId, users.id));

    // Ambil semua assistant assignments
    const assistants = await db
      .select({
        id: courseAssistants.id,
        userId: courseAssistants.asdosId,
        courseId: courseAssistants.courseId,
        courseTitle: courses.title,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userSemester: users.semester,
        assignedAt: courseAssistants.assignedAt,
      })
      .from(courseAssistants)
      .innerJoin(courses, eq(courseAssistants.courseId, courses.id))
      .innerJoin(users, eq(courseAssistants.asdosId, users.id));

    // Ambil semua student enrollments
    const studentEnrollments = await db
      .select({
        id: enrollments.id,
        userId: enrollments.studentId,
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userSemester: users.semester,
        status: enrollments.status,
        assignedAt: enrollments.requestedAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(enrollments.studentId, users.id));

    return NextResponse.json({
      instructors: instructors.map(i => ({ ...i, type: 'instructor' })),
      assistants: assistants.map(a => ({ ...a, type: 'assistant' })),
      students: studentEnrollments.map(s => ({ ...s, type: 'student' })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/assignments — Buat assignment baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, courseId, type } = body;

    if (!userId || !courseId || !type) {
      return NextResponse.json(
        { error: "userId, courseId, dan type wajib diisi." },
        { status: 400 }
      );
    }

    let result;

    if (type === 'instructor') {
      // Cek duplikat
      const existing = await db.select().from(courseInstructors)
        .where(and(eq(courseInstructors.dosenId, userId), eq(courseInstructors.courseId, courseId)));
      if (existing.length > 0) {
        return NextResponse.json({ error: "Dosen sudah ditugaskan ke kelas ini." }, { status: 409 });
      }
      [result] = await db.insert(courseInstructors).values({
        dosenId: userId,
        courseId: courseId,
      }).returning();
    } else if (type === 'assistant') {
      const existing = await db.select().from(courseAssistants)
        .where(and(eq(courseAssistants.asdosId, userId), eq(courseAssistants.courseId, courseId)));
      if (existing.length > 0) {
        return NextResponse.json({ error: "Asdos sudah ditugaskan ke kelas ini." }, { status: 409 });
      }
      [result] = await db.insert(courseAssistants).values({
        asdosId: userId,
        courseId: courseId,
      }).returning();
    } else if (type === 'student') {
      const existing = await db.select().from(enrollments)
        .where(and(eq(enrollments.studentId, userId), eq(enrollments.courseId, courseId)));
      if (existing.length > 0) {
        return NextResponse.json({ error: "Mahasiswa sudah terdaftar di kelas ini." }, { status: 409 });
      }
      [result] = await db.insert(enrollments).values({
        studentId: userId,
        courseId: courseId,
        status: 'accepted', // Pre-assigned = langsung accepted
      }).returning();
    } else {
      return NextResponse.json({ error: "Type tidak valid. Gunakan: instructor, assistant, student" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/assignments — Hapus assignment
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: "type dan id wajib diisi." }, { status: 400 });
    }

    const numId = parseInt(id);

    if (type === 'instructor') {
      await db.delete(courseInstructors).where(eq(courseInstructors.id, numId));
    } else if (type === 'assistant') {
      await db.delete(courseAssistants).where(eq(courseAssistants.id, numId));
    } else if (type === 'student') {
      await db.delete(enrollments).where(eq(enrollments.id, numId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
