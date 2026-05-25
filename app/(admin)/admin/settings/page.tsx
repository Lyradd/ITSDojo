"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <Card className="p-12 rounded-2xl border-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-700 dark:text-white">
            Admin Settings
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Halaman pengaturan admin akan segera hadir!
        </p>
        
        <Link href="/admin">
          <Button className="bg-zinc-600 hover:bg-zinc-700 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
