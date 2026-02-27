import { create } from "zustand";
import { User, Project, TimesheetEntry, Task, Contract, Payment, Milestone, AuditLog, AttendanceRecord, FaceRecognitionResult } from "@/lib/types";
import { mockUsers, mockProjects, mockTimesheets, mockTasks, mockContracts, mockPayments, mockMilestones, mockAuditLogs, mockAttendance } from "@/lib/mock-data";

// Active timer for a task
interface ActiveTimer {
    taskId: string;
    startedAt: number;
}

export interface SystemSettings {
    companyName: string;
    timezone: string;
    workHours: string;
    overtimeThreshold: string;
    emailNotifications: boolean;
    slackNotifications: boolean;
    anomalyAlerts: boolean;
    weeklyReports: boolean;
    twoFactor: boolean;
    sessionTimeout: string;
    ipWhitelist: boolean;
    auditRetention: string;
}

// Rate card
export interface RateCard {
    id: string;
    role: string;
    level: string;
    hourly: number;
    monthly: number;
}

interface DataState {
    users: User[];
    projects: Project[];
    timesheets: TimesheetEntry[];
    tasks: Task[];
    contracts: Contract[];
    payments: Payment[];
    milestones: Milestone[];
    auditLogs: AuditLog[];
    attendance: AttendanceRecord[];
    rateCards: RateCard[];

    // ---- System Settings ----
    settings: SystemSettings;
    updateSettings: (updates: Partial<SystemSettings>) => void;

    // ---- Attendance clock state (persists across navigation) ----
    clockedIn: boolean;
    clockInTime: string | null; // HH:MM format
    clockInTimestamp: number | null; // Date.now() for elapsed calc
    clockInFaceResult: FaceRecognitionResult | null;

    clockIn: (faceResult: FaceRecognitionResult) => void;
    clockOut: (userId: string) => void;

    // ---- Task timers (persists across navigation) ----
    activeTimers: ActiveTimer[];
    startTimer: (taskId: string) => void;
    stopTimer: (taskId: string, userId: string) => void;

    // User CRUD
    addUser: (user: Omit<User, "id">) => void;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;

    // Project CRUD
    addProject: (project: Omit<Project, "id">) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;

    // Timesheet actions
    approveTimesheet: (id: string) => void;
    rejectTimesheet: (id: string) => void;
    submitTimesheet: (id: string) => void;

    // Task CRUD
    addTask: (task: Omit<Task, "id">) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    moveTask: (id: string, status: Task["status"]) => void;

    // Contract CRUD
    addContract: (contract: Omit<Contract, "id">) => void;
    updateContract: (id: string, updates: Partial<Contract>) => void;
    deleteContract: (id: string) => void;

    // Payment actions
    releasePayment: (id: string) => void;
    approvePayment: (id: string) => void;

    // Milestone actions
    updateMilestone: (id: string, updates: Partial<Milestone>) => void;

    // Audit log
    addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;

    // Rate Card CRUD
    addRateCard: (rc: Omit<RateCard, "id">) => void;
    updateRateCard: (id: string, updates: Partial<RateCard>) => void;
    deleteRateCard: (id: string) => void;
}

let nextId = 100;
const genId = (prefix: string) => `${prefix}${nextId++}`;

