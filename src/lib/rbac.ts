import { Role } from "./types";
import {
    LayoutDashboard, Clock, ListTodo, FileText, Target, DollarSign,
    History, UserCircle, FolderKanban, Inbox, Users, BarChart3,
    Brain, Settings, Shield, CreditCard, FileSearch, Activity,
    Building2, PieChart, TrendingUp, Scale, Gauge, ClipboardList,
    UserCog, FileKey, Landmark, MonitorCheck, Zap
} from "lucide-react";

export interface MenuItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}

export const roleMenus: Record<Role, MenuItem[]> = {
    employee: [
        { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { label: "Attendance", href: "/employee/attendance", icon: Clock },
        { label: "My Tasks", href: "/employee/tasks", icon: ListTodo },
        { label: "Timesheet", href: "/employee/timesheet", icon: FileText },
        { label: "Milestones", href: "/employee/milestones", icon: Target },
        { label: "Earnings", href: "/employee/earnings", icon: DollarSign },
        { label: "History", href: "/employee/history", icon: History },
        { label: "Profile", href: "/employee/profile", icon: UserCircle },
    ],
    pm: [
        { label: "Dashboard", href: "/pm/dashboard", icon: LayoutDashboard },
        { label: "My Projects", href: "/pm/projects", icon: FolderKanban },
        { label: "Approvals", href: "/pm/approvals", icon: Inbox, badge: "AI" },
        { label: "Team & Tasks", href: "/pm/team", icon: Users },
        { label: "Budget Monitor", href: "/pm/budget", icon: BarChart3 },
        { label: "Workload AI", href: "/pm/workload", icon: Brain },
        { label: "Requests", href: "/pm/requests", icon: FileSearch },
        { label: "Reports", href: "/pm/reports", icon: ClipboardList },
    ],
    admin: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "User Management", href: "/admin/users", icon: UserCog },
        { label: "Contracts", href: "/admin/contracts", icon: FileKey },
        { label: "Projects", href: "/admin/projects", icon: FolderKanban },
        { label: "Rate Cards", href: "/admin/rate-cards", icon: CreditCard },
        { label: "Proxy Login", href: "/admin/proxy-login", icon: Shield },
        { label: "Payments", href: "/admin/payments", icon: Landmark },
        { label: "Audit Log", href: "/admin/audit-log", icon: Activity },
        { label: "Settings", href: "/admin/settings", icon: Settings },
        { label: "AI Monitoring", href: "/admin/ai-monitoring", icon: MonitorCheck },
    ],
    management: [
        { label: "Executive Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
        { label: "Profitability", href: "/management/profitability", icon: TrendingUp },
        { label: "Cost Breakdown", href: "/management/cost-breakdown", icon: PieChart },
        { label: "Liability Monitor", href: "/management/liability", icon: Scale },
        { label: "Utilization", href: "/management/resources", icon: Gauge },
        { label: "Workload Overview", href: "/management/workload", icon: Zap },
        { label: "Reports & Export", href: "/management/reports", icon: Building2 },
        { label: "Audit & Compliance", href: "/management/audit", icon: ClipboardList },
    ],
};

export const roleLabels: Record<Role, string> = {
    employee: "Employee",
    pm: "Project Manager",
    admin: "Admin",
    management: "Management",
};

export const roleColors: Record<Role, string> = {
    employee: "bg-[#2568C1]",
    pm: "bg-[#2568C1]",
    admin: "bg-[#2568C1]",
    management: "bg-[#2568C1]",
};

export function canAccess(userRole: Role, requiredRole: Role | Role[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(userRole);
}

export function getDefaultRoute(role: Role): string {
    return `/${role}/dashboard`;
}
