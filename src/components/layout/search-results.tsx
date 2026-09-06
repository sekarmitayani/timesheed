"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderKanban, Users, ListTodo, SearchX, Loader2, Zap, ReceiptText, Package, ClipboardClock, HandCoins, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

type SearchCategory = "shortcut" | "project" | "user" | "task" | "contract" | "resource_request" | "timesheet" | "payroll" | "audit_log";

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: SearchCategory;
    href: string;
}

interface SearchResultsProps {
    query: string;
    role: Role;
    activeIndex: number;
    onSelect: () => void;
}

const categoryConfig: Record<SearchCategory, { label: string, icon: any, color: string }> = {
    shortcut: { label: "Quick Link", icon: Zap, color: "text-amber-500 bg-amber-50" },
    project: { label: "Projects", icon: FolderKanban, color: "text-blue-600 bg-blue-50" },
    user: { label: "Users", icon: Users, color: "text-violet-600 bg-violet-50" },
    task: { label: "Tasks", icon: ListTodo, color: "text-amber-600 bg-amber-50" },
    contract: { label: "Contracts", icon: ReceiptText, color: "text-indigo-600 bg-indigo-50" },
    resource_request: { label: "Resource Requests", icon: Package, color: "text-rose-600 bg-rose-50" },
    timesheet: { label: "Timesheets", icon: ClipboardClock, color: "text-emerald-600 bg-emerald-50" },
    payroll: { label: "Payroll", icon: HandCoins, color: "text-green-600 bg-green-50" },
    audit_log: { label: "Audit Logs", icon: Activity, color: "text-slate-600 bg-slate-50" },
};

function getProjectHref(role: Role, id: string): string {
    if (role === "admin") return `/admin/projects/${id}`;
    if (role === "projectmanager") return `/pm/projects/${id}`;
    if (role === "employee") return `/employee/projects/${id}`;
    return `/management/cost-breakdown`;
}

function getTaskHref(role: Role): string {
    if (role === "employee") return "/employee/tasks";
    if (role === "projectmanager") return "/pm/tasks";
    return "/admin/dashboard";
}

function getShortcuts(query: string, role: Role): SearchResult[] {
    const res: SearchResult[] = [];
    const q = query.toLowerCase();

    const mapping: Record<Role, { keys: string[], href: string, title: string }[]> = {
        admin: [
            { keys: ["user", "pengguna", "pegawai"], href: "/admin/users", title: "User Management" },
            { keys: ["contract", "kontrak"], href: "/admin/contracts", title: "Contracts" },
            { keys: ["project", "proyek"], href: "/admin/projects", title: "Projects" },
            { keys: ["resource", "request", "permintaan"], href: "/admin/resources", title: "Resource Requests" },
            { keys: ["payroll", "gaji", "pembayaran"], href: "/admin/payroll", title: "Payroll" },
            { keys: ["audit", "log", "aktivitas"], href: "/admin/audit-log", title: "Audit Log" },
        ],
        projectmanager: [
            { keys: ["project", "proyek"], href: "/pm/projects", title: "My Projects" },
            { keys: ["task", "tugas"], href: "/pm/tasks", title: "Tasks" },
            { keys: ["resource", "request", "permintaan"], href: "/pm/resources", title: "Resource Requests" },
            { keys: ["approval", "timesheet"], href: "/pm/approvals", title: "Approvals" },
        ],
        employee: [
            { keys: ["task", "tugas"], href: "/employee/tasks", title: "Tasks" },
            { keys: ["project", "proyek"], href: "/employee/projects", title: "Projects" },
            { keys: ["timesheet", "waktu"], href: "/employee/timesheet", title: "Timesheet" },
            { keys: ["earning", "pendapatan", "gaji"], href: "/employee/earnings", title: "Earnings" },
        ],
        management: [
            { keys: ["profit", "keuntungan"], href: "/management/profitability", title: "Profitability" },
            { keys: ["cost", "biaya"], href: "/management/cost-breakdown", title: "Cost Breakdown" },
            { keys: ["liability", "tanggungan"], href: "/management/liability-monitor", title: "Liability Monitor" },
            { keys: ["resource", "request", "permintaan"], href: "/management/resources", title: "Resources" },
            { keys: ["report", "laporan"], href: "/management/reports", title: "Reports" },
        ],
        finance: [
            { keys: ["profit", "keuntungan"], href: "/management/profitability", title: "Profitability" },
            { keys: ["cost", "biaya"], href: "/management/cost-breakdown", title: "Cost Breakdown" },
            { keys: ["liability", "tanggungan"], href: "/management/liability-monitor", title: "Liability Monitor" },
            { keys: ["resource", "request", "permintaan"], href: "/management/resources", title: "Resources" },
            { keys: ["report", "laporan"], href: "/management/reports", title: "Reports" },
        ]
    };

    const shortcuts = mapping[role] || [];
    for (const s of shortcuts) {
        if (s.keys.some(k => q.includes(k) || k.includes(q))) {
            res.push({
                id: `shortcut-${s.title}`,
                title: s.title,
                subtitle: `Jump to ${s.title}`,
                category: "shortcut",
                href: s.href
            });
        }
    }
    return res.slice(0, 2);
}

