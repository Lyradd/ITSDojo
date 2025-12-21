import { create } from 'zustand';

interface UserState {
  // Auth State
  isLoggedIn: boolean; // <-- Tambahan baru
  
  // Data User
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  
  // Actions
  login: () => void;   // <-- Tambahan baru
  logout: () => void;  // <-- Tambahan baru
  addXp: (amount: number) => void;
  levelUp: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Default: Belum login
  isLoggedIn: false, 

  // Initial Data
  name: "Daryl",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  coins: 0,

  // Actions
  login: () => set({ isLoggedIn: true }), // Ubah status jadi login
  logout: () => set({ isLoggedIn: false }), // Ubah status jadi logout

  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    if (newXp >= state.xpToNextLevel) {
      return {
        level: state.level + 1,
        xp: newXp - state.xpToNextLevel,
        xpToNextLevel: state.xpToNextLevel * 1.5,
        coins: state.coins + 50,
      };
    }
    return { xp: newXp };
  }),

  levelUp: () => set((state) => ({ level: state.level + 1 })),
}));