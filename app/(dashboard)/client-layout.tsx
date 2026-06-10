'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/providers/page-transition";
import { DynamicEnvironment } from "@/components/dynamic-environment";
import { useUserStore } from "@/lib/store";
import { RewardAnimation } from "@/components/shared/reward-animation";
import { StreakReminder } from "@/components/shared/streak-reminder";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { usePathname } from "next/navigation";
import { getUserProfile } from "@/actions/auth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname.startsWith("/duel/1v1/") || pathname.startsWith("/duel/arena/");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { checkDailyReset, isLoggedIn, id, syncFromServer, role } = useUserStore();
  const earlyBirdChecked = useRef(false);

  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  // Sinkronisasi data ke bawah (dari server ke client) saat dashboard dimuat
  useEffect(() => {
    if (isLoggedIn && id) {
      // Guard untuk Misi Login Pagi (Maksimal 1x check per session load)
      if (!earlyBirdChecked.current) {
        earlyBirdChecked.current = true;
        if (new Date().getHours() < 9) {
          useUserStore.getState().incrementProgress('cons-1', 1);
        }
      }

      const fetchProfile = async () => {
        const res = await getUserProfile(id);
        if (res.success && res.user) {
          // Untuk role non-mahasiswa: hanya sync data profil dasar,
          // abaikan seluruh data gamifikasi agar tidak muncul di UI
          const isMahasiswa = res.user.role === 'mahasiswa';
          syncFromServer({
            level: isMahasiswa ? res.user.level : 1,
            profileXp: isMahasiswa ? res.user.profileXp : 0,
            xp: isMahasiswa ? res.user.xp : 0,
            gems: isMahasiswa ? res.user.gems : 0,
            streak: isMahasiswa ? res.user.streak : 0,
            accuracy: isMahasiswa ? res.user.accuracy : 0,
            completedLessonIds: isMahasiswa ? res.user.completedLessonIds : [],
            gamificationData: isMahasiswa ? res.user.gamificationData : null,
            enrolledCourseIds: res.user.enrolledCourseIds,
          });
        }
      };
      fetchProfile();
    }
  }, [isLoggedIn, id, syncFromServer]);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black relative">
      <LevelUpModal />
      <RewardAnimation />
      <DynamicEnvironment />
      <StreakReminder />

      {!hideSidebar && (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-all duration-300 border-r bg-white dark:bg-zinc-950',
            isSidebarOpen ? 'w-[260px]' : 'w-[72px]'
          )}
        >
          <div className={cn('h-full w-[260px]', !isSidebarOpen && 'hidden')}>
            <Sidebar onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>

          {!isSidebarOpen && (
            <div className="w-full h-20 flex items-center justify-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-white dark:bg-zinc-900 border shadow-sm text-blue-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </aside>
      )}

      <main
        className={cn(
          'flex-1 transition-all duration-300',
          hideSidebar ? 'pb-0 md:pb-0' : 'pb-20 md:pb-0',
          hideSidebar
            ? 'md:ml-0'
            : isSidebarOpen
              ? 'md:ml-[260px]'
              : 'md:ml-[72px]'
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {!hideSidebar && <MobileNav />}
    </div>
  );
}