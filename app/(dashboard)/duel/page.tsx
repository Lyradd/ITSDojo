"use client";

import { Card } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Swords, Crown, Globe } from 'lucide-react';

export default function DuelPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoggedIn, name } = useUserStore();

  // if (!isLoggedIn) {
  //   router.push('/login');
  //   return;
  // }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            Brain Duel
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          BrainDuel Description
        </p>
      </div>

      {/*content*/}
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card className="p-6 rounded-2xl border-2 text-center text-zinc-600 bg-gradient-to-br from-blue-50 to-blue-100
            hover:from-blue-400 hover:to-blue-600 hover:text-zinc-100 transition-colors duration-300 shadow-lg cursor-pointer
            " onClick={() => router.push('/duel/1v1')}>
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/30">
                <Crown className="w-16 h-16" />
              </span>
            </div>
            <h1 className='text-3xl font-bold '>
              Duel 1v1
            </h1>
            <h2 className='mt-2 mb-4'>
              Tantang teman-temanmu dalam duel otak yang seru dan lihat siapa yang keluar sebagai pemenang!
            </h2>
          </Card>

          <Card className="p-6 rounded-2xl border-2 text-center text-zinc-600 bg-gradient-to-br from-green-50 to-green-100
            hover:from-green-400 hover:to-green-600 hover:text-zinc-100 transition-colors duration-300 shadow-lg cursor-pointer
            " onClick={() => router.push('/duel/arena')}>
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/30">
                <Globe className="w-16 h-16" />
              </span>
            </div>
            <h1 className='text-3xl font-bold '>
              Arena
            </h1>
            <h2 className='mt-2 mb-4'>
              Buktikan keahlianmu dan tunjukan kemampuanmu di antara teman temanmu!
            </h2>
          </Card>
        </div>
      </div>
    </div>
  );
}
