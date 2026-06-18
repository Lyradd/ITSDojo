"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useMotionTemplate } from "framer-motion";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Trophy, ChevronRight, Monitor, Zap,
  BrainCircuit, Target, Code2, GraduationCap,
  Swords, Flame, Gem, Lock, Map, Clock,
  Activity, ShieldAlert, Rocket
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import MagneticButton from "@/components/MagneticButton";
import { logoutSession } from "@/actions/auth";

const HeroScene = dynamic(() => import('@/components/HeroScene'), { ssr: false });


function SpotlightCard({ children, className = "", highlighted = false, onClick }: { children: React.ReactNode; className?: string; highlighted?: boolean; onClick?: () => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const bgGradient = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${highlighted ? 'rgba(255,255,255,0.45)' : 'rgba(59,130,246,0.5)'}, rgba(255,255,255,0.05) 50%)`;
  const innerGradient = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, ${highlighted ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.08)'}, transparent 40%)`;

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isTouchDevice && setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      onClick={onClick}
      className={`relative rounded-[2rem] p-[1.5px] overflow-hidden transition-all duration-500 ${className}`}
      style={{
        background: isFocused && !isTouchDevice
          ? bgGradient
          : highlighted
            ? "linear-gradient(to bottom, rgba(59,130,246,0.3), rgba(29,78,216,0.1))"
            : "rgba(255, 255, 255, 0.05)"
      }}
    >
      <div className="w-full h-full rounded-[1.95rem] bg-zinc-950/90 relative z-10 overflow-hidden flex flex-col">
        {/* Inner subtle glow overlay — hidden on touch devices */}
        {!isTouchDevice && (
          <motion.div
            className="pointer-events-none absolute -inset-px transition duration-300 z-0 will-change-transform"
            style={{
              opacity: isFocused ? 1 : 0,
              background: innerGradient,
            }}
          />
        )}
        {children}
      </div>
    </motion.div>
  );
}

// --- INLINE COMPONENT: Kinetic Masked Text Reveal ---
function MaskedText({ children, className = "", delay = 0 }: { children: string; className?: string; delay?: number }) {
  return (
    <motion.span
      className={`inline-block will-change-transform ${className}`}
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1], delay }}
    >
      {children}
    </motion.span>
  );
}

