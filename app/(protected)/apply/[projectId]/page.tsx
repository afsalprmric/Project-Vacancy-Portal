'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Application } from '@/types';

export default function ApplyPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();

    const [projectTitle, setProjectTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);

    const [formData, setFormData] = useState<Partial<Application>>({
        applicantName: '',
        email: '',
        place: '',
        phone: '',
        whatsapp: '',
        qualifications: '',
        availabilityWindow: '',
        weeklyCommitment: '',
        preferredRole: 'Member',
        modePreference: 'Hybrid',
        relevantExperience: '',
        remarks: '',
    });

    const [sameAsPhone, setSameAsPhone] = useState(false);

    // Initial load: Just get project details
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const projectDoc = await getDoc(doc(db, 'projects', projectId));
                if (projectDoc.exists()) {
                    setProjectTitle(projectDoc.data().title);
                } else {
                    alert("Project not found");
                    router.push('/projects');
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, router]);



    const handleSameAsPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSameAsPhone(e.target.checked);
        if (e.target.checked) {
            setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Sync whatsapp if checked
        if (name === 'phone' && sameAsPhone) {
            setFormData(prev => ({ ...prev, phone: value, whatsapp: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Check for duplicate application by Email or Phone
            const qEmail = query(
                collection(db, 'applications'),
                where('projectId', '==', projectId),
                where('email', '==', formData.email)
            );
            const qPhone = query(
                collection(db, 'applications'),
                where('projectId', '==', projectId),
                where('phone', '==', formData.phone)
            );

            const [emailSnap, phoneSnap] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);

            if (!emailSnap.empty || !phoneSnap.empty) {
                alert("You have already applied for this project with this Email or Phone.");
                setSubmitting(false);
                return;
            }

            await addDoc(collection(db, 'applications'), {
                ...formData,
                projectId,
                projectTitle,
                userId: 'guest', // No auth user
                status: 'pending',
                appliedAt: new Date(),
            });

            alert("Application submitted successfully! You can track your status using your Email or Phone.");
            router.push('/dashboard');
        } catch (error) {
            console.error("Error submitting application: ", error);
            alert("Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (alreadyApplied) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex justify-center">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                You have already applied for the project: <span className="font-bold">{projectTitle}</span>.
                            </p>
                            <p className="mt-2">
                                <button onClick={() => router.push('/dashboard')} className="text-indigo-600 hover:text-indigo-500 font-medium">
                                    Go to Dashboard
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for Project</h1>
            <p className="text-lg text-indigo-600 mb-8 font-medium">{projectTitle}</p>

            <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="p-8 space-y-6">

                    {/* Section 1: Personal Details */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-4 uppercase tracking-wider text-xs">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="applicantName" required value={formData.applicantName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Place</label>
                                <input type="text" name="place" required value={formData.place} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                                <div className="flex items-center mt-1">
                                    <input type="tel" name="whatsapp" required value={formData.whatsapp} onChange={handleChange} disabled={sameAsPhone} className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${sameAsPhone ? 'bg-gray-100' : ''}`} />
                                </div>
                                <div className="flex items-center mt-2">
                                    <input id="sameAsPhone" type="checkbox" checked={sameAsPhone} onChange={handleSameAsPhoneChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                                    <label htmlFor="sameAsPhone" className="ml-2 block text-xs text-gray-500">Same as Phone</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Qualifications & Experience */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-4 uppercase tracking-wider text-xs">Qualifications & Experience</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Highest Educational Qualifications</label>
                                <input type="text" name="qualifications" required value={formData.qualifications} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. PhD in Islamic Studies" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Relevant Expertise & Experience</label>
                                <textarea name="relevantExperience" rows={3} required value={formData.relevantExperience} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="Briefly describe your experience relevant to this project..." />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Availability & Role */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="text-md font-semibold text-gray-800 mb-4 uppercase tracking-wider text-xs">Role & Availability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Availability Window</label>
                                <input type="text" name="availabilityWindow" required value={formData.availabilityWindow} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. Weekends, Evenings" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Weekly Commitment</label>
                                <input type="text" name="weeklyCommitment" required value={formData.weeklyCommitment} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. 5-10 Hours" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Preferred Role</label>
                                <select name="preferredRole" value={formData.preferredRole} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                                    <option value="Lead">Lead</option>
                                    <option value="Member">Member</option>
                                    <option value="Reviewer">Reviewer</option>
                                    <option value="Trainer">Trainer</option>
                                    <option value="Coordinator">Coordinator</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mode of Contribution</label>
                                <select name="modePreference" value={formData.modePreference} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                                    <option value="Online">Online</option>
                                    <option value="Onsite">Onsite</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                            <textarea name="remarks" rows={2} value={formData.remarks} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                        </div>
                    </div>

                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button type="button" onClick={() => router.back()} className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    );
}
