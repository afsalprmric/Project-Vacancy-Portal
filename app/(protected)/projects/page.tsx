'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Project } from '@/types';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'projects'));
                const projectsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Project[];
                setProjects(projectsList);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading projects...</div>;
    }

    // Helper for status colors
    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-800';
            case 'Partial': return 'bg-yellow-100 text-yellow-800';
            case 'Closed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Projects</h1>

            {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No projects are currently available.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 flex flex-col">
                            <div className="px-6 py-5 flex-grow">
                                <div className="flex justify-between items-start">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{project.category}</span>
                                </div>
                                <h3 className="mt-3 text-xl font-semibold text-gray-900">
                                    <Link href={`/projects/${project.id}`} className="hover:text-indigo-600">
                                        {project.title}
                                    </Link>
                                </h3>
                                <p className="mt-1 text-sm text-indigo-600 font-medium">{project.department}</p>
                                <p className="mt-3 text-base text-gray-500 line-clamp-3">{project.description}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {project.skills && project.skills.slice(0, 3).map((skill, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {skill}
                                        </span>
                                    ))}
                                    {project.skills && project.skills.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            +{project.skills.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">{project.facultyCount}</span> Faculty Needed
                                </div>
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    View Details &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
