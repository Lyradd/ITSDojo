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

export async function cleanupInactivePlayers(lobby: any) {
  const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
  const now = Date.now();

  const activePlayers = players.filter((p) => {
    // Always keep host
    if (p.id === lobby.hostId) return true;

    const key = `${lobby.id}:${p.id}`;
    const lastActive = heartbeats.get(key);
    const isActive = lastActive && (now - lastActive < 6000); // 6 seconds timeout
    return isActive;
  });

  if (activePlayers.length !== players.length) {
    console.log(`[arena-heartbeat] Removing inactive players from room ${lobby.id}. Active count: ${activePlayers.length}/${players.length}`);
    await db
      .update(arenaRooms)
      .set({
        players: activePlayers,
        updatedAt: new Date(),
      })
      .where(eq(arenaRooms.id, lobby.id));
    
    lobby.players = activePlayers;
  }

  return activePlayers;
}
