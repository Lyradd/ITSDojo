import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatLocalDate } from './utils';

// --- SHARED TYPES ---

export type DailyGoal = {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'xp' | 'lesson' | 'streak' | 'perfect';
  isCompleted: boolean;
  isClaimed: boolean; 
  rewardType: 'xp' | 'gem' | 'multiplier';
  rewardValue: number;
};

const INITIAL_GOALS: DailyGoal[] = [
  { 
    id: 'xp-goal', title: 'Raih 50 XP', target: 50, current: 0, type: 'xp', 
    isCompleted: false, isClaimed: false, rewardType: 'gem', rewardValue: 20 
  },
  { 
    id: 'lesson-goal', title: 'Selesaikan 1 Pelajaran', target: 1, current: 0, type: 'lesson', 
    isCompleted: false, isClaimed: false, rewardType: 'multiplier', rewardValue: 15
  },
  { 
    id: 'perfect-goal', title: 'Dapatkan 1 Perfect Lesson', target: 1, current: 0, type: 'perfect', 
    isCompleted: false, isClaimed: false, rewardType: 'gem', rewardValue: 30 
  },
];

// --- STORE INTERFACE ---

export interface UserState {
  // 1. Profile & Account
  isLoggedIn: boolean;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  gems: number;
  level: number;
  role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin'; 
  semester: number;
  createdAt: string;
  login: () => void;
  logout: () => void;
  updateProfile: (data: { name?: string, bio?: string, avatarUrl?: string | null }) => void;
  addGems: (amount: number) => void;
  setRole: (role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin') => void;
  setSemester: (semester: number) => void;

  // 2. Progress & Learning
  xp: number; 
  xpToNextLevel: number;
  streak: number;
  activeCourseId: string;
  enrolledCourseIds: string[];
  pendingCourseIds: string[];
  courseAccessHistory: Record<string, string>;
  completedLessonIds: string[]; 
  activityHistory: { date: string, count: number, xpEarned: number }[];
  unlockedAchievements: string[];
  nocturnalCount: number;
  earlyBirdCount: number;
  longestStreak: number;
  mostXpInDay: number;
  totalPerfectLessons: number;
  league: string;
  top3Finishes: number;
  bookmarkedCourseIds: string[];
  xpMultiplier: number;
  multiplierEndTime: number | null;
  
  addXp: (amount: number) => void;
  completeLesson: (lessonId?: string, isPerfect?: boolean) => void;
  setActiveCourse: (courseId: string) => void;
  requestEnrollment: (courseId: string) => void;
  acceptEnrollment: (courseId: string) => void;
  rejectEnrollment: (courseId: string) => void;
  unlockAchievement: (id: string) => void;
  toggleBookmarkCourse: (courseId: string) => void;
  resetProgress: () => void;

  // 3. Shop & Inventory
  streakFreezeCount: number;
  purchaseHistory: { id: string, type: string, cost: number, date: string, itemName: string }[];
  unlockedInventorySlotIds: string[];
  hasGemMiner: boolean;
  hasShieldPack: boolean;
  unlockInventorySlot: (slotId: string, cost: number) => boolean;
  buyItem: (type: 'freeze' | 'multiplier' | 'shield-3x' | 'gem-miner', cost: number) => boolean;
  useShieldPack: () => void;

  // 4. Goals & Daily Logic
  dailyGoals: DailyGoal[];
  lastActiveDate: string;
  lastDailyReset: string;
  weeklyRewardClaimed: boolean;
  monthlyRewardClaimed: boolean; // NEW: Monthly challenge reward tracking
  checkDailyReset: () => void;
  claimWeeklyReward: () => void;
  claimMonthlyReward: () => void; // NEW: Method to claim monthly reward
  claimGoalReward: (goalId: string) => void;

  // 5. UI State & Animations
  isLevelUpModalOpen: boolean;
  levelUpData: { oldLevel: number; newLevel: number; gemsGained: number } | null;
  rewardAnimationQueue: { id: string, type: 'xp' | 'gem', count: number }[];
  closeLevelUpModal: () => void;
  triggerReward: (type: 'xp' | 'gem', count: number) => void;
  clearRewardAnimationQueue: () => void;
}

// --- CONSOLIDATED STORE ---

export const useUserStore = create<UserState>()(
  persist<UserState>(
    (set, get) => ({
      // --- INITIAL STATE ---
      isLoggedIn: false,
      name: "Daryl",
      email: "daryl@student.its.ac.id",
      bio: "Belajar coding itu seru! 🚀",
      avatarUrl: null,
      gems: 300,
      level: 1,
      role: 'admin', 
      semester: 5,
      createdAt: new Date().toISOString(),
      
      xp: 0,
      xpToNextLevel: 100,
      streak: 3,
      activeCourseId: "fe-basic",
      enrolledCourseIds: ['fe-basic'],
      pendingCourseIds: [],
      courseAccessHistory: { 'fe-basic': new Date().toISOString() },
      completedLessonIds: ['fe-basic-1'],
      activityHistory: [],
      unlockedAchievements: [],
      nocturnalCount: 0,
      earlyBirdCount: 0,
      longestStreak: 3,
      mostXpInDay: 0,
      totalPerfectLessons: 0,
      league: "Silver",
      top3Finishes: 0,
      bookmarkedCourseIds: [],
      xpMultiplier: 1,
      multiplierEndTime: null,

      streakFreezeCount: 0,
      purchaseHistory: [],
      unlockedInventorySlotIds: [],
      hasGemMiner: false,
      hasShieldPack: false,

      dailyGoals: INITIAL_GOALS,
      lastActiveDate: formatLocalDate(new Date()),
      lastDailyReset: formatLocalDate(new Date()),
      weeklyRewardClaimed: false,
      monthlyRewardClaimed: false,

      isLevelUpModalOpen: false,
      levelUpData: null,
      rewardAnimationQueue: [],

      // --- ACTIONS: PROFILE ---
      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      addGems: (amount: number) => set((state) => ({ gems: state.gems + amount })),
      setRole: (role) => set({ role }),
      setSemester: (semester) => set({ semester }),

      // --- ACTIONS: PROGRESS ---
      addXp: (amount: number) => {
        set((state) => {
          const now = Date.now();
          const isMultiplierActive = state.multiplierEndTime && now < state.multiplierEndTime;
          const currentMultiplier = isMultiplierActive ? state.xpMultiplier : 1;
          const finalXpAmount = amount * currentMultiplier;
          const newTotalXp = state.xp + finalXpAmount;
          
          const updatedGoals = state.dailyGoals.map((goal) => {
            if (goal.type === 'xp') {
              const newCurrent = Math.min(goal.current + amount, goal.target);
              return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
            }
            return goal;
          });

          let currentLevel = state.level;
          let currentTarget = state.xpToNextLevel;
          let levelsGained = 0;
          while (newTotalXp >= currentTarget) {
            currentLevel++;
            currentTarget = Math.floor(currentTarget * 1.5);
            levelsGained++;
          }

          let finalGems = state.gems;
          let levelUpInfo = state.levelUpData;
          let isModalOpen = state.isLevelUpModalOpen;

          if (levelsGained > 0) {
            const gemReward = levelsGained * 50;
            finalGems += gemReward;
            isModalOpen = true;
            levelUpInfo = { oldLevel: state.level, newLevel: currentLevel, gemsGained: gemReward };
            setTimeout(() => { get().triggerReward('gem', 10); }, 500);
          }

          const today = formatLocalDate(new Date());
          const updatedHistory = [...state.activityHistory];
          const todayIdx = updatedHistory.findIndex((h) => h.date === today);
          if (todayIdx !== -1) {
            updatedHistory[todayIdx] = { ...updatedHistory[todayIdx], xpEarned: (updatedHistory[todayIdx].xpEarned || 0) + finalXpAmount };
          } else {
            updatedHistory.push({ date: today, count: 0, xpEarned: finalXpAmount });
          }

          const todayEntry = updatedHistory.find((h) => h.date === today);
          const newMostXpInDay = Math.max(state.mostXpInDay || 0, todayEntry ? todayEntry.xpEarned : 0);

          return {
            xp: newTotalXp, level: currentLevel, xpToNextLevel: currentTarget,
            dailyGoals: updatedGoals, gems: finalGems, isLevelUpModalOpen: isModalOpen,
            levelUpData: levelUpInfo, activityHistory: updatedHistory, mostXpInDay: newMostXpInDay
          };
        });
        get().triggerReward('xp', 5);
      },

      completeLesson: (lessonId, isPerfect) => {
        let earnedXp = 0;
        let earnedGems = 0;
        set((state) => {
          const updatedGoals = state.dailyGoals.map((goal) => {
            if (goal.type === 'lesson') {
              const newCurrent = Math.min(goal.current + 1, goal.target);
              return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
            }
            if (goal.type === 'perfect' && isPerfect) {
              const newCurrent = Math.min(goal.current + 1, goal.target);
              return { ...goal, current: newCurrent, isCompleted: newCurrent >= goal.target };
            }
            return goal;
          });

          const isNew = lessonId && !state.completedLessonIds.includes(lessonId);
          const updatedLessonIds = isNew ? [...state.completedLessonIds, lessonId!] : state.completedLessonIds;
          earnedXp = isNew ? 50 : 0;
          earnedGems = isNew ? (state.hasGemMiner ? 20 : 10) : 0;

          let newHistory = [...state.activityHistory];
          let newStreak = state.streak;
          let newLastActiveDate = state.lastActiveDate;

          if (isNew) {
            const today = formatLocalDate(new Date());
            const todayIndex = newHistory.findIndex((h) => h.date === today);
            if (todayIndex !== -1) {
              newHistory[todayIndex] = { ...newHistory[todayIndex], count: newHistory[todayIndex].count + 1 };
            } else {
              newHistory.push({ date: today, count: 1, xpEarned: 0 });
            }

            if (newLastActiveDate !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = formatLocalDate(yesterday);
              if (newLastActiveDate === yesterdayStr || newStreak === 0) {
                newStreak += 1;
              } else {
                newStreak = 1;
              }
              newLastActiveDate = today;
            }
          }

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

          const activeCourse = state.activeCourseId;
          const newCourseAccess = { ...(state.courseAccessHistory || {}) };
          if (activeCourse) newCourseAccess[activeCourse] = new Date().toISOString();

          return { 
            dailyGoals: updatedGoals, completedLessonIds: updatedLessonIds, 
            gems: state.gems + earnedGems, activityHistory: newHistory,
            courseAccessHistory: newCourseAccess, unlockedAchievements: newAchievements,
            nocturnalCount: newNocturnalCount, earlyBirdCount: newEarlyBirdCount,
            longestStreak: Math.max(state.longestStreak, newStreak),
            streak: newStreak, lastActiveDate: newLastActiveDate
          };
        });
        if (earnedXp > 0) get().addXp(earnedXp);
        if (earnedGems > 0) get().triggerReward('gem', 5);
      },

      setActiveCourse: (courseId) => set((state) => ({
        activeCourseId: courseId,
        courseAccessHistory: { ...state.courseAccessHistory, [courseId]: new Date().toISOString() }
      })),
      
      requestEnrollment: (courseId) => set((state) => {
        if (state.enrolledCourseIds.includes(courseId) || state.pendingCourseIds.includes(courseId)) return state;
        return { pendingCourseIds: [...state.pendingCourseIds, courseId] };
      }),
      
      acceptEnrollment: (courseId) => set((state) => ({
        pendingCourseIds: state.pendingCourseIds.filter((id) => id !== courseId),
        enrolledCourseIds: [...state.enrolledCourseIds, courseId]
      })),
      
      rejectEnrollment: (courseId) => set((state) => ({
        pendingCourseIds: state.pendingCourseIds.filter((id) => id !== courseId)
      })),
      
      unlockAchievement: (id) => set((state) => {
        if (state.unlockedAchievements.includes(id)) return state;
        return { unlockedAchievements: [...state.unlockedAchievements, id] };
      }),
      
      toggleBookmarkCourse: (courseId) => set((state) => {
        const isBookmarked = state.bookmarkedCourseIds.includes(courseId);
        return {
          bookmarkedCourseIds: isBookmarked ? state.bookmarkedCourseIds.filter(id => id !== courseId) : [...state.bookmarkedCourseIds, courseId]
        };
      }),
      
      resetProgress: () => set({ completedLessonIds: ['fe-basic-1'] }),

      // --- ACTIONS: SHOP ---
      unlockInventorySlot: (slotId, cost) => {
        const state = get();
        if (state.gems < cost) return false;
        if (state.unlockedInventorySlotIds.includes(slotId)) return true;
        set({ gems: state.gems - cost, unlockedInventorySlotIds: [...state.unlockedInventorySlotIds, slotId] });
        return true;
      },
      
      buyItem: (type, cost) => {
        const state = get();
        if (state.gems < cost) return false;

        const newPurchase = {
          id: Math.random().toString(36).substring(7) + Date.now(),
          type, cost, date: new Date().toISOString(),
          itemName: type === "freeze" ? "Streak Freeze" : type === "multiplier" ? "XP Booster (1 Jam)" : type === "shield-3x" ? "Shield Pack" : "Gem Miner (Permanen)"
        };
        const currentHistory = [newPurchase, ...state.purchaseHistory].slice(0, 50);

        if (type === "freeze") {
          if (state.streakFreezeCount >= 3) return false;
          set({ gems: state.gems - cost, streakFreezeCount: state.streakFreezeCount + 1, purchaseHistory: currentHistory });
          return true;
        } else if (type === "multiplier") {
          const durationMs = 60 * 60 * 1000;
          const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() ? state.multiplierEndTime : Date.now();
          set({ gems: state.gems - cost, xpMultiplier: 2, multiplierEndTime: currentEndTime + durationMs, purchaseHistory: currentHistory });
          return true;
        } else if (type === "shield-3x") {
          if (state.hasShieldPack) return false;
          set({ gems: state.gems - cost, hasShieldPack: true, purchaseHistory: currentHistory });
          return true;
        } else if (type === "gem-miner") {
          if (state.hasGemMiner) return false;
          set({ gems: state.gems - cost, hasGemMiner: true, purchaseHistory: currentHistory });
          return true;
        }
        return false;
      },
      
      useShieldPack: () => {
        const state = get();
        if (!state.hasShieldPack) return;
        set({ streakFreezeCount: 3, hasShieldPack: false });
      },

      // --- ACTIONS: GOALS ---
      checkDailyReset: () => set((state) => {
        const now = new Date();
        const today = formatLocalDate(now);
        if (state.lastDailyReset !== today || state.dailyGoals.length !== INITIAL_GOALS.length) {
          const updates: any = { dailyGoals: INITIAL_GOALS, lastDailyReset: today };
          if (now.getDay() === 1) updates.weeklyRewardClaimed = false;

          // Reset monthly reward if the month has changed
          const lastResetDate = new Date(state.lastDailyReset);
          if (lastResetDate.getMonth() !== now.getMonth() || lastResetDate.getFullYear() !== now.getFullYear()) {
            updates.monthlyRewardClaimed = false;
          }

          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = formatLocalDate(yesterday);
          const wasActiveYesterday = state.lastActiveDate === yesterdayStr;
          const wasActiveToday = state.lastActiveDate === today;

          if (!(wasActiveYesterday || wasActiveToday)) {
            if (state.streakFreezeCount > 0) {
              updates.streakFreezeCount = state.streakFreezeCount - 1;
            } else {
              updates.streak = 0;
            }
          }
          return updates;
        }
        return state;
      }),

      claimWeeklyReward: () => {
        if (get().weeklyRewardClaimed) return;
        set((state) => ({ gems: state.gems + 100, weeklyRewardClaimed: true }));
        get().triggerReward('gem', 5);
      },

      claimMonthlyReward: () => {
        if (get().monthlyRewardClaimed) return;
        set((state) => ({ gems: state.gems + 500, monthlyRewardClaimed: true })); // Reward: 500 Gems
        get().triggerReward('gem', 15);
      },

      claimGoalReward: (goalId) => {
        let rewardType: 'xp' | 'gem' | 'multiplier' | undefined;
        let rewardValue = 0;
        set((state) => {
          const goalIndex = state.dailyGoals.findIndex((g) => g.id === goalId);
          if (goalIndex === -1) return state;
          const goal = state.dailyGoals[goalIndex];
          if (!goal.isCompleted || goal.isClaimed) return state;

          rewardType = goal.rewardType;
          rewardValue = goal.rewardValue;
          const updatedGoals = [...state.dailyGoals];
          updatedGoals[goalIndex] = { ...goal, isClaimed: true };

          const newState: any = { dailyGoals: updatedGoals };
          if (goal.rewardType === 'gem') newState.gems = state.gems + goal.rewardValue;
          else if (goal.rewardType === 'multiplier') {
            const durationMs = goal.rewardValue * 60 * 1000; 
            newState.xpMultiplier = 2;
            const currentEndTime = state.multiplierEndTime && state.multiplierEndTime > Date.now() ? state.multiplierEndTime : Date.now();
            newState.multiplierEndTime = currentEndTime + durationMs;
          }
          return newState;
        });
        if (rewardType === 'gem') get().triggerReward('gem', 8);
        if (rewardType === 'xp') {
          get().addXp(rewardValue);
        }
      },

      // --- ACTIONS: UI ---
      closeLevelUpModal: () => set({ isLevelUpModalOpen: false, levelUpData: null }),
      triggerReward: (type, count) => set((state) => ({ 
        rewardAnimationQueue: [...state.rewardAnimationQueue, { id: Math.random().toString(36).substring(7) + Date.now(), type, count }]
      })),
      clearRewardAnimationQueue: () => set({ rewardAnimationQueue: [] }),
    }),
    {
      name: 'itsdojo-user-store',
      partialize: (state) => {
        const { rewardAnimationQueue, ...rest } = state;
        return rest as any;
      }
    }
  )
);
