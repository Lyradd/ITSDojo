"use client";

import { motion } from "framer-motion";

export function AnimatedNinja() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center select-none">
      {/* Background Aura glow */}
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-28 h-28 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl z-0"
      />

      {/* Floating Zen Ninja */}
      <motion.svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 drop-shadow-lg"
      >
        {/* Meditating smoke / dust particles below */}
        <motion.ellipse
          cx="70"
          cy="125"
          rx="30"
          ry="6"
          fill="currentColor"
          className="text-zinc-200 dark:text-zinc-800/60"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Headband ribbon back part */}
        <motion.path
          d="M38 52 C20 54 12 42 5 48 C12 56 20 58 38 56 Z"
          fill="#EF4444"
          animate={{
            rotate: [0, 8, -5, 0],
            skewX: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M38 56 C22 64 16 54 8 62 C16 68 24 66 38 58 Z"
          fill="#DC2626"
          animate={{
            rotate: [0, -5, 8, 0],
            skewY: [0, -3, 3, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Body (Cross-legged sitting) */}
        <path
          d="M30 110 C30 85 45 80 70 80 C95 80 110 85 110 110 C110 120 100 125 70 125 C40 125 30 120 30 110 Z"
          fill="currentColor"
          className="text-zinc-850 dark:text-zinc-800"
        />
        {/* Belt (Obi) */}
        <rect x="50" y="98" width="40" height="6" rx="2" fill="#EF4444" />
        {/* Crossed arms (under cowl) */}
        <path
          d="M45 88 C55 86 85 86 95 88 C98 94 92 100 70 100 C48 100 42 94 45 88 Z"
          fill="currentColor"
          className="text-zinc-900 dark:text-zinc-750"
        />

        {/* Head */}
        <circle cx="70" cy="55" r="28" fill="currentColor" className="text-zinc-850 dark:text-zinc-800" />

        {/* Red Headband Wrap */}
        <path
          d="M42 45 C55 40 85 40 98 45 L98 52 C85 47 55 47 42 52 Z"
          fill="#EF4444"
        />

        {/* Eye Cutout Area */}
        <path
          d="M48 54 C48 51 52 49 70 49 C88 49 92 51 92 54 C92 59 88 61 70 61 C52 61 48 59 48 54 Z"
          fill="#FEE2E2"
        />

        {/* Eyes (With blinking animation) */}
        <g>
          {/* Left Eye */}
          <motion.ellipse
            cx="60"
            cy="54"
            rx="3.5"
            ry="4"
            fill="#1E293B"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
          {/* Right Eye */}
          <motion.ellipse
            cx="80"
            cy="54"
            rx="3.5"
            ry="4"
            fill="#1E293B"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </g>

        {/* Cute blushing cheeks */}
        <circle cx="53" cy="58" r="2" fill="#F87171" opacity="0.6" />
        <circle cx="87" cy="58" r="2" fill="#F87171" opacity="0.6" />
      </motion.svg>

      {/* Floating Zen Particles (Leaves/Sparks) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Particle 1 */}
        <motion.div
          animate={{
            y: [20, -40],
            x: [0, -15, 0],
            opacity: [0, 1, 0],
            scale: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            delay: 0.5,
          }}
          className="absolute left-6 bottom-10 w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"
        />
        {/* Particle 2 */}
        <motion.div
          animate={{
            y: [30, -30],
            x: [0, 15, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: 1.2,
          }}
          className="absolute right-8 bottom-12 w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full"
        />
        {/* Particle 3 (Leaf outline or shape) */}
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-1/4 top-10 text-emerald-500/60 dark:text-emerald-400/40"
          animate={{
            y: [0, 60],
            x: [0, 10, -5],
            rotate: [0, 180],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
          }}
        >
          <path d="M6 1C9 1 11 3 11 6C11 9 9 11 6 11C3 11 1 9 1 6C1 3 3 1 6 1Z" fill="currentColor" />
        </motion.svg>
      </div>
    </div>
  );
}
