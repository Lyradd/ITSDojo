import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

export interface LeaderboardUser {
  userId?: string;
  name: string;
  score?: number; // InINITIAL_LEADERBOARD, it's score
  xp?: number; // Might be mapped to xp
  rank: number;
  avatar: string;
}

interface LeaderboardWidgetProps {
  topUser: LeaderboardUser;
  name: string;
  xp: number;
  userRank: number;
}

export const LeaderboardWidget = ({ topUser, name, xp, userRank }: LeaderboardWidgetProps) => {
  return (
    <Card className="hidden lg:block p-4 rounded-2xl border-2">
      <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200 mb-4">Leaderboard</h3>
      <div className="space-y-3">
        {[
          { name: topUser.name, xp: topUser.score ?? topUser.xp ?? 0, rank: 1, avatar: topUser.avatar },
          { name: `${name} (You)`, xp: xp, rank: userRank, avatar: "bg-blue-200 text-blue-700" }
        ].map((user, idx) => (
          <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${user.name.includes("You") ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50" : ""}`}>
            <div className="font-bold text-zinc-400 w-6">{user.rank}</div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>{user.name.charAt(0)}</div>
            <div className="flex-1 font-bold text-sm truncate">{user.name}</div>
            <div className="text-xs font-bold text-zinc-400">
              {user.name.includes("You") ? <AnimatedNumber value={user.xp} /> : user.xp} XP
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
