import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatLocalDate } from './utils';

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
  streakFreezeCount: number; // Max 3
  activeCourseId: string;
  role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin'; 
  semester: number; // NEW: Semester mahasiswa
  enrolledCourseIds: string[]; // NEW: Courses they are enrolled in
  pendingCourseIds: string[]; // NEW: Courses waiting for dosen approval
  courseAccessHistory: Record<string, string>; // Maps courseId to last access ISO date
  completedLessonIds: string[]; 
  activityHistory: { date: string, count: number }[];
  unlockedAchievements: string[];
  nocturnalCount: number;
  earlyBirdCount: number;
  longestStreak: number;
  mostXpInDay: number;
  totalPerfectLessons: number;
  unlockAchievement: (id: string) => void;
  purchaseHistory: { id: string, type: string, cost: number, date: string, itemName: string }[];
  
  dailyGoals: DailyGoal[];
  
  xpMultiplier: number;
  multiplierEndTime: number | null;

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  resetProgress: () => void; // NEW: Debug/Testing method
  setActiveCourse: (courseId: string) => void;
  completeLesson: (lessonId?: string) => void;
  claimGoalReward: (goalId: string) => void;
  buyItem: (type: 'freeze' | 'multiplier' | 'shield-3x', cost: number) => boolean; // NEW: Shop purchase
  setRole: (role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin') => void; // NEW: Set role method
  setSemester: (semester: number) => void;
  requestEnrollment: (courseId: string) => void;
  acceptEnrollment: (courseId: string) => void;

  lastDailyReset: string;
  checkDailyReset: () => void;
  weeklyRewardClaimed: boolean;
  claimWeeklyReward: () => void;
  rewardAnimationQueue: { id: string, type: 'xp' | 'gem', count: number }[];
  triggerReward: (type: 'xp' | 'gem', count: number) => void;
  clearRewardAnimationQueue: () => void;
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
  persist<UserState>(
    (set, get) => ({
      isLoggedIn: false,
      name: "Daryl",
      email: "daryl@student.its.ac.id",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 3,
      gems: 300, // Starting Gems
      streakFreezeCount: 0,
      activeCourseId: "fe-basic",
      role: 'admin', 
      semester: 5, // Default for Daryl
      enrolledCourseIds: ['fe-basic'], // Default tes biar langsung bisa nyoba
      pendingCourseIds: [],
      courseAccessHistory: { 'fe-basic': new Date().toISOString() }, // Default access
      completedLessonIds: ['fe-basic-1'], // Default tes biar node 1 selesai, node 2 aktif
      activityHistory: [], // Dinamis untuk Heatmap
      unlockedAchievements: [], // Menyimpan ID achievement yang terbuka
      nocturnalCount: 0,
      earlyBirdCount: 0,
      longestStreak: 3,
      mostXpInDay: 0,
      totalPerfectLessons: 0,
      purchaseHistory: [],
      
      dailyGoals: INITIAL_GOALS,
      
      xpMultiplier: 1,
      multiplierEndTime: null,
      lastDailyReset: formatLocalDate(new Date()),
      weeklyRewardClaimed: false,

      checkDailyReset: () => set((state) => {
        const now = new Date();
        const today = formatLocalDate(now);
        if (state.lastDailyReset !== today) {
           const updates: any = {
             dailyGoals: INITIAL_GOALS,
             lastDailyReset: today
           };

           // Reset weekly reward on Monday (1)
           if (now.getDay() === 1) {
             updates.weeklyRewardClaimed = false;
           }

           return updates;
        }
        return state;
      }),

      claimWeeklyReward: () => {
        set((state) => {
          if (state.weeklyRewardClaimed) return state;
          return {
            gems: state.gems + 100, // Reward: 100 Gems
            weeklyRewardClaimed: true
          };
        });
        get().triggerReward('gem', 5); // Trigger 5 gem particles
      },

      rewardAnimationQueue: [],
      triggerReward: (type: 'xp' | 'gem', count: number) => set((state: UserState) => ({ 
        rewardAnimationQueue: [...state.rewardAnimationQueue, { 
          id: Math.random().toString(36).substring(7) + Date.now(), 
          type, 
          count 
        }]
      })),
      clearRewardAnimationQueue: () => set({ rewardAnimationQueue: [] }),

      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      setRole: (role: 'mahasiswa' | 'asdos' | 'dosen') => set({ role }), // NEW: Set role implementation
      setSemester: (semester: number) => set({ semester }),
      requestEnrollment: (courseId: string) => set((state: UserState) => {
        if (state.enrolledCourseIds.includes(courseId) || state.pendingCourseIds.includes(courseId)) {
          return state;
        }
        return { pendingCourseIds: [...state.pendingCourseIds, courseId] };
      }),
      acceptEnrollment: (courseId: string) => set((state: UserState) => {
        return {
          pendingCourseIds: state.pendingCourseIds.filter((id: string) => id !== courseId),
          enrolledCourseIds: [...state.enrolledCourseIds, courseId]
        };
      }),
      rejectEnrollment: (courseId: string) => set((state: UserState) => ({
        pendingCourseIds: state.pendingCourseIds.filter((id: string) => id !== courseId)
      })),
      unlockAchievement: (id: string) => set((state: UserState) => {
        const current = state.unlockedAchievements || [];
        if (current.includes(id)) return state;
        return { unlockedAchievements: [...current, id] };
      }),
      
      addXp: (amount: number) => {
        set((state: UserState) => {
          // 1. Cek Multiplier
          const now = Date.now();
          const isMultiplierActive = state.multiplierEndTime && now < state.multiplierEndTime;
          const currentMultiplier = isMultiplierActive ? state.xpMultiplier : 1;
          
          // 2. Hitung Total XP Baru
          const finalXpAmount = amount * currentMultiplier;
          const newTotalXp = state.xp + finalXpAmount;
          
          // 3. Update Progress Daily Goal (Tipe XP)
          const updatedGoals = state.dailyGoals.map((goal: DailyGoal) => {
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
        });
        get().triggerReward('xp', 5);
      },

      setActiveCourse: (courseId: string) => set((state: UserState) => ({
        activeCourseId: courseId,
        courseAccessHistory: {
          ...(state.courseAccessHistory || {}),
          [courseId]: new Date().toISOString()
        }
      })),
      
      resetProgress: () => set({ completedLessonIds: ['fe-basic-1'] }),

      completeLesson: (lessonId?: string) => {
        let earnedXp = 0;
        let earnedGems = 0;

        set((state: UserState) => {
          const updatedGoals = state.dailyGoals.map((goal: DailyGoal) => {
            if (goal.type === 'lesson') {
              const newCurrent = Math.min(goal.current + 1, goal.target);
              return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
            }
            return goal;
          });

          const isNew = lessonId && !state.completedLessonIds.includes(lessonId);
          const updatedLessonIds = isNew
            ? [...state.completedLessonIds, lessonId!]
            : state.completedLessonIds;

          earnedXp = isNew ? 50 : 0;
          earnedGems = isNew ? 10 : 0;

          // Catat aktivitas untuk Heatmap
           let newHistory = [...state.activityHistory];
           if (isNew) {
              const today = formatLocalDate(new Date());
              const todayIndex = newHistory.findIndex((h: { date: string, count: number }) => h.date === today);
              if (todayIndex !== -1) {
                 newHistory[todayIndex] = { ...newHistory[todayIndex], count: newHistory[todayIndex].count + 1 };
              } else {
                 newHistory.push({ date: today, count: 1 });
              }
           }

          // Cek Secret Achievements berdasarkan waktu pengerjaan
          let newAchievements = [...(state.unlockedAchievements || [])];
          let newNocturnalCount = state.nocturnalCount || 0;
          let newEarlyBirdCount = state.earlyBirdCount || 0;

          if (isNew) {
             const hour = new Date().getHours();
             if (hour >= 0 && hour < 5) {
                newNocturnalCount++;
                if (!newAchievements.includes('nocturnal')) newAchievements.push('nocturnal');
             }
             if (hour >= 6 && hour <= 9) {
                newEarlyBirdCount++;
                if (!newAchievements.includes('early-bird')) newAchievements.push('early-bird');
             }
          }

          const newLongestStreak = Math.max(state.longestStreak || 0, state.streak);
          
          let newMostXpInDay = state.mostXpInDay || 0;
          if (isNew) {
              const today = formatLocalDate(new Date());
              const todayHistory = newHistory.find(h => h.date === today);
              if (todayHistory) {
                  const estimatedTodayXp = todayHistory.count * 100;
                  newMostXpInDay = Math.max(newMostXpInDay, estimatedTodayXp);
              }
          }

          const activeCourse = state.activeCourseId;
          const newCourseAccess = { ...(state.courseAccessHistory || {}) };
          if (activeCourse) {
             newCourseAccess[activeCourse] = new Date().toISOString();
          }

          return { 
            dailyGoals: updatedGoals, 
            completedLessonIds: updatedLessonIds, 
            gems: state.gems + earnedGems,
            activityHistory: newHistory,
            courseAccessHistory: newCourseAccess,
            unlockedAchievements: newAchievements,
            nocturnalCount: newNocturnalCount,
            earlyBirdCount: newEarlyBirdCount,
            longestStreak: newLongestStreak,
            mostXpInDay: newMostXpInDay
          };
        });

        if (earnedXp > 0) get().addXp(earnedXp); // This handles XP goal, Level up, and XP animation
        if (earnedGems > 0) get().triggerReward('gem', 5);
      },

      claimGoalReward: (goalId: string) => {
        let rewardType: 'xp' | 'gem' | 'multiplier' | undefined;
        let rewardValue = 0;
        
        set((state: UserState) => {
          const goalIndex = state.dailyGoals.findIndex((g: DailyGoal) => g.id === goalId);
          if (goalIndex === -1) return state;

          const goal = state.dailyGoals[goalIndex];
          if (!goal.isCompleted || goal.isClaimed) return state;

          rewardType = goal.rewardType;
          rewardValue = goal.rewardValue;
          const updatedGoals = [...state.dailyGoals];
          updatedGoals[goalIndex] = { ...goal, isClaimed: true };

          let newState: Partial<UserState> = { dailyGoals: updatedGoals };

          if (goal.rewardType === 'gem') {
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

          return newState;
        });

        if (rewardType === 'gem') get().triggerReward('gem', 8);
        if (rewardType === 'xp') {
          // addXp will trigger the XP animation automatically
          get().addXp(rewardValue);
        }
      },

      buyItem: (type: 'freeze' | 'multiplier' | 'shield-3x', cost: number) => {
        const state = get();
        if (state.gems < cost) return false;

        const newPurchase = {
          id: Math.random().toString(36).substring(7) + Date.now(),
          type,
          cost,
          date: new Date().toISOString(),
          itemName: type === 'freeze' ? 'Streak Freeze' : 
                   type === 'multiplier' ? 'XP Booster (1 Jam)' : 'Paket Shield (3x)'
        };

        if (type === 'freeze') {
           const currentCount = state.streakFreezeCount || 0;
           if (currentCount >= 3) return false; // Maksimal 3
           set({ 
             gems: state.gems - cost, 
             streakFreezeCount: currentCount + 1,
             purchaseHistory: [newPurchase, ...(state.purchaseHistory || [])].slice(0, 50)
           });
        } else if (type === 'multiplier') {
           const durationMs = 60 * 60 * 1000; // 1 Jam
           const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() 
              ? state.multiplierEndTime 
              : Date.now();
           set({ 
             gems: state.gems - cost, 
             xpMultiplier: 2, 
             multiplierEndTime: currentEndTime + durationMs,
             purchaseHistory: [newPurchase, ...(state.purchaseHistory || [])].slice(0, 50)
           });
        } else if (type === 'shield-3x') {
           const currentCount = state.streakFreezeCount || 0;
           const amountToAdd = Math.min(3, 3 - currentCount);
           if (amountToAdd <= 0) return false;
           set({ 
             gems: state.gems - cost, 
             streakFreezeCount: currentCount + amountToAdd,
             purchaseHistory: [newPurchase, ...(state.purchaseHistory || [])].slice(0, 50)
           });
        }
        return true;
      },
    }),
    {
      name: 'itsdojo-user-store',
      partialize: (state: UserState) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rewardAnimationQueue, ...rest } = state;
        return rest as any;
      }
    }
  )
);