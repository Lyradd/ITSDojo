import { Card } from "@/components/ui/card";
import { CheckCircle, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { DailyGoal } from "@/lib/store";

interface DailyGoalWidgetProps {
  dailyGoals: DailyGoal[];
}

export const DailyGoalWidget = ({ dailyGoals }: DailyGoalWidgetProps) => {
  return (
    <Card className="hidden lg:block p-4 rounded-2xl border-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Misi Harian</h3>
        <Link href="/goals" className="text-blue-500 font-bold text-xs uppercase hover:underline">Lihat Semua</Link>
      </div>
      <div className="space-y-4">
        {dailyGoals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${goal.isCompleted ? 'bg-green-100 text-green-600' :
                goal.type === 'xp' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              }`}>
              {goal.isCompleted ? <CheckCircle className="w-5 h-5" /> :
                goal.type === 'xp' ? <Zap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className={goal.isCompleted ? "text-green-600 line-through decoration-2" : "text-zinc-700 dark:text-zinc-300"}>
                  {goal.title}
                </span>
                <span className="text-zinc-400">{goal.current}/{goal.target}</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                <div
                  className={`h-full transition-all duration-700 ease-out ${goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
