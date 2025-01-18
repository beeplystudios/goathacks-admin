import { create } from "zustand";

type credType = {
  username?: string;
  token?: string;
};

export interface AuthState {
  credentials?: credType;
  logOut: () => void;
  logIn: (c: credType) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  logOut: () =>
    set(() => ({
      credentials: undefined,
    })),
  logIn: (c) => set(() => ({ credentials: c })),
}));
