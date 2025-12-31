'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, where } from 'firebase/firestore';
import { Project, Application } from '@/types';

// Categories defined in Create Project
const CATEGORIES = ['Secondary', 'Senior Secondary', 'Degree', 'PG'];
const STATUSES = ['Open', 'Partial', 'Closed'];

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'projects' | 'faculty'>('overview');

    // Data States
    const [applications, setApplications] = useState<Application[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [faculty, setFaculty] = useState<{ id: string }[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Faculty Management State
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch Projects
            const projectsSnap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
            const projectsList = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
            setProjects(projectsList);

            // Fetch Applications
            const appSnap = await getDocs(query(collection(db, 'applications'), orderBy('appliedAt', 'desc')));
            const appList = appSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[];
            setApplications(appList);

            // Fetch Faculty
            const facultSnap = await getDocs(collection(db, 'eligibleFaculty'));
            setFaculty(facultSnap.docs.map(doc => ({ id: doc.id })));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project");
        }
    };

    const handleUpdateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
        try {
            await updateDoc(doc(db, 'projects', projectId), { status: newStatus });
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Labeling (Simple prompt for MVP)
    const handleAddLabel = async (projectId: string) => {
        const label = prompt("Enter new label:");
        if (!label) return;

        try {
            const project = projects.find(p => p.id === projectId);
            const currentLabels = project?.labels || [];
            const newLabels = [...currentLabels, label];

            await updateDoc(doc(db, 'projects', projectId), { labels: newLabels });
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, labels: newLabels } : p));
        } catch (error) {
            console.error("Error adding label:", error);
        }
    };

    const handleApplicationAction = async (appId: string, action: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${action} this application?`)) return;
        try {
            await updateDoc(doc(db, 'applications', appId), { status: action });
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: action } : a));
        } catch (error) {
            console.error(`Error marking application as ${action}:`, error);
            alert("Action failed");
        }
    };

    const handleAddFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        try {
            await setDoc(doc(db, 'eligibleFaculty', newEmail), { addedAt: new Date() });
            setNewEmail('');
            // Refresh local state roughly
            setFaculty(prev => [...prev, { id: newEmail }]);
        } catch (error) {
            console.error("Error adding faculty:", error);
            alert("Failed to add faculty");
        }
    };

    const handleRemoveFaculty = async (email: string) => {
        if (!confirm("Remove this faculty member?")) return;
        try {
            await deleteDoc(doc(db, 'eligibleFaculty', email));
            setFaculty(prev => prev.filter(f => f.id !== email));
        } catch (error) {
            console.error("Error removing faculty:", error);
            alert("Failed to remove faculty");
        }
    };

    // --- Filtering Logic ---

    // Group Projects by Category
    const groupedProjects = CATEGORIES.reduce((acc, category) => {
        acc[category] = projects.filter(p => p.category === category && (filterStatus === 'all' || p.status === filterStatus));
        return acc;
    }, {} as Record<string, Project[]>);

    // Filter apps
    const filteredApplications = applications.filter(app => {
        if (filterProject !== 'all' && app.projectId !== filterProject) return false;
        return true;
    });


    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <Link
                    href="/admin/projects/new"
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700"
                >
                    + Create New Project
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {['overview', 'applications', 'projects', 'faculty'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`${activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Switcher */}
            <div className="min-h-[400px]">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{applications.length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{projects.filter(p => p.status === 'Open').length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Verified Faculty</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{faculty.length}</dd>
                        </div>
                    </div>
                )}

                {/* --- PROJECTS TAB (Folders) --- */}
                {activeTab === 'projects' && (
                    <div className="space-y-8">
                        {/* Filters */}
                        <div className="flex space-x-4 mb-4">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                            >
                                <option value="all">All Status</option>
                                <option value="Open">Open</option>
                                <option value="Partial">Partial</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        {/* Uncategorized Projects (Legacy) */}
                        {(() => {
                            const uncategorized = projects.filter(p => !CATEGORIES.includes(p.category) && (filterStatus === 'all' || p.status === filterStatus));
                            if (uncategorized.length === 0) return null;

                            return (
                                <div key="uncategorized" className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                                    <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
                                        <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        Uncategorized / Legacy
                                    </h2>
                                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                                        {uncategorized.map(project => (
                                            <div key={project.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-yellow-500 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                                                        <p className="text-sm text-gray-500">{project.department || 'No Dept'}</p>
                                                    </div>
                                                    <select
                                                        value={project.status || 'Open'}
                                                        onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value as any)}
                                                        className={`text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-6 ${project.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description}</div>

                                                {/* Labels & Category Move */}
                                                <div className="mt-3 flex flex-wrap gap-2 items-center">
                                                    {project.labels?.map((label, i) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {label}
                                                        </span>
                                                    ))}
                                                    <button onClick={() => handleAddLabel(project.id)} className="text-xs text-indigo-600 hover:text-indigo-900">+ Label</button>

                                                    <span className="text-gray-300">|</span>
                                                    <select
                                                        value={project.category || ''}
                                                        onChange={async (e) => {
                                                            if (!e.target.value) return;
                                                            try {
                                                                await updateDoc(doc(db, 'projects', project.id), { category: e.target.value });
                                                                setProjects(prev => prev.map(p => p.id === project.id ? { ...p, category: e.target.value } : p));
                                                            } catch (err) { console.error(err); }
                                                        }}
                                                        className="text-xs border-gray-300 rounded shadow-sm py-0.5"
                                                    >
                                                        <option value="">Move to Category...</option>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>

                                                <div className="mt-4 flex justify-between items-center border-t pt-2">
                                                    <div className="text-xs text-gray-400">Faculty Needed: {project.facultyCount || '?'}</div>
                                                    <div className="flex space-x-3">
                                                        <Link href={`/admin/projects/${project.id}/edit`} className="text-sm text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        <button
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            className="text-sm text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {CATEGORIES.map(category => {
                            const categoryProjects = groupedProjects[category] || [];
                            if (categoryProjects.length === 0) return null;

                            return (
                                <div key={category} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                        {category}
                                    </h2>
                                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                                        {categoryProjects.map(project => (
                                            <div key={project.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-indigo-500 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                                                        <p className="text-sm text-gray-500">{project.department}</p>
                                                    </div>
                                                    <select
                                                        value={project.status}
                                                        onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value as any)}
                                                        className={`text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-6 ${project.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description}</div>

                                                {/* Labels & Category Move */}
                                                <div className="mt-3 flex flex-wrap gap-2 items-center">
                                                    {project.labels?.map((label, i) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {label}
                                                        </span>
                                                    ))}
                                                    <button onClick={() => handleAddLabel(project.id)} className="text-xs text-indigo-600 hover:text-indigo-900">+ Label</button>

                                                    <span className="text-gray-300">|</span>
                                                    <select
                                                        value={project.category}
                                                        onChange={async (e) => {
                                                            if (!e.target.value) return;
                                                            try {
                                                                await updateDoc(doc(db, 'projects', project.id), { category: e.target.value });
                                                                setProjects(prev => prev.map(p => p.id === project.id ? { ...p, category: e.target.value } : p));
                                                            } catch (err) { console.error(err); }
                                                        }}
                                                        className="text-xs border-gray-300 rounded shadow-sm py-0.5"
                                                    >
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>

                                                <div className="mt-4 flex justify-between items-center border-t pt-2">
                                                    <div className="text-xs text-gray-400">Faculty Needed: {project.facultyCount}</div>
                                                    <div className="flex space-x-3">
                                                        <Link href={`/admin/projects/${project.id}/edit`} className="text-sm text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        <button
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            className="text-sm text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {Object.values(groupedProjects).every(arr => arr.length === 0) && projects.filter(p => !CATEGORIES.includes(p.category) && (filterStatus === 'all' || p.status === filterStatus)).length === 0 && (
                            <div className="text-center py-10 text-gray-500">No projects found in this view.</div>
                        )}
                    </div>
                )}

                {/* --- APPLICATIONS TAB --- */}
                {activeTab === 'applications' && (
                    <div>
                        {/* Filter */}
                        <div className="mb-6">
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        <ul role="list" className="space-y-4">
                            {filteredApplications.length === 0 ? (
                                <li className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">No applications match your filter.</li>
                            ) : (
                                filteredApplications.map((app) => (
                                    <li key={app.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                                        <div className="px-4 py-5 sm:px-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                        {app.applicantName} <span className="text-gray-400 text-sm">({app.email})</span>
                                                    </h3>
                                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                                        Applying for: <span className="font-semibold text-indigo-600">{app.projectTitle || app.projectId}</span>
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {app.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                                            <dl className="sm:divide-y sm:divide-gray-200">
                                                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                    <dt className="text-sm font-medium text-gray-500">Contact</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{app.phone} {app.whatsapp && '(WA)'} | {app.place}</dd>
                                                </div>
                                                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                    <dt className="text-sm font-medium text-gray-500">Qualifications</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{app.qualifications}</dd>
                                                </div>
                                                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                    <dt className="text-sm font-medium text-gray-500">Role & Mode</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                        {app.preferredRole} (
                                                        {typeof app.modePreference === 'object'
                                                            ? Object.keys(app.modePreference).filter(k => (app.modePreference as any)[k]).join(', ')
                                                            : app.modePreference}
                                                        )
                                                    </dd>
                                                </div>
                                                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                    <dt className="text-sm font-medium text-gray-500">Availability</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{app.availabilityWindow} ({app.weeklyCommitment})</dd>
                                                </div>
                                                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                    <dt className="text-sm font-medium text-gray-500">Experience</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{app.relevantExperience}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                        {app.status === 'pending' && (
                                            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleApplicationAction(app.id, 'rejected')}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApplicationAction(app.id, 'approved')}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}

                {/* --- FACULTY TAB --- */}
                {activeTab === 'faculty' && (
                    <div className="p-6 bg-white shadow rounded-lg">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Verified Faculty</h3>
                            <form onSubmit={handleAddFaculty} className="flex gap-4">
                                <input
                                    type="email"
                                    placeholder="Enter Faculty Email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                                <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                    Add
                                </button>
                            </form>
                            <p className="mt-1 text-xs text-gray-500">This list is optional now as Public Access is enabled, but useful for record keeping.</p>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Faculty Directory ({faculty.length})</h3>
                        <ul role="list" className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                            {faculty.length === 0 ? (
                                <li className="px-4 py-4 text-center text-sm text-gray-500">No verified faculty recorded.</li>
                            ) : (
                                faculty.map((f) => (
                                    <li key={f.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                                        <span className="text-sm text-gray-900">{f.id}</span>
                                        <button onClick={() => handleRemoveFaculty(f.id)} className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
