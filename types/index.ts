export interface Project {
    id: string;
    title: string;
    department: string;
    description: string;
    skills: string[]; // Array of strings
    facultyCount: number; // Number of faculty required
    duration: string; // e.g., "3 Months", "1 Year"
    status: 'Open' | 'Partial' | 'Closed';
    category: string; // "Secondary", "Senior Secondary", "Degree", "PG"
    labels?: string[]; // Admin labels
    createdAt: any;
    createdBy: string;
}

export interface Application {
    id: string;
    projectId: string;
    projectTitle: string; // Denormalized for easier display
    userId: string;
    // Applicant Personal Details
    applicantName: string;
    place: string;
    phone: string;
    whatsapp: string; // boolean tick in UI, but string value ok, or boolean? Report says "tick for same", so usually stores the number. Let's store the number.
    email: string;

    // Professional Details
    qualifications: string;
    relevantExperience: string; // "relevant expertise and experience"

    // Engagement Preferences
    availabilityWindow: string;
    weeklyCommitment: string;
    preferredRole: 'Lead' | 'Member' | 'Reviewer' | 'Trainer' | 'Coordinator' | 'Other';
    modePreference: 'Online' | 'Onsite' | 'Hybrid';

    // Meta
    remarks?: string;
    status: 'pending' | 'approved' | 'rejected';
    appliedAt: any;
}

export interface UserProfile {
    uid: string;
    email: string;
    role: 'admin' | 'faculty';
    // Potential future fields from "Feature Report"
}
