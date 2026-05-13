"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LoginScene } from "@/components/three/login-scene";
import { 
  Rocket, ShieldCheck, Trophy, Users, ChevronRight, Github, Monitor, Zap, Star,
  BrainCircuit, GitBranch, Target, LineChart, Code2, Award, ArrowUpRight, GraduationCap
} from "lucide-react";
import { useRef } from "react";

export default function LandingPage() {
  const { isLoggedIn } = useUserStore();
  const containerRef = useRef(null);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of the fixed navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-[#030712] text-zinc-100 selection:bg-blue-500/30 font-sans relative overflow-x-hidden">
      
      {/* Background Grid - Learnly Style adapted to Dark Mode */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-[#030712]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">ITSDojo</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            {['features', 'method', 'ranks'].map((section) => (
              <motion.button 
                key={section}
                whileHover={{ scale: 1.05, color: '#ffffff' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo(section)}
                className="capitalize hover:text-white transition-colors relative group"
              >
                {section === 'method' ? 'Methodology' : section === 'ranks' ? 'Ranks' : section}
                {/* Animated Underline */}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 ease-out group-hover:w-full rounded-full" />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <motion.span 
                whileHover={{ scale: 1.05, color: '#ffffff' }} 
                whileTap={{ scale: 0.95 }}
                className="text-sm font-bold text-zinc-400 hover:text-white transition-colors inline-block"
              >
                Log in
              </motion.span>
            </Link>
            <Link href={isLoggedIn ? "/learn" : "/login"}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LoginScene showShapes={false} />
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-[#030712]/80 to-[#030712] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              A smarter way to learn coding
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter mb-8 leading-[1.1] text-white">
              Level Up Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-500">
                Programming Skills
              </span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              ITSDojo combines intensive coding curriculums with addictive RPG game mechanics. 
              Earn XP, collect badges, and conquer the programming world.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/learn" : "/login"}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] flex gap-2 group transition-all">
                    Start Your Journey
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#method">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold text-base backdrop-blur-sm transition-all hover:border-zinc-500">
                    View Syllabus
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION (Highlighted Center Card) */}
      <section id="method" className="py-32 relative z-10 border-t border-white/5 bg-[#030712]/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">Built for How Learning<br/>Actually Works</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">We abandoned traditional boring lectures. Our gamified system leverages dopamine loops to keep you engaged and mastering concepts faster.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left Card */}
            <div className="p-10 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center hover:bg-zinc-900/60 transition-colors h-[320px] flex flex-col justify-center">
              <div className="w-16 h-16 mx-auto bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Interactive Roadmap</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Follow a structured path. Visual nodes guide you through complex topics step-by-step.</p>
            </div>

            {/* Center Highlighted Card */}
            <div className="p-10 rounded-3xl bg-gradient-to-b from-blue-600 to-blue-900 border border-blue-500/50 text-center shadow-[0_0_50px_rgba(37,99,235,0.3)] md:scale-105 z-10 h-[360px] flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Gamified Engine</h3>
              <p className="text-sm text-blue-100/80 leading-relaxed mb-6">Earn Gems, maintain your Streak, and unlock Badges. Learning feels less like studying and more like playing.</p>
              <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-white/20 py-2 px-4 rounded-full w-max mx-auto">
                Discover System <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            {/* Right Card */}
            <div className="p-10 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center hover:bg-zinc-900/60 transition-colors h-[320px] flex flex-col justify-center">
              <div className="w-16 h-16 mx-auto bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Adaptive Support</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Stuck on a problem? Use your hard-earned Gems to buy hints or streak freezes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION ("Every Click, a Smarter You") */}
      <section id="features" className="py-32 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4">Core Mechanics</h2>
          <h3 className="text-4xl md:text-5xl font-black mb-16 text-white">Every Line of Code,<br/>A Smarter You.</h3>
          
          {/* Mock Illustration Area */}
          <div className="w-full h-[400px] md:h-[500px] rounded-3xl border border-zinc-800 bg-zinc-900/30 relative mb-12 overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.15),transparent_70%)]" />
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-blue-500/50 mb-8 border border-white/20">
                  <Code2 className="w-16 h-16 text-white" />
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 backdrop-blur text-sm font-bold flex items-center gap-2 text-white"><Zap className="w-4 h-4 text-yellow-500"/> +50 XP Earned</div>
                  <div className="px-6 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 backdrop-blur text-sm font-bold flex items-center gap-2 text-white"><Trophy className="w-4 h-4 text-orange-500"/> Ranked Up!</div>
                </div>
             </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {['Gamification', 'Code Analytics', 'Progress Tracking', 'Live Editor', 'Leaderboard'].map((tab, i) => (
              <button key={tab} className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CAPABILITIES SECTION (Scrollable fading list) */}
      <section className="py-32 relative z-10 border-t border-white/5 bg-[#030712]/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="md:sticky md:top-40 h-max">
            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">What can<br/>ITSDojo do?</h2>
            <div className="w-12 h-1 bg-blue-600 mt-8 rounded-full" />
          </div>
          
          <div className="flex flex-col gap-12 text-3xl md:text-5xl font-black text-zinc-800">
            <div className="text-white drop-shadow-md">Gamified Progression</div>
            <div className="text-zinc-400">Interactive Curriculum</div>
            <div className="text-zinc-600">Real-Time Evaluation</div>
            <div className="text-zinc-700">Competitive Leaderboards</div>
            <div className="text-zinc-800">Achievement Badges</div>
            <div className="text-zinc-800/50">Shop & Economy System</div>
          </div>
        </div>
      </section>

      {/* 6. DOJO RANKS (Replacing Testimonials) */}
      <section id="ranks" className="py-32 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">The Path of<br/>the Ninja.</h2>
              <p className="text-zinc-500 max-w-md">Kumpulkan XP, naikkan levelmu, dan buktikan keahlianmu dari seorang Novice hingga menjadi Sensei sejati di Dojo.</p>
            </div>
            <Button variant="outline" className="rounded-full font-bold border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white transition-all">Lihat Peringkat Global</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { rank: "Novice", desc: "Mulai perjalanan coding pertamamu.", xp: "0 - 1000 XP", color: "from-zinc-400 to-zinc-600", icon: "🥋" },
              { rank: "Apprentice", desc: "Kuasai dasar logika dan algoritma.", xp: "1000 - 5000 XP", color: "from-blue-400 to-blue-600", icon: "⚔️" },
              { rank: "Expert", desc: "Bangun aplikasi modern yang kompleks.", xp: "5000 - 15000 XP", color: "from-red-400 to-red-600", icon: "🔥" },
              { rank: "Sensei", desc: "Mentoring junior dan taklukkan algoritma.", xp: "15000+ XP", color: "from-purple-400 to-purple-600", icon: "👑" }
            ].map((r, i) => (
              <div key={i} className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col justify-between h-[280px] hover:bg-zinc-900/60 hover:border-zinc-700 transition-all group">
                <div>
                  <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-2xl bg-gradient-to-br ${r.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    {r.icon}
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">{r.rank}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{r.desc}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-950 px-4 py-2 rounded-full w-max mt-4 border border-zinc-800/50">
                  <Zap className="w-3 h-3 text-yellow-500" /> {r.xp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(37,99,235,0.3)]">
          {/* Decorative SVG/Shapes */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 relative z-10 tracking-tight">Experience the<br/>Future of Learning.</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto relative z-10 font-medium">Join the open beta today. No credit card required. Start earning your first 100 XP.</p>
          
          <Link href="/login" className="relative z-10 inline-block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="h-14 px-8 rounded-full bg-white text-blue-600 hover:bg-zinc-50 font-bold text-base shadow-xl flex items-center gap-2 group">
                Create Free Account <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#030712] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">ITSDojo</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          </div>

          <div className="text-zinc-600 text-sm font-medium">
            © 2026 ITSDojo Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
