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
  level: number;
  xp: number; 
  xpToNextLevel: number;
  streak: number;
  activeCourseId: string;
  role: 'mahasiswa' | 'asdos' | 'dosen'; // NEW: Role field
  
  dailyGoals: DailyGoal[];
  
  xpMultiplier: number;
  multiplierEndTime: number | null;

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  setActiveCourse: (courseId: string) => void;
  completeLesson: () => void;
  claimGoalReward: (goalId: string) => void;
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
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 3,
      activeCourseId: "fe-basic",
      role: 'mahasiswa', // NEW: Default role
      
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

      claimGoalReward: (goalId) => set((state) => {
        const goalIndex = state.dailyGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return state;

        const goal = state.dailyGoals[goalIndex];
        if (!goal.isCompleted || goal.isClaimed) return state;

        const updatedGoals = [...state.dailyGoals];
        updatedGoals[goalIndex] = { ...goal, isClaimed: true };

        let newState: Partial<UserState> = { dailyGoals: updatedGoals };

        if (goal.rewardType === 'gem') {
           console.log(`Dapat ${goal.rewardValue} Gems!`);
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
      })
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
        role: state.role, // NEW: Persist role
        // dailyGoals: state.dailyGoals,
        // xpMultiplier: state.xpMultiplier,
        // multiplierEndTime: state.multiplierEndTime
      }), 
    }
  )
);