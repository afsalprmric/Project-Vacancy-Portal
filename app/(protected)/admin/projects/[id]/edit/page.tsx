'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Project } from '@/types';

// Categories and Statuses
const CATEGORIES = ['Secondary', 'Senior Secondary', 'Degree', 'PG'];
const STATUSES = ['Open', 'Partial', 'Closed'];

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({
        title: '',
        description: '',
        department: '',
        skills: [],
        facultyCount: 1,
        duration: '',
        category: 'Degree',
        status: 'Open',
        labels: []
    });

    const [skillsInput, setSkillsInput] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const docRef = doc(db, 'projects', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Project;
                    setFormData({
                        ...data,
                        skills: data.skills || [],
                        labels: data.labels || []
                    });
                    setSkillsInput(data.skills?.join(', ') || '');
                } else {
                    alert('Project not found');
                    router.push('/admin');
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, router]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSkillsInput(e.target.value);
        setFormData(prev => ({
            ...prev,
            skills: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const docRef = doc(db, 'projects', id);
            await updateDoc(docRef, {
                ...formData,
                facultyCount: Number(formData.facultyCount), // Ensure number
            });
            alert('Project updated successfully!');
            router.push('/admin');
        } catch (error) {
            console.error("Error updating project: ", error);
            alert("Failed to update project.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h1>
            <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2 p-8 space-y-6">

                {/* Basic Info */}
                <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">Project Title</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                        <div className="mt-2">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                required
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">Department</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="department"
                                id="department"
                                required
                                value={formData.department}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">Category (Folder)</label>
                        <div className="mt-2">
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 px-2"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label htmlFor="skills" className="block text-sm font-medium leading-6 text-gray-900">Skills Required (comma separated)</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="skills"
                                id="skills"
                                value={skillsInput}
                                onChange={handleSkillsChange}
                                placeholder="e.g. Python, Curriculum Design, Mentoring"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="facultyCount" className="block text-sm font-medium leading-6 text-gray-900">Faculty Count</label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="facultyCount"
                                id="facultyCount"
                                min="1"
                                required
                                value={formData.facultyCount}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="duration" className="block text-sm font-medium leading-6 text-gray-900">Duration</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="duration"
                                id="duration"
                                required
                                value={formData.duration}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">Status</label>
                        <div className="mt-2">
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 px-2"
                            >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-4">
                    <button type="button" onClick={() => router.back()} className="text-sm font-semibold leading-6 text-gray-900">Cancel</button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {submitting ? 'Updating...' : 'Update Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}
