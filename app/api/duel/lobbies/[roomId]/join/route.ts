import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const requestedRoomId = resolvedParams.roomId;

  const body = await req.json();
  const requestedGuestId = typeof body.guestId === "string" && body.guestId.trim().length > 0
    ? body.guestId.trim()
    : typeof body.guestEmail === "string" && body.guestEmail.trim().length > 0
      ? body.guestEmail.trim()
      : null;
  const guestEmail = typeof body.guestEmail === "string" && body.guestEmail.trim().length > 0
    ? body.guestEmail.trim()
    : requestedGuestId;
  const guestName = typeof body.guestName === "string" && body.guestName.trim().length > 0
    ? body.guestName.trim()
    : guestEmail;
  const guestRole = typeof body.guestRole === "string" && body.guestRole.trim().length > 0
    ? body.guestRole.trim()
    : "mahasiswa";

  if (!requestedGuestId || !guestEmail) {
    return NextResponse.json({ error: "Missing guest identity" }, { status: 400 });
  }

  // Reuse existing account by email to satisfy guest_id -> users.id FK.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, guestEmail))
    .limit(1);

  const guestId = existingUser?.id ?? requestedGuestId;

  if (!existingUser) {
    await db
      .insert(users)
      .values({
        id: guestId,
        name: guestName,
        email: guestEmail,
        role: guestRole as "mahasiswa" | "asdos" | "dosen" | "admin",
      })
      .onConflictDoNothing();
  }

  const rooms = await db.select().from(duelRooms);
  const lobby = rooms.find((room) => String(room.id) === requestedRoomId || room.inviteCode === requestedRoomId);

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const result = await db
    .update(duelRooms)
    .set({
      guestId,
      status: "joined",
      updatedAt: new Date(),
    })
    .where(eq(duelRooms.id, lobby.id as any));

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "joined" });
}