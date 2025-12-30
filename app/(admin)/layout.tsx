"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not dosen
    if (role !== 'dosen') {
      router.push('/learn');
    }
  }, [role, router]);

  // Don't render if not dosen
  if (role !== 'dosen') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <aside className="fixed inset-y-0 left-0 z-50 w-[88px] lg:w-[260px] hidden md:block">
        <Sidebar />
      </aside>
      
      <main className="flex-1 pb-20 md:pb-0 md:ml-[88px] lg:ml-[260px]">
        {children}
      </main>
      
      <MobileNav />
    </div>
  );
}
