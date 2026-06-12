import { createContext } from 'react';
import type { User } from '../types/auth';
import type { LoginResponse, RegisterResponse } from '../api/authService';

export type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
