'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface ApplicationResult {
    id: string;
    projectTitle: string;
    applicantName: string;
    status: string;
    appliedAt: Timestamp;
}

export default function TrackPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ApplicationResult[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setSearched(false);
        setResults([]);

        try {
            // Search by Email OR Phone
            // Since Firestore OR queries can be tricky without indexes, we'll run two parallel queries
            const qEmail = query(
                collection(db, 'applications'),
                where('email', '==', searchTerm.trim())
            );
            const qPhone = query(
                collection(db, 'applications'),
                where('phone', '==', searchTerm.trim())
            );

            const [emailSnap, phoneSnap] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);

            const foundApps = new Map<string, ApplicationResult>();

            const processDoc = (doc: any) => {
                const data = doc.data();
                foundApps.set(doc.id, {
                    id: doc.id,
                    projectTitle: data.projectTitle || 'Untitled Project',
                    applicantName: data.applicantName,
                    status: data.status,
                    appliedAt: data.appliedAt
                });
            };

            emailSnap.forEach(processDoc);
            phoneSnap.forEach(processDoc);

            setResults(Array.from(foundApps.values()));
        } catch (error) {
            console.error("Error searching applications:", error);
            alert("An error occurred while searching. Please try again.");
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shortlisted': return 'bg-blue-100 text-blue-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Track Your Application
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        Enter your registered Email Address or Phone Number to view the status of your applications.
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-grow">
                            <label htmlFor="search" className="sr-only">Email or Phone</label>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                                placeholder="Enter Email or Phone Number"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {searched && (
                    <div className="space-y-6">
                        {results.length > 0 ? (
                            results.map((app) => (
                                <div key={app.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                {app.projectTitle}
                                            </h3>
                                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                                Applicant: {app.applicantName}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(app.status)} uppercase tracking-wide`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Applied On</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {app.appliedAt?.toDate().toLocaleDateString() || 'N/A'}
                                                </dd>
                                            </div>
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono">
                                                    {app.id}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white shadow rounded-lg">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    We couldn't find any applications matching that email or phone number.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
