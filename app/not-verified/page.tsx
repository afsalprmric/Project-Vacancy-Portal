'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotVerifiedPage() {
    const { user, isEligible, loading, role, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isEligible) {
            if (role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/projects');
            }
        }
    }, [loading, isEligible, role, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Account Not Verified
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Your account ({user?.email}) is not currently eligible to access the platform.
                    </p>
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-xs text-yellow-800">
                            <strong>User UID (for Admin):</strong> <br />
                            <code className="bg-yellow-100 px-1 py-0.5 rounded">{user?.uid}</code>
                        </p>
                    </div>
                </div>
                <div className="mt-8 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-700 mb-4">
                            If you believe this is a mistake, please contact an administrator to be added to the eligibility list.
                        </p>
                        <button
                            onClick={() => signOut()}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
