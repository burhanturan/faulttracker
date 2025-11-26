import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    signIn: (username: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const signIn = async (username: string) => {
        try {
            // For now, we use '123' as password for everyone as per seed
            const user = await api.post('/auth/login', { username, password: '123' });
            setUser(user);
            router.replace('/(tabs)');
        } catch (error) {
            alert('Login failed. Check username or server connection.');
        }
    };

    const signOut = () => {
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
