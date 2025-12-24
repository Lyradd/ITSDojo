"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MorePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <Card className="p-12 rounded-2xl border-2 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
          <MoreHorizontal className="w-10 h-10 text-zinc-600 dark:text-zinc-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
          More Features
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Fitur tambahan dan pengaturan lainnya akan segera hadir!
        </p>
        
        <Link href="/learn">
          <Button className="bg-zinc-600 hover:bg-zinc-700 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Learn
          </Button>
        </Link>
      </Card>
    </div>
  );
}
