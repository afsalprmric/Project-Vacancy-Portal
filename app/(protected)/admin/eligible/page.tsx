'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';

interface Faculty {
    id: string; // This is the UID
    email?: string; // Optional if we just store UID for MVP, but form asks for input.
}

export default function EligibleFacultyPage() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchFaculty = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'eligibleFaculty'));
            const querySnapshot = await getDocs(q);
            const facultyList: Faculty[] = [];
            querySnapshot.forEach((doc) => {
                facultyList.push({ id: doc.id }); // ID is now the email
            });
            setFaculty(facultyList);
        } catch (error) {
            console.error("Error fetching faculty", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;

        try {
            await setDoc(doc(db, 'eligibleFaculty', newEmail), {
                addedAt: new Date(),
            });
            setNewEmail('');
            fetchFaculty();
        } catch (error) {
            console.error("Error adding faculty", error);
            alert("Failed to add Email");
        }
    };

    const handleRemove = async (email: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await deleteDoc(doc(db, 'eligibleFaculty', email));
            fetchFaculty();
        } catch (error) {
            console.error("Error removing faculty", error);
            alert("Failed to remove Email");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Eligible Faculty</h1>

            <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Faculty</h2>
                <form onSubmit={handleAdd} className="flex gap-4">
                    <div className="flex-grow">
                        <label htmlFor="email" className="sr-only">Faculty Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter Faculty Email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Add Email
                    </button>
                </form>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Eligible Faculty List</h3>
                </div>
                <ul role="list" className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-4 py-4 sm:px-6">Loading...</li>
                    ) : faculty.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6">No eligible faculty found.</li>
                    ) : (
                        faculty.map((f) => (
                            <li key={f.id} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                                <span className="text-sm font-medium text-indigo-600 truncate">{f.id}</span>
                                <button
                                    onClick={() => handleRemove(f.id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