export function useSearchResults(query: string, role: Role) {
    const { data, isLoading } = useGlobalSearch(query);

    const results = useMemo(() => {
        const res: SearchResult[] = [];
        if (query.trim().length >= 2) {
            res.push(...getShortcuts(query, role));
        }

        if (!data) return res;

        for (const p of data.projects || []) {
            res.push({
                id: `p-${p.id}`,
                title: p.name,
                subtitle: p.status,
                category: "project",
                href: getProjectHref(role, p.id.toString()),
            });
        }

        for (const u of data.users || []) {
            res.push({
                id: `u-${u.id}`,
                title: u.full_name,
                subtitle: u.role,
                category: "user",
                href: `/admin/users?detailId=${u.id}`,
            });
        }

        for (const t of data.tasks || []) {
            res.push({
                id: `t-${t.id}`,
                title: t.title,
                subtitle: `${t.project_name} · ${t.status}`,
                category: "task",
                href: getTaskHref(role),
            });
        }

        for (const c of data.contracts || []) {
            res.push({
                id: `c-${c.id}`,
                title: c.user_full_name,
                subtitle: c.contract_type,
                category: "contract",
                href: `/admin/contracts?detailId=${c.id}`,
            });
        }

        for (const r of data.resource_requests || []) {
            res.push({
                id: `rr-${r.id}`,
                title: r.role,
                subtitle: `${r.project_name} · ${r.status}`,
                category: "resource_request",
                href: role === "admin" ? "/admin/resources" : (role === "projectmanager" ? "/pm/resources" : "/management/resources"),
            });
        }

        for (const ts of data.timesheets || []) {
            res.push({
                id: `ts-${ts.id}`,
                title: ts.description,
                subtitle: ts.status,
                category: "timesheet",
                href: role === "employee" ? "/employee/timesheet" : "/pm/approvals",
            });
        }

        for (const p of data.payroll || []) {
            res.push({
                id: `py-${p.id}`,
                title: p.user_full_name,
                subtitle: p.status,
                category: "payroll",
                href: "/admin/payroll",
            });
        }

        for (const a of data.audit_logs || []) {
            res.push({
                id: `al-${a.id}`,
                title: a.action,
                subtitle: a.entity,
                category: "audit_log",
                href: "/admin/audit-log",
            });
        }

        return res;
    }, [data, role, query]);

    return { results, isLoading };
}

export function SearchResults({ query, role, activeIndex, onSelect }: SearchResultsProps) {
    const { results, isLoading } = useSearchResults(query, role);
    const router = useRouter();

    const handleClick = useCallback(
        (href: string) => {
            router.push(href);
            onSelect();
        },
        [router, onSelect]
    );

    if (query.trim().length < 2) return null;

    const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
        (acc[r.category] ??= []).push(r);
        return acc;
    }, {});

    let flatIdx = 0;
    const categoriesOrder: SearchCategory[] = ["shortcut", "project", "user", "task", "contract", "resource_request", "timesheet", "payroll", "audit_log"];

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden"
            onMouseDown={(e) => e.preventDefault()}
        >
            {isLoading ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2568C1]" />
                    <span className="text-sm">Searching...</span>
                </div>
            ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <SearchX className="h-8 w-8 opacity-40" />
                    <span className="text-sm">No results for &quot;{query}&quot;</span>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                    {categoriesOrder.map((cat) => {
                        const items = grouped[cat];
                        if (!items?.length) return null;
                        const cfg = categoryConfig[cat];
                        const Icon = cfg.icon;

                        return (
                            <div key={cat}>
                                <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {cfg.label}
                                    </span>
                                </div>
                                {items.map((item) => {
                                    const idx = flatIdx++;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleClick(item.href)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer",
                                                idx === activeIndex
                                                    ? "bg-[#2568C1]/10 text-[#2568C1]"
                                                    : "hover:bg-[#f1f5f9]"
                                            )}
                                        >
                                            <span className={cn("flex items-center justify-center h-7 w-7 rounded-lg shrink-0", cfg.color)}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium truncate">{item.title}</div>
                                                <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="border-t border-border px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground bg-[#f8fafc]">
                <span><kbd className="px-1 py-0.5 rounded border bg-white text-[10px]">↑↓</kbd> Navigate</span>
                <span><kbd className="px-1 py-0.5 rounded border bg-white text-[10px]">↵</kbd> Open</span>
                <span><kbd className="px-1 py-0.5 rounded border bg-white text-[10px]">Esc</kbd> Close</span>
            </div>
        </motion.div>
    );
}
