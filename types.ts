export type UserRole = 'admin' | 'engineer' | 'ctc_watchman' | 'worker' | 'ctc';

export interface User {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    email?: string;
    phone?: string;
}

export interface Fault {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    reportedBy: string; // User ID
    assignedTo?: string; // User ID (Engineer)
    createdAt: string;
    updatedAt: string;
}
