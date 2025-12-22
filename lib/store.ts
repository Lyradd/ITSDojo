import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  isLoggedIn: boolean;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  

  activeCourseId: string; 

  login: () => void;
  logout: () => void;
  addXp: (amount: number) => void;
  setActiveCourse: (courseId: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: false,
  name: "Daryl",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  
  activeCourseId: "fe-basic", 

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
  
  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    if (newXp >= state.xpToNextLevel) {
      return {
        level: state.level + 1,
        xp: newXp - state.xpToNextLevel,
        xpToNextLevel: state.xpToNextLevel * 1.5,
      };
    }
    return { xp: newXp };
  }),

  setActiveCourse: (courseId) => set({ activeCourseId: courseId }),
}));