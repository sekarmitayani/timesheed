"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderKanban, Users, ListTodo, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockProjects, mockUsers, mockTasks } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: "project" | "user" | "task";
    href: string;
}

interface SearchResultsProps {
    query: string;
    role: Role;
    activeIndex: number;
    onSelect: () => void;
}

const categoryConfig = {
    project: { label: "Projects", icon: FolderKanban, color: "text-blue-600 bg-blue-50" },
    user: { label: "Users", icon: Users, color: "text-violet-600 bg-violet-50" },
    task: { label: "Tasks", icon: ListTodo, color: "text-amber-600 bg-amber-50" },
};

function getProjectHref(role: Role): string {
    if (role === "employee") return "/employee/dashboard";
    if (role === "projectmanager") return "/pm/projects";
    if (role === "admin") return "/admin/projects";
    return "/management/dashboard";
}

function getTaskHref(role: Role): string {
    if (role === "employee") return "/employee/tasks";
    if (role === "projectmanager") return "/pm/tasks";
    return "/admin/dashboard";
}

export function useSearchResults(query: string, role: Role): SearchResult[] {
    return useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];

        const results: SearchResult[] = [];

        // Search projects
        for (const p of mockProjects) {
            if (
                p.name.toLowerCase().includes(q) ||
                p.client.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            ) {
                results.push({
                    id: p.id,
                    title: p.name,
                    subtitle: `${p.client} · ${p.status}`,
                    category: "project",
                    href: getProjectHref(role),
                });
            }
        }

        // Search users (admin-only)
        if (role === "admin") {
            for (const u of mockUsers) {
                if (
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.department.toLowerCase().includes(q) ||
                    u.position.toLowerCase().includes(q)
                ) {
                    results.push({
                        id: u.id,
                        title: u.name,
                        subtitle: `${u.position} · ${u.department}`,
                        category: "user",
                        href: "/admin/users",
                    });
                }
            }
        }

        // Search tasks
        for (const t of mockTasks) {
            if (
                t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
            ) {
                const project = mockProjects.find((p) => p.id === t.projectId);
                results.push({
                    id: t.id,
                    title: t.title,
                    subtitle: `${project?.name ?? "Unknown"} · ${t.status} · ${t.priority}`,
                    category: "task",
                    href: getTaskHref(role),
                });
            }
        }

        return results.slice(0, 12); // cap at 12 results
    }, [query, role]);
}

export function SearchResults({ query, role, activeIndex, onSelect }: SearchResultsProps) {
    const results = useSearchResults(query, role);
    const router = useRouter();

    const handleClick = useCallback(
        (href: string) => {
            router.push(href);
            onSelect();
        },
        [router, onSelect]
    );

    if (query.trim().length < 2) return null;

    // Group by category
    const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
        (acc[r.category] ??= []).push(r);
        return acc;
    }, {});

    let flatIdx = 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden"
            onMouseDown={(e) => e.preventDefault()} // prevent blur
        >
            {results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <SearchX className="h-8 w-8 opacity-40" />
                    <span className="text-sm">No results for &quot;{query}&quot;</span>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                    {(["project", "user", "task"] as const).map((cat) => {
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
