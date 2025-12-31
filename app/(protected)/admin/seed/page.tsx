'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PROJECTS_TO_SEED = [
    {
        title: "Faculty Project Vacancy Portal Development and Implementation",
        department: "Academic Office / Institutional Development",
        description: "This strategic initiative aims to create a centralized digital platform to publicly list academic, research, curriculum, and institutional projects along with their specific faculty requirements. The purpose is to bridge the systemic gap between project needs and faculty availability by institutionalizing a mechanism for transparent listing and expression of interest. Expected outcomes include optimal utilization of faculty expertise, timely completion of strategic projects, and a significant reduction in project delays caused by a lack of structured staff mobilization.",
        skills: ["Systems Analysis", "Workflow Design", "Institutional Policy Implementation", "Internal Communications Strategy", "Change Management", "Academic Administration", "Document Management System integration"],
        facultyCount: 3,
        duration: "4–6 months",
        status: "Open",
        category: "" // Intentionally empty to allow admin to organize later
    },
    {
        title: "DHIU-Integrated Academic Audit (DIAA) Framework Implementation",
        department: "Academic Office / Quality Assurance",
        description: "This high-level quality assurance project mandates the systematic evaluation, assurance, and enhancement of academic processes across DHIU-affiliated Secondary and Senior Secondary Sections. The primary objective is to implement the DIAA Framework, aligning DHIU’s integrated educational model with modern quality assurance standards like TQM. Expected outcomes are the creation of detailed, standardized audit tools (rubrics, checklists, templates), institutional self-evaluation guidelines, and the establishment of a robust system for continuous quality improvement action planning (QIAP).",
        skills: ["Academic Quality Assurance", "Educational Evaluation and Benchmarking", "Total Quality Management (TQM) principles", "Curriculum Assessment and Alignment", "Institutional Governance", "External Peer Review Coordination and Training", "Academic Documentation"],
        facultyCount: 4,
        duration: "10–12 months",
        status: "Open",
        category: ""
    },
    {
        title: "Subject Orientation Video Series Development for Core Subjects",
        department: "Academic Office / Digital Educational Transformation Unit",
        description: "The project focuses on developing a comprehensive series of high-quality instructional videos for 18 core subjects to standardize pedagogical delivery and optimize student learning. It involves producing two distinct videos per subject: \"How to Teach\" for faculty professional development and \"How to Learn\" for student guidance. The core purpose is to establish a standardized, accessible multimedia educational framework that enhances teaching effectiveness, supports student learning outcomes, and facilitates digital educational transformation.",
        skills: ["Subject Matter Expertise", "Instructional Design and Pedagogy", "Scriptwriting for Educational Multimedia", "Curriculum Alignment", "Faculty Professional Development training", "Quality Review for academic content"],
        facultyCount: 18,
        duration: "12–18 months",
        status: "Open",
        category: ""
    },
    {
        title: "Comprehensive Student Welfare & Institutional Development Project (UG Excellence Program)",
        department: "Student Welfare & Guidance Department / Tarbiyah Section",
        description: "This initiative is a multi-dimensional effort to shape a holistic campus environment where every student thrives academically, emotionally, and socially, per the vision of the UG Excellence Program. The project encompasses strengthening infrastructure, welfare services, and guidance systems. Key deliverables include an audit and upgrade plan for basic facilities (hostels, canteen, Wi-Fi), expansion of learning resources (library, labs), and the implementation of a structured system to foster a disciplined, self-motivated student community.",
        skills: ["Student Welfare and Counseling", "Institutional Development", "Facility Management and Auditing", "Tarbiyah Framework Implementation", "Curriculum Integration for life skills", "Community Building", "Project Coordination"],
        facultyCount: 5,
        duration: "24 months",
        status: "Open",
        category: ""
    },
    {
        title: "Annual Darul Huda Scholarship Exam Design and Coordination",
        department: "Academic Office / Exam Control Board (ECB)",
        description: "This recurring annual project involves the full design, coordination, and execution of a competitive academic assessment for students in classes S-1, S-2, S-4, and SS-1. The work includes formally constituting the Exam Control Board and core teams for question paper setting, evaluation, and logistics. The primary purpose is to ensure a standardized, error-free, and competitive exam that objectively assesses proficiency in key domains, identifies academic talent, and provides merit-based recognition.",
        skills: ["Assessment and Evaluation", "Competitive Exam Design and Logistics", "Syllabus Framework Development", "Question Paper Setting and Review", "Administrative Coordination", "Quality Control"],
        facultyCount: 12,
        duration: "Annual Cycle (6–9 months)",
        status: "Open",
        category: ""
    },
    {
        title: "Comprehensive Language Enhancement Plan Implementation (English, Arabic, Urdu)",
        department: "Academic Office / Language Studies Department",
        description: "This plan is dedicated to significantly improving student and teacher proficiency in English, Arabic, and Urdu to support academic excellence and global engagement. The initiative includes the critical phase of teacher capacity building through quarterly Professional Learning Community (PLC) workshops and peer observation cycles. Furthermore, it mandates curriculum and timetable realignment to increase language enrichment periods and integrate communicative language skills across content subjects.",
        skills: ["Foreign Language Pedagogy", "Curriculum Restructure", "Teacher Training and Mentoring", "Professional Learning Community (PLC) Coordination", "Language Assessment", "Communicative Skills Instruction"],
        facultyCount: 4,
        duration: "12 months",
        status: "Open",
        category: ""
    },
    {
        title: "Social & Spiritual Leadership (Da'wah Practicum) Course Development (SSL-101)",
        department: "Policy & Planning / Tarbiyah Section",
        description: "This project transforms the institution's Da'wah (outreach/service) activities into a formal, credit-bearing academic course titled \"Social & Spiritual Leadership\" (SSL-101) for Senior Secondary students. The core purpose is to formalize the module, align it with quality standards such as the IB CAS framework, and shift assessment focus from mere attendance to competence. Deliverables include a final Course Profile (2 credits), a structured 40-60 Assessment Framework, and a comprehensive Operational Handbook.",
        skills: ["Fiqh and Ethics of Da'wah", "Tarbiyah and Moral Education", "Curriculum Development", "Service-Learning Pedagogy", "Assessment Design", "Handbook Drafting and Review", "Quality Assurance Alignment"],
        facultyCount: 2,
        duration: "3 months",
        status: "Open",
        category: ""
    }
];

