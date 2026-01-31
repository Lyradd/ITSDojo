'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Menu, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          className="fixed top-4 left-4 z-60 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-xl hidden md:flex items-center justify-center"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      
      <main className={cn(
        'flex-1 pb-20 md:pb-0 transition-all duration-300',
        isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
      )}>
        {children}
      </main>
      
      <MobileNav />
    </div>
  );
}