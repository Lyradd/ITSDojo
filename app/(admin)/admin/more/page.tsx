"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}

function FeatureCard({ icon: Icon, title, description, href, color }: FeatureCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-700 h-full">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`p-4 rounded-xl ${color}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function AdminMorePage() {
  const router = useRouter();
  const { name, role, level, xp, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const features = [
    {
      icon: ClipboardCheck,
      title: "Evaluasi",
      description: "Lihat hasil kuis & ujian",
      href: "/admin/evaluations",
      color: "bg-linear-to-br from-blue-500 to-blue-600",
    },
    {
      icon: BarChart3,
      title: "Analitik",
      description: "Metrik keaktifan sistem",
      href: "/admin/analytics",
      color: "bg-linear-to-br from-green-500 to-green-600",
    },
    {
      icon: Settings,
      title: "Pengaturan Sistem",
      description: "Konfigurasi portal utama",
      href: "/admin/settings",
      color: "bg-linear-to-br from-zinc-500 to-zinc-600",
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fitur Lainnya</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Akses menu administrasi utama
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* User Info Card */}
      <Card className="p-6 mb-8 bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
              <span className="text-sm">⚙️</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">{name}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Level {level} • {xp} XP
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 capitalize">
              Super Admin
            </p>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {features.map((feature) => (
          <FeatureCard key={feature.href} {...feature} />
        ))}
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="destructive"
        size="lg"
        className="w-full gap-2 text-lg py-6"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </Button>
    </div>
  );
}
