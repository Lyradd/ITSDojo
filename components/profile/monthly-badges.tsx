"use client";

import React, { useState } from "react";
import {
  Bot,
  Heart,
  FolderTree,
  Bug,
  Rocket,
  Cpu,
  SunMedium,
  Swords,
  GraduationCap,
  Terminal,
  Trophy,
  MoonStar,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Define badge status types
export type BadgeStatus = "achieved" | "missed" | "locked";

// Interface for monthly badge data definition
export interface MonthlyBadgeTemplate {
  monthIndex: number; // 1 to 12
  monthName: string;
  theme: string;
  description: string;
  icon: React.ComponentType<any>;
  unlockedClasses: {
    bg: string;
    border: string;
    text: string;
  };
}

// 12 Monthly Badges Template
const MONTHLY_BADGE_TEMPLATES: MonthlyBadgeTemplate[] = [
  {
    monthIndex: 1,
    monthName: "Januari",
    theme: "AI Booting",
    description: "Memulai awal tahun dengan inisialisasi kode sistem AI baru.",
    icon: Bot,
    unlockedClasses: {
      bg: "bg-slate-800",
      border: "border-sky-300 border-b-sky-100",
      text: "text-sky-200",
    },
  },
  {
    monthIndex: 2,
    monthName: "Februari",
    theme: "Programmer in Love",
    description: "Jatuh cinta pada baris kode pertama di bulan kasih sayang.",
    icon: Heart,
    unlockedClasses: {
      bg: "bg-rose-950",
      border: "border-rose-400 border-b-rose-600",
      text: "text-rose-300",
    },
  },
  {
    monthIndex: 3,
    monthName: "Maret",
    theme: "Folder Tree",
    description: "Menumbuhkan pemahaman struktur data seperti pohon direktori.",
    icon: FolderTree,
    unlockedClasses: {
      bg: "bg-emerald-950",
      border: "border-emerald-400 border-b-amber-800",
      text: "text-emerald-300",
    },
  },
  {
    monthIndex: 4,
    monthName: "April",
    theme: "Debug Master",
    description: "Berhasil menangkap dan menjinakkan bug kritis di sistem.",
    icon: Bug,
    unlockedClasses: {
      bg: "bg-orange-950",
      border: "border-orange-400 border-b-yellow-500",
      text: "text-orange-400",
    },
  },
  {
    monthIndex: 5,
    monthName: "Mei",
    theme: "Rocket Launch",
    description: "Meluncur tinggi naik level melampaui batasan kemampuan.",
    icon: Rocket,
    unlockedClasses: {
      bg: "bg-blue-950",
      border: "border-yellow-400 border-b-yellow-600",
      text: "text-yellow-300",
    },
  },
  {
    monthIndex: 6,
    monthName: "Juni",
    theme: "Consistent PCB",
    description: "Menjaga konsistensi belajar bagaikan sirkuit PCB yang terintegrasi.",
    icon: Cpu,
    unlockedClasses: {
      bg: "bg-green-900",
      border: "border-green-500 border-b-emerald-800",
      text: "text-green-300",
    },
  },
  {
    monthIndex: 7,
    monthName: "Juli",
    theme: "Summer Coding",
    description: "Tetap produktif menulis kode di tengah hangatnya liburan musim panas.",
    icon: SunMedium,
    unlockedClasses: {
      bg: "bg-yellow-900",
      border: "border-yellow-300 border-b-orange-600",
      text: "text-yellow-200",
    },
  },
  {
    monthIndex: 8,
    monthName: "Agustus",
    theme: "Samurai Juang",
    description: "Berjuang keras menyelesaikan materi demi kemerdekaan masa depan.",
    icon: Swords,
    unlockedClasses: {
      bg: "bg-red-950",
      border: "border-red-500 border-b-slate-100",
      text: "text-red-200",
    },
  },
  {
    monthIndex: 9,
    monthName: "September",
    theme: "Academic Owl",
    description: "Kembali ke laboratorium belajar dengan kebijaksanaan akademik.",
    icon: GraduationCap,
    unlockedClasses: {
      bg: "bg-slate-900",
      border: "border-blue-800 border-b-amber-100",
      text: "text-amber-100",
    },
  },
  {
    monthIndex: 10,
    monthName: "Oktober",
    theme: "Terminal Pumpkin",
    description: "Menjalankan ritual bash script di malam Halloween yang gelap.",
    icon: Terminal,
    unlockedClasses: {
      bg: "bg-neutral-900",
      border: "border-neutral-950 border-b-green-500",
      text: "text-green-400",
    },
  },
  {
    monthIndex: 11,
    monthName: "November",
    theme: "Harvest Achievements",
    description: "Memanen seluruh pencapaian terbaik setelah perjuangan panjang.",
    icon: Trophy,
    unlockedClasses: {
      bg: "bg-amber-950",
      border: "border-amber-800 border-b-yellow-500",
      text: "text-yellow-400",
    },
  },
  {
    monthIndex: 12,
    monthName: "Desember",
    theme: "Cosmic Sparkles",
    description: "Mengakhiri tahun dengan kilau bintang pencapaian kosmik.",
    icon: MoonStar,
    unlockedClasses: {
      bg: "bg-indigo-950",
      border: "border-indigo-900 border-b-slate-50",
      text: "text-slate-100",
    },
  },
];

interface BadgeItemProps {
  template: MonthlyBadgeTemplate;
  status: BadgeStatus;
  year: number;
  earnedDate?: string;
}

export function BadgeItem({ template, status, year, earnedDate }: BadgeItemProps) {
  const IconComponent = template.icon;

  let containerStyles = "";
  let tooltipStatusText = "";
  let tooltipStatusClass = "";

  if (status === "achieved") {
    containerStyles = `${template.unlockedClasses.bg} ${template.unlockedClasses.border} ${template.unlockedClasses.text} shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30`;
    tooltipStatusText = `✨ Didapatkan pada ${earnedDate || ""}`;
    tooltipStatusClass = "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400";
  } else if (status === "missed") {
    containerStyles = `${template.unlockedClasses.bg} ${template.unlockedClasses.border} ${template.unlockedClasses.text} grayscale opacity-45 cursor-not-allowed`;
    tooltipStatusText = "💨 Terlewat (Tidak Didapatkan)";
    tooltipStatusClass = "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400";
  } else {
    // Locked status
    containerStyles = "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 border-b-zinc-400 dark:border-b-zinc-900 text-zinc-400 dark:text-zinc-500 cursor-not-allowed";
    tooltipStatusText = "🔒 Belum Terbuka";
    tooltipStatusClass = "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400";
  }

  return (
    <div className="flex flex-col items-center justify-center group relative">
      {/* 3D Duolingo-style badge circle wrapper */}
      <motion.div
        whileHover={status === "achieved" ? { scale: 1.08, rotate: [0, -3, 3, 0] } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[6px] border-b-[10px] flex items-center justify-center transition-all ${containerStyles} relative`}
      >
        {status === "locked" ? (
          <div className="flex items-center justify-center bg-black/5 dark:bg-white/5 w-full h-full rounded-full">
            <Lock className="w-6 h-6 text-zinc-400 dark:text-zinc-500" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <IconComponent 
              className={`w-10 h-10 sm:w-12 sm:h-12 ${status === "achieved" ? "animate-pulse" : ""}`} 
              strokeWidth={1.75} 
              fill="currentColor" 
              fillOpacity={0.15} 
            />
          </div>
        )}
      </motion.div>

      {/* Title & Theme */}
      <div className="mt-3 text-center">
        <span className="block text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide">
          {template.monthName}
        </span>
        <span className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
          {status === "locked" ? "Terkunci" : status === "missed" ? "Terlewat" : template.theme}
        </span>
      </div>

      {/* Premium Hover Tooltip Card */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-56 text-center">
        <div className="bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 mb-1">
            Lencana {template.monthName} {year}
          </div>
          {status !== "locked" && (
            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              {template.theme}
            </div>
          )}
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-normal mb-2">
            {status === "locked" 
              ? `Lencana untuk bulan ${template.monthName} ${year} belum dimulai.`
              : template.description}
          </p>
          <div className={`text-[10px] font-black py-1 px-2.5 rounded-full inline-block ${tooltipStatusClass}`}>
            {tooltipStatusText}
          </div>
        </div>
        {/* Tooltip triangle */}
        <div className="w-3 h-3 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-200 dark:border-zinc-700 rotate-45 -mt-1.5 shadow-sm" />
      </div>
    </div>
  );
}

interface MonthlyBadgesProps {
  unlockedMonths?: { month: string; year: number; dateEarned: string }[];
}

export function MonthlyBadges({ unlockedMonths = [] }: MonthlyBadgesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Time assumption rules (Current: June 2026)
  const currentYear = 2026;
  const currentMonthIndex = 6; // June

  // Helper to determine status for a specific template in a specific year
  const getBadgeStatus = (template: MonthlyBadgeTemplate, year: number) => {
    // Check if achieved/unlocked
    const achievedBadge = unlockedMonths.find(
      (b) =>
        b.month.toLowerCase() === template.monthName.toLowerCase() &&
        Number(b.year) === year
    );

    if (achievedBadge) {
      return { status: "achieved" as BadgeStatus, earnedDate: achievedBadge.dateEarned };
    }

    // If not achieved:
    if (year < currentYear) {
      return { status: "missed" as BadgeStatus };
    } else if (year === currentYear) {
      if (template.monthIndex <= currentMonthIndex) {
        return { status: "missed" as BadgeStatus };
      } else {
        return { status: "locked" as BadgeStatus };
      }
    } else {
      // Future year
      return { status: "locked" as BadgeStatus };
    }
  };

  // Default display: first 4 months of 2026
  const defaultBadges = MONTHLY_BADGE_TEMPLATES.slice(0, 4).map((template) => {
    const { status, earnedDate } = getBadgeStatus(template, currentYear);
    return { template, status, year: currentYear, earnedDate };
  });

  return (
    <div className="w-full">
      {/* Align header outside the card and place toggle button at the top right */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">
          Koleksi Lencana Bulanan
        </h2>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="text-blue-500 font-bold uppercase text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          {isExpanded ? "Sembunyikan" : "Lihat Semua"}
        </Button>
      </div>

      {/* Main card box containing description and badge grids */}
      <div className="w-full bg-white dark:bg-zinc-900/30 border-2 border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 rounded-2xl">
        <p className="text-xs sm:text-sm text-zinc-500 font-bold mb-8">
          Selesaikan tantangan misi harian setiap bulannya untuk mengoleksi lencana ITSDojo eksklusif!
        </p>

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 justify-center items-start"
            >
              {defaultBadges.map(({ template, status, year, earnedDate }) => (
                <BadgeItem
                  key={`${year}-${template.monthIndex}`}
                  template={template}
                  status={status}
                  year={year}
                  earnedDate={earnedDate}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-12"
            >
              {/* Year 2026 */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">Tahun 2026</span>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 justify-center items-start">
                  {MONTHLY_BADGE_TEMPLATES.map((template) => {
                    const { status, earnedDate } = getBadgeStatus(template, 2026);
                    return (
                      <BadgeItem
                        key={`2026-${template.monthIndex}`}
                        template={template}
                        status={status}
                        year={2026}
                        earnedDate={earnedDate}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Year 2027 */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">Tahun 2027</span>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 justify-center items-start">
                  {MONTHLY_BADGE_TEMPLATES.map((template) => {
                    const { status, earnedDate } = getBadgeStatus(template, 2027);
                    return (
                      <BadgeItem
                        key={`2027-${template.monthIndex}`}
                        template={template}
                        status={status}
                        year={2027}
                        earnedDate={earnedDate}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
