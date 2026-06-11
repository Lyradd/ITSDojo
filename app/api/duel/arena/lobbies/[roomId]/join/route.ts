import { NextResponse } from "next/server";
import { db } from "@/db";
import { arenaRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const requestedRoomId = resolvedParams.roomId;

    const body = await req.json();
    const requestedPlayerId = typeof body.playerId === "string" && body.playerId.trim().length > 0
      ? body.playerId.trim()
      : typeof body.playerEmail === "string" && body.playerEmail.trim().length > 0
        ? body.playerEmail.trim()
        : null;
    const playerEmail = typeof body.playerEmail === "string" && body.playerEmail.trim().length > 0
      ? body.playerEmail.trim()
      : requestedPlayerId;
    const playerName = typeof body.playerName === "string" && body.playerName.trim().length > 0
      ? body.playerName.trim()
      : playerEmail;
    const playerAvatar = typeof body.playerAvatar === "string" && body.playerAvatar.trim().length > 0
      ? body.playerAvatar.trim()
      : "bg-green-200 text-green-700";

    if (!requestedPlayerId || !playerEmail) {
      return NextResponse.json({ error: "Missing player identity" }, { status: 400 });
    }

    // Resolve canonical users.id from email
    const [existingUser] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
      .from(users)
      .where(eq(users.email, playerEmail))
      .limit(1);

    const playerId = existingUser?.id ?? requestedPlayerId;
    const name = existingUser?.name ?? playerName;
    const avatar = existingUser?.avatar ?? playerAvatar;

    if (!existingUser) {
      await db
        .insert(users)
        .values({
          id: playerId,
          name: name,
          email: playerEmail,
          avatar: avatar,
          role: typeof body.playerRole === "string" && body.playerRole.trim().length > 0
            ? body.playerRole.trim() as "mahasiswa" | "dosen" | "admin"
            : "mahasiswa",
        })
        .onConflictDoNothing();
    }

    const rooms = await db.select().from(arenaRooms);
    const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

    if (!lobby) {
      return NextResponse.json({ error: "Arena lobby not found" }, { status: 404 });
    }

    if (lobby.status === "started" || lobby.status === "ended") {
      return NextResponse.json({ error: "Arena game has already started or ended" }, { status: 400 });
    }

    const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
    const playerExists = players.some((p) => p.id === playerId);

    if (!playerExists) {
      players.push({
        id: playerId,
        name: name,
        email: playerEmail,
        avatar: avatar,
      });

      await db
        .update(arenaRooms)
        .set({
          players,
          updatedAt: new Date(),
        })
        .where(eq(arenaRooms.id, lobby.id));
    }

    return NextResponse.json({ status: "joined", players });
  } catch (error) {
    console.error("[arena/lobbies/[roomId]/join] POST failed:", error);
    return NextResponse.json({ error: "Failed to join arena lobby" }, { status: 500 });
  }
}
