'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
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
        let unsubscribe: () => void;

        const initializeAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (error) {
                console.error("Error setting persistence:", error);
            }

            unsubscribe = onAuthStateChanged(auth, async (user) => {
                setUser(user);
                if (user) {
                    try {
                        // Check if admin (UID based)
                        const adminDoc = await getDoc(doc(db, 'admins', user.uid));

                        // Check if admin (Email based)
                        let emailAdmin = false;
                        if (user.email) {
                            const adminEmailDoc = await getDoc(doc(db, 'admin_emails', user.email));
                            if (adminEmailDoc.exists()) {
                                emailAdmin = true;
                            }
                        }

                        if (adminDoc.exists() || emailAdmin) {
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
        };

        initializeAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
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
