'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  /** Height of the card in px. Default: 320 */
  height?: number;
  /** Flip on hover (desktop) instead of click */
  flipOnHover?: boolean;
}

/**
 * 3D Flip Card component.
 * Uses CSS perspective + rotateY + backface-visibility for smooth GPU-accelerated 3D flip.
 */
export function FlipCard({ front, back, className, height = 320, flipOnHover = false }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!flipOnHover) setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    if (flipOnHover) setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    if (flipOnHover) setIsFlipped(false);
  };

  return (
    <div
      className={cn('relative cursor-pointer select-none', className)}
      style={{ height, perspective: '1200px' }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Inner container that rotates */}
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* BACK FACE — pre-rotated 180deg, becomes visible when card flips */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>

      {/* Flip indicator dot — hidden when flipped */}
      <motion.div
        className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-blue-400/60"
        animate={{ opacity: isFlipped ? 0 : 1, scale: isFlipped ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
