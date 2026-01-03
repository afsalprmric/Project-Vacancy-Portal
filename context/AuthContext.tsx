'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: any | null; // Keep for compatibility, but will be minimal
    loading: boolean;
    login: (password: string) => boolean; // Simplified login
    signOut: () => void;
    role: 'admin' | 'faculty' | 'none' | null;
    isEligible: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    login: () => false,
    signOut: () => { },
    role: 'faculty', // Default to faculty (public)
    isEligible: true, // Default to eligible
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [role, setRole] = useState<'admin' | 'faculty' | 'none' | null>('faculty');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for persistent admin session
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (isAdmin) {
            setRole('admin');
        } else {
            setRole('faculty');
        }
        setLoading(false);
    }, []);

    const login = (password: string) => {
        if (password === 'darulhudavacancy') {
            localStorage.setItem('isAdmin', 'true');
            setRole('admin');
            router.push('/dashboard'); // or /admin
            return true;
        }
        return false;
    };

    const signOut = () => {
        localStorage.removeItem('isAdmin');
        setRole('faculty');
        router.push('/');
    };

    // Mock user object for compatibility with existing components
    const user = role === 'admin'
        ? { email: 'admin@dhiu.in', displayName: 'Administrator' }
        : { email: 'guest@dhiu.in', displayName: 'Guest Faculty' };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            signOut,
            role,
            isEligible: true
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
