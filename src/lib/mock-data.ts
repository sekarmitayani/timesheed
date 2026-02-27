import {
    User, Project, TimesheetEntry, Task, AttendanceRecord,
    Contract, Payment, Milestone, Notification, AuditLog
} from "./types";

// ============================================================
// MOCK USERS
// ============================================================
export const mockUsers: User[] = [
    { id: "u1", name: "Andi Pratama", email: "andi@gmail.com", username: "andi", password: "password123", role: "employee", department: "Engineering", position: "Frontend Developer", hourlyRate: 150000, joinDate: "2023-01-15", status: "active", avatar: "" },
    { id: "u2", name: "Sari Dewi", email: "sari@gmail.com", username: "sari", password: "password123", role: "employee", department: "Engineering", position: "Backend Developer", hourlyRate: 160000, joinDate: "2022-06-01", status: "active", avatar: "" },
    { id: "u3", name: "Budi Santoso", email: "budi@gmail.com", username: "budi", password: "password123", role: "employee", department: "Design", position: "UI/UX Designer", hourlyRate: 140000, joinDate: "2023-03-20", status: "active", avatar: "" },
    { id: "u4", name: "Rina Wulandari", email: "rina@gmail.com", username: "rina", password: "password123", role: "pm", department: "Management", position: "Project Manager", hourlyRate: 200000, joinDate: "2021-09-01", status: "active", avatar: "" },
    { id: "u5", name: "Celino Matande Wardana", email: "celino@gmail.com", username: "celino", password: "password123", role: "pm", department: "Management", position: "Senior PM", hourlyRate: 220000, joinDate: "2020-01-15", status: "active", avatar: "" },
    { id: "u6", name: "Sekar Mitayani", email: "sekar@gmail.com", username: "sekar", password: "password123", role: "admin", department: "Operations", position: "Admin Manager", hourlyRate: 180000, joinDate: "2021-03-01", status: "active", avatar: "" },
    { id: "u7", name: "Jaziel Abyaz Audrio", email: "jaziel@gmail.com", username: "jaziel", password: "password123", role: "management", department: "Finance", position: "Finance Director", hourlyRate: 300000, joinDate: "2019-06-01", status: "active", avatar: "" },
    { id: "u8", name: "Lina Hartono", email: "lina@gmail.com", username: "lina", password: "password123", role: "employee", department: "Engineering", position: "Full Stack Developer", hourlyRate: 170000, joinDate: "2023-07-10", status: "active", avatar: "" },
    { id: "u9", name: "Reza Firmansyah", email: "reza@gmail.com", username: "reza", password: "password123", role: "employee", department: "QA", position: "QA Engineer", hourlyRate: 130000, joinDate: "2023-02-01", status: "active", avatar: "" },
    { id: "u10", name: "Putri Anggraeni", email: "putri@gmail.com", username: "putri", password: "password123", role: "employee", department: "Design", position: "Graphic Designer", hourlyRate: 120000, joinDate: "2023-09-15", status: "active", avatar: "" },
];

// ============================================================
// MOCK PROJECTS
// ============================================================
export const mockProjects: Project[] = [
    { id: "p1", name: "E-Commerce Platform v3", client: "PT Tokoku Digital", status: "active", startDate: "2025-11-01", endDate: "2026-04-30", budget: 500000000, spent: 287000000, totalMandays: 120, usedMandays: 72, pmId: "u4", members: ["u1", "u2", "u3", "u8"], description: "Full redesign and rebuild of e-commerce platform." },
    { id: "p2", name: "HR Management System", client: "Bank Nusantara", status: "active", startDate: "2025-12-01", endDate: "2026-06-30", budget: 350000000, spent: 98000000, totalMandays: 90, usedMandays: 28, pmId: "u4", members: ["u2", "u9"], description: "Internal HR management portal." },
    { id: "p3", name: "Mobile Banking App", client: "Bank Nusantara", status: "active", startDate: "2025-10-01", endDate: "2026-03-31", budget: 750000000, spent: 520000000, totalMandays: 150, usedMandays: 118, pmId: "u5", members: ["u1", "u8", "u3"], description: "Next-gen mobile banking application." },
    { id: "p4", name: "Analytics Dashboard", client: "DataCorp Indonesia", status: "on-hold", startDate: "2025-09-15", endDate: "2026-02-28", budget: 200000000, spent: 145000000, totalMandays: 60, usedMandays: 45, pmId: "u5", members: ["u1", "u10"], description: "Real-time analytics dashboard for business intelligence." },
    { id: "p5", name: "Supply Chain Portal", client: "LogisTech", status: "completed", startDate: "2025-06-01", endDate: "2025-12-31", budget: 420000000, spent: 395000000, totalMandays: 100, usedMandays: 98, pmId: "u4", members: ["u2", "u9", "u10"], description: "End-to-end supply chain management." },
];

