'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function BulkAdminsPage() {
    const [emails, setEmails] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const handleImport = async () => {
        if (!emails.trim()) return;
        if (!confirm("This will grant ADMIN access to these emails. Continue?")) return;

        setStatus('loading');
        setLog([]);
        const lines = emails.split('\n').map(e => e.trim()).filter(e => e);
        const newLog = [];
        let successCount = 0;
        let errorCount = 0;

        for (const email of lines) {
            try {
                // Determine if valid email (basic check)
                if (!email.includes('@')) {
                    newLog.push(`Skipped invalid email: ${email}`);
                    continue;
                }

                await setDoc(doc(db, 'admin_emails', email), {
                    email: email,
                    role: 'admin',
                    addedAt: serverTimestamp(),
                    addedBy: 'bulk_import'
                });
                newLog.push(`Added: ${email}`);
                successCount++;
            } catch (error: any) {
                console.error(error);
                newLog.push(`Error adding ${email}: ${error.message}`);
                errorCount++;
            }
            // Update log every few items or at end to avoid too many renders? 
            // React state updates are batched usually, but let's just update at the end or in chunks if large.
            // For ~25 items, updating every loop is fine visually.
            setLog([...newLog]);
        }

        setStatus('success');
        newLog.push(`Done. Added: ${successCount}, Errors: ${errorCount}`);
        setLog(newLog);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Bulk Import Admins</h1>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label htmlFor="emails" className="block text-sm font-medium text-gray-700">
                        Email Addresses (One per line)
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="emails"
                            rows={15}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 border p-2"
                            placeholder="user1@example.com
user2@example.com"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            disabled={status === 'loading'}
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Paste the list of email addresses here. Each email will be granted admin access immediately.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleImport}
                        disabled={status === 'loading' || !emails.trim()}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${status === 'loading' ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                    >
                        {status === 'loading' ? 'Processing...' : 'Import Admins'}
                    </button>
                </div>

                {log.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded text-sm font-mono border border-gray-200 max-h-60 overflow-y-auto">
                        {log.map((line, i) => <div key={i} className={`mb-1 ${line.startsWith('Error') || line.startsWith('Skipped') ? 'text-red-600' : 'text-green-600'}`}>{line}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}
