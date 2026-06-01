import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatLocalDate } from './utils';
import { z } from 'zod';

const GamificationSchema = z.object({
  activityHistory: z.array(z.any()).optional(),
  earnedBadges: z.array(z.any()).optional(),
  unlockedAchievements: z.array(z.string()).optional(),
  bookmarkedCourseIds: z.array(z.string()).optional(),
  dailyGoals: z.array(z.any()).optional(),
  purchaseHistory: z.array(z.any()).optional(),
  streakFreezeCount: z.number().optional(),
  hasGemMiner: z.boolean().optional(),
  hasXpBoost: z.boolean().optional(),
  xpMultiplier: z.number().optional(),
  multiplierEndTime: z.number().nullable().optional(),
  courseAccessHistory: z.any().optional(),
  perfectWeeksCount: z.number().optional(),
  nocturnalCount: z.number().optional(),
  earlyBirdCount: z.number().optional(),
  longestStreak: z.number().optional(),
  mostXpInDay: z.number().optional(),
  totalPerfectLessons: z.number().optional(),
  claimedMonthlyMilestones: z.array(z.number()).optional(),
  monthlyCompletedGoals: z.number().optional(),
  lastUpdated: z.number().optional(),
  bio: z.string().optional(),
});

const parseGamificationData = (data: any) => {
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  if (!parsedData || typeof parsedData !== 'object') return {};
  
  // Kita bypass strict Zod validation untuk data dari DB 
  // agar tidak mereset seluruh progress pengguna jika ada field yang missmatch tipe datanya.
  return parsedData;
};

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
  lastProgressUpdate?: number;
  // 1. Profile & Account
  isLoggedIn: boolean;
  id: string; // user id (matches users.id di DB)
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
  loginAsUser: (data: {
    id: string;
    name: string;
    email: string;
    role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin';
    semester: number;
    level: number;
    xp: number;
    profileXp: number;
    gems: number;
    accuracy: number;
    streak: number;
    avatar: string | null;
    enrolledCourseIds: string[];
    completedLessonIds?: string[];
    gamificationData?: any;
  }) => void;
  syncFromServer: (data: {
    level: number;
    profileXp: number;
    gems: number;
    streak: number;
    accuracy: number;
    completedLessonIds?: string[];
    gamificationData?: any;
    enrolledCourseIds?: string[];
    avatar?: string | null;
  }) => void;
  logout: () => void;
  updateProfile: (data: { name?: string, email?: string, bio?: string, avatarUrl?: string | null }) => void;
  addGems: (amount: number) => void;
  setRole: (role: 'mahasiswa' | 'asdos' | 'dosen' | 'admin') => void;
  setSemester: (semester: number) => void;

  // 2. Progress & Learning
  xp: number; 
  weeklyXp: number; // NEW: Weekly XP for competitive leaderboard
  xpToNextLevel: number;
  accuracy: number;
  streak: number;
  activeCourseId: string;
  enrolledCourseIds: string[];
  pendingCourseIds: string[];
  rejectedCourseIds: string[];
  acceptedCourseIds: string[];
  courseAccessHistory: Record<string, string>;
  completedLessonIds: string[]; 
  activityHistory: { date: string, count: number, xpEarned: number, freezeUsed?: boolean }[];
  earnedBadges: { id: string, name: string, date: string, tier: string }[];
  unlockedAchievements: string[];
  perfectWeeksCount: number;
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
  completeLesson: (lessonId?: string, isPerfect?: boolean, xpReward?: number, gemReward?: number) => void;
  setActiveCourse: (courseId: string) => void;
  requestEnrollment: (courseId: string) => void;
  acceptEnrollment: (courseId: string) => void;
  rejectEnrollment: (courseId: string) => void;
  clearAllRejectedCourses: () => void;
  clearAllAcceptedCourses: () => void;
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
  monthlyCompletedGoals: number; // NEW: Progressive monthly goals
  claimedMonthlyMilestones: number[]; // NEW: Monthly challenge reward tracking
  weeklyActiveDays: number; // NEW: Progressive weekly active days
  claimedWeeklyMilestones: number[]; // NEW: Claimed milestones (e.g. [3, 5, 7])
  followingCount: number; // NEW: Social stats
  followersCount: number; // NEW: Social stats
  checkDailyReset: () => void;
  claimWeeklyMilestone: (milestone: number) => void;
  claimMonthlyMilestone: (milestone: number, reward: number, tier: string) => void; // NEW: Method to claim monthly reward
  claimGoalReward: (goalId: string) => void;

  // 5. UI State & Animations
  isLevelUpModalOpen: boolean;
  levelUpData: { oldLevel: number; newLevel: number; gemsGained: number } | null;
  rewardAnimationQueue: { id: string, type: 'xp' | 'gem', count: number }[];
  closeLevelUpModal: () => void;
  triggerReward: (type: 'xp' | 'gem', count: number) => void;
  clearRewardAnimationQueue: () => void;
  forceSyncProgress: () => void;
}

