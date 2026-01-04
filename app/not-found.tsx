
"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-center mb-6 space-x-2">
        <GraduationCap className="w-8 h-8" />
        <span>ITSDojo</span>
      </div>
      <h1 className="text-5xl font-bold mb-2">404</h1>
      <p className="text-xl mb-8">Halaman Tidak Ditemukan</p>
      <Button variant="default" onClick={() => router.back()} className="cursor-pointer">
        <ArrowLeft className="mr-2" />
        Kembali
      </Button>
    </div>
  );
}