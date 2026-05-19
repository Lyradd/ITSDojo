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
      const offset = 80;
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
      
      {/* 1. ADVANCED BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Animated Aurora */}
        <div className="absolute inset-0 opacity-40 animate-aurora bg-gradient-to-tr from-blue-900/20 via-indigo-900/20 to-cyan-900/20 blur-[100px]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] animate-orb-2" />
        <div className="absolute top-[40%] right-[20%] w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] animate-orb-3" />

        {/* Technical Grid */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* 2. NAVBAR */}
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

      {/* 3. HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LoginScene showShapes={false} />
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-[#030712]/60 to-[#030712] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Elevate your code to master level
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[6.5rem] font-black tracking-tighter mb-8 leading-[1] text-white">
              The Dojo for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-cyan-400 animate-text-gradient">
                Future Builders
              </span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Join the elite circle of developers. Master the modern stack through immersive quests, 
              competitive duels, and a progression system that rewards your dedication.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/learn" : "/login"}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] flex gap-2 group transition-all">
                    Start Your Quest
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#method">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold text-lg backdrop-blur-sm transition-all hover:border-zinc-500">
                    View Methodology
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION */}
      <section id="method" className="py-32 relative z-10 border-t border-white/5 bg-[#030712]/30 backdrop-blur-3xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">Why ITSDojo?</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-xl">We've gamified the learning process to ensure you don't just learn, but master.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <ValueCard 
              icon={<Target className="w-8 h-8" />}
              title="Interactive Path"
              description="Visual roadmap that tracks every step of your journey from beginner to expert."
            />
            <ValueCard 
              icon={<Trophy className="w-10 h-10" />}
              title="Gamified Core"
              description="XP, Gems, and Streaks designed to keep you motivated and consistent every single day."
              highlighted
            />
            <ValueCard 
              icon={<LineChart className="w-8 h-8" />}
              title="Adaptive Support"
              description="Get hints and power-ups exactly when you need them to overcome difficult challenges."
            />
          </div>
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4">The Experience</h2>
              <h3 className="text-5xl md:text-7xl font-black mb-8 text-white leading-[1.1]">Every Line,<br/>A Level Up.</h3>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Experience a learning platform that feels like a high-end RPG. 
                Our dashboard is optimized for focus, clarity, and dopamine-driven progression.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
                {['Analytics', 'Roadmap', 'Duel', 'Inventory'].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <div className="aspect-square rounded-[2rem] border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="w-full max-w-sm aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl relative group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <div className="pt-12 p-6 font-mono text-blue-400 text-sm">
                      <p><span className="text-purple-400">class</span> DojoNinja {'{'}</p>
                      <p className="pl-4">master() {'{'}</p>
                      <p className="pl-8 text-zinc-500">// Leveling up...</p>
                      <p className="pl-8 text-white">this.xp += 100;</p>
                      <p className="pl-4">{'}'}</p>
                      <p>{'}'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOJO RANKS */}
      <section id="ranks" className="py-32 relative z-10 border-t border-white/5 bg-[#030712]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tight">The Ninja Path</h2>
            <p className="text-zinc-500 max-w-md mx-auto text-lg">Your journey to mastery is divided into four distinct phases of the moon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { rank: "Novice", desc: "Start your journey.", xp: "0 - 1k XP", color: "from-zinc-400 to-zinc-600", icon: "🥋" },
              { rank: "Apprentice", desc: "Master logic basics.", xp: "1k - 5k XP", color: "from-blue-400 to-blue-600", icon: "⚔️" },
              { rank: "Expert", desc: "Build complex apps.", xp: "5k - 15k XP", color: "from-red-400 to-red-600", icon: "🔥" },
              { rank: "Sensei", desc: "Mentor the Dojo.", xp: "15k+ XP", color: "from-purple-400 to-purple-600", icon: "👑" }
            ].map((r, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col justify-between h-[300px] hover:bg-zinc-900/60 hover:border-zinc-700 transition-all group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div>
                  <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-3xl bg-gradient-to-br ${r.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    {r.icon}
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">{r.rank}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{r.desc}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-white bg-zinc-950 px-4 py-2 rounded-full w-max mt-4 border border-zinc-800/50 shadow-inner">
                  <Zap className="w-3 h-3 text-yellow-500" /> {r.xp}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="py-20 px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 rounded-[4rem] p-20 md:p-32 text-center relative overflow-hidden shadow-[0_20px_100px_rgba(37,99,235,0.4)]"
        >
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 relative z-10 tracking-tight leading-none">Ready to enter<br/>the Dojo?</h2>
          <p className="text-blue-100 text-xl mb-12 max-w-xl mx-auto relative z-10 font-medium opacity-90 italic">"The best time to start was yesterday. The second best time is now."</p>
          
          <Link href="/login" className="relative z-10 inline-block">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button size="lg" className="h-16 px-12 rounded-full bg-white text-blue-600 hover:bg-zinc-50 font-black text-xl shadow-2xl transition-all">
                Join Now <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-20 border-t border-white/5 bg-[#030712] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">ITSDojo</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-xs">Mastering the stack, one level at a time. The ultimate Dojo for future builders.</p>
          </div>
          
          <div className="flex gap-12 text-sm font-bold text-zinc-400">
            <Link href="#" className="hover:text-white transition-colors underline-offset-8 hover:underline">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors underline-offset-8 hover:underline">Terms</Link>
            <Link href="https://github.com" className="hover:text-white transition-colors underline-offset-8 hover:underline">GitHub</Link>
          </div>

          <div className="text-zinc-600 text-sm font-medium border-l border-zinc-800 pl-8 hidden md:block">
            © 2026 ITSDojo Inc.<br/>All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({ icon, title, description, highlighted = false }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`p-12 rounded-[2.5rem] text-center transition-all h-[360px] flex flex-col justify-center relative overflow-hidden ${
        highlighted 
        ? "bg-gradient-to-b from-blue-600 to-blue-900 border border-blue-500/50 shadow-[0_0_60px_rgba(37,99,235,0.4)] z-10 md:scale-110" 
        : "bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60"
      }`}
    >
      {highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />}
      <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border ${
        highlighted ? "bg-white/10 border-white/20 text-white" : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
      }`}>
        {icon}
      </div>
      <h3 className={`text-2xl font-bold mb-4 ${highlighted ? "text-white" : "text-white"}`}>{title}</h3>
      <p className={`text-base leading-relaxed ${highlighted ? "text-blue-100/80" : "text-zinc-500"}`}>{description}</p>
    </motion.div>
  );
}
