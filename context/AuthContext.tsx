'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    role: 'admin' | 'faculty' | 'none' | null;
    isEligible: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    role: null,
    isEligible: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'admin' | 'faculty' | 'none' | null>(null);
    const [isEligible, setIsEligible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                try {
                    // Check if admin
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                    if (adminDoc.exists()) {
                        setRole('admin');
                        setIsEligible(true);
                    } else {
                        // All other authenticated users are eligible faculty/applicants
                        setRole('faculty');
                        setIsEligible(true);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    // Even on error, if they are authenticated, we might want to let them in as basic user? 
                    // For safety, let's default to basic user access if auth worked
                    setRole('faculty');
                    setIsEligible(true);
                }
            } else {
                setRole(null);
                setIsEligible(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
        setRole(null);
        setIsEligible(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, role, isEligible }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
