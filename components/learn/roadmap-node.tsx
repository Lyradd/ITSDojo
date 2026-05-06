import { motion } from "framer-motion";
import { Lock, Check, Play, CheckCircle, Star, Gem, Zap, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ComputedLessonNode {
  id: string;
  title: string;
  desc: string;
  type: 'completed' | 'active' | 'next_locked' | 'far_locked';
  duration?: string;
  xpReward?: number;
  gemReward?: number;
}

interface RoadmapNodeProps {
  node: ComputedLessonNode;
  index: number;
  totalNodes: number;
  isEven: boolean;
}

export const RoadmapNode = ({ node, index, totalNodes, isEven }: RoadmapNodeProps) => {
  const router = useRouter();
  const isCompleted = node.type === 'completed';

  return (
    <div className="relative w-full flex justify-center z-20">
      {/* Edge ke next node */}
      {index < totalNodes - 1 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-16 z-0">
          {isCompleted ? (
            <div className="w-full h-full bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden relative flex justify-center rounded-full">
              <motion.div
                animate={{ y: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="absolute top-0 w-1.5 h-1/2 bg-gradient-to-b from-transparent via-cyan-400 to-transparent blur-[1px]"
              />
              <div className="absolute inset-0 bg-blue-500/20" />
            </div>
          ) : (
            <div className="w-0 h-full border-l-[4px] border-dashed border-zinc-300 dark:border-zinc-700 mx-auto" />
          )}
        </div>
      )}

      {/* --- NODE: COMPLETED --- */}
      {node.type === 'completed' && (
        <div className="relative cursor-pointer group" onClick={() => router.push(`/learn/lesson/${node.id}`)}>
          {/* Tooltip Label */}
          <div className={`absolute z-30 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all group-hover:shadow-md group-hover:scale-105 top-full mt-4 left-1/2 -translate-x-1/2 text-center w-max max-w-[250px] sm:w-auto sm:text-left sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 ${isEven ? 'sm:left-[calc(50%+40px)] sm:translate-x-0 sm:origin-left' : 'sm:right-[calc(50%+40px)] sm:left-auto sm:translate-x-0 sm:origin-right sm:text-right'}`}>
            <span className="text-zinc-400 text-[10px] uppercase block mb-0.5">Stage {index + 1}</span>
            <span className="text-green-600 dark:text-green-400">{node.title}</span>

            {/* INFO OVERVIEW ON HOVER */}
            <div className="max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center sm:items-start">
              <p className="text-xs text-zinc-500 font-normal mb-2 whitespace-normal min-w-[140px] text-center sm:text-left">{node.desc}</p>
              <div className={`flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-[10px] text-green-700 dark:text-green-400 w-fit font-bold border border-green-100 dark:border-green-900/40`}>
                <CheckCircle className="w-3 h-3" /> Diselesaikan
              </div>
            </div>
          </div>

          {/* Lingkaran Icon */}
          <div className="w-20 h-20 rounded-full bg-green-500 border-b-[6px] border-green-700 flex items-center justify-center shadow-xl shadow-green-200 dark:shadow-none transition-transform active:scale-95 z-20 relative ring-4 ring-white dark:ring-zinc-950">
            <Check className="w-9 h-9 text-white stroke-[4]" />
          </div>

          {/* Bintang Reward */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm z-30">
            {[1, 2, 3].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
          </div>
        </div>
      )}

      {/* --- NODE: ACTIVE --- */}
      {node.type === 'active' && (
        <motion.div layoutId="active-node-container" className="relative cursor-pointer z-20 group" onClick={() => router.push(`/learn/lesson/${node.id}`)}>
          {/* Efek Pulsing (Glowing Halo) */}
          <motion.div
            layoutId="active-node-glow"
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-blue-500 blur-xl pointer-events-none z-10"
          />

          {/* Label 'MULAI!' Floating */}
          <motion.div layoutId="active-node-label" className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-extrabold shadow-md animate-bounce whitespace-nowrap z-40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-blue-600">
            MULAI!
          </motion.div>

          {/* Tooltip Label */}
          <div className={`absolute z-30 bg-white dark:bg-zinc-900 border-2 border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl text-sm font-bold shadow-md transition-all group-hover:shadow-xl group-hover:scale-105 top-full mt-4 left-1/2 -translate-x-1/2 text-center w-max max-w-[250px] sm:w-auto sm:text-left sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 ${isEven ? 'sm:left-[calc(50%+48px)] sm:translate-x-0 sm:origin-left' : 'sm:right-[calc(50%+48px)] sm:left-auto sm:translate-x-0 sm:origin-right sm:text-right'}`}>
            <span className="text-blue-500 dark:text-blue-400 text-[10px] uppercase block mb-0.5 animate-pulse">👉 Saat Ini (Stage {index + 1})</span>
            <span className="text-zinc-800 dark:text-white text-base">{node.title}</span>

            {/* INFO OVERVIEW ON HOVER */}
            <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-3 transition-all duration-300 ease-in-out overflow-hidden">
              <p className="text-xs text-zinc-500 font-normal mb-3 whitespace-normal min-w-[160px] text-center sm:text-left">{node.desc}</p>

              <div className={`flex flex-wrap items-center gap-2 ${!isEven && 'sm:justify-end'}`}>
                <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-[10px] text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  <Zap className="w-3 h-3" /> +{node.xpReward || 50} XP
                </div>
                <div className="flex items-center gap-1.5 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-1 rounded text-[10px] text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
                  <Gem className="w-3 h-3" /> +{node.gemReward || 10} Gems
                </div>
                {node.duration && (
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-500 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700">
                    <Clock className="w-3 h-3" /> {node.duration}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lingkaran Icon Utama */}
          <motion.div layoutId="active-node-icon" className="w-24 h-24 rounded-full bg-blue-500 border-b-[8px] border-blue-700 flex items-center justify-center shadow-2xl shadow-blue-300/50 dark:shadow-blue-900/50 transition-transform hover:scale-105 active:scale-95 relative overflow-hidden ring-4 ring-white dark:ring-zinc-900 z-20">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
            <Play className="w-10 h-10 text-white fill-current ml-1" />
          </motion.div>
        </motion.div>
      )}

      {/* --- NODE: NEXT LOCKED (Clear but locked) --- */}
      {node.type === 'next_locked' && (
        <motion.div
          layoutId={`node-root-${node.id}`}
          initial={{ opacity: 0.4, filter: "blur(5px)", scale: 0.9 }}
          animate={{ opacity: 0.8, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="relative cursor-default z-20 group"
        >
          {/* Tooltip Label */}
          <div className={`absolute z-30 px-4 py-2 rounded-xl text-sm font-bold opacity-60 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 backdrop-blur-sm transition-all group-hover:opacity-100 group-hover:shadow-md top-full mt-4 left-1/2 -translate-x-1/2 text-center w-max max-w-[250px] sm:w-auto sm:text-left sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 ${isEven ? 'sm:left-[calc(50%+40px)] sm:translate-x-0 sm:origin-left' : 'sm:right-[calc(50%+40px)] sm:left-auto sm:translate-x-0 sm:origin-right sm:text-right'}`}>
            <span className="text-zinc-400 text-[10px] uppercase block mb-0.5">Stage {index + 1}</span>
            <span className="text-zinc-600 dark:text-zinc-400">{node.title}</span>

            {/* INFO OVERVIEW ON HOVER */}
            <div className="max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center sm:items-start">
              <p className="text-[11px] text-zinc-400 font-normal mb-2 whitespace-normal min-w-[150px] text-center sm:text-left">Belum terbuka. Selesaikan stage sebelumnya terlebih dahulu.</p>
              <div className={`flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-500 w-fit ${!isEven && 'sm:self-end'}`}>
                <Lock className="w-3 h-3" /> Terkunci
              </div>
            </div>
          </div>

          {/* Lingkaran Icon */}
          <motion.div layoutId={`node-icon-${node.id}`} className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 border-b-[6px] border-zinc-300 dark:border-zinc-700 flex items-center justify-center grayscale ring-4 ring-white dark:ring-zinc-950 z-20 relative">
            <Lock className="w-8 h-8 text-zinc-400" />
          </motion.div>
        </motion.div>
      )}

      {/* --- NODE: FAR LOCKED (FOG OF WAR) --- */}
      {node.type === 'far_locked' && (
        <motion.div layoutId={`node-root-${node.id}`} className="relative opacity-40 blur-[3px] grayscale cursor-default z-20 transition-all duration-500 hover:blur-[1px] hover:opacity-60 group">
          {/* Tooltip Label */}
          <div className={`absolute z-30 px-4 py-2 rounded-xl text-sm font-bold opacity-60 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 backdrop-blur-sm top-full mt-4 left-1/2 -translate-x-1/2 text-center w-max max-w-[250px] sm:w-auto sm:text-left sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 ${isEven ? 'sm:left-[calc(50%+40px)] sm:translate-x-0 sm:origin-left' : 'sm:right-[calc(50%+40px)] sm:left-auto sm:translate-x-0 sm:origin-right sm:text-right'}`}>
            <span className="text-zinc-500 text-[10px] uppercase block tracking-wider">Misteri...</span>
          </div>

          {/* Lingkaran Icon */}
          <motion.div layoutId={`node-icon-${node.id}`} className="w-16 h-16 rounded-full bg-zinc-300 dark:bg-zinc-800 border-b-[6px] border-zinc-400 dark:border-zinc-700 flex items-center justify-center grayscale ring-4 ring-white dark:ring-zinc-950 z-20 relative">
            <Lock className="w-6 h-6 text-zinc-500" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