// ============================================================
// MOCK TIMESHEET ENTRIES
// ============================================================
function generateTimesheets(): TimesheetEntry[] {
    const entries: TimesheetEntry[] = [];
    const days = ["2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-13", "2026-02-14", "2026-02-12"];
    const statuses: TimesheetEntry["status"][] = ["submitted", "approved", "draft", "submitted", "approved", "approved", "rejected"];
    let id = 1;
    for (const user of mockUsers.filter(u => u.role === "employee")) {
        for (let i = 0; i < days.length; i++) {
            const hours = [8, 9, 7.5, 10, 13, 6, 14][i % 7];
            const clockIn = hours > 12 ? "04:30" : "08:30";
            const clockOut = hours > 12 ? "23:30" : `${8 + hours}:30`;
            entries.push({
                id: `ts${id++}`, userId: user.id, projectId: mockProjects[id % mockProjects.length].id,
                date: days[i], hours, description: `Development work on ${mockProjects[id % mockProjects.length].name}`,
                status: statuses[i], clockIn, clockOut, overtime: Math.max(0, hours - 8),
            });
        }
    }
    return entries;
}
export const mockTimesheets: TimesheetEntry[] = generateTimesheets();

// ============================================================
// MOCK TASKS
// ============================================================
export const mockTasks: Task[] = [
    { id: "t1", title: "Implement Login Flow", projectId: "p1", assigneeId: "u1", status: "done", priority: "high", dueDate: "2026-02-10", estimatedHours: 16, loggedHours: 14, description: "OAuth + JWT login implementation" },
    { id: "t2", title: "Design Product Page", projectId: "p1", assigneeId: "u3", status: "in-progress", priority: "medium", dueDate: "2026-02-20", estimatedHours: 24, loggedHours: 18, description: "Redesign product detail page" },
    { id: "t3", title: "API Integration - Payment", projectId: "p1", assigneeId: "u2", status: "in-progress", priority: "urgent", dueDate: "2026-02-18", estimatedHours: 32, loggedHours: 28, description: "Integrate payment gateway APIs" },
    { id: "t4", title: "Unit Tests - Auth Module", projectId: "p2", assigneeId: "u9", status: "todo", priority: "medium", dueDate: "2026-02-25", estimatedHours: 12, loggedHours: 0, description: "Write comprehensive auth tests" },
    { id: "t5", title: "Mobile UI Components", projectId: "p3", assigneeId: "u1", status: "in-progress", priority: "high", dueDate: "2026-02-22", estimatedHours: 40, loggedHours: 32, description: "Build reusable mobile UI kit" },
    { id: "t6", title: "Database Schema Update", projectId: "p2", assigneeId: "u2", status: "review", priority: "high", dueDate: "2026-02-19", estimatedHours: 8, loggedHours: 7, description: "Migrate to new schema format" },
    { id: "t7", title: "Dashboard Charts", projectId: "p4", assigneeId: "u1", status: "todo", priority: "low", dueDate: "2026-03-01", estimatedHours: 20, loggedHours: 0, description: "Implement analytics chart widgets" },
    { id: "t8", title: "Logo Redesign", projectId: "p1", assigneeId: "u10", status: "done", priority: "low", dueDate: "2026-02-15", estimatedHours: 8, loggedHours: 6, description: "New brand logo" },
    { id: "t9", title: "Performance Optimization", projectId: "p3", assigneeId: "u8", status: "in-progress", priority: "urgent", dueDate: "2026-02-19", estimatedHours: 16, loggedHours: 12, description: "Optimize app loading speed" },
    { id: "t10", title: "QA Regression Test", projectId: "p3", assigneeId: "u9", status: "todo", priority: "high", dueDate: "2026-02-21", estimatedHours: 24, loggedHours: 0, description: "Full regression testing" },
    { id: "t11", title: "User Settings Page", projectId: "p1", assigneeId: "u8", status: "in-progress", priority: "medium", dueDate: "2026-02-23", estimatedHours: 12, loggedHours: 5, description: "Settings & preferences page" },
    { id: "t12", title: "API Documentation", projectId: "p2", assigneeId: "u2", status: "todo", priority: "low", dueDate: "2026-03-05", estimatedHours: 10, loggedHours: 0, description: "Swagger/OpenAPI docs" },
];

