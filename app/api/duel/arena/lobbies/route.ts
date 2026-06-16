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
            ? body.hostRole.trim() as "mahasiswa" | "dosen" | "admin"
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

    const bots = [
      {
        id: "bot_arena_1",
        name: "Bot Andi",
        email: "bot_arena_1@itsdojo.local",
        avatar: "bg-yellow-200 text-yellow-700",
      },
      {
        id: "bot_arena_2",
        name: "Bot Budi",
        email: "bot_arena_2@itsdojo.local",
        avatar: "bg-purple-200 text-purple-700",
      },
      {
        id: "bot_arena_3",
        name: "Bot Chika",
        email: "bot_arena_3@itsdojo.local",
        avatar: "bg-pink-200 text-pink-700",
      },
    ];

    const [room] = await db
      .insert(arenaRooms)
      .values({
        topicId,
        hostId,
        players: [hostPlayer, ...bots],
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
