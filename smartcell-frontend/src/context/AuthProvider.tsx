import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authService from '../api/authService';
import {
    clearAccessToken,
    getAccessToken,
    setAccessToken,
} from '../api/tokenStorage';
import type { User } from '../types/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            const me = await authService.fetchMe();
            setUser(me);
        } catch {
            setUser(null);
            clearAccessToken();
        } finally {
            setInitializing(false);
        }
    }, []);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setInitializing(false);
            return;
        }
        void loadUser();
    }, [loadUser]);

    const login = useCallback(
        async (credentials: { email: string; password: string }) => {
            const data = await authService.login(credentials);
            setAccessToken(data.access_token);
            await loadUser();
            return data;
        },
        [loadUser],
    );

    const register = useCallback(
        async (payload: {
            name: string;
            email: string;
            password: string;
            password_confirmation: string;
        }) => {
            return authService.register(payload);
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            clearAccessToken();
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            initializing,
            isAuthenticated: Boolean(user),
            login,
            register,
            logout,
            refreshUser: loadUser,
        }),
        [user, initializing, login, register, logout, loadUser],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
