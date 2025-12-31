'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, role, isEligible } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        // Role-based routing logic
        if (role === 'admin') {
            // Admins can access everything, but if they hit root of protected, maybe send to admin dashboard?
            // For now, let them access requested routes, but we should block them from applying? 
            // Requirement simply says "admin -> /admin".
            // Let's enforce that if they are on dashboard or projects root, they might prefer /admin.
            // But the requirement says "Associated route logic".
            // "After login, route: admin -> /admin, eligible faculty -> /projects, otherwise -> /not-verified"
            // This sounds like login redirect logic, but also route guarding.

            // If user is accessing /admin routes and is NOT admin, block.
            if (pathname.startsWith('/admin') && role !== 'admin') {
                router.push('/dashboard'); // or not-verified
            }
        } else {
            // Everyone else is faculty/applicant
            if (pathname.startsWith('/admin')) {
                router.push('/dashboard');
                return;
            }
        }

    }, [user, loading, role, isEligible, router, pathname]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
