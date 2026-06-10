import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms, users } from "@/db/schema";
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

    // Resolve canonical users.id from email
    const [existingUser] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
      .from(users)
      .where(eq(users.email, hostEmail))
      .limit(1);

    const hostId = existingUser?.id ?? requestedHostId;
    const hostName = existingUser?.name ?? (typeof body.hostName === "string" && body.hostName.trim().length > 0 ? body.hostName.trim() : hostId);
    const hostAvatar = existingUser?.avatar ?? "bg-blue-200 text-blue-700";

    if (!existingUser) {
      await db
        .insert(users)
        .values({
          id: hostId,
          name: hostName,
          email: hostEmail,
          avatar: hostAvatar,
          role: typeof body.hostRole === "string" && body.hostRole.trim().length > 0
            ? body.hostRole.trim() as "mahasiswa" | "asdos" | "dosen" | "admin"
            : "mahasiswa",
        })
        .onConflictDoNothing();
    }

    const inviteCode = crypto.randomUUID();

    const hostPlayer = {
      id: hostId,
      name: hostName,
      email: hostEmail,
      avatar: hostAvatar,
    };

    const [room] = await db
      .insert(arenaRooms)
      .values({
        topicId,
        hostId,
        players: [hostPlayer],
        inviteCode,
        status: "waiting",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(room);
  } catch (error) {
    console.error("[arena/lobbies] POST failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create arena lobby";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
