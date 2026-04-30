import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface StatWidgetProps {
  icon: LucideIcon;
  color: string;
  label: string;
  value: number | string;
  href?: string;
}

export const StatWidget = ({ icon: Icon, color, label, value, href }: StatWidgetProps) => {
  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm ${href ? 'cursor-pointer hover:bg-zinc-100 hover:border-zinc-200 dark:hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95' : ''}`}>
      <Icon className={`w-6 h-6 ${color}`} fill="currentColor" />
      <div>
        <div className="font-bold text-lg leading-none">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </div>
        <div className="text-xs text-zinc-400 font-bold uppercase">{label}</div>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
};
