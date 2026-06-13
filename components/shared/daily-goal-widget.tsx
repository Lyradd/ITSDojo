import { Card } from "@/components/ui/card";
import { CheckCircle, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { DailyGoal } from "@/lib/store";

interface DailyGoalWidgetProps {
  dailyGoals: DailyGoal[];
}

export const DailyGoalWidget = ({ dailyGoals }: DailyGoalWidgetProps) => {
  return (
    <Card className="w-full p-4 sm:p-5 rounded-2xl border-2 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Misi Harian</h3>
        <Link href="/goals" className="text-blue-500 font-bold text-[10px] sm:text-xs uppercase tracking-wider hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors">Lihat Semua</Link>
      </div>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {dailyGoals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors shrink-0 ${goal.isCompleted ? 'bg-green-100 text-green-600' :
                goal.category === 'academic' ? 'bg-blue-100 text-blue-600' : 
                goal.category === 'competitive' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
              }`}>
              {goal.isCompleted ? <CheckCircle className="w-5 h-5" /> :
                goal.category === 'academic' ? <BookOpen className="w-5 h-5" /> : 
                goal.category === 'competitive' ? <Zap className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm font-bold mb-1.5 gap-0.5 sm:gap-2">
                <span className={`text-xs sm:text-sm line-clamp-2 sm:truncate transition-colors ${goal.isCompleted ? "text-green-600 line-through decoration-2" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {goal.title}
                </span>
                <span className="text-zinc-400 text-[10px] sm:text-xs shrink-0 whitespace-nowrap">{goal.currentProgress}/{goal.targetValue}</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                <div
                  className={`h-full transition-transform duration-700 ease-out origin-left ${goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ transform: `scaleX(${Math.min((goal.currentProgress / goal.targetValue), 1)})` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
