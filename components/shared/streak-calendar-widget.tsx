"use client";

import { Flame, ChevronLeft, ChevronRight, Check, Snowflake } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StreakCalendarWidgetProps {
  activityHistory: { date: string, count: number, xpEarned: number }[];
  streak: number;
}

export function StreakCalendarWidget({ activityHistory, streak }: StreakCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const totalDays = daysInMonth(year, month);
  const firstDay = (firstDayOfMonth(year, month) + 6) % 7; // Monday = 0

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    const now = new Date();
    return now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
  };

  const hasActivity = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activityHistory.some(h => h.date === dateStr && (h.count > 0 || h.xpEarned > 0));
  };

  const isFreezeUsed = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // @ts-ignore
    return activityHistory.some(h => h.date === dateStr && h.freezeUsed);
  };

  const getDayXp = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const h = activityHistory.find(h => h.date === dateStr);
    return h ? h.xpEarned : 0;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 w-[320px] sm:w-[380px] shadow-2xl border-2 border-zinc-100 dark:border-zinc-800 cursor-default">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Flame className="w-5 h-5 text-orange-500 fill-current" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-zinc-800 dark:text-white leading-tight">Riwayat Streak</h3>
          <p className="text-[10px] sm:text-xs text-zinc-500">{streak} Hari Streak Saat Ini</p>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 sm:p-4 border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">{monthNames[month]} {year}</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-zinc-400 uppercase">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map(i => <div key={`empty-${i}`} className="aspect-square" />)}
          {days.map(day => {
            const active = hasActivity(day);
            const freeze = isFreezeUsed(day);
            const today = isToday(day);
            const xp = getDayXp(day);
            
            return (
              <div 
                key={day} 
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group/day transition-all ${
                  active 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : freeze
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-500 dark:bg-blue-900/20 dark:border-blue-800'
                      : today 
                        ? 'border-2 border-orange-500 text-orange-500' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-bold">{day}</span>
                {active && <Check className="w-2 h-2 absolute bottom-0.5 sm:bottom-1" />}
                {freeze && <Snowflake className="w-2 h-2 absolute bottom-0.5 sm:bottom-1 text-blue-500" />}
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] shadow-xl">
                  {active ? `Berhasil! +${xp} XP` : freeze ? 'Streak Freeze Terpakai' : 'Belum ada aktivitas'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
