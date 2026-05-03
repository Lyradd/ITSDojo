"use client";

import { useUserStore } from "@/lib/store";
import { formatLocalDate } from "@/lib/utils";

export function ActivityHeatmap() {
  const { activityHistory } = useUserStore();

  const today = new Date();
  // Normalisasi waktu hari ini ke tengah malam agar komparasi tanggal akurat
  today.setHours(0, 0, 0, 0);
  
  const todayDayOfWeek = (today.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  
  // Render 15 minggu (15 kolom * 7 hari)
  // Kolom terakhir berakhir di hari Minggu minggu ini.
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - todayDayOfWeek - (14 * 7));
  
  const totalDays = 15 * 7; // 105 kotak
  
  // Buat array tanggal
  const calendarDays = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  // Kelompokkan menjadi 15 kolom (per minggu)
  const weeks = [];
  for (let i = 0; i < 15; i++) {
    weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
  }

  // Generate label bulan
  const monthLabels: { month: string; colIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    const month = week[0].getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        month: week[0].toLocaleDateString('id-ID', { month: 'short' }),
        colIndex: index
      });
      lastMonth = month;
    }
  });

  return (
    <div className="flex flex-col gap-2 w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
      
      {/* Container Kalender */}
      <div className="flex min-w-max">
        
        {/* Label Hari di Kiri */}
        <div className="flex flex-col gap-1.5 mt-6 mr-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold text-right">
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Sen</div>
          <div className="h-3.5 md:h-4"></div> {/* Sel */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Rab</div>
          <div className="h-3.5 md:h-4"></div> {/* Kam */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Jum</div>
          <div className="h-3.5 md:h-4"></div> {/* Sab */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Min</div>
        </div>

        <div className="flex flex-col">
          {/* Label Bulan di Atas */}
          <div className="relative h-6 w-full text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
            {monthLabels.map((lbl, i) => (
              <span 
                key={i} 
                className="absolute top-0 leading-none"
                style={{ left: `calc(${lbl.colIndex} * (1rem + 0.375rem))` }} // 1rem width + 0.375rem gap (1.5 * 0.25rem)
              >
                {lbl.month}
              </span>
            ))}
          </div>

          {/* Grid Kotak */}
          <div className="flex gap-1.5">
            {weeks.map((week: Date[], weekIdx: number) => (
              <div key={weekIdx} className="flex flex-col gap-1.5">
                {week.map((dayObj: Date, dayIdx: number) => {
                  const dateStr = formatLocalDate(dayObj);
                  const record = activityHistory.find((h: { date: string, count: number }) => h.date === dateStr);
                  const count = record ? record.count : 0;
                  const isFuture = dayObj > today;
                  
                  // Konversi count ke warna
                  let level = 0;
                  if (count === 1) level = 1;
                  else if (count === 2) level = 2;
                  else if (count === 3) level = 3;
                  else if (count >= 4) level = 4;

                  let colorClass = "bg-zinc-100 dark:bg-zinc-800/50";
                  if (isFuture) colorClass = "bg-transparent"; // Kosongkan hari di masa depan
                  else if (level === 1) colorClass = "bg-blue-200 dark:bg-blue-900/60";
                  else if (level === 2) colorClass = "bg-blue-300 dark:bg-blue-700/80";
                  else if (level === 3) colorClass = "bg-blue-400 dark:bg-blue-500/90";
                  else if (level === 4) colorClass = "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
                  
                  const isTopRow = dayIdx < 2;
                  const isLeftEdge = weekIdx < 2;
                  const isRightEdge = weekIdx > 12;

                  let horizontalClass = "left-1/2 -translate-x-1/2";
                  if (isLeftEdge) horizontalClass = "left-0 translate-x-0";
                  else if (isRightEdge) horizontalClass = "left-auto right-0 translate-x-0";

                  let arrowHorizontalClass = "left-1/2 -translate-x-1/2";
                  if (isLeftEdge) arrowHorizontalClass = "left-2 translate-x-0";
                  else if (isRightEdge) arrowHorizontalClass = "left-auto right-2 translate-x-0";

                  return (
                    <div 
                      key={dayIdx} 
                      className={`relative group w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] ${colorClass} ${!isFuture && 'hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-200 transition-all cursor-pointer'}`} 
                    >
                      {/* Tooltip (Hanya Muncul Jika Bukan Masa Depan) */}
                      {!isFuture && (
                        <div className={`absolute ${isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'} ${horizontalClass} w-max px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none flex flex-col items-center border border-zinc-700 dark:border-zinc-300`}>
                          <span>{count === 0 ? "Tidak ada aktivitas" : `${count} kontribusi`}</span>
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <div className={`absolute ${isTopRow ? 'bottom-full border-b-zinc-800 dark:border-b-zinc-200' : 'top-full border-t-zinc-800 dark:border-t-zinc-200'} ${arrowHorizontalClass} border-[5px] border-transparent`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 min-w-max">
         <span>Sedikit</span>
         <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-zinc-100 dark:bg-zinc-800/50"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-200 dark:bg-blue-900/60"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-300 dark:bg-blue-700/80"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-400 dark:bg-blue-500/90"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500 dark:bg-blue-400"></div>
         </div>
         <span>Banyak</span>
      </div>
    </div>
  );
}