// ============================================================
// MOCK ATTENDANCE
// ============================================================
export const mockAttendance: AttendanceRecord[] = [
    { id: "a1", userId: "u1", date: "2026-02-19", clockIn: "08:15", clockOut: "17:30", method: "face", status: "present", faceResult: { verified: true, confidence: 0.95, antiSpoofCheck: true, device: "Webcam HD Pro", ipAddress: "192.168.1.45" } },
    { id: "a2", userId: "u1", date: "2026-02-18", clockIn: "08:45", clockOut: "17:15", method: "face", status: "present", faceResult: { verified: true, confidence: 0.92, antiSpoofCheck: true, device: "Webcam HD Pro", ipAddress: "192.168.1.45" } },
    { id: "a3", userId: "u1", date: "2026-02-17", clockIn: "09:10", clockOut: "18:00", method: "face", status: "late", faceResult: { verified: true, confidence: 0.88, antiSpoofCheck: true, device: "Webcam HD Pro", ipAddress: "192.168.1.45" } },
    { id: "a4", userId: "u2", date: "2026-02-19", clockIn: "08:00", clockOut: "17:00", method: "face", status: "present", faceResult: { verified: true, confidence: 0.97, antiSpoofCheck: true, device: "MacBook Camera", ipAddress: "192.168.1.52" } },
    { id: "a5", userId: "u3", date: "2026-02-19", clockIn: "08:30", clockOut: "17:30", method: "manual", status: "present" },
    { id: "a6", userId: "u8", date: "2026-02-19", clockIn: "07:55", clockOut: "19:00", method: "face", status: "present", faceResult: { verified: true, confidence: 0.91, antiSpoofCheck: true, device: "Door Camera", ipAddress: "192.168.1.10" } },
    { id: "a7", userId: "u9", date: "2026-02-19", clockIn: "08:20", clockOut: "17:20", method: "qr", status: "present" },
    { id: "a8", userId: "u10", date: "2026-02-19", clockIn: "", clockOut: "", method: "manual", status: "absent" },
];

// ============================================================
// MOCK CONTRACTS
// ============================================================
export const mockContracts: Contract[] = [
    { id: "c1", userId: "u1", type: "full-time", startDate: "2023-01-15", endDate: "2026-12-31", rate: 15000000, rateType: "monthly", status: "active" },
    { id: "c2", userId: "u2", type: "full-time", startDate: "2022-06-01", endDate: "2026-12-31", rate: 18000000, rateType: "monthly", status: "active" },
    { id: "c3", userId: "u3", type: "freelance", startDate: "2025-01-01", endDate: "2026-06-30", rate: 140000, rateType: "hourly", status: "active" },
    { id: "c4", userId: "u8", type: "contract", startDate: "2023-07-10", endDate: "2026-07-09", rate: 17000000, rateType: "monthly", status: "active" },
    { id: "c5", userId: "u9", type: "full-time", startDate: "2023-02-01", endDate: "2026-12-31", rate: 12000000, rateType: "monthly", status: "active" },
    { id: "c6", userId: "u10", type: "freelance", startDate: "2025-09-15", endDate: "2026-03-14", rate: 120000, rateType: "hourly", status: "active" },
];

// ============================================================
// MOCK PAYMENTS
// ============================================================
export const mockPayments: Payment[] = [
    { id: "pay1", userId: "u1", projectId: "p1", amount: 15000000, status: "released", period: "2026-01", createdAt: "2026-01-28", approvedAt: "2026-01-30" },
    { id: "pay2", userId: "u2", projectId: "p1", amount: 18000000, status: "released", period: "2026-01", createdAt: "2026-01-28", approvedAt: "2026-01-30" },
    { id: "pay3", userId: "u3", projectId: "p1", amount: 8400000, status: "approved", period: "2026-02", createdAt: "2026-02-15" },
    { id: "pay4", userId: "u1", projectId: "p3", amount: 15000000, status: "pending", period: "2026-02", createdAt: "2026-02-15" },
    { id: "pay5", userId: "u8", projectId: "p3", amount: 17000000, status: "pending", period: "2026-02", createdAt: "2026-02-15" },
    { id: "pay6", userId: "u9", projectId: "p2", amount: 12000000, status: "approved", period: "2026-02", createdAt: "2026-02-15" },
];

// ============================================================
// MOCK MILESTONES
// ============================================================
export const mockMilestones: Milestone[] = [
    { id: "m1", projectId: "p1", title: "MVP Launch", dueDate: "2026-02-28", status: "in-progress", progress: 72 },
    { id: "m2", projectId: "p1", title: "Payment Integration", dueDate: "2026-03-15", status: "pending", progress: 35 },
    { id: "m3", projectId: "p2", title: "Phase 1 - Core HR", dueDate: "2026-03-31", status: "in-progress", progress: 45 },
    { id: "m4", projectId: "p3", title: "Beta Release", dueDate: "2026-02-20", status: "in-progress", progress: 88 },
    { id: "m5", projectId: "p3", title: "Production Launch", dueDate: "2026-03-31", status: "pending", progress: 10 },
    { id: "m6", projectId: "p4", title: "Dashboard v1", dueDate: "2026-02-28", status: "overdue", progress: 60 },
];

