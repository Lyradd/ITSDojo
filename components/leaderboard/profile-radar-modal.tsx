"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Swords, Shield, Zap, Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { cn } from '@/lib/utils';

interface ProfileRadarModalProps {
  profile: LeaderboardEntry | null;
  onClose: () => void;
}

export function ProfileRadarModal({ profile, onClose }: ProfileRadarModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (profile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [profile]);

  if (!mounted) return null;

  // Dummy Gamification Data based on profile
  const matches = Math.floor(Math.random() * 200) + 50;
  const winRate = profile ? profile.accuracy : (Math.floor(Math.random() * 40) + 40);
  const wins = Math.floor(matches * (winRate / 100));
  const loses = Math.floor(matches * 0.3);
  const draws = matches - wins - loses;
  const mvp = Math.floor(wins * 0.4);

  const radarData = [
    { subject: 'Akurasi', A: profile?.accuracy || 0, fullMark: 100 },
    { subject: 'Kecepatan', A: Math.floor(Math.random() * 30) + 70, fullMark: 100 },
    { subject: 'Kompleksitas', A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
    { subject: 'Konsistensi', A: Math.floor(Math.random() * 50) + 50, fullMark: 100 },
    { subject: 'Diversitas', A: Math.floor(Math.random() * 30) + 70, fullMark: 100 },
  ];

  const modalContent = (
    <AnimatePresence>
      {profile && (
        <div key="profile-modal" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl border border-indigo-500/30 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Stats (Mobile Legends Style) */}
            <div className="flex-1 p-8 md:pr-4 flex flex-col">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-lg border-4 border-indigo-500/50", profile.avatar || "bg-indigo-600 text-white")}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">{profile.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                      Batch {profile.batch || '2023'}
                    </span>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {profile.score} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 3 Circular Stats */}
              <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-[6px] border-pink-500 flex flex-col items-center justify-center bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <span className="text-2xl font-black text-white">{matches}</span>
                    <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider">Matches</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full border-[6px] border-yellow-500 flex flex-col items-center justify-center bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    <span className="text-3xl font-black text-white">{winRate}%</span>
                    <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider">Win Rate</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-[6px] border-green-500 flex flex-col items-center justify-center bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <span className="text-2xl font-black text-white">{mvp}</span>
                    <span className="text-[10px] font-bold text-green-300 uppercase tracking-wider">MVP</span>
                  </div>
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-auto">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Wins (Menang)</span>
                  <span className="text-white font-bold">{wins}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Loses (Kalah)</span>
                  <span className="text-white font-bold">{loses}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Draws (Seri)</span>
                  <span className="text-white font-bold">{draws}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Highest Streak</span>
                  <span className="text-white font-bold">{Math.floor(Math.random() * 15) + 3}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Perfect Scores</span>
                  <span className="text-white font-bold">{Math.floor(mvp * 0.3)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-indigo-200/70 font-medium">Avg Answer Time</span>
                  <span className="text-white font-bold">{(Math.random() * 5 + 2).toFixed(1)}s</span>
                </div>
              </div>
            </div>

            {/* Right Side: Radar Chart */}
            <div className="flex-1 p-8 md:pl-4 flex flex-col justify-center items-center bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-l border-white/10">
              <h3 className="text-xl font-black text-white mb-2 text-center tracking-wide">PENTAGON SKILL</h3>
              <p className="text-xs text-indigo-300/70 mb-6 text-center">Analisis Performa Duel & Evaluasi</p>
              
              <div className="h-[350px] w-full max-w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#4f46e5" strokeOpacity={0.4} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#a5b4fc', fontSize: 13, fontWeight: '900' }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Skill"
                      dataKey="A"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fill="#06b6d4"
                      fillOpacity={0.4}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ fontWeight: 'black', color: '#22d3ee', fontSize: '16px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
