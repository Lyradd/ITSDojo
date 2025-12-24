"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  CalendarDays, 
  Target, 
  Trophy, 
  Swords, 
  User, 
  MoreHorizontal,
  GraduationCap,
  ClipboardCheck
} from "lucide-react";
import { useUserStore } from "@/lib/store";

const sidebarItems = [
  { icon: Home, label: "Learn", href: "/learn" },
  { icon: BookOpen, label: "Course List", href: "/courses" },
  { icon: ClipboardCheck, label: "Evaluasi", href: "/evaluation" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Target, label: "Daily Goals", href: "/goals" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Swords, label: "Brain Duel", href: "/duel" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/more" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { name } = useUserStore(); 

  return (
    <div className="flex flex-col h-full border-r bg-card text-card-foreground">
      {/* --- LOGO APLIKASI --- */}
      <div className="h-20 flex items-center px-6 lg:px-8">
        <Link href="/learn" className="flex items-center gap-2 font-bold text-2xl text-blue-600 transition-opacity hover:opacity-80">
          <GraduationCap className="w-8 h-8" />
          <span className="hidden lg:block tracking-tight">ITSDojo</span>
        </Link>
      </div>

      {/* --- NAVIGATION MENU --- */}
      <div className="flex-1 flex flex-col gap-2 px-3 py-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-100/50 text-blue-600 border-blue-200 border dark:bg-blue-900/20 dark:border-blue-800" 
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              
              <span className="hidden lg:block font-bold tracking-wide text-sm uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* --- PROFILE SECTION --- */}
      <div className="p-4 border-t">
         <Link href="/profile" className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
            {/* Avatar User */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 border-2 border-white dark:border-zinc-900 shadow-sm">
              {name.charAt(0).toUpperCase()}
            </div>
            
            {/* Info User */}
            <div className="hidden lg:block text-left overflow-hidden">
                <p className="font-bold text-sm truncate text-zinc-700 dark:text-zinc-200">
                  {name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  Student
                </p>
            </div>

            <MoreHorizontal className="w-4 h-4 ml-auto text-zinc-400 hidden lg:block group-hover:text-zinc-600" />
         </Link>
      </div>
    </div>
  );
}