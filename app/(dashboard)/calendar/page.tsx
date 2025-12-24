"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <Card className="p-12 rounded-2xl border-2 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-6">
          <CalendarDays className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
          Calendar Feature
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Fitur kalender untuk jadwal kursus dan evaluasi akan segera hadir!
        </p>
        
        <Link href="/learn">
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Learn
          </Button>
        </Link>
      </Card>
    </div>
  );
}
