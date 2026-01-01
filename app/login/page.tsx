'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [logs, setLogs] = useState<string[]>([]); // Debug logs
    const router = useRouter();
    const { user, loading } = useAuth();

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);
        console.log(msg);
    };

    useEffect(() => {
        addLog(`Init: User=${user ? 'Yes' : 'No'}, Loading=${loading}`);

        if (user) {
            addLog("User detected, Redirecting to /dashboard");
            router.push('/dashboard');
        } else {
            if (!loading) {
                addLog("User not found, checking redirect result...");
                getRedirectResult(auth)
                    .then((result) => {
                        if (result) {
                            addLog(`Redirect Success: ${result.user?.email}`);
                        } else {
                            addLog("Redirect Result: null");
                        }
                    })
                    .catch((error) => {
                        addLog(`Redirect Error: ${error.message}`);
                        setError(`Login failed: ${error.message}`);
                    });
            }
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        try {
            addLog("Starting Google Redirect Login...");
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (err: any) {
            addLog(`Login Invoke Error: ${err.message}`);
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying session...</p>
                </div>
                {/* Visible logs for debugging */}
                <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-left w-3/4 max-h-60 overflow-auto font-mono">
                    <p className="font-bold">Debug Logs:</p>
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
                    </button>
                </div>
            </div>

            {/* Visible logs for debugging */}
            <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-left w-full max-w-md max-h-60 overflow-auto font-mono">
                <p className="font-bold">Debug Logs:</p>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
