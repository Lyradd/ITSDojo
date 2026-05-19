"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging purposes
    console.error("Crash Recovery Activated. Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center -rotate-12 shadow-inner">
          <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white dark:text-zinc-900 text-sm font-black">!</span>
        </div>
      </div>
      
      <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
        Sistem Terganggu
      </h2>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
        Tenang, data dan progres latihan Dojo Anda aman. Terjadi sedikit anomali teknis saat memuat komponen ini.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
        <Button 
          onClick={reset}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95 group"
        >
          <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Coba Pulihkan
        </Button>
        <Link href="/learn" className="w-full sm:w-auto">
          <Button 
            variant="outline"
            className="w-full h-12 px-8 rounded-xl font-bold border-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>
    </div>
  );
}
