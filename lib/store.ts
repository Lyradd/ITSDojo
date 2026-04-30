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
  streakFreezeCount: number; // Max 3
  activeCourseId: string;
  role: 'mahasiswa' | 'asdos' | 'dosen'; 
  semester: number; // NEW: Semester mahasiswa
  enrolledCourseIds: string[]; // NEW: Courses they are enrolled in
  pendingCourseIds: string[]; // NEW: Courses waiting for dosen approval
  completedLessonIds: string[]; 
  activityHistory: { date: string, count: number }[];
  unlockedAchievements: string[];
  nocturnalCount: number;
  earlyBirdCount: number;
  longestStreak: number;
  mostXpInDay: number;
  totalPerfectLessons: number;
  unlockAchievement: (id: string) => void;
  
  dailyGoals: DailyGoal[];
  
  xpMultiplier: number;
  multiplierEndTime: number | null;

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  setGems: (amount: number) => void; // NEW: Debug/Temporary method
  resetProgress: () => void; // NEW: Debug/Testing method
  setActiveCourse: (courseId: string) => void;
  completeLesson: (lessonId?: string) => void;
  claimGoalReward: (goalId: string) => void;
  buyItem: (type: 'freeze' | 'multiplier', cost: number) => boolean; // NEW: Shop purchase
  setRole: (role: 'mahasiswa' | 'asdos' | 'dosen') => void; // NEW: Set role method
  setSemester: (semester: number) => void;
  requestEnrollment: (courseId: string) => void;
  acceptEnrollment: (courseId: string) => void;
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
      gems: 300, // Starting Gems
      streakFreezeCount: 0,
      activeCourseId: "fe-basic",
      role: 'mahasiswa', 
      semester: 5, // Default for Daryl
      enrolledCourseIds: ['fe-basic'], // Default tes biar langsung bisa nyoba
      pendingCourseIds: [],
      completedLessonIds: ['fe-basic-1'], // Default tes biar node 1 selesai, node 2 aktif
      activityHistory: [], // Dinamis untuk Heatmap
      unlockedAchievements: [], // Menyimpan ID achievement yang terbuka
      nocturnalCount: 0,
      earlyBirdCount: 0,
      longestStreak: 3,
      mostXpInDay: 0,
      totalPerfectLessons: 0,
      
      dailyGoals: INITIAL_GOALS,
      
      xpMultiplier: 1,
      multiplierEndTime: null,

      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      setGems: (amount) => set({ gems: amount }),
      setRole: (role) => set({ role }), // NEW: Set role implementation
      setSemester: (semester) => set({ semester }),
      requestEnrollment: (courseId) => set((state) => {
        if (state.enrolledCourseIds.includes(courseId) || state.pendingCourseIds.includes(courseId)) {
          return state;
        }
        return { pendingCourseIds: [...state.pendingCourseIds, courseId] };
      }),
      acceptEnrollment: (courseId) => set((state) => {
        return {
          pendingCourseIds: state.pendingCourseIds.filter(id => id !== courseId),
          enrolledCourseIds: [...state.enrolledCourseIds, courseId]
        };
      }),
      unlockAchievement: (id) => set((state) => {
        const current = state.unlockedAchievements || [];
        if (current.includes(id)) return state;
        return { unlockedAchievements: [...current, id] };
      }),
      
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
      
      resetProgress: () => set({ completedLessonIds: ['fe-basic-1'] }),

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

        // Cek Secret Achievements berdasarkan waktu pengerjaan
        let newAchievements = [...(state.unlockedAchievements || [])];
        let newNocturnalCount = state.nocturnalCount || 0;
        let newEarlyBirdCount = state.earlyBirdCount || 0;

        if (lessonId && !(state.completedLessonIds || []).includes(lessonId)) {
           const hour = new Date().getHours();
           
           // Nocturnal (00:00 - 04:59)
           if (hour >= 0 && hour < 5) {
              newNocturnalCount++;
              if (!newAchievements.includes('nocturnal')) newAchievements.push('nocturnal');
           }
           
           // Early Bird (06:00 - 09:00)
           if (hour >= 6 && hour <= 9) {
              newEarlyBirdCount++;
              if (!newAchievements.includes('early-bird')) newAchievements.push('early-bird');
           }
        }

        // --- Personal Records Update ---
        const newLongestStreak = Math.max(state.longestStreak || 0, state.streak);
        
        // Cek XP terbanyak dalam sehari (sederhana: cek apakah XP dari lesson hari ini melebihi record)
        // Idealnya kita simpan map { date: xp } tapi untuk demo ini, kita gunakan pendekatan activityHistory
        let newMostXpInDay = state.mostXpInDay || 0;
        if (lessonId && !(state.completedLessonIds || []).includes(lessonId)) {
            // Ambil data hari ini dari activityHistory (asumsi 1 lesson = bonusXp)
            // Namun untuk simplicity, kita hitung jika history hari ini punya count * rata2 XP > record
            const today = new Date().toISOString().split('T')[0];
            const todayHistory = newHistory.find(h => h.date === today);
            if (todayHistory) {
                // Perkiraan XP hari ini (asumsi kasar 100 XP per lesson + bonus)
                const estimatedTodayXp = todayHistory.count * 100;
                newMostXpInDay = Math.max(newMostXpInDay, estimatedTodayXp);
            }
        }

        return { 
          dailyGoals: updatedGoals, 
          completedLessonIds: updatedLessonIds, 
          xp: state.xp + bonusXp,
          gems: state.gems + bonusGems,
          activityHistory: newHistory,
          unlockedAchievements: newAchievements,
          nocturnalCount: newNocturnalCount,
          earlyBirdCount: newEarlyBirdCount,
          longestStreak: newLongestStreak,
          mostXpInDay: newMostXpInDay
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
           const currentCount = state.streakFreezeCount || 0;
           if (currentCount >= 3) return false; // Maksimal 3
           set({ gems: state.gems - cost, streakFreezeCount: currentCount + 1 });
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
        streakFreezeCount: state.streakFreezeCount,
        role: state.role, // NEW: Persist role
        semester: state.semester,
        enrolledCourseIds: state.enrolledCourseIds,
        pendingCourseIds: state.pendingCourseIds,
        completedLessonIds: state.completedLessonIds,
        activityHistory: state.activityHistory,
        unlockedAchievements: state.unlockedAchievements,
        nocturnalCount: state.nocturnalCount,
        earlyBirdCount: state.earlyBirdCount,
        longestStreak: state.longestStreak,
        mostXpInDay: state.mostXpInDay,
        totalPerfectLessons: state.totalPerfectLessons
        // dailyGoals: state.dailyGoals,
        // xpMultiplier: state.xpMultiplier,
        // multiplierEndTime: state.multiplierEndTime
      }), 
    }
  )
);