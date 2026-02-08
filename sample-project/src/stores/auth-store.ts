import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

// Using Zustand-style store pattern
export const createAuthStore = (): AuthState => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: () => {},
  setToken: () => {},
  logout: () => {},
});

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const createUIStore = (): UIState => ({
  sidebarOpen: true,
  theme: 'dark',
  toggleSidebar: () => {},
  setTheme: () => {},
});
