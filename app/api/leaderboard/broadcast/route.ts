import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/actions/leaderboard";

// Endpoint internal: dipanggil dari server action setelah submitEvaluationResult
// untuk push leaderboard fresh ke semua client yang sedang subscribe via Socket.IO.
export async function POST() {
  try {
    const io = (globalThis as any).__io;
    if (!io) {
      return NextResponse.json(
        { ok: false, error: "Socket.IO server not initialized (run via `npm run dev` / server.js)" },
        { status: 503 },
      );
    }

    const leaderboard = await getLeaderboardData();
    io.emit("leaderboard:update", leaderboard);

    return NextResponse.json({ ok: true, count: leaderboard.length });
  } catch (error) {
    console.error("Failed to broadcast leaderboard:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
