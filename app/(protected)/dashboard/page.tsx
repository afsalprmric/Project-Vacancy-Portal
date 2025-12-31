'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Application } from '@/types';

export default function DashboardPage() {
    const { user, role } = useAuth();
    const [projectCount, setProjectCount] = useState(0);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Projects Count
                const projectsColl = collection(db, 'projects');
                const projectsSnapshot = await getCountFromServer(projectsColl);
                setProjectCount(projectsSnapshot.data().count);

                // Fetch Applications
                const applicationsColl = collection(db, 'applications');
                let appQuery;

                if (role === 'admin') {
                    // Admin: Fetch recent pending applications for a quick view? 
                    // Or primarily just keep the count for the "Overview" feel and let them go to /admin for details.
                    // Let's explicitly redirect Admin mindset to /admin, but here show stats.
                    // For now, let's just fetch all like before but store as list if we want to show it, 
                    // or just get count if we only want count.
                    // The requirement is for FACULTY to see status.
                    // So for Admin, let's keep it simple or show recent 5.

                    // Let's stick to the previous behavior for Admin (Count) but using the new list state might be heavy if many.
                    // Actually, for consistency, let's just fetch them. MVP scale is small.
                    appQuery = query(applicationsColl, where('status', '==', 'pending'));
                } else if (user) {
                    // User: Fetch THEIR applications
                    appQuery = query(applicationsColl, where('userId', '==', user.uid));
                }

                if (appQuery) {
                    const appSnapshot = await getDocs(appQuery);
                    const appList = appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[];
                    setApplications(appList);
                }

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && role) {
            fetchStats();
        }
    }, [user, role]);

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of your mentoring activities.</p>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Active Projects</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {loading ? '...' : projectCount}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                {role === 'admin' ? 'Pending Applications' : 'My Applications'}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {loading ? '...' : applications.length}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Applications List (For Faculty Mainly) */}
            {role !== 'admin' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">My Application Status</h3>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200">
                        {loading ? (
                            <li className="px-4 py-4 text-center text-gray-500">Loading...</li>
                        ) : applications.length === 0 ? (
                            <li className="px-4 py-4 text-center text-gray-500">You haven&apos;t applied to any projects yet.</li>
                        ) : (
                            applications.map((app) => (
                                <li key={app.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-indigo-600 truncate">
                                                {app.projectTitle || 'Unknown Project'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Role: {app.preferredRole} | Mode: {typeof app.modePreference === 'object' ? 'Multiple' : app.modePreference}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
