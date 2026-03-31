'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/providers/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar - Collapsible */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden md:block transition-all duration-300 border-r',
          isSidebarOpen ? 'w-[260px]' : 'w-0'
        )}
      >
        <div className={cn('h-full', !isSidebarOpen && 'hidden')}>
          <Sidebar onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
      </aside>

      {/* Floating Toggle Button - Only shown when sidebar is CLOSED */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-60 p-3 bg-transparent text-blue-600 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all hidden md:flex items-center justify-center"
          title="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
      
      <main className={cn(
        'flex-1 pb-20 md:pb-0 transition-all duration-300',
        isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
      )}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      <MobileNav />
    </div>
  );
}