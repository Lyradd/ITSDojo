import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipe Data untuk Goal
export type DailyGoal = {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'xp' | 'lesson' | 'streak';
  isCompleted: boolean;
  isClaimed: boolean; // Field Baru: Status Klaim
  rewardType: 'xp' | 'gem' | 'multiplier'; // Jenis Hadiah
  rewardValue: number; // Nilai Hadiah (misal: 50 XP atau 15 menit)
};

interface UserState {
  isLoggedIn: boolean;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  activeCourseId: string;
  
  dailyGoals: DailyGoal[];
  
  // State Multiplier
  xpMultiplier: number;
  multiplierEndTime: number | null; // Timestamp kapan multiplier berakhir

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  setActiveCourse: (courseId: string) => void;
  completeLesson: () => void;
  claimGoalReward: (goalId: string) => void; // Action Baru
}

const INITIAL_GOALS: DailyGoal[] = [
  { 
    id: 'xp-goal', title: 'Raih 50 XP', target: 50, current: 0, type: 'xp', 
    isCompleted: false, isClaimed: false, rewardType: 'gem', rewardValue: 20 
  },
  { 
    id: 'lesson-goal', title: 'Selesaikan 1 Pelajaran', target: 1, current: 0, type: 'lesson', 
    isCompleted: false, isClaimed: false, rewardType: 'multiplier', rewardValue: 15 // 15 Menit 2x XP
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      name: "Daryl",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 3,
      activeCourseId: "fe-basic",
      dailyGoals: INITIAL_GOALS,
      
      xpMultiplier: 1,
      multiplierEndTime: null,

      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      
      addXp: (amount) => set((state) => {
        // Cek apakah Multiplier Aktif?
        const now = Date.now();
        const isMultiplierActive = state.multiplierEndTime && now < state.multiplierEndTime;
        const currentMultiplier = isMultiplierActive ? state.xpMultiplier : 1;
        
        // Hitung XP Akhir
        const finalXpAmount = amount * currentMultiplier;
        const newXp = state.xp + finalXpAmount;
        
        // Update Progress Goal XP (Hanya base XP yang dihitung ke target goal, atau total? Kita pakai base agar fair)
        const updatedGoals = state.dailyGoals.map(goal => {
          if (goal.type === 'xp') {
            const newCurrent = Math.min(goal.current + amount, goal.target); // Pakai amount asli untuk target
            return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
          }
          return goal;
        });

        // Level Up Logic
        let nextState: Partial<UserState> = {
          xp: newXp,
          dailyGoals: updatedGoals,
          // Reset multiplier jika waktu habis
          xpMultiplier: isMultiplierActive ? state.xpMultiplier : 1,
          multiplierEndTime: isMultiplierActive ? state.multiplierEndTime : null
        };

        if (newXp >= state.xpToNextLevel) {
          nextState.level = state.level + 1;
          nextState.xp = newXp - state.xpToNextLevel;
          nextState.xpToNextLevel = state.xpToNextLevel * 1.5;
        }

        return nextState as UserState;
      }),

      setActiveCourse: (courseId) => set({ activeCourseId: courseId }),

      completeLesson: () => set((state) => {
        const updatedGoals = state.dailyGoals.map(goal => {
          if (goal.type === 'lesson') {
            const newCurrent = Math.min(goal.current + 1, goal.target);
            return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
          }
          return goal;
        });
        return { dailyGoals: updatedGoals };
      }),

      // --- LOGIKA KLAIM HADIAH ---
      claimGoalReward: (goalId) => set((state) => {
        const goalIndex = state.dailyGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return state;

        const goal = state.dailyGoals[goalIndex];
        if (!goal.isCompleted || goal.isClaimed) return state;

        // Tandai sudah diklaim
        const updatedGoals = [...state.dailyGoals];
        updatedGoals[goalIndex] = { ...goal, isClaimed: true };

        // Berikan Hadiah Sesuai Tipe
        let newState: Partial<UserState> = { dailyGoals: updatedGoals };

        if (goal.rewardType === 'gem') {
           // Di real app, tambah saldo gem user. Di sini kita console.log dulu
           console.log(`Dapat ${goal.rewardValue} Gems!`);
        } 
        else if (goal.rewardType === 'multiplier') {
           // Aktifkan 2x XP
           const durationMs = goal.rewardValue * 60 * 1000; // menit ke ms
           newState.xpMultiplier = 2;
           // Jika sudah ada multiplier, tambah waktunya. Jika belum, set baru.
           const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() 
              ? state.multiplierEndTime 
              : Date.now();
           
           newState.multiplierEndTime = currentEndTime + durationMs;
        }

        return newState as UserState;
      })
    }),
    {
      name: 'itsdojo-storage',
      partialize: (state) => ({ 
        isLoggedIn: state.isLoggedIn, 
        name: state.name, 
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        dailyGoals: state.dailyGoals,
        streak: state.streak,
        xpMultiplier: state.xpMultiplier,
        multiplierEndTime: state.multiplierEndTime
      }), 
    }
  )
);