'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

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

    // New state for dashboard features
    const [activeProjectsCount, setActiveProjectsCount] = useState<number | null>(null);
    const [showTrackSearch, setShowTrackSearch] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const q = query(collection(db, 'projects'));
                const snapshot = await getCountFromServer(q);
                setActiveProjectsCount(snapshot.data().count);
            } catch (error) {
                console.error("Error fetching project count:", error);
                setActiveProjectsCount(0);
            }
        };

        fetchStats();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setSearched(false);
        setResults([]);

        try {
            // Search by Email OR Phone
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
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'shortlisted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Project Vacancy Portal
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Discover research opportunities and track your application status in one place.
                    </p>
                </div>

                {/* Dashboard Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Active Projects Card */}
                    <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-indigo-600 transform group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                        </div>
                        <div className="p-8 flex flex-col items-center text-center h-full">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Projects</h2>
                            <div className="text-5xl font-black text-indigo-600 mb-4 animate-pulse">
                                {activeProjectsCount === null ? '-' : activeProjectsCount}
                            </div>
                            <p className="text-gray-500 mb-8 flex-grow">
                                Explore currently open research positions and apply today.
                            </p>
                            <Link href="/projects" className="w-full">
                                <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:-translate-y-0.5">
                                    Browse Projects
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* My Application Status Card */}
                    <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-purple-600 transform group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 001-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="p-8 flex flex-col items-center text-center h-full">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Applications</h2>
                            <div className="text-5xl font-black text-purple-600 mb-4 opacity-0">
                                {/* Invisible spacer to match height of neighbor */}-
                            </div>
                            <p className="text-gray-500 mb-8 flex-grow">
                                Already applied? Check the real-time status of your applications.
                            </p>
                            <button
                                onClick={() => {
                                    setShowTrackSearch(true);
                                    // Smooth scroll to search section if needed
                                    setTimeout(() => {
                                        document.getElementById('track-search')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Check Status
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tracking Search Section - Collapsible */}
                <div
                    id="track-search"
                    className={`transition-all duration-700 ease-in-out overflow-hidden ${showTrackSearch ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-10 border border-gray-100">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-gray-900">Track Application</h3>
                            <p className="text-gray-500 mt-2">Enter your registered details below</p>
                        </div>

                        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4">
                            <div className="flex-grow">
                                <label htmlFor="search" className="sr-only">Email or Phone</label>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 py-3 sm:text-base pl-4 border hover:border-gray-400 transition-colors"
                                    placeholder="Enter registered Email or Phone"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all duration-200"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching
                                    </>
                                ) : (
                                    'Track'
                                )}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searched && (
                            <div className="mt-10 animate-fade-in-up">
                                {results.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Found {results.length} Application{results.length > 1 ? 's' : ''}</h4>
                                        {results.map((app) => (
                                            <div key={app.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-purple-200 transition-colors shadow-sm">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div>
                                                        <h5 className="text-lg font-bold text-gray-900">{app.projectTitle}</h5>
                                                        <p className="text-sm text-gray-500 mt-1">Applicant: <span className="font-medium text-gray-700">{app.applicantName}</span></p>
                                                        <p className="text-xs text-gray-400 mt-1 font-mono">ID: {app.id}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-4 py-1.5 inline-flex text-sm leading-5 font-bold rounded-full border ${getStatusColor(app.status)} uppercase tracking-wide shadow-sm`}>
                                                            {app.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {app.appliedAt?.toDate().toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                                        <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto">
                                            We couldn't find any applications matching that email or phone number. Please check your typo or try the other identifier.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
