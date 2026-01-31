import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-blue-600 border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-zinc-900 dark:text-white font-semibold">{message}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  count?: number;
}

export function LoadingCard({ count = 1 }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg animate-pulse"
        >
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
        </div>
      ))}
    </>
  );
}
