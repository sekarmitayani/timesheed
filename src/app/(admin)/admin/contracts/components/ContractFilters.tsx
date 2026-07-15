"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface ContractFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    typeFilter: string;
    setTypeFilter: (v: string) => void;
    schemeFilter: string;
    setSchemeFilter: (v: string) => void;
    projectFilter: string;
    setProjectFilter: (v: string) => void;
    limit: number;
    setLimit: (v: number) => void;
    setPage: (v: number) => void;
    activeProjectsCtx: number[];
    allProjects: ApiProject[];
}

export function ContractFilters({
    search, setSearch,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    schemeFilter, setSchemeFilter,
    projectFilter, setProjectFilter,
    limit, setLimit,
    setPage,
    activeProjectsCtx,
    allProjects
}: ContractFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Employee..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[120px] bg-white shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[140px] bg-white shrink-0"><SelectValue placeholder="Contract Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="timesheet">Timesheet</SelectItem>
                        <SelectItem value="mandays">Mandays</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={schemeFilter} onValueChange={(v) => { setSchemeFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[150px] bg-white shrink-0"><SelectValue placeholder="Payment Scheme" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Schemes</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="termin">Termin</SelectItem>
                        <SelectItem value="back_to_back">Back-to-back</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[150px] bg-white shrink-0"><SelectValue placeholder="Projects" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        <SelectItem value="base">General/Base Rate</SelectItem>
                        {activeProjectsCtx.map(pid => {
                            const pName = allProjects.find(p => p.id === pid)?.name || `Project #${pid}`;
                            return (
                                <SelectItem key={pid} value={String(pid)}>{pName}</SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[80px] bg-white border-slate-200 shrink-0 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
