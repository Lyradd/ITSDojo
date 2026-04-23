import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DailyGoal = {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'xp' | 'lesson' | 'streak';
  isCompleted: boolean;
  isClaimed: boolean; 
  rewardType: 'xp' | 'gem' | 'multiplier';
  rewardValue: number;
};

interface UserState {
  isLoggedIn: boolean;
  name: string;
  email: string;
  level: number;
  xp: number; 
  xpToNextLevel: number;
  streak: number;
  gems: number; // NEW: Gems currency
  hasStreakFreeze: boolean; // NEW: Power-up status
  activeCourseId: string;
  role: 'mahasiswa' | 'asdos' | 'dosen'; 
  completedLessonIds: string[]; 
  activityHistory: { date: string, count: number }[];
  
  dailyGoals: DailyGoal[];
  
  xpMultiplier: number;
  multiplierEndTime: number | null;

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  setActiveCourse: (courseId: string) => void;
  completeLesson: (lessonId?: string) => void;
  claimGoalReward: (goalId: string) => void;
  buyItem: (type: 'freeze' | 'multiplier', cost: number) => boolean; // NEW: Shop purchase
  setRole: (role: 'mahasiswa' | 'asdos' | 'dosen') => void; // NEW: Set role method
}

const INITIAL_GOALS: DailyGoal[] = [
  { 
    id: 'xp-goal', title: 'Raih 50 XP', target: 50, current: 0, type: 'xp', 
    isCompleted: false, isClaimed: false, rewardType: 'gem', rewardValue: 20 
  },
  { 
    id: 'lesson-goal', title: 'Selesaikan 1 Pelajaran', target: 1, current: 0, type: 'lesson', 
    isCompleted: false, isClaimed: false, rewardType: 'multiplier', rewardValue: 15
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      name: "Daryl",
      email: "daryl@student.its.ac.id",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 3,
      gems: 150, // Starting Gems
      hasStreakFreeze: false,
      activeCourseId: "fe-basic",
      role: 'mahasiswa', 
      completedLessonIds: ['fe-basic-1'], // Default tes biar node 1 selesai, node 2 aktif
      activityHistory: [], // Dinamis untuk Heatmap
      
      dailyGoals: INITIAL_GOALS,
      
      xpMultiplier: 1,
      multiplierEndTime: null,

      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      setRole: (role) => set({ role }), // NEW: Set role implementation
      
      addXp: (amount) => set((state) => {
        // 1. Cek Multiplier
        const now = Date.now();
        const isMultiplierActive = state.multiplierEndTime && now < state.multiplierEndTime;
        const currentMultiplier = isMultiplierActive ? state.xpMultiplier : 1;
        
        // 2. Hitung Total XP Baru
        const finalXpAmount = amount * currentMultiplier;
        
        const newTotalXp = state.xp + finalXpAmount;
        
        // 3. Update Progress Daily Goal (Tipe XP)
        const updatedGoals = state.dailyGoals.map(goal => {
          if (goal.type === 'xp') {
            const newCurrent = Math.min(goal.current + amount, goal.target);
            return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
          }
          return goal;
        });

        // 4. Logika Level Up
        let currentLevel = state.level;
        let currentTarget = state.xpToNextLevel;

        while (newTotalXp >= currentTarget) {
          currentLevel++;
          currentTarget = Math.floor(currentTarget * 1.5); 
        }

        return {
          xp: newTotalXp,
          level: currentLevel,
          xpToNextLevel: currentTarget,
          dailyGoals: updatedGoals,
          xpMultiplier: isMultiplierActive ? state.xpMultiplier : 1,
          multiplierEndTime: isMultiplierActive ? state.multiplierEndTime : null
        };
      }),

      setActiveCourse: (courseId) => set({ activeCourseId: courseId }),

      completeLesson: (lessonId) => set((state) => {
        const updatedGoals = state.dailyGoals.map(goal => {
          if (goal.type === 'lesson') {
            const newCurrent = Math.min(goal.current + 1, goal.target);
            return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
          }
          return goal;
        });

        const updatedLessonIds = lessonId && !state.completedLessonIds.includes(lessonId)
          ? [...state.completedLessonIds, lessonId]
          : state.completedLessonIds;

        // Beri tambahan +50 XP ekstra dan +10 Gems untuk setiap node yang berhasil dibuka
        const bonusXp = (lessonId && !state.completedLessonIds.includes(lessonId)) ? 50 : 0;
        const bonusGems = (lessonId && !state.completedLessonIds.includes(lessonId)) ? 10 : 0;

        // Catat aktivitas untuk Heatmap
        let newHistory = [...state.activityHistory];
        if (lessonId && !state.completedLessonIds.includes(lessonId)) {
           const today = new Date().toISOString().split('T')[0];
           const todayIndex = newHistory.findIndex(h => h.date === today);
           if (todayIndex !== -1) {
              newHistory[todayIndex] = { ...newHistory[todayIndex], count: newHistory[todayIndex].count + 1 };
           } else {
              newHistory.push({ date: today, count: 1 });
           }
        }

        return { 
          dailyGoals: updatedGoals, 
          completedLessonIds: updatedLessonIds, 
          xp: state.xp + bonusXp,
          gems: state.gems + bonusGems,
          activityHistory: newHistory
        };
      }),

      claimGoalReward: (goalId) => set((state) => {
        const goalIndex = state.dailyGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return state;

        const goal = state.dailyGoals[goalIndex];
        if (!goal.isCompleted || goal.isClaimed) return state;

        const updatedGoals = [...state.dailyGoals];
        updatedGoals[goalIndex] = { ...goal, isClaimed: true };

        let newState: Partial<UserState> = { dailyGoals: updatedGoals };

        if (goal.rewardType === 'gem') {
           // Tambahkan akumulasi Gems
           newState.gems = state.gems + goal.rewardValue;
        } 
        else if (goal.rewardType === 'multiplier') {
           const durationMs = goal.rewardValue * 60 * 1000; 
           newState.xpMultiplier = 2;
           const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() 
              ? state.multiplierEndTime 
              : Date.now();
           newState.multiplierEndTime = currentEndTime + durationMs;
        }

        return newState as UserState;
      }),

      buyItem: (type, cost) => {
        const state = get();
        if (state.gems < cost) return false;

        if (type === 'freeze') {
           if (state.hasStreakFreeze) return false; // Sudah punya
           set({ gems: state.gems - cost, hasStreakFreeze: true });
        } else if (type === 'multiplier') {
           const durationMs = 60 * 60 * 1000; // 1 Jam
           const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() 
              ? state.multiplierEndTime 
              : Date.now();
           set({ 
             gems: state.gems - cost, 
             xpMultiplier: 2, 
             multiplierEndTime: currentEndTime + durationMs 
           });
        }
        return true;
      }
    }),
    {
      name: 'itsdojo-storage-tests', 
      partialize: (state) => ({ 
        isLoggedIn: state.isLoggedIn, 
        name: state.name, 
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        streak: state.streak,
        gems: state.gems,
        hasStreakFreeze: state.hasStreakFreeze,
        role: state.role, // NEW: Persist role
        completedLessonIds: state.completedLessonIds,
        activityHistory: state.activityHistory
        // dailyGoals: state.dailyGoals,
        // xpMultiplier: state.xpMultiplier,
        // multiplierEndTime: state.multiplierEndTime
      }), 
    }
  )
);