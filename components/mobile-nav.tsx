"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Swords, 
  MoreHorizontal,
  LayoutDashboard,
  UserCheck,
  Users,
  ClipboardCheck,
  ShieldCheck,
  Settings
} from "lucide-react";
import { useEffect, useState } from "react";

const studentMobileNavItems = [
  { icon: Home, label: "Belajar", href: "/learn" },
  { icon: BookOpen, label: "Kelas", href: "/courses" },
  { icon: Trophy, label: "Peringkat", href: "/leaderboard" },
  { icon: Swords, label: "Duel", href: "/duel" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/more" },
];

const dosenMobileNavItems = [
  { icon: LayoutDashboard, label: "Dasbor", href: "/dosen" },
  { icon: BookOpen, label: "Kelas", href: "/dosen/courses" },
  { icon: UserCheck, label: "Pendaftar", href: "/dosen/enrollments" },
  { icon: Users, label: "Mahasiswa", href: "/dosen/students" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/dosen/more" },
];

const asdosMobileNavItems = [
  { icon: LayoutDashboard, label: "Dasbor", href: "/asdos" },
  { icon: BookOpen, label: "Kelas", href: "/asdos/courses" },
  { icon: UserCheck, label: "Pendaftar", href: "/asdos/enrollments" },
  { icon: Users, label: "Mahasiswa", href: "/asdos/students" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/asdos/more" },
];

const adminMobileNavItems = [
  { icon: LayoutDashboard, label: "Dasbor", href: "/admin" },
  { icon: BookOpen, label: "Kelas", href: "/admin/courses" },
  { icon: UserCheck, label: "Pendaftar", href: "/admin/enrollments" },
  { icon: Users, label: "Pengguna", href: "/admin/users" },
  { icon: MoreHorizontal, label: "Lainnya", href: "/admin/more" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const mobileNavItems = 
    role === 'admin' ? adminMobileNavItems :
    role === 'dosen' ? dosenMobileNavItems :
    role === 'asdos' ? asdosMobileNavItems :
    studentMobileNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-950 border-t flex items-center justify-around px-2 md:hidden">
      {mobileNavItems.map((item) => {
        // Strict exact match for specific dashboard paths to avoid false positives
        const isDashboard = item.href === '/learn' || item.href === '/dosen' || item.href === '/admin' || item.href === '/asdos';
        const isActive = isDashboard 
          ? pathname === item.href 
          : (pathname === item.href || pathname.startsWith(`${item.href}/`));
          
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              isActive 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />

            <span className="text-[10px] font-bold uppercase tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}