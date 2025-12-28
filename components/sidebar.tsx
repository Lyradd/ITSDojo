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
  ClipboardCheck,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings
} from "lucide-react";
import { useUserStore } from "@/lib/store";

// Menu untuk Mahasiswa
const studentMenuItems = [
  { icon: Home, label: "Learn", href: "/learn" },
  { icon: BookOpen, label: "Course List", href: "/courses" },
  { icon: ClipboardCheck, label: "Evaluasi", href: "/evaluation" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Target, label: "Daily Goals", href: "/goals" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Swords, label: "Brain Duel", href: "/duel" },
];

// Menu untuk Dosen
const dosenMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: Users, label: "Students", href: "/admin/students" },
  { icon: ClipboardCheck, label: "Evaluations", href: "/admin/evaluations" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { name, role, logout } = useUserStore(); 
  
  // Pilih menu berdasarkan role
  const sidebarItems = role === 'dosen' ? dosenMenuItems : studentMenuItems; 

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
      <div className="flex-1 flex flex-col gap-2 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          
          // Unified colors for both roles (Blue/Cyan theme)
          const activeColors = "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300 border-2 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 dark:border-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30";
          
          const hoverColors = "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 hover:border-blue-200 dark:hover:border-blue-800";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group border border-transparent",
                isActive 
                  ? activeColors
                  : cn("text-zinc-600 dark:text-zinc-400", hoverColors)
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-blue-200 dark:bg-blue-800/50"
                  : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive && "text-blue-700 dark:text-blue-400"
                )} />
              </div>
              
              <span className={cn(
                "hidden lg:block font-bold text-sm tracking-wide transition-all duration-300",
                isActive && "scale-105"
              )}>
                {item.label}
              </span>

              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full animate-pulse bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
