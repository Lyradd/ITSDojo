'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/providers/page-transition";
import { DynamicEnvironment } from "@/components/dynamic-environment";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black relative">
      <DynamicEnvironment />

      {/* Sidebar - Collapsible */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-all duration-300 border-r bg-white dark:bg-zinc-950',
          isSidebarOpen ? 'w-[260px]' : 'w-[72px]'
        )}
      >
        <div className={cn('h-full w-[260px]', !isSidebarOpen && 'hidden')}>
          <Sidebar onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>

        {/* Mini Sidebar State (Collapsed) */}
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

      <main className={cn(
        'flex-1 pb-20 md:pb-0 transition-all duration-300',
        isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[72px]'
      )}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      <MobileNav />
    </div>
  );
}
