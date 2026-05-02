"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  ShoppingBag,
  MoreVertical,
  Gem,
  Zap
} from "lucide-react";


const studentMenuItems = [
  { icon: Home, label: "Learn", href: "/learn" },
  { icon: BookOpen, label: "Course List", href: "/courses" },
  { icon: ClipboardCheck, label: "Evaluasi", href: "/evaluation" },
  { icon: Target, label: "Daily Goals", href: "/goals" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Swords, label: "Brain Duel", href: "/duel" },
  { icon: ShoppingBag, label: "Shop", href: "/shop" },
];

// Menu untuk Dosen
const dosenMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: Users, label: "Students", href: "/admin/students" },
  { icon: ClipboardCheck, label: "Evaluations", href: "/admin/evaluations" },
  { icon: UserCheck, label: "Permintaan Kelas", href: "/admin/enrollments" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

// Menu untuk Asisten Dosen (same as dosen but no Settings)
const asdosMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: Users, label: "Students", href: "/admin/students" },
  { icon: ClipboardCheck, label: "Evaluations", href: "/admin/evaluations" },
  { icon: UserCheck, label: "Permintaan Kelas", href: "/admin/enrollments" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
];

// Menu untuk Super Admin
const superAdminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Manage Users", href: "/admin/users" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: ClipboardCheck, label: "Evaluations", href: "/admin/evaluations" },
  { icon: UserCheck, label: "Permintaan Kelas", href: "/admin/enrollments" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "System Settings", href: "/admin/settings" },
];

export function Sidebar({ onToggle }: { onToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, role, level, xp, xpToNextLevel, gems, logout } = useUserStore(); 
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);  
  const xpPercentage = Math.min((xp / xpToNextLevel) * 100, 100);
  // Pilih menu berdasarkan role
  const sidebarItems = role === 'admin'
    ? superAdminMenuItems
    : role === 'dosen' 
      ? dosenMenuItems 
      : role === 'asdos' 
        ? asdosMenuItems 
        : studentMenuItems;

  const handleLogout = () => {
    logout();
    router.push('/login');
  }; 

  return (
    <div className="flex flex-col h-full border-r bg-card text-card-foreground">
      {/* --- LOGO APLIKASI --- */}
      <div className="h-20 flex items-center justify-between px-6 lg:px-8">
        <Link href="/learn" className="flex items-center gap-2 font-black text-2xl group">
          <GraduationCap className="w-8 h-8 shrink-0 text-blue-600 dark:text-white" />
          <span className="tracking-tighter">
            <span className="text-blue-600 dark:text-white">ITS</span>
            <span className="text-blue-600 dark:text-white">Dojo</span>
          </span>
        </Link>
        
        {/* Toggle Button - Only shown when onToggle is provided */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Tutup Menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* --- NAVIGATION MENU --- */}
      <div className="flex-1 flex flex-col gap-2 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href;
          
          // Unified colors for both roles (Blue/Cyan theme)
          const activeColors = "bg-linear-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300 border-2 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 dark:border-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30";
          
          const hoverColors = "hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 hover:border-blue-200 dark:hover:border-blue-800";
          
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.28, ease: 'easeOut' }}
            >
              <Link
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
                "block font-bold text-sm tracking-wide transition-all duration-300",
                isActive && "scale-105"
              )}>
                {item.label}
              </span>

              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full animate-pulse bg-blue-600" />
              )}
            </Link>
            </motion.div>
          );
        })}
      </div>

      {/* --- PROFILE SECTION (Fixed at bottom) --- */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                <span className="text-xs">
                  {role === "admin" ? "👑" : role === "dosen" ? "👨‍🏫" : role === "asdos" ? "🧑‍💻" : "👨‍🎓"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="font-semibold text-sm truncate text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {name}
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  <span>Level {level}</span>
                  <span className="flex items-center gap-0.5 text-blue-500">
                    <Gem className="w-2.5 h-2.5 fill-current" /> {gems}
                  </span>
                </div>
                {/* XP Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-400"
                  />
                </div>
                <p className="text-[9px] text-zinc-400 font-medium">
                  {xp} / {xpToNextLevel} XP
                </p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/settings" className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
