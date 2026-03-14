import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import confetti from "canvas-confetti";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Confetti Variants ---

/** Standard confetti: steady rain from both sides for 3 seconds. Used on quiz finish. */
export function triggerConfetti() {
  const end = Date.now() + 3 * 1000;
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/** Big celebration: cannon bursts for 90%+ scores. More particles, wider spread. */
export function triggerBigConfetti() {
  // Initial burst
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.6 },
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#a786ff"],
    scalar: 1.2,
  });

  // Side cannons after a short delay
  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
      colors: ["#FFD700", "#FF6B6B", "#fff"],
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.7 },
      colors: ["#FFD700", "#FF6B6B", "#fff"],
    });
  }, 300);

  // School pride ribbon burst
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 120,
      origin: { y: 0.5 },
      colors: ["#003DA5", "#FFD700"],
      scalar: 1.5,
    });
  }, 700);
}

/** Star burst: gold star-shaped confetti. Used for level up or streak achievement. */
export function triggerStarBurst() {
  const starDefaults = {
    spread: 360,
    ticks: 80,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#FFe400", "#FFbd00", "#E89400", "#FFCA6c", "#fdffb6"],
    shapes: ["star" as const],
    scalar: 1.5,
  };

  confetti({ ...starDefaults, particleCount: 60, origin: { x: 0.5, y: 0.5 } });
  setTimeout(() => {
    confetti({ ...starDefaults, particleCount: 40, origin: { x: 0.3, y: 0.4 } });
    confetti({ ...starDefaults, particleCount: 40, origin: { x: 0.7, y: 0.4 } });
  }, 200);
}

/** Legacy: simple one-shot confetti. */
export function triggerSimpleConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}