import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const topicId = Number(body.topicId);
    const requestedHostId = typeof body.hostId === "string" && body.hostId.trim().length > 0
      ? body.hostId.trim()
      : typeof body.hostEmail === "string" && body.hostEmail.trim().length > 0
        ? body.hostEmail.trim()
        : null;
    const hostEmail = typeof body.hostEmail === "string" && body.hostEmail.trim().length > 0
      ? body.hostEmail.trim()
      : requestedHostId;

    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topicId" }, { status: 400 });
    }

    if (!requestedHostId || !hostEmail) {
      return NextResponse.json({ error: "Missing host identity" }, { status: 400 });
    }

    // Resolve canonical users.id from email so duel_rooms.host_id stores user id, not raw email.
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, hostEmail))
      .limit(1);

    const hostId = existingUser?.id ?? requestedHostId;

    if (!existingUser) {
      await db
        .insert(users)
        .values({
          id: hostId,
          name: typeof body.hostName === "string" && body.hostName.trim().length > 0 ? body.hostName.trim() : hostId,
          email: hostEmail,
          role: typeof body.hostRole === "string" && body.hostRole.trim().length > 0
            ? body.hostRole.trim() as "mahasiswa" | "asdos" | "dosen" | "admin"
            : "mahasiswa",
        })
        .onConflictDoNothing();
    }

    const inviteCode = crypto.randomUUID();

    const [room] = await db
      .insert(duelRooms)
      .values({
        topicId,
        hostId,
        inviteCode,
        status: "waiting",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: duelRooms.id, inviteCode: duelRooms.inviteCode, status: duelRooms.status });

    return NextResponse.json({
      id: room?.id ?? null,
      inviteCode: room?.inviteCode ?? inviteCode,
      status: room?.status ?? "waiting",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lobby";
    const cause = error && typeof error === "object" && "cause" in error
      ? (error as { cause?: unknown }).cause
      : undefined;

    console.error("[duel/lobbies] create failed:", error);
    return NextResponse.json({
      error: message,
      cause: cause instanceof Error ? cause.message : cause ?? null,
    }, { status: 500 });
  }
}