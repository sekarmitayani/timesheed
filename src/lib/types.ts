// ============================================================
// GLOBAL TYPES FOR AI-ENHANCED TIMESHEET SYSTEM
// ============================================================

export type Role = "employee" | "projectmanager" | "admin" | "finance";

export type RiskLevel = "low" | "medium" | "high";
export type WorkloadStatus = "overloaded" | "balanced" | "underutilized";

// ---- User & Auth ----
export interface User {
    id: string;
    full_name: string;
    name: string; // Compatibility with frontend mock data
    email: string;
    phone_number?: string;
    username: string;
    password: string;
    role: Role;
    employee_type: "fulltime" | "parttime" | "freelance" | null;
    avatar: string;
    department: string;
    position: string;
    hourlyRate: number;
    joinDate: string;
    status: "active" | "inactive";
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

// ---- Project (Legacy/Mock) ----
export interface Project {
    id: string;
    name: string;
    client: string;
    status: "active" | "completed" | "on-hold" | "cancelled";
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    totalMandays: number;
    usedMandays: number;
    pmId: string;
    members: string[];
    description: string;
}

// ---- Project (API) ----
export interface ApiProject {
    id: number;
    name: string;
    client_name: string;
    client_email: string | null;
    status: "active" | "completed" | "on-hold" | "cancelled";
    budget_revenue: number | null;
    budget_cost: number | null;
    budget_cost_threshold: number | null;
    actual_cost?: number;
    created_at: string;
    updated_at: string;
    members?: ProjectMember[];
}

export interface ProjectMember {
    id: number;
    project_id: number;
    user_id: number;
    role_in_project: string;
    created_at?: string;
    joined_at?: string;
    user?: {
        id: number;
        email: string;
        full_name: string;
        role?: string;
        phone_number?: string;
    };
}

// ---- Timesheet ----
export interface TimesheetEntry {
    id: string;
    userId: string;
    projectId: string;
    date: string;
    hours: number;
    description: string;
    status: "draft" | "submitted" | "approved" | "rejected";
    clockIn: string;
    clockOut: string;
    overtime: number;
    aiRisk?: AnomalyResult;
}

// ---- Task ----
export interface Task {
    id: string;
    title: string;
    projectId: string;
    assigneeId: string;
    status: "todo" | "in-progress" | "review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string;
    estimatedHours: number;
    loggedHours: number;
    description: string;
}

// ---- Attendance ----
export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string;
    clockIn: string;
    clockOut: string;
    method: "face" | "manual" | "qr";
    faceResult?: FaceRecognitionResult;
    status: "present" | "late" | "absent" | "leave";
    location?: string;
}

// ---- Contract ----
export interface Contract {
    id: string;
    userId: string;
    type: "full-time" | "freelance" | "contract";
    startDate: string;
    endDate: string;
    rate: number;
    rateType: "hourly" | "monthly" | "project";
    status: "active" | "expired" | "pending";
}

// ---- Payment ----
export interface Payment {
    id: string;
    userId: string;
    projectId: string;
    amount: number;
    status: "pending" | "approved" | "released" | "rejected";
    period: string;
    createdAt: string;
    approvedAt?: string;
}

// ---- Milestone ----
export interface Milestone {
    id: string;
    projectId: string;
    title: string;
    dueDate: string;
    status: "pending" | "in-progress" | "completed" | "overdue";
    progress: number;
}

// ---- AI Types ----
export interface AnomalyResult {
    riskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
    aiConfidence: number;
}

export interface ForecastResult {
    predictedValue: number;
    predictedDate?: string;
    growthRate: number;
    confidence: number;
    riskLevel: RiskLevel;
}

export interface FaceRecognitionResult {
    verified: boolean;
    confidence: number;
    antiSpoofCheck: boolean;
    device: string;
    ipAddress: string;
}

export interface WorkloadResult {
    workloadScore: number;
    status: WorkloadStatus;
    burnoutRisk: RiskLevel;
    predictedNextWeekHours: number;
    recommendation: string[];
    aiConfidence: number;
}

// ---- Notification ----
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success" | "ai";
    read: boolean;
    createdAt: string;
}

// ---- Audit Log ----
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    target: string;
    details: string;
    timestamp: string;
    ipAddress: string;
}