const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export const useDataStore = create<DataState>((set, get) => ({
    users: [...mockUsers],
    projects: [...mockProjects],
    timesheets: [...mockTimesheets],
    tasks: [...mockTasks],
    contracts: [...mockContracts],
    payments: [...mockPayments],
    milestones: [...mockMilestones],
    auditLogs: [...mockAuditLogs],
    attendance: [...mockAttendance],
    rateCards: [
        { id: "rc1", role: "Frontend Developer", level: "Junior", hourly: 120000, monthly: 12000000 },
        { id: "rc2", role: "Frontend Developer", level: "Senior", hourly: 180000, monthly: 18000000 },
        { id: "rc3", role: "Backend Developer", level: "Junior", hourly: 130000, monthly: 13000000 },
        { id: "rc4", role: "Backend Developer", level: "Senior", hourly: 200000, monthly: 20000000 },
        { id: "rc5", role: "UI/UX Designer", level: "Mid", hourly: 140000, monthly: 14000000 },
        { id: "rc6", role: "QA Engineer", level: "Mid", hourly: 110000, monthly: 11000000 },
        { id: "rc7", role: "Project Manager", level: "Senior", hourly: 220000, monthly: 22000000 },
    ],

    // ---- System Settings ----
    settings: {
        companyName: "PT Timesheet Corp",
        timezone: "Asia/Jakarta",
        workHours: "8",
        overtimeThreshold: "10",
        emailNotifications: true,
        slackNotifications: false,
        anomalyAlerts: true,
        weeklyReports: true,
        twoFactor: false,
        sessionTimeout: "30",
        ipWhitelist: false,
        auditRetention: "90",
    },
    updateSettings: (updates) => set((s) => ({
        settings: { ...s.settings, ...updates },
    })),

    // ---- Attendance Clock State ----
    clockedIn: false,
    clockInTime: null,
    clockInTimestamp: null,
    clockInFaceResult: null,

    clockIn: (faceResult) => {
        const now = new Date();
        set({
            clockedIn: true,
            clockInTime: formatTime(now),
            clockInTimestamp: Date.now(),
            clockInFaceResult: faceResult,
        });
    },

    clockOut: (userId) => {
        const { clockInTime, clockInFaceResult, clockInTimestamp } = get();
        const now = new Date();
        const clockOutTime = formatTime(now);
        const isLate = clockInTime ? parseInt(clockInTime.split(":")[0]) >= 9 : false;

        // Calculate hours worked
        const hoursWorked = clockInTimestamp ? Math.round(((Date.now() - clockInTimestamp) / 3600000) * 10) / 10 : 0;
        const displayHours = hoursWorked > 0 ? hoursWorked : 8; // fallback for demo

        // Add attendance record to the list
        const newRecord: AttendanceRecord = {
            id: genId("a"),
            userId,
            date: now.toISOString().split("T")[0],
            clockIn: clockInTime || formatTime(now),
            clockOut: clockOutTime,
            method: "face",
            status: isLate ? "late" : "present",
            faceResult: clockInFaceResult || undefined,
        };

        set((s) => ({
            clockedIn: false,
            clockInTime: null,
            clockInTimestamp: null,
            clockInFaceResult: null,
            attendance: [newRecord, ...s.attendance],
        }));
    },

    // ---- Task Timers ----
    activeTimers: [],

    startTimer: (taskId) => set((s) => ({
        activeTimers: [...s.activeTimers.filter(t => t.taskId !== taskId), { taskId, startedAt: Date.now() }],
    })),

    stopTimer: (taskId, userId) => {
        const timer = get().activeTimers.find(t => t.taskId === taskId);
        if (!timer) return;

        const elapsed = (Date.now() - timer.startedAt) / 3600000; // hours
        const roundedHours = Math.max(0.1, Math.round(elapsed * 10) / 10);
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        // Update task logged hours
        get().updateTask(taskId, { loggedHours: task.loggedHours + roundedHours });

        // Create timesheet entry
        const now = new Date();
        const startTime = new Date(timer.startedAt);
        const newEntry: TimesheetEntry = {
            id: genId("ts"),
            userId,
            projectId: task.projectId,
            date: now.toISOString().split("T")[0],
            hours: roundedHours,
            description: `Tracked time: ${task.title}`,
            status: "draft",
            clockIn: formatTime(startTime),
            clockOut: formatTime(now),
            overtime: Math.max(0, roundedHours - 8),
        };

        set((s) => ({
            activeTimers: s.activeTimers.filter(t => t.taskId !== taskId),
            timesheets: [newEntry, ...s.timesheets],
        }));
    },

    // --- Users ---
    addUser: (user) => set((s) => ({
        users: [...s.users, { ...user, id: genId("u") }],
    })),
    updateUser: (id, updates) => set((s) => ({
        users: s.users.map((u) => u.id === id ? { ...u, ...updates } : u),
    })),
    deleteUser: (id) => set((s) => ({
        users: s.users.filter((u) => u.id !== id),
    })),

    // --- Projects ---
    addProject: (project) => set((s) => ({
        projects: [...s.projects, { ...project, id: genId("p") }],
    })),
    updateProject: (id, updates) => set((s) => ({
        projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p),
    })),

    // --- Timesheets ---
    approveTimesheet: (id) => {
        set((s) => ({
            timesheets: s.timesheets.map((t) => t.id === id ? { ...t, status: "approved" as const } : t),
        }));
        get().addAuditLog({ userId: "u6", action: "APPROVE_TIMESHEET", target: id, details: `Approved timesheet ${id}`, ipAddress: "192.168.1.100" });
    },
    rejectTimesheet: (id) => {
        set((s) => ({
            timesheets: s.timesheets.map((t) => t.id === id ? { ...t, status: "rejected" as const } : t),
        }));
        get().addAuditLog({ userId: "u6", action: "REJECT_TIMESHEET", target: id, details: `Rejected timesheet ${id}`, ipAddress: "192.168.1.100" });
    },
    submitTimesheet: (id) => set((s) => ({
        timesheets: s.timesheets.map((t) => t.id === id ? { ...t, status: "submitted" as const } : t),
    })),

    // --- Tasks ---
    addTask: (task) => set((s) => ({
        tasks: [...s.tasks, { ...task, id: genId("t") }],
    })),
    updateTask: (id, updates) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
    })),
    deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
    })),
    moveTask: (id, status) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
    })),

    // --- Contracts ---
    addContract: (contract) => set((s) => ({
        contracts: [...s.contracts, { ...contract, id: genId("c") }],
    })),
    updateContract: (id, updates) => set((s) => ({
        contracts: s.contracts.map((c) => c.id === id ? { ...c, ...updates } : c),
    })),
    deleteContract: (id) => set((s) => ({
        contracts: s.contracts.filter((c) => c.id !== id),
    })),

    // --- Payments ---
    releasePayment: (id) => {
        set((s) => ({
            payments: s.payments.map((p) => p.id === id ? { ...p, status: "released" as const } : p),
        }));
        get().addAuditLog({ userId: "u6", action: "RELEASE_PAYMENT", target: id, details: `Released payment ${id}`, ipAddress: "192.168.1.100" });
    },
    approvePayment: (id) => set((s) => ({
        payments: s.payments.map((p) => p.id === id ? { ...p, status: "approved" as const } : p),
    })),

    // --- Milestones ---
    updateMilestone: (id, updates) => set((s) => ({
        milestones: s.milestones.map((m) => m.id === id ? { ...m, ...updates } : m),
    })),

    // --- Audit Logs ---
    addAuditLog: (log) => set((s) => ({
        auditLogs: [{ ...log, id: genId("al"), timestamp: new Date().toISOString() }, ...s.auditLogs],
    })),

    // --- Rate Cards ---
    addRateCard: (rc) => set((s) => ({
        rateCards: [...s.rateCards, { ...rc, id: `rc${Date.now()}` }],
    })),
    updateRateCard: (id, updates) => set((s) => ({
        rateCards: s.rateCards.map((r) => r.id === id ? { ...r, ...updates } : r),
    })),
    deleteRateCard: (id) => set((s) => ({
        rateCards: s.rateCards.filter((r) => r.id !== id),
    })),
}));