// ============================================================
// MOCK NOTIFICATIONS
// ============================================================
export const mockNotifications: Notification[] = [
    { id: "n1", title: "AI Alert: Anomaly Detected", message: "Unusual overtime pattern detected for Andi Pratama", type: "ai", read: false, createdAt: "2026-02-19T10:30:00" },
    { id: "n2", title: "Timesheet Approved", message: "Your timesheet for Feb 12-16 has been approved", type: "success", read: false, createdAt: "2026-02-19T09:15:00" },
    { id: "n3", title: "Budget Warning", message: "Mobile Banking App budget is 85% consumed", type: "warning", read: false, createdAt: "2026-02-18T16:45:00" },
    { id: "n4", title: "New Task Assigned", message: "Dashboard Charts has been assigned to you", type: "info", read: true, createdAt: "2026-02-18T14:00:00" },
    { id: "n5", title: "AI: Burnout Risk", message: "Employee Lina Hartono shows high burnout risk", type: "ai", read: false, createdAt: "2026-02-18T11:30:00" },
    { id: "n6", title: "Payment Released", message: "January salary has been released", type: "success", read: true, createdAt: "2026-02-01T08:00:00" },
];

// ============================================================
// MOCK AUDIT LOGS
// ============================================================
export const mockAuditLogs: AuditLog[] = [
    { id: "al1", userId: "u6", action: "APPROVE_TIMESHEET", target: "ts12", details: "Approved timesheet for Andi Pratama", timestamp: "2026-02-19T10:30:00", ipAddress: "192.168.1.100" },
    { id: "al2", userId: "u4", action: "CREATE_PROJECT", target: "p2", details: "Created project HR Management System", timestamp: "2026-02-18T09:00:00", ipAddress: "192.168.1.55" },
    { id: "al3", userId: "u6", action: "RELEASE_PAYMENT", target: "pay1", details: "Released payment for Andi Pratama", timestamp: "2026-02-17T14:00:00", ipAddress: "192.168.1.100" },
    { id: "al4", userId: "u7", action: "VIEW_REPORT", target: "financial-q1", details: "Viewed Q1 Financial Report", timestamp: "2026-02-16T11:30:00", ipAddress: "192.168.1.200" },
    { id: "al5", userId: "u6", action: "UPDATE_USER", target: "u10", details: "Updated Putri Anggraeni contract status", timestamp: "2026-02-15T16:45:00", ipAddress: "192.168.1.100" },
];

// ============================================================
// CHART DATA HELPERS
// ============================================================
export const weeklyHoursData = [
    { week: "Week 1", hours: 38, target: 40 },
    { week: "Week 2", hours: 42, target: 40 },
    { week: "Week 3", hours: 45, target: 40 },
    { week: "Week 4", hours: 41, target: 40 },
    { week: "Week 5", hours: 48, target: 40 },
    { week: "Week 6", hours: 52, target: 40 },
    { week: "Week 7", hours: 39, target: 40 },
    { week: "Week 8", hours: 44, target: 40 },
];

export const budgetTrendData = [
    { month: "Sep", actual: 45000000, projected: 42000000 },
    { month: "Oct", actual: 62000000, projected: 58000000 },
    { month: "Nov", actual: 78000000, projected: 74000000 },
    { month: "Dec", actual: 95000000, projected: 90000000 },
    { month: "Jan", actual: 112000000, projected: 106000000 },
    { month: "Feb", actual: 135000000, projected: 122000000 },
    { month: "Mar", actual: null, projected: 148000000 },
    { month: "Apr", actual: null, projected: 172000000 },
];

export const revenueData = [
    { month: "Sep", revenue: 120000000, cost: 45000000, profit: 75000000 },
    { month: "Oct", revenue: 145000000, cost: 62000000, profit: 83000000 },
    { month: "Nov", revenue: 138000000, cost: 78000000, profit: 60000000 },
    { month: "Dec", revenue: 167000000, cost: 95000000, profit: 72000000 },
    { month: "Jan", revenue: 155000000, cost: 112000000, profit: 43000000 },
    { month: "Feb", revenue: 180000000, cost: 135000000, profit: 45000000 },
];

export const workloadHeatmapData = [
    { name: "Andi Pratama", mon: 9, tue: 10, wed: 8, thu: 12, fri: 7, score: 82 },
    { name: "Sari Dewi", mon: 8, tue: 8, wed: 9, thu: 8, fri: 8, score: 65 },
    { name: "Budi Santoso", mon: 6, tue: 7, wed: 5, thu: 6, fri: 4, score: 38 },
    { name: "Lina Hartono", mon: 10, tue: 11, wed: 12, thu: 10, fri: 11, score: 91 },
    { name: "Reza Firmansyah", mon: 7, tue: 8, wed: 7, thu: 8, fri: 7, score: 55 },
    { name: "Putri Anggraeni", mon: 4, tue: 5, wed: 3, thu: 5, fri: 4, score: 28 },
];
