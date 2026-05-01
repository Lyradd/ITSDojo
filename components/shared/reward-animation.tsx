"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Zap } from "lucide-react";
import { useUserStore } from "@/lib/store";

interface Particle {
  id: string;
  type: 'xp' | 'gem';
  x: number;
  y: number;
}

export function RewardAnimation() {
  const { rewardAnimationQueue, clearRewardAnimationQueue } = useUserStore();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (rewardAnimationQueue.length > 0) {
      let newParticles: Particle[] = [];
      
      rewardAnimationQueue.forEach(reward => {
        const generated = Array.from({ length: reward.count }).map((_, i) => ({
          id: reward.id + '-' + i,
          type: reward.type as 'xp' | 'gem',
          x: typeof window !== 'undefined' ? window.innerWidth / 2 + (Math.random() * 100 - 50) : 500,
          y: typeof window !== 'undefined' ? window.innerHeight / 2 + (Math.random() * 100 - 50) : 500,
        }));
        newParticles = [...newParticles, ...generated];
      });
      
      setParticles(prev => [...prev, ...newParticles]);
      
      // Clear the queue from store once they are captured locally
      clearRewardAnimationQueue();

      // Clean up these specific particles after animation duration
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 2000);
    }
  }, [rewardAnimationQueue, clearRewardAnimationQueue]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle, i) => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: particle.x,
              y: particle.y 
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: particle.type === 'gem' ? [0, 1, 0.8, 0.4] : [0, 1.2, 1.1, 0.6],
              // Move towards sidebar profile section
              // Sidebar width is ~260px. 
              // XP is progress bar (further left ~80px)
              // Gems is on the right side of profile block (~180px)
              x: particle.type === 'gem' ? 160 : 80,
              y: typeof window !== 'undefined' ? window.innerHeight - (particle.type === 'gem' ? 115 : 80) : 800,
            }}
            transition={{ 
              duration: 1.4,
              delay: i * 0.1,
              ease: [0.23, 1, 0.32, 1] // OutQuint for smoother arrival
            }}
            className="absolute"
          >
            <div className={`p-1.5 rounded-full shadow-xl border border-white/20 backdrop-blur-sm ${
              particle.type === 'gem' ? 'bg-blue-500 text-white' : 'bg-amber-400 text-zinc-900'
            }`}>
              {particle.type === 'gem' ? (
                <Gem className="w-4 h-4 fill-current" />
              ) : (
                <Zap className="w-5 h-5 fill-current" />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
