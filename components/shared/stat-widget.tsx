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
}

export const StatWidget = ({ icon: Icon, color, label, value, href, hoverContent, prefix }: StatWidgetProps) => {
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
    <div className={`flex items-center gap-2 p-2.5 px-3 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm ${href || hoverContent ? 'cursor-pointer hover:bg-zinc-100 hover:border-zinc-200 dark:hover:bg-zinc-800 transition-colors' : ''}`}>
      <motion.div
        animate={isBumping ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} fill="currentColor" />
      </motion.div>
      <div className="font-bold text-sm sm:text-base leading-none">
        {typeof value === 'number' ? <AnimatedNumber value={value} prefix={prefix} /> : value}
      </div>
    </div>
  );
  
  const wrappedContent = hoverContent ? (
    <div className="relative group">
      {href ? <Link href={href}>{content}</Link> : content}
      <div className="absolute top-full mt-2 right-0 z-50 hidden group-hover:block pointer-events-none group-hover:pointer-events-auto">
        {hoverContent}
      </div>
    </div>
  ) : (
    href ? <Link href={href}>{content}</Link> : content
  );

  return wrappedContent;
};
