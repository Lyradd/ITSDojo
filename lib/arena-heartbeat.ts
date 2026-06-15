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
  const players = (lobby.players || []) as Array<{ id: string; name: string; email: string; avatar: string }>;
  const now = Date.now();
  const TIMEOUT = 8 * 1000; // 8 seconds timeout (safe threshold for 2s polling interval)

  const activePlayers = players.filter((p) => {
    // Always keep the host in the list to preserve the lobby structure
    const isHost = p.id === lobby.hostId;
    if (isHost) return true;

    const key = `${lobby.id}:${p.id}`;
    const lastHeartbeat = heartbeats.get(key);
    if (!lastHeartbeat) {
      // If no heartbeat is recorded yet, initialize it to now to give them time to connect
      heartbeats.set(key, now);
      return true;
    }

    return now - lastHeartbeat < TIMEOUT;
  });

  // If player list has changed, update the database
  if (activePlayers.length !== players.length) {
    lobby.players = activePlayers;
    await db
      .update(arenaRooms)
      .set({
        players: activePlayers,
        updatedAt: new Date(),
      })
      .where(eq(arenaRooms.id, lobby.id));
  }

  return activePlayers;
}
