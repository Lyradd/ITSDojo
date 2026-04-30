"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LoginScene } from "@/components/three/login-scene";
import { 
  Rocket, 
  ShieldCheck, 
  Trophy, 
  Users, 
  ChevronRight, 
  Github,
  Monitor,
  Zap,
  Star
} from "lucide-react";

export default function LandingPage() {
  const { isLoggedIn } = useUserStore();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* =========================================
          1. NAVIGATION
         ========================================= */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter">ITSDojo</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#stats" className="hover:text-white transition-colors">Statistics</Link>
            <Link href="#community" className="hover:text-white transition-colors">Community</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Login</Button>
            </Link>
            <Link href={isLoggedIn ? "/learn" : "/login"}>
              <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-6 rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================
          2. HERO SECTION
         ========================================= */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background 3D Scene */}
        <div className="absolute inset-0 z-0">
          <LoginScene showShapes={false} />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 z-[1] bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none" />
        
        <div className="container relative z-10 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              NOW IN OPEN BETA v1.8
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
              Unlock Your <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">
                Coding Potential
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              ITSDojo menggabungkan pembelajaran intensif dengan elemen game yang adiktif. 
              Tingkatkan level, raih lencana, dan taklukkan dunia pemrograman.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/learn" : "/login"}>
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-600/20 flex gap-3 group">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg">
                View Roadmap
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-linear-to-b from-blue-500 to-transparent" />
        </motion.div>
      </section>

      {/* =========================================
          3. STATS SECTION
         ========================================= */}
      <section id="stats" className="py-24 border-y border-white/5 bg-zinc-950/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard icon={Rocket} value="120+" label="Materi Kursus" />
            <StatCard icon={Users} value="5.2k+" label="Mahasiswa Aktif" />
            <StatCard icon={Trophy} value="48" label="Achievement Unik" />
            <StatCard icon={Star} value="4.9" label="Rating Pengguna" />
          </div>
        </div>
      </section>

      {/* =========================================
          4. FEATURES GRID
         ========================================= */}
      <section id="features" className="py-32 bg-black relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Fitur Eksklusif Dojo</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Dirancang untuk membuat proses belajar kode terasa seperti bermain game RPG favorit Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Monitor}
              title="Interactive Roadmap"
              description="Ikuti jalur pembelajaran yang terstruktur dengan UI peta jalan ala Duolingo yang intuitif."
              color="blue"
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Achievement System"
              description="Raih lencana prestisius seperti Nocturnal atau Early Bird untuk dipamerkan di profil Anda."
              color="purple"
            />
            <FeatureCard 
              icon={Zap}
              title="Inventory & Shop"
              description="Gunakan Gems untuk membeli Streak Freeze atau XP Multiplier guna mempercepat progres Anda."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* =========================================
          5. CALL TO ACTION
         ========================================= */}
      <section className="py-32 container mx-auto px-6">
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/20">
          {/* Decorative shapes */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          
          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Siap Menjadi Master Coding?</h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
            Bergabunglah dengan ribuan mahasiswa lainnya dan rasakan cara baru belajar pemrograman yang menyenangkan dan efektif.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/login">
              <Button size="lg" className="h-16 px-12 rounded-full bg-white text-blue-600 hover:bg-zinc-100 font-black text-xl">
                Daftar Sekarang
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold flex gap-2">
              <Github className="w-6 h-6" />
              Open Source
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================
          6. FOOTER
         ========================================= */}
      <footer className="py-20 border-t border-white/5 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600 fill-current" />
            <span className="text-xl font-black tracking-tighter">ITSDojo</span>
          </div>
          
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact Us</Link>
          </div>

          <div className="text-zinc-600 text-xs">
            © 2026 ITSDojo. Built with ❤️ for the future developers.
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: any) {
  return (
    <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/10",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10",
  };

  return (
    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${colorMap[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
