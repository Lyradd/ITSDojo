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
  { icon: User, label: "Profile", href: "/profile" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/more" },
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
      <div className="flex-1 flex flex-col gap-2 px-3 py-4">
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

      {/* --- PROFILE SECTION --- */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
         <Link 
           href="/profile" 
           className="flex items-center gap-3 px-3 py-3 w-full rounded-xl transition-all duration-300 group border-2 border-transparent hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 hover:border-blue-300 dark:hover:border-blue-700"
         >
            {/* Avatar User */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 border-2 shadow-lg transition-all duration-300 group-hover:scale-110 bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-300 dark:border-blue-700">
              {name.charAt(0).toUpperCase()}
            </div>
            
            {/* Info User */}
            <div className="hidden lg:block text-left overflow-hidden flex-1">
                <p className="font-bold text-sm truncate text-zinc-700 dark:text-zinc-200">
                  {name}
                </p>
                <p className="text-xs font-semibold truncate text-blue-600 dark:text-blue-400">
                  {role === 'dosen' ? '👨‍🏫 Dosen' : '👨‍🎓 Student'}
                </p>
            </div>

            <MoreHorizontal className="w-4 h-4 ml-auto text-zinc-400 hidden lg:block group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
         </Link>

         {/* Logout Button */}
         <button
           onClick={() => {
             logout();
             window.location.href = '/login';
           }}
           className="flex items-center gap-3 px-3 py-2 w-full rounded-xl transition-all duration-300 group mt-2 border-2 border-transparent hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 hover:border-red-300 dark:hover:border-red-700"
         >
           <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-all duration-300">
             <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
           </div>
           <span className="hidden lg:block font-bold text-sm text-red-600 dark:text-red-400">
             Logout
           </span>
         </button>
      </div>
    </div>
  );
}
