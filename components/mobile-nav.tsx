"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  MoreHorizontal 
} from "lucide-react";

const mobileNavItems = [
  { icon: Home, label: "Home", href: "/learn" },
  { icon: BookOpen, label: "Courses", href: "/courses" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: MoreHorizontal, label: "Menu", href: "/more" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-950 border-t flex items-center justify-around px-2 md:hidden">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href);
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