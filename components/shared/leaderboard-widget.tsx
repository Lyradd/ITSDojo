import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

export interface LeaderboardUser {
  userId?: string;
  name: string;
  score?: number;
  xp?: number;
  rank?: number;
  avatar: string;
}

interface LeaderboardWidgetProps {
  topUsers: LeaderboardUser[];
  currentUserId: string;
  currentUserName: string;
  currentUserXp: number;
  currentUserRank: number;
}

export const LeaderboardWidget = ({ 
  topUsers, 
  currentUserId, 
  currentUserName, 
  currentUserXp, 
  currentUserRank 
}: LeaderboardWidgetProps) => {
  // Show top 3 or all topUsers if less than 3
  const displayedTop = topUsers.slice(0, 3);
  const isUserInTop3 = currentUserRank <= 3;

  return (
    <Card className="hidden lg:block p-4 rounded-2xl border-2">
      <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200 mb-4">Papan Peringkat</h3>
      <div className="space-y-3">
        {displayedTop.map((user, idx) => {
          const isMe = user.userId === currentUserId;
          return (
            <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50" : ""}`}>
              <div className="font-bold text-zinc-400 w-6">{idx + 1}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>{user.name.charAt(0)}</div>
              <div className="flex-1 font-bold text-sm truncate">{user.name}</div>
              <div className="text-xs font-bold text-zinc-400">
                {isMe ? <AnimatedNumber value={currentUserXp} /> : (user.score ?? user.xp ?? 0)} XP
              </div>
            </div>
          );
        })}

        {!isUserInTop3 && (
          <>
            <div className="flex justify-center py-1">
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
              <div className="font-bold text-zinc-400 w-6">{currentUserRank}</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-200 text-blue-700">{currentUserName.charAt(0)}</div>
              <div className="flex-1 font-bold text-sm truncate">{currentUserName} (Kamu)</div>
              <div className="text-xs font-bold text-zinc-400">
                <AnimatedNumber value={currentUserXp} /> XP
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
