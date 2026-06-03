"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw } from "lucide-react";
import { ApiProject } from "@/lib/types";
import { CustomDateRangePicker } from "@/app/(pm)/pm/approvals/components/CustomDateRangePicker";

interface TimesheetFiltersProps {
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    filterProject: string;
    setFilterProject: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    limit: number;
    setLimit: (val: number) => void;
    projects: ApiProject[];
    resetFilters: () => void;
}

export function TimesheetFilters({
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    limit, setLimit,
    projects,
    resetFilters
}: TimesheetFiltersProps) {
    const hasActiveFilters = dateFrom || dateTo || filterProject !== "all" || filterStatus !== "all";

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-1.5">
            <div className="flex flex-wrap items-center gap-3 w-full">
                {/* Unified Date Range & Frequency Picker */}
                <CustomDateRangePicker 
                    dateFrom={dateFrom} 
                    dateTo={dateTo} 
                    onDateChange={(from, to) => {
                        setDateFrom(from);
                        setDateTo(to);
                    }} 
                />

                {/* Project Filter - Remove Icon */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 focus-visible:ring-[#2568C1]">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                {/* Status Filter - Remove Icon */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 focus-visible:ring-[#2568C1]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                {/* Limit - Remove Icon */}
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                    <SelectTrigger className="w-[70px] h-10 bg-white border-slate-200 focus-visible:ring-[#2568C1] text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map(v => (
                            <SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
