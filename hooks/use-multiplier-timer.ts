import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store";

export function useMultiplierTimer() {
  const { multiplierEndTime } = useUserStore();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!multiplierEndTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = multiplierEndTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [multiplierEndTime]);

  return timeLeft;
}
