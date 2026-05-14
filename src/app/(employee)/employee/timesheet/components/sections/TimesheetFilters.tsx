"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Calendar } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface TimesheetFiltersProps {
    filterType: string;
    setFilterType: (val: string) => void;
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
    filterType, setFilterType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    limit, setLimit,
    projects,
    resetFilters
}: TimesheetFiltersProps) {
    const hasActiveFilters = filterType !== "all" || dateFrom || dateTo || filterProject !== "all" || filterStatus !== "all";

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-1.5">
            <div className="flex flex-wrap items-center gap-3 w-full">
                {/* Frequency - Keep icon as it is date-related */}
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 focus-visible:ring-[#2568C1]">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Frequency" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="daily">Daily View</SelectItem>
                        <SelectItem value="weekly">Weekly View</SelectItem>
                        <SelectItem value="monthly">Monthly View</SelectItem>
                    </SelectContent>
                </Select>

                {/* Date Range - Keep text/range logic */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md h-10 px-2">
                    <Input 
                        type="date" 
                        className="h-8 w-[130px] text-[11px] border-none bg-transparent shadow-none px-1 focus-visible:ring-0" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span className="text-slate-300 text-[10px] font-bold uppercase">To</span>
                    <Input 
                        type="date" 
                        className="h-8 w-[130px] text-[11px] border-none bg-transparent shadow-none px-1 focus-visible:ring-0" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>

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

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters}
                        className="h-10 px-4 gap-2 text-slate-500 hover:text-[#2568C1] font-bold uppercase text-[10px] tracking-wider"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
