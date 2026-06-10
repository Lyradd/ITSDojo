import { db } from "@/db";
import { arenaRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

const globalStore = globalThis as typeof globalThis & {
  __arenaHeartbeats?: Map<string, number>;
};

if (!globalStore.__arenaHeartbeats) {
  globalStore.__arenaHeartbeats = new Map<string, number>();
}

const heartbeats = globalStore.__arenaHeartbeats;

export function recordHeartbeat(roomId: string | number, playerId: string) {
  const key = `${roomId}:${playerId}`;
  heartbeats.set(key, Date.now());
}

export async function cleanupInactivePlayers(lobby: any): Promise<Array<{ id: string; name: string; email: string; avatar: string }>> {
  return (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
}
