'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
    user: any | null;
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
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const [role, setRole] = useState<'admin' | 'faculty' | 'none' | null>(null);
    const [isEligible, setIsEligible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchRole = async () => {
            if (!clerkUser) {
                setRole(null);
                setIsEligible(false);
                return;
            }

            try {
                // Check if admin (using Clerk user ID)
                const adminDoc = await getDoc(doc(db, 'admins', clerkUser.id));

                // Check if admin (Email based)
                let emailAdmin = false;
                const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
                if (primaryEmail) {
                    const adminEmailDoc = await getDoc(doc(db, 'admin_emails', primaryEmail));
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
                // Default to faculty on error
                setRole('faculty');
                setIsEligible(true);
            }
        };

        if (isLoaded) {
            fetchRole();
        }
    }, [clerkUser, isLoaded]);

    const signOut = async () => {
        await clerkSignOut();
        setRole(null);
        setIsEligible(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user: clerkUser,
            loading: !isLoaded,
            signOut,
            role,
            isEligible
        }}>
            {isLoaded && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
