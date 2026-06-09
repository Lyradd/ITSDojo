"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  LogOut,
  User,
  Bell,
  Moon,
  Globe,
  Shield,
} from "lucide-react";
import { logoutSession } from "@/actions/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { name, email, role, logout } = useUserStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logoutSession(); // Hapus session cookie di server
    logout();              // Reset Zustand state di client
    router.push("/login");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Pengaturan</h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Kelola preferensi dan akun kamu
        </p>
      </div>

      {/* Account Section */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Akun</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Nama</Label>
            <p className="font-semibold">{name}</p>
          </div>
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Email</Label>
            <p className="font-semibold">{email}</p>
          </div>
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Peran</Label>
            <p className="font-semibold capitalize">{role}</p>
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Preferensi</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-6 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Bell className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-base">Notifikasi</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Terima pemberitahuan tentang pembaruan
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-10 text-base font-medium">
              Konfigurasi
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Moon className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-base">Tema</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Ubah tema untuk testing Dynamic Environment
                </p>
              </div>
            </div>
            {mounted && (
              <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl border w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => setTheme("light")}
                  className={`flex-1 h-12 sm:h-10 text-sm font-medium ${theme === "light" ? "bg-white dark:bg-zinc-800 shadow-sm" : ""}`}
                >
                  Terang
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setTheme("dark")}
                  className={`flex-1 h-12 sm:h-10 text-sm font-medium ${theme === "dark" ? "bg-white dark:bg-zinc-800 shadow-sm" : ""}`}
                >
                  Gelap
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setTheme("system")}
                  className={`flex-1 h-12 sm:h-10 text-sm font-medium ${theme === "system" ? "bg-white dark:bg-zinc-800 shadow-sm" : ""}`}
                >
                  Sistem
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Globe className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-base">Bahasa</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Pilih bahasa antarmuka kamu
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-10 text-base font-medium">
              Indonesia
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy & Security Section */}
      <Card className="p-4 sm:p-6 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Privasi & Keamanan</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-3 sm:space-y-4">
          <Button variant="outline" className="w-full justify-start h-12 sm:h-10 text-base font-medium">
            Ubah Kata Sandi
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 sm:h-10 text-base font-medium">
            Pengaturan Privasi
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 sm:h-10 text-base font-medium">
            Data & Privasi
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 sm:p-6 border-red-200 dark:border-red-900 mt-12 bg-red-50/30 dark:bg-red-950/10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Zona Bahaya</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Tindakan yang tidak dapat dibatalkan
          </p>
        </div>
        <Separator className="mb-4 bg-red-200 dark:bg-red-900" />
        
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full gap-2 h-14 sm:h-12 text-base font-bold shadow-lg hover:bg-red-700 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </Button>
      </Card>
    </div>
  );
}
