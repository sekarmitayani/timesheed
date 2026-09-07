import { Role } from "./types";
import {
    LayoutDashboard, Clock, ListTodo, FileText, Target, Wallet,
    History, UserCircle, FolderKanban, Inbox, Users, BarChart3,
    Brain, Settings, Shield, CreditCard, FileSearch, Activity,
    Building2, PieChart, TrendingUp, Scale, Gauge, ClipboardList,
    UserCog, FileKey, Landmark, MonitorCheck, Zap, Package,
    ReceiptText, HandCoins, ClipboardClock, FileSpreadsheet, ArchiveRestore
} from "lucide-react";

export interface MenuItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}

export interface MenuCategory {
    title: string;
    items: MenuItem[];
}

export const roleMenus: Record<Role, MenuCategory[]> = {
    employee: [
        {
            title: "MAIN MENU",
            items: [
                { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "WORK SPACE",
            items: [
                { label: "Tasks", href: "/employee/tasks", icon: ListTodo },
                { label: "Projects", href: "/employee/projects", icon: FolderKanban },
                { label: "Timesheet", href: "/employee/timesheet", icon: ClipboardClock },
                { label: "Earnings", href: "/employee/earnings", icon: Wallet },
            ]
        }
    ],
    projectmanager: [
        {
            title: "MAIN MENU",
            items: [
                { label: "Dashboard", href: "/pm/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "WORK SPACE",
            items: [
                { label: "Tasks", href: "/pm/tasks", icon: ListTodo },
                { label: "Projects", href: "/pm/projects", icon: FolderKanban },
                { label: "Timesheet", href: "/pm/timesheet", icon: ClipboardClock },
                { label: "Earnings", href: "/pm/earnings", icon: Wallet },
            ]
        },
        {
            title: "MANAGEMENT",
            items: [
                { label: "Resource Request", href: "/pm/resources", icon: Package },
                { label: "Approvals", href: "/pm/approvals", icon: Inbox, badge: "AI" },
            ]
        }
    ],
    admin: [
        {
            title: "MAIN MENU",
            items: [
                { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "ADMINISTRATION",
            items: [
                { label: "User Management", href: "/admin/users", icon: UserCog },
                { label: "Contracts", href: "/admin/contracts", icon: ReceiptText },
                { label: "Proxy Login", href: "/admin/proxy-login", icon: Shield },
            ]
        },
        {
            title: "PROJECTS",
            items: [
                { label: "Projects", href: "/admin/projects", icon: FolderKanban },
                { label: "Resource Request", href: "/admin/resources", icon: Package },
                { label: "Approvals", href: "/admin/approvals", icon: Inbox, badge: "AI" },
            ]
        },
        {
            title: "REPORTS",
            items: [
                { label: "Payroll", href: "/admin/payroll", icon: HandCoins },
                { label: "Audit Log", href: "/admin/audit-log", icon: Activity },
                { label: "Trash & Restore", href: "/admin/trash", icon: ArchiveRestore },
                { label: "Import Data", href: "/admin/import", icon: FileSpreadsheet },
            ]
        }
    ],
    management: [
        {
            title: "MAIN MENU",
            items: [
                { label: "Executive Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "WORK SPACE",
            items: [
                { label: "Timesheet", href: "/management/timesheet", icon: ClipboardClock },
                { label: "Earnings", href: "/management/earnings", icon: Wallet },
            ]
        },
        {
            title: "OVERSIGHT",
            items: [
                { label: "Profitability", href: "/management/profitability", icon: TrendingUp },
                { label: "Cost Breakdown", href: "/management/cost-breakdown", icon: PieChart },
                { label: "Liability Monitor", href: "/management/liability", icon: Scale },
                { label: "Resources", href: "/management/resources", icon: Package },
            ]
        },
        {
            title: "REPORTS",
            items: [
                { label: "Reports & Export", href: "/management/reports", icon: FileSpreadsheet },
            ]
        }
    ],
    finance: [
        {
            title: "MAIN MENU",
            items: [
                { label: "Executive Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "WORK SPACE",
            items: [
                { label: "Timesheet", href: "/management/timesheet", icon: ClipboardClock },
                { label: "Earnings", href: "/management/earnings", icon: Wallet },
            ]
        },
        {
            title: "OVERSIGHT",
            items: [
                { label: "Profitability", href: "/management/profitability", icon: TrendingUp },
                { label: "Cost Breakdown", href: "/management/cost-breakdown", icon: PieChart },
                { label: "Liability Monitor", href: "/management/liability", icon: Scale },
                { label: "Resources", href: "/management/resources", icon: Package },
            ]
        },
        {
            title: "REPORTS",
            items: [
                { label: "Reports & Export", href: "/management/reports", icon: FileSpreadsheet },
            ]
        }
    ],
};

export const roleLabels: Record<Role, string> = {
    employee: "Employee",
    projectmanager: "Project Manager",
    admin: "Admin",
    management: "Management",
    finance: "Management",
};

export const roleColors: Record<Role, string> = {
    employee: "bg-blue-600",
    projectmanager: "bg-blue-600",
    admin: "bg-blue-600",
    management: "bg-blue-600",
    finance: "bg-blue-600",
};

export function canAccess(userRole: Role, requiredRole: Role | Role[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(userRole);
}

export function getDefaultRoute(role: Role): string {
    if (role === "projectmanager") return "/pm/dashboard";
    if (role === "management" || role === "finance") return "/management/dashboard";
    return `/${role}/dashboard`;
}
