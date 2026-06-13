import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StatWidgetProps {
  icon: LucideIcon;
  color: string;
  label: string;
  value: number | string;
  href?: string;
  hoverContent?: React.ReactNode;
  prefix?: string;
  align?: "left" | "center" | "right";
}

export const StatWidget = ({ icon: Icon, color, label, value, href, hoverContent, prefix, align = "right" }: StatWidgetProps) => {
  const [isBumping, setIsBumping] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsBumping(true);
    const timer = setTimeout(() => setIsBumping(false), 400);
    return () => clearTimeout(timer);
  }, [value]);

  const content = (
    <div className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-transparent ${href || hoverContent ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors' : ''}`}>
      <motion.div
        animate={isBumping ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} fill="currentColor" />
      </motion.div>
      <div className="font-bold text-sm sm:text-base leading-none text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        {typeof value === 'number' ? <AnimatedNumber value={value} prefix={prefix} /> : <span className="transition-colors duration-300">{prefix}{value}</span>}
      </div>
    </div>
  );
  
  const alignClass = align === "left" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0";

  const wrappedContent = hoverContent ? (
    <div className="relative group">
      {href ? <Link href={href}>{content}</Link> : content}
      <div className={`absolute top-full mt-2 ${alignClass} z-50 hidden group-hover:block pointer-events-none group-hover:pointer-events-auto`}>
        {hoverContent}
      </div>
    </div>
  ) : (
    href ? <Link href={href}>{content}</Link> : content
  );

  return wrappedContent;
};