// --- INLINE COMPONENT: Advanced Custom Cursor (Cyber Dojo Theme) ---
function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover'>('default');
  const hoveredRef = useRef<HTMLElement | null>(null);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Removed useSpring to completely eliminate any trailing delay (1:1 mapped to mouse)
  // The delay the user felt was literally the spring physics themselves.

  useEffect(() => {
    // Better touch detection: checks if the primary input is touch (pointer: coarse)
    // This allows laptops with touchscreens (which have pointer: fine) to still show the custom cursor
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    setIsTouchDevice(isTouch);
    if (isTouch) return;

    const moveCursor = (e: MouseEvent) => {
      // ONLY update coordinates on mousemove for true 60fps/120fps performance
      // No DOM querying here to prevent main-thread blocking
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest) {
        // Run DOM query ONLY when crossing element boundaries
        const interactiveEl = target.closest('button, a, [data-interactive="true"], .cursor-pointer, [role="button"], input, select, textarea');
        if (interactiveEl) {
          setCursorVariant(prev => prev !== 'hover' ? 'hover' : prev);
        } else {
          setCursorVariant(prev => prev !== 'default' ? 'default' : prev);
        }
      }
    };

    // Fallback for when the mouse completely leaves the browser window
    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setCursorVariant(prev => prev !== 'default' ? 'default' : prev);
      }
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [cursorX, cursorY]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Hide native cursor globally only on non-touch devices */}
      <style dangerouslySetInnerHTML={{ __html: `* { cursor: none !important; }` }} />
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{
          x: cursorX,
          y: cursorY,
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden"
        }}
      >
        <AnimatePresence mode="wait">
          {cursorVariant === 'default' && (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: -2, left: -2 }}
              className="drop-shadow-[0_0_10px_rgba(220,38,60,0.8)]"
            >
              {/* Premium Cyber Kunai SVG */}
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="kunai-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#ff4b72" />
                    <stop offset="100%" stopColor="#dc143c" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="kunai-core" x1="2" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ff003c" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                {/* Holographic outer shell */}
                <path d="M2 2L12 24L16 16L24 12L2 2Z" fill="url(#kunai-grad)" stroke="#ff4b72" strokeWidth="1" strokeLinejoin="round" />
                {/* Metallic core */}
                <path d="M4 4L11 19L14 14L19 11L4 4Z" fill="url(#kunai-core)" />
                {/* Cyber lines */}
                <path d="M6 6L14 14" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                {/* High-tech handle */}
                <path d="M16 16L26 26" stroke="#ff4b72" strokeWidth="2" strokeLinecap="square" />
                <path d="M18 22L22 18" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M20 24L24 20" stroke="#ffffff" strokeWidth="1.5" />
                {/* Ring / Pommel */}
                <circle cx="28" cy="28" r="3" stroke="#ff4b72" strokeWidth="1.5" />
                <circle cx="28" cy="28" r="1" fill="#ffffff" />
              </svg>
            </motion.div>
          )}
          {cursorVariant === 'hover' && (
            <motion.div
              key="hover"
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ position: 'absolute', top: -24, left: -24 }}
              className="drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]"
            >
              {/* Premium Cyber Shuriken SVG */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shuriken-grad" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#4facfe" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="shuriken-core" x1="12" y1="12" x2="36" y2="36">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>

                {/* Outer orbital rings (spins backwards) */}
                <motion.g
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  style={{ transformOrigin: "24px 24px" }}
                >
                  <circle cx="24" cy="24" r="18" stroke="#00f2fe" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.6" />
                  <circle cx="24" cy="24" r="22" stroke="#4facfe" strokeWidth="1" strokeDasharray="1 8" opacity="0.4" />
                  <path d="M24 2V6M24 42V46M2 24H6M42 24H46" stroke="#00f2fe" strokeWidth="1.5" strokeLinecap="round" />
                </motion.g>

                {/* Main 4-point blades (spins forwards fast) */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  style={{ transformOrigin: "24px 24px" }}
                >
                  {/* Outer Holographic Blades */}
                  <path d="M24 4L28 18L42 24L28 30L24 44L20 30L6 24L20 18L24 4Z" fill="url(#shuriken-grad)" stroke="#00f2fe" strokeWidth="1" strokeLinejoin="round" />
                  {/* Inner Metallic Blades */}
                  <path d="M24 10L26 20L36 24L26 28L24 38L22 28L12 24L22 20L24 10Z" fill="url(#shuriken-core)" opacity="0.9" />

                  {/* Core Mechanism */}
                  <circle cx="24" cy="24" r="6" fill="#050505" stroke="#00f2fe" strokeWidth="2" />
                  <circle cx="24" cy="24" r="2" fill="#ffffff" />
                  <path d="M24 18V20M24 28V30M18 24H20M28 24H30" stroke="#00f2fe" strokeWidth="1" />
                </motion.g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// --- INLINE COMPONENT: Brain Duel Section (Extracted to prevent global re-renders) ---
function BrainDuel({ isDesktop }: { isDesktop: boolean }) {
  const [duelPhase, setDuelPhase] = useState<'idle' | 'colliding' | 'clashing' | 'retreating'>('idle');
  const [duelTimeLeft, setDuelTimeLeft] = useState(15);
  const [rivalHealth, setRivalHealth] = useState(950);
  const [duelActiveAnswer, setDuelActiveAnswer] = useState(2);

  useEffect(() => {
    let clashTimeout: NodeJS.Timeout;
    let retreatTimeout: NodeJS.Timeout;
    let idleTimeout: NodeJS.Timeout;

    const timer = setInterval(() => {
      if (document.hidden) return; // Menghemat CPU saat tab tidak aktif (background)
      setDuelTimeLeft((prev) => {
        if (prev <= 1) {
          setDuelActiveAnswer(Math.floor(Math.random() * 4));
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    const duelSequence = setInterval(() => {
      if (document.hidden) return; // Jeda animasi berat saat tab tidak dilihat pengguna
      setDuelPhase('colliding');
      clashTimeout = setTimeout(() => {
        if (document.hidden) return;
        setDuelPhase('clashing');
        setRivalHealth(prev => Math.max(0, prev - 150));
      }, 300);
      retreatTimeout = setTimeout(() => {
        if (document.hidden) return;
        setDuelPhase('retreating');
      }, 1000);
      idleTimeout = setTimeout(() => {
        if (document.hidden) return;
        setDuelPhase('idle');
      }, 1500);
    }, 6000);

    return () => {
      clearInterval(timer);
      clearInterval(duelSequence);
      clearTimeout(clashTimeout);
      clearTimeout(retreatTimeout);
      clearTimeout(idleTimeout);
    };
  }, []);

  const p1Variants: any = {
    idle: { x: 0, y: 0, scale: 1, rotate: 0 },
    colliding: { x: isDesktop ? 40 : 0, y: isDesktop ? 0 : 40, scale: 1.05, rotate: isDesktop ? 2 : 0, transition: { duration: 0.3, ease: "backIn" } },
    clashing: { x: isDesktop ? [40, 35, 45, 38, 42, 40] : 0, y: isDesktop ? 0 : [40, 35, 45, 38, 42, 40], scale: 1.05, rotate: isDesktop ? [2, -2, 2, -1, 1, 0] : 0, transition: { duration: 0.4, repeat: 1 } },
    retreating: { x: 0, y: 0, scale: 1, rotate: 0, transition: { duration: 0.5, type: "spring", bounce: 0.5 } }
  };

  const p2Variants: any = {
    idle: { x: 0, y: 0, scale: 1, rotate: 0 },
    colliding: { x: isDesktop ? -40 : 0, y: isDesktop ? 0 : -40, scale: 1.05, rotate: isDesktop ? -2 : 0, transition: { duration: 0.3, ease: "backIn" } },
    clashing: { x: isDesktop ? [-40, -45, -35, -42, -38, -40] : 0, y: isDesktop ? 0 : [-40, -45, -35, -42, -38, -40], scale: 1.05, rotate: isDesktop ? [-2, 2, -2, 1, -1, 0] : 0, transition: { duration: 0.4, repeat: 1 } },
    retreating: { x: 0, y: 0, scale: 1, rotate: 0, transition: { duration: 0.5, type: "spring", bounce: 0.5 } }
  };

  return (
    <section id="duel" className="py-32 relative z-10 text-white overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(20,0,0,0.4)_0,transparent_80%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.15] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <motion.div
          animate={{ opacity: duelPhase === 'clashing' ? 0.8 : 0, scale: duelPhase === 'clashing' ? 1.5 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.35)_0,transparent_60%)] rounded-full pointer-events-none mix-blend-screen will-change-transform"
        ></motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10"
      >
        <div className="text-center mb-16">
          <motion.div
            animate={duelPhase === 'clashing' ? { rotate: [0, -10, 10, -10, 0], scale: 1.2 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 mb-6 border border-red-500/30 backdrop-blur-md shadow-[0_0_40px_rgba(239,68,68,0.3)]"
          >
            <Swords className="w-10 h-10" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-6 tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <MaskedText>1v1:</MaskedText>{" "}<MaskedText delay={0.15}>Duel Otak</MaskedText>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base sm:text-xl leading-relaxed px-2 sm:px-0">
            Uji wawasan dan ketangkasan logika pemrograman Anda secara real-time melawan rekan mahasiswa. Jawab dengan cepat dan akurat di bawah tekanan waktu untuk merebut XP.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 relative mb-8 md:mb-12 min-h-[280px] md:h-40">
            <motion.div
              variants={p1Variants}
              initial="idle"
              animate={duelPhase}
              className="bg-zinc-900/90 backdrop-blur-xl border-2 border-blue-500/60 p-5 md:p-8 rounded-2xl md:rounded-[2rem] w-full md:w-80 text-center relative overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.3)] z-20 will-change-transform"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-950 border-2 border-blue-500 flex items-center justify-center text-3xl font-black text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.4)] flex-shrink-0">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Anda" className="w-full h-full object-cover bg-zinc-800" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h4 className="text-lg md:text-2xl font-black text-white mb-1">Anda</h4>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-mono font-bold text-base">1280 pts</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={duelPhase === 'clashing' ? { scale: [1, 1.5, 0.8, 1.2, 1], rotate: [0, -10, 10, -10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="relative md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-30 flex flex-col items-center -my-2 md:my-0 will-change-transform"
            >
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-zinc-950 flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] border-2 border-zinc-700 mb-2">
                VS
              </div>
            </motion.div>

            <motion.div
              variants={p2Variants}
              initial="idle"
              animate={duelPhase}
              className="bg-zinc-900/90 backdrop-blur-xl border-2 border-red-500/60 p-5 md:p-8 rounded-2xl md:rounded-[2rem] w-full md:w-80 text-center relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)] z-20 will-change-transform"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
              {duelPhase === 'clashing' && <div className="absolute inset-0 bg-red-500/30 animate-pulse z-0 mix-blend-screen" />}
              <div className="flex flex-row-reverse items-center gap-3 md:gap-5 text-right relative z-10">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-950 border-2 border-red-500 flex items-center justify-center text-3xl font-black text-white shadow-[inset_0_0_15px_rgba(239,68,68,0.4)] flex-shrink-0">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="Rival" className="w-full h-full object-cover bg-zinc-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg md:text-2xl font-black text-white mb-1">Rival</h4>
                  <div className="flex items-center justify-end gap-2 text-red-400">
                    <motion.span key={rivalHealth} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: '#f87171' }} className="font-mono font-bold text-base">
                      {rivalHealth} pts
                    </motion.span>
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[2.5rem] p-5 md:p-14 shadow-2xl relative mt-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/30 tracking-wide">
                Soal #4 <span className="text-zinc-500 mx-2">|</span> JavaScript Basics
              </span>
              <motion.div
                animate={duelTimeLeft <= 5 ? { x: [-2, 2, -3, 3, -1, 1, 0], y: [-1, 1, -2, 2, -1, 1, 0] } : { x: 0, y: 0 }}
                transition={{ repeat: duelTimeLeft <= 5 ? Infinity : 0, duration: 0.3 }}
                className={`text-4xl font-black font-mono drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] ${duelTimeLeft <= 5 ? 'text-red-500' : 'text-white'} will-change-transform`}
              >
                00:{duelTimeLeft.toString().padStart(2, '0')}
              </motion.div>
            </div>

            <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden mb-10 shadow-inner border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] relative"
                initial={{ width: "100%" }}
                animate={{ width: `${(duelTimeLeft / 15) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30" />
              </motion.div>
            </div>

            <div className="text-center mb-8 md:mb-12">
              <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-white font-mono leading-tight">
                Apa output dari <span className="text-orange-400 bg-orange-400/10 px-2 rounded-md">typeof null</span> di JavaScript?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["null", "undefined", "object", "string"].map((ans, idx) => {
                const isMockActive = idx === duelActiveAnswer;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-base md:text-lg font-bold transition-all relative overflow-hidden group min-h-[48px] ${isMockActive
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-white/30'
                      }`}
                  >
                    {isMockActive && (
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-blue-500/10 z-0"
                      />
                    )}
                    <span className="relative z-10 font-mono">{ans}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="mt-16 text-center">
            <Link href="/login">
              <Button className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-12 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-base sm:text-lg md:text-xl shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all flex items-center gap-3 mx-auto group w-full sm:w-auto justify-center">
                <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> Mulai Duel Baru
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { clearStore, isLoggedIn, role } = useUserStore();
  const containerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);

  // --- MOUSE-REACTIVE BACKGROUND SHIFT (Ambient Tilt) ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springMouseX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springMouseY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  // Map mouse movement to translation offsets
  const bgShiftXSlow = useTransform(springMouseX, [-0.5, 0.5], [15, -15]);
  const bgShiftYSlow = useTransform(springMouseY, [-0.5, 0.5], [15, -15]);
  const bgShiftXMedium = useTransform(springMouseX, [-0.5, 0.5], [25, -25]);
  const bgShiftYMedium = useTransform(springMouseY, [-0.5, 0.5], [25, -25]);
  const bgShiftXFast = useTransform(springMouseX, [-0.5, 0.5], [35, -35]);
  const bgShiftYFast = useTransform(springMouseY, [-0.5, 0.5], [35, -35]);

  // --- SCROLL ANIMATIONS ---
  const { scrollY } = useScroll();
  // Using useSpring for buttery smooth physics-based scroll catching
  const smoothScrollY = useSpring(scrollY, { stiffness: 80, damping: 20, mass: 0.5 });

  // Amplified effects for more noticeable transition
  // On mobile, reduce parallax intensity to prevent layout thrashing & battery drain
  const heroOpacity = useTransform(smoothScrollY, [0, 400], [1, 0]);
  const heroY = useTransform(smoothScrollY, [0, 400], [0, isDesktop ? 200 : 80]);
  const heroScale = useTransform(smoothScrollY, [0, 400], [1, isDesktop ? 0.8 : 0.95]);

  // Parallax — disabled on mobile (returns 0 movement) for GPU savings
  const parallaxFast = useTransform(smoothScrollY, [0, 800], [0, isDesktop ? -400 : 0]);
  const parallaxMedium = useTransform(smoothScrollY, [0, 800], [0, isDesktop ? -250 : 0]);
  const parallaxSlow = useTransform(smoothScrollY, [0, 800], [0, isDesktop ? -150 : 0]);

  // --- STATE ROADMAP INTERAKTIF ---
  const [activeNode, setActiveNode] = useState<number>(1);
  const roadmapNodes = [
    { id: 1, title: "Dasar Pemrograman", desc: "Kuasai fondasi algoritma, struktur kontrol, dan dasar bahasa C/C++.", status: "completed", xp: "Selesai" },
    { id: 2, title: "Pemrograman Web", desc: "Bangun antarmuka UI interaktif dengan React.js dan TailwindCSS yang responsif.", status: "active", xp: "Progres 65%" },
    { id: 3, title: "Sains Data", desc: "Pelajari analisis data, visualisasi, dan pemrosesan model dengan Python.", status: "locked", xp: "Butuh 5,000 XP" },
  ];

  // --- STATE GAMIFIKASI INTERAKTIF ---
  const [activeGamificationCard, setActiveGamificationCard] = useState<number>(1);

  // --- STATE LEADERBOARD INTERAKTIF ---
  const [leaderboardTab, setLeaderboardTab] = useState<"Mingguan" | "Musim 4">("Musim 4");
  const [expandedUser, setExpandedUser] = useState<number | null>(3); // Default expand 'Anda'
  const leaderboardData = {
    "Mingguan": [
      { name: "Anda", xp: "1,250", rank: 1, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", highlight: true, stats: "Win Rate: 75% | Quest Selesai: 12" },
      { name: "Siti Aminah", xp: "1,100", rank: 2, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", bg: "bg-slate-400/20 text-slate-300", ring: "ring-slate-400/50", stats: "Win Rate: 60% | Quest Selesai: 15" },
      { name: "Andi Wijaya", xp: "950", rank: 3, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi", bg: "bg-orange-500/20 text-orange-400", ring: "ring-orange-500/50", stats: "Win Rate: 55% | Quest Selesai: 10" },
    ],
    "Musim 4": [
      { name: "Budi Santoso", xp: "14,500", rank: 1, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi", bg: "bg-amber-500/20 text-amber-400", ring: "ring-amber-500/50", stats: "Win Rate: 82% | Quest Selesai: 140" },
      { name: "Siti Aminah", xp: "13,200", rank: 2, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", bg: "bg-slate-400/20 text-slate-300", ring: "ring-slate-400/50", stats: "Win Rate: 71% | Quest Selesai: 125" },
      { name: "Anda", xp: "12,850", rank: 3, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", highlight: true, stats: "Win Rate: 68% | Quest Selesai: 110" },
      { name: "Andi Wijaya", xp: "11,100", rank: 4, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi", bg: "bg-orange-500/20 text-orange-400", ring: "ring-orange-500/50", stats: "Win Rate: 64% | Quest Selesai: 98" },
    ]
  };
  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      const isLargeScreen = window.innerWidth >= 768;
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDesktop(isLargeScreen && !isReducedMotion);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Only attach mousemove listener on non-touch (desktop) devices
    const isTouchDev = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };
    if (!isTouchDev) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };



  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-[#050505] text-zinc-100 selection:bg-blue-500/30 font-sans relative overflow-x-hidden">
      <CustomCursor />
      {/* Global Film Grain Overlay (CSS-only, no external URL) */}
      <div className="fixed inset-0 z-[9998] pointer-events-none opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      {/* 1. ADVANCED BACKGROUND LAYER with Parallax Orbs — Hidden on mobile for GPU savings */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        {/* Orb 1: Blue - Slow movement (NO blur filter, using radial gradient instead) */}
        <motion.div style={{ x: bgShiftXSlow, y: bgShiftYSlow }} className="absolute top-[-5%] left-[5%] will-change-transform">
          <motion.div style={{ y: parallaxSlow }} className="w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.07)_0,transparent_60%)]" />
        </motion.div>

        {/* Orb 2: Cyan - Medium movement */}
        <motion.div style={{ x: bgShiftXMedium, y: bgShiftYMedium }} className="absolute top-[40%] right-[0%] will-change-transform">
          <motion.div style={{ y: parallaxMedium }} className="w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0,transparent_60%)]" />
        </motion.div>

        {/* Orb 3: Indigo - Fast movement */}
        <motion.div style={{ x: bgShiftXFast, y: bgShiftYFast }} className="absolute bottom-[10%] left-[20%] will-change-transform">
          <motion.div style={{ y: parallaxFast }} className="w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06)_0,transparent_60%)]" />
        </motion.div>

        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      {/* Mobile: lightweight static gradient instead of animated orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none md:hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.06)_0,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.04)_0,transparent_50%)]" />
      </div>

      {/* 2. NAVBAR */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-[#050505]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">ITSDojo</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            {['roadmap', 'gamifikasi', 'peringkat', 'duel', 'analitik'].map((section) => (
              <motion.button
                key={section}
                whileHover={{ scale: 1.05, color: '#ffffff' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo(section)}
                className="capitalize hover:text-white transition-colors relative group"
              >
                {section}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 ease-out group-hover:w-full rounded-full" />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {mounted && isLoggedIn ? (
              <Link href={role === 'dosen' || role === 'admin' ? '/dosen' : '/learn'}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-5 sm:px-6 h-10 sm:h-auto rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all text-sm sm:text-base">
                    Ke Dashboard
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <motion.span
                    whileHover={{ scale: 1.05, color: '#ffffff' }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm font-bold text-zinc-400 hover:text-white transition-colors inline-block"
                  >
                    Masuk
                  </motion.span>
                </Link>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-5 sm:px-6 h-10 sm:h-auto rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all text-sm sm:text-base">
                      Mulai Sekarang
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative min-h-[80vh] md:min-h-[95vh] flex items-center justify-center pt-16 sm:pt-20 overflow-hidden">
        {/* WebGL 3D Background - Loaded conditionally for Mobile Optimization and Hydration Safety */}
        {mounted && isDesktop && <HeroScene />}

        {/* Optimized Glassmorphism Background Elements — Simplified on mobile */}
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
          {/* Desktop: full animated orbs */}
          <motion.div animate={isDesktop ? { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 90, 0] } : {}} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.25)_0,transparent_60%)] will-change-transform" />
          <motion.div animate={isDesktop ? { scale: [1, 1.5, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, -90, 0] } : {}} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.25)_0,transparent_60%)] will-change-transform" />
          <motion.div animate={isDesktop ? { y: [0, -50, 0], opacity: [0.2, 0.4, 0.2] } : {}} transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }} className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.25)_0,transparent_60%)] will-change-transform" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="max-w-6xl mx-auto relative z-10 px-6 text-center pointer-events-none w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-auto"
          >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Bergabung dengan Dojo Pembelajaran
              </div>
            </motion.div>

            {/* Kinetic Masked Text Reveal — per-word stagger */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter mb-6 sm:mb-8 leading-[1.1] text-white">
              <MaskedText delay={0.1}>Evolusi</MaskedText>{" "}
              <MaskedText delay={0.2}>Gamifikasi</MaskedText>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
                <MaskedText delay={0.35} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Pembelajaran</MaskedText>{" "}
                <MaskedText delay={0.45} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IT</MaskedText>
              </span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="text-zinc-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium px-2 sm:px-0">
              ITSDojo mengubah cara mahasiswa IT belajar. Kuasai spesialisasi koding melalui quest interaktif, duel real-time, dan ekosistem gamifikasi yang memacu adrenalin.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={mounted && isLoggedIn ? (role === 'dosen' || role === 'admin' ? '/dosen' : '/learn') : "/login"}>
                <MagneticButton size="lg" className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all flex gap-2 group w-full sm:w-auto justify-center">
                  {mounted && isLoggedIn ? "Ke Dashboard" : "Tingkatkan Levelmu"}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
              </Link>
              <MagneticButton onClick={() => scrollTo('roadmap')} variant="outline" size="lg" className="h-14 sm:h-16 px-8 sm:px-10 rounded-full border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold text-base sm:text-lg backdrop-blur-sm transition-all shadow-sm w-full sm:w-auto justify-center">
                Lihat Jalur Pembelajaran
              </MagneticButton>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Isometric floating elements — Scaled down for mobile */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div style={{ y: parallaxMedium }} className="absolute top-[26%] md:top-[20%] left-[18%] md:left-[8%] lg:left-[8%]">
            <motion.div animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="flex w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-xl md:rounded-2xl shadow-2xl items-center justify-center">
              <Monitor className="w-6 h-6 md:w-10 md:h-10 text-blue-400" />
            </motion.div>
          </motion.div>

          <motion.div style={{ y: parallaxFast }} className="absolute bottom-[30%] md:bottom-[20%] lg:bottom-[25%] right-[10%] md:right-[5%] lg:right-[8%]">
            <motion.div animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="flex w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.3)] items-center justify-center text-white">
              <Code2 className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </motion.div>
          </motion.div>

          <motion.div style={{ y: parallaxSlow }} className="absolute top-[22%] md:top-[25%] right-[15%] md:right-[8%] lg:right-[12%]">
            <motion.div animate={{ y: [-15, 15, -15], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} className="flex w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-xl md:rounded-2xl shadow-xl items-center justify-center">
              <Trophy className="w-5 h-5 md:w-8 md:h-8 text-yellow-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3.5 INFINITE SOCIAL PROOF MARQUEE */}
      <section className="py-6 sm:py-10 border-y border-white/5 bg-[#050505]/80 backdrop-blur-md relative z-10 overflow-hidden flex flex-col items-center">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />
        <p className="text-zinc-500 text-xs sm:text-sm font-bold tracking-widest uppercase mb-4 sm:mb-6">Teknologi yang Diajarkan & Digunakan</p>
        <div className="flex overflow-hidden w-full relative">
          {/* Gradient Masks */}
          <div className="absolute top-0 left-0 w-20 sm:w-32 h-full bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-full bg-gradient-to-l from-[#050505] to-transparent z-10" />

          <div
            className="flex whitespace-nowrap items-center w-max will-change-transform"
            style={{ animation: 'marquee-scroll 25s linear infinite' }}
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-10 sm:gap-16 items-center px-5 sm:px-8">
                <span className="text-base sm:text-xl font-bold text-zinc-600">TypeScript</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">React.js</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">Node.js</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">Python</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">PostgreSQL</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">AWS</span>
                <span className="text-base sm:text-xl font-bold text-zinc-600">Docker</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. KILLER FEATURE 1: INTERACTIVE ROADMAP */}
      <section id="roadmap" className="py-16 sm:py-24 relative z-10 bg-[#030712]/50 border-y border-white/5 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mb-6 border border-blue-500/20 shadow-sm">
              <Map className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 tracking-tight text-white">
              <MaskedText>Jalur</MaskedText>{" "}<MaskedText delay={0.15}>Pembelajaran</MaskedText>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-base sm:text-xl leading-relaxed px-2 sm:px-0">
              Telusuri materi secara terstruktur. Pilih spesialisasi Anda, selesaikan modul kompetensi untuk meraih XP, dan tingkatkan pemahaman pemrograman selangkah demi selangkah.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">
            {/* Visual Tree */}
            <SpotlightCard className="flex-1 w-full">
              <div className="p-8 flex flex-col items-center gap-4 py-4 w-full h-full relative z-10">
                {/* Node 1 */}
                <motion.button
                  type="button"
                  aria-label="Roadmap Dasar Pemrograman"
                  onClick={() => setActiveNode(1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ y: activeNode === 1 ? [0, -10, 0] : 0 }}
                  transition={{
                    y: activeNode === 1 ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { type: "spring", bounce: 0.5 },
                    scale: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  className={`flex flex-col items-center cursor-pointer group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl p-2 relative z-10`}
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${activeNode === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-500/40 shadow-[0_0_25px_rgba(37,99,235,0.8)]' : 'bg-blue-600/80 text-blue-100 shadow-lg'}`}>
                    <Code2 className="w-10 h-10" />
                  </div>
                  <span className={`font-bold mt-4 ${activeNode === 1 ? 'text-white' : 'text-zinc-400'}`}>Dasar Pemrograman</span>
                </motion.button>

                {/* Animated SVG Connections (Garis Energi) */}
                <div className="relative w-[152px] md:w-[224px] h-12 md:h-16 flex justify-center items-center -mt-2 md:-mt-4 -mb-2 md:-mb-4 z-0">
                  <svg className="absolute w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Path to Left (Node 2) */}
                    <path d="M50 0 C 50 50, 0 50, 0 100" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="3" strokeLinecap="round" />
                    <motion.path
                      d="M50 0 C 50 50, 0 50, 0 100"
                      fill="none"
                      stroke="rgba(59,130,246,0.8)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />

                    {/* Path to Right (Node 3) */}
                    <path d="M50 0 C 50 50, 100 50, 100 100" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="3" strokeLinecap="round" />
                    <motion.path
                      d="M50 0 C 50 50, 100 50, 100 100"
                      fill="none"
                      stroke="rgba(59,130,246,0.4)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  </svg>
                </div>

                {/* Split Nodes */}
                <div className="flex gap-8 md:gap-16 items-start mt-2 relative z-10">
                  <motion.button
                    type="button"
                    aria-label="Roadmap Pemrograman Web"
                    onClick={() => setActiveNode(2)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ y: activeNode === 2 ? [0, -10, 0] : 0 }}
                    transition={{
                      y: activeNode === 2 ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { type: "spring", bounce: 0.5 },
                      scale: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    className={`flex flex-col items-center justify-start cursor-pointer group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl p-2 w-[120px] md:w-[160px] text-center`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${activeNode === 2 ? 'bg-zinc-800 border-4 border-blue-500 text-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]' : 'bg-zinc-900 border-4 border-zinc-700 text-zinc-500'}`}>
                      <Monitor className="w-10 h-10" />
                    </div>
                    <span className={`font-bold mt-4 text-sm md:text-base leading-tight ${activeNode === 2 ? 'text-white' : 'text-zinc-400'}`}>Pemrograman Web</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    aria-label="Roadmap Sains Data"
                    onClick={() => setActiveNode(3)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ y: activeNode === 3 ? [0, -10, 0] : 0 }}
                    transition={{
                      y: activeNode === 3 ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { type: "spring", bounce: 0.5 },
                      scale: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    className={`flex flex-col items-center justify-start cursor-pointer group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded-2xl p-2 w-[120px] md:w-[160px] text-center`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${activeNode === 3 ? 'bg-zinc-800 border-4 border-zinc-400 text-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-zinc-900 border-4 border-zinc-800 text-zinc-600'}`}>
                      <BrainCircuit className="w-10 h-10" />
                    </div>
                    <span className={`font-bold mt-4 text-sm md:text-base leading-tight ${activeNode === 3 ? 'text-white' : 'text-zinc-500'}`}>Sains Data</span>
                  </motion.button>
                </div>
              </div>
            </SpotlightCard>

            {/* Interactive Detail Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full lg:w-96 flex flex-col"
              >
                {(() => {
                  const node = roadmapNodes.find(n => n.id === activeNode);
                  const isNodeActive = node?.status === 'active';
                  return (
                    <SpotlightCard className="w-full h-full flex-1" highlighted={isNodeActive}>
                      <div className="p-8 flex flex-col h-full w-full justify-between relative z-10">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-xl ${node?.status === 'completed' ? 'bg-green-500/20 text-green-400' : node?.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                              {node?.id === 1 ? <Code2 className="w-6 h-6" /> : node?.id === 2 ? <Monitor className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${node?.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-400' : node?.status === 'active' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                              {node?.xp}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white mb-2">{node?.title}</h3>
                          <p className="text-zinc-400 mb-6 leading-relaxed">{node?.desc}</p>

                          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl mb-6">
                            <Code2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span className="text-sm font-medium leading-relaxed">
                              Materi dilengkapi dengan <strong>IDE Koding Terintegrasi</strong>. Langsung praktik di browser tanpa perlu instalasi tambahan.
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <Link href="/login" className="block w-full">
                            <Button className={`w-full rounded-full font-bold h-12 ${node?.status === 'locked' ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}>
                              {node?.status === 'locked' ? 'Terkunci' : 'Mulai Kelas'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </SpotlightCard>
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* 5. KILLER FEATURE 2: GAMIFICATION */}
      <section id="gamifikasi" className="py-16 sm:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-4 sm:px-6"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 tracking-tight text-white">
              <MaskedText>Belajar Interaktif</MaskedText>{" "}<MaskedText delay={0.15}>Tanpa Bosan</MaskedText>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-base sm:text-xl px-2 sm:px-0">
              Menggabungkan kurikulum akademik terstruktur dengan penghargaan instan (gamifikasi) untuk membangun konsistensi dan motivasi belajar harian Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            <ValueCard
              icon={<Target className="w-10 h-10" />}
              title="Misi & Tantangan Harian"
              description="Tingkatkan produktivitas dengan menyelesaikan 3 misi acak harian. Raih tambahan XP dan Gems setiap kali Anda menaklukkan tantangan koding."
              highlighted={activeGamificationCard === 0}
              onClick={() => setActiveGamificationCard(0)}
            />
            <ValueCard
              icon={<Trophy className="w-10 h-10" />}
              title="Pencapaian & Lencana"
              description="Kumpulkan XP dari setiap materi untuk naik level. Buka lencana eksklusif dan pamerkan pencapaian keahlian Anda ke seluruh kampus."
              highlighted={activeGamificationCard === 1}
              onClick={() => setActiveGamificationCard(1)}
            />
            <ValueCard
              icon={<Gem className="w-8 h-8" />}
              title="Toko Dojo (Shop)"
              description="Tukarkan Gems hasil jerih payah Anda untuk membeli avatar eksklusif, tiket gacha, atau item power-up spesial di dalam kelas."
              highlighted={activeGamificationCard === 2}
              onClick={() => setActiveGamificationCard(2)}
            />
          </div>
        </motion.div>
      </section>

      {/* 6. KILLER FEATURE 3: INTERACTIVE LEADERBOARD */}
      <section id="peringkat" className="py-16 sm:py-24 relative z-10 bg-[#030712]/50 border-y border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-4 sm:px-6"
        >
          <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
            <div className="flex-1 w-full order-2 lg:order-1">
              <SpotlightCard className="w-full" highlighted={true}>
                <div className="p-6 md:p-8 w-full h-full relative z-10">
                  {/* Leaderboard Interactive Tabs */}
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-white">Peringkat Global</h3>
                    <div className="flex bg-zinc-950 rounded-full p-1 border border-white/10">
                      {(["Mingguan", "Musim 4"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setLeaderboardTab(tab)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${leaderboardTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={leaderboardTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {leaderboardData[leaderboardTab].map((user: { rank: number; name: string; xp: string; avatar: string; highlight?: boolean; bg?: string; ring?: string; stats: string }) => (
                          <div key={user.rank} onClick={() => setExpandedUser(expandedUser === user.rank ? null : user.rank)} className="cursor-pointer group">
                            <div className={`flex items-center p-4 rounded-2xl transition-all ${user.highlight ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:border-zinc-500'}`}>
                              <div className={`w-8 font-black text-lg ${user.highlight ? 'text-blue-200' : 'text-zinc-500'}`}>#{user.rank}</div>
                              <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg mr-4 ring-2 ${user.highlight ? 'bg-white text-blue-600 ring-blue-400' : `${user.bg} ${user.ring}`}`}>
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover bg-white/10" />
                              </div>
                              <div className="flex-1 font-bold text-lg group-hover:translate-x-1 transition-transform">{user.name}</div>
                              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                                <Zap className={`w-4 h-4 ${user.highlight ? 'text-yellow-300' : 'text-yellow-500'}`} />
                                <span className="font-bold">{user.xp}</span>
                              </div>
                            </div>
                            {/* Expandable Detail Panel */}
                            <AnimatePresence>
                              {expandedUser === user.rank && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 bg-zinc-950/80 mt-2 rounded-xl text-sm text-zinc-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border border-zinc-800/50">
                                    <span className="font-mono">{user.stats}</span>
                                    <button className="text-blue-400 font-bold hover:underline">Lihat Profil</button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </SpotlightCard>
            </div>

            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6">
                <Trophy className="w-4 h-4" /> Papan Peringkat Live
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 text-white leading-[1.1]">
                <MaskedText>Naik ke Puncak</MaskedText>{" "}
                <MaskedText delay={0.15}>Peringkat</MaskedText>
              </h3>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                Bangun motivasi melalui kompetisi yang sehat. Kumpulkan XP dari setiap materi yang Anda selesaikan, pantau progres pencapaian Anda secara real-time, dan bersainglah secara sportif dengan rekan mahasiswa lainnya.
              </p>
              <Link href="/login" className="inline-block">
                <Button className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-white text-slate-900 hover:bg-zinc-200 font-bold shadow-lg w-full sm:w-auto">
                  Lihat Live Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 7. KILLER FEATURE 4: BRAIN DUEL (INTENSE COLLISION ANIMATION) */}
      <BrainDuel isDesktop={isDesktop} />

      {/* 8. REAL-TIME ANALYTICS (Non-AI, Gamification Focused) */}
      <section id="analitik" className="py-16 sm:py-24 relative z-10 bg-[#030712]">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 text-white tracking-tight">
              <MaskedText>Pantau & Pertahankan</MaskedText>{" "}<MaskedText delay={0.15}>Progresmu</MaskedText>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-2 sm:px-0">
              Evaluasi pemahaman Anda melalui data akurasi dan riwayat aktivitas secara komprehensif. Gunakan wawasan statistik ini untuk mengidentifikasi kelemahan materi dan menjaga konsistensi belajar Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Heatmap Aktivitas", desc: "Pantau intensitas belajar Anda setiap hari. Sistem memvisualisasikan dedikasi Anda layaknya jejak riwayat commit di GitHub.", icon: <Activity />, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
              { title: "Konsistensi & Streak", desc: "Lacak kedisiplinan belajar Anda secara transparan. Amankan rekor runtutan login harian Anda dari interupsi menggunakan item Streak Freeze.", icon: <Flame />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
              { title: "Rapor Kompetensi", desc: "Pantau tingkat penguasaan Anda pada setiap modul. Sistem menyediakan visualisasi persentase keahlian untuk mengukur progres pemahaman secara akurat.", icon: <BrainCircuit />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="w-full"
              >
                <SpotlightCard className="min-h-[240px] md:h-[280px] w-full" highlighted={true}>
                  <div className="p-6 md:p-8 flex flex-col justify-center h-full w-full relative z-10">
                    <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center ${f.bg} ${f.color} shadow-lg transition-transform`}>
                      {f.icon}
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-3">{f.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="py-24 px-6 relative z-10 bg-[#030712]/50 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto p-1 relative z-10"
        >
          {/* Spotlight Wrapper Raksasa untuk CTA */}
          <SpotlightCard className="w-full rounded-2xl md:rounded-[3rem] shadow-[0_0_80px_rgba(37,99,235,0.15)] ring-1 ring-white/5">
            <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-2xl md:rounded-[3rem] p-8 sm:p-16 md:p-24 text-center relative overflow-hidden h-full w-full">

              {/* Subtle grid background yang menyatu */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

              {/* Glowing Orb di tengah untuk kedalaman (Synchronized Cyberpunk Flicker) */}
              <motion.div
                animate={{ opacity: [0.8, 0.8, 0.2, 0.8, 0.4, 0.8, 0.8, 0.1, 0.8, 0.8] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear", times: [0, 0.8, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.98, 1] }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3)_0,transparent_70%)] pointer-events-none"
              />

              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 relative z-10 tracking-tight leading-tight drop-shadow-md">
                <MaskedText>Siap untuk memasuki</MaskedText><br />
                <motion.span
                  animate={{ opacity: [1, 1, 0.2, 1, 0.4, 1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", times: [0, 0.8, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.98, 1] }}
                  className="inline-block text-cyan-400 [text-shadow:0_0_20px_rgba(34,211,238,0.8)]"
                >
                  Dojo?
                </motion.span>
              </h2>

              <p className="text-zinc-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 max-w-xl mx-auto relative z-10 font-medium px-2 sm:px-0">
                Waktu terbaik untuk memulai adalah kemarin. Waktu terbaik kedua adalah <span className="text-blue-100 font-bold">sekarang.</span>
              </p>

              <Link href="/login" className="relative z-10 inline-block">
                <MagneticButton size="lg" className="h-16 px-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all flex items-center group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Mulai Pembelajaran Anda <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                  </span>
                  {/* Efek kilat sapuan (sweep reflection) pada tombol */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </MagneticButton>
              </Link>
            </div>
          </SpotlightCard>
        </motion.div>
      </section>

      {/* 10. FOOTER */}
      <footer className="relative z-10 bg-black pt-24 pb-12">
        {/* Curved Top SVG Divider */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[60px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#050505"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 text-center md:text-left relative z-10">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">ITSDojo</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-xs">Menguasai teknologi modern, satu level pada satu waktu. Dojo pamungkas untuk para builder masa depan.</p>
          </div>

          <div className="flex gap-6 md:gap-8 text-sm font-bold text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors min-h-[48px] flex items-center">Dokumentasi</Link>
            <Link href="#" className="hover:text-white transition-colors min-h-[48px] flex items-center">Changelog</Link>
            <Link href="https://github.com" className="hover:text-white transition-colors min-h-[48px] flex items-center">GitHub</Link>
          </div>

          {/* Copyright — visible on all screens */}
          <div className="text-zinc-600 text-sm font-medium md:border-l md:border-zinc-800 md:pl-8">
            © 2026 ITSDojo Inc.<br />Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({ icon, title, description, highlighted = false, onClick }: any) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.95 }}
      className={`transition-all duration-300 cursor-pointer h-full ${highlighted ? "z-10 md:scale-105" : "opacity-60 hover:opacity-100"}`}
      onClick={onClick}
    >
      <SpotlightCard highlighted={highlighted} className={`w-full h-full ${highlighted ? 'shadow-[0_0_40px_rgba(37,99,235,0.4)] ring-1 ring-blue-500/30' : ''}`}>
        <div className={`p-10 flex flex-col justify-center text-center relative z-10 w-full h-full items-center transition-colors duration-500 ${highlighted ? 'bg-gradient-to-b from-blue-900/40 to-transparent' : ''}`}>
          {highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-gradient-to-r from-transparent via-blue-400 to-transparent z-20 shadow-[0_0_15px_rgba(96,165,250,1)]" />}

          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-sm relative z-10 transition-all duration-500 ${highlighted
            ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] scale-110"
            : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
            }`}>
            {icon}
          </div>
          <h3 className={`text-2xl font-bold mb-4 relative z-10 transition-colors duration-500 ${highlighted ? 'text-white drop-shadow-md' : 'text-zinc-300'}`}>{title}</h3>
          <p className={`text-base leading-relaxed relative z-10 transition-colors duration-500 ${highlighted ? "text-blue-100 font-medium" : "text-zinc-500"}`}>{description}</p>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
