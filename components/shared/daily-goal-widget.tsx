import { Card } from "@/components/ui/card";
import { CheckCircle, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { DailyGoal } from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <TooltipProvider delayDuration={200}>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {dailyGoals.map((goal) => (
            <Tooltip key={goal.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-1 rounded-xl cursor-help hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
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
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="center" 
                className="max-w-[280px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xl z-[120]"
              >
                <div className="flex flex-col gap-1 select-none">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-xs text-zinc-950 dark:text-white">{goal.title}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                      goal.category === 'academic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      goal.category === 'competitive' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {goal.category === 'academic' ? 'Akademik' : goal.category === 'competitive' ? 'Kompetitif' : 'Konsistensi'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{goal.description}</p>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Zap className="w-3.5 h-3.5 fill-current text-blue-500" />
                    <span>Hadiah: +{goal.rewardXP} XP</span>
                    {goal.rewardGems > 0 && (
                      <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5 ml-1">
                        💎 +{goal.rewardGems} Gems
                      </span>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </Card>
  );
};