// --- CONSOLIDATED STORE ---

export const useUserStore = create<UserState>()(
  persist<UserState>(
    (set, get) => ({
      // --- INITIAL STATE ---
      lastProgressUpdate: 0,
      isLoggedIn: false,
      id: '',
      name: "Daryl",
      email: "daryl@student.its.ac.id",
      bio: "Belajar coding itu seru! 🚀",
      avatarUrl: null,
      gems: 300,
      level: 1,
      role: 'admin', 
      semester: 5,
      createdAt: new Date().toISOString(),
      followingCount: 120,
      followersCount: 85,
      
      xp: 0,
      weeklyXp: 0,
      xpToNextLevel: 100,
      streak: 3,
      activeCourseId: "fe-basic",
      enrolledCourseIds: ['fe-basic'],
      pendingCourseIds: [],
      rejectedCourseIds: [],
      acceptedCourseIds: [],
      courseAccessHistory: { 'fe-basic': new Date().toISOString() },
      completedLessonIds: ['fe-basic-1'],
      activityHistory: [],
      earnedBadges: [],
      unlockedAchievements: [],
      nocturnalCount: 0,
      earlyBirdCount: 0,
      longestStreak: 3,
      mostXpInDay: 0,
      totalPerfectLessons: 0,
      weeklyActiveDays: 0,
      perfectWeeksCount: 0,
      claimedWeeklyMilestones: [],
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
      monthlyCompletedGoals: 0,
      claimedMonthlyMilestones: [],
      accuracy: 0,

      isLevelUpModalOpen: false,
      levelUpData: null,
      rewardAnimationQueue: [],

      // --- ACTIONS: AUTH & INIT ---
      login: () => set({ isLoggedIn: true }),
      loginAsUser: (data) => {
        let calculatedXpToNextLevel = 100;
        for (let i = 1; i < data.level; i++) {
          calculatedXpToNextLevel = Math.floor(calculatedXpToNextLevel * 1.5);
        }

        const gData = parseGamificationData(data.gamificationData);

        set({
          isLoggedIn: true,
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          semester: data.semester,
          level: data.level,
          xp: data.profileXp,
          xpToNextLevel: calculatedXpToNextLevel,
          accuracy: data.accuracy as any,
          streak: data.streak,
          gems: data.gems,
          lastProgressUpdate: gData.lastUpdated || Date.now(),
          avatarUrl: data.avatar || null,
          enrolledCourseIds: data.enrolledCourseIds || [],
          weeklyXp: 0,
          bio: gData.bio || '',
          pendingCourseIds: [],
          rejectedCourseIds: [],
          acceptedCourseIds: [],
          completedLessonIds: data.completedLessonIds || [],
          activityHistory: gData.activityHistory || [],
          earnedBadges: gData.earnedBadges || [],
          unlockedAchievements: gData.unlockedAchievements || [],
          bookmarkedCourseIds: gData.bookmarkedCourseIds || [],
          dailyGoals: gData.dailyGoals || INITIAL_GOALS,
          purchaseHistory: gData.purchaseHistory || [],
          streakFreezeCount: gData.streakFreezeCount || 0,
          hasGemMiner: gData.hasGemMiner || false,
          hasXpBoost: gData.hasXpBoost || false,
          xpMultiplier: gData.xpMultiplier || 1,
          multiplierEndTime: gData.multiplierEndTime || null,
          courseAccessHistory: gData.courseAccessHistory || {},
          perfectWeeksCount: gData.perfectWeeksCount || 0,
          nocturnalCount: gData.nocturnalCount || 0,
          earlyBirdCount: gData.earlyBirdCount || 0,
          longestStreak: gData.longestStreak || 0,
          mostXpInDay: gData.mostXpInDay || 0,
          totalPerfectLessons: gData.totalPerfectLessons || 0,
          claimedMonthlyMilestones: gData.claimedMonthlyMilestones || [],
          monthlyCompletedGoals: gData.monthlyCompletedGoals || 0,
        } as any);
      },
      syncFromServer: (data) => {
        const state = get();
        const gData = data.gamificationData ? parseGamificationData(data.gamificationData) : null;
        const serverLastUpdated = gData?.lastUpdated || 0;
        const localLastUpdated = state.lastProgressUpdate || 0;
        
        if (localLastUpdated > serverLastUpdated) {
          get().forceSyncProgress();
          return;
        }

        let calculatedXpToNextLevel = 100;
        for (let i = 1; i < data.level; i++) {
          calculatedXpToNextLevel = Math.floor(calculatedXpToNextLevel * 1.5);
        }
        
        set((state) => ({
          ...state,
          lastProgressUpdate: serverLastUpdated,
          level: data.level,
          xp: data.profileXp,
          xpToNextLevel: calculatedXpToNextLevel,
          gems: data.gems,
          streak: data.streak,
          accuracy: data.accuracy,
          ...(data.avatar !== undefined ? { avatarUrl: data.avatar } : {}),
          completedLessonIds: data.completedLessonIds || state.completedLessonIds || [],
          ...(data.enrolledCourseIds ? { enrolledCourseIds: data.enrolledCourseIds } : {}),
          ...(gData ? {
            bio: gData.bio !== undefined ? gData.bio : state.bio,
            activityHistory: gData.activityHistory || [],
            earnedBadges: gData.earnedBadges || [],
            unlockedAchievements: gData.unlockedAchievements || [],
            bookmarkedCourseIds: gData.bookmarkedCourseIds || [],
            dailyGoals: gData.dailyGoals || INITIAL_GOALS,
            purchaseHistory: gData.purchaseHistory || [],
            streakFreezeCount: gData.streakFreezeCount || 0,
            hasGemMiner: gData.hasGemMiner || false,
            hasXpBoost: gData.hasXpBoost || false,
            xpMultiplier: gData.xpMultiplier || 1,
            multiplierEndTime: gData.multiplierEndTime || null,
            courseAccessHistory: gData.courseAccessHistory || {},
            perfectWeeksCount: gData.perfectWeeksCount || 0,
            nocturnalCount: gData.nocturnalCount || 0,
            earlyBirdCount: gData.earlyBirdCount || 0,
            longestStreak: gData.longestStreak || 0,
            mostXpInDay: gData.mostXpInDay || 0,
            totalPerfectLessons: gData.totalPerfectLessons || 0,
            claimedMonthlyMilestones: gData.claimedMonthlyMilestones || [],
            monthlyCompletedGoals: gData.monthlyCompletedGoals || 0,
          } : {})
        } as any));
      },
      logout: () => {
        set({
          isLoggedIn: false,
          name: '',
          email: '',
          bio: '',
          avatarUrl: null,
          gems: 0,
          level: 1,
          role: 'mahasiswa',
          semester: 1,
          xp: 0,
          xpToNextLevel: 100,
          accuracy: 0,
          weeklyXp: 0,
          streak: 0,
          enrolledCourseIds: [],
          pendingCourseIds: [],
          rejectedCourseIds: [],
          acceptedCourseIds: [],
          completedLessonIds: [],
          activityHistory: [],
          earnedBadges: [],
          unlockedAchievements: [],
          bookmarkedCourseIds: [],
        } as any);
      },
      updateProfile: (data) => {
        set((state) => ({ ...state, ...data, lastProgressUpdate: Date.now() }));
        get().forceSyncProgress(); // Instantly sync profile changes (bio, name, avatar)
      },
      addGems: (amount: number) => set((state) => ({ gems: state.gems + amount, lastProgressUpdate: Date.now() })),
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
          const newWeeklyXp = (state.weeklyXp || 0) + finalXpAmount;
          
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
            lastProgressUpdate: Date.now(),
            xp: newTotalXp, weeklyXp: newWeeklyXp, level: currentLevel, xpToNextLevel: currentTarget,
            dailyGoals: updatedGoals, gems: finalGems, isLevelUpModalOpen: isModalOpen,
            levelUpData: levelUpInfo, activityHistory: updatedHistory, mostXpInDay: newMostXpInDay
          };
        });
        get().triggerReward('xp', 5);
        get().forceSyncProgress();
      },

      completeLesson: (lessonId, isPerfect, xpReward, gemReward) => {
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
          
          // XP penuh untuk pelajaran baru, XP latihan (10) untuk pengulangan
          earnedXp = isNew ? (xpReward || 50) : 10;
          const baseGems = gemReward || 10;
          earnedGems = isNew ? (state.hasGemMiner ? baseGems * 2 : baseGems) : 0;

          let newHistory = [...state.activityHistory];
          let newStreak = state.streak;
          let newLastActiveDate = state.lastActiveDate;

          // ACTIVITY & STREAK DIHITUNG MESKIPUN BUKAN PELAJARAN BARU (PRACTICE)
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
            
            // Increment weekly active days and check for perfect week
            set((s) => {
              const nextActiveDays = s.weeklyActiveDays + 1;
              const nextPerfectWeeks = nextActiveDays === 7 ? s.perfectWeeksCount + 1 : s.perfectWeeksCount;
              return {
                weeklyActiveDays: nextActiveDays,
                perfectWeeksCount: nextPerfectWeeks
              };
            });
          }

          let newAchievements = [...(state.unlockedAchievements || [])];
          let newNocturnalCount = state.nocturnalCount || 0;
          let newEarlyBirdCount = state.earlyBirdCount || 0;

          const hour = new Date().getHours();
          if (hour >= 0 && hour < 5) {
            newNocturnalCount++;
            if (!newAchievements.includes('nocturnal')) newAchievements.push('nocturnal');
          }
          if (hour >= 6 && hour <= 9) {
            newEarlyBirdCount++;
            if (!newAchievements.includes('early-bird')) newAchievements.push('early-bird');
          }

          const activeCourse = state.activeCourseId;
          const newCourseAccess = { ...(state.courseAccessHistory || {}) };
          if (activeCourse) newCourseAccess[activeCourse] = new Date().toISOString();

          return { 
            lastProgressUpdate: Date.now(),
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
      
      acceptEnrollment: (courseId) => set((state) => {
        const alreadyAccepted = state.acceptedCourseIds?.includes(courseId) || false;
        return {
          pendingCourseIds: state.pendingCourseIds.filter((id) => id !== courseId),
          enrolledCourseIds: [...state.enrolledCourseIds, courseId],
          acceptedCourseIds: alreadyAccepted ? state.acceptedCourseIds : [...(state.acceptedCourseIds || []), courseId]
        };
      }),
      
      rejectEnrollment: (courseId) => set((state) => {
        const alreadyRejected = state.rejectedCourseIds?.includes(courseId) || false;
        return {
          pendingCourseIds: state.pendingCourseIds.filter((id) => id !== courseId),
          rejectedCourseIds: alreadyRejected ? state.rejectedCourseIds : [...(state.rejectedCourseIds || []), courseId]
        };
      }),

      clearAllRejectedCourses: () => set({
        rejectedCourseIds: []
      }),

      clearAllAcceptedCourses: () => set({
        acceptedCourseIds: []
      }),
      
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
          
          // Robust weekly reset check
          const lastResetDate = new Date(state.lastDailyReset);
          const diffDays = Math.floor((now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24));
          const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
          const lastResetDayOfWeek = lastResetDate.getDay() === 0 ? 7 : lastResetDate.getDay();
          
          if (diffDays >= 7 || currentDayOfWeek < lastResetDayOfWeek) {
            updates.weeklyActiveDays = 0;
            updates.claimedWeeklyMilestones = [];
            updates.weeklyXp = 0;
          }

          // Reset monthly reward if the month has changed
          const lastResetDateObj = new Date(state.lastDailyReset);
          if (lastResetDateObj.getMonth() !== now.getMonth() || lastResetDateObj.getFullYear() !== now.getFullYear()) {
            updates.monthlyCompletedGoals = 0;
            updates.claimedMonthlyMilestones = [];
          }

          let newStreakFreezeCount = state.streakFreezeCount;
          let newStreak = state.streak;
          let newActivityHistory = [...state.activityHistory];
          let updatedStreakOrFreeze = false;

          if (state.lastActiveDate) {
             const lastActiveObj = new Date(state.lastActiveDate);
             lastActiveObj.setHours(0,0,0,0);
             const todayObj = new Date(now);
             todayObj.setHours(0,0,0,0);
             
             const diffTime = todayObj.getTime() - lastActiveObj.getTime();
             const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
             const missedDays = Math.max(0, diffDays - 1);

             if (missedDays > 0 && newStreak > 0) {
               updatedStreakOrFreeze = true;
               for (let i = 1; i <= missedDays; i++) {
                 if (newStreakFreezeCount > 0) {
                   newStreakFreezeCount--;
                   const missedDate = new Date(state.lastActiveDate);
                   missedDate.setDate(missedDate.getDate() + i);
                   newActivityHistory.push({
                     date: formatLocalDate(missedDate),
                     count: 0,
                     xpEarned: 0,
                     freezeUsed: true
                   });
                 } else {
                   newStreak = 0;
                   break;
                 }
               }
               // Jika freeze berhasil menutupi semua hari bolong, update lastActiveDate ke kemarin
               // agar saat mengerjakan hari ini streak dilanjutkan, bukan direset.
               if (newStreak > 0) {
                 const yesterday = new Date(now);
                 yesterday.setDate(yesterday.getDate() - 1);
                 updates.lastActiveDate = formatLocalDate(yesterday);
               }
             }
          }
          
          if (updatedStreakOrFreeze) {
             updates.streakFreezeCount = newStreakFreezeCount;
             updates.streak = newStreak;
             updates.activityHistory = newActivityHistory;
          }

          return updates;
        }
        return state;
      }),

      claimWeeklyMilestone: (milestone: number) => {
        const state = get();
        if (state.claimedWeeklyMilestones.includes(milestone)) return;
        if (state.weeklyActiveDays < milestone) return;

        let reward = 50;
        if (milestone === 5) reward = 100;
        else if (milestone === 7) reward = 200;

        set((s) => ({ 
          gems: s.gems + reward, 
          claimedWeeklyMilestones: [...s.claimedWeeklyMilestones, milestone] 
        }));
        get().triggerReward('gem', Math.min(reward / 10, 25)); // Visual feedback
      },

      claimMonthlyMilestone: (milestone, reward, tier) => {
        const state = get();
        if (state.claimedMonthlyMilestones.includes(milestone)) return;
        if (state.monthlyCompletedGoals < milestone) return;

        let newEarnedBadges = [...state.earnedBadges];
        // Hanya dapat badge jika menyelesaikan milestone terakhir (45)
        if (milestone === 45) {
          const newBadge = {
             id: `badge-${tier}-${Date.now()}`,
             name: `Pejuang ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
             date: new Date().toISOString(),
             tier: tier
          };
          newEarnedBadges.push(newBadge);
        }

        set((s) => ({ 
          gems: s.gems + reward, 
          claimedMonthlyMilestones: [...s.claimedMonthlyMilestones, milestone],
          earnedBadges: newEarnedBadges
        }));
        get().triggerReward('gem', Math.min(reward / 10, 25));
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

          const newState: any = { 
            lastProgressUpdate: Date.now(),
            dailyGoals: updatedGoals,
            monthlyCompletedGoals: state.monthlyCompletedGoals + 1
          };
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
        
        // Panggil immediate sync!
        get().forceSyncProgress();
      },

      closeLevelUpModal: () => set({ isLevelUpModalOpen: false, levelUpData: null }),
      triggerReward: (type, count) => set((state) => ({ 
        rewardAnimationQueue: [...state.rewardAnimationQueue, { id: Math.random().toString(36).substring(7) + Date.now(), type, count }]
      })),
      clearRewardAnimationQueue: () => set({ rewardAnimationQueue: [] }),

      forceSyncProgress: () => {
        const state = get();
        if (!state.isLoggedIn || !state.id) return;

        const gamificationData = {
          activityHistory: state.activityHistory,
          earnedBadges: state.earnedBadges,
          unlockedAchievements: state.unlockedAchievements,
          dailyGoals: state.dailyGoals,
          purchaseHistory: state.purchaseHistory,
          streakFreezeCount: state.streakFreezeCount,
          hasGemMiner: state.hasGemMiner,
          xpMultiplier: state.xpMultiplier,
          multiplierEndTime: state.multiplierEndTime,
          courseAccessHistory: state.courseAccessHistory,
          perfectWeeksCount: state.perfectWeeksCount,
          nocturnalCount: state.nocturnalCount,
          earlyBirdCount: state.earlyBirdCount,
          longestStreak: state.longestStreak,
          mostXpInDay: state.mostXpInDay,
          totalPerfectLessons: state.totalPerfectLessons,
          claimedMonthlyMilestones: state.claimedMonthlyMilestones,
          monthlyCompletedGoals: state.monthlyCompletedGoals,
          bookmarkedCourseIds: state.bookmarkedCourseIds,
          bio: state.bio,
          lastUpdated: state.lastProgressUpdate || Date.now()
        };

        fetch('/api/user/sync-progress', {
          method: 'POST',
          keepalive: true, // IMPORTANT: Ensure request completes even if tab closes / refreshes
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.name,
            avatar: state.avatarUrl,
            xp: state.weeklyXp,
            profileXp: state.xp,
            gems: state.gems,
            streak: state.streak,
            level: state.level,
            accuracy: state.accuracy,
            completedLessonIds: state.completedLessonIds,
            gamificationData
          })
        }).catch(err => console.error("Gagal melakukan immediate sync progress:", err));
      },
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

if (typeof window !== 'undefined') {
  let syncTimeout: any = null;
  useUserStore.subscribe((state, prevState) => {
    if (!state.isLoggedIn || !state.id) return;
    
    // Cek apakah ada field krusial yang berubah
    const extendedDataChanged = 
      state.activityHistory !== prevState.activityHistory ||
      state.earnedBadges !== prevState.earnedBadges ||
      state.unlockedAchievements !== prevState.unlockedAchievements ||
      state.dailyGoals !== prevState.dailyGoals ||
      state.purchaseHistory !== prevState.purchaseHistory ||
      state.streakFreezeCount !== prevState.streakFreezeCount ||
      state.hasGemMiner !== prevState.hasGemMiner ||
      state.xpMultiplier !== prevState.xpMultiplier ||
      state.multiplierEndTime !== prevState.multiplierEndTime ||
      state.courseAccessHistory !== prevState.courseAccessHistory ||
      state.perfectWeeksCount !== prevState.perfectWeeksCount ||
      state.nocturnalCount !== prevState.nocturnalCount ||
      state.earlyBirdCount !== prevState.earlyBirdCount ||
      state.longestStreak !== prevState.longestStreak ||
      state.mostXpInDay !== prevState.mostXpInDay ||
      state.totalPerfectLessons !== prevState.totalPerfectLessons ||
      state.claimedMonthlyMilestones !== prevState.claimedMonthlyMilestones ||
      state.monthlyCompletedGoals !== prevState.monthlyCompletedGoals ||
      state.bookmarkedCourseIds !== prevState.bookmarkedCourseIds;

    const changed = 
      state.xp !== prevState.xp ||
      state.gems !== prevState.gems ||
      state.streak !== prevState.streak ||
      state.level !== prevState.level ||
      state.accuracy !== prevState.accuracy ||
      state.completedLessonIds.length !== prevState.completedLessonIds.length ||
      extendedDataChanged;

    if (changed && state.isLoggedIn) {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        const gamificationData = {
          activityHistory: state.activityHistory,
          earnedBadges: state.earnedBadges,
          unlockedAchievements: state.unlockedAchievements,
          dailyGoals: state.dailyGoals,
          purchaseHistory: state.purchaseHistory,
          streakFreezeCount: state.streakFreezeCount,
          hasGemMiner: state.hasGemMiner,
          xpMultiplier: state.xpMultiplier,
          multiplierEndTime: state.multiplierEndTime,
          courseAccessHistory: state.courseAccessHistory,
          perfectWeeksCount: state.perfectWeeksCount,
          nocturnalCount: state.nocturnalCount,
          earlyBirdCount: state.earlyBirdCount,
          longestStreak: state.longestStreak,
          mostXpInDay: state.mostXpInDay,
          totalPerfectLessons: state.totalPerfectLessons,
          claimedMonthlyMilestones: state.claimedMonthlyMilestones,
          monthlyCompletedGoals: state.monthlyCompletedGoals,
          bookmarkedCourseIds: state.bookmarkedCourseIds,
        };

        fetch('/api/user/sync-progress', {
          method: 'POST',
          keepalive: true, // IMPORTANT: Ensure request completes even if tab closes / refreshes
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xp: state.weeklyXp, // Mengirim XP Leaderboard ke kolom xp DB (jika backend mendukung update via body)
            profileXp: state.xp, // Di client, state.xp adalah profileXp di DB
            gems: state.gems,
            streak: state.streak,
            level: state.level,
            accuracy: state.accuracy,
            completedLessonIds: state.completedLessonIds,
            name: state.name,
            avatar: state.avatarUrl,
            gamificationData: {
              ...gamificationData,
              bio: state.bio,
              lastUpdated: state.lastProgressUpdate || Date.now()
            }
          })
        }).catch(err => console.error("Gagal melakukan sync progress:", err));
      }, 500); // Turunkan debounce ke 500ms agar lebih responsif
    }
  });
}
