'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [error, setError] = useState('');
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // Redirect logic will be handled by the onAuthStateChanged or the ProtectedLayout if we push to a protected route.
            // Ideally, we fetch the role here and then redirect.
            // But since AuthContext does it async, we might just push to /dashboard and let ProtectedLayout handle the specific rerouting 
            // OR we can do a quick check here.
            // For simplicity, let's push to /dashboard and let ProtectedLayout / or a central redirector handle it.
            // However, the requirement says "After login, route..."
            // Let's push to a special route or just / and let middleware/layout handle it.
            // Wait, let's look at AuthContext changes. It fetches role.
            // Re-reading Plan: "Admin -> /admin, Eligible -> /projects, Neither -> /not-verified"

            // We'll push to /dashboard as a neutral ground, and updated ProtectedLayout/Dashboard to redirect?
            // actually, let's just push to /admin for now, and let layout fix it? No that's bad UX.

            // Let's rely on the AuthContext and wait for role?
            // It's hard to wait for role inside the login handler without exposing a promise from context.
            // Simpler approach: Push to /dashboard, and inside /dashboard or Root Layout, redirect based on role.

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Use your Google account to access the platform
                    </p>
                </div>
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}
                <div className="mt-8 space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            {/* Google Icon */}
                            <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                        </span>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