export default function SeedPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const runSeed = async () => {
        if (!confirm("This will add 7 new projects to the database. Continue?")) return;

        setStatus('loading');
        setLog([]);
        const newLog = [];

        try {
            const collectionRef = collection(db, 'projects');

            for (const p of PROJECTS_TO_SEED) {
                await addDoc(collectionRef, {
                    ...p,
                    createdAt: serverTimestamp(),
                    labels: []
                });
                newLog.push(`Added: ${p.title}`);
                setLog([...newLog]);
            }

            setStatus('success');
            newLog.push("All projects added successfully!");
            setLog([...newLog]);

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            newLog.push(`Error: ${error.message}`);
            setLog([...newLog]);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Project Bulk Import</h1>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <p className="mb-4 text-gray-600">
                    Click the button below to import the 7 default projects into the system.
                    Use this only once to avoid duplicates.
                </p>

                <button
                    onClick={runSeed}
                    disabled={status === 'loading' || status === 'success'}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium ${status === 'success' ? 'bg-green-600' :
                            status === 'loading' ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {status === 'loading' ? 'Importing...' : status === 'success' ? 'Import Completed' : 'Import Projects'}
                </button>

                {log.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded text-sm font-mono border border-gray-200 max-h-60 overflow-y-auto">
                        {log.map((line, i) => <div key={i} className="mb-1">{line}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}
