"use client";

import { useEffect, useRef } from "react";
import CountUp from "react-countup";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const prevValue = useRef(value);

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <CountUp
      start={prevValue.current} 
      end={value}               
      duration={1.5}          
      separator="."
      className={className}
      preserveValue={true}
    />
  );
}