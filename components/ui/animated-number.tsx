"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
}

export function AnimatedNumber({ value, className, prefix = "" }: AnimatedNumberProps) {
  const [mounted, setMounted] = useState(false);
  
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15
  });

  const display = useTransform(spring, (current) => {
    return prefix + Math.round(current).toLocaleString("id-ID");
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (!mounted) {
    return <span className={className}>{prefix}{value.toLocaleString("id-ID")}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}