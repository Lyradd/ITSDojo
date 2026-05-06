import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelRooms, duelSubject } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const topicId = Number(body.topicId);
  const hostId = body.hostId;

  if (!topicId || Number.isNaN(topicId)) {
    return NextResponse.json({ error: "Invalid topicId" }, { status: 400 });
  }

  if (!hostId || typeof hostId !== "string") {
    return NextResponse.json({ error: "Missing hostId" }, { status: 400 });
  }

  const topic = await db
    .select()
    .from(duelSubject)
    .where(eq(duelSubject.id, topicId))
    .limit(1);

  if (topic.length === 0) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
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
    .returning({ id: duelRooms.id, inviteCode: duelRooms.inviteCode });

    return NextResponse.json({
    id: room?.id ?? null,
    inviteCode: room?.inviteCode ?? inviteCode,
    });
}